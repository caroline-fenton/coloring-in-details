const CANVAS_SIZE = 1600;
const FOREST_WIDTH = 1920;
const FOREST_HEIGHT = 1200;
const DB_NAME = "color-studio-db";
const DB_VERSION = 1;
const ART_STORE = "artworks";
const META_STORE = "meta";
const AUTOSAVE_KEY = "color-studio-current";

const canvas = document.querySelector("#artCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const pictureStrip = document.querySelector("#pictureStrip");
const brushGrid = document.querySelector("#brushGrid");
const paletteTabs = document.querySelector("#paletteTabs");
const colorGrid = document.querySelector("#colorGrid");
const sizeRange = document.querySelector("#sizeRange");
const sizeRangeWrap = document.querySelector("#sizeRangeWrap");
const rangeSparkles = document.querySelector("#rangeSparkles");
const sizeOutput = document.querySelector("#sizeOutput");
const galleryGrid = document.querySelector("#galleryGrid");
const emptyGallery = document.querySelector("#emptyGallery");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#confirmDialog");
const celebration = document.querySelector("#celebration");
const forestModePanel = document.querySelector("#forestModePanel");
const forestBuildTools = document.querySelector("#forestBuildTools");
const objectGrid = document.querySelector("#objectGrid");
const objectSizeRange = document.querySelector("#objectSizeRange");
const objectSizeOutput = document.querySelector("#objectSizeOutput");
const canvasTip = document.querySelector("#canvasTip");

const studioDrawingLayer = document.createElement("canvas");
const forestDrawingLayer = document.createElement("canvas");
const templateLayer = document.createElement("canvas");
const scratchLayer = document.createElement("canvas");
const forestScratchLayer = document.createElement("canvas");
const sceneLayer = document.createElement("canvas");
for (const layer of [studioDrawingLayer, templateLayer, scratchLayer]) {
  layer.width = CANVAS_SIZE;
  layer.height = CANVAS_SIZE;
}
for (const layer of [forestDrawingLayer, forestScratchLayer, sceneLayer]) {
  layer.width = FOREST_WIDTH;
  layer.height = FOREST_HEIGHT;
}
let drawingLayer = studioDrawingLayer;
let drawingCtx = drawingLayer.getContext("2d", { willReadFrequently: true });
const templateCtx = templateLayer.getContext("2d", { willReadFrequently: true });
const scratchCtx = scratchLayer.getContext("2d", { willReadFrequently: true });
const forestScratchCtx = forestScratchLayer.getContext("2d", { willReadFrequently: true });
const sceneCtx = sceneLayer.getContext("2d");

const forestObjects = [
  { id: "tree", label: "Star Fairy", column: 0, row: 0 },
  { id: "pine", label: "Flower Fairy", column: 1, row: 0 },
  { id: "bush", label: "Magic Mushrooms", column: 2, row: 0 },
  { id: "rock", label: "Mushroom Cottage", column: 3, row: 0 },
  { id: "flower", label: "Forest Frog", column: 0, row: 1 },
  { id: "cloud", label: "Lily Frog", column: 1, row: 1 },
  { id: "sun", label: "Moon Ferns", column: 2, row: 1 },
  { id: "mushroom", label: "Glow Ferns", column: 3, row: 1 }
];
const forestSprite = new Image();
forestSprite.addEventListener("load", () => { renderScene(); draw(); });
forestSprite.src = "assets/forest/forest-sprites-clean.png";
const forestBackground = new Image();
forestBackground.addEventListener("load", () => { renderScene(); draw(); });
forestBackground.src = "assets/forest/enchanted-background-landscape.png";

const brushes = [
  { id: "marker", label: "Marker", icon: "✦", composite: "source-over", alpha: 0.88 },
  { id: "crayon", label: "Crayon", icon: "▧", composite: "source-over", alpha: 0.42 },
  { id: "paint", label: "Paint", icon: "●", composite: "source-over", alpha: 0.7 },
  { id: "neon", label: "Neon", icon: "✺", composite: "source-over", alpha: 0.95 },
  { id: "glitter", label: "Glitter", icon: "✷", composite: "source-over", alpha: 0.82 },
  { id: "sticker", label: "Stickers", icon: "♡", composite: "source-over", alpha: 1 },
  { id: "fill", label: "Fill", icon: "▣", composite: "source-over", alpha: 1 },
  { id: "eraser", label: "Erase", icon: "⌫", composite: "destination-out", alpha: 1 }
];

const palettes = [
  { id: "popsicle", label: "Popsicle", colors: ["#ea6fb1", "#f8d3d6", "#fbe9c8", "#a3e1cd", "#9ad9e0"] },
  { id: "sunrise", label: "Sunrise", colors: ["#e9ac6e", "#d87264", "#ac4a5e", "#7c3b5f", "#523464"] },
  { id: "moonrise", label: "Moonrise", colors: ["#202d61", "#665c95", "#aa87aa", "#df9d8e", "#f5bc7e"] },
  { id: "beach-towel", label: "Beach Towel", colors: ["#6865a9", "#479eb7", "#f1f1f1", "#9fc653", "#c1326e"] },
  { id: "summer-camp", label: "Summer Camp", colors: ["#e56b48", "#f09243", "#f6c84e", "#f1dfdb", "#5ac3f9"] },
  { id: "lime-time", label: "Lime Time", colors: ["#bffdbb", "#defdc6", "#f4fffd", "#d0fefd", "#bffbd8"] },
  { id: "bubblegum", label: "Bubblegum", colors: ["#fbe6f2", "#f6c7df", "#eda8cf", "#e78ec0", "#dc7ab0"] },
  { id: "twilight", label: "Twilight", colors: ["#b8aed8", "#837cb4", "#535391", "#31396d", "#192449"] },
  { id: "rainbow", label: "Rainbow", colors: ["#f0525f", "#f68a3d", "#f8d84e", "#61c96f", "#4fb5f5", "#8a68d8", "#ee78bf"] },
  { id: "cotton-candy", label: "Cotton Candy", colors: ["#f6e5a8", "#f4b7c4", "#cbb7e9", "#93d7f4", "#a9eadf", "#d8fbf2"] }
];

const pages = [
  { id: "kitten", label: "Kitten", token: "Cute", accent: "#f4bfdc", type: "raster-line", src: "assets/coloring-pages/anime-kitten.png" },
  { id: "artist", label: "Artist", token: "Draw", accent: "#b89ae8", type: "raster-line", src: "assets/coloring-pages/anime-artist.png" },
  { id: "moon", label: "Moon Pup", token: "Dream", accent: "#84679c", type: "raster-line", src: "assets/coloring-pages/anime-moon-puppy.png" },
  { id: "dragon", label: "Dragon", token: "Magic", accent: "#a7e5d8", type: "raster-line", src: "assets/coloring-pages/anime-dragon.png" },
  { id: "cat-hat", label: "Cat Hat", token: "Meow", accent: "#fff3a1", type: "raster-line", src: "assets/coloring-pages/animal-hat-cat.png" },
  { id: "bunny-hat", label: "Bunny Hat", token: "Hop", accent: "#f4bfdc", type: "raster-line", src: "assets/coloring-pages/animal-hat-bunny.png" },
  { id: "magic-kitty", label: "Magic Kitty", token: "Star", accent: "#fff3a1", type: "raster-line", src: "assets/coloring-pages/animal-magic-kitten.png" },
  { id: "fox-tea", label: "Fox Tea", token: "Cozy", accent: "#b89ae8", type: "raster-line", src: "assets/coloring-pages/animal-fox-tea.png" },
  { id: "paint-bunny", label: "Paint Bunny", token: "Art", accent: "#a7e5d8", type: "raster-line", src: "assets/coloring-pages/animal-bunny-artist.png" }
];

const stickerShapes = ["heart", "star", "flower", "spark"];

const pageAliases = {
  treehouse: "artist",
  rocket: "dragon",
  space: "moon",
  workshop: "dragon",
  castle: "kitten",
  flowers: "moon",
  house: "artist",
  slide: "dragon",
  swing: "moon",
  picnic: "kitten",
  robot: "dragon"
};

let state = {
  pageId: pages[0].id,
  brush: "fill",
  palette: palettes[0].id,
  color: palettes[0].colors[0],
  size: 18,
  drawing: false,
  lastPoint: null,
  dirty: false,
  projectMode: "coloring",
  forestMode: "build",
  sceneObjects: [],
  selectedObjectId: null,
  sceneGesture: null,
  objectSizeChanging: false
};

const histories = {
  coloring: { undo: [], redo: [] },
  forest: { undo: [], redo: [] }
};
let undoStack = histories.coloring.undo;
let redoStack = histories.coloring.redo;
let toastTimer = null;
let dbPromise = null;
let lastRangeSparkle = 0;
let artworkLoadToken = 0;

function activateWorkspace(mode) {
  document.body.classList.toggle("is-forest-workspace", mode === "forest");
  drawingLayer = mode === "forest" ? forestDrawingLayer : studioDrawingLayer;
  drawingCtx = drawingLayer.getContext("2d", { willReadFrequently: true });
  canvas.width = drawingLayer.width;
  canvas.height = drawingLayer.height;
  undoStack = histories[mode].undo;
  redoStack = histories[mode].redo;
  updateUndoRedo();
}

function activeWidth() { return drawingLayer.width; }
function activeHeight() { return drawingLayer.height; }

async function init() {
  renderControls();
  bindEvents();
  await restoreAutosave();
  activateWorkspace(state.projectMode);
  renderColors();
  updateSelectedControls();
  if (state.projectMode === "forest") {
    document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === "forest"));
  }
  if (state.projectMode === "forest") renderScene();
  else loadTemplate(state.pageId);
  pushUndo();
  draw();
  await renderGallery();
  updateUndoRedo();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function renderControls() {
  pictureStrip.innerHTML = pages.map((page) => `
    <button class="picture-button" type="button" data-page="${page.id}" style="--picture-accent:${page.accent}" aria-label="${page.label}">
      <img src="${page.src}" alt="" aria-hidden="true" loading="lazy" />
    </button>
  `).join("");
  brushGrid.innerHTML = brushes.map((brush) => `
    <button class="brush-button" type="button" data-brush="${brush.id}" title="${brush.label}" aria-label="${brush.label}">
      <span class="brush-icon" aria-hidden="true">${brush.icon}</span>
      <span class="brush-label" aria-hidden="true">${brush.label}</span>
    </button>
  `).join("");
  objectGrid.innerHTML = forestObjects.map((object) => `
    <button class="object-button" type="button" data-object="${object.id}" aria-label="Add ${object.label}">
      <span class="object-icon" aria-hidden="true" style="--sprite-x:${object.column * 33.333}%;--sprite-y:${object.row * 100}%"></span>
      <small>${object.label}</small>
    </button>
  `).join("");
  paletteTabs.innerHTML = palettes.map((palette) => `
    <button class="palette-button" type="button" data-palette="${palette.id}" aria-label="${palette.label}">
      <span class="palette-preview" aria-hidden="true" style="--palette-count:${palette.colors.length}">
        ${palette.colors.slice(0, 5).map((color) => `<span class="palette-dot" style="--dot:${color}"></span>`).join("")}
      </span>
      <span class="palette-label" aria-hidden="true">${palette.label}</span>
    </button>
  `).join("");
  renderColors();
  updateSelectedControls();
}

