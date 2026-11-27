// Sends a one-off email campaign to Swapper users through the SendGrid Mail Send
// API (v3/mail/send), at a steady pace, from this laptop — no Marketing Campaigns
// package needed. One message per recipient.
//
//   npm run campaign -- <campaign> --dry-run                     counts, plan and a masked sample; sends nothing
//   npm run campaign -- <campaign> --test a@x.cz,b@y.cz          real send to these addresses only
//   npm run campaign -- <campaign> --daily-cap 25000 --yes       real send, paced, within today's cap
//
// `npm run campaign -- --help` lists every flag.
//
// Recipients come from the marketplace DB (DATABASE_URL), or from a file with
// --recipients. For production (Heroku app swapper-backend) pass the URL inline,
// so it is never written to a file:
//   DATABASE_URL="$(heroku config:get DATABASE_URL -a swapper-backend)" DATABASE_SSL=1 npm run campaign -- …
//
// A campaign is scripts/campaigns/<campaign>.mjs (config) plus its plain-text
// body and an exported React Email template in out/. To add one:
//   1. emails/<campaign>.tsx                 the HTML template (`npm run export` renders it to out/)
//   2. scripts/campaigns/<campaign>.txt      the plain-text part; every line must also be in the HTML
//   3. scripts/campaigns/<campaign>.mjs      subject, files, attachments, audience (copy an existing one)
// The campaign name is also the SendGrid category and the name of its state files,
// so never reuse it for a different email.
//
// Safety model
//   - The marketplace DB is read in ONE read-only transaction on a session pinned
//     `default_transaction_read_only`. Nothing is ever written to it.
//   - Before each request a "pending" attempt is written; after SendGrid answers
//     2xx the address goes to the sent file. An address whose last attempt is
//     pending or uncertain (crash, Ctrl-C, network error, 5xx) is held back on
//     later runs until you check the SendGrid Activity feed and pass
//     --retry-uncertain. So no run can send twice to the same address.
//   - A definite rejection (4xx) is retried on later runs, at most 3 attempts.
//   - A lock file (with the pid) stops two runs of one campaign at the same time.
//
// Pacing (so mailbox providers see no burst and SendGrid limits are not hit)
//   - Steady rate: one message at a time, --per-hour per hour, with random ±30 %
//     gaps. A new run also waits out the gap after the last message of an earlier run.
//   - Domain mix: recipients are interleaved by domain (gmail, seznam, …), so no
//     provider gets many messages in a row.
//   - Daily cap: --daily-cap counts every campaign and test message sent today
//     (Prague time) across all runs. The backend's order emails use the same
//     SendGrid quota, so leave room for them.
//   - Optional warm-up (--warmup): the campaign's first sending day allows
//     --warmup-start messages, each later sending day doubles it, up to --daily-cap.
//
// Environment (.env is read by the npm script)
//   SENDGRID_MAIL_API_KEY   key with the `mail.send` scope (falls back to SENDGRID_API_KEY)
//   DATABASE_URL            marketplace Postgres (read-only access is enough; not a pgbouncer URL)
//   DATABASE_SSL=1          use TLS without CA verification (Heroku Postgres needs it)
//   ASSET_BASE_URL          default https://www.swapper.cz (fonts and images in the HTML)

import client from '@sendgrid/client';
import pg from 'pg';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, unlinkSync, writeSync } from 'node:fs';
import { appendFile, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { rewriteAssets } from './lib/assets.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const campaignsDir = fileURLToPath(new URL('./campaigns/', import.meta.url));
const stateDir = fileURLToPath(new URL('./.state/', import.meta.url));
const outDir = resolve(repoRoot, 'out');

const DEFAULT_SENDER = {
    email: 'info@updates.swapper.cz',
    name: 'Swapper',
    replyTo: 'info@swapper.cz',
};
const MAX_REJECTED_ATTEMPTS = 3;
const MAX_429_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 30_000;

// Named recipient lists. Each query returns one `email` column and runs read-only.
const AUDIENCES = {
    // Every registered user. The backend hard-deletes the `users` row of a deleted
    // account (DeleteUserJob, one month after the request), so every row that
    // exists is a registered user. For legal and service notices only.
    'all-users': {
        sql: 'SELECT email FROM users WHERE email IS NOT NULL ORDER BY created_at ASC NULLS LAST, id ASC',
    },
    // Users who opted in to the newsletter. Marketing, so it needs an unsubscribe group.
    newsletter: {
        sql: 'SELECT email FROM users WHERE email IS NOT NULL AND newsletter = true ORDER BY created_at ASC NULLS LAST, id ASC',
        needsUnsubscribeGroup: true,
    },
};

const fail = (message) => {
    console.error(`✗ ${message}`);
    process.exit(1);
};

// ---------------------------------------------------------------- arguments

const VALUE_FLAGS = new Set([
    '--test',
    '--recipients',
    '--limit',
    '--per-hour',
    '--daily-cap',
    '--warmup-start',
    '--max-errors',
]);
const BOOLEAN_FLAGS = new Set(['--dry-run', '--yes', '--sandbox', '--retry-uncertain', '--warmup', '--help']);

const parseArgs = (argv) => {
    const values = {};
    const flags = new Set();
    const positional = [];
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg.startsWith('--')) {
            positional.push(arg);
            continue;
        }
        const eq = arg.indexOf('=');
        const name = eq > 0 ? arg.slice(0, eq) : arg;
        if (VALUE_FLAGS.has(name)) {
            const value = eq > 0 ? arg.slice(eq + 1) : argv[i + 1];
            if (value === undefined || (eq < 0 && value.startsWith('--'))) fail(`${name} needs a value.`);
            values[name] = value;
            if (eq < 0) i += 1;
        } else if (BOOLEAN_FLAGS.has(name) && eq < 0) {
            flags.add(name);
        } else {
            fail(`Unknown option ${arg}. Run with --help.`);
        }
    }
    return { values, flags, positional };
};

