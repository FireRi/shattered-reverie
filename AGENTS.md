# AGENTS.md - Shattered Reverie Project Context

This file is the persistent operating context for coding sessions. Keep it current when architecture, commands, or work state changes.

## Project Snapshot

- **Game:** Shattered Reverie (working folder: `Len'en All-Star Reborn`), an original browser-based vertical danmaku game and Len'en tribute.
- **Stack:** Plain JavaScript, HTML, CSS, Canvas 2D, Web Audio. No framework, bundler, build step, or runtime package manager.
- **Entry point:** `index.html`; scripts load in dependency order and share globals.
- **Canvas:** Fixed internal resolution `640x480`, scaled uniformly by `js/boot.js`.
- **Repository:** `https://github.com/FireRi/shattered-reverie.git`, branch `main`.
- **Last feature commit:** `a721736 Add local two-player co-op` (pushed); prior replay/performance work `5efd057`, controller work `b838466`, cabinet/danmaku work `25d59e0`.
- **Working tree:** room-code online co-op (deterministic lockstep, host=P1/guest=P2) plus `js/net.js`, `js/netconfig.js`, `js/dmath.js`, and the `server/` relays. Standard/1CC only; Story and AI dialogue off online; online runs save a v4 replay but write no high score. Relay backends: Node `ws` (`server/index.js`, local/self-host) and Cloudflare Worker + SQLite Durable Object (`server/worker.mjs` + `wrangler.toml`, free/no-card production). The host now generates the 5-char room code client-side; both clients connect to `/ws?code=XXXXX&role=host|guest`. Needs the relay running and `?server=`/`NET_URL` set.
- **Previous feature:** playable local co-op (2P) across input, player lifecycle, boss targeting, HUD, items, game-over/results, gamepad, and replay.
- **Legacy working-tree noise:** line-ending-only changes in `.gitignore`, `CREDITS.md`, `assets/sfx/readme_EN.txt`, `assets/sfx/readme_JP.txt`, `fonts/OFL.txt`, and `fonts/VT323-OFL.txt`; stale untracked `DOCUMENTATION.md`. Do not stage these.

## Run And Verify

Serve the directory with any static server so `fetch()` assets and `/api/generate-dialog` behave normally. Opening `index.html` directly via `file://` works for most play, but AI dialogue fetch can fail gracefully.

Online co-op needs the relay running. Local Node: `cd server; npm install; npm start` (listens on `8787`, WebSockets at `/ws`, health at `/health`). Cloudflare: `cd server; npx wrangler login; npx wrangler deploy` (free, no card; prints `https://<name>.<subdomain>.workers.dev`), or `npm run dev:cf` for a local Worker + Durable Object. Open the game with `?server=ws://localhost:8787/ws` (or the `workers.dev` `wss://.../ws`), or set `window.LASR_NET_URL`/`NET_URL`. Set `ALLOWED_ORIGINS` in production. To test the Cloudflare backend end to end, run `wrangler dev` then `$env:RELAY_URL='ws://127.0.0.1:8788/ws'; node "...net-live-check.js"`.

Useful checks on Windows PowerShell:

```powershell
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }; node --check api/generate-dialog.js; node --check server/index.js; node --check server/worker.mjs
node "C:\Users\Gabby\AppData\Local\Temp\opencode\all-boss-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"
$env:TOUCH='1'; node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"; Remove-Item Env:TOUCH
node "C:\Users\Gabby\AppData\Local\Temp\opencode\replay-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\replay-flow-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\music-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-check.js"
$env:TOUCH='1'; node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-check.js"; Remove-Item Env:TOUCH
node "C:\Users\Gabby\AppData\Local\Temp\opencode\coop-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\padcheck.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\xeno-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\net-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\net-live-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\server-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\online-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\chara-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\readability-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\chara-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\p2p-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\cab-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\replay-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\xeno-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-shot.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\api-check.mjs"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\api-fallback-check.mjs"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\client-ai-check.js"
```

Expected current results:

