# Crown & Country

A Kingdomino-inspired web game with original vector terrain art and a single full-screen Canvas 2D tabletop. No install or account required.

Run `npm start` and open http://localhost:5173. Run `npm test` for engine and camera checks. Requires Node 20 or newer; no package dependencies. `npm run build` copies only public game assets into `docs/`, the GitHub Pages publishing directory. Commit rebuilt docs when publishing changes.

Features: 1–4 local players, numbered drafting, two crowns per player in two-player games, four choices per round for three players, legal-placement previews, rotation (R), a flexible 5×5 kingdom boundary, forced discards, region scoring, final standings, and browser-local saves. Solo is a practice variant: claim one of four dominoes each round for twelve rounds. Harmony and Middle Kingdom bonuses are not enabled.

Click an available draft domino. On your placement turn, tap a board square to preview, rotate if needed, then confirm. Drag to pan the shared table; pinch or use the mouse wheel to zoom. Player buttons focus each kingdom, the target button returns to the active kingdom, and the grid button fits the whole table. All kingdoms share one canvas. Controls stay docked inside the viewport in phone portrait and landscape layouts. Suggest spot offers a legal placement without committing it. Keyboard: focus the canvas and use arrows to adjust a preview, R to rotate, Enter to place.

Each 9×9 planning area allows a 5×5 kingdom to grow in any direction around its starting castle. Games save after each committed move on the current browser origin. Localhost and GitHub Pages have separate saves. There are no external fonts, trackers, or runtime packages.

Rules reference: https://playheavenlygames.com/wp-content/uploads/2023/05/ed70e-kingdomino_rules_us_2nd_edition.pdf

This is an unofficial prototype, with no original game illustrations or branding. The custom frontend and game engine are separate ES modules. Network multiplayer and AI opponents are outside this first demo.
