// Rewrite root-relative asset paths (fonts, images) to absolute domain URLs.
// The exported HTML serves these from `/static/...` for the local preview server;
// in a real inbox they must be fully-qualified. Logo URLs are already absolute.
export const ASSET_BASE_URL = process.env.ASSET_BASE_URL ?? 'https://www.swapper.cz';

export const rewriteAssets = (html) =>
    html
        .replace(/(url\(['"]?)\/(static\/)/g, `$1${ASSET_BASE_URL}/$2`)
        .replace(/((?:src|href)=['"])\/(static\/)/g, `$1${ASSET_BASE_URL}/$2`);
