# AGENTS.md - Shattered Reverie Project Context

This file is the persistent operating context for coding sessions. Keep it current when architecture, commands, or work state changes.

## Project Snapshot

- **Game:** Shattered Reverie (working folder: `Len'en All-Star Reborn`), an original browser-based vertical danmaku game and Len'en tribute.
- **Stack:** Plain JavaScript, HTML, CSS, Canvas 2D, Web Audio. No framework, bundler, build step, or runtime package manager.
- **Entry point:** `index.html`; scripts load in dependency order and share globals.
- **Canvas:** Fixed internal resolution `640x480`, scaled uniformly by `js/boot.js`.
- **Repository:** `https://github.com/FireRi/shattered-reverie.git`, branch `main`.
- **Last feature commit:** `b838466 Add desktop and mobile controller support` (pushed); prior cabinet/danmaku work `25d59e0`, context refresh `cbd2a5b`.
- **Current uncommitted work:** no intentional content changes; only legacy line-ending noise and the stale untracked `DOCUMENTATION.md`.
- **Legacy working-tree noise:** line-ending-only changes in `.gitignore`, `CREDITS.md`, `assets/sfx/readme_EN.txt`, `assets/sfx/readme_JP.txt`, `fonts/OFL.txt`, and `fonts/VT323-OFL.txt`; stale untracked `DOCUMENTATION.md`. Do not stage these.

## Run And Verify

Serve the directory with any static server so `fetch()` assets and `/api/generate-dialog` behave normally. Opening `index.html` directly via `file://` works for most play, but AI dialogue fetch can fail gracefully.

Useful checks on Windows PowerShell:

```powershell
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }; node --check api/generate-dialog.js
node "C:\Users\Gabby\AppData\Local\Temp\opencode\all-boss-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"
$env:TOUCH='1'; node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"; Remove-Item Env:TOUCH
node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-check.js"
$env:TOUCH='1'; node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-check.js"; Remove-Item Env:TOUCH
node "C:\Users\Gabby\AppData\Local\Temp\opencode\padcheck.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\xeno-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\cab-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\xeno-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\api-check.mjs"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\api-fallback-check.mjs"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\client-ai-check.js"
```

Expected current results:

- Desktop smoke: `20/20 PASSED`
- Touch smoke: `32/32 PASSED`
- `controller-check.js`: desktop and touch `16/16 PASSED` with a mocked standard pad; covers held/edge keys, context mapping, enable/disable, remap capture, bind suppression, hotplug cleanup, persistence, and controller-screen drawing.
- `all-boss-check.js` runs all 44 bosses and all 102 attacks for 760 frames each, checks generator errors, non-finite bullets, effect/text caps, and confirms every attack spawns bullets: `ALL-BOSS PASSED`.
- `xeno-check.js` validates all six dice faces and attacks, hand rankings, both xeno spells, and the natural non-spell → Double or Nothing → All-In attack sequence.
- Pad layout harness: no unintended canvas overlap; the 4:3 tablet overlay is intentional.
- `api-check.mjs` uses a mocked Groq response; it validates JSON parsing, alternating `b/p/b/p` order, and the 70B model request. `api-fallback-check.mjs` verifies the 8B JSON fallback.
- `client-ai-check.js` verifies browser-side cache, entry-time application, and the local AI-off fallback.
- `shot.js` covers 1280x960 4:3 fallback, landscape touch, and portrait touch; `cab-shot.js` covers 1920x1080 and 1366x768 cabinet mode; `xeno-shot.js` covers the dice non-spell, Double or Nothing cutin/pattern, and All-In hand.
- Screenshot harnesses use Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, CDP port `9223` (`controller-shot.js` uses `9224`), and Node v24+ built-in WebSocket.