- Desktop smoke: `25/25 PASSED`
- Touch smoke: `37/37 PASSED`
- `net-check.js`: `NET CHECK PASSED` for the DMath shim, host/guest input mapping, stall detection, v3 online replay validation, online screen drawing, and a two-pass seeded online run with matching state hashes.
- `net-live-check.js`: `NET LIVE PASSED` — two VM game instances over the real relay create/join/start and advance in lockstep with matching state hashes.
- `p2p-check.js`: `P2P CHECK PASSED` — two headless browsers against the deployed relay share a country and both reach the `p2p` transport (WebRTC). The net-check harness also covers delay sizing, the start barrier, and P2P gating/routing with a stubbed RTC peer.
- `server-check.js`: `SERVER CHECK PASSED` for relay health, create/join, config validation, ready/start, binary relay, malformed-packet rejection, ping/pong, and disconnect cleanup.
- `online-shot.js`: `ONLINE SHOT PASSED` at 1280x960 with no page errors; captures Online menu/join/lobby/wait/error and the title button.
- `chara-check.js`: `CHARACTER CHECK PASSED` for the six-character roster, solo/co-op runs, finite bullets, cap compliance, and DPS spread within 1.6×.
- `readability-check.js`: `READABILITY CHECK PASSED` — every non-spell telegraphs (30f warm), every spell has a cutin, curving/accelerating bullets get trails, and a spawn-near-player heuristic is clean across all 44 bosses.
- `chara-shot.js`: `CHARA SHOT PASSED`; captures the selection screen (solo/co-op/touch/portrait) and in-game shots for several characters.
- `controller-check.js`: desktop and touch `17/17 PASSED` with a mocked standard pad; covers held/edge keys, non-standard axis pairs, context mapping, enable/disable, remap capture, bind suppression, hotplug cleanup, persistence, and controller-screen drawing.
- `coop-check.js`: `CO-OP PASSED` for title toggle/persistence, P2 activation/spawn, isolated movement/shooting, nearest-player items, one-player-down continuation, both-down game over, route revive, 2P replay record/playback, second-pad ownership, and co-op HUD drawing.
- `replay-check.js`: `REPLAY PASSED` after a 5,000-frame deterministic record/playback with zero RNG starvation.
- `replay-flow-check.js`: `REPLAY FLOW PASSED` for save/export/import, playback-end results, input cleanup, auto-fire restoration, adaptive performance tiers, and no-AudioContext fallback.
- `music-check.js`: `MUSIC STRUCTURE PASSED` for the 36-bar form, arrangement sections, outro gating, and finite lead events.
- `all-boss-check.js` runs all 44 bosses and all 102 attacks for 760 frames each, checks generator errors, non-finite bullets, effect/text caps, and confirms every attack spawns bullets: `ALL-BOSS PASSED`.
- `xeno-check.js` validates all six dice faces and attacks, hand rankings, both xeno spells, and the natural non-spell → Double or Nothing → All-In attack sequence.
- Pad layout harness: no unintended canvas overlap; the 4:3 tablet overlay is intentional.
- `api-check.mjs` uses a mocked Groq response; it validates JSON parsing, alternating `b/p/b/p` order, and the 70B model request. `api-fallback-check.mjs` verifies the 8B JSON fallback.
- `client-ai-check.js` verifies browser-side cache, entry-time application, and the local AI-off fallback.
- `shot.js` covers 1280x960 4:3 fallback, landscape touch, and portrait touch; `cab-shot.js` covers 1920x1080 and 1366x768 cabinet mode; `xeno-shot.js` covers the dice non-spell, Double or Nothing cutin/pattern, and All-In hand.
- Screenshot harnesses use Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, CDP port `9223` (`controller-shot.js` uses `9224`, `online-shot.js` uses `9225`), and Node v24+ built-in WebSocket.

