import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

// Explicit allowlist keeps source checkouts and workflows out of the web root.
const assets = ["index.html", "app.js", "styles.css", "sw.js", "manifest.webmanifest", "icons", "assets"];
const includePreview = process.argv.includes("--preview");
assert.ok(!existsSync(".pages-output"), "Use a clean checkout when packaging Pages");
mkdirSync(".pages-output", { recursive: true });
if (includePreview) mkdirSync(".pages-output/preview");
for (const asset of assets) {
  cpSync(asset, `.pages-output/${asset}`, { recursive: true });
  if (includePreview) cpSync(`.preview-source/${asset}`, `.pages-output/preview/${asset}`, { recursive: true });
}

if (includePreview) {
// Paths share an origin: preview must not open the live artwork database or
// register a preview worker. Refresh the parent worker so previously installed
// clients receive the preview bypass even when opening this URL directly.
let preview = readFileSync(".pages-output/preview/app.js", "utf8");
assert.ok(preview.includes('const DB_NAME = "color-studio-db";'));
assert.ok(preview.includes('navigator.serviceWorker.register("sw.js")'));
preview = preview.replace('const DB_NAME = "color-studio-db";', 'const DB_NAME = "color-studio-preview-db";');
preview = preview.replace('navigator.serviceWorker.register("sw.js")', 'navigator.serviceWorker.register("../sw.js").then((registration) => registration.update())');
writeFileSync(".pages-output/preview/app.js", preview);
const html = readFileSync(".pages-output/preview/index.html", "utf8")
  .replace('<title>Color Corner</title>', '<title>Color Corner — Preview</title>')
  .replace('aria-label="Color Corner"', 'aria-label="Color Corner preview"');
writeFileSync(".pages-output/preview/index.html", html);
}
for (const asset of ["index.html", "app.js", "styles.css", "sw.js"]) {
  assert.deepEqual(readFileSync(`.pages-output/${asset}`), readFileSync(asset), `Live ${asset} must remain unchanged`);
}
console.log(includePreview ? "Pages package verified with isolated preview." : "Pages package verified: live app only.");