Screenshots are written to `C:\Users\Gabby\AppData\Local\Temp\opencode\`:

- `ui-*.png`: desktop 1280x960 (4:3, cabinet hidden), including `ui-dialog.png`
- `touch-*.png`: landscape touch 844x390, including `touch-dialog.png`
- `portrait-*.png`: portrait 390x844 after choosing "Play in portrait"
- `cab-*.png`: 1920x1080 cabinet play/dialog/boss/pause/result plus 1366x768 checks
- `xeno-*.png`: dice non-spell, Double or Nothing cutin/pattern, and All-In hand
- `pad-*.png`: connected-pad title prompt, Settings controller row, desktop/touch Controller screen, bind-listening overlay, and portrait layout
- `rehaul-*.png` / `rehaulN-*.png`: one spell and one non-spell per boss at 960x720; `rehaul-sheet-*.jpg` are contact sheets

The smoke/pad/screenshot harnesses are temporary, not committed. Add a portable `tools/` harness only if it becomes necessary.

## Architecture And File Order

Load order matters. Do not reorder `index.html` scripts.

```
js/engine.js     constants, IS_TOUCH, input, pools, shared state, TouchUI
js/gamepad.js    Gamepad API bridge, padKeys/padEdge, remap + persistence
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
js/cabinet.js    desktop side-panel telemetry, route art, CabinetUI.sync
js/boot.js       viewport fitting, DOM touch pad, fullscreen, canvas tap zones
```

All game scripts live in `js/`. `index.html` stays at the repository root; `api/` must stay at the root for Vercel.

- All cross-file communication is through globals. Shared state includes `G`, `PL`, `BOSS`, `eshots`, `mobs`, `ROUTES`, and `settings`.
- `GamepadSupport` in `js/gamepad.js` polls `navigator.getGamepads()` once per fixed step from `js/main.js`. It writes held/edge state into `padKeys`/`padEdge`; `down()` and `hitK()` merge those with keyboard state, so controller support must not overwrite `keys`/`edge`.
- Controller defaults: A shot, B flash, X spell, LB focus, Start pause, B cancel. The first connected pad wins; left-stick axes `0/1` plus D-pad buttons `12-15` navigate. Config persists in `lasr_gamepad`; standard-map labels are friendly, non-standard pads show `BTN n` and should be remapped.
- The Controller screen is `G.screen='controller'` from Settings. Remap capture waits for a clean release, then binds the next new button; after binding, `GamepadSupport` suppresses mapped input until all buttons are released so the bind press cannot activate pause/cancel.
- Touch Controller screen uses `TouchUI` rows; the DOM pad hides on that screen, and a full-screen touch zone cancels a listening bind. Desktop shows bind instructions in the footer.
- `IS_TOUCH` is defined in `js/engine.js:18`; `js/boot.js` reads it to apply `body.touch` and pad layout.
- `TouchUI` zones are registered by drawing code and resolved by `js/boot.js` in reverse draw order.
- `TouchPad` is the external DOM pad API: `sync`, `release`, `fireDown`, `fireUp`, `bomb`, `spell`, `focus`, `pause`, `stick`, `endStick`, `fullscreen`, `fit`.
- Touch pad markup lives in `index.html`; geometry and safe-area placement live in `js/boot.js` (`layoutPad`, `fit`). Pad visuals live in `index.html` CSS.
- `TouchPad.fullscreen` toggles document fullscreen; the `#padFull` button is hidden when unsupported. iOS lacks document fullscreen/orientation lock.
- `CabinetUI` is the desktop HUD bridge in `js/cabinet.js`: `sync()` reads `G`/`PL`/`BOSS`, updates `#cabinet` text/bars/pips, applies route art via `routeBgKey()`, and toggles `body.cab-live`. It must remain null-safe because the VM smoke harness has no real DOM body.
- Desktop cabinet layout is owned by `layoutCabinet()` in `js/boot.js`: enabled when non-touch, landscape, and gutter >=150px; panels use `--cab-scale` capped by panel width. Do not resize the 640x480 canvas for it.
- In cabinet mode, `drawHUD()` suppresses the in-canvas score panel, status rail, route tag, wave text, and streak, and draws `drawBossCabHud()` instead of the normal boss bar/timer/spell layout. Non-cabinet screens keep the compact HUD.
- Senri Bakuchi's dice attack helpers live in `js/pex.js`: `DICE_PIPS`/`DICE_NAMES`, `xenoDiceFx()`, `xenoDiceAttack()`, `xenoHandLabel()`, and the `xenoN1`/`xenoDS`/`xenoS` generators. Dice effects use the custom `fx.t==='dice'` renderer in `js/render.js`; keep pip arrays at exactly N entries for face N.
- Tsuru Kaihou's unfinished-work helpers live in `js/pex.js`: `tenSketch`, `tenInk`, `tenLaunch`, `tenEach`, and `tenCrane`. Draft bullets use `hit:false`, `grazed:true`, low alpha, and a unique tag object; `tenEach` must track by that tag rather than stale object refs because the enemy pool reuses bullets. `tenN1` freezes draft arcs and either inks or scraps them; `tenS` opens one frame side, then draws the missing side in at frame 110 and inks it at 135 while contracting; `tenS2` inks crane wings/body/head before erasing the unfinished head and launching the rest.
- All 44 bosses have a first-pass identity mechanic. Signature examples: Kurohebi leaves a live wake trail, Mitsumo grows a centipede body, Jun raises player-tracking geysers, Kujiru builds slime towers, Ooya carves cross-slashes, Garaiya orbits three casters, Saragimaru cycles Mirror/Sword/Jewel, Shion fights with three heads, Yago paints a brush wall, Tenkai builds unfinished-ink frames and a crane sketch, Shitodo calls SWEEP/SPILL/DUST, Emperor commands ADVANCE/HALT/KNEEL, Yabusame splits two worlds, and Suzumiex scars remembered positions. Keep wall patterns gapped and telegraphs readable.

