# Color Corner

An iPad-first drawing and coloring PWA for kids. It includes detailed coloring pages, free drawing, brush tools, neon colors, undo and redo, local saved artwork, gallery delete/open actions, PNG export, offline support, GitHub Pages deployment, and a complete Forest Mode scene builder.

## Forest Mode

Open **Forest** from the top navigation, then use **Build** to create a scene with star and flower fairies, magical mushrooms, a mushroom cottage, friendly forest frogs, and two varieties of enchanted ferns. Tap an item to add it, drag it anywhere on the canvas, and pull its pink corner handle to resize it. The object-size slider provides a second, accessible way to resize; selected items can also be duplicated or deleted.

Switch to **Color** to draw over the finished scene with the same markers, crayons, paint, neon, glitter, stickers, fill, and eraser tools used in the main studio. Forest is an independent workspace: its drawing layer, undo/redo history, autosave, and **New** action are separate from Studio, so coloring-page art never appears in a forest scene. Forest scenes are preserved when saved to the gallery or exported as PNG. Controls use large touch targets and pointer capture for reliable iPad and Apple Pencil interaction.

Forest Mode uses an original, project-local 16:10 enchanted woodland background and coordinated illustrated sprite sheet. Its wide canvas provides substantially more room for scene building while Studio coloring pages remain square. Deep plum shadows, cyan rim light, saturated teal foliage, and orchid glow give the scene a bioluminescent nighttime atmosphere while preserving the app's rounded storybook character. Both assets are cached with the rest of the PWA for offline use.

The **Mythical Creatures** sticker pack adds eight original luminous characters: two crystal dragons, a rainbow winged creature, moon unicorn, aurora phoenix, frost dragon, tiny fairy, and mushroom sprite. Scene builders can pair either sticker pack with the Original Forest or the Moonlight, Enchanted, Fairy Glow, Mushroom Magic, and Crystal Dream backgrounds. Theme choices autosave and are preserved in gallery artwork.

## Responsive layout

Color Corner preserves its side-panel workspace on desktop and iPad. Phones use a compact header, a canvas-first layout, horizontally scrollable choices, and a shorter contextual tool tray with safe-area-aware spacing.

In phone portrait, Forest opens in an enlarged landscape view without changing the 1920×1200 artwork. The left and right buttons move across the scene, while **Fit whole scene** provides an overview and **Explore scene** returns to the enlarged view. Phone landscape fits the whole Forest workspace naturally. These display controls do not affect sticker coordinates, saved scenes, gallery images, or exported PNGs.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4183`. Color Corner uses its own local port so cached files from other projects cannot overlap during testing.

## Test

```bash
npm test
```

## Deploy

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys the static app to GitHub Pages on pushes to `main`. In the repository settings, set Pages to use GitHub Actions as the source.

## Coloring Page Assets

The anime/kawaii coloring-page PNGs in `assets/coloring-pages/` were generated specifically for this project using the built-in image generation tool, with the user's screenshots used as style references only. They are stored locally for offline PWA use. The set includes character pages, animal-hat pages, and animal-main-character pages.