Screenshots are written to `C:\Users\Gabby\AppData\Local\Temp\opencode\`:

- `ui-*.png`: desktop 1280x960 (4:3, cabinet hidden), including `ui-dialog.png` and `ui-replay*.png` (Replay screen and playback HUD)
- `touch-*.png`: landscape touch 844x390, including `touch-dialog.png`, `touch-title-replay.png`, and `touch-replay-empty.png`
- `portrait-*.png`: portrait 390x844 after choosing "Play in portrait"
- `cab-*.png`: 1920x1080 cabinet play/dialog/boss/pause/result plus 1366x768 checks
- `xeno-*.png`: dice non-spell, Double or Nothing cutin/pattern, and All-In hand
- `pad-*.png`: connected-pad title prompt, Settings controller row, desktop/touch Controller screen, bind-listening overlay, and portrait layout
- `coop-play*.png` / `coop-pause.png`: 2P player sprites, compact two-row status rail, 2P cabinet/score flag, and pause layout
- `online-*.png`: Online menu/join/lobby/wait/error screens and the title online button
- `rehaul-*.png` / `rehaulN-*.png`: one spell and one non-spell per boss at 960x720; `rehaul-sheet-*.jpg` are contact sheets

The smoke/pad/screenshot harnesses are temporary, not committed. Add a portable `tools/` harness only if it becomes necessary.

## Architecture And File Order

Load order matters. Do not reorder `index.html` scripts.

```
js/engine.js     constants, IS_TOUCH, input, pools, shared state, SimRng, TouchUI, NET_BITS
js/dmath.js      deterministic sin/cos/atan2/sqrt/hypot shim for online/seeded replay
js/chara.js      6 playable characters: shot types, option layouts, speeds, aim
js/gamepad.js    Gamepad API bridge, padKeys/padEdge, remap + persistence
js/replay.js     deterministic input/RNG replay, save, JSON import/export, v4 seed/online
js/netconfig.js  NET_PROTO, NET_URL, room alphabet
js/net.js        room-code online co-op lockstep client (input relay, checksums, pause barrier)
js/audio.js      Web Audio buses, SFX synthesis, volume persistence
js/music.js      procedural stage/boss score generator
js/player.js     player states (PL/P2/players), shots, bombs, graze, movement
js/dialogue.js   44 boss banter profiles, AI cache, validation, fallbacks
js/boss.js       boss lifecycle and shared boss context API
js/story.js      story-mode mobs and wave control
js/render.js     gameplay sprites, bullets, effects, low-level drawing
js/gfxgl.js      optional WebGL instanced projectile batch (2D fallback)
js/patterns.js   stage 1-3 boss patterns and shared pattern helpers
js/p4.js js/p5.js js/p6.js js/pex.js js/pexa.js
js/main.js       game state machine, menus, HUD, route flow, UI kit
js/cabinet.js    desktop side-panel telemetry, route art, CabinetUI.sync
js/boot.js       viewport fitting, DOM touch pad, fullscreen, canvas tap zones
```

All game scripts live in `js/`. `index.html` stays at the repository root; `api/` must stay at the root for Vercel.

- All cross-file communication is through globals. Shared state includes `G`, `PL`, `BOSS`, `eshots`, `mobs`, `ROUTES`, and `settings`.
- `GamepadSupport` in `js/gamepad.js` polls `navigator.getGamepads()` once per fixed step from `js/main.js`. It writes held/edge state into `padKeys`/`padEdge`; in co-op a second pad writes `pad2Keys`/`pad2Edge`. `down()`/`hitK()` and `downP()`/`hitP()` merge those with keyboard state, so controller support must not overwrite `keys`/`edge`/`p2keys`/`p2edge`.
- Controller defaults: A shot, B flash, X spell, LB focus, Start pause, B cancel. The first connected pad wins; navigation scans axis pairs `0/1`, `2/3`, and `4/5` (strongest plausible pair) plus D-pad buttons `12-15`. Config persists in `lasr_gamepad`; standard-map labels are friendly, non-standard pads show `BTN n` and should be remapped.
- `Replay` in `js/replay.js` records per-frame input masks and `SimRng` output, snapshots the four dialogue lines, saves the last completed/failed single-credit attempt in `lasr_replay`, and exports/imports JSON run files. Format v2 adds optional `p2inputs` (3 numbers/frame); v1 files still load as 1P, and `Replay.wantP2` activates P2 for 2P playback. `G.replay` switches play into playback; `Replay.beforeUpdate()` is called before `updatePlay()`, and `Replay.endPlayback()` opens results without saving a high score. During playback the top-right HUD flags become `REPLAY <frame>/<total>`, and results are tagged `REPLAY // COMPLETE`, `REPLAY // FAILED`, or `REPLAY ENDED // NO SCORE SAVED`. Restart is blocked during playback. Playback files cap at 4.2 MB; continuing/retrying starts a new attempt rather than stitching segments. Replay opens from Settings or title `V` / the title touch button.
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