## Gameplay And State

- Screens include: `title`, `diff`, `sel`, `settings`, `controller`, `help`, `play`, `pause`, `gameover`, `result`, `demo`.
- Story mode uses waves and three credits; 1CC mode uses one credit and a full route. Continue/retry spend credits; pause restart also spends a credit and invalidates 1CC.
- Save keys include `lasr_hi`, `lasr_diff`, `lasr_settings`, `lasr_mute`, `lasr_mvol`, `lasr_svol`, and `lasr_gamepad`.
- Boss dialogue is a four-line boss/player/boss/player exchange. Every boss ID has a local profile in `js/dialogue.js`; AI output from `/api/generate-dialog` is prefetched, cached per boss, and ignored if it arrives after the exchange starts. Failures and missing keys always fall back to local banter. The endpoint requires `GROQ_API_KEY`; `GROQ_MODEL` optionally overrides the preferred 70B model.
- Keyboard: arrows move, Shift focus, Z shoot/confirm, C spell, X flash, Esc pause, S settings, H help, A autofire, M mute, `-`/`+` music.
- Controller: A shot/confirm, B flash/cancel, X spell, LB focus, Start pause; D-pad/stick navigate. Title Start/Y open Settings, View opens Help. Settings → Controller handles enable, rebind, reset, and persistence.

## UI System

The current visual direction is neon sci-fi arcade with an 8-bit/CRT finish. Keep gameplay readable; do not let decorative panels hide bullets or the player for long.

- Core palette and helpers are in `js/main.js`: `UI`, `uiPanel`, `uiTile`, `uiSegBar`, `uiTicks`, `uiCursor`, `uiTag`, `uiKeyCap`, `pixelTitle`, `drawTitleGrid`, `drawMenuGrid`, `drawCRT`.
- Fonts: `Pixel8` for headings/values, `VT323R` for body copy. Use integer font sizes and canvas coordinates where possible.
- `drawScreen()` calls `drawCRT()` before `TouchPad.sync()`. The overlay adds scanlines, a moving band, vignette, and edge lines.
- `menuFrame`, `bigTitle`, `drawTitle`, `blinkText`, and `touchBtn` define the shared title/menu/proceed language.
- The Controller screen uses `menuFrame('CONTROLLER')` with a status header (pad name/mapping/button count), `CONTROLLER_ROWS`, and controller/touch footer hints. Keep the header below the panel title line at desktop and touch sizes; the touch layout uses a two-column row grid and a listening overlay.
- All gameplay HUD panels use segmented bars and small code tags. The boss bar has 42 segments; score/timer panels avoid the top-center spell label.
- The player status rail is a compact top-left panel (lives/spells, credits, PWR/FLASH/OD). Keep it out of the lower play area and fade it if the player enters its bounds; the touch route tag sits at the bottom-left. In cabinet mode this rail is replaced by the right side panel.
- Desktop cabinet: left panel is route art + route/sector/stage identity; right panel is score and telemetry; boss top strip is name/remaining/HP left, timer right, spell banner below. Hide `#hint` while `cab-live`.
- Canvas CSS uses `image-rendering: pixelated`. Scale only through `boot.fit()`; never set independent width/height scaling.
- Touch pad CSS adds inset neon shadows, scanline/ring pseudo-elements, a conic-gradient stick, and a radial knob. Keep controls in the side gutters in landscape.
- `blinkText` must remain readable while blinking; it dims rather than disappearing.

## Layout Constraints

- `fit()` uses `visualViewport` and a uniform scale: `min(w/640, h/480)`.
- Landscape touch: pad uses gutter mode when `(w-canvasW)/2 >= 64`; otherwise it falls back to overlay.
- Desktop cabinet: requires `(w-canvasW)/2 >= 150`, non-touch, and landscape; 1280x960 stays on the compact HUD. `layoutCabinet()` positions panels using the actual viewport offsets and canvas height.
- Portrait touch: pad uses bottom-deck mode; "Rotate your device" overlay is skippable via "Play in portrait". The game remains a 4:3 letterboxed canvas.
- Safe-area insets are read from CSS custom properties `--sal/--sar/--sat/--sab` through `safeInset()`.
- The pad hides on `help`, `controller`, `gameover`, `result`, and `demo`; it is visible on `title`, `diff`, `sel`, `pause`, `play`, and `settings`. The Controller screen uses canvas `TouchUI` rows instead.
- On touch, menus use large tile/row hit zones via `TouchUI.add()`; do not rely only on visual text bounds.

