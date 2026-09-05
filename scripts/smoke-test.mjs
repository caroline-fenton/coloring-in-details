import { readFileSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
  ".github/workflows/deploy.yml",
  "assets/coloring-pages/anime-kitten.png",
  "assets/coloring-pages/anime-artist.png",
  "assets/coloring-pages/anime-moon-puppy.png",
  "assets/coloring-pages/anime-dragon.png",
  "assets/coloring-pages/animal-hat-cat.png",
  "assets/coloring-pages/animal-hat-bunny.png",
  "assets/coloring-pages/animal-magic-kitten.png",
  "assets/coloring-pages/animal-fox-tea.png",
  "assets/coloring-pages/animal-bunny-artist.png",
  "assets/forest/forest-sprites-clean.png",
  "assets/forest/enchanted-background.png",
  "assets/forest/enchanted-background-landscape.png",
];

for (const file of requiredFiles) {
  readFileSync(file, "utf8");
}

const html = readFileSync("index.html", "utf8");
const js = readFileSync("app.js", "utf8");
const manifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));

const checks = [
  [html.includes("<canvas"), "canvas exists"],
  [html.includes("manifest.webmanifest"), "manifest linked"],
  [js.includes("floodFill"), "fill tool exists"],
  [/let state = \{[\s\S]*?brush: "fill"/.test(js), "fill tool is the default"],
  [js.includes("drawSticker"), "sticker tool exists"],
  [js.includes("glitterStroke"), "glitter tool exists"],
  [js.includes("celebrateSave"), "save celebration exists"],
  [js.includes("buildLineArtTemplate"), "sourced SVG line-art extraction exists"],
  [js.includes("buildRasterLineTemplate"), "raster coloring-page cleanup exists"],
  [js.includes("Popsicle") && js.includes("Summer Camp") && js.includes("Lime Time") && js.includes("Bubblegum") && js.includes("Twilight") && js.includes("Rainbow") && js.includes("Cotton Candy"), "updated color palettes exist"],
  [js.includes("undoStack"), "undo support exists"],
  [html.includes('data-view="forest"'), "Forest Mode navigation exists"],
  [html.includes('data-forest-mode="build"') && html.includes('data-forest-mode="draw"'), "Forest build and color modes exist"],
  [js.includes("forestObjects") && ["tree", "pine", "bush", "rock", "flower", "cloud", "sun", "mushroom"].every((name) => js.includes(`id: "${name}"`)), "Forest object library exists"],
  [js.includes("startSceneGesture") && js.includes("continueSceneGesture"), "Forest objects support touch movement and resizing"],
  [js.includes("deleteSelectedObject") && js.includes("duplicateSelectedObject"), "Forest object actions exist"],
  [js.includes("resetForest") && html.includes('data-action="resetForest"'), "Forest can be reset in one action"],
  [js.includes("sceneObjects: state.sceneObjects"), "Forest scenes are saved with artwork"],
  [js.includes("studioDrawingLayer") && js.includes("forestDrawingLayer"), "Studio and Forest use independent drawing layers"],
  [js.includes("FOREST_WIDTH = 1920") && js.includes("FOREST_HEIGHT = 1200"), "Forest uses a landscape canvas"],
  [js.includes("histories") && js.includes("activateWorkspace"), "Studio and Forest use independent undo histories"],
  [js.includes("includeDrawing ? drawingCtx.getImageData") && js.includes("undoStack.length > 6"), "Undo history is bounded for iPad memory"],
  [js.includes("studioDrawing:") && js.includes("forestDrawing:"), "Both workspaces autosave independently"],
  [js.includes("indexedDB"), "durable gallery storage exists"],
  [manifest.display === "standalone", "PWA standalone display"],
  [manifest.icons.length >= 2, "PWA icons exist"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, label] of failed) console.error(`Missing: ${label}`);
  process.exit(1);
}

console.log("Smoke test passed");
