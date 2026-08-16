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
  [js.includes("drawSticker"), "sticker tool exists"],
  [js.includes("glitterStroke"), "glitter tool exists"],
  [js.includes("celebrateSave"), "save celebration exists"],
  [js.includes("buildLineArtTemplate"), "sourced SVG line-art extraction exists"],
  [js.includes("buildRasterLineTemplate"), "raster coloring-page cleanup exists"],
  [js.includes("Popsicle") && js.includes("Summer Camp") && js.includes("Lime Time") && js.includes("Bubblegum") && js.includes("Twilight") && js.includes("Rainbow") && js.includes("Cotton Candy"), "updated color palettes exist"],
  [js.includes("undoStack"), "undo support exists"],
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