## Git And Working Tree Rules

- **Do not commit or push unless the user explicitly asks.**
- Before any future commit, inspect `git status` and `git diff`; stage only intended files.
- Do not stage line-ending-only changes: `.gitignore`, `CREDITS.md`, `assets/sfx/readme_EN.txt`, `assets/sfx/readme_JP.txt`, `fonts/OFL.txt`, `fonts/VT323-OFL.txt`. `js/p4.js`, `js/p5.js`, `js/p6.js`, and `js/pexa.js` now contain intentional danmaku edits, not line-ending-only changes.
- Historical commits: UI/dialogue overhaul `a5f5d78`, `js/` organization `7cfd061`, cabinet/dice/danmaku `25d59e0`, context refresh `cbd2a5b`, and controller support `b838466`.
- `DOCUMENTATION.md` is a stale untracked duplicate; leave it unstaged unless the user asks to update/remove it.
- `README.md` is the maintained technical deep dive. Keep this file focused on operational context and current state.

## Current Work State (2026-10-21)

Completed (current controller work):

- Added `js/gamepad.js` (Gamepad API polling, standard/non-standard labels, held/edge bridge, menu repeat, remap capture, bind suppression, hotplug cleanup, `lasr_gamepad` persistence) and loaded it after `js/engine.js`.
- Moved controller input into separate `padKeys`/`padEdge` layers; `down()`/`hitK()` merge them with keyboard input, and `autoPause` releases both controller and touch state.
- Added the Settings → Controller screen (`G.screen='controller'`) with enable/disable, six bind actions, reset, back, pad status, button/axis counts, listening state, and desktop/touch layouts. Touch can tap rows to bind and tap anywhere to cancel a listen; the touch binding overlay covers the screen.
- Expanded controller contexts: title Start/Y opens Settings, View opens Help, menus use A/B/Start, play maps shot/flash/spell/focus/pause, demo exits on controller input.
- Updated the title prompt/footer, help control matrix, cabinet `PAD` flag, README architecture/input/testing docs, and this file. Committed and pushed as `b838466`.
- Verified with a mocked standard pad on desktop and touch: `controller-check.js` passes 16/16 in both modes; desktop smoke `20/20`, touch smoke `32/32`, and `ALL-BOSS PASSED` (44/102) still pass.
- Screenshot review: controller settings row, desktop Controller screen, touch two-column screen, listening overlay, and portrait layout are legible after moving the status header clear of the panel title. The desktop title prompt uses `Z / PAD A TO DEPLOY`, and touch START changes to `START / PAD A` at 14px so it fits the button.

Earlier completed (committed):

