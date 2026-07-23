import client from '@sendgrid/client';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSET_BASE_URL = process.env.ASSET_BASE_URL ?? 'https://www.swapper.cz';
const DEFAULT_CAMPAIGN_LABEL = new Date().toISOString().slice(0, 10);
const SENDGRID_MAX_PAGE_SIZE = 100;

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
    console.error('✗ SENDGRID_API_KEY is not set.');
    process.exit(1);
}
client.setApiKey(apiKey);

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const readArg = (name) => {
    const exact = args.find((arg) => arg.startsWith(`${name}=`));
    if (exact) return exact.slice(name.length + 1);
    const index = args.indexOf(name);
    if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
    return undefined;
};

if (hasFlag('--help')) {
    console.log(`
Prepare survey campaign assets in SendGrid:
        - create/replace 6 contact lists from CSV files (buyers/sellers/incomplete, each split -1/-2)
    - create 6 draft Single Sends from out/survey-*.html

Usage:
  node --env-file-if-exists=.env scripts/prepare-survey-singlesends.mjs [options]

Options:
  --dry-run                          Print planned actions only
  --campaign-label <label>           Naming suffix for lists/sends (default: ${DEFAULT_CAMPAIGN_LABEL})
    --csv-dir <path>                   Directory containing buyers-1.csv ... incomplete-2.csv
        --only <selector>                  Restrict run to a segment/batch (buyers|sellers|incomplete|renegades|incomplete-1|incomplete-2)
        --lists-only                       Only update lists/contacts (skip Single Send replacement/create)
    --user-id-column <name>            CSV column name for user id (default: user_id)
    --user-id-field-name <name>        SendGrid custom field name for user id (default: user_id)
    --user-id-field-id <id>            SendGrid custom field id override (for example w12)
        --no-auto-create-user-id-field     Fail if user_id field does not exist in SendGrid
    --keep-existing                    Reuse existing lists/sends instead of replacing them
  --sender-id <number>               SendGrid marketing sender id
  --suppression-group-id <number>    SendGrid ASM suppression group id

Environment variable fallbacks:
  SENDGRID_SENDER_ID
  SENDGRID_SUPPRESSION_GROUP_ID
    SENDGRID_USER_ID_FIELD_ID
    SENDGRID_USER_ID_FIELD_NAME
        SENDGRID_AUTO_CREATE_USER_ID_FIELD
    SURVEY_USER_ID_COLUMN
    SURVEY_CSV_DIR
  ASSET_BASE_URL
`);
    process.exit(0);
}

const dryRun = hasFlag('--dry-run');
const replaceExisting = !hasFlag('--keep-existing');
const listsOnly = hasFlag('--lists-only');
const onlySelectorRaw = readArg('--only') || process.env.SURVEY_ONLY || '';
const onlySelectors = onlySelectorRaw
    .split(',')
    .map((selector) => selector.trim().toLowerCase())
    .filter(Boolean)
    .map((selector) => (selector === 'renegades' ? 'incomplete' : selector));
const campaignLabel = readArg('--campaign-label') || process.env.SURVEY_CAMPAIGN_LABEL || DEFAULT_CAMPAIGN_LABEL;
const userIdColumn = readArg('--user-id-column') || process.env.SURVEY_USER_ID_COLUMN || 'user_id';
const userIdFieldName = readArg('--user-id-field-name') || process.env.SENDGRID_USER_ID_FIELD_NAME || 'user_id';
const userIdFieldIdOverride = readArg('--user-id-field-id') || process.env.SENDGRID_USER_ID_FIELD_ID;
const autoCreateUserIdField =
    !hasFlag('--no-auto-create-user-id-field') &&
    String(process.env.SENDGRID_AUTO_CREATE_USER_ID_FIELD ?? 'true').toLowerCase() !== 'false';

const defaultCsvDir = join(os.homedir(), 'Downloads', 'swapper-email-survey');
const csvDir = readArg('--csv-dir') || process.env.SURVEY_CSV_DIR || defaultCsvDir;

const outDir = fileURLToPath(new URL('../out/', import.meta.url));

const segmentDefinitions = [
    {
        key: 'buyers',
        csvPrefix: 'buyers',
        label: 'Buyers',
        htmlFile: 'survey-buyers.html',
        subject: 'Vyplň dotazník a vyhraj vstupenku na Swapperu v hodnotě 2 000 Kč',
    },
    {
        key: 'sellers',
        csvPrefix: 'sellers',
        label: 'Sellers',
        htmlFile: 'survey-sellers.html',
        subject: 'Vyplň dotazník a vyhraj vstupenku na Swapperu v hodnotě 2 000 Kč',
    },
    {
        key: 'incomplete',
        csvPrefix: 'incomplete',
        label: 'Incomplete',
        htmlFile: 'survey-renegades.html',
        subject: 'Vyplň dotazník a vyhraj vstupenku na Swapperu v hodnotě 2 000 Kč',
    },
];

