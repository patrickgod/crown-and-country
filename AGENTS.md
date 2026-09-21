# Crown & Country development workflow

## Preserve development evidence
Patrick requested on 2026-09-21 that screenshots, recordings and devlogs be retained for future development videos and articles, following the other game projects.

After meaningful work:
- Add/update a dated factual entry in `devlogs/YYYY-MM-DD-topic.md`.
- Record the request, before/after behavior, decisions, failures, validation, limitations, commit/build references and deployment status.
- Save useful screenshots and raw recordings in `artifacts/captures/YYYY-MM-DD-topic/<session>/`. Keep originals. Include a manifest with dimensions, date, source revision, scenario, capture method and whether scripted or human.
- Update `development/README.md` as the local evidence index. Link the updated devlog in the final handoff.
- No screenshot/video quota or thumbnails. Capture representative changed behavior when useful; never claim a capture or validation that did not happen.
- Distinguish real user testing, browser interaction tests, synthetic pointer tests, staged engine replays and retrospective descriptions.
- Record blockers honestly and retain reproducible capture steps. Do not overwrite user game saves for captures.
- The archive is local and gitignored. Do not publish recordings, private devlogs or articles without a separate user request. The public game can continue deploying to the approved GitHub Pages site.

## Build and deployment
Run `npm test`, `npm run build` after changes; commit updated `docs/` game assets with source. GitHub Pages publishes `main:/docs`. Do not put devlogs or raw media into that directory.

## Capture utility
`node tools/capture-server.mjs` runs a localhost-only capture session on port 5174. Open its printed URL in a browser. It renders a deterministic, staged replay through the real engine/renderer, saves PNGs plus raw WebM and a manifest, and stops the server on completion. It does not read or change browser saved games. This is evidence of rendered game behavior, not an end-to-end pointer-input test.