const { values, flags, positional } = parseArgs(process.argv.slice(2));

const readInt = (name, { min = 0 } = {}) => {
    const raw = values[name];
    if (raw === undefined) return undefined;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < min) fail(`${name} must be an integer ≥ ${min} (got "${raw}").`);
    return value;
};

const listCampaigns = () =>
    existsSync(campaignsDir)
        ? readdirSync(campaignsDir)
              .filter((file) => file.endsWith('.mjs'))
              .map((file) => basename(file, '.mjs'))
        : [];
const campaignList = () => listCampaigns().join(', ') || '(none in scripts/campaigns/)';

if (flags.has('--help')) {
    console.log(`
Usage: npm run campaign -- <campaign> [mode] [options]

Campaigns: ${campaignList()}

Modes (pick one):
  --dry-run                 Read the recipients, print counts, the plan and a masked sample. Sends nothing.
  --test <a@x.cz,b@y.cz>    Real send to these addresses only (max 10). No DB. Counts toward the daily cap.
  (none) + --yes            Real send to remaining users. Without --yes it only prints the plan.

Recipients:
  (default)                 The campaign's audience from the DB in DATABASE_URL. For production:
                            DATABASE_URL="$(heroku config:get DATABASE_URL -a swapper-backend)" DATABASE_SSL=1 npm run campaign -- …
  --recipients <file>       Read the addresses from a file instead: one per line, or a CSV whose first
                            column is the email (a header row is skipped).

Options:
  --daily-cap <n>           Required for a real send. Max messages per day across all campaigns, runs and
                            test sends (Prague time). Use your SendGrid plan's limit minus room for the
                            backend's order and ticket emails, which use the same quota.
  --per-hour <n>            Sending rate (default 1500, i.e. one message every ~2.4 s, ±30 % random).
  --warmup                  Ramp up: the campaign's first sending day allows --warmup-start messages
                            (default 2000), each later sending day doubles it, up to --daily-cap.
  --limit <n>               Max messages this run (default: what today's cap still allows).
  --max-errors <n>          Stop after n failures in a row (default 3).
  --retry-uncertain         Also send to addresses whose last attempt is pending or uncertain. Check the
                            SendGrid Activity feed first: SendGrid may have accepted them.
  --sandbox                 SendGrid sandbox mode: the API validates the request but delivers nothing and
                            nothing is recorded.

State files (gitignored), in scripts/.state/:
  <campaign>.sent.jsonl       accepted messages
  <campaign>.attempts.jsonl   pending, uncertain and rejected attempts
  <campaign>.test.jsonl       test sends (count toward the daily cap only)
`);
    process.exit(0);
}

const campaignId = positional[0];
if (!campaignId) fail(`Name a campaign: ${campaignList()}. Run with --help.`);
if (positional.length > 1) fail(`Unexpected argument "${positional[1]}". Test addresses go after --test.`);
if (!/^[a-z0-9][a-z0-9-]*$/.test(campaignId)) fail(`Campaign name "${campaignId}" may contain only a-z, 0-9 and "-".`);

const testArg = values['--test'];
if (flags.has('--dry-run') && testArg !== undefined) fail('Use --dry-run or --test, not both.');
const mode = flags.has('--dry-run') ? 'dry-run' : testArg !== undefined ? 'test' : 'send';
const confirmed = flags.has('--yes');
const sandbox = flags.has('--sandbox');
const retryUncertain = flags.has('--retry-uncertain');
const runLimit = readInt('--limit', { min: 1 });
const maxErrors = readInt('--max-errors', { min: 1 }) ?? 3;
const recipientsFile = values['--recipients'];