const batchNumbers = [1, 2];

const segments = batchNumbers.flatMap((batch) =>
    segmentDefinitions.map((segment) => {
        const batchKey = `${segment.csvPrefix}-${batch}`;
        return {
            ...segment,
            batch,
            batchKey,
            csvPath: join(csvDir, `${batchKey}.csv`),
            listName: `Swapper Survey ${batchKey} ${campaignLabel}`,
            singleSendName: `Swapper Survey ${batchKey} ${campaignLabel}`,
        };
    }),
);

const selectedSegments =
    onlySelectors.length === 0
        ? segments
        : segments.filter((segment) =>
              onlySelectors.some(
                  (selector) =>
                      selector === segment.key ||
                      selector === segment.csvPrefix ||
                      selector === segment.batchKey ||
                      selector === `${segment.key}-${segment.batch}`,
              ),
          );

if (selectedSegments.length === 0) {
    console.error(`✗ No segment matched --only '${onlySelectorRaw}'.`);
    process.exit(1);
}

const rewriteAssets = (html) =>
    html
        .replace(/(url\(['"]?)\/(static\/)/g, `$1${ASSET_BASE_URL}/$2`)
        .replace(/((?:src|href)=['"])\/(static\/)/g, `$1${ASSET_BASE_URL}/$2`);

const request = async (payload) => {
    const [, responseBody] = await client.request(payload);
    return responseBody;
};

const normalizeEmail = (value) => value.trim().toLowerCase();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseCsvColumns = (line) => line.split(',').map((column) => column.trim().replace(/^"|"$/g, '').trim());

const parseContactsCsv = (contents) => {
    const lines = contents
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return {
            contacts: [],
            userIdColumnFound: false,
        };
    }

    const headerColumns = parseCsvColumns(lines[0]).map((column) => column.toLowerCase());
    const hasHeader = headerColumns.includes('email');

    const emailIndex = hasHeader ? headerColumns.indexOf('email') : 0;
    const userIdIndex = hasHeader ? headerColumns.indexOf(userIdColumn.toLowerCase()) : -1;
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const contacts = [];
    for (const line of dataLines) {
        const columns = parseCsvColumns(line);
        const email = columns[emailIndex] ?? '';
        const userId = userIdIndex >= 0 ? (columns[userIdIndex] ?? '') : '';
        if (!email) continue;
        contacts.push({ email, userId });
    }

    return {
        contacts,
        userIdColumnFound: userIdIndex >= 0,
    };
};

const loadContacts = async (csvPath) => {
    const raw = await readFile(csvPath, 'utf8');
    const parsed = parseContactsCsv(raw);

    const uniqueByEmail = new Map();
    const invalid = [];
    let withUserIdCount = 0;
    let missingUserIdCount = 0;

    for (const candidate of parsed.contacts) {
        const email = normalizeEmail(candidate.email);
        const userId = candidate.userId?.trim() ?? '';

        if (!isValidEmail(email)) {
            invalid.push(candidate.email);
            continue;
        }

        if (userId) withUserIdCount += 1;
        else missingUserIdCount += 1;

        const existing = uniqueByEmail.get(email);
        if (!existing) {
            uniqueByEmail.set(email, { email, userId });
            continue;
        }

        if (!existing.userId && userId) {
            uniqueByEmail.set(email, { email, userId });
        }
    }

    const contacts = Array.from(uniqueByEmail.values());
    const contactsWithUserId = contacts.filter((contact) => Boolean(contact.userId)).length;

    return {
        contacts,
        invalid,
        rawCount: parsed.contacts.length,
        userIdColumnFound: parsed.userIdColumnFound,
        withUserIdCount: contactsWithUserId,
        missingUserIdCount: contacts.length - contactsWithUserId,
    };
};

const ensureSingleMatch = async ({ value, envName, fetchFallback, label }) => {
    if (value) return Number(value);
    const options = await fetchFallback();

    if (options.length === 0) {
        throw new Error(`No ${label} found. Set ${envName} explicitly.`);
    }
    if (options.length > 1) {
        const sample = options.map((item) => `${item.id}:${item.name}`).join(', ');
        throw new Error(
            `Multiple ${label}s found (${sample}). Set ${envName} (or --${envName
                .toLowerCase()
                .replace(/_/g, '-')}) explicitly.`,
        );
    }

    return Number(options[0].id);
};

const resolveSenderId = async () =>
    ensureSingleMatch({
        value: readArg('--sender-id') || process.env.SENDGRID_SENDER_ID,
        envName: 'SENDGRID_SENDER_ID',
        label: 'marketing sender',
        fetchFallback: async () => {
            const data = await request({ method: 'GET', url: '/v3/marketing/senders' });
            const list = data.result ?? data.results ?? [];
            return list
                .filter((sender) => sender?.id)
                .map((sender) => ({
                    id: sender.id,
                    name: sender.nickname || sender.from?.name || sender.from_email || 'sender',
                }));
        },
    });

const resolveSuppressionGroupId = async () =>
    ensureSingleMatch({
        value: readArg('--suppression-group-id') || process.env.SENDGRID_SUPPRESSION_GROUP_ID,
        envName: 'SENDGRID_SUPPRESSION_GROUP_ID',
        label: 'suppression group',
        fetchFallback: async () => {
            const data = await request({ method: 'GET', url: '/v3/asm/groups' });
            const list = Array.isArray(data) ? data : (data.result ?? []);
            return list.filter((group) => group?.id).map((group) => ({ id: group.id, name: group.name || 'group' }));
        },
    });

const listFieldDefinitions = async () => {
    const data = await request({ method: 'GET', url: '/v3/marketing/field_definitions' });
    return Array.isArray(data)
        ? data
        : data.custom_fields || data.result || data.results || data.field_definitions || [];
};

const findUserIdFieldMatches = (fields) =>
    fields.filter(
        (field) =>
            field?.id && field?.name && String(field.name).toLowerCase() === String(userIdFieldName).toLowerCase(),
    );

const resolveUserIdFieldId = async () => {
    if (userIdFieldIdOverride) return userIdFieldIdOverride;

    let fields = await listFieldDefinitions();
    let matches = findUserIdFieldMatches(fields);

    if (matches.length === 0) {
        if (!autoCreateUserIdField) {
            throw new Error(
                `Custom field '${userIdFieldName}' not found in SendGrid. Create it first or set SENDGRID_USER_ID_FIELD_ID.`,
            );
        }

        await request({
            method: 'POST',
            url: '/v3/marketing/field_definitions',
            body: {
                name: userIdFieldName,
                field_type: 'Text',
            },
        });

        fields = await listFieldDefinitions();
        matches = findUserIdFieldMatches(fields);

        if (matches.length === 0) {
            throw new Error(
                `Custom field '${userIdFieldName}' was created but could not be resolved. Set SENDGRID_USER_ID_FIELD_ID explicitly and retry.`,
            );
        }
    }

    if (matches.length > 1) {
        const ids = matches.map((field) => field.id).join(', ');
        throw new Error(
            `Multiple custom fields named '${userIdFieldName}' found (${ids}). Set SENDGRID_USER_ID_FIELD_ID explicitly.`,
        );
    }

    return matches[0].id;
};

const chunk = (items, size) => {
    const result = [];
    for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
    return result;
};

const ensureList = async (name) => {
    const existing = await request({
        method: 'GET',
        url: '/v3/marketing/lists',
        qs: { page_size: SENDGRID_MAX_PAGE_SIZE },
    });

    const found = (existing.result ?? []).find((list) => list.name === name);
    if (found) {
        if (replaceExisting) {
            await request({ method: 'DELETE', url: `/v3/marketing/lists/${found.id}` });
            const recreated = await request({
                method: 'POST',
                url: '/v3/marketing/lists',
                body: { name },
            });
            return { id: recreated.id, created: true, replaced: true };
        }
        return { id: found.id, created: false };
    }

    const created = await request({
        method: 'POST',
        url: '/v3/marketing/lists',
        body: { name },
    });

    return { id: created.id, created: true };
};

const findSingleSendByName = async (name) => {
    const data = await request({
        method: 'GET',
        url: '/v3/marketing/singlesends',
        qs: { page_size: SENDGRID_MAX_PAGE_SIZE },
    });
    const result = data.result ?? data.results ?? [];
    return result.find((singleSend) => singleSend.name === name);
};

const upsertContactsToList = async (listId, contacts, userIdFieldId) => {
    const batches = chunk(contacts, 10000);
    const jobIds = [];

    for (const batch of batches) {
        const response = await request({
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body: {
                list_ids: [listId],
                contacts: batch.map((contact) => {
                    const payload = { email: contact.email };
                    if (userIdFieldId && contact.userId) {
                        payload.custom_fields = {
                            [userIdFieldId]: contact.userId,
                        };
                    }
                    return payload;
                }),
            },
        });
        if (response?.job_id) jobIds.push(response.job_id);
    }

    return jobIds;
};

const createSingleSend = async ({ name, listId, subject, html, senderId, suppressionGroupId }) =>
    request({
        method: 'POST',
        url: '/v3/marketing/singlesends',
        body: {
            name,
            categories: ['survey', 'swapper'],
            send_to: {
                list_ids: [listId],
                segment_ids: [],
                all: false,
            },
            email_config: {
                subject,
                html_content: html,
                generate_plain_content: true,
                sender_id: senderId,
                suppression_group_id: suppressionGroupId,
                editor: 'code',
            },
        },
    });

const run = async () => {
    console.log(`Preparing survey lists + Single Sends${dryRun ? ' (dry run)' : ''}…\n`);
    console.log(`CSV directory: ${csvDir}`);
    console.log(
        `Expected files: buyers-1.csv, buyers-2.csv, sellers-1.csv, sellers-2.csv, incomplete-1.csv, incomplete-2.csv\n`,
    );
    console.log(`Replace existing lists/sends: ${replaceExisting ? 'yes' : 'no'}`);
    console.log(`Lists only mode: ${listsOnly ? 'yes' : 'no'}`);
    if (onlySelectors.length > 0) {
        console.log(`Only selector: ${onlySelectors.join(', ')}`);
    }
    console.log(`user_id csv column: ${userIdColumn}`);
    console.log(`user_id field name: ${userIdFieldName}\n`);
    console.log(`auto-create user_id field: ${autoCreateUserIdField ? 'yes' : 'no'}\n`);

    const senderId = await resolveSenderId();
    const suppressionGroupId = await resolveSuppressionGroupId();
    let userIdFieldId = userIdFieldIdOverride;

    console.log(`Using sender_id=${senderId}, suppression_group_id=${suppressionGroupId}\n`);

    for (const [index, segment] of selectedSegments.entries()) {
        const csvPath = segment.csvPath;
        const htmlPath = new URL(segment.htmlFile, `file://${outDir}`);
        const rawHtml = await readFile(htmlPath, 'utf8');
        const html = rewriteAssets(rawHtml);
        const contacts = await loadContacts(csvPath);

        console.log(`• day ${index + 1}: ${segment.batchKey}`);
        console.log(`  - segment: ${segment.label} batch ${segment.batch}`);
        console.log(`  - csv: ${csvPath}`);
        console.log(`  - html: out/${segment.htmlFile} (${html.length} bytes)`);
        console.log(`  - contacts: ${contacts.contacts.length} valid / ${contacts.rawCount} parsed`);
        if (contacts.userIdColumnFound) {
            console.log(`  - user_id: ${contacts.withUserIdCount} with value / ${contacts.missingUserIdCount} missing`);
        } else {
            console.log(`  - user_id: column '${userIdColumn}' not found`);
        }
        if (contacts.invalid.length > 0) {
            console.log(`  - invalid skipped: ${contacts.invalid.length}`);
        }

        if (dryRun) {
            console.log(`  - list: ${segment.listName}`);
            console.log(`  - single send: ${segment.singleSendName}\n`);
            continue;
        }

        if (contacts.withUserIdCount > 0 && !userIdFieldId) {
            userIdFieldId = await resolveUserIdFieldId();
            console.log(`  - user_id field id: ${userIdFieldId}`);
        }

        if (replaceExisting && !listsOnly) {
            const existingSingleSend = await findSingleSendByName(segment.singleSendName);
            if (existingSingleSend?.id) {
                await request({ method: 'DELETE', url: `/v3/marketing/singlesends/${existingSingleSend.id}` });
                console.log(`  - replaced single send: removed ${existingSingleSend.id}`);
            }
        }

        const list = await ensureList(segment.listName);
        const listState = list.replaced ? 'replaced' : list.created ? 'created' : 'reused';
        console.log(`  - list id: ${list.id} (${listState})`);

        const importJobIds = await upsertContactsToList(list.id, contacts.contacts, userIdFieldId);
        if (importJobIds.length > 0) {
            console.log(`  - contact import job(s): ${importJobIds.join(', ')}`);
        }

        if (listsOnly) {
            console.log('  - single send: skipped (lists-only mode)\n');
            continue;
        }

        const singleSend = await createSingleSend({
            name: segment.singleSendName,
            listId: list.id,
            subject: segment.subject,
            html,
            senderId,
            suppressionGroupId,
        });
        console.log(`  - single send id: ${singleSend.id}\n`);
    }

    console.log('Done. Draft Single Sends are created and ready for review/scheduling in SendGrid UI.');
};

run().catch((err) => {
    const detail = err?.response?.body ? JSON.stringify(err.response.body, null, 2) : err?.message || String(err);
    console.error('\n✗ Preparation failed:\n', detail);
    process.exit(1);
});
