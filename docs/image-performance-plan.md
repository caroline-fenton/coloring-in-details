# Image performance plan

Status: first implementation pass complete locally; remaining phases pending.
Last reviewed: September 12, 2026.

## Goal

Improve startup, image switching, drawing responsiveness, and offline storage use while preserving coloring boundaries, sticker transparency, saved artwork, and PNG exports.

## Current findings

This section records the baseline before the first implementation pass.

These findings come from source inspection and local file sizes, not a browser or iPad performance profile. Measure actual timings before claiming improvements.

- `app.js` eagerly creates images for two sticker sheets, 11 individual stickers, and all six backgrounds, regardless of the active workspace. Each load triggers scene rendering and drawing.
- The picture picker uses full coloring-page images, with native lazy loading but no dedicated thumbnails.
- Active backgrounds are approximately 2.2–3 MB each. The service worker's image list contains 29 files totaling 34.65 MiB, including the older `enchanted-background.png`, which is not selected by the current app code.
- `sw.js` precaches the complete asset list during installation and uses one versioned cache for app files and images.
- Autosave encodes both the 1600 × 1600 Studio drawing and 1920 × 1200 Forest drawing as PNG data URLs. Some settings changes also trigger this work.
- Gallery rendering retrieves complete artwork records and renders every preview. Previews are already reduced to 32% of canvas dimensions; full drawing records are still fetched with them.

## Format decisions

- Retain PNG originals as source assets. Do not delete originals as part of conversion.
- Trial WebP for illustrated backgrounds and picker thumbnails, comparing size and appearance before adopting it.
- Keep PNG for coloring templates and transparent stickers initially. Adopt lossless WebP only where it saves meaningful space and preserves pixels, transparency, and fill behavior.
- Keep downloaded artwork in PNG format.
- Smaller encoded files reduce transfer and storage costs; decoded image memory still depends largely on pixel dimensions. Format conversion does not replace thumbnails or on-demand loading.

## Implementation order

1. **Establish a baseline.** Record cold and warm startup, initial image transfer, time until drawing is usable, workspace/background switching, save responsiveness, and offline-cache completion on a representative iPad. Record device, OS/browser, network conditions, and artwork count.
2. **Load assets on demand.** Load the selected template/background and required stickers first. Load other assets when needed, reuse loaded images, and coalesce image-load redraws. Ensure restored scenes load every referenced asset before rendering or export; handle loading failures and rapid selection changes.
3. **Generate optimized assets.** Add a reproducible conversion/thumbnail script and source-to-output mapping. Size picker thumbnails for their display size and iPad pixel density. Compare candidate formats and avoid upscaling backgrounds merely to match canvas dimensions.
4. **Revise offline caching.** Cache essential app files and initial artwork first, then populate remaining offline assets in the background. Show when the full collection is ready offline. Preserve unchanged image assets across app updates with an explicit invalidation strategy, and remove obsolete files from the download list after verifying references. Test interrupted downloads and upgrades from the existing worker.
5. **Reduce save work.** Debounce drawing saves, encode only changed drawing layers, and use blobs in IndexedDB instead of large data URL strings. Preserve existing saved artwork and legacy autosaves. Serialize writes so older saves cannot overwrite newer state, and test app backgrounding without relying solely on asynchronous work at unload.
6. **Reduce gallery work.** Retrieve thumbnails and metadata separately from full drawings; load drawing data when an artwork opens. Lazy-load offscreen previews and release object URLs when no longer needed. Preserve compatibility with existing records.

## Acceptance checks

- Compare the same before/after scenarios on an actual iPad, including a populated gallery and scenes containing both sticker packs.
- Verify crisp outlines and unchanged fill boundaries, transparent sticker edges, background appearance, and full-size PNG exports.
- Verify save, reopen, undo/redo, independent workspaces, and restoration of existing artwork.
- Verify offline startup and the complete collection after offline preparation finishes, plus understandable behavior during partial downloads.
- Verify an existing installation upgrades without mixing incompatible app code and assets.
- Run `npm test` and add focused behavioral checks for changed loading, persistence, or cache logic. Existing smoke checks alone do not establish runtime performance.
- Record measured transfer sizes and timings here after implementation. Set numerical performance targets from the baseline; no savings or speedup is promised yet.

## References

- [Browser image performance guidance](https://web.dev/learn/performance/image-performance)
- [Canvas data URL costs and the blob alternative](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL)

## First implementation pass — September 12, 2026

- Generated six quality-90 WebP backgrounds at original dimensions and nine picker thumbnails bounded to 240 × 320 pixels. The 15 outputs total 2,400,382 bytes, compared with 27,953,493 bytes for their sources. Full coloring templates and source PNGs remain intact.
- Added `scripts/optimize-images.py` (Pillow 12.x) and `assets/optimized/manifest.json` with dimensions, sizes, and hashes. Regenerate from the repository root with `python3 scripts/optimize-images.py` in an environment containing Pillow.
- Replaced eager canvas image creation with reusable on-demand images and coalesced redraws. Scene saves/exports wait for required images and abort on load failure or scene changes. Failed images are removed from the cache so the next request can retry, even without an offline/online transition. Error handling does not start automatic retries.
- Added lazy decoding/loading to gallery previews; gallery storage has not changed.
- Updated the offline list to optimized backgrounds and thumbnails and removed two redundant precache entries. Image payload is now 17.27 MiB, down from 34.65 MiB. Installation still downloads the complete list; staged caching is not implemented yet.
- Validation: `npm test` passes, including behavioral checks for lazy canvas loading, image reuse, redraw coalescing, reconnect retry, and asset-list integrity. Desktop browser inspection confirmed all nine thumbnails loaded and a pre-existing Forest scene rendered with its drawing and stickers; no console errors were reported.
- Still pending: actual iPad timings and visual approval, comprehensive export/offline-upgrade checks, staged offline caching, changed-layer blob autosave, and separate gallery preview storage. Desktop checks do not establish iPad speedups.