const pacing = {
    perHour: readInt('--per-hour', { min: 1 }) ?? 1500,
    dailyCap: readInt('--daily-cap', { min: 1 }),
    warmup: flags.has('--warmup'),
    warmupStart: readInt('--warmup-start', { min: 1 }) ?? 2000,
};
const intervalMs = 3_600_000 / pacing.perHour;
if (mode === 'send' && confirmed && pacing.dailyCap === undefined) {
    fail("A real send needs --daily-cap: your SendGrid limit minus room for the backend's order emails.");
}

const statePaths = {
    sent: `${stateDir}${campaignId}.sent.jsonl`,
    attempts: `${stateDir}${campaignId}.attempts.jsonl`,
    test: `${stateDir}${campaignId}.test.jsonl`,
    lock: `${stateDir}${campaignId}.lock`,
};

// ---------------------------------------------------------------- helpers

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const normalizeEmail = (email) => email.trim().toLowerCase();

let stopRequested = false;

// Sleeps in 1 s steps, so a stop request (Ctrl-C) ends the wait quickly.
const pause = async (ms) => {
    const until = Date.now() + ms;
    while (Date.now() < until && !stopRequested) await sleep(Math.min(1000, until - Date.now()));
};

const EMAIL_PATTERN =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
// Reserved / non-deliverable domains (RFC 2606, RFC 6761) and placeholder addresses.
const RESERVED_DOMAIN = /(^|\.)(example\.(com|net|org)|example|test|invalid|localhost|local)$/;

// Returns 'malformed', 'reserved' or null.
const invalidReason = (email) => {
    if (!EMAIL_PATTERN.test(email) || email.includes('..') || email.length > 254) return 'malformed';
    if (RESERVED_DOMAIN.test(email.split('@')[1])) return 'reserved';
    return null;
};

const mask = (email) => {
    const [local, domain = ''] = email.split('@');
    const dot = domain.lastIndexOf('.');
    const host = dot > 0 ? domain.slice(0, dot) : domain;
    const tld = dot > 0 ? domain.slice(dot) : '';
    return `${local.slice(0, 1)}***@${host.slice(0, 1)}***${tld}`;
};

// A crash can leave the last line half-written; that line is skipped with a warning.
// Any other broken line stops the run, because the file can no longer be trusted.
const readJsonl = (path) => {
    if (!existsSync(path)) return [];
    const lines = readFileSync(path, 'utf8')
        .split('\n')
        .filter((line) => line.trim().length > 0);
    const records = [];
    lines.forEach((line, index) => {
        try {
            records.push(JSON.parse(line));
        } catch {
            if (index === lines.length - 1) {
                console.log(`  ⚠ ${path}: the last line is incomplete (a crash?) and is skipped.`);
            } else {
                fail(`${path} line ${index + 1} is not valid JSON. Fix it by hand before you continue.`);
            }
        }
    });
    return records;
};

const appendJsonl = (path, record) => appendFile(path, `${JSON.stringify(record)}\n`);

const errorDetail = (err) => {
    const body = err?.response?.body;
    if (body?.errors) return body.errors.map((e) => e.message).join('; ');
    return String(err?.message ?? err);
};

// Calendar day in Prague, e.g. 2026-11-25.
const pragueDay = (date) => new Date(date).toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });
const addDays = (day, count) => {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
};

// Round-robin across recipient domains, largest domain first, keeping the source
// order inside each domain. Spreads gmail.com, seznam.cz, … evenly through the send.
const interleaveByDomain = (emails) => {
    const byDomain = new Map();
    for (const email of emails) {
        const domain = email.split('@')[1];
        if (!byDomain.has(domain)) byDomain.set(domain, []);
        byDomain.get(domain).push(email);
    }
    const queues = [...byDomain.values()].sort((a, b) => b.length - a.length);
    const result = [];
    for (let round = 0; result.length < emails.length; round += 1) {
        for (const queue of queues) if (round < queue.length) result.push(queue[round]);
    }
    return result;
};