- Screens include: `title`, `diff`, `sel`, `settings`, `controller`, `replay`, `help`, `play`, `pause`, `gameover`, `result`, `demo`.
- Story mode uses waves and three credits; 1CC and Story 1CC use one credit and a full route. Continue/retry spend credits; pause restart also spends a credit and invalidates 1CC.
- Save keys include `lasr_hi`, `lasr_hi_0`–`lasr_hi_2` (per-difficulty), `lasr_diff` (0–2), `lasr_sel` (stage flags), `lasr_chara`/`lasr_p2chara` (character picks), `lasr_settings`, `lasr_mute`, `lasr_mvol`, `lasr_svol`, `lasr_gamepad`, and `lasr_replay`.
- Rendering: `js/gfxgl.js` batches enemy bullets (and player shots + items) as WebGL instanced quads into an offscreen canvas, blitted with `drawImage` when WebGL+instancing is available and ≥64 projectiles are on screen; otherwise `render.js` uses the Canvas 2D loops. Sprites are atlas-minted from the 2D canvases; sampling is NEAREST and the 2D projectile path sets `imageSmoothingEnabled=false`. Tainted/unavailable GL falls back to 2D. `drawEntities` draws **enemy bullets on top** of the player/shots/items/fx, and curving/accelerating bullets draw a 4-sample trail. Item bakes are keyed by `ASSETS.gen` so they re-bake when PNGs finish loading, and unloaded item art falls back to the 2D path; the title screen calls `GfxGL.warm()`. Collision hot paths use y-band early-out and squared distances. Rendering is sim-neutral.
- Readability/timeline: non-spell boss attacks get a **30-frame telegraph** (`BOSS.warm` in `js/boss.js`) before generating; spells keep the 110-frame cutin. This changes the tick timeline, so `REPLAY_VERSION` is **v4** (v1–v3 still load, but pre-v4 replays may diverge). Story uses Toaplan-style lane spawns (`STORY_LANES` in `js/story.js`). `readability-check.js` asserts every non-spell telegraphs and every curving bullet trails across all 44 bosses.
- Playable characters live in `js/chara.js` (`CHARAS`, `CHARAS[i].fire(p,pint)`, `optStyle`/`optCount`, `move`/`focus`). Six archetypes: Suzuran (homing), Kurogane (needle/shotgun), Kagenui (piercing laser), Hibari (spread), Kaede (angled), Yomogi (missile). `G.charaPicks` carries both slots; `startRun`/`startOnlineRun` apply them, `lasr_chara`/`lasr_p2chara` persist. Shot type is recorded in replay (`chara`/`p2chara`) and exchanged online (config + `pick`). `pierce`/shotgun-falloff/angled-aim are handled in `engine.js`/`chara.js`.
- Boss dialogue is a four-line boss/player/boss/player exchange. Every boss ID has a local profile in `js/dialogue.js`; AI output from `/api/generate-dialog` is prefetched, cached per boss, and ignored if it arrives after the exchange starts. Failures and missing keys always fall back to local banter. The endpoint requires `GROQ_API_KEY`; `GROQ_MODEL` optionally overrides the preferred 70B model.
- Keyboard: arrows move, Shift focus, Z shoot/confirm, C spell, X flash, Esc pause/back, R pause at restart/retry stage, S settings, H help, V replay, O online co-op, A autofire, F show FPS, M mute, `-`/`+` music. Title `2` toggles co-op.
- Co-op P2 keyboard: WASD move, J shot, K flash, L spell, I focus. P2 keys are ignored while solo so P1 hotkeys keep working; while co-op is active P2 consumes those keys before P1.
- Online co-op is a separate `G.screen='online'` flow (`openOnline`, `updateOnline`, `drawOnline`, `startOnlineRun`, `onlineCommitConfig`, `returnToOnlineLobby`). Rooms are 5-character codes; host=P1/guest=P2; the guest may use arrows or WASD. `Net` lives in `js/net.js` and loads after `js/replay.js` and before `js/main.js`; `NET_KEYS`/`NET_BITS` live in `js/engine.js`. Online enables `DMath` and disables AI dialogue; Standard/1CC only, no online high scores.
- Netcode: input delay `D = clamp(ceil((p95 RTT × 0.5)/16.667)+4, 4, 48)` (raised cap) with a `~1.5 s` start barrier that aligns tick 0; a `WAITING FOR PEER`/`HIGH LATENCY` overlay replaces the silent stall freeze. When both players share a country (the relay reports `request.cf` region in `created`/`joined`/`peer`), `Net` negotiates a WebRTC `RTCDataChannel` (STUN only) and routes binary inputs/checksums peer-to-peer, falling back to the relay on ICE failure; control stays on the relay. `NET_ICE` lives in `js/netconfig.js`; the Worker relays `rtc-*` and passes a continent-based `locationHint` to the DO.
- Controller: A shot/confirm, B flash/cancel, X spell, LB focus, Start pause; D-pad/stick navigate. Title Start/Y open Settings, View opens Help. In co-op the first pad drives P1 and the second pad drives P2. Settings → Controller handles enable, rebind, reset, and persistence.

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
- The pad hides on `help`, `controller`, `online`, `gameover`, `result`, and `demo`; it is visible on `title`, `diff`, `sel`, `pause`, `play`, and `settings`. The Controller screen uses canvas `TouchUI` rows instead.
- On touch, menus use large tile/row hit zones via `TouchUI.add()`; do not rely only on visual text bounds.

