# AGENTS.md - Shattered Reverie Project Context

This file is the persistent operating context for coding sessions. Keep it current when architecture, commands, or work state changes.

## Project Snapshot

- **Game:** Shattered Reverie (working folder: `Len'en All-Star Reborn`), an original browser-based vertical danmaku game and Len'en tribute.
- **Stack:** Plain JavaScript, HTML, CSS, Canvas 2D, Web Audio. No framework, bundler, build step, or runtime package manager.
- **Entry point:** `index.html`; scripts load in dependency order and share globals.
- **Canvas:** Fixed internal resolution `640x480`, scaled uniformly by `js/boot.js`.
- **Repository:** `https://github.com/FireRi/shattered-reverie.git`, branch `main`.
- **Last feature commit:** `a5f5d78 Overhaul UI and boss dialogue` (pushed).
- **Current uncommitted work:** game scripts moved into `js/`, with `index.html` and documentation paths updated; line-ending noise in legacy files and the stale untracked `DOCUMENTATION.md` remain.

## Run And Verify

Serve the directory with any static server so `fetch()` assets and `/api/generate-dialog` behave normally. Opening `index.html` directly via `file://` works for most play, but AI dialogue fetch can fail gracefully.

Useful checks on Windows PowerShell:

```powershell
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }; node --check api/generate-dialog.js
node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"
$env:TOUCH='1'; node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"; Remove-Item Env:TOUCH
node "C:\Users\Gabby\AppData\Local\Temp\opencode\padcheck.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\api-check.mjs"
```

Expected current results:

- Desktop smoke: `20/20 PASSED`
- Touch smoke: `32/32 PASSED`
- Pad layout harness: no unintended canvas overlap; the 4:3 tablet overlay is intentional.
- `api-check.mjs` uses a mocked Groq response; it validates JSON parsing, alternating `b/p/b/p` order, and the 70B model request.
- A temporary `client-ai-check.js` also verifies browser-side cache, entry-time application, and AI-off fallback.
- `shot.js` uses Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, CDP port `9223`, and Node v24+ built-in WebSocket.

Screenshots are written to `C:\Users\Gabby\AppData\Local\Temp\opencode\`:

- `ui-*.png`: desktop 1280x960, including `ui-dialog.png`
- `touch-*.png`: landscape touch 844x390, including `touch-dialog.png`
- `portrait-*.png`: portrait 390x844 after choosing "Play in portrait"

The smoke/pad/screenshot harnesses are temporary, not committed. Add a portable `tools/` harness only if it becomes necessary.

## Architecture And File Order

Load order matters. Do not reorder `index.html` scripts.

```
js/engine.js     constants, IS_TOUCH, input, pools, shared state, TouchUI
js/audio.js      Web Audio buses, SFX synthesis, volume persistence
js/music.js      procedural stage/boss score generator
js/player.js     player, shots, bombs, graze, movement
js/dialogue.js   44 boss banter profiles, AI cache, validation, fallbacks
js/boss.js       boss lifecycle and shared boss context API
js/story.js      story-mode mobs and wave control
js/render.js     gameplay sprites, bullets, effects, low-level drawing
js/patterns.js   stage 1-3 boss patterns and shared pattern helpers
js/p4.js js/p5.js js/p6.js js/pex.js js/pexa.js
js/main.js       game state machine, menus, HUD, route flow, UI kit
js/boot.js       viewport fitting, DOM touch pad, fullscreen, canvas tap zones
```

All game scripts live in `js/`. `index.html` stays at the repository root; `api/` must stay at the root for Vercel.

- All cross-file communication is through globals. Shared state includes `G`, `PL`, `BOSS`, `eshots`, `mobs`, `ROUTES`, and `settings`.
- `IS_TOUCH` is defined in `js/engine.js:18`; `js/boot.js` reads it to apply `body.touch` and pad layout.
- `TouchUI` zones are registered by drawing code and resolved by `js/boot.js` in reverse draw order.
- `TouchPad` is the external DOM pad API: `sync`, `release`, `fireDown`, `fireUp`, `bomb`, `spell`, `focus`, `pause`, `stick`, `endStick`, `fullscreen`, `fit`.
- Touch pad markup lives in `index.html`; geometry and safe-area placement live in `js/boot.js` (`layoutPad`, `fit`). Pad visuals live in `index.html` CSS.
- `TouchPad.fullscreen` toggles document fullscreen; the `#padFull` button is hidden when unsupported. iOS lacks document fullscreen/orientation lock.

## Gameplay And State

- Screens include: `title`, `diff`, `sel`, `settings`, `help`, `play`, `pause`, `gameover`, `result`, `demo`.
- Story mode uses waves and three credits; 1CC mode uses one credit and a full route. Continue/retry spend credits; pause restart also spends a credit and invalidates 1CC.
- Save keys include `lasr_hi`, `lasr_diff`, `lasr_settings`, `lasr_mute`, `lasr_mvol`, and `lasr_svol`.
- Boss dialogue is a four-line boss/player/boss/player exchange. Every boss ID has a local profile in `js/dialogue.js`; AI output from `/api/generate-dialog` is prefetched, cached per boss, and ignored if it arrives after the exchange starts. Failures and missing keys always fall back to local banter. The endpoint requires `GROQ_API_KEY`; `GROQ_MODEL` optionally overrides the preferred 70B model.
- Keyboard: arrows move, Shift focus, Z shoot/confirm, C spell, X flash, Esc pause, S settings, H help, A autofire, M mute, `-`/`+` music.

## UI System