// HTML reduced to its visible text, for the check that the plain-text part matches it.
const visibleText = (html) =>
    html
        .replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, '')
        // Inline tags join text ("na <a>info@…</a>, nebo"); block tags separate it.
        .replace(/<\/?(a|b|strong|em|i|span|u)\b[^>]*>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&#xa0;|&#160;/gi, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ');

// ---------------------------------------------------------------- campaign

const loadCampaign = async () => {
    const configPath = resolve(campaignsDir, `${campaignId}.mjs`);
    if (!existsSync(configPath)) fail(`No campaign "${campaignId}". Campaigns: ${campaignList()}.`);
    const { default: config } = await import(pathToFileURL(configPath).href);
    const problems = [];
    if (typeof config?.subject !== 'string' || !config.subject.trim()) problems.push('subject');
    if (typeof config?.html !== 'string') problems.push('html');
    if (typeof config?.text !== 'string') problems.push('text');
    if (!AUDIENCES[config?.audience]) problems.push(`audience (one of: ${Object.keys(AUDIENCES).join(', ')})`);
    if (config?.attachments !== undefined && !Array.isArray(config.attachments)) problems.push('attachments');
    if (config?.deadline !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(config.deadline))
        problems.push('deadline (YYYY-MM-DD)');
    if (problems.length) fail(`${configPath}: missing or invalid ${problems.join(', ')}.`);
    if (AUDIENCES[config.audience].needsUnsubscribeGroup && !Number.isInteger(config.unsubscribeGroupId)) {
        fail(`${configPath}: audience "${config.audience}" needs unsubscribeGroupId (a SendGrid unsubscribe group).`);
    }

    const htmlPath = resolve(outDir, config.html);
    if (!existsSync(htmlPath)) fail(`${htmlPath} is missing. Run \`npm run export\` first.`);
    const html = rewriteAssets(await readFile(htmlPath, 'utf8'));

    const textPath = resolve(campaignsDir, config.text);
    if (!existsSync(textPath)) fail(`${textPath} is missing.`);
    const text = await readFile(textPath, 'utf8');
    if (!text.trim()) fail(`${textPath} is empty.`);
    const htmlText = visibleText(html);
    const missingLines = text
        .split('\n')
        .map((line) =>
            line
                .replace(/^\s*[-•]\s+/, '')
                .replace(/\s+/g, ' ')
                .trim(),
        )
        .filter((line) => line && !htmlText.includes(line));
    if (missingLines.length) {
        fail(
            `The HTML and the plain text say different things. Not in ${htmlPath}:\n` +
                missingLines.map((line) => `    "${line.slice(0, 100)}"`).join('\n') +
                '\n  Edit the template or the .txt file, then run `npm run export`.',
        );
    }

    const attachments = [];
    for (const attachment of config.attachments ?? []) {
        if (!attachment?.path || !attachment?.filename || !attachment?.type) {
            fail(`${configPath}: each attachment needs path, filename and type.`);
        }
        const path = resolve(repoRoot, attachment.path);
        if (!existsSync(path)) fail(`${path} is missing.`);
        const bytes = await readFile(path);
        if (attachment.type === 'application/pdf' && bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
            fail(`${path} is not a PDF.`);
        }
        attachments.push({
            filename: attachment.filename,
            type: attachment.type,
            size: bytes.length,
            content: bytes.toString('base64'),
        });
    }

    return {
        id: campaignId,
        subject: config.subject,
        html,
        text,
        attachments,
        audience: config.audience,
        tracking: config.tracking !== false,
        unsubscribeGroupId: config.unsubscribeGroupId,
        deadline: config.deadline,
        sender: { ...DEFAULT_SENDER, ...config.sender },
    };
};

// ---------------------------------------------------------------- recipients

const readEmailsFromDb = async (audience) => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) fail('DATABASE_URL is not set (or pass --recipients <file>). Run with --help.');
    const db = new pg.Client({
        connectionString,
        ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : undefined,
        // Belt and braces: the whole session is read-only, not just the transaction.
        options: '-c default_transaction_read_only=on -c statement_timeout=60000',
        application_name: `swapper-emails/${campaignId}`,
    });
    try {
        await db.connect();
    } catch (err) {
        // pg error messages do not contain the password, but keep it short anyway.
        fail(`Cannot connect to the database: ${err.code ?? ''} ${err.message}`.trim());
    }
    try {
        await db.query('BEGIN TRANSACTION READ ONLY');
        const { rows } = await db.query(AUDIENCES[audience].sql);
        await db.query('COMMIT');
        return rows.map((row) => row.email);
    } finally {
        await db.end();
    }
};

// One address per line, or a CSV whose first column is the email. A header row is skipped.
const readEmailsFromFile = (path) => {
    const fullPath = resolve(process.cwd(), path);
    if (!existsSync(fullPath)) fail(`${fullPath} is missing.`);
    return readFileSync(fullPath, 'utf8')
        .split(/\r?\n/)
        .map((line) =>
            line
                .split(/[,;\t]/)[0]
                .replace(/^"|"$/g, '')
                .trim(),
        )
        .filter((value, index) => value && !(index === 0 && !value.includes('@')));
};

const loadRecipients = async (audience) => {
    const emails = recipientsFile ? readEmailsFromFile(recipientsFile) : await readEmailsFromDb(audience);
    const seen = new Set();
    const recipients = [];
    const excluded = { malformed: [], reserved: [], duplicate: [] };
    for (const raw of emails) {
        const email = normalizeEmail(raw);
        const reason = invalidReason(email) ?? (seen.has(email) ? 'duplicate' : null);
        if (reason) {
            excluded[reason].push(email);
            continue;
        }
        seen.add(email);
        recipients.push(email);
    }
    return { total: emails.length, recipients, excluded };
};

// ---------------------------------------------------------------- state

// Every message counts toward the SendGrid quota, so the daily cap looks at all
// campaigns and test sends. The warm-up looks at this campaign only.
const readAllSends = () =>
    existsSync(stateDir)
        ? readdirSync(stateDir)
              .filter((file) => file.endsWith('.sent.jsonl') || file.endsWith('.test.jsonl'))
              .flatMap((file) =>
                  readJsonl(`${stateDir}${file}`).map((record) => ({
                      ...record,
                      file,
                  })),
              )
        : [];