## Git And Working Tree Rules

- **Do not commit or push unless the user explicitly asks.**
- Before any future commit, inspect `git status` and `git diff`; stage only intended files.
- Do not stage line-ending-only changes: `.gitignore`, `CREDITS.md`, `assets/sfx/readme_EN.txt`, `assets/sfx/readme_JP.txt`, `fonts/OFL.txt`, `fonts/VT323-OFL.txt`. `js/p4.js`, `js/p5.js`, `js/p6.js`, and `js/pexa.js` now contain intentional danmaku edits, not line-ending-only changes.
- Historical commits: UI/dialogue overhaul `a5f5d78`, `js/` organization `7cfd061`, cabinet/dice/danmaku `25d59e0`, context refresh `cbd2a5b`, and controller support `b838466`.
- `DOCUMENTATION.md` is a stale untracked duplicate; leave it unstaged unless the user asks to update/remove it.
- `README.md` is the maintained technical deep dive. Keep this file focused on operational context and current state.

## Current Work State (2026-10-23)

In progress (online co-op, uncommitted):

- Added `js/dmath.js` (deterministic `sin`/`cos`/`atan2`/`sqrt`/`hypot`, `enable`/`disable`, enabled only online and for seeded v3/v4 replay), `js/netconfig.js`, `js/net.js`, the `server/` Node `ws` relay (`server/index.js`, `package.json`, `Dockerfile`), and the Cloudflare Worker + Durable Object adapter (`server/worker.mjs`, `server/wrangler.toml`). The host generates the 5-char code client-side and connects to `/ws?code=XXXXX&role=host|guest` (both backends); `busy` triggers a retry with a new code.
- `js/engine.js` adds `NET_KEYS`/`NET_BITS` and routes `down`/`hitK`/`downP`/`hitP` through `Net` while `Net.capturing`; `KEY.O` added.
- `js/main.js` adds `G.simFrame`/`G.simBeat` (gameplay tick separate from visual `G.frame`), gates `G.freeze` to play, adds the online screen/flow, `startOnlineRun`, `onlineCommitConfig`, `returnToOnlineLobby`, and online results handling; `js/player.js`/`js/p4.js` use the sim tick and Net analog/focus; `js/replay.js` is format v4 with `seed`/`online`/`dmath` (v3 accepted); `js/boot.js` maps guest touch to P2; `js/cabinet.js` adds the `ONLINE`/ping flags; `index.html` loads the new scripts and adds the hidden room-code input.
- Verified with `net-check.js` (`NET CHECK PASSED`), `server-check.js` (`SERVER CHECK PASSED`), `online-shot.js` (`ONLINE SHOT PASSED`), and the desktop/touch smoke, replay, co-op, controller, all-boss, xeno, and music harnesses.
- Not yet done: real two-browser playtest, Northflank deploy + `NET_URL`, and any commit.

