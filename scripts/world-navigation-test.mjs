// Exercise gesture arbitration and rollback independently of browser rendering.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync('app.js', 'utf8');
let pixels = 'original', saves = 0;
const scroller = { scrollLeft: 0, scrollTop: 0 };
const c = vm.createContext({
  state: { projectMode: 'forest', selectedObjectId: 'fairy', dirty: false, sceneObjects: [{ x: 20 }] },
  phoneLayout: { matches: true }, forestZoom: 2, forestViewIsFit: false,
  canvasScroller: scroller,
  canvas: { setPointerCapture() {}, getBoundingClientRect() { return { left: -scroller.scrollLeft, top: -scroller.scrollTop, width: 400 * c.forestZoom, height: 250 * c.forestZoom }; } },
  undoStack: [1,2,3,4,5,6], redoStack: [7],
  captureSnapshot: () => ({ pixels, objects: structuredClone(c.state.sceneObjects) }),
  restoreSnapshot: (s) => { pixels = s.pixels; c.state.sceneObjects = s.objects; },
  updateUndoRedo() {}, updateForestControls() {}, draw() {},
  stopDrawing() { c.state.drawing = false; },
  autosave() { saves++; }, sizePhoneCanvas() {}, updateForestViewport() {},
  clamp: (n,a,b) => Math.max(a, Math.min(n,b)),
  document: { querySelector() { return null; }, querySelectorAll() { return []; } }
});
vm.runInContext(source.slice(source.indexOf('let mobilePanel = null;'), source.indexOf('function setupMobileWorkspace()')), c);
c.sizePhoneCanvas = () => {};
const run = code => vm.runInContext(code,c);
function event(id,x=100,y=100,type='pointerdown') {
  return { pointerId:id, pointerType:'touch', clientX:x, clientY:y, type, blocked:false,
    preventDefault(){}, stopImmediatePropagation(){ this.blocked=true; } };
}
const first=event(1); c.handleWorldPointerDown(first);
assert.equal(first.blocked,false, 'Single finger reaches the creative tool');
pixels='tentative mark'; c.state.sceneObjects[0].x=99; c.state.dirty=true;
c.undoStack.shift(); c.undoStack.push(8); c.redoStack.length=0;
const second=event(2,200); c.handleWorldPointerDown(second);
assert.ok(second.blocked);
assert.equal(pixels,'original');
assert.equal(c.state.sceneObjects[0].x,20);
assert.deepEqual(c.undoStack,[1,2,3,4,5,6]);
assert.deepEqual(c.redoStack,[7]);
assert.equal(c.state.selectedObjectId,'fairy');
assert.equal(c.state.dirty,false);
assert.equal(saves,0);
c.handleWorldPointerMove(event(2,300,180,'pointermove'));
assert.ok(c.forestZoom>2,'Pinch zooms the scene');
assert.notEqual(scroller.scrollTop,0,'Navigation supports vertical movement');
c.handleWorldPointerEnd(event(2,300,180,'pointerup'));
const remaining=event(1,140,130,'pointermove'); c.handleWorldPointerMove(remaining);
assert.ok(remaining.blocked,'Remaining finger cannot draw after a pinch');
c.handleWorldPointerEnd(event(1,140,130,'pointerup'));
assert.equal(saves,0);
c.handleWorldPointerDown(event(3)); pixels='intentional mark';
c.handleWorldPointerEnd(event(3,100,100,'pointerup'));
assert.equal(pixels,'intentional mark'); assert.equal(saves,1);
c.handleWorldPointerDown(event(4)); pixels='cancelled mark';
c.handleWorldPointerEnd(event(4,100,100,'pointercancel'));
assert.equal(pixels,'intentional mark'); assert.equal(run('worldPointers.size'),0);
run('mobilePan = true'); const move=event(5); c.handleWorldPointerDown(move);
assert.ok(move.blocked); assert.equal(run('worldEditBackup'),null);
c.handleWorldPointerEnd(event(5,100,100,'pointerup'));
c.fitWorldScene(); assert.equal(c.forestZoom,1); assert.equal(c.forestViewIsFit,true);
c.state.projectMode='coloring'; const studio=event(6); c.handleWorldPointerDown(studio);
assert.equal(studio.blocked,false,'Studio keeps its existing input behavior');
assert.match(source,/function autosave\(\) \{\s*if \(worldEditBackup\) return/);
console.log('Worlds pinch, two-axis pan, edit/history rollback, cancellation, Move and Studio isolation passed');

// Run the real drawing entry point: both fill and strokes reuse rollback pixels.
vm.runInContext(source.slice(source.indexOf('function pushUndo('), source.indexOf('function captureSnapshot(')), c);
vm.runInContext(source.slice(source.indexOf('function startDrawing('), source.indexOf('function continueDrawing(')), c);
c.getCanvasPoint = () => ({ x: 10, y: 10 });
c.getPressure = () => 1;
c.paintDab = () => { pixels = 'dab'; };
c.floodFill = () => { pixels = 'fill'; };
let reads = 0;
c.captureSnapshot = () => { reads++; return { pixels, objects: structuredClone(c.state.sceneObjects) }; };
c.state.projectMode = 'forest';
c.state.forestMode = 'draw';
run('mobilePan = false');
for (const brush of ['marker', 'fill']) {
  c.state.brush = brush;
  pixels = 'before';
  const down = event(10);
  const beforeReads = reads;
  c.handleWorldPointerDown(down);
  const backup = run('worldEditBackup.snapshot');
  c.startDrawing(down);
  assert.equal(reads - beforeReads, 1, `${brush} reads canvas only once`);
  assert.equal(c.undoStack.at(-1), backup, 'Undo and cancellation share the same snapshot');
  assert.equal(backup.pixels, 'before', 'Drawing does not mutate the snapshot');
  c.handleWorldPointerDown(event(11, 200));
  assert.equal(pixels, 'before', `${brush} still rolls back when a second finger joins`);
  c.handleWorldPointerEnd(event(11, 200, 100, 'pointerup'));
  c.handleWorldPointerEnd(event(10, 100, 100, 'pointerup'));
}
c.state.projectMode = 'coloring';
const beforeReads = reads;
c.startDrawing(event(12));
assert.equal(reads - beforeReads, 1, 'Studio still creates its own undo snapshot');
console.log('Drawing and fill share one immutable rollback/undo snapshot; Studio keeps normal undo');