const capForDay = (sendingDay) =>
    pacing.warmup ? Math.min(pacing.dailyCap, pacing.warmupStart * 2 ** (sendingDay - 1)) : pacing.dailyCap;

const todayAllowance = (allSends) => {
    const today = pragueDay(Date.now());
    const sentToday = allSends.filter((record) => pragueDay(record.sentAt) === today).length;
    const earlierDays = new Set(
        allSends
            .filter((record) => record.file === `${campaignId}.sent.jsonl`)
            .map((record) => pragueDay(record.sentAt))
            .filter((day) => day < today),
    );
    const sendingDay = earlierDays.size + 1;
    const cap = capForDay(sendingDay);
    return {
        today,
        sendingDay,
        cap,
        sentToday,
        left: Math.max(0, cap - sentToday),
    };
};

// Splits the recipients by the state files: what is done, held back, given up, and still to send.
const classify = (recipients, sentRecords, attemptRecords) => {
    const sent = new Set(sentRecords.map((record) => normalizeEmail(record.email)));
    const lastAttempt = new Map();
    const rejections = new Map();
    for (const record of attemptRecords) {
        const email = normalizeEmail(record.email);
        lastAttempt.set(email, record);
        if (record.state === 'rejected') rejections.set(email, (rejections.get(email) ?? 0) + 1);
    }
    const groups = { sent: [], uncertain: [], givenUp: [], toSend: [] };
    for (const email of recipients) {
        const last = lastAttempt.get(email);
        if (sent.has(email)) groups.sent.push(email);
        else if (last && last.state !== 'rejected' && !retryUncertain) groups.uncertain.push(email);
        else if ((rejections.get(email) ?? 0) >= MAX_REJECTED_ATTEMPTS) groups.givenUp.push(email);
        else groups.toSend.push(email);
    }
    const recipientSet = new Set(recipients);
    const sentNotInAudience = [...sent].filter((email) => !recipientSet.has(email)).length;
    return { ...groups, sentNotInAudience };
};

const acquireLock = () => {
    mkdirSync(stateDir, { recursive: true });
    for (let tries = 0; tries < 2; tries += 1) {
        try {
            const fd = openSync(statePaths.lock, 'wx');
            writeSync(
                fd,
                JSON.stringify({
                    pid: process.pid,
                    startedAt: new Date().toISOString(),
                }),
            );
            closeSync(fd);
            process.on('exit', () => {
                try {
                    unlinkSync(statePaths.lock);
                } catch {}
            });
            return;
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
            let pid;
            try {
                pid = JSON.parse(readFileSync(statePaths.lock, 'utf8')).pid;
            } catch {}
            let alive = false;
            if (Number.isInteger(pid)) {
                try {
                    process.kill(pid, 0);
                    alive = true;
                } catch (killErr) {
                    alive = killErr.code === 'EPERM';
                }
            }
            if (alive || tries > 0) fail(`${statePaths.lock}: another run (pid ${pid ?? '?'}) is active.`);
            console.log(`  ⚠ Removing a stale lock from a run that ended without cleaning up (pid ${pid ?? '?'}).`);
            unlinkSync(statePaths.lock);
        }
    }
};

// First signal: stop after the current message. Second: quit now — the pending
// attempt is already on disk, so that address is held back, not sent twice.
const handleStopSignals = () => {
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
        process.on(signal, () => {
            if (stopRequested) process.exit(130);
            stopRequested = true;
            console.log(`\n  ↳ ${signal}: stopping after the current message (send it again to quit now).`);
        });
    }
};

// ---------------------------------------------------------------- sending

const buildMessage = (to, campaign) => ({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: campaign.sender.email, name: campaign.sender.name },
    reply_to: { email: campaign.sender.replyTo },
    subject: campaign.subject,
    content: [
        { type: 'text/plain', value: campaign.text },
        { type: 'text/html', value: campaign.html },
    ],
    ...(campaign.attachments.length
        ? {
              attachments: campaign.attachments.map(({ content, filename, type }) => ({
                  content,
                  filename,
                  type,
                  disposition: 'attachment',
              })),
          }
        : {}),
    categories: [campaign.id],
    custom_args: { campaign: campaign.id },
    ...(campaign.unsubscribeGroupId ? { asm: { group_id: campaign.unsubscribeGroupId } } : {}),
    ...(campaign.tracking
        ? {}
        : {
              // No tracking pixel, plain links, no injected unsubscribe footer, no UTM tags.
              tracking_settings: {
                  open_tracking: { enable: false },
                  click_tracking: { enable: false, enable_text: false },
                  subscription_tracking: { enable: false },
                  ganalytics: { enable: false },
              },
          }),
    ...(sandbox ? { mail_settings: { sandbox_mode: { enable: true } } } : {}),
});

