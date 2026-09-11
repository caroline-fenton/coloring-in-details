import assert from "node:assert/strict";
import { mkdtempSync, symlinkSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(".");
for (const preview of [false, true]) {
  const dir = mkdtempSync(join(tmpdir(), "color-pages-test-"));
  for (const asset of ["index.html", "app.js", "styles.css", "sw.js", "manifest.webmanifest", "icons", "assets"]) {
    symlinkSync(join(root, asset), join(dir, asset));
  }
  if (preview) symlinkSync(root, join(dir, ".preview-source"));
  execFileSync(process.execPath, [join(root, "scripts/package-pages.mjs"), ...(preview ? ["--preview"] : [])], { cwd: dir });
  for (const file of ["index.html", "app.js", "styles.css", "sw.js"]) {
    assert.deepEqual(readFileSync(join(dir, ".pages-output", file)), readFileSync(join(root, file)));
  }
  assert.equal(existsSync(join(dir, ".pages-output/preview/index.html")), preview);
  if (preview) {
    const code = readFileSync(join(dir, ".pages-output/preview/app.js"), "utf8");
    assert.ok(code.includes('const DB_NAME = "color-studio-preview-db";'));
    assert.ok(code.includes('register("../sw.js")'));
  }
}
console.log("Packaging passes with no preview checkout and with an isolated preview");