Completed (local co-op Phase 2, committed `a721736`):

- `js/player.js` builds `PL` and `P2` from `newPlayerState(slot)`, exports `players`, and parameterizes lifecycle/combat/graze functions per player. `PL` remains the P1 alias; `P2` joins `players` only while co-op runs.
- P2 keyboard input uses `p2keys`/`p2edge` with canonical codes: WASD move, J shot, K flash, L spell, I focus. P2 bindings are consumed before P1 `keys` only while `players.length>1`, so solo hotkeys (`A` autofire, `S` settings) are unchanged; in co-op `A`/`S` become P2 movement.
- Title `2` (touch `2P` button) toggles and persists `settings.coop`; `startRun()` activates P2 outside Story/demo. P2 spawns 56 px right of P1. Story co-op is intentionally disabled.
- Boss aim and most pattern targeting use `targetPlayer()` (nearest living player); co-op boss HP is `1.8x`. Direct `PL` references in pattern files were replaced with `targetPlayer()`.
- Items target the nearest living player; graze/damage/bombs/deathbomb are per player. `onGameOver()` fires only when all players are down. Route advance revives a downed player if the route bonus gives them a life. One player dying does not end the run.
- Non-cabinet HUD draws a second magenta `P2` row (lives/spells/PWR/FLASH) and adds a `2P` score flag; cabinet flags include `2P`. P2 sprite uses magenta accents.
- `js/gamepad.js` polls a second pad into `pad2Keys`/`pad2Edge` when `players.length>1`; the first pad stays P1, the second drives P2. `releaseAll2()` runs on pause cleanup/disconnect.
- Replay format is v2 with optional `p2inputs` (3 numbers/frame). v1 files still load as 1P. `Replay.wantP2` activates P2 during playback; `Replay.start()`/`stop()` clear P2 input and analog state. 2P runs record/play back P2 movement deterministically.
- Verified with desktop/touch smoke, `replay-check.js`, `replay-flow-check.js`, `all-boss-check.js`, `controller-check.js`, and new `coop-check.js`. Visual check: 1280x960 co-op play/pause and touch title `2P` button.

Next: tune co-op balance and pattern readability against two players, test two physical pads/controllers, and decide whether Story co-op or online lockstep should follow.

Completed (replay/limitations pass, committed `5efd057`):

