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
  self: { registration: { scope }, addEventListener: (name, fn) => { handlers[name] = fn; },
    clients: { claim: async () => { claimed = true; } } },
  caches: {
    keys: async () => [...stores.keys()],
    delete: async (key) => stores.delete(key),
    open: async (key) => ({
      keys: async () => [...stores.get(key).keys()].map((url) => ({ url })),
      delete: async (req) => stores.get(key).delete(req.url)
    }),
    match: async (req) => stores.get(cacheName).get(req.url)
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
