# Shattered Reverie — Technical Documentation

An original browser-based vertical danmaku (bullet hell) game built from scratch.
No frameworks, no build tools, no external dependencies at runtime.

---

## Table of Contents

1. [Architecture Overview](#architecture)
2. [File Structure](#files)
3. [Core Engine Systems](#engine)
4. [Pattern System](#patterns)
5. [Music Engine](#music)
6. [Rendering Pipeline](#rendering)
7. [Asset Pipeline](#assets)
8. [Testing](#testing)
9. [Optimization Notes](#optimization)
10. [How to Add Content](#extending)
11. [Known Limitations](#limitations)

---

<a name="architecture"></a>
## 1. Architecture Overview

The game runs as plain JavaScript in the browser using a single `<canvas>`
element for all rendering and the Web Audio API for procedural sound synthesis
and music playback. There is no framework, no bundler, no transpilation step.
Every game script is loaded via `<script>` tags in `index.html` in a specific order.

```
index.html
  ├── js/
  │   ├── engine.js      Core systems (loaded first, defines globals)
  │   ├── dmath.js       Deterministic math shim for online/replay lockstep
  │   ├── gamepad.js     Gamepad API bridge + remappable bindings
  │   ├── replay.js      Deterministic input/RNG recorder + shareable run files
  │   ├── netconfig.js   Relay URL + protocol constants
  │   ├── net.js         Room-code online co-op lockstep client
  │   ├── audio.js       SFX synthesis + music volume buses
  │   ├── music.js       Per-stage/boss procedural score generator
  │   ├── player.js      Player ship, shots, bombs, graze
  │   ├── dialogue.js    Boss banter profiles, AI cache, validation
  │   ├── boss.js        Boss state machine + shared context API
  │   ├── story.js       Story-mode trash mobs + wave control
  │   ├── render.js      All canvas drawing (bullets, mobs, FX, HUD helpers)
  │   ├── patterns.js    Stage 1–3 boss patterns + shared helpers
  │   ├── p4.js          Stage 4 bosses
  │   ├── p5.js          Stage 5 bosses
  │   ├── p6.js          Stage 6 bosses
  │   ├── pex.js         Extra stage bosses
  │   ├── pexa.js        Extra+a bosses + route definitions
  │   ├── main.js        Game state machine, menus, HUD, route flow
  │   ├── cabinet.js     Desktop cabinet HUD telemetry + route art
  │   └── boot.js        Viewport fitting + DOM touch pad + canvas tap zones
  ├── api/
  │   └── generate-dialog.js
  ├── server/            Online co-op relay: Node `ws` (local/self-host) + Cloudflare Worker
  ├── assets/sfx/        Sound effects
  ├── fonts/            UI fonts + licenses
  └── gfx/              Sprite and background art
```

All game code lives in `js/`; the entry point, Vercel API, and static assets stay at the root.

**Load order matters.** Each file builds on globals defined by previous files.
The dependency chain is:

```
engine.js + dmath + gamepad + replay + net  →  audio  →  music  →  player/dialogue/boss/story/render  →  patterns  →  p4/p5/p6/pex/pexa  →  main.js  →  cabinet.js  →  boot.js
(core + math + input + runs + online)          (sfx)     (score)     (systems + content helpers)              (S1–3)      (more bosses)            (state machine)  (desktop HUD)  (env)
```

All cross-file communication uses global scope. Functions declared in one file
are callable from any later file. Shared mutable state (`G`, `PL`, `BOSS`,
`eshots`, `mobs`) is defined in `engine.js` and accessed everywhere.

---

<a name="files"></a>
## 2. File Structure

### js/engine.js

The foundation layer. Contains everything that must exist before any content:

| Section | What it does |
|---------|-------------|
| Config & constants | Screen dimensions, color palette, key bindings, hitbox radii |
| Input system | Edge-triggered (`hitK`) and held (`down`) key polling, per-tick edge clearing |
| Deterministic RNG | `SimRng` (`rnd`, `irnd`, `pick`) feeds simulation and replay logs; `vrnd` feeds visual-only variation |
| Object pooling | `killE`/`spawnE` recycle bullet objects to reduce GC pressure |
| Entity arrays | `eshots[]`, `pshots[]`, `items[]`, `fx[]`, `ftext[]`, `elasers[]`, `mobs[]` |
| Field reset | `resetFieldSafe()` wipes shots, items, lasers and mobs on continue / quit-to-title |
| Player shots | `pUpdate()` tests the boss first, then every mob; dead homing targets retarget |
| Audio system (`audio.js`) | Web Audio context management, graceful no-audio fallback, SFX synthesis, sample-buffer playback, volume buses |
| Music engine (`music.js`) | Stage palettes + per-boss themes, 36-bar form with intro/verse/chorus/bridge/climax/outro, loop variation, spell-card phases |
| Replay (`replay.js`) | Input mask + deterministic RNG log, optional 2P input mask, dialogue snapshot, local save, JSON export/import, playback state |
| Player (`player.js`) | P1/P2 state, movement, shooting, options, graze, flash bomb, spell, trance, deathbomb |
| Boss framework (`boss.js`) | State machine (enter→dialog→fight→rest), attack lifecycle, damage rates |
| Item system | Spawning, magnet collection, floor expiry (P/B/L/S/K/O — O feeds the OD meter) |
| Laser system | Telegraphed straight-line hazards with warm-up/active/fade states |
| Effects (`render.js`) | Ring, spark, shard, trail, puff, crescent, bloom, beam, dice, seigaiha overlay |

### js/gamepad.js

Gamepad API bridge, loaded immediately after `engine.js`. It writes into
separate `padKeys` / `padEdge` layers that `down()` and `hitK()` merge with the
keyboard, so a controller can be used alongside the keyboard or DOM touch pad.
In local co-op a second connected pad writes `pad2Keys` / `pad2Edge` and drives
P2; the first connected pad stays on P1.

| Area | Behavior |
|------|----------|
| Default map | A = shot/confirm, B = flash/cancel, X = spell, LB = focus, Start = pause/start |
| Navigation | D-pad or left stick with a 30% deadzone; menu repeat starts after 340ms, then every 120ms |
| Title | Start opens Settings, Y also opens Settings, View opens Help |
| Menus | Shot confirms, B/Start backs out; shot, spell, pause and cancel work on every menu |
| Play/demo | Shot, flash, spell, focus and pause map to the existing keyboard codes; demo exits on any controller action |
| Remapping | `GamepadSupport.beginCapture()` waits for all buttons to be released, then binds the next new button |
| Persistence | `lasr_gamepad` stores `{enabled, map}` separately from `lasr_settings` |

Standard-mapped pads use friendly labels (`A`, `LB`, `START`, `D-LEFT`); a
non-standard pad shows `BTN <index>` so the player can remap it. The bridge
supports hotplug polling and the first connected pad. Navigation scans axes
`0/1`, `2/3`, and `4/5` and uses the strongest plausible pair, which covers
pads whose stick is not on axes `0/1`; D-pad buttons `12-15` take priority.
Rumble and motion are not used. Gamepad API support depends on the browser and
operating system; current Chrome, Edge, Firefox and iOS Safari expose it, while
some embedded or older browsers do not. Keyboard and touch input remain
available when no pad is connected or controller input is disabled.

### js/replay.js

Deterministic run recorder and playback layer. Gameplay randomness goes through
`SimRng` (`rnd`, `irnd`, `pick`); `replay.js` stores a log of those values beside
the per-frame input mask, so simulation replays identically without serializing
the full game state. Visual-only randomness uses `vrnd` and is excluded.

| Area | Behavior |
|------|----------|
| Capture | 60 Hz mask for movement, shot, flash, spell, focus, touch stick/focus, auto-fire, and pad edges; format v2 adds an optional per-frame P2 mask; format v3 adds `seed`, `online`, and `dmath` for seeded online playback |
| Dialogues | The four lines that appeared during the attempt are stored with the replay, so shared files keep their banter |
| Save | `lasr_replay` stores the last completed or failed single-credit attempt (4.2 MB cap) |
| Playback | Reconstructs the route, difficulty, mode flags, auto-fire state, and deterministic RNG; pausing is allowed but restart is blocked |
| Playback HUD | The top-right status flags are replaced by `REPLAY <frame>/<total>` while a replay runs |
| Sharing | `exportData()` / `download()` produce a `.json` run file; `importData()` / `requestImport()` validate and load it |
| End | Playback exhaustion or death opens the results screen without writing a high score; the report is tagged `REPLAY // COMPLETE`, `REPLAY // FAILED`, or `REPLAY ENDED // NO SCORE SAVED` |

The Replay screen opens from Settings or the title (`V` on desktop, the `REPLAY`
touch button) and offers five rows: play the saved attempt, export it as JSON,
import a shared JSON run, delete the local save, or go back. A newly recorded
attempt adds `REPLAY SAVED // SETTINGS > REPLAY` to its results report.

Replays are attempts, not full multi-credit sessions: continuing or retrying
after a game over starts a fresh segment and does not stitch the previous
segment into the file.

### js/dmath.js

Deterministic replacements for `sin`, `cos`, `atan2`, `sqrt`, and `hypot` that
use only arithmetic and comparisons, so two clients running the same simulation
produce identical results across JS engines. `DMath.enable()` patches `Math` and
`DMath.disable()` restores it. It is enabled only for online runs and for
seeded (v3) replay playback; solo play and v1/v2 replays keep native math.

### js/net.js + js/netconfig.js

Room-code online co-op. The host generates a seed and chooses the run; both
clients run a delayed-input lockstep simulation at 60 Hz and exchange per-frame
inputs over the relay. `netconfig.js` holds the protocol version, room-code
alphabet, and relay URL (override with `?server=ws://host/ws` or
`window.LASR_NET_URL`).

| Area | Behavior |
|------|----------|
| Room codes | The host generates a 5-character code locally and connects with `?code=XXXXX&role=host`; the guest joins the same code as `role=guest`. A `busy` reply makes the host retry with a new code |
| Roles | Host is P1, guest is P2; the guest may use arrow keys or WASD (P1+P2 layers are merged) |
| Delay | `D = clamp(ceil(RTT / 16.667) + 3, 4, 12)`, fixed for the run and shown as the lobby ping |
| Inputs | Each client sends its own 13-byte input packet; tick `N` runs only when both inputs exist, otherwise the client shows a stall and stops accumulating frames |
| Pause | A barrier pauses at `max(tick) + 2D + 15`; either player can request and resume |
| Desync | Every 30 ticks each client exchanges a state hash (RNG, score, players, boss, entity counts); any mismatch aborts to the lobby |
| Modes | Standard and 1CC with host-selected stage flags; Story and AI dialogue are disabled online |
| Scores | Online runs save a v3 replay but never write a local high score |

### server/

Two interchangeable relays for the same client protocol; neither simulates the
game, they only relay control and binary messages between the two sockets.

| File | Backend | Use |
|------|---------|-----|
| `index.js` | Node `ws` | Local development and any self-host/VPS. Rooms are held in memory and expire after 15 minutes idle |
| `worker.mjs` + `wrangler.toml` | Cloudflare Worker + Durable Object | Zero-cost, no-card production hosting. One SQLite-backed DO per room code, routed by name, using the WebSocket Hibernation API; room state is persisted so it survives hibernation |

Both accept `/ws?code=XXXXX&role=host|guest` and expose `/health`. Codes use
`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`. See “Running the relay” for deploy steps.

### js/patterns.js + js/p4–pexa.js

Pure content files. Each exports nothing — they call `registerBoss()` to add
entries into the shared `BOSS_DEFS` object, which `main.js` reads for route
construction.

Each pattern is an ES6 generator function that receives a **boss context**
object with bound helpers. Generators yield frame counts; the engine advances
them once per tick. When a generator returns (or is restarted after completion),
the engine calls `bossNextAttack()` again on the same generator function,
creating infinite loops from finite scripts.

```js
// Example: a simple spiral pattern
function*myBossN1(b){
  let k = 0;
  while(true){
    if(k % 4 === 0){
      b.ring(b.x(), b.y(), DN(12), DV(3), k * 7, 'ball:red');
    }
    if(k % 180 === 120) yield* b.mv(200, 100, 40);
    k++;
    yield; // advance exactly one frame
  }
}
```

### js/story.js

Story-mode trash mobs plus the wave controller. Active only when `G.story`
is true (selected from the difficulty menu).

| Piece | What it does |
|-------|-------------|
| Mob types | `drone` (aimed 3-way), `weaver` (wide fan), `tank` (ring + aimed kunai). Eased movement toward drifting anchors, banking tilt, HP bars. |
| Telegraphs | Every volley flashes a ring ~25 frames early; no fire during entry or off-stage; tank rings leave a gap facing the player. |
| Wave control | Six formations (`SWARM`, `WEAVE`, `SIEGE`, `BLITZ`, `PHALANX`, `HUNT`) with different mob mixes, gaps, and alive caps (`startStoryWave` / `updateStoryWave`); wave-clear bonus + boss handoff. |
| Drops | RNG loot per kill — P (power), B (points), O (overload: +12 OD, +2 flash). Tanks drop 3. |
| Power guarantee | A pity counter forces P drops when the remaining mobs can't cover the missing power, plus a top-up at wave clear, so the player always gains up to +1.0 (100) power before each boss regardless of formation. |

Mobs plug into the existing combat: player shots, beam, homing options, spell
ray, deathbomb and flash bomb all damage them (`damageMob` / `killMob`), and
body contact kills the player like a boss collision.

### js/main.js

Game state machine, screen renderer, HUD, menus, results screen, music-reactive
visuals, and the requestAnimationFrame loop.

The difficulty menu offers six modes: Easy, Original, Absurdly All-Star,
1CC (Original scaling, full route, 1 credit, no continues), Story
(Original scaling + mob waves, 3 credits), and Story 1CC (the story wave
campaign with one credit and no continues). Selecting a 1CC mode skips stage
select and starts the full route immediately. Story still uses stage select.

Credit system: normal runs start with 3 coins; 1CC and Story 1CC start with 1.
No coin is spent automatically on death. The game-over screen offers Continue
at the current boss or Retry the stage, each costing one coin
(`spendCredit()`). Pause → Restart Stage also costs one coin and immediately
ends 1CC eligibility. A 1CC or Story 1CC death goes straight to results as a
failure; a clear requires the full route with zero credits spent. The HUD
always shows `CREDIT ×N` (hidden only in demo playback); the results screen
totals credits used.

Story flow: `G.needWave` / `G.wave` interleave one mob wave before every boss —
`beginBossFight()` fires only after the wave reports clear (see `story.js`).
The transition clears leftover bullets and grants brief invulnerability.
Story 1CC uses the same flow with one credit and no continues.

State machine:
```
title → diff → sel → play ⇄ pause
                       play → gameover → play (continue/retry) or title
                       play → result → title
                     play → result (1CC failure) → title

title / settings → replay → play (playback, no score) → result → title
```

Persistence: `lasr_hi` plus per-difficulty `lasr_hi_0`–`lasr_hi_2`,
`lasr_diff` (saved 0–2 difficulty), `lasr_sel` (stage-select flags),
`lasr_mvol`, `lasr_svol`, `lasr_mute`, `lasr_settings` (JSON: music/SFX volume,
mute, shake, bloom, flash, auto-fire, FPS, AI dialogue), `lasr_gamepad`
(controller enable flag + button map), and `lasr_replay` (last attempt +
shareable run data). Settings are available from the title (S), pause menu, and
touch settings. The Replay row opens the run viewer; the Controller row opens a
dedicated remap screen. Keyboard and touch input remain active throughout.

### js/cabinet.js

Desktop-only cabinet HUD that lives in the widescreen gutters outside the
fixed 640×480 canvas. `boot.js` marks the body `cab-eligible` when the viewport
is non-touch, landscape, and has at least 150 CSS pixels of gutter per side;
`CabinetUI.sync()` then marks it `cab-live` on play, pause, demo, game-over, and
result screens. Menus and all touch/narrow layouts keep the compact in-canvas
HUD instead.

The left panel shows the current route art (via `routeBgKey()`), route number,
sector ID, stage title, route mode, and difficulty. The right panel mirrors
score, lives, spell stocks, power, flash, overdrive, graze, sparks, deaths,
captured spells, wave progress, streak, quality level, and optional
autofire/mute/FPS flags. Boss fights replace the normal in-canvas
score/status/route layout with a compact top strip containing the boss name,
HP bar, bosses remaining, timer, and spell banner. The cabinet layer is
pointer-transparent and hidden whenever the compact HUD is in use.

---

<a name="engine"></a>
## 3. Core Engine Systems

### 3.1 Game Loop

A fixed-timestep accumulator loop targeting 60 FPS:

```js
let acc = 0, last = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  acc += Math.min(now - last, 100);
  last = now;
  while(acc >= 1000/60){          // consume accumulated time in 16.67ms chunks
    acc -= 1000/60;
    G.frame++;
    // ESC handling
    // freeze-frame check (hit-stop)
    // state dispatch: updatePlay() or updateMenus()
    clearEdges();                  // edges live for exactly one tick
  }
  drawScreen();
}
```

Key design decisions:
- **Edge-triggered input lives one tick.** `clearEdges()` wipes all press-edges
  at the end of every update tick, preventing stale inputs from leaking across
  state transitions (e.g., Z pressed during gameplay accidentally confirming
  a menu after death).
- **Hit-stop** (`G.freeze > 0`) freezes updates but continues rendering,
  creating impact frames on boss kills without stopping the visual clock.

### 3.2 Bullet Lifecycle

Bullets are stored in a flat array `eshots[]` and managed by a free-list pool:

```
spawnE(options)  →  pops from epool[] or creates new object
                   →  applies defaults, overrides, NaN guards
                   →  computes vx/vy from v+ang
                   →  pushes into eshots[]

eUpdate()        →  per-bullet: angular velocity rotation, acceleration toward
                    max speed, custom fn callback, trance slow-field, position
                    integration, off-screen culling

killE(i)         →  nulls fn reference, pushes object back into epool[],
                    splices from eshots[]
```

Every bullet carries these fields:

| Field | Type | Purpose |
|-------|------|---------|
| `x, y` | number | Position |
| `vx, vy` | number | Velocity (computed from `v` + `ang`) |
| `v` | number | Speed magnitude |
| `ang` | number | Direction in degrees |
| `acc, max` | number | Acceleration per frame, terminal speed |
| `av, dur` | number | Angular velocity (deg/frame), duration of spin |
| `g, c` | string | Graphic type + palette color key |
| `r` | number | Collision radius |
| `grazed` | boolean | Whether this bullet has already been grazed |
| `fn` | function? | Optional per-frame behavior callback |
| `keep` | boolean | Suppresses off-screen culling |
| `seed` | number | Per-bullet random seed for deterministic variation |

The `fn` callback receives the bullet object each frame and returns `false`
to trigger deletion. This enables complex behaviors (homing, bouncing,
timed splits) without subclassing.

### 3.3 Boss Framework

Bosses are driven by a state machine:

```
enter (descend + warning banner)
  → dialog (typewriter textbox, Z to skip)
    → fight (attack active, timer counting down, HP depleting)
      → rest (brief pause between attacks)
        → fight (next attack) ...
          → dying (explosion, destruction sprite, item spray)
            → onDone() callback → next boss or route clear
```

Attacks are defined as objects in `BOSS_DEFS[id].atk[]`:

```js
{ l: 225 }                    // non-spell: HP bar only
{ n: 'Spell Name', l: 56 }   // spell card: name shown, capture bonus available
```

**Damage model**: raw player DPS × rate = effective damage. Non-spells use
rate 0.09; spells use rate 0.03. This means spells take ~3× longer to kill but
award capture bonuses, creating a risk/reward decision.

**Attack generators** are ES6 generator functions advanced one `yield` per
frame. When a generator completes (returns), the engine restarts it from the
beginning — making every pattern infinitely loopable without explicit wrapping.
This is intentional: attack termination is governed by HP depletion or timer
expiry, never by generator exhaustion.

#### Boss dialogue

Every boss ID has a four-line local exchange in `dialogue.js`, alternating
boss, player, boss, player. The exchanges are written per character using the
boss voice and signature spell imagery; `defaultDialog()` only supplies a
fallback if a profile is missing.

When AI dialogue is enabled, `main.js` prefetches the current and next boss
from `/api/generate-dialog`. Valid responses are cached per boss and preferred
over the local lines. A response is applied only while the boss is entering, so
late replies never rewrite a line already on screen. Missing keys, rate limits,
invalid JSON, and malformed speakers all fall back silently to local banter.
The API asks Groq for four alternating JSON lines and prefers
`llama-3.3-70b-versatile`, retrying with `llama-3.1-8b-instant`.
It requires `GROQ_API_KEY`; `GROQ_MODEL` can override the preferred model.

### 3.4 Player Systems

| System | Mechanic |
|--------|----------|
| Shot types | Power < 3: twin rapid bolts. Power ≥ 3: continuous beam (requires vertical alignment within cone; also burns mobs in its column). Both always fire option pellets alongside. |
| Options | 3 orbs (power < 2) or 5 orbs (power ≥ 2), orbiting when focused. Fire pellets every 4 frames. |
| Homing | When focused (Shift), the center 2 option pellets become homing seekers (7°/frame turn rate, 50% damage). With no boss alive they lock the nearest mob instead. |
| Graze | Bullets passing within 14px of hitbox grant +500 score, +1 flash gauge, OD meter progress. |
| Flash Bomb | X when gauge full: clears all bullets, damages mobs, brief invulnerability, no bonus penalty. |
| Spell | C key: screen-wide attack + sustained clearing ray. Costs one stock. Castable during story waves (no boss required). |
| Deathbomb | Press X/C within 16 frames of being hit: consumes a spell, cancels death, damages mobs. |
| Trance | OD meter fills from grazing while flash gauge is full. Auto-triggers: +50% damage, bullets slow near player, aura visuals. |
| Streak | Consecutive spell captures multiply capture bonus up to ×4. Reset on timeout or death. |

### 3.5 Collision Model

All collision is circle-vs-circle using squared distances (no sqrt):

```
Player hitbox: 2.6px radius (tiny, Touhou-style)
Graze radius: 14px ring around hitbox
Enemy bullet hit: dist² < (PLAYER_HIT_R + b.r × 0.55)²
Boss shot collision: dist² < (BOSS_HIT_R + 3)²
Mob shot collision: dist² < (m.r + 4)²
Mob body contact: dist < m.r + PLAYER_HIT_R kills (like boss contact)
Laser: point-to-segment distance < laser_width / 2 + PLAYER_HIT_R
```

The player's visible sprite is ~22px wide, but the hitbox is 2.6px —
standard danmaku convention where the sprite is decorative and the hitbox
is the true target.

### 3.6 Mobile / Touch Input

Touch support is detected once at load (`IS_TOUCH` in `engine.js`) from
`navigator.maxTouchPoints` or `ontouchstart`. It does not disable the keyboard.

- **Movement**: the virtual joystick is a DOM control outside the canvas.
  In landscape it sits in the left letterbox gutter; in portrait it sits in a
  bottom control deck. Deflection is analog with a 22% deadzone; the ship
  moves in the stick direction at a speed proportional to how far it is
  pushed. Keyboard arrows continue to work.
- **Fire**: the large `FIRE` button holds the shoot key (`Z`) for as long as
  it is pressed, so tapping/holding fires normally. It also confirms menu
  options and advances dialog. Auto-fire is an optional Settings toggle (off
  by default on touch).
- **Bomb / cancel**: in play, `BOMB` sends `X` (flash bomb when the gauge is
  full, deathbomb during the 16-frame window); in menus it acts as
  Back/Cancel.
- **Focus / spell / pause**: the `FOCUS` toggle replaces Shift (0.58× speed
  and homing); `SPELL` spends a spell stock (also usable as a deathbomb);
  `II` pauses. `FULL` toggles fullscreen (and requests landscape lock) from
  any pad screen; it is hidden when the browser lacks the API.
- **Menus**: the joystick navigates every cursor menu (difficulty, stage
  select, pause, settings) with initial-press and auto-repeat edges;
  `FIRE` confirms, `BOMB` backs out. Canvas tap zones and dialog
  tap-to-advance remain available. Stage select uses a 2×4 grid with
  SELECT ALL.
- **Layout**: `fit()` uses `visualViewport` dimensions and offsets. Landscape
  places the pad in the side letterbox gutters when they are wide enough;
  portrait aligns the canvas above a bottom deck. When no gutters exist
  (4:3 tablets), controls fall back to a bottom overlay. The pad is hidden on
  help, controller, game-over, result, and demo screens. Safe-area insets keep
  the stick, buttons, and pause/full controls clear of notches and home indicators.
- **Hit testing**: menu taps still use rectangular zones registered with
  `TouchUI.add()` each frame and resolved by `boot.js` in reverse draw order.
  The joystick and action buttons are real DOM elements with pointer events,
  so they never pass through to the canvas. Zones reset at the start of every
  `drawScreen()`.
- **Orientation**: portrait phones show a rotate overlay with `FULLSCREEN`
  (requests fullscreen, then landscape lock) and `PLAY IN PORTRAIT`. The
  640×480 canvas is letterboxed and scaled to fit either orientation.

### 3.7 Controller Input

Gamepad support is independent of `IS_TOUCH`, so the same pad works on desktop
and mobile browsers. `js/gamepad.js` polls `navigator.getGamepads()` once per
fixed game step and feeds held/edge keys into the shared input layer. The first
connected pad wins; unplugging releases every mapped key so the player cannot
get stuck moving or firing.

The Settings → Controller screen can enable/disable controller input, rebind
the six actions, restore defaults, and toggle between pad and keyboard/touch.
Remapping waits for all buttons to be released, then binds the next newly
pressed button. Bindings persist in `lasr_gamepad`. A controller button press
never binds itself through to gameplay: after a successful bind, mapped input
is suppressed until every button is released.

Standard gamepads are assumed to use the W3C standard mapping (A/B/X/Y,
shoulders, Start, D-pad, left stick on axes 0/1). Pads that report
`mapping: ''` still work, but the UI labels buttons as `BTN <index>` and the
player should remap the six actions. Rumble and motion are not used. Gamepad
support depends on browser/OS recognition; keyboard and DOM touch controls stay
active and can be used to reach Settings if a pad is not detected.

### 3.8 Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| Arrows | Play / menus | Move / navigate |
| Shift | Play | Focus (slow movement + homing options) |
| Z / Enter | Play / menus | Shoot / confirm |
| C | Play | Cast a spell |
| X | Play | Flash bomb (also cancels the pause confirmation) |
| Esc | Play / menus | Pause / back |
| R | Play / game over | Pause at Restart / retry the stage |
| S / H | Title | Settings / help |
| V | Title | Open Replay |
| O | Title | Open online co-op |
| 2 | Title | Toggle local co-op |
| A | Any except playback | Toggle auto-fire (solo; P2 movement in co-op) |
| F | Any | Toggle the FPS readout |
| M | Any | Mute all audio |
| `-` / `+` | Any | Lower / raise music volume |

### 3.9 Local Co-op

Local co-op is toggled on the title screen with `2` (or the touch `2P` button)
and persists in `lasr_settings`. It is disabled for Story and demo runs. P2
uses `WASD` to move, `J` to shoot, `K` for the flash bomb, `L` for a spell,
and `I` to focus; a second connected pad drives P2 when active. Each player
has separate lives, spells, power, graze, flash meter, and deathbomb state,
while score, overdrive, and the route are shared. Items target the nearest
living player, boss aim targets the nearest living player, co-op boss HP is
`1.8x`, and the run ends only when both players are down. A route clear can
revive a downed player when the route bonus grants a life. Replays record P2
input as an optional `p2inputs` stream and restore it during playback.

### 3.10 Online Co-op

Online co-op is opened from the title with `O` (or the touch `ONLINE` button).
One player hosts a room and shares the 5-character code; the guest joins by
typing it. The host chooses Standard or 1CC and the stage flags, picks the run
seed, and both players ready up before deploying. A `?room=CODE` link pre-fills
the join code.

The guest controls P2 with arrows or `WASD` (`J` shot, `K` flash, `L` spell,
`I` focus) and the touch pad maps to P2. Either player can request a pause;
resuming re-primes the input delay. Story, AI boss dialogue, continues, and
high-score writes are disabled online. If the two simulations disagree, the run
aborts back to the lobby. A completed online run still saves a v3 replay.

---

<a name="patterns"></a>
## 4. Pattern System

### 4.1 Boss Context API

Every generator receives a context object `b` providing these helpers:

| Method | Signature | Description |
|--------|-----------|-------------|
| `b.x()` / `b.y()` | getter | Current boss position |
| `b.px()` / `b.py()` | getter | Current player position |
| `b.aim(fx?, fy?)` | → degrees | Angle from source to player |
| `b.S(opts)` | void | Spawn single bullet with full control |
| `b.ring(x,y,n,v,a0,g,o?)` | void | Full circle of bullets |
| `b.fan(x,y,n,v,c,a0,g,o?)` | void | Aimed fan (spread arc) |
| `b.arc(x,y,n,v,a0,a1,g,o?)` | void | Arc segment between two angles |
| `b.mv(tx,ty,frames)` | generator | Smoothstep movement over N frames |
| `b.laser(o)` | void | Spawn telegraphed straight laser |

Bullet graphic strings use format `'type:color'`, parsed by `parseG()`:

```js
b.S({ x:100, y:100, v:4, ang:90, g:'kunai:red', r:6 });
// → { g:'kunai', c:'red', ... }
```

Available types: `ball`, `rice`, `kunai`, `bubble`, `star`, `crystal`,
`orb`, `amulet`, `flower`, `feather`

Available colors: `red`, `pink`, `orange`, `yellow`, `green`, `lime`,
`teal`, `blue`, `dblue`, `purple`, `white`, `gray`, `black`, `brown`

### 4.2 Pattern Design Guidelines

Patterns should:
- **Loop infinitely** — the engine restarts completed generators automatically
- **Use `yield` as frame delay** — `yield 30` waits 30 frames between bursts
- **Scale with difficulty** via `DN(count)` for bullet counts and `DV(speed)`
  for velocities
- **Have a signature shape** — every spell should produce a recognizable visual
  formation (wheel, flower, weave, wall) not just random scatter
- **Telegraph dangerous moments** — use `addText('!')`, `fxSpark`, or
  `screenFlash` before high-speed volleys
- **Snapshot, don't alias, stop-times in `fn` closures** — `const self=u`
  keeps a *live* reference, so `inner.t - self.t` is always 0 and a timed
  burst never fires (this froze Oboro Nume's bubbles mid-screen). Capture a
  scalar instead: `const t0=u.t` … `if(inner.t - t0 > 80)`

Difficulty scaling is applied through two global functions:

```js
DN(bulletCount)  // scales count by difficulty multiplier
DV(speedValue)   // scales speed by difficulty multiplier
```

Easy mode reduces both; Absurdly All-Star increases them.

### 4.3 Boss Identity Pass

Every one of the 44 bosses now has at least one signature mechanic layered
onto its original role. The pass favors readable, character-specific
formations over raw density: a mechanic should describe who the boss is and
leave a deliberate route through the screen.

| Route | Bosses | Signature beats |
|-------|--------|-----------------|
| S1 | Kurohebi, Jun, Souko, Mitsumo | Wake body, tracked geysers and rain walls, exploding seals, centipede legs |
| S2 | Aoji, Shou, Tsugumi, Medias, Kujiru | Whirl vortices, traffic lanes, dash walls, bouncing prisms, slime towers |
| S3 | Lumen, Iyozane, Ooya, Kaisen, Sese | Splitting prisms, reanimating soldiers, cross-slashes, lucky coins, eruptions |
| S4 | Hooaka, Hibaru, Kaoru, Garaiya | Divider color split, candlestick columns, cloud spear, three orbiting casters |
| S5 | Kuroji, Sukune, Taira, Sanra, Para | Wing spirals, buried mines, rotating court, decoy orbs, safe-lane frame |
| S6 | Clause, Yaorochi, Saragimaru, Shion, Mitori, Chouki | Constellations, skyfall slit, mirror/sword/jewel, three heads, red tide, stitch wall |
| EX | Haiji, Yago, Xeno, Tenkai, Kokoro, Suzumi | Blink orbs, brush wall, dice hands, unfinished-ink frames and crane, mask orbit, remembered scars |
| EXA | Shitodo, Preschool, Emperor, Brokenteam, Jinbei, YabusameX, Tsurubami, Suzumiex, Shrine | Chore calls, recess, commands, fractures, talents, two worlds, void, scars, soul |

Wall mechanics use static `keep:true` bullets with a visible telegraph, then
release after a short delay. Leave one safe gap or lane, or show a distinct
opening and then seal it only after a separate forced-exit telegraph; never
spawn an unescapable cage without warning. New patterns must respect the
existing `fx` (300), `ftext` (40), and `eshots` (1600) caps.

Tsuru Kaihou's fight is built around unfinished work. Pale draft bullets are
harmless (`hit:false`, `grazed:true`) until they are inked orange. His frame
spell leaves one side open, then draws the missing side in and contracts;
his crane spell inks each body part before the unfinished head is erased and
the finished crane takes off. The helpers are `tenSketch`, `tenInk`,
`tenLaunch`, `tenEach`, and `tenCrane` in `js/pex.js`.

### 4.4 Difficulty System

```js
DIFF_EASY = 0   // DN×0.65, DV×0.85, boss HP×0.75
DIFF_ORIG = 1   // baseline
DIFF_ABEX = 2   // DN×2.2, DV×1.28, boss HP×1.15
MODE_1CC  = 3   // Original scaling, full route, 1 credit, no continues; restart forfeits clear
MODE_STORY = 4  // Original scaling + pre-boss mob waves, 3 credits (see story.js)
MODE_STORY_1CC = 5 // Story waves + full route, 1 credit, no continues
```

---

<a name="music"></a>
## 5. Music Engine

The score is generated at runtime by a stage-aware procedural composer in
`music.js`. No audio files are used for BGM. Every boss has a deterministic,
unique theme derived from its `bgmSeed`/`bgmTempo`, inside the sound-world of
its stage.

Style touchstones are broad genre references rather than quoted material:
ZUN's modal, hook-driven melodies; beatMARIO's driving eurobeat; Demetori's
metallic double-kick riffs; Alstroemeria Records trance; SOUND HOLIC's
rock/electronic hybrids; FELT's reverb-heavy atmosphere; EastNewSound and
ShibayanRecords textures. All note data is original and generated per seed.

### Stage Sound-Worlds

| Route | Palette | Modes | Drum feel | Character |
|-------|---------|-------|-----------|-----------|
| S1 | Nocturne | aeolian/dorian | half-time rock | mysterious, swaying |
| S2 | Rainfall | dorian/aeolian | breakbeat | flowing, rainy, seventh chords |
| S3 | Radiance | ionian/lydian/mixolydian | four-on-floor | bright, uplifting trance |
| S4 | Fog | phrygian/aeolian | half-time industrial | dissonant, heavy dread |
| S5 | Underworld | harmonic/phrygian dominant | metal double-kick | aggressive, fiery |
| S6 | Astral | harmonic/aeolian | four-on-floor | cosmic finale, wide pads |
| EX | Reverie | lydian/mixolydian/dorian | breakbeat | dreamlike, off-kilter |
| EXA | Void | phrygian dominant/harmonic | metal | monochrome, maximal chaos |

Boss seeds select a root offset, mode, 8-bar progression, lead waveform, and a
pair of hook motifs within that palette. The result is a shared stage identity
with 44 distinct boss themes (verified unique in tests). Stage music plays
during waves and route travel; the boss theme starts on boss entry and
intensifies per spell card.

### Track Structure

- **36-bar form** (`bar = floor(step/16) % 36`): intro 8, verse 8, chorus 8,
  bridge 4, climax 6, and outro 2 bars.
- **Hook motifs**: each theme draws two rhythmic/pitch cells (a "question" A
  motif ending unresolved and an "answer" B motif resolving to the chord root).
  The melody states A in the intro/verse and B in the chorus/climax, transposed
  to follow the harmony, so a short hook repeats over changing chords. Strong
  beats snap to chord tones while passing tones ride the off-beats; the last
  bar of each 4-bar phrase cadences to the chord root.
- **Harmony color**: S1 adds suspended thirds on the sway; S2 stacks seventh and
  ninth extensions for its rainy flow; S3 opens into ninth-stacked trance
  triads. Extensions feed the arp and counter-line, not the pad.
- **Arrangement gating**: drums enter after the opening, bass and arp build the
  verse, the lead arrives at bar 12, counter-melody and full hats join the
  chorus/climax, and the outro strips back to pad/bass. Tom/snare fills land
  every 4 bars; stage breakdowns sit at bars 7 and 23.
- **Rhythm feel**: S1 keeps root/fifth half-time rock bass; S2 runs an up/down
  arpeggio over its breakbeat; S3 switches to off-beat eurobeat bass (octave
  pump at the climax) with a 16th-note up/down arp.
- **Loop variation**: odd loops add an extra arp step and alter accents while
  preserving the seeded theme. The track is still deterministic per seed.
- **Spell phases**: `startBossBgm(def, phase)` advances arrangement energy.
  Phase 1 (first spell) opens the lead; phase 2 (later/final spells) adds
  counter-lines and sparkle. The theme itself never swaps mid-boss.

### Architecture

```
Music.buildBoss(def, phase)   → deterministic per-boss config + 36-bar score
Music.buildStage(route)       → stage palette track for waves/route travel
Music.tick()                  → lookahead scheduler (40ms interval, 240ms buffer)
Music.scheduleStep()          → synthesizes one 16th note with WebAudio nodes
startBossBgm / startStageBgm  → track switching (step and clock reset)
startTitleBgm / stopBgm       → menus and results
```

### Synthesis Voices

| Voice | Technique | Used for |
|-------|-----------|----------|
| Lead | Two detuned oscillators (pulse25/square/saw/triangle) → lowpass sweep → feedback-delay echo | Melody |
| Pad | Six detuned triangle/saw voices → 1.5kHz lowpass, slow attack | Harmonic glue |
| Bass | Sawtooth + sine sub-octave through resonant lowpass envelope | Low end |
| Arp | Plucked wave (8th notes, 16ths at high phase) | Chord motion |
| Kick | Pitch-swept sine (155Hz → 44Hz); extra 16ths for metal | Pulse |
| Snare | Bandpassed noise burst + triangle body | Backbeat |
| Hat / open hat | Highpassed noise micro-bursts | Offbeat texture |
| Toms | Pitch-dropped sines in 4-bar fills | Transitions |
| Crash | Long highpass noise swell | Section accents |

All voices connect through a shared gain node → compressor → master output.
A separate echo bus (delay + feedback + highpass) adds spatial depth; delay
time follows the theme BPM.

---

<a name="rendering"></a>
## 6. Rendering Pipeline

Single canvas, redrawn from scratch every frame:

```
drawScreen()
  ├── drawBG()           Gradient + parallax stars + nebula blits +
  │                      aurora ribbons + vignette + route scenic backdrop
  ├── drawSpellBG()      Full-screen spell-card backdrop + seigaiha wave
  ├── drawEntities()     Lasers → mobs → enemy bullets → player bullets →
  │                      items → player → FX particles → floating text
  ├── drawBoss()         Aura rings + monogram + hurt flash + magic circle
  ├── applyBloom()       Downscaled additive glow pass (0.15 alpha, toggleable)
  ├── drawHUD()          Score, boss bar, timer, lives, credits, spells,
  │                      power, flash gauge, OD meter, streak, spell history,
  │                      wave counter (hidden during boss dialog)
  ├── drawCutin()        Speedlines + gradient band + letter cascade +
  │                      portrait panel (during spell declarations)
  └── Overlays           Warning banner, dialog box, screen flash, pause menus
```

The pause screen draws the frozen field underneath its overlay. Management
screens (settings/help) share the menu background and petal/star animation.

`updatePerformance()` samples `fpsVal` once per second and caps `perfLevel`
with hysteresis. At level 1 it disables the bloom pass; at level 0 it also
removes bullet halos, nebula parallax, and the seigaiha spell wallpaper. This is
a rendering-quality fallback only: simulation, collision, and input timing stay
at the fixed 60 Hz step.

### Draw Call Budget

Enemy bullets are drawn as a single `drawImage` each from a sprite cache keyed
by `family|color|tier`: `bulletSprite()` pre-composites halo + body + highlight
for asset-backed families, and `proceduralSprite()` bakes the plain circle,
orb, star, and bubble shapes (halo + fill + edge) so the common untextured
colors (`ball:white`, `ball:gray`, `orb:brown`, …) never fall back to per-frame
`arc` fills or `createRadialGradient`. At peak density (~500 bullets) the
per-frame budget is:

- ~500 bullet `drawImage` blits (cached sprites, scaled/rotated)
- ~100 small `drawImage`/`fillRect` calls for effects
- ~10 text draws for HUD
- 1 `drawImage` for the background gradient cache
- 4 `drawImage` for nebula tiles

Canvas state changes (fillStyle, strokeStyle, globalAlpha) are minimized by
batching same-style operations, reusing cached gradients, and avoiding
per-entity gradient allocation.

---

<a name="assets"></a>
## 7. Asset Pipeline

### Fonts
| Font | License | Source |
|------|---------|--------|
| Press Start 2P | SIL OFL 1.1 | Google Fonts |
| VT323 | SIL OFL 1.1 | Google Fonts |

Loaded via CSS `@font-face`, referenced in canvas as `"Pixel8"` and `"VT323R"`.

### Sprites
| Set | License | Location | Used for |
|-----|---------|----------|----------|
| Touhou Tales of Danmaku | MIT | gfx/ttdm/ | Enemy/player bullets, items, gems, effects, backgrounds, yin-yang |
| Kenney Particle Pack | CC0 *(currently unused)* | gfx/particles/ | *(removed — replaced by procedural textures)* |

TTDM sprites are organized by family:
```
gfx/ttdm/bullets/hostile/  ball_{color}.png, rice_{color}.png, etc.
gfx/ttdm/bullets/player/   amulet.png, homingamulet.png, stardust.png
gfx/ttdm/entities/items/   power.png, point.png, life.png, bomb.png
gfx/ttdm/effects/          warning.png, destruction.png, bosscharge.png...
gfx/ttdm/ui/gems/          lifegem.png, bombgem.png
gfx/ttdm/backgrounds/      stage1_spellcard.png, etc.
```

### Procedural Textures
Generated at startup into cached offscreen canvases:

| Texture | Generation method |
|---------|-------------------|
| `gen_glow` | Radial gradient (white core fading to transparent) |
| `gen_ring` | Circle stroke |
| `gen_disc` | Filled circle |
| `gen_seigaiha` | Concentric arc scales in overlapping rows (traditional Japanese pattern) |
| Tinted sprites | Source sprite + `source-in` fill = recolored copy, cached by `(sprite, color, size)` key |
| Bullet sprites | Halo + body + highlight composited once per `(family, color, tier)` into a 96px canvas (`bulletSprite`/`proceduralSprite`) |

---

<a name="testing"></a>
## 8. Testing

The historical `_smoke.js` harness is not included in this checkout (the file
is ignored by `.gitignore`). Validate changes with syntax checks:

```
node --check js/engine.js
node --check js/dmath.js
node --check js/gamepad.js
node --check js/netconfig.js
node --check js/net.js
node --check js/audio.js
node --check js/music.js
node --check js/player.js
node --check js/dialogue.js
node --check js/boss.js
node --check js/story.js
node --check js/render.js
node --check js/patterns.js
node --check js/p4.js
node --check js/p5.js
node --check js/p6.js
node --check js/pex.js
node --check js/pexa.js
node --check js/main.js
node --check js/cabinet.js
node --check js/boot.js
node --check api/generate-dialog.js
node --check server/index.js
node --check server/worker.mjs
```

Optional local harnesses (kept outside the repo) also exercise runtime behavior:

```powershell
node "C:\Users\Gabby\AppData\Local\Temp\opencode\all-boss-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\smoke.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\replay-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\replay-flow-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\music-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-check.js"
$env:TOUCH='1'; node "C:\Users\Gabby\AppData\Local\Temp\opencode\controller-check.js"; Remove-Item Env:TOUCH
node "C:\Users\Gabby\AppData\Local\Temp\opencode\coop-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\xeno-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\net-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\net-live-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\server-check.js"
node "C:\Users\Gabby\AppData\Local\Temp\opencode\online-shot.js"
```

`net-check.js` runs the deterministic math shim, host/guest input mapping,
stall detection, v3 online replay validation, and a two-pass seeded online run
that must produce matching state hashes. `server-check.js` starts the Node relay
and exercises room routing, busy/no-room/full rejection, config/ready/start,
binary relay, malformed-packet rejection, ping/pong, and disconnect cleanup.
`net-live-check.js` runs two VM game instances through a live relay in lockstep
and compares a state hash at a common tick; set `RELAY_URL` to point it at
`wrangler dev` (e.g. `$env:RELAY_URL='ws://127.0.0.1:8788/ws'`) to validate the
Cloudflare backend. `online-shot.js` captures the Online menu/join/lobby/error
screens in Edge.

### Running the relay

**Local (Node):**

```powershell
cd server
npm install
npm start
```

Listens on `http://localhost:8787` (`/health`) with WebSockets at `/ws`. Serve
the game, then open it with `?server=ws://localhost:8787/ws` (or set
`window.LASR_NET_URL`/`NET_URL`). Set `ALLOWED_ORIGINS` (comma-separated, or `*`)
to restrict origins.

**Production (Cloudflare, free, no card):**

```powershell
cd server
npx wrangler login      # browser OAuth
npx wrangler deploy     # prints https://<name>.<subdomain>.workers.dev
```

Then point the client at `?server=wss://<name>.<subdomain>.workers.dev/ws` (or
bake it into `NET_URL`). Set `ALLOWED_ORIGINS` in `wrangler.toml` to the game's
origin when done testing. Free-plan limits: 100k requests/day (WebSocket
messages count at 20:1), 13k GB-s/day, 5M row reads / 100k writes per day.

The `server/Dockerfile` (Node image) is kept as a self-host option and runs on
the Northflank free Sandbox; `PORT` is supplied by the platform.

`controller-check.js` mocks a standard gamepad and verifies held/edge mapping,
title/menu bindings, stick movement, enable/disable, remap capture, bind
suppression until release, hotplug cleanup, non-standard labels, persistence,
and desktop/touch drawing. `controller-shot.js` is the optional visual pass for
the title prompt and Controller screen at desktop, landscape-touch, and
portrait sizes.

`all-boss-check.js` runs all 44 bosses and 102 attacks, rejecting generator
exceptions, non-finite bullets, cap overruns, and attacks that never fire.
`replay-check.js` records and replays 5,000 frames without RNG starvation;
`replay-flow-check.js` covers save/export/import, playback ending in results,
input cleanup, auto-fire restoration, adaptive performance tiers, and the
no-AudioContext fallback. `music-check.js` validates the 36-bar form,
arrangement sections, outro gating, and finite lead events. The `*-shot.js`
harnesses are optional visual passes; `replay-shot.js` captures the Replay
screen and playback HUD.

Manual regression checklist:
- Title → difficulty → stage select → play.
- 1CC selection starts the full route immediately with 1 credit.
- Story 1CC selection starts the full story route with 1 credit and no continues.
- Normal death opens game over without spending a credit; C, Z, or R spend one.
- Pause → Restart Stage confirms, spends one credit, and ends 1CC eligibility.
- 1CC and Story 1CC deaths reach results marked FAILED.
- Story formations rotate and each clears into its boss with no leftover bullets.
- Replay: finish a run, open Settings/Title → Replay, play it back, then export
  and re-import the `.json` file. The HUD shows `REPLAY <frame>/<total>` during
  playback. Playback ends in results without saving a high score and reports
  `REPLAY // COMPLETE`, `REPLAY // FAILED`, or `REPLAY ENDED // NO SCORE SAVED`;
  pause restart is unavailable.
- Boss dialogue shows four alternating lines; AI-off and API-failure paths use local banter.
- Title BGM restarts after results or quitting from pause.
- Each boss starts its own theme; spell cards intensify the same theme rather
  than swapping tracks; stage music returns on story waves and route changes.
- Settings/help open from the title (S/H) and pause, and persist after reload.
- Flash bomb fires only when the gauge is full; C always casts a spell.
- Boss signature walls and frames leave a readable safe lane; no attack closes
  all four sides around the player.
- Desktop cabinet: at 1920×1080 and 1366×768, play/pause/result show both side
  panels, and boss fights use the compact top strip with no duplicate in-canvas
  score, status rail, route tag, or wave text. Left art follows the route.
- Desktop cabinet: at 1280×960 and below the 150px gutter threshold, the panels
  stay hidden and the compact in-canvas HUD remains intact.
- Desktop cabinet: the keyboard hint is hidden while the cabinet is live, and
  resizing across the breakpoint does not leave stale panels on screen.
- Touch: the DOM joystick sits in the landscape side gutter (or the portrait
  deck) and moves the ship smoothly without teleporting; it never covers the
  playfield.
- Touch: joystick up/down/left/right navigates menus with auto-repeat; FIRE
  confirms, BOMB cancels/backs out; menu tap zones still respond.
- Touch: FIRE shoots while held; BOMB fires the flash bomb when ready and
  deathbombs during the hit window; SPELL spends a stock.
- Touch: focus toggle slows movement and enables homing; FOCUS survives
  pause/resume but resets on a new run.
- Touch: pause remains reachable during dialog; dialog advances on tap or
  FIRE. The pad hides on help, controller, game-over, result, and demo screens.
- Touch: portrait shows the rotate overlay; FULLSCREEN requests landscape
  where supported, and PLAY IN PORTRAIT uses the bottom deck.
- Touch: the pad `FULL` button toggles fullscreen (label becomes EXIT) from
  any pad screen when the browser supports it.
- Touch: 4:3 tablets without side gutters fall back to the bottom overlay;
  resizing or rotating reflows the pad and canvas, and safe-area insets keep
  controls clear of notches and home indicators.
- Auto-fire is optional in touch Settings (off by default).
- Controller: connect a pad, press any button, and confirm the desktop title
  prompt changes to `Z / PAD A TO DEPLOY` (touch START becomes
  `START / PAD A`); Start opens Settings, Y also opens Settings, and View
  opens Help.
- Controller: Settings → Controller shows the pad name, standard/non-standard
  mapping, button/axis counts, and live binding labels; enable/disable and
  reset persist across reload.
- Controller: rebind shot/flash/spell/focus/pause/cancel one at a time; after a
  bind, the new button must be released before it acts, and Cancel can be
  reached with a touch tap or Esc on the remap screen.
- Controller: D-pad/stick navigates menus; A confirms, B backs out, Start
  pauses in play, and all buttons release on hot-unplug or blur.
- Controller: repeat the movement/menu/remap checks on a phone or tablet with
  a Bluetooth pad to validate browser/OS recognition; unsupported pads can be
  made usable through remapping if the browser exposes them.

---

<a name="optimization"></a>
## 9. Optimization Notes

### Applied optimizations

| Technique | Impact | Location |
|-----------|--------|----------|
| Bullet object pooling | Reduces GC pressure during 500+ bullet scenes | `epool[]` + `killE()` |
| Squared-distance collision | Eliminates sqrt in hot loops | All collision checks |
| Merged graze/hit pass | Single iteration instead of two | `playerGrazeCheck()` |
| Cached BG gradient | Avoids `createLinearGradient` allocation per frame | `drawBG()` |
| Pre-baked boss aura | Offscreen canvas instead of per-frame radial gradient | `drawBoss()` |
| Batched canvas state | Ball bullets avoid save/restore for unrotated draws | `drawBullet()` |
| Off-screen draw culling | Skips entities outside viewport before render | `drawEntities()` |
| Text width caching | Spell name measured once per unique string | `nameWCache` Map |
| Sprite tint caching | Recolored sprites created once per (sprite,color) pair | `tintCache` Map |
| Generated textures | Chip textures (glow/ring/disc/seigaiha) built once at startup | `makeGenTextures()` |

### Not optimized (and why)

| Area | Reason |
|------|--------|
| Spatial partitioning for collisions | At ≤1600 bullets vs 1 player, O(n) scan is faster than grid setup cost |
| WebGL rendering | Canvas 2D handles current load at 60fps; WebGL would rewrite all draw code |
| Worker thread for physics | Bullet count doesn't justify message-passing overhead |
| WASM hot loops | JS JIT handles arithmetic loops well; interop cost exceeds gains |

---

<a name="extending"></a>
## 10. How to Add Content

### Add a new boss

1. Write pattern generator(s) in any `p*.js` file:
```js
function*myBossN1(b){
  let k=0;
  while(true){
    if(k%30===0)b.fan(b.x(),b.y(),DN(5),DV(4),40,null,'kunai:blue');
    k++;yield;
  }
}
function*myBossS(b){
  yield*b.mv(W/2,100,45);
  let t=0;
  while(true){
    if(t%20===0)b.ring(b.x(),b.y(),DN(12),DV(3),t*9,'ball:pink');
    t++;yield;
  }
}
```

2. Register the boss:
```js
registerBoss('myboss','My Boss',['#4a2a6a','#c080e8'],99,150,[
  {l:250,t:60,p:myBossN1},
  {n:'My Spell “Theme Name”',col:'#c080e8',l:60,t:60,p:myBossS}
]);
```

3. Add to a route in `ROUTES`:
```js
{ id:'MY', title:'My Stage', bosses:['myboss'], seed:999, tint:[40,20,60] }
```

### Add a new pattern technique

Create a helper function that takes the boss context and yields frames.
Use `b.S()` for full bullet control or `b.ring/fan/arc` for formations.
Access `b.aim()` for aimed shots, `b.x()/b.y()` for boss position.

### Add a new sound effect

Place a `.wav` file in `assets/sfx/`, add a mapping entry to `SFX_FILES`:
```js
const SFX_FILES={ ..., myname:'myfile' };
```
Then trigger with `sfx('myname')`. If the sample isn't loaded, the synth
fallback plays instead.

### Add a new sprite

Place a PNG in the appropriate `gfx/` subfolder, add a loader entry in
`loadAssets()`, and reference via `ASSETS.key_name` in drawing code.
All sprite usage has vector fallbacks for headless testing.

---

<a name="limitations"></a>
## 11. Known Limitations

- **Single-threaded rendering**: All updates and drawing still run on the main
  thread. Adaptive quality now drops bloom, bullet halos, background nebula,
  and spell wallpaper when FPS falls below 53 or the effect count exceeds 800,
  with a second tier below 42 FPS or above 1100 effects. Extremely dense
  custom patterns can still spike before the one-second sampler reacts.
- **Replay scope**: Replays store deterministic input masks, `SimRng` output,
  and the four dialogue lines. They capture the last single-credit attempt,
  not a full multi-credit session. The playback HUD is frame progress only:
  there is no seek/rewind, timeline scrubbing, live ghost overlay, or state
  serialization. Local 2P and room-code online co-op are supported. Online v1
  is Standard/1CC only: no Story, spectators, matchmaking, mid-run reconnect,
  online score writes, or host migration, and it needs the relay to be running.
- **Fixed 4:3 playfield**: The simulation remains 640×480 and is scaled
  uniformly. Widescreen cabinets add side telemetry in the gutters rather than
  expanding the playfield, so native 16:9 gameplay is intentionally unsupported.
- **Procedural music**: Themes are generated, not authored recordings. Each
  track now has a 36-bar intro/verse/chorus/bridge/climax/outro form, seeded
  loop variation, and spell-card phases, but there are no audio files, live
  performers, or fully composed transitions.
- **Story scaling**: Story and Story 1CC run at Original scaling. Story uses
  three credits; Story 1CC uses one credit and no continues. Other difficulties
  apply to the standard and 1CC routes.
- **Browser compatibility**: Modern browsers are the target. Missing Web Audio
  or `PeriodicWave` support degrades to silent procedural audio rather than
  blocking play. Fullscreen and orientation lock remain API-dependent, and
  IE11 is unsupported.
- **Controller compatibility**: Depends on the browser and OS exposing the pad
  through the Gamepad API. Standard-mapped pads work directly; non-standard
  pads show raw button indexes and need remapping. Navigation scans likely
  axis pairs, but rumble and motion are not used. Hotplug is detected by
  polling.
- **Device and service validation**: Real-device touch spacing, safe areas,
  fullscreen behavior, non-standard controller hardware, and live Groq output
  still require manual testing with the target devices and API key.
