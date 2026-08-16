const CANVAS_SIZE = 1600;
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
const sizeOutput = document.querySelector("#sizeOutput");
const galleryGrid = document.querySelector("#galleryGrid");
const emptyGallery = document.querySelector("#emptyGallery");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#confirmDialog");
const celebration = document.querySelector("#celebration");

const drawingLayer = document.createElement("canvas");
const templateLayer = document.createElement("canvas");
const scratchLayer = document.createElement("canvas");
for (const layer of [drawingLayer, templateLayer, scratchLayer]) {
  layer.width = CANVAS_SIZE;
  layer.height = CANVAS_SIZE;
}
const drawingCtx = drawingLayer.getContext("2d", { willReadFrequently: true });
const templateCtx = templateLayer.getContext("2d", { willReadFrequently: true });
const scratchCtx = scratchLayer.getContext("2d", { willReadFrequently: true });

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
  brush: "marker",
  palette: palettes[0].id,
  color: palettes[0].colors[0],
  size: 18,
  drawing: false,
  lastPoint: null,
  dirty: false
};

let undoStack = [];
let redoStack = [];
let toastTimer = null;
let dbPromise = null;

async function init() {
  renderControls();
  bindEvents();
  await restoreAutosave();
  renderColors();
  updateSelectedControls();
  loadTemplate(state.pageId);
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
  updateSizePreview();
}

function updateSizePreview() {
  const previewSize = Math.max(8, Math.min(34, Math.round(state.size * 0.46)));
  sizeOutput.style.setProperty("--preview-size", `${previewSize}px`);
  sizeOutput.style.setProperty("--preview-color", state.brush === "eraser" ? "var(--paper)" : state.color);
  sizeOutput.dataset.brush = state.brush;
  sizeOutput.setAttribute("aria-label", `${activeBrush().label} size preview`);
}

function bindEvents() {
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
  });

  document.querySelector("[data-action='undo']").addEventListener("click", undo);
  document.querySelector("[data-action='redo']").addEventListener("click", redo);
  document.querySelector("[data-action='save']").addEventListener("click", saveArtwork);
  document.querySelector("[data-action='new']").addEventListener("click", () => {
    confirmAction("Start a new picture?", "Your current drawing will be cleared from the studio.", () => {
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
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== view));
  if (view === "gallery") renderGallery();
}

function loadTemplate(pageId) {
  const page = getPage(pageId);
  state.pageId = page.id;
  const image = new Image();
  image.onload = () => {
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
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.drawImage(templateLayer, 0, 0);
  ctx.drawImage(drawingLayer, 0, 0);
  ctx.drawImage(templateLayer, 0, 0);
}

function startDrawing(event) {
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  const point = getCanvasPoint(event);
  state.drawing = true;
  state.lastPoint = point;
  if (state.brush === "fill") {
    pushUndo();
    floodFill(point.x, point.y, state.color);
    state.drawing = false;
    state.dirty = true;
    redoStack = [];
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
  if (!state.drawing || state.brush === "fill") return;
  event.preventDefault();
  const point = getCanvasPoint(event);
  paintStroke(state.lastPoint, point, getPressure(event));
  state.lastPoint = point;
  state.dirty = true;
  draw();
}

function stopDrawing() {
  if (!state.drawing) return;
  state.drawing = false;
  state.lastPoint = null;
  redoStack = [];
  autosave();
  updateUndoRedo();
}

function getPressure(event) {
  return event.pressure && event.pressure > 0 ? event.pressure : 0.65;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE),
    y: Math.round(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE)
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
  scratchCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  scratchCtx.fillStyle = "#fffdf7";
  scratchCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  scratchCtx.drawImage(templateLayer, 0, 0);
  scratchCtx.drawImage(drawingLayer, 0, 0);
  scratchCtx.drawImage(templateLayer, 0, 0);
  const imageData = scratchCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const data = imageData.data;
  const start = (y * CANVAS_SIZE + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const fill = hexToRgba(color);
  if (colorDistance(target, fill) < 16 || isLineColor(target)) return;
  const mask = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
  const queue = new Int32Array(CANVAS_SIZE * CANVAS_SIZE);
  let head = 0;
  let tail = 0;
  const startIndex = y * CANVAS_SIZE + x;
  queue[tail] = startIndex;
  mask[startIndex] = 2;
  tail += 1;
  const tolerance = 42;
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const px = index % CANVAS_SIZE;
    const py = Math.floor(index / CANVAS_SIZE);
    const offset = index * 4;
    const current = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
    if (isLineColor(current) || colorDistance(current, target) > tolerance) continue;
    mask[index] = 1;
    if (px + 1 < CANVAS_SIZE) {
      tail = enqueueFillPixel(queue, mask, tail, index + 1);
    }
    if (px > 0) {
      tail = enqueueFillPixel(queue, mask, tail, index - 1);
    }
    if (py + 1 < CANVAS_SIZE) {
      tail = enqueueFillPixel(queue, mask, tail, index + CANVAS_SIZE);
    }
    if (py > 0) {
      tail = enqueueFillPixel(queue, mask, tail, index - CANVAS_SIZE);
    }
  }
  const layerData = drawingCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
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
  undoStack.push(drawingCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
  if (undoStack.length > 14) undoStack.shift();
  updateUndoRedo();
}

function undo() {
  if (undoStack.length <= 1) return;
  redoStack.push(drawingCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
  undoStack.pop();
  drawingCtx.putImageData(undoStack[undoStack.length - 1], 0, 0);
  draw();
  autosave();
  updateUndoRedo();
}

function redo() {
  if (!redoStack.length) return;
  const imageData = redoStack.pop();
  undoStack.push(imageData);
  drawingCtx.putImageData(imageData, 0, 0);
  draw();
  autosave();
  updateUndoRedo();
}

function updateUndoRedo() {
  document.querySelector("[data-action='undo']").disabled = undoStack.length <= 1;
  document.querySelector("[data-action='redo']").disabled = redoStack.length === 0;
}

function clearDrawing() {
  drawingCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  undoStack = [];
  redoStack = [];
  state.dirty = false;
}

function compositeDataUrl(scale = 1) {
  const output = document.createElement("canvas");
  output.width = CANVAS_SIZE * scale;
  output.height = CANVAS_SIZE * scale;
  const outputCtx = output.getContext("2d");
  outputCtx.fillStyle = "#fffdf7";
  outputCtx.fillRect(0, 0, output.width, output.height);
  outputCtx.scale(scale, scale);
  outputCtx.drawImage(templateLayer, 0, 0);
  outputCtx.drawImage(drawingLayer, 0, 0);
  outputCtx.drawImage(templateLayer, 0, 0);
  return output.toDataURL("image/png");
}

async function saveArtwork() {
  const artwork = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    pageId: state.pageId,
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
    <article class="gallery-card" data-art="${art.id}">
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
  const art = await dbGet(ART_STORE, id);
  if (!art) return;
  state.pageId = art.pageId;
  clearDrawing();
  loadTemplate(state.pageId);
  const image = new Image();
  image.onload = () => {
    drawingCtx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    pushUndo();
    draw();
    autosave();
    updateSelectedControls();
    setView("studio");
    showToast("Artwork opened");
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
    drawing: drawingLayer.toDataURL("image/png")
  }).catch(() => {});
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
      size: saved.size || state.size
    });
    currentPalette();
    const image = new Image();
    image.onload = () => {
      drawingCtx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      undoStack = [];
      pushUndo();
      draw();
      updateSelectedControls();
    };
    image.src = saved.drawing;
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