function renderColors() {
  const palette = currentPalette();
  colorGrid.innerHTML = palette.colors.map((color) => `<button class="color-swatch" type="button" data-color="${color}" style="--swatch:${color}" aria-label="${color}"></button>`).join("");
}

function currentPalette() {
  let palette = palettes.find((item) => item.id === state.palette);
  if (!palette) {
    state.palette = palettes[0].id;
    palette = palettes[0];
  }
  if (!palette.colors.includes(state.color)) {
    state.color = palette.colors[0];
  }
  return palette;
}

function updateSelectedControls() {
  document.querySelectorAll("[data-page]").forEach((button) => button.classList.toggle("is-active", button.dataset.page === state.pageId));
  document.querySelectorAll("[data-brush]").forEach((button) => button.classList.toggle("is-active", button.dataset.brush === state.brush));
  document.querySelectorAll("[data-palette]").forEach((button) => button.classList.toggle("is-active", button.dataset.palette === state.palette));
  document.querySelectorAll("[data-color]").forEach((button) => button.classList.toggle("is-active", button.dataset.color === state.color));
  sizeRange.value = String(state.size);
  updateSizeRange();
  updateSizePreview();
  updateForestControls();
}

function updateForestControls() {
  const inForest = state.projectMode === "forest";
  const building = inForest && state.forestMode === "build";
  forestModePanel.classList.toggle("is-hidden", !inForest);
  forestBuildTools.classList.toggle("is-hidden", !building);
  document.querySelectorAll(".studio-only").forEach((element) => element.classList.toggle("is-hidden", inForest));
  document.querySelectorAll(".draw-tools").forEach((element) => element.classList.toggle("is-hidden", building));
  document.querySelectorAll("[data-forest-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.forestMode === state.forestMode));
  document.querySelector("#forestHint").textContent = building
    ? "Tap an object, then drag it into your scene."
    : "Draw, color, and add stickers over your finished forest.";
  const selected = selectedSceneObject();
  document.querySelectorAll("[data-object]").forEach((button) => button.classList.toggle("is-active", button.dataset.object === selected?.type));
  document.querySelectorAll("[data-action='deleteObject'], [data-action='duplicateObject']").forEach((button) => { button.disabled = !selected; });
  objectSizeRange.disabled = !selected;
  if (selected) objectSizeRange.value = String(Math.round(selected.scale * 100));
  objectSizeOutput.value = selected ? `${Math.round(selected.scale * 100)}%` : "Pick one";
  updateObjectSizeRange();
  canvasTip.classList.toggle("is-hidden", !building || !selected);
  canvas.setAttribute("aria-label", building ? "Forest scene builder. Drag objects to move and use the corner handle to resize." : "Artwork surface");
}

function updateSizePreview() {
  const previewSize = Math.max(8, Math.min(34, Math.round(state.size * 0.46)));
  sizeOutput.style.setProperty("--preview-size", `${previewSize}px`);
  sizeOutput.style.setProperty("--preview-color", state.brush === "eraser" ? "var(--paper)" : state.color);
  sizeOutput.dataset.brush = state.brush;
  sizeOutput.setAttribute("aria-label", `${activeBrush().label} size preview`);
}

function updateSizeRange({ sparkle = false } = {}) {
  const min = Number(sizeRange.min);
  const max = Number(sizeRange.max);
  const progress = (Number(sizeRange.value) - min) / (max - min);
  const sunsetColor = interpolateSunsetColor(progress);
  sizeRange.style.setProperty("--range-progress", `${(progress * 100).toFixed(2)}%`);
  sizeRange.style.setProperty("--slider-sunset", sunsetColor);
  if (sparkle) emitRangeSparkles(progress, sunsetColor);
}

function updateObjectSizeRange() {
  const min = Number(objectSizeRange.min);
  const max = Number(objectSizeRange.max);
  const progress = (Number(objectSizeRange.value) - min) / (max - min);
  objectSizeRange.style.setProperty("--range-progress", `${(progress * 100).toFixed(2)}%`);
  objectSizeRange.style.setProperty("--slider-sunset", interpolateSunsetColor(progress));
}

function interpolateSunsetColor(progress) {
  const stops = ["#c9b4ee", "#dc91d0", "#f197a6", "#f4bd72"];
  const scaled = Math.min(1, Math.max(0, progress)) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const from = stops[index].match(/\w\w/g).map((value) => parseInt(value, 16));
  const to = stops[index + 1].match(/\w\w/g).map((value) => parseInt(value, 16));
  const channels = from.map((value, channel) => Math.round(value + (to[channel] - value) * mix));
  return `rgb(${channels.join(" ")})`;
}

function emitRangeSparkles(progress, color) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const now = performance.now();
  if (now - lastRangeSparkle < 38) return;
  lastRangeSparkle = now;
  const thumbInset = 11.5;
  const x = thumbInset + progress * Math.max(0, sizeRange.clientWidth - thumbInset * 2);
  const sparkleColors = [color, "#7c3b5f", "#d87264"];
  for (let index = 0; index < 3; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "range-sparkle";
    sparkle.style.setProperty("--sparkle-x", `${x}px`);
    sparkle.style.setProperty("--sparkle-size", `${7 + Math.random() * 5}px`);
    sparkle.style.setProperty("--sparkle-color", sparkleColors[index]);
    sparkle.style.setProperty("--sparkle-drift", `${(Math.random() - 0.5) * 4}px`);
    sparkle.style.setProperty("--sparkle-rise", `${1 + Math.random() * 3}px`);
    sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
    rangeSparkles.appendChild(sparkle);
  }
}

