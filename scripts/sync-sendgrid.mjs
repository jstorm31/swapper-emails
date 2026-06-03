// Pushes the exported HTML in out/ to SendGrid dynamic templates.
//
//   npm run sync           (reads .env via the npm script)
//   npm run sync:dry       (shows the plan without writing)
//
// Config lives in scripts/sendgrid-config.json. Each entry has:
//   - id:       the SendGrid template id (d-xxxx). Leave "" to create a new
//               template — the new id is written back into the JSON automatically.
//   - file:     the exported HTML in out/.
//   - name:     template name (used only when creating).
//   - subject:  version subject (Handlebars allowed — resolved at send time).
//   - testData: mock data SendGrid uses for the editor preview.
//
// For each entry the script:
//   1. reads out/<file>,
//   2. rewrites relative /static/... asset URLs to absolute ASSET_BASE_URL ones,
//   3. matches the template by id (creating it if id is empty),
//   4. adds a NEW active version (the previous active version is kept, just
//      deactivated) — existing versions are never modified, so SendGrid keeps
//      the full history and you can roll back from the dashboard.
//
// Requires a SendGrid API key (env SENDGRID_API_KEY) with the Template Engine scope.

import client from '@sendgrid/client';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ASSET_BASE_URL = process.env.ASSET_BASE_URL ?? 'https://www.swapper.cz';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
    console.error('✗ SENDGRID_API_KEY is not set.');
    process.exit(1);
}
client.setApiKey(apiKey);

const dryRun = process.argv.includes('--dry-run');
const outDir = fileURLToPath(new URL('../out/', import.meta.url));
const configPath = fileURLToPath(new URL('./sendgrid-config.json', import.meta.url));

// Rewrite root-relative asset paths (fonts, images) to absolute domain URLs.
// The exported HTML serves these from `/static/...` for the local preview server;
// in a real inbox they must be fully-qualified. Logo URLs are already absolute.
const rewriteAssets = (html) =>
    html
        .replace(/(url\(['"]?)\/(static\/)/g, `$1${ASSET_BASE_URL}/$2`)
        .replace(/((?:src|href)=['"])\/(static\/)/g, `$1${ASSET_BASE_URL}/$2`);

const request = async (body) => {
    const [, responseBody] = await client.request(body);
    return responseBody;
};

const run = async () => {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const { templates } = config;

    // Shared version label for this run, e.g. "export 2026-06-03 14:08".
    const versionName = `export ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

    console.log(
        `Syncing ${templates.length} template(s) to SendGrid${dryRun ? ' (dry run)' : ''}…\n`,
    );

    let configChanged = false;

    for (const entry of templates) {
        const raw = await readFile(new URL(entry.file, `file://${outDir}`), 'utf8');
        const html = rewriteAssets(raw);

        if (dryRun) {
            const action = entry.id ? `new version on ${entry.id}` : 'create template + version';
            console.log(`  • ${entry.file} → "${entry.name}" (${action}), ${html.length} bytes`);
            continue;
        }

        // Resolve the template — create it if no id is configured yet.
        let templateId = entry.id;
        if (!templateId) {
            const created = await request({
                method: 'POST',
                url: '/v3/templates',
                body: { name: entry.name, generation: 'dynamic' },
            });
            templateId = created.id;
            entry.id = templateId; // persisted back to JSON after the loop
            configChanged = true;
            console.log(`  + created template "${entry.name}" → ${templateId}`);
        }

        // Always add a new active version — never modify an existing one.
        // SendGrid deactivates the previously active version automatically.
        await request({
            method: 'POST',
            url: `/v3/templates/${templateId}/versions`,
            body: {
                name: versionName,
                subject: entry.subject,
                html_content: html,
                generate_plain_content: true,
                test_data: JSON.stringify(entry.testData),
                active: 1,
            },
        });
        console.log(`  ✔ ${entry.file} → "${entry.name}" (${templateId}) new version "${versionName}"`);
    }

    // Write any newly-created ids back into the config so the next run matches by id.
    if (configChanged) {
        await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
        console.log('\n  ↳ wrote new template ids back to sendgrid-config.json');
    }

    console.log('\nDone.');
};

run().catch((err) => {
    const detail = err?.response?.body
        ? JSON.stringify(err.response.body, null, 2)
        : (err?.message ?? err);
    console.error('\n✗ Sync failed:\n', detail);
    process.exit(1);
});