- Mobile overhaul: external DOM controls, safe-area-aware gutter/deck/overlay layouts, menu stick navigation, fullscreen button, and touch HUD adjustments; committed as `e50a9ba`.
- Sci-fi UI pass across title, difficulty, stage select, settings, help, pause, game over, results, dialog, banners, demo overlay, cut-ins, and HUD.
- CRT/scanline overlay, pixelated canvas, segmented bars, notched panels, and neon pad CSS.
- Screenshot review on desktop, landscape touch, and portrait touch. No overlap or clipping blockers found.
- Final polish: widened/centered title deploy panel, always-readable blink text, help `clear + damage` spacing, gameover footer, result prompt position, and larger difficulty description.
- Moved player status out of the lower play area into a compact top-left telemetry rail; touch route tag moved to bottom-left.
- Boss banter rehaul: `js/dialogue.js` now has distinct four-line exchanges and voice notes for all 44 boss IDs, replacing the mismatched `DIALOGS` table and generic fallback.
- AI dialogue now prefetches the current and next boss, caches valid four-line responses, validates speakers, applies only during entry, and falls back silently. The API prefers `llama-3.3-70b-versatile` with an 8B retry.
- Repository organization: all game scripts live in `js/`; `index.html` script paths, the README tree, and test commands were updated.
- Desktop cabinet HUD implemented: markup/CSS in `index.html`, `layoutCabinet()` in `js/boot.js`, `CabinetUI` in new `js/cabinet.js`, and cabinet-specific HUD branching in `js/main.js`.
- Cabinet verified visually at 1920x1080 and 1366x768: side panels, boss top strip, pauses, results, and hidden keyboard hint; 1280x960 still uses the compact HUD.
- Fixed `js/engine.js` `makeGenTextures()` negative-radius arc crash. Image assets now finish loading, so stage backgrounds, gems, and other sprite art are available to the cabinet and game.
- Cabinet route art now applies if the background finishes loading after the cabinet activates; the cache tracks the resolved image source instead of only the route key.
- Added `DEATHS`/`CAPTURED` telemetry and dynamic panel typography to prevent score/header clipping at narrower widescreen sizes.
- Removed the old `gfx/ttdm/ui/menubg.png` forest backdrop from all menu screens and deleted the asset; menus now use the procedural starfield/grid background only.
- Removed the `gfx/ttdm/ui/maintitle.png` logo overlay from the title screen and deleted the asset; the title now uses only the procedural typography and frame.
- Reworked Senri Bakuchi into a dice-driven fight: six named non-spell rolls, a two-dice Double or Nothing spell, and a three-dice poker-hand All-In finale. Added pip-accurate dice FX and per-roll bullet formations.
- Broad danmaku identity pass completed across all 44 bosses: new signature bodies, trails, walls, lasers, orbiters, decoys, remembered scars, chore commands, and route-specific setpieces. Existing bullet types and effect caps were preserved.
- Rebalanced the pass after visual review: Para's four-sided frame now opens one safe vertical or horizontal lane instead of caging the player; Shitodo's SWEEP/SPILL/DUST and Jinbei's talent rotation were densified; Kurohebi now coils more often so its wake body reads during the fight.
- Added an all-boss VM harness that exercises all 102 attacks, detects generator exceptions, non-finite bullets, and cap violations, and confirms every attack fires.
- Reworked Tsuru Kaihou around unfinished work: inert draft sketches that are inked or scrapped, a three-sided frame whose missing side is drawn in before it contracts, and a progressively inked crane whose unfinished head is erased before takeoff. Updated his spell names and banter.

Current verification state:

- All intended JavaScript files pass `node --check`, including `js/gamepad.js` and `js/cabinet.js`.
- `controller-check.js` passes 16/16 on desktop and touch with a mocked standard pad; `all-boss-check.js` is `ALL-BOSS PASSED` with 44 bosses and 102 attacks.
- Desktop smoke passes `20/20`; touch smoke passes `32/32`; cabinet does not activate in fake-DOM or touch runs.
- Controller screenshots reviewed at 1280x960, landscape touch 844x390, and portrait 390x844. The title prompt, settings row, status header, two-column touch grid, listening overlay, and footer fit without clipping.
- User confirmed controller input works in real testing; non-standard pads and other browser/OS combinations remain optional coverage checks.
- `xeno-check.js` passes after the final dice, label-spacing, and cutin changes; targeted 1280x960 screenshots show readable dice faces, roll names, Double or Nothing, and the All-In hand.
- `padcheck.js`, both mocked API checks, and `client-ai-check.js` pass after the final asset-loader, cabinet, and danmaku changes.
- Final cabinet screenshots reviewed at 1920x1080 and 1366x768: play, boss, pause, gameover, and result have no clipping or duplicate HUD; backdrop art is loading.
- Final 1280x960, landscape touch, and portrait touch screenshots reviewed after the asset fix; compact HUD and DOM pad layouts remain intact.
- Rehaul contact sheets were reviewed for all 44 non-spells and last spells; no impossible cages or generator failures remain. Para's lane fix and the densified Shitodo/Jinbei/Kurohebi changes still need a real playtest for feel.
- Tenkai screenshots were reviewed at the draft, inked, frame-seal, crane-head, unfinished, and takeoff stages; the frame is fully on screen, its opening is labeled, the missing side is drawn in before sealing, and the crane reads as a crane. The frame/crane still need a real playtest for feel.
- Real-device touch/fullscreen behavior and a live Groq key still need manual validation.
- The cabinet, dice, Tenkai, and danmaku work are committed and pushed as `25d59e0`; the controller work is committed and pushed as `b838466`.

Next steps:

1. Validate non-standard controller hardware and other browser/OS combinations if available; the primary controller path has been user-confirmed.
2. Get real-device validation for touch spacing, safe areas, and fullscreen behavior if possible.
3. Test live `/api/generate-dialog` output once `GROQ_API_KEY` is configured; local banter remains the fallback.
4. Playtest the revised bosses, especially Tenkai's frame escape/crane takeoff, the new wall lanes, and late-route exclusions; tune density only if it blocks readability.
5. Commit/push only when the user explicitly asks.