function bindEvents() {
  objectGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-object]");
    if (button) addSceneObject(button.dataset.object);
  });
  document.querySelectorAll("[data-forest-mode]").forEach((button) => button.addEventListener("click", () => setForestMode(button.dataset.forestMode)));
  document.querySelector("[data-action='deleteObject']").addEventListener("click", deleteSelectedObject);
  document.querySelector("[data-action='duplicateObject']").addEventListener("click", duplicateSelectedObject);
  document.querySelector("[data-action='resetForest']").addEventListener("click", resetForest);
  objectSizeRange.addEventListener("input", () => {
    beginObjectSizeChange();
    resizeSelectedObject();
  });
  objectSizeRange.addEventListener("change", endObjectSizeChange);
  objectSizeRange.addEventListener("pointerup", endObjectSizeChange);
  objectSizeRange.addEventListener("pointercancel", endObjectSizeChange);
  objectSizeRange.addEventListener("blur", endObjectSizeChange);
  pictureStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button || button.dataset.page === state.pageId) return;
    confirmAction("Change picture?", "Your current drawing will be cleared from the studio.", () => {
      state.pageId = button.dataset.page;
      clearDrawing();
      loadTemplate(state.pageId);
      pushUndo();
      draw();
      autosave();
      updateSelectedControls();
    });
  });

  brushGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-brush]");
    if (!button) return;
    state.brush = button.dataset.brush;
    updateSelectedControls();
  });

  paletteTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-palette]");
    if (!button) return;
    state.palette = button.dataset.palette;
    state.color = currentPalette().colors[0];
    renderColors();
    updateSelectedControls();
  });

  colorGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    state.color = button.dataset.color;
    if (state.brush === "eraser") state.brush = "marker";
    updateSelectedControls();
  });

  sizeRange.addEventListener("input", () => {
    state.size = Number(sizeRange.value);
    updateSizePreview();
    updateSizeRange({ sparkle: true });
  });
  sizeRange.addEventListener("pointerdown", () => sizeRangeWrap.classList.add("is-sliding"));
  sizeRange.addEventListener("pointerup", () => sizeRangeWrap.classList.remove("is-sliding"));
  sizeRange.addEventListener("pointercancel", () => sizeRangeWrap.classList.remove("is-sliding"));
  sizeRange.addEventListener("blur", () => sizeRangeWrap.classList.remove("is-sliding"));

  document.querySelector("[data-action='undo']").addEventListener("click", undo);
  document.querySelector("[data-action='redo']").addEventListener("click", redo);
  document.querySelector("[data-action='save']").addEventListener("click", saveArtwork);
  document.querySelector("[data-action='new']").addEventListener("click", () => {
    const isForest = state.projectMode === "forest";
    confirmAction(isForest ? "Start a new forest?" : "Start a new picture?", isForest ? "Your current forest scene and coloring will be cleared." : "Your current drawing will be cleared from the studio.", () => {
      clearDrawing();
      pushUndo();
      draw();
      autosave();
    });
  });
  document.querySelector("[data-action='download']").addEventListener("click", downloadArtwork);
  document.querySelector("[data-action='backToStudio']").addEventListener("click", () => setView("studio"));

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", continueDrawing);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  canvas.addEventListener("lostpointercapture", stopDrawing);

  window.addEventListener("beforeunload", autosave);
}

function setView(view) {
  artworkLoadToken += 1;
  const studioView = view === "studio" || view === "forest";
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== (studioView ? "studio" : view)));
  if (studioView) {
    const nextMode = view === "forest" ? "forest" : "coloring";
    if (nextMode !== state.projectMode) {
      state.projectMode = nextMode;
      activateWorkspace(nextMode);
      state.selectedObjectId = null;
      templateCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      if (nextMode === "coloring") loadTemplate(state.pageId);
      renderScene();
      if (!undoStack.length) pushUndo();
      draw();
      updateSelectedControls();
      autosave();
    }
  }
  if (view === "gallery") renderGallery();
}

function loadTemplate(pageId) {
  const page = getPage(pageId);
  state.pageId = page.id;
  const image = new Image();
  image.onload = () => {
    if (state.projectMode !== "coloring" || state.pageId !== page.id) return;
    if (page.type === "raster-line") buildRasterLineTemplate(image);
    else buildLineArtTemplate(image);
    draw();
  };
  image.src = page.src;
}

function getPage(pageId) {
  const normalizedId = pageAliases[pageId] || pageId;
  return pages.find((item) => item.id === normalizedId) || pages[0];
}

function buildLineArtTemplate(image) {
  scratchCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  templateCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const scale = Math.min(CANVAS_SIZE / image.naturalWidth, CANVAS_SIZE / image.naturalHeight) * 0.94;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (CANVAS_SIZE - width) / 2;
  const y = (CANVAS_SIZE - height) / 2;
  scratchCtx.fillStyle = "#fffdf7";
  scratchCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  scratchCtx.drawImage(image, x, y, width, height);
  const imageData = scratchCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const data = imageData.data;
  const pixelCount = CANVAS_SIZE * CANVAS_SIZE;
  const luminance = new Uint8Array(pixelCount);
  const edges = new Uint8Array(pixelCount);
  const output = templateCtx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  for (let pixel = 0, offset = 0; pixel < pixelCount; pixel += 1, offset += 4) {
    luminance[pixel] = data[offset + 3] < 35 ? 255 : Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
  }
  for (let yPos = 2; yPos < CANVAS_SIZE - 2; yPos += 1) {
    for (let xPos = 2; xPos < CANVAS_SIZE - 2; xPos += 1) {
      const pixel = yPos * CANVAS_SIZE + xPos;
      const lum = luminance[pixel];
      if (lum > 178) continue;
      const neighbor = Math.max(
        luminance[pixel - 2],
        luminance[pixel + 2],
        luminance[pixel - CANVAS_SIZE * 2],
        luminance[pixel + CANVAS_SIZE * 2]
      );
      if (neighbor - lum > 28) edges[pixel] = 1;
    }
  }
  for (let yPos = 2; yPos < CANVAS_SIZE - 2; yPos += 1) {
    for (let xPos = 2; xPos < CANVAS_SIZE - 2; xPos += 1) {
      const pixel = yPos * CANVAS_SIZE + xPos;
      if (!edges[pixel]) continue;
      for (let oy = -2; oy <= 2; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          if (Math.abs(ox) + Math.abs(oy) > 3) continue;
          const outPixel = (yPos + oy) * CANVAS_SIZE + xPos + ox;
          const offset = outPixel * 4;
          output.data[offset] = 34;
          output.data[offset + 1] = 32;
          output.data[offset + 2] = 49;
          output.data[offset + 3] = 245;
        }
      }
    }
  }
  templateCtx.putImageData(output, 0, 0);
}

