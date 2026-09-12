import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('app.js', 'utf8');
const manifest = JSON.parse(readFileSync('assets/optimized/manifest.json', 'utf8'));
for (const asset of manifest) {
  assert.equal(statSync(asset.output).size, asset.outputBytes);
  assert(asset.outputBytes < asset.sourceBytes);
}
const worker = readFileSync('sw.js', 'utf8');
for (const [, file] of worker.matchAll(/"\.\/([^"\n]+)"/g)) statSync(file.split("?")[0]);
for (const asset of manifest) assert(worker.includes(asset.output));

const requests = [], frames = [], events = {};
let renders = 0, draws = 0;
class FakeImage {
  complete = false;
  naturalWidth = 0;
  listeners = {};
  addEventListener(name, callback) { this.listeners[name] = callback; }
  set src(value) { requests.push(value); }
}
const context = vm.createContext({ Image: FakeImage,
  window: { addEventListener: (name, callback) => { events[name] = callback; } },
  requestAnimationFrame: callback => frames.push(callback),
  renderScene: () => renders++, draw: () => draws++, showToast: () => {} });
vm.runInContext(source.slice(source.indexOf('const sceneImages ='), source.indexOf('const backgroundThemes')), context);
assert.equal(requests.length, 0, 'No canvas asset loads before it is requested');
const first = vm.runInContext('sceneImage("first.png")', context);
assert.equal(vm.runInContext('sceneImage("first.png")', context), first);
const second = vm.runInContext('sceneImage("second.png")', context);
assert.equal(requests.length, 2, 'Repeated requests reuse an image');
first.listeners.load(); second.listeners.load();
assert.equal(frames.length, 1, 'Concurrent image loads share a redraw');
frames.shift()();
assert.equal(renders, 1); assert.equal(draws, 1);
first.complete = true;
events.online();
assert.notEqual(vm.runInContext('sceneImage("first.png")', context), first, 'Failed images can retry after reconnecting');
const failed = vm.runInContext('sceneImage("retry.png")', context);
const requestsBeforeError = requests.length;
failed.complete = true;
failed.listeners.error();
assert.equal(requests.length, requestsBeforeError, 'Failure does not trigger an automatic retry loop');
const retried = vm.runInContext('sceneImage("retry.png")', context);
assert.notEqual(retried, failed, 'Failed images retry without an online event');
assert.equal(requests.length, requestsBeforeError + 1, 'The next request starts a fresh load');
assert.equal(vm.runInContext('sceneImage("retry.png")', context), retried, 'Concurrent callers reuse the retry');
failed.listeners.error();
assert.equal(vm.runInContext('sceneImage("retry.png")', context), retried, 'An old failure cannot evict a newer request');
retried.complete = true;
retried.naturalWidth = 100;
retried.listeners.load();
frames.shift()();
assert.equal(vm.runInContext('sceneImage("retry.png")', context), retried, 'A successful retry stays cached');
console.log('Image asset and loading tests passed');
