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
  "assets/forest/stickers-v2/star-fairy.png",
  "assets/forest/stickers-v2/flower-fairy.png",
  "assets/forest/stickers-v2/magic-mushrooms.png",
  "assets/forest/stickers-v2/mushroom-cottage.png",
  "assets/forest/stickers-v2/forest-frog.png",
  "assets/forest/stickers-v2/lily-frog.png",
  "assets/forest/stickers-v2/moon-ferns.png",
  "assets/forest/stickers-v2/glow-ferns.png",
  "assets/forest/enchanted-background.png",
  "assets/forest/enchanted-background-landscape.png",
  "assets/mythical/mythical-creatures-sprites-v3.png",
  "assets/mythical/moon-unicorn-v2.png",
  "assets/mythical/tiny-fairy-v2.png",
  "assets/mythical/aurora-phoenix.png",
  "assets/mythical/background-moonlight.png",
  "assets/mythical/background-enchanted.png",
  "assets/mythical/background-fairy-glow.png",
  "assets/mythical/background-mushroom-magic.png",
  "assets/mythical/background-crystal-dream.png",
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
  [js.includes("forestObjects") && ["tree", "pine", "bush", "rock", "flower", "cloud", "sun", "mushroom"].every((name) => js.includes(`"${name}"`)), "Forest object library exists"],
  [js.includes("Mythical Creatures") && js.includes("Pink Dragon") && js.includes("Aurora Phoenix"), "Mythical Creatures sticker pack exists"],
  [html.includes('id="stickerPackTabs"') && html.includes('id="backgroundTabs"'), "Sticker pack and background selectors exist"],
  [js.includes("Original Forest") && js.includes("enchanted-background-landscape.png"), "Original Forest background remains available"],
  [js.includes('art.backgroundTheme || "original-forest"') && js.includes('saved.backgroundTheme || "original-forest"'), "Legacy Forest saves migrate to Original Forest"],
  [/await restoreAutosave\(\);\s*renderObjectGrid\(\);/.test(js), "Restored sticker pack rebuilds its object grid"],
  [js.includes('stickerPack: state.projectMode === "forest" ? state.stickerPack : null') && js.includes('art.stickerPack || "forest-friends"'), "Gallery artwork preserves its sticker pack"],
  [html.includes('id="templatePreview"') && js.includes("templatePreview.src = image.src"), "File preview keeps restricted images outside export canvases"],
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
  [html.includes('id="canvasScroller"') && html.includes('data-action="toggleForestFit"'), "Phone Forest viewport controls exist"],
  [js.includes("updateForestViewport") && js.includes("panForest"), "Phone Forest view supports fit and explicit panning"],
  [js.includes('(max-height: 600px) and (pointer: coarse)'), "Landscape phones retain the phone workspace"],
  [readFileSync("sw.js", "utf8").includes('color-corner-v80'), "offline cache is refreshed for responsive assets"],
  [manifest.display === "standalone", "PWA standalone display"],
  [manifest.icons.length >= 2, "PWA icons exist"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, label] of failed) console.error(`Missing: ${label}`);
  process.exit(1);
}

console.log("Smoke test passed");