function buildRasterLineTemplate(image) {
  scratchCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  templateCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const scale = Math.min(CANVAS_SIZE / image.naturalWidth, CANVAS_SIZE / image.naturalHeight) * 0.985;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (CANVAS_SIZE - width) / 2;
  const y = (CANVAS_SIZE - height) / 2;
  scratchCtx.fillStyle = "#fffdf7";
  scratchCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  scratchCtx.drawImage(image, x, y, width, height);
  const imageData = scratchCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    if (lum < 218) {
      const alpha = Math.min(255, Math.max(34, (232 - lum) * 3.1));
      data[index] = 34;
      data[index + 1] = 32;
      data[index + 2] = 49;
      data[index + 3] = alpha;
    } else {
      data[index + 3] = 0;
    }
  }
  templateCtx.putImageData(imageData, 0, 0);
}

function draw() {
  const width = activeWidth();
  const height = activeHeight();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, width, height);
  if (state.projectMode === "forest") {
    ctx.drawImage(sceneLayer, 0, 0);
    ctx.drawImage(drawingLayer, 0, 0);
  } else {
    ctx.drawImage(templateLayer, 0, 0);
    ctx.drawImage(drawingLayer, 0, 0);
    ctx.drawImage(templateLayer, 0, 0);
  }
  if (state.projectMode === "forest" && state.forestMode === "build") drawSelection();
}

function startDrawing(event) {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  const point = getCanvasPoint(event);
  if (state.projectMode === "forest" && state.forestMode === "build") {
    startSceneGesture(point);
    return;
  }
  state.drawing = true;
  state.lastPoint = point;
  if (state.brush === "fill") {
    pushUndo();
    floodFill(point.x, point.y, state.color);
    state.drawing = false;
    state.dirty = true;
    redoStack.length = 0;
    draw();
    autosave();
    updateUndoRedo();
    return;
  }
  pushUndo();
  paintDab(point, getPressure(event));
  draw();
}

function continueDrawing(event) {
  if (state.projectMode === "forest" && state.forestMode === "build") {
    if (!state.sceneGesture) return;
    event.preventDefault();
    continueSceneGesture(getCanvasPoint(event));
    return;
  }
  if (!state.drawing || state.brush === "fill") return;
  event.preventDefault();
  const point = getCanvasPoint(event);
  paintStroke(state.lastPoint, point, getPressure(event));
  state.lastPoint = point;
  state.dirty = true;
  draw();
}

function stopDrawing() {
  if (state.sceneGesture) {
    const gesture = state.sceneGesture;
    state.sceneGesture = null;
    if (gesture.changed) commitSceneChange();
    else {
      draw();
      updateForestControls();
    }
    return;
  }
  if (!state.drawing) return;
  state.drawing = false;
  state.lastPoint = null;
  redoStack.length = 0;
  autosave();
  updateUndoRedo();
}

function setForestMode(mode) {
  state.forestMode = mode;
  state.sceneGesture = null;
  renderScene();
  draw();
  updateForestControls();
  autosave();
}

function addSceneObject(type) {
  pushUndo();
  const count = state.sceneObjects.length;
  const object = {
    id: `${type}-${Date.now()}-${count}`,
    type,
    x: FOREST_WIDTH / 2 + ((count % 5) - 2) * 78,
    y: type === "cloud" || type === "sun" ? 280 + (count % 3) * 46 : 760 + (count % 4) * 42,
    scale: type === "flower" ? 0.75 : 1,
    rotation: ((count % 5) - 2) * 0.035
  };
  state.sceneObjects.push(object);
  state.selectedObjectId = object.id;
  redoStack.length = 0;
  state.dirty = true;
  renderScene();
  draw();
  updateForestControls();
  autosave();
}

function selectedSceneObject() {
  return state.sceneObjects.find((object) => object.id === state.selectedObjectId) || null;
}

function sceneObjectBounds(object) {
  const size = baseObjectSize(object.type) * object.scale;
  return { left: object.x - size / 2, top: object.y - size / 2, right: object.x + size / 2, bottom: object.y + size / 2, size };
}

function baseObjectSize(type) {
  return ({ tree: 330, pine: 340, bush: 350, rock: 360, flower: 300, cloud: 310, sun: 350, mushroom: 350 })[type] || 320;
}

function hitSceneObject(point) {
  for (let index = state.sceneObjects.length - 1; index >= 0; index -= 1) {
    const object = state.sceneObjects[index];
    const bounds = sceneObjectBounds(object);
    if (point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom) return object;
  }
  return null;
}

function startSceneGesture(point) {
  const selected = selectedSceneObject();
  if (selected) {
    const bounds = sceneObjectBounds(selected);
    if (Math.hypot(point.x - bounds.right, point.y - bounds.bottom) < 100) {
      state.sceneGesture = { kind: "resize", start: point, startScale: selected.scale, objectId: selected.id, changed: false };
      return;
    }
  }
  const object = hitSceneObject(point);
  state.selectedObjectId = object?.id || null;
  if (object) {
    state.sceneGesture = { kind: "move", start: point, startX: object.x, startY: object.y, objectId: object.id, changed: false };
  }
  draw();
  updateForestControls();
}

function continueSceneGesture(point) {
  const gesture = state.sceneGesture;
  const object = state.sceneObjects.find((item) => item.id === gesture.objectId);
  if (!object) return;
  if (gesture.kind === "move") {
    const nextX = clamp(gesture.startX + point.x - gesture.start.x, 70, FOREST_WIDTH - 70);
    const nextY = clamp(gesture.startY + point.y - gesture.start.y, 70, FOREST_HEIGHT - 70);
    if (!gesture.changed && Math.hypot(nextX - gesture.startX, nextY - gesture.startY) < 2) return;
    if (!gesture.changed) pushUndo();
    gesture.changed = true;
    object.x = nextX;
    object.y = nextY;
  } else {
    const startDistance = Math.max(40, Math.hypot(gesture.start.x - object.x, gesture.start.y - object.y));
    const nextDistance = Math.hypot(point.x - object.x, point.y - object.y);
    const nextScale = clamp(gesture.startScale * nextDistance / startDistance, 0.45, 1.9);
    if (!gesture.changed && Math.abs(nextScale - gesture.startScale) < 0.005) return;
    if (!gesture.changed) pushUndo();
    gesture.changed = true;
    object.scale = nextScale;
  }
  state.dirty = true;
  renderScene();
  draw();
  updateForestControls();
}