// Returns { ok: true, messageId } or { ok: false, status, error, uncertain, fatal }.
const sendOne = async (to, campaign) => {
    const body = buildMessage(to, campaign);
    for (let attempt = 0; ; attempt += 1) {
        try {
            const [response] = await client.request({
                method: 'POST',
                url: '/v3/mail/send',
                body,
            });
            return { ok: true, messageId: response.headers['x-message-id'] ?? null };
        } catch (err) {
            const status = err?.code ?? err?.response?.statusCode;
            const httpStatus = Number.isInteger(status) ? status : undefined;
            if (httpStatus === 429 && attempt < MAX_429_RETRIES && !stopRequested) {
                // 429 means SendGrid did not accept the message: safe to retry.
                const reset = Number(err?.response?.headers?.['x-ratelimit-reset']);
                const waitMs =
                    Number.isFinite(reset) && reset > 0
                        ? Math.max(1000, reset * 1000 - Date.now() + 1000)
                        : 5000 * 2 ** attempt;
                console.log(
                    `    … 429 rate limited, waiting ${Math.round(waitMs / 1000)} s (retry ${attempt + 1}/${MAX_429_RETRIES})`,
                );
                await pause(Math.min(waitMs, 15 * 60 * 1000));
                continue;
            }
            const definite = httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500;
            return {
                ok: false,
                status: httpStatus ?? null,
                error: errorDetail(err),
                // Network errors, timeouts and 5xx: SendGrid may have accepted it.
                uncertain: !definite,
                // Bad key, missing scope, unverified sender, payload too large, quota used up: stop at once.
                fatal: [401, 403, 413, 429].includes(httpStatus),
            };
        }
    }
};

// `record`: where to log results — { sentPath, attemptsPath } for a campaign run,
// { sentPath } for test sends, or null for sandbox. `display` formats an address for the log.
const runSends = async (addresses, campaign, { record, display, firstWaitMs = 0, day = null }) => {
    let sent = 0;
    let failed = 0;
    let consecutiveErrors = 0;
    let stopReason = null;
    const startedAt = Date.now();

    if (firstWaitMs > 0) {
        console.log(`  … waiting ${Math.ceil(firstWaitMs / 1000)} s after the last message of an earlier run`);
        await pause(firstWaitMs);
    }

    for (let i = 0; i < addresses.length; i += 1) {
        if (stopRequested) {
            stopReason = 'interrupted';
            break;
        }
        if (day && pragueDay(Date.now()) !== day) {
            stopReason = 'a new day started — run again to use the new daily cap';
            break;
        }
        const to = addresses[i];
        if (record?.attemptsPath)
            await appendJsonl(record.attemptsPath, {
                email: to,
                at: new Date().toISOString(),
                state: 'pending',
            });
        const result = await sendOne(to, campaign);
        const at = new Date().toISOString();
        const progress = `[${i + 1}/${addresses.length}]`;
        if (result.ok) {
            sent += 1;
            consecutiveErrors = 0;
            if (record?.sentPath)
                await appendJsonl(record.sentPath, {
                    email: to,
                    sentAt: at,
                    messageId: result.messageId,
                    from: campaign.sender.email,
                });
            // Every message in a short run, then one line per 100 so a 30k send stays readable.
            if (addresses.length <= 200 || sent % 100 === 0 || i + 1 === addresses.length) {
                const elapsedMin = Math.round((Date.now() - startedAt) / 60_000);
                console.log(
                    `  ${progress} ✔ ${display(to)} ${result.messageId ?? ''}${sandbox ? ' (sandbox)' : ''} · ${elapsedMin} min`,
                );
            }
        } else {
            failed += 1;
            consecutiveErrors += 1;
            if (record?.attemptsPath) {
                await appendJsonl(record.attemptsPath, {
                    email: to,
                    at,
                    state: result.uncertain ? 'uncertain' : 'rejected',
                    status: result.status,
                    error: result.error,
                });
            }
            console.log(
                `  ${progress} ✗ ${display(to)} ${result.status ?? 'network'} ${result.error}${result.uncertain ? ' (uncertain — held back on later runs)' : ''}`,
            );
            if (result.fatal) stopReason = `fatal error ${result.status}`;
            else if (result.uncertain) stopReason = 'uncertain result (network error, timeout or 5xx)';
            else if (consecutiveErrors >= maxErrors) stopReason = `${consecutiveErrors} errors in a row`;
            if (stopReason) break;
        }
        if (i + 1 < addresses.length) await pause(intervalMs * (0.7 + Math.random() * 0.6));
    }
    return { sent, failed, stopReason };
};

