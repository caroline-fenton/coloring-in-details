import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const scope = "https://example.com/coloring-in-details/";
const worker = readFileSync("sw.js", "utf8");
const cacheName = worker.match(/const CACHE_NAME = "([^"]+)"/)[1];
const request = (path) => ({ url: new URL(path, scope).href, method: "GET" });
const live = request("styles.css");
const stale = request("preview/styles.css?v=76");
const unrelated = request("../other/styles.css");
const stores = new Map([
  [cacheName, new Map([[live.url, "live"], [stale.url, "stale"]])],
  ["other-app", new Map([[unrelated.url, "other"], [stale.url, "stale"]])]
]);
const handlers = {};
let claimed = false;
let network = 0;
const context = {
  URL,
  Response,
  self: { registration: { scope }, addEventListener: (name, fn) => { handlers[name] = fn; },
    clients: { claim: async () => { claimed = true; } }, skipWaiting() {} },
  caches: {
    keys: async () => [...stores.keys()],
    delete: async (key) => stores.delete(key),
    open: async (key) => ({
      addAll: async (paths) => {
        const cache = stores.get(key) || new Map();
        stores.set(key, cache);
        for (const path of paths) cache.set(request(path).url, `cached:${path}`);
      },
      keys: async () => [...stores.get(key).keys()].map((url) => ({ url })),
      delete: async (req) => stores.get(key).delete(req.url)
    }),
    match: async (req) => stores.get(cacheName).get(typeof req === "string" ? request(req).url : req.url)
  },
  fetch: async () => { network++; throw new Error("offline"); }
};
vm.runInNewContext(worker, context);
for (const path of ["preview/", "preview", "preview/app.js", "preview/styles.css?v=76", "preview/assets/a.png"]) {
  handlers.fetch({ request: request(path), respondWith() { assert.fail(`Worker intercepted ${path}`); } });
}
let response;
handlers.fetch({ request: live, respondWith(value) { response = value; } });
assert.equal(await response, "live", "Live CSS still works offline");
assert.equal(network, 0);
let activation;
handlers.activate({ waitUntil(value) { activation = value; } });
await activation;
assert.ok(claimed);
assert.equal(stores.get(cacheName).get(live.url), "live");
assert.equal(stores.get("other-app").get(unrelated.url), "other");
for (const cache of stores.values()) assert.equal(cache.has(stale.url), false);
console.log("Preview bypass, stale-cache cleanup, and live offline regression tests passed");

// Simulate installing the new worker, removing the previous cache, and
// launching offline without any intervening online page/asset requests.
stores.delete(cacheName);
stores.set("color-corner-v75", new Map([[request("app.js?v=75").url, "old code"]]));
let installation;
handlers.install({ waitUntil(value) { installation = value; } });
await installation;
handlers.activate({ waitUntil(value) { activation = value; } });
await activation;
assert.equal(stores.has("color-corner-v75"), false);
const html = readFileSync("index.html", "utf8");
const assetPaths = [...html.matchAll(/(?:src|href)="((?:app\.js|styles\.css)\?[^\"]+)"/g)].map((match) => match[1]);
assert.equal(assetPaths.length, 2);
for (const path of assetPaths) {
  handlers.fetch({ request: request(path), respondWith(value) { response = value; } });
  assert.equal(await response, `cached:./${path}`, `Offline update must serve the exact ${path} requested by index.html`);
}
handlers.fetch({ request: { ...request("index.html"), mode: "navigate" }, respondWith(value) { response = value; } });
assert.equal(await response, "cached:./index.html");
for (const path of ["app.js?v=missing", "missing.css"]) {
  handlers.fetch({ request: request(path), respondWith(value) { response = value; } });
  assert.equal((await response).type, "error", "Missing assets must never receive HTML");
}
console.log("Offline update serves versioned JS/CSS and never substitutes HTML for missing assets");