function resizeSelectedObject() {
  const object = selectedSceneObject();
  if (!object) return;
  object.scale = Number(objectSizeRange.value) / 100;
  objectSizeOutput.value = `${objectSizeRange.value}%`;
  updateObjectSizeRange();
  state.dirty = true;
  renderScene();
  draw();
}

function beginObjectSizeChange() {
  if (!selectedSceneObject() || state.objectSizeChanging) return;
  pushUndo();
  state.objectSizeChanging = true;
}

function endObjectSizeChange() {
  if (!state.objectSizeChanging) return;
  state.objectSizeChanging = false;
  commitSceneChange();
}

function commitSceneChange() {
  redoStack.length = 0;
  renderScene();
  draw();
  updateUndoRedo();
  updateForestControls();
  autosave();
}

function deleteSelectedObject() {
  if (!selectedSceneObject()) return;
  pushUndo();
  state.sceneObjects = state.sceneObjects.filter((object) => object.id !== state.selectedObjectId);
  state.selectedObjectId = null;
  state.dirty = true;
  commitSceneChange();
}

function duplicateSelectedObject() {
  const selected = selectedSceneObject();
  if (!selected) return;
  pushUndo();
  const halfSize = baseObjectSize(selected.type) * selected.scale / 2;
  const copy = {
    ...selected,
    id: `${selected.type}-${Date.now()}`,
    x: clamp(selected.x + 90, halfSize, FOREST_WIDTH - halfSize),
    y: clamp(selected.y + 70, halfSize, FOREST_HEIGHT - halfSize)
  };
  state.sceneObjects.push(copy);
  state.selectedObjectId = copy.id;
  state.dirty = true;
  commitSceneChange();
}

function resetForest() {
  confirmAction("Start over with a new forest?", "This clears every placed object and all coloring in your current forest.", () => {
    clearDrawing();
    pushUndo();
    draw();
    autosave();
    updateSelectedControls();
    showToast("Forest cleared");
  });
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function renderScene() {
  sceneCtx.clearRect(0, 0, FOREST_WIDTH, FOREST_HEIGHT);
  if (state.projectMode !== "forest") return;
  if (forestBackground.complete && forestBackground.naturalWidth) {
    sceneCtx.drawImage(forestBackground, 0, 0, FOREST_WIDTH, FOREST_HEIGHT);
    const vignette = sceneCtx.createRadialGradient(800, 720, 260, 800, 720, 1120);
    vignette.addColorStop(0, "rgba(48,36,58,0)");
    vignette.addColorStop(1, "rgba(48,36,58,.22)");
    sceneCtx.fillStyle = vignette;
    sceneCtx.fillRect(0, 0, FOREST_WIDTH, FOREST_HEIGHT);
    state.sceneObjects.forEach(drawSceneObject);
    return;
  }
  const sky = sceneCtx.createLinearGradient(0, 0, 0, FOREST_HEIGHT);
  sky.addColorStop(0, "#eee6fb");
  sky.addColorStop(0.42, "#e5f6f5");
  sky.addColorStop(0.67, "#fff8e5");
  sky.addColorStop(0.675, "#dceecb");
  sky.addColorStop(1, "#acd59f");
  sceneCtx.fillStyle = sky;
  sceneCtx.fillRect(0, 0, FOREST_WIDTH, FOREST_HEIGHT);
  const glow = sceneCtx.createRadialGradient(1240, 270, 30, 1240, 270, 500);
  glow.addColorStop(0, "rgba(255,243,183,.72)");
  glow.addColorStop(1, "rgba(255,243,183,0)");
  sceneCtx.fillStyle = glow;
  sceneCtx.fillRect(0, 0, FOREST_WIDTH, 700);
  sceneCtx.fillStyle = "rgba(255,255,255,.30)";
  sceneCtx.beginPath();
  sceneCtx.moveTo(0, 1160); sceneCtx.quadraticCurveTo(380, 900, 820, 1110); sceneCtx.quadraticCurveTo(1220, 890, 1600, 1060); sceneCtx.lineTo(1600, 1600); sceneCtx.lineTo(0, 1600); sceneCtx.fill();
  sceneCtx.fillStyle = "rgba(255,245,221,.42)";
  sceneCtx.beginPath(); sceneCtx.moveTo(650,1600); sceneCtx.bezierCurveTo(690,1410,820,1280,920,1110); sceneCtx.bezierCurveTo(1010,1300,1090,1470,1150,1600); sceneCtx.closePath(); sceneCtx.fill();
  sceneCtx.globalAlpha = .22;
  for (let index = 0; index < 70; index += 1) {
    const x = (index * 227) % FOREST_WIDTH;
    const y = 1080 + ((index * 89) % 500);
    sceneCtx.fillStyle = index % 3 === 0 ? "#fff6ae" : index % 3 === 1 ? "#f4a9ce" : "#ffffff";
    sceneCtx.beginPath(); sceneCtx.arc(x, y, 3 + (index % 5), 0, Math.PI * 2); sceneCtx.fill();
  }
  sceneCtx.globalAlpha = 1;
  state.sceneObjects.forEach(drawSceneObject);
}

function drawSceneObject(object) {
  const s = baseObjectSize(object.type) * object.scale;
  const c = sceneCtx;
  const sprite = forestObjects.find((item) => item.id === object.type);
  c.save(); c.translate(object.x, object.y); c.rotate(object.rotation); c.lineJoin = "round"; c.lineCap = "round"; c.lineWidth = Math.max(8, s * .035); c.strokeStyle = "#55445f";
  if (sprite && forestSprite.complete && forestSprite.naturalWidth) {
    const sourceWidth = forestSprite.naturalWidth / 4;
    const sourceCellHeight = forestSprite.naturalHeight / 2;
    const sourceY = sprite.row === 0 ? 0 : sourceCellHeight;
    const sourceHeight = sprite.row === 0 ? Math.min(forestSprite.naturalHeight, sourceCellHeight + 48) : sourceCellHeight;
    c.drawImage(forestSprite, sprite.column * sourceWidth, sourceY, sourceWidth, sourceHeight, -s / 2, -s * .59, s, s * 1.18);
    c.restore();
    return;
  }
  const fillStroke = (fill) => { c.fillStyle = fill; c.fill(); c.stroke(); };
  if (object.type === "tree" || object.type === "pine") {
    c.beginPath(); c.roundRect(-s*.12, -s*.05, s*.24, s*.52, s*.08); fillStroke("#b77a58");
    if (object.type === "tree") {
      [[0,-.28,.31],[-.2,-.12,.25],[.2,-.12,.25]].forEach(([x,y,r]) => { c.beginPath(); c.arc(x*s,y*s,r*s,0,Math.PI*2); fillStroke("#78bd78"); });
    } else {
      [-.34,-.16,.02].forEach((y,index) => { c.beginPath(); c.moveTo(0,(y-.3)*s); c.lineTo((-0.33+index*.035)*s,(y+.25)*s); c.lineTo((.33-index*.035)*s,(y+.25)*s); c.closePath(); fillStroke(index === 0 ? "#5aa878" : "#6bb984"); });
    }
  } else if (object.type === "bush") {
    [[-.25,.03,.23],[0,-.12,.29],[.25,.03,.23],[0,.13,.3]].forEach(([x,y,r]) => { c.beginPath(); c.arc(x*s,y*s,r*s,0,Math.PI*2); fillStroke("#72bf75"); });
  } else if (object.type === "rock") {
    c.beginPath(); c.moveTo(-s*.42,s*.25); c.quadraticCurveTo(-s*.38,-s*.2,-s*.12,-s*.34); c.quadraticCurveTo(s*.34,-s*.4,s*.43,s*.22); c.closePath(); fillStroke("#aaa9ba");
  } else if (object.type === "cloud") {
    [[-.25,.08,.23],[0,-.08,.3],[.27,.08,.22],[0,.16,.37]].forEach(([x,y,r]) => { c.beginPath(); c.arc(x*s,y*s,r*s,0,Math.PI*2); fillStroke("#ffffff"); });
  } else if (object.type === "sun") {
    c.strokeStyle="#e8a83b"; c.lineWidth=s*.055; for(let i=0;i<12;i+=1){const a=i*Math.PI/6;c.beginPath();c.moveTo(Math.cos(a)*s*.34,Math.sin(a)*s*.34);c.lineTo(Math.cos(a)*s*.48,Math.sin(a)*s*.48);c.stroke();} c.beginPath();c.arc(0,0,s*.27,0,Math.PI*2);fillStroke("#ffd96d");
  } else if (object.type === "flower") {
    c.strokeStyle="#5e9e67"; c.lineWidth=s*.04; c.beginPath();c.moveTo(0,s*.4);c.lineTo(0,0);c.stroke(); for(let i=0;i<7;i+=1){const a=i*Math.PI*2/7;c.beginPath();c.ellipse(Math.cos(a)*s*.19,Math.sin(a)*s*.19,s*.12,s*.2,a,0,Math.PI*2);fillStroke("#f4a9cf");} c.beginPath();c.arc(0,0,s*.12,0,Math.PI*2);fillStroke("#ffd361");
  } else if (object.type === "mushroom") {
    c.beginPath();c.roundRect(-s*.13,-s*.02,s*.26,s*.42,s*.1);fillStroke("#fff0d3"); c.beginPath();c.arc(0,-s*.06,s*.36,Math.PI,0);c.closePath();fillStroke("#dc789f"); c.fillStyle="#fff8ed";[-.18,0,.18].forEach((x)=>{c.beginPath();c.arc(x*s,-s*.16,s*.055,0,Math.PI*2);c.fill();});
  }
  c.restore();
}

function drawSelection() {
  const object = selectedSceneObject();
  if (!object) return;
  const bounds = sceneObjectBounds(object);
  ctx.save(); ctx.strokeStyle = "#ec65ad"; ctx.lineWidth = 10; ctx.setLineDash([22, 14]); ctx.strokeRect(bounds.left, bounds.top, bounds.size, bounds.size); ctx.setLineDash([]); ctx.fillStyle = "#ec65ad"; ctx.strokeStyle="#fff";ctx.lineWidth=8;ctx.beginPath();ctx.arc(bounds.right,bounds.bottom,34,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}

function getPressure(event) {
  return event.pressure && event.pressure > 0 ? event.pressure : 0.65;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) / rect.width) * activeWidth()),
    y: Math.round(((event.clientY - rect.top) / rect.height) * activeHeight())
  };
}

