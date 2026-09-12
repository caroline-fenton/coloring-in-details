# Preview development

Start each round from the latest `main`, using the GitHub branch
`codex/responsive-phone-preview`. Keep its pull request in draft while testing.

## Publish a test version

1. Save the changes to the preview branch.
2. In GitHub Actions, choose **Deploy to GitHub Pages**.
3. Choose **Run workflow**, select **main**, and run it.
4. Wait for deployment to succeed before opening
   https://caroline-fenton.github.io/coloring-in-details/preview/.

The workflow deploys the current main app at the root and the preview branch
under `/preview/`. Preview artwork uses separate local storage and preview
requests bypass the offline worker. Publishing a preview does not merge it.

## Finish a round

Check the changed interactions on phone portrait and landscape, plus iPad and
desktop where relevant. Resolve review findings before merging. Delete the
preview branch after its PR is merged; the workflow can publish the main app
without that branch. The next successful deployment without a preview branch
omits `/preview/`.

For another round, recreate the same preview branch name from the latest main.

## Shared controls pass

Worlds/Studio naming and sticker pack data were already shared. This pass brings sticker preview sizing and selection-only editing controls to larger screens, keeps tablet tools in a scrollable sidebar, and separates Studio Tools and Colors on phones with persistent palette swatches. Fill hides brush size on every screen. Desktop/tablet swatches precede the palette library, and pictures follow drawing tools.

Device review: check Studio and Worlds at phone portrait/landscape, iPad portrait/landscape, and desktop sizes. Verify palette selection, switching tools, resizing across the phone breakpoint with a panel open, and selected sticker size/duplicate/delete. Automated logic checks do not replace rendered device review.

## Worlds navigation

Phone Worlds starts with the entire scene fitted. Pinch with two fingers to zoom
(up to 5×), or drag with two fingers to pan in both directions while any tool is
selected. Move supports one-finger navigation. The always-visible Fit scene
button resets the view. A second finger cancels the tentative first-finger edit,
including fill, sticker movement, and Undo/Redo changes; navigation never saves
that tentative edit. A remaining finger stays in navigation until lifted.

Device review before merge: phone portrait/landscape pinch from fitted view,
vertical/horizontal panning at high zoom, Fit scene, Move, drawing/fill/sticker
rollback when the second finger lands late, and one-finger drawing afterward.
Also check iPad/desktop and switching Worlds/Studio. Automated gesture tests
cover rollback and input routing; actual iOS gesture/rendering QA is pending.
