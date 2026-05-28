// React JSX HTML-escapes text content, so Handlebars helpers like
// {{#equals guaranteeActive "true"}} become {{#equals guaranteeActive &quot;true&quot;}}
// in the exported HTML — and SendGrid's Handlebars parser sees the entity
// literally, breaking the comparison. This script decodes the few entities
// React emits, but only inside {{...}} / {{{...}}} blocks, so body content
// stays correctly escaped.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = fileURLToPath(new URL('../out/', import.meta.url));

const decodeInsideHandlebars = (html) =>
    html.replace(/\{{2,3}[^}]*\}{2,3}/g, (match) =>
        match
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>'),
    );

const entries = await readdir(outDir, { recursive: true, withFileTypes: true });
let fixed = 0;
for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const path = join(entry.parentPath, entry.name);
    const before = await readFile(path, 'utf8');
    const after = decodeInsideHandlebars(before);
    if (before !== after) {
        await writeFile(path, after);
        console.log(`  ✔ fixed Handlebars escaping in ${entry.name}`);
        fixed++;
    }
}
if (fixed === 0) console.log('  ✓ no Handlebars escaping fixes needed');