function activeBrush() {
  return brushes.find((brush) => brush.id === state.brush);
}

function configureBrush(context, pressure = 0.65) {
  const brush = activeBrush();
  context.globalCompositeOperation = brush.composite;
  context.globalAlpha = brush.alpha;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = state.color;
  context.fillStyle = state.color;
  context.lineWidth = Math.max(2, state.size * (0.72 + pressure * 0.55));
  context.shadowBlur = state.brush === "neon" ? state.size * 0.7 : 0;
  context.shadowColor = state.brush === "neon" ? state.color : "transparent";
}

function paintDab(point, pressure) {
  if (state.brush === "sticker") {
    drawSticker(point);
    return;
  }
  configureBrush(drawingCtx, pressure);
  if (state.brush === "crayon") {
    crayonDab(point);
  } else if (state.brush === "glitter") {
    glitterDab(point, pressure);
  } else {
    drawingCtx.beginPath();
    drawingCtx.arc(point.x, point.y, Math.max(1, drawingCtx.lineWidth / 2), 0, Math.PI * 2);
    drawingCtx.fill();
  }
  resetContext(drawingCtx);
}

function paintStroke(from, to, pressure) {
  if (state.brush === "sticker") {
    stickerStroke(from, to);
    return;
  }
  configureBrush(drawingCtx, pressure);
  if (state.brush === "crayon") {
    crayonStroke(from, to);
  } else if (state.brush === "glitter") {
    drawingCtx.beginPath();
    drawingCtx.moveTo(from.x, from.y);
    drawingCtx.lineTo(to.x, to.y);
    drawingCtx.stroke();
    glitterStroke(from, to, pressure);
  } else if (state.brush === "paint") {
    drawingCtx.beginPath();
    drawingCtx.moveTo(from.x, from.y);
    drawingCtx.quadraticCurveTo(from.x, from.y, (from.x + to.x) / 2, (from.y + to.y) / 2);
    drawingCtx.stroke();
    paintDab(to, pressure);
  } else {
    drawingCtx.beginPath();
    drawingCtx.moveTo(from.x, from.y);
    drawingCtx.lineTo(to.x, to.y);
    drawingCtx.stroke();
  }
  resetContext(drawingCtx);
}

function crayonDab(point) {
  const radius = state.size * 0.7;
  for (let i = 0; i < 12; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    drawingCtx.globalAlpha = 0.18;
    drawingCtx.beginPath();
    drawingCtx.arc(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, Math.random() * radius * 0.34 + 2, 0, Math.PI * 2);
    drawingCtx.fill();
  }
}

function crayonStroke(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 7));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    crayonDab({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
  }
}

function glitterDab(point, pressure) {
  drawingCtx.beginPath();
  drawingCtx.arc(point.x, point.y, Math.max(1, drawingCtx.lineWidth / 2), 0, Math.PI * 2);
  drawingCtx.fill();
  const count = Math.max(4, Math.round(state.size / 5));
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * state.size * 1.2;
    drawSparkle(
      point.x + Math.cos(angle) * distance,
      point.y + Math.sin(angle) * distance,
      Math.max(5, state.size * (0.18 + pressure * 0.12)),
      i % 2 === 0 ? "#ffffff" : state.color
    );
  }
}

function glitterStroke(from, to, pressure) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(14, state.size * 0.7)));
  for (let i = 0; i <= steps; i += 1) {
    if (Math.random() < 0.45) continue;
    const t = i / steps;
    glitterDab({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, pressure);
  }
}

function stickerStroke(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.floor(distance / Math.max(54, state.size * 2.1)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    drawSticker({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
  }
}

function drawSticker(point) {
  const shape = stickerShapes[Math.floor((point.x + point.y + Date.now() / 200) % stickerShapes.length)];
  const size = Math.max(28, state.size * 2.25);
  drawingCtx.save();
  drawingCtx.translate(point.x, point.y);
  drawingCtx.rotate(((point.x - point.y) % 32) * Math.PI / 180);
  drawingCtx.globalCompositeOperation = "source-over";
  drawingCtx.lineWidth = Math.max(6, size * 0.13);
  drawingCtx.strokeStyle = state.color;
  drawingCtx.fillStyle = "rgba(255,255,255,0.86)";
  drawingCtx.shadowBlur = size * 0.12;
  drawingCtx.shadowColor = "rgba(34,32,49,0.22)";
  if (shape === "heart") drawHeart(size);
  if (shape === "star") drawStar(size);
  if (shape === "flower") drawFlower(size);
  if (shape === "spark") drawSparkle(0, 0, size * 0.72, state.color);
  drawingCtx.restore();
}

function drawHeart(size) {
  const s = size / 32;
  drawingCtx.beginPath();
  drawingCtx.moveTo(0, 10 * s);
  drawingCtx.bezierCurveTo(-26 * s, -8 * s, -12 * s, -28 * s, 0, -12 * s);
  drawingCtx.bezierCurveTo(12 * s, -28 * s, 26 * s, -8 * s, 0, 10 * s);
  drawingCtx.fill();
  drawingCtx.stroke();
}

function drawStar(size) {
  const outer = size * 0.46;
  const inner = outer * 0.45;
  drawingCtx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) drawingCtx.moveTo(x, y);
    else drawingCtx.lineTo(x, y);
  }
  drawingCtx.closePath();
  drawingCtx.fill();
  drawingCtx.stroke();
}

