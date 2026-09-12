// Logic regression checks; these do not substitute for rendered device QA.
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync("app.js", "utf8");
const nodes = new Map();
const node = (id) => {
  if (!nodes.has(id)) nodes.set(id, {
    id, style: {}, children: [], attributes: {}, textContent: "",
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute(key, value) { this.attributes[key] = value; },
    append(element) { this.children.push(element); }, focus() {},
    matches(selector) { return id === "reset" && selector.includes("resetForest"); }
  });
  return nodes.get(id);
};
const context = vm.createContext({
  document: {
    querySelector: node, querySelectorAll: () => [],
    body: { classList: { contains: () => false } }
  },
  state: { projectMode: "forest", forestMode: "build" },
  phoneLayout: { matches: true }, forestViewIsFit: false, forestZoom: 2,
  FOREST_WIDTH: 1920, FOREST_HEIGHT: 1200,
  setForestMode(mode) { context.state.forestMode = mode; },
  updateSelectedControls() {},
  console
});
vm.runInContext(source.slice(source.indexOf("// Phone panels reuse"), source.lastIndexOf("init();")), context);
const run = (code) => vm.runInContext(code, context);
context.groups = { draw: [node("brush")], stickers: [node("objects")], studioStickers: [node("colors")],
  background: [node("background")], picture: [node("picture")], more: [node("export"), node("reset")], move: [] };
run("mobileGroups = groups");

run('openMobilePanel("draw")');
assert.equal(context.state.forestMode, "draw");
assert.equal(run("mobilePanel"), "draw");
run('openMobilePanel("draw")');
assert.equal(run("mobilePanel"), null, "Tapping an open category closes it");
run('openMobilePanel("stickers")');
assert.equal(context.state.forestMode, "build");
run('openMobilePanel("move")');
run("closeMobilePanel()");
assert.equal(run("mobilePan"), true, "Closing Move leaves pan mode active");
run('openMobilePanel("draw")');
assert.equal(run("mobilePan"), false, "Draw exits pan mode");
context.state.projectMode = "coloring";
node("#mobileSheetContent").children = [];
run('openMobilePanel("stickers")');
assert.equal(context.state.brush, "sticker");
assert.deepEqual(node("#mobileSheetContent").children.map((n) => n.id), ["colors"]);
node("#mobileSheetContent").children = [];
run('openMobilePanel("more")');
assert.deepEqual(node("#mobileSheetContent").children.map((n) => n.id), ["export"], "Studio never exposes Forest reset");

node("#canvasStage").clientWidth = 374;
node("#canvasStage").clientHeight = 600;
context.state.projectMode = "forest";
run("sizePhoneCanvas()");
assert.equal(node("#canvasFrame").style.width, "732px");
assert.equal(node("#canvasFrame").style.height, "457.5px");
context.forestViewIsFit = true;
run("sizePhoneCanvas()");
assert.equal(node("#canvasFrame").style.width, "366px");
context.state.projectMode = "coloring";
run("sizePhoneCanvas()");
assert.equal(node("#canvasFrame").style.height, "366px");
context.phoneLayout.matches = false;
node("#canvasFrame").style = {};
run("sizePhoneCanvas()");
assert.deepEqual(node("#canvasFrame").style, {}, "Tablet/desktop sizing is untouched");

let restored = false;
context.home = { element: node("original"), marker: { after(element) { restored = element.id === "original"; } } };
run("mobileHomes = [home]; closeMobilePanel()");
assert.ok(restored, "Closing returns controls to their original DOM positions");
console.log("Phone panel/mode, control restoration, and canvas sizing checks passed");

run("closeMobilePanel()");
context.state.projectMode = "forest";
run('openMobilePanel("colors")');
assert.equal(context.state.forestMode, "draw", "Colors enables drawing in Worlds");
run("closeMobilePanel()");
context.state.projectMode = "coloring";
context.state.brush = "marker";
context.state.color = "#abc123";
run('openMobilePanel("colors")');
assert.equal(context.state.brush, "marker", "Opening Colors preserves the Studio tool");
assert.equal(context.state.color, "#abc123", "Opening Colors preserves the selected color");
