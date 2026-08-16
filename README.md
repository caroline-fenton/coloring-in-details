# Color Corner

An iPad-first drawing and coloring PWA for kids. It includes detailed coloring pages, free drawing, brush tools, neon colors, undo and redo, local saved artwork, gallery delete/open actions, PNG export, offline support, and GitHub Pages deployment.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4173`.

## Test

```bash
npm test
```

## Deploy

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys the static app to GitHub Pages on pushes to `main`. In the repository settings, set Pages to use GitHub Actions as the source.

## Coloring Page Assets

The anime/kawaii coloring-page PNGs in `assets/coloring-pages/` were generated specifically for this project using the built-in image generation tool, with the user's screenshots used as style references only. They are stored locally for offline PWA use. The set includes character pages, animal-hat pages, and animal-main-character pages.