function drawFlower(size) {
  const petal = size * 0.18;
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    drawingCtx.beginPath();
    drawingCtx.ellipse(Math.cos(angle) * petal * 1.55, Math.sin(angle) * petal * 1.55, petal, petal * 1.35, angle, 0, Math.PI * 2);
    drawingCtx.fill();
    drawingCtx.stroke();
  }
  drawingCtx.beginPath();
  drawingCtx.arc(0, 0, petal * 0.92, 0, Math.PI * 2);
  drawingCtx.fillStyle = "#f6c84e";
  drawingCtx.fill();
  drawingCtx.stroke();
}

function drawSparkle(x, y, size, color) {
  drawingCtx.save();
  drawingCtx.translate(x, y);
  drawingCtx.fillStyle = color;
  drawingCtx.strokeStyle = color;
  drawingCtx.globalAlpha = 0.88;
  drawingCtx.beginPath();
  drawingCtx.moveTo(0, -size);
  drawingCtx.lineTo(size * 0.22, -size * 0.22);
  drawingCtx.lineTo(size, 0);
  drawingCtx.lineTo(size * 0.22, size * 0.22);
  drawingCtx.lineTo(0, size);
  drawingCtx.lineTo(-size * 0.22, size * 0.22);
  drawingCtx.lineTo(-size, 0);
  drawingCtx.lineTo(-size * 0.22, -size * 0.22);
  drawingCtx.closePath();
  drawingCtx.fill();
  drawingCtx.restore();
}

function resetContext(context) {
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.shadowBlur = 0;
  context.shadowColor = "transparent";
}

function floodFill(x, y, color) {
  const width = activeWidth();
  const height = activeHeight();
  const fillScratchCtx = state.projectMode === "forest" ? forestScratchCtx : scratchCtx;
  fillScratchCtx.clearRect(0, 0, width, height);
  fillScratchCtx.fillStyle = "#fffdf7";
  fillScratchCtx.fillRect(0, 0, width, height);
  if (state.projectMode === "forest") fillScratchCtx.drawImage(sceneLayer, 0, 0);
  else fillScratchCtx.drawImage(templateLayer, 0, 0);
  fillScratchCtx.drawImage(drawingLayer, 0, 0);
  if (state.projectMode === "coloring") fillScratchCtx.drawImage(templateLayer, 0, 0);
  const imageData = fillScratchCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const templateData = state.projectMode === "coloring" ? templateCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data : null;
  const isTemplateLine = (index) => {
    if (!templateData) return false;
    const px = index % width;
    const py = Math.floor(index / width);
    for (let dy = -1; dy <= 1; dy += 1) {
      const y = py + dy;
      if (y < 0 || y >= height) continue;
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = px + dx;
        if (x < 0 || x >= width) continue;
        if (templateData[(y * width + x) * 4 + 3] > 0) return true;
      }
    }
    return false;
  };
  const start = (y * width + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const fill = hexToRgba(color);
  const startIndex = y * width + x;
  if (colorDistance(target, fill) < 16 || isTemplateLine(startIndex) || isLineColor(target)) return;
  const mask = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  queue[tail] = startIndex;
  mask[startIndex] = 2;
  tail += 1;
  const tolerance = 42;
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const px = index % width;
    const py = Math.floor(index / width);
    const offset = index * 4;
    const current = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
    if (isTemplateLine(index) || isLineColor(current) || colorDistance(current, target) > tolerance) continue;
    mask[index] = 1;
    if (px + 1 < width) {
      tail = enqueueFillPixel(queue, mask, tail, index + 1);
    }
    if (px > 0) {
      tail = enqueueFillPixel(queue, mask, tail, index - 1);
    }
    if (py + 1 < height) {
      tail = enqueueFillPixel(queue, mask, tail, index + width);
    }
    if (py > 0) {
      tail = enqueueFillPixel(queue, mask, tail, index - width);
    }
  }
  const layerData = drawingCtx.getImageData(0, 0, width, height);
  const layer = layerData.data;
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    const offset = i * 4;
    layer[offset] = fill[0];
    layer[offset + 1] = fill[1];
    layer[offset + 2] = fill[2];
    layer[offset + 3] = 235;
  }
  drawingCtx.putImageData(layerData, 0, 0);
}

function enqueueFillPixel(queue, mask, tail, index) {
  if (mask[index] !== 0 || tail >= queue.length) return tail;
  mask[index] = 2;
  queue[tail] = index;
  return tail + 1;
}

function isLineColor(rgba) {
  return rgba[3] > 90 && rgba[0] < 78 && rgba[1] < 78 && rgba[2] < 92;
}

function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs((a[3] || 255) - (b[3] || 255)) * 0.35;
}

function hexToRgba(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    255
  ];
}

function pushUndo() {
  undoStack.push(captureSnapshot());
  if (undoStack.length > 6) undoStack.shift();
  updateUndoRedo();
}

function captureSnapshot({ includeDrawing = !(state.projectMode === "forest" && state.forestMode === "build") } = {}) {
  return {
    drawing: includeDrawing ? drawingCtx.getImageData(0, 0, activeWidth(), activeHeight()) : null,
    sceneObjects: state.projectMode === "forest" ? state.sceneObjects.map((object) => ({ ...object })) : null,
    projectMode: state.projectMode
  };
}

function restoreSnapshot(snapshot) {
  const normalized = snapshot && Object.prototype.hasOwnProperty.call(snapshot, "drawing")
    ? snapshot
    : { drawing: snapshot, sceneObjects: state.sceneObjects, projectMode: state.projectMode };
  if (normalized.drawing) drawingCtx.putImageData(normalized.drawing, 0, 0);
  if (state.projectMode === "forest" && normalized.sceneObjects) {
    state.sceneObjects = normalized.sceneObjects.map((object) => ({ ...object }));
  }
  state.selectedObjectId = null;
  renderScene();
  updateForestControls();
}

function undo() {
  if (undoStack.length <= 1) return;
  const snapshot = undoStack.pop();
  redoStack.push(captureSnapshot({ includeDrawing: Boolean(snapshot.drawing) }));
  restoreSnapshot(snapshot);
  draw();
  autosave();
  updateUndoRedo();
}

function redo() {
  if (!redoStack.length) return;
  const snapshot = redoStack.pop();
  undoStack.push(captureSnapshot({ includeDrawing: Boolean(snapshot.drawing) }));
  restoreSnapshot(snapshot);
  draw();
  autosave();
  updateUndoRedo();
}

function updateUndoRedo() {
  document.querySelector("[data-action='undo']").disabled = undoStack.length <= 1;
  document.querySelector("[data-action='redo']").disabled = redoStack.length === 0;
}

function clearDrawing() {
  drawingCtx.clearRect(0, 0, activeWidth(), activeHeight());
  if (state.projectMode === "forest") {
    state.sceneObjects = [];
    state.selectedObjectId = null;
    renderScene();
  }
  undoStack.length = 0;
  redoStack.length = 0;
  state.dirty = false;
}