The current visual direction is neon sci-fi arcade with an 8-bit/CRT finish. Keep gameplay readable; do not let decorative panels hide bullets or the player for long.

- Core palette and helpers are in `js/main.js`: `UI`, `uiPanel`, `uiTile`, `uiSegBar`, `uiTicks`, `uiCursor`, `uiTag`, `uiKeyCap`, `pixelTitle`, `drawTitleGrid`, `drawMenuGrid`, `drawCRT`.
- Fonts: `Pixel8` for headings/values, `VT323R` for body copy. Use integer font sizes and canvas coordinates where possible.
- `drawScreen()` calls `drawCRT()` before `TouchPad.sync()`. The overlay adds scanlines, a moving band, vignette, and edge lines.
- `menuFrame`, `bigTitle`, `drawTitle`, `blinkText`, and `touchBtn` define the shared title/menu/proceed language.
- All gameplay HUD panels use segmented bars and small code tags. The boss bar has 42 segments; score/timer panels avoid the top-center spell label.
- The player status rail is a compact top-left panel (lives/spells, credits, PWR/FLASH/OD). Keep it out of the lower play area and fade it if the player enters its bounds; the touch route tag sits at the bottom-left.
- Canvas CSS uses `image-rendering: pixelated`. Scale only through `boot.fit()`; never set independent width/height scaling.
- Touch pad CSS adds inset neon shadows, scanline/ring pseudo-elements, a conic-gradient stick, and a radial knob. Keep controls in the side gutters in landscape.
- `blinkText` must remain readable while blinking; it dims rather than disappearing.

## Layout Constraints

- `fit()` uses `visualViewport` and a uniform scale: `min(w/640, h/480)`.
- Landscape touch: pad uses gutter mode when `(w-canvasW)/2 >= 64`; otherwise it falls back to overlay.
- Portrait touch: pad uses bottom-deck mode; "Rotate your device" overlay is skippable via "Play in portrait". The game remains a 4:3 letterboxed canvas.
- Safe-area insets are read from CSS custom properties `--sal/--sar/--sat/--sab` through `safeInset()`.
- The pad hides on `help`, `gameover`, `result`, and `demo`; it is visible on `title`, `diff`, `sel`, `pause`, `play`, and `settings`.
- On touch, menus use large tile/row hit zones via `TouchUI.add()`; do not rely only on visual text bounds.

## Git And Working Tree Rules

- **Do not commit or push unless the user explicitly asks.**
- The UI/status and boss-dialogue overhaul was committed and pushed as `a5f5d78`.
- Before any future commit, inspect `git status` and `git diff`; stage only intended files.
- Do not stage line-ending-only changes: `.gitignore`, `CREDITS.md`, `assets/sfx/readme_EN.txt`, `assets/sfx/readme_JP.txt`, `fonts/OFL.txt`, `fonts/VT323-OFL.txt`, `js/p4.js`, `js/p5.js`, `js/p6.js`, `js/pex.js`, `js/pexa.js`.
- The dialogue/UI changes were committed as `a5f5d78`; the current folder move updates `index.html`, `README.md`, and `AGENTS.md`.
- `DOCUMENTATION.md` is a stale untracked duplicate; leave it unstaged unless the user asks to update/remove it.
- `README.md` is the maintained technical deep dive. Keep this file focused on operational context and current state.

## Current Work State (2026-10-20)

Completed:

- Mobile overhaul: external DOM controls, safe-area-aware gutter/deck/overlay layouts, menu stick navigation, fullscreen button, and touch HUD adjustments; committed as `e50a9ba`.
- Sci-fi UI pass across title, difficulty, stage select, settings, help, pause, game over, results, dialog, banners, demo overlay, cut-ins, and HUD.
- CRT/scanline overlay, pixelated canvas, segmented bars, notched panels, and neon pad CSS.
- Screenshot review on desktop, landscape touch, and portrait touch. No overlap or clipping blockers found.
- Final polish: widened/centered title deploy panel, always-readable blink text, help `clear + damage` spacing, gameover footer, result prompt position, and larger difficulty description.
- Moved player status out of the lower play area into a compact top-left telemetry rail; touch route tag moved to bottom-left.
- Boss banter rehaul: `js/dialogue.js` now has distinct four-line exchanges and voice notes for all 44 boss IDs, replacing the mismatched `DIALOGS` table and generic fallback.
- AI dialogue now prefetches the current and next boss, caches valid four-line responses, validates speakers, applies only during entry, and falls back silently. The API prefers `llama-3.3-70b-versatile` with an 8B retry.
- Repository organization: all 16 game scripts now live in `js/`; `index.html` script paths, the README tree, and test commands were updated.

Current verification state:

- All JavaScript files pass `node --check`; `api-check.mjs` validates a mocked Groq generation.
- Desktop 20/20 and touch 32/32 smoke suites pass.
- Screenshots rechecked, including desktop/touch dialogue, boss HUD, game over, results, landscape, and portrait deck.
- UI/dialogue work is committed and pushed as `a5f5d78`; game scripts are now organized under `js/` (move not yet committed).
- Real-device touch/fullscreen behavior and a live Groq key still need manual validation.

Next steps:

1. Review the uncommitted `js/` move; commit only when the user asks.
2. Get real-device validation for touch spacing, safe areas, and fullscreen behavior if possible.
3. Test live `/api/generate-dialog` output once `GROQ_API_KEY` is configured; local banter remains the fallback.
4. Create a portable test harness only if the temporary one is likely to be lost.
5. Await explicit user permission before committing or pushing.