const initSendGrid = async () => {
    const keyName = process.env.SENDGRID_MAIL_API_KEY ? 'SENDGRID_MAIL_API_KEY' : 'SENDGRID_API_KEY';
    const apiKey = process.env[keyName];
    if (!apiKey) fail('SENDGRID_MAIL_API_KEY (or SENDGRID_API_KEY) is not set.');
    client.setApiKey(apiKey);
    // A hung connection becomes a network error (uncertain) instead of a run that never ends.
    client.setDefaultRequest('timeout', REQUEST_TIMEOUT_MS);

    // Check the key's scopes before the first message, so a key that cannot send
    // fails here with a clear message. If the check itself fails, the send decides.
    let scopes;
    try {
        const [, body] = await client.request({ method: 'GET', url: '/v3/scopes' });
        scopes = body?.scopes;
    } catch {}
    if (Array.isArray(scopes) && !scopes.includes('mail.send')) {
        fail(
            `The key in ${keyName} cannot send email (no "mail.send" scope). In SendGrid → Settings → API Keys, ` +
                'give it "Mail Send" access, or make a new key with it and put it in SENDGRID_MAIL_API_KEY in .env.',
        );
    }
};

// ---------------------------------------------------------------- report

const pad = (label) => `  ${label}`.padEnd(27);

const printConfig = (campaign) => {
    const { sender } = campaign;
    console.log(`  From:       ${sender.name} <${sender.email}>`);
    console.log(`  Reply-To:   ${sender.replyTo}`);
    console.log(`  Subject:    ${campaign.subject}`);
    console.log(`  Recipients: ${recipientsFile ? `file ${recipientsFile}` : `audience ${campaign.audience} (DB)`}`);
    for (const attachment of campaign.attachments) {
        console.log(`  Attachment: ${attachment.filename} (${Math.round(attachment.size / 1024)} KB)`);
    }
    console.log(
        `  Tracking:   ${campaign.tracking ? 'account defaults' : 'off (no open or click tracking, no unsubscribe footer)'}`,
    );
    console.log(
        `  Pacing:     ${pacing.perHour}/hour (±30 % random gaps), daily cap ${pacing.dailyCap ?? 'not set'}` +
            `${pacing.warmup ? `, warm-up from ${pacing.warmupStart}/day doubling` : ''}, domains interleaved`,
    );
    if (!sender.email.endsWith('@updates.swapper.cz')) {
        console.log(
            `  ⚠ From address is not on updates.swapper.cz — make sure its domain is authenticated in SendGrid.`,
        );
    }
};

// Days needed for `count` messages from today on, and the last of those days.
const sendingPlan = (count, allowance) => {
    const perDay = (cap) => Math.min(cap, pacing.perHour * 24);
    let left = count - perDay(allowance.left);
    let days = 1;
    while (left > 0) {
        left -= perDay(capForDay(allowance.sendingDay + days));
        days += 1;
    }
    return { days, lastDay: addDays(allowance.today, days - 1) };
};

const printDeadline = (campaign, plan, toSendCount, allowance) => {
    if (!campaign.deadline) return;
    if (plan.lastDay <= campaign.deadline) {
        console.log(`${pad('Deadline:')}${campaign.deadline} — on track (last sending day ${plan.lastDay})`);
        return;
    }
    const daysLeft = Math.max(
        1,
        Math.round((new Date(campaign.deadline) - new Date(allowance.today)) / 86_400_000) + 1,
    );
    const perDay = Math.ceil(toSendCount / daysLeft);
    console.log(
        `${pad('Deadline:')}⚠ ${campaign.deadline} is NOT met — the last sending day would be ${plan.lastDay}. ` +
            `You need ~${perDay}/day: raise --daily-cap${pacing.warmup ? ', drop --warmup' : ''}` +
            `${perDay > pacing.perHour * 24 ? `, and raise --per-hour to at least ${Math.ceil(perDay / 24)}` : ''}.`,
    );
};

// ---------------------------------------------------------------- main

const runTest = async (campaign) => {
    const addresses = [...new Set(testArg.split(',').map(normalizeEmail).filter(Boolean))];
    if (addresses.length === 0) fail('--test needs a comma-separated list of addresses.');
    if (addresses.length > 10) fail('--test takes at most 10 addresses.');
    const bad = addresses.filter((email) => invalidReason(email));
    if (bad.length > 0) fail(`Invalid test address(es): ${bad.join(', ')}`);
    console.log(`Test send of ${campaign.id}${sandbox ? ' (sandbox)' : ''} — the campaign state is not touched.\n`);
    printConfig(campaign);
    console.log(`  To:         ${addresses.join(', ')}\n`);
    await initSendGrid();
    handleStopSignals();
    if (!sandbox) mkdirSync(stateDir, { recursive: true });
    const result = await runSends(addresses, campaign, {
        record: sandbox ? null : { sentPath: statePaths.test },
        display: (email) => email,
    });
    console.log(
        `\nDone: ${result.sent} sent, ${result.failed} failed${result.stopReason ? ` — stopped: ${result.stopReason}` : ''}.`,
    );
    process.exitCode = result.failed > 0 ? 1 : 0;
};