function compositeDataUrl(scale = 1) {
  const output = document.createElement("canvas");
  output.width = activeWidth() * scale;
  output.height = activeHeight() * scale;
  const outputCtx = output.getContext("2d");
  outputCtx.fillStyle = "#fffdf7";
  outputCtx.fillRect(0, 0, output.width, output.height);
  outputCtx.scale(scale, scale);
  if (state.projectMode === "forest") {
    outputCtx.drawImage(sceneLayer, 0, 0);
    outputCtx.drawImage(drawingLayer, 0, 0);
  } else {
    outputCtx.drawImage(templateLayer, 0, 0);
    outputCtx.drawImage(drawingLayer, 0, 0);
    outputCtx.drawImage(templateLayer, 0, 0);
  }
  return output.toDataURL("image/png");
}

async function saveArtwork() {
  const artwork = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    pageId: state.pageId,
    projectMode: state.projectMode,
    sceneObjects: state.projectMode === "forest" ? state.sceneObjects : [],
    drawing: drawingLayer.toDataURL("image/png"),
    preview: compositeDataUrl(0.32),
    createdAt: new Date().toISOString()
  };
  await dbPut(ART_STORE, artwork);
  await trimArtworkStore(48);
  state.dirty = false;
  await renderGallery();
  celebrateSave();
  showToast("Saved to gallery");
}

async function renderGallery() {
  const artworks = await readArtworks();
  emptyGallery.classList.toggle("is-hidden", artworks.length > 0);
  galleryGrid.innerHTML = artworks.map((art) => `
    <article class="gallery-card${art.projectMode === "forest" ? " is-forest" : ""}" data-art="${art.id}">
      <img src="${art.preview}" alt="Saved artwork" />
      <footer>
        <time datetime="${art.createdAt}">${formatDate(art.createdAt)}</time>
        <div>
          <button type="button" data-load="${art.id}">Open</button>
          <button type="button" data-delete="${art.id}">Delete</button>
        </div>
      </footer>
    </article>
  `).join("");
  galleryGrid.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => loadArtwork(button.dataset.load));
  });
  galleryGrid.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteArtwork(button.dataset.delete));
  });
}

async function readArtworks() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ART_STORE, "readonly");
    const request = transaction.objectStore(ART_STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

async function loadArtwork(id) {
  const loadToken = ++artworkLoadToken;
  const art = await dbGet(ART_STORE, id);
  if (!art || loadToken !== artworkLoadToken) return;
  const artMode = art.projectMode || "coloring";
  const image = new Image();
  image.onload = () => {
    if (loadToken !== artworkLoadToken) return;
    state.pageId = art.pageId;
    state.projectMode = artMode;
    activateWorkspace(artMode);
    clearDrawing();
    if (artMode === "forest") {
      state.sceneObjects = (art.sceneObjects || []).map((object) => ({ ...object }));
      renderScene();
    } else loadTemplate(state.pageId);
    drawingCtx.drawImage(image, 0, 0, activeWidth(), activeHeight());
    pushUndo();
    draw();
    autosave();
    updateSelectedControls();
    setView(state.projectMode === "forest" ? "forest" : "studio");
    showToast("Artwork opened");
  };
  image.onerror = () => {
    if (loadToken === artworkLoadToken) showToast("Could not open that artwork");
  };
  image.src = art.drawing;
}

function deleteArtwork(id) {
  confirmAction("Delete this artwork?", "This removes it from the gallery on this iPad.", () => {
    dbDelete(ART_STORE, id).then(renderGallery);
    showToast("Deleted");
  });
}

function downloadArtwork() {
  const link = document.createElement("a");
  link.download = `color-studio-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = compositeDataUrl(1);
  link.click();
}

function autosave() {
  dbPut(META_STORE, {
    key: AUTOSAVE_KEY,
    pageId: state.pageId,
    brush: state.brush,
    palette: state.palette,
    color: state.color,
    size: state.size,
    projectMode: state.projectMode,
    forestMode: state.forestMode,
    sceneObjects: state.sceneObjects,
    forestCanvasVersion: 2,
    studioDrawing: studioDrawingLayer.toDataURL("image/png"),
    forestDrawing: forestDrawingLayer.toDataURL("image/png")
  }).catch(() => {});
}

function loadCanvasData(layer, dataUrl) {
  if (!dataUrl) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const layerContext = layer.getContext("2d", { willReadFrequently: true });
      layerContext.clearRect(0, 0, layer.width, layer.height);
      layerContext.drawImage(image, 0, 0, layer.width, layer.height);
      resolve();
    };
    image.onerror = resolve;
    image.src = dataUrl;
  });
}

async function restoreAutosave() {
  try {
    const saved = await dbGet(META_STORE, AUTOSAVE_KEY);
    if (!saved) return;
    Object.assign(state, {
      pageId: saved.pageId || state.pageId,
      brush: saved.brush || state.brush,
      palette: saved.palette || state.palette,
      color: saved.color || state.color,
      size: saved.size || state.size,
      projectMode: saved.projectMode || state.projectMode,
      forestMode: saved.forestMode || state.forestMode,
      sceneObjects: Array.isArray(saved.sceneObjects) ? saved.sceneObjects : []
    });
    if (!saved.forestCanvasVersion && state.sceneObjects.length) {
      state.sceneObjects = state.sceneObjects.map((object) => ({
        ...object,
        x: object.x * (FOREST_WIDTH / CANVAS_SIZE),
        y: object.y * (FOREST_HEIGHT / CANVAS_SIZE)
      }));
    }
    currentPalette();
    // Legacy autosaves used one shared canvas. Keep that artwork in Studio so it
    // can never leak into the independent Forest workspace.
    await Promise.all([
      loadCanvasData(studioDrawingLayer, saved.studioDrawing || saved.drawing),
      loadCanvasData(forestDrawingLayer, saved.forestDrawing)
    ]);
    histories.coloring.undo.length = 0;
    histories.coloring.redo.length = 0;
    histories.forest.undo.length = 0;
    histories.forest.redo.length = 0;
  } catch {
    await dbDelete(META_STORE, AUTOSAVE_KEY).catch(() => {});
  }
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ART_STORE)) {
        db.createObjectStore(ART_STORE, { keyPath: "id" }).createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function dbPut(storeName, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function dbGet(storeName, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function trimArtworkStore(limit) {
  const artworks = await readArtworks();
  await Promise.all(artworks.slice(limit).map((art) => dbDelete(ART_STORE, art.id)));
}

function confirmAction(title, message, onConfirm) {
  document.querySelector("#dialogTitle").textContent = title;
  document.querySelector("#dialogMessage").textContent = message;
  dialog.showModal();
  dialog.addEventListener("close", function handleClose() {
    dialog.removeEventListener("close", handleClose);
    if (dialog.returnValue === "confirm") onConfirm();
  });
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function celebrateSave() {
  if (!celebration) return;
  const colors = ["#f4bfdc", "#b89ae8", "#fff3a1", "#a7e5d8", "#84679c"];
  celebration.innerHTML = Array.from({ length: 34 }, (_, index) => {
    const left = 8 + Math.random() * 84;
    const delay = Math.random() * 0.18;
    const size = 10 + Math.random() * 16;
    const color = colors[index % colors.length];
    return `<span style="--left:${left}%;--delay:${delay}s;--size:${size}px;--confetti:${color}"></span>`;
  }).join("");
  celebration.classList.remove("is-active");
  requestAnimationFrame(() => celebration.classList.add("is-active"));
  setTimeout(() => {
    celebration.classList.remove("is-active");
    celebration.innerHTML = "";
  }, 1200);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

init();