- Added `js/replay.js` and `SimRng` record/playback, per-frame input masks including `padEdge`, dialogue snapshots, local save, validated JSON export/import, 4.2 MB cap, pause restart lock, and playback-end results without high-score writes.
- Added Replay UI from Settings and title (`V` on desktop, title touch button), five rows (`PLAY LAST ATTEMPT`, `EXPORT RUN FILE`, `IMPORT RUN FILE`, `DELETE SAVE`, `BACK`), touch hit zones, status/error messages, an in-HUD `REPLAY <frame>/<total>` playback counter, and result-screen saved/ended tags.
- Added Story 1CC as difficulty index 5 with one credit, no continues, story waves, and full-route results handling; expanded story waves to six formations with per-formation mixes/caps and kept the power pity quota.
- Added adaptive rendering tiers (`perfLevel`) that drop bloom, bullet halos, nebula, and spell wallpaper under load while leaving simulation fixed at 60 Hz.
- Reworked procedural music to a 36-bar intro/verse/chorus/bridge/climax/outro form with seeded odd-loop variation.
- Improved stage 1-3 composition (Touhou-community touchstones: ZUN's hooks, Alstroemeria/eurobeat pulse): replaced random rhythm/contour noodles with two repeating question/answer hook motifs (chord-tone snapped strong beats, cadential tails), added sus/ninth chord color, up/down arpeggios, and off-beat eurobeat bass for S3. Verified via `music-check.js`, `smoke.js` (44 unique themes), and `all-boss-check.js`.
- Hardened Web Audio unlock/no-context fallbacks, expanded controller stick scanning to axis pairs `0/1`, `2/3`, `4/5`, and added cabinet quality flags.
- Optimized single-threaded rendering for low-spec devices: baked plain-circle/orb/star/bubble enemy bullets into cached sprites (`proceduralSprite` in `js/render.js`) so the common untextured colors (`ball:white`/`gray`, `orb:brown`, stars) render as one `drawImage` instead of per-frame `arc` fills and per-orb `createRadialGradient`. Verified via desktop/touch smoke, `all-boss-check.js`, `replay-check.js`, `xeno-check.js`, and `controller-check.js`.
- Updated `README.md`, this file, help/replay copy, and test harnesses. Committed as `5efd057`.

Completed (controller pass, committed):

- Added `js/gamepad.js` (Gamepad API polling, standard/non-standard labels, held/edge bridge, menu repeat, remap capture, bind suppression, hotplug cleanup, `lasr_gamepad` persistence) and loaded it after `js/engine.js`.
- Moved controller input into separate `padKeys`/`padEdge` layers; `down()`/`hitK()` merge them with keyboard input, and `autoPause` releases both controller and touch state.
- Added the Settings → Controller screen (`G.screen='controller'`) with enable/disable, six bind actions, reset, back, pad status, button/axis counts, listening state, and desktop/touch layouts. Touch can tap rows to bind and tap anywhere to cancel a listen; the touch binding overlay covers the screen.
- Expanded controller contexts: title Start/Y opens Settings, View opens Help, menus use A/B/Start, play maps shot/flash/spell/focus/pause, demo exits on controller input.
- Updated the title prompt/footer, help control matrix, cabinet `PAD` flag, README architecture/input/testing docs, and this file. Committed and pushed as `b838466`.
- Verified with a mocked standard pad on desktop and touch: `controller-check.js` passes 17/17 in both modes, desktop and touch smoke pass, and `ALL-BOSS PASSED` (44/102) still passes.
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

- All intended JavaScript files pass `node --check`, including `js/replay.js`, `js/gamepad.js`, and `js/cabinet.js`.
- `controller-check.js` passes 17/17 on desktop and touch with a mocked standard pad; `all-boss-check.js` is `ALL-BOSS PASSED` with 44 bosses and 102 attacks.
- Desktop smoke passes `25/25`; touch smoke passes `37/37`; cabinet does not activate in fake-DOM or touch runs.
- `coop-check.js` passes for P2 activation, input isolation, items, one/both-player death handling, route revive, second-pad ownership, 2P replay determinism, and HUD drawing.
- `replay-check.js` and `replay-flow-check.js` pass; the flow test also exercises adaptive performance tiers and the no-audio fallback.
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

1. Playtest local co-op with two physical pads/keyboards and tune boss HP (currently `1.8x`), pattern targeting, HUD density, and route-revive feel.
2. Decide whether Story co-op or online lockstep/WebRTC should follow; there is still no netplay implementation in the repo.
3. Validate non-standard controller hardware, real-device touch/fullscreen spacing, and other browser/OS combinations if available.
4. Test live `/api/generate-dialog` output once `GROQ_API_KEY` is configured; local banter remains the fallback.
5. Playtest Story 1CC, story formations, replay playback across routes, dense-frame performance tiers, and the revised bosses; tune only if readability or determinism breaks.
6. Commit/push only when the user explicitly asks.