const run = async () => {
    const campaign = await loadCampaign();
    if (mode === 'test') return runTest(campaign);

    // Take the lock before reading the state, so two runs cannot pick the same addresses.
    if (mode === 'send' && confirmed) {
        acquireLock();
        handleStopSignals();
    }

    if (pacing.dailyCap === undefined) {
        pacing.dailyCap = pacing.perHour * 24;
        console.log(
            `  (no --daily-cap given: the plan below assumes ${pacing.dailyCap}/day, the --per-hour rate for 24 h)\n`,
        );
    }

    const { total, recipients, excluded } = await loadRecipients(campaign.audience);
    const allSends = readAllSends();
    const sentRecords = allSends.filter((record) => record.file === `${campaignId}.sent.jsonl`);
    const groups = classify(recipients, sentRecords, readJsonl(statePaths.attempts));
    const toSend = interleaveByDomain(groups.toSend);
    const allowance = todayAllowance(allSends);
    const thisRun = toSend.slice(0, Math.min(runLimit ?? Infinity, allowance.left));
    const sample = (list) => (list.length ? ` (${list.slice(0, 5).map(mask).join(', ')})` : '');

    console.log(
        `${campaign.id} — ${mode === 'dry-run' ? 'DRY RUN (nothing is sent or written)' : sandbox ? 'SANDBOX send' : 'REAL send'}\n`,
    );
    printConfig(campaign);
    console.log('');
    console.log(`${pad('Addresses read:')}${total}`);
    console.log(`${pad('Excluded, malformed:')}${excluded.malformed.length}${sample(excluded.malformed)}`);
    console.log(`${pad('Excluded, reserved dom.:')}${excluded.reserved.length}${sample(excluded.reserved)}`);
    console.log(`${pad('Excluded, duplicates:')}${excluded.duplicate.length}`);
    console.log(`${pad('Recipients:')}${recipients.length}`);
    console.log(
        `${pad('Already sent:')}${groups.sent.length}${groups.sentNotInAudience ? ` (+${groups.sentNotInAudience} in state file, not in this list)` : ''}`,
    );
    console.log(
        `${pad('Held back (uncertain):')}${groups.uncertain.length}${groups.uncertain.length ? ' — check SendGrid Activity, then use --retry-uncertain' : ''}`,
    );
    console.log(
        `${pad(`Given up (${MAX_REJECTED_ATTEMPTS}× rejected):`)}${groups.givenUp.length}${sample(groups.givenUp)}`,
    );
    console.log(`${pad('Remaining:')}${toSend.length}`);
    console.log(
        `${pad('Today:')}cap ${allowance.cap}${allowance.cap < pacing.dailyCap ? ` (warm-up day ${allowance.sendingDay})` : ''}, ` +
            `${allowance.sentToday} sent today (all campaigns and tests), ${allowance.left} left`,
    );
    console.log(`${pad('This run:')}${thisRun.length}${runLimit ? ` (--limit ${runLimit})` : ''}`);
    if (thisRun.length > 0) console.log(`${pad('First addresses:')}${thisRun.slice(0, 5).map(mask).join(', ')}`);
    if (toSend.length > 0) {
        const plan = sendingPlan(toSend.length, allowance);
        const hours = (thisRun.length / pacing.perHour).toFixed(1);
        console.log(`${pad('Estimate:')}~${hours} h for this run; ${plan.days} sending day(s) for all remaining`);
        printDeadline(campaign, plan, toSend.length, allowance);
    }

    if (mode === 'dry-run') {
        console.log('\nDry run: nothing sent, state file not written.');
        return;
    }
    if (thisRun.length === 0) {
        console.log(
            toSend.length ? `\nToday's cap (${allowance.cap}) is used up. Run again tomorrow.` : '\nNothing to send.',
        );
        return;
    }
    if (!confirmed) {
        console.log(`\nThis is a real send to ${thisRun.length} users. Add --daily-cap <n> --yes to go ahead.`);
        process.exitCode = 1;
        return;
    }

    await initSendGrid();
    const lastSentAt = Math.max(0, ...allSends.map((record) => Date.parse(record.sentAt)).filter(Number.isFinite));
    console.log('');
    const result = await runSends(thisRun, campaign, {
        record: sandbox ? null : { sentPath: statePaths.sent, attemptsPath: statePaths.attempts },
        display: mask,
        firstWaitMs: lastSentAt + intervalMs - Date.now(),
        day: allowance.today,
    });
    console.log(
        `\nDone: ${result.sent} sent, ${result.failed} failed${result.stopReason ? ` — stopped: ${result.stopReason}` : ''}. ` +
            `${toSend.length - (sandbox ? 0 : result.sent)} remaining.`,
    );
    process.exitCode = result.failed > 0 ? 1 : 0;
};

run().catch((err) => {
    console.error('\n✗ Failed:', errorDetail(err));
    process.exit(1);
});
