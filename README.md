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
Every file is loaded via `<script>` tags in `index.html` in a specific order.

```
index.html
  ├── engine.js      Core systems (loaded first, defines globals)
  ├── audio.js       SFX synthesis + music volume buses
  ├── music.js       Per-stage/boss procedural score generator
  ├── player.js      Player ship, shots, bombs, graze
  ├── boss.js        Boss state machine + shared context API
  ├── story.js       Story-mode trash mobs + wave control
  ├── render.js      All canvas drawing (bullets, mobs, FX, HUD helpers)
  ├── patterns.js    Stage 1–3 boss patterns + shared helpers
  ├── p4.js          Stage 4 bosses
  ├── p5.js          Stage 5 bosses
  ├── p6.js          Stage 6 bosses
  ├── pex.js         Extra stage bosses
  ├── pexa.js        Extra+a bosses + route definitions
  ├── main.js        Game state machine, menus, HUD, route flow
  └── boot.js        Canvas scaling + touch input
```

**Load order matters.** Each file builds on globals defined by previous files.
The dependency chain is:

```
engine.js  →  audio  →  music  →  player/boss/story/render  →  patterns  →  p4/p5/p6/pex/pexa  →  main.js  →  boot.js
(core)       (sfx)     (score)     (systems + content helpers)      (S1–3)      (more bosses)            (state machine)  (env)
```

All cross-file communication uses global scope. Functions declared in one file
are callable from any later file. Shared mutable state (`G`, `PL`, `BOSS`,
`eshots`, `mobs`) is defined in `engine.js` and accessed everywhere.

---

<a name="files"></a>
## 2. File Structure

### engine.js

The foundation layer. Contains everything that must exist before any content:

| Section | What it does |
|---------|-------------|
| Config & constants | Screen dimensions, color palette, key bindings, hitbox radii |
| Input system | Edge-triggered (`hitK`) and held (`down`) key polling, per-tick edge clearing |
| Object pooling | `killE`/`spawnE` recycle bullet objects to reduce GC pressure |
| Entity arrays | `eshots[]`, `pshots[]`, `items[]`, `fx[]`, `ftext[]`, `elasers[]`, `mobs[]` |
| Field reset | `resetFieldSafe()` wipes shots, items, lasers and mobs on continue / quit-to-title |
| Player shots | `pUpdate()` tests the boss first, then every mob; dead homing targets retarget |
| Audio system (`audio.js`) | Web Audio context management, SFX synthesis, sample-buffer playback, volume buses |
| Music engine (`music.js`) | Stage palettes + per-boss themes, 16-bar arrangements, spell-card phases |
| Player (`player.js`) | Movement, shooting, options, graze, flash bomb, spell, trance, deathbomb |
| Boss framework (`boss.js`) | State machine (enter→dialog→fight→rest), attack lifecycle, damage rates |
| Item system | Spawning, magnet collection, floor expiry (P/B/L/S/K/O — O feeds the OD meter) |
| Laser system | Telegraphed straight-line hazards with warm-up/active/fade states |
| Effects (`render.js`) | Ring, spark, shard, trail, puff, crescent, bloom, beam, seigaiha overlay |

### patterns.js + p4–pexa.js

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

### story.js

Story-mode trash mobs plus the wave controller. Active only when `G.story`
is true (selected from the difficulty menu).

| Piece | What it does |
|-------|-------------|
| Mob types | `drone` (aimed 3-way), `weaver` (wide fan), `tank` (ring + aimed kunai). Eased movement toward drifting anchors, banking tilt, HP bars. |
| Telegraphs | Every volley flashes a ring ~25 frames early; no fire during entry or off-stage; tank rings leave a gap facing the player. |
| Wave control | 14-mob queue (`startStoryWave` / `updateStoryWave`), max 6 alive, wave-clear bonus + boss handoff. |
| Drops | RNG loot per kill — P (power), B (points), O (overload: +12 OD, +2 flash). Tanks drop 3. |
| Power guarantee | A pity counter forces P drops when the remaining mobs can't cover the missing power, plus a top-up at wave clear, so the player always gains +1.0 (100) power before each boss. |

Mobs plug into the existing combat: player shots, beam, homing options, spell
ray, deathbomb and flash bomb all damage them (`damageMob` / `killMob`), and
body contact kills the player like a boss collision.

### main.js

Game state machine, screen renderer, HUD, menus, results screen, music-reactive
visuals, and the requestAnimationFrame loop.

The difficulty menu offers five modes: Easy, Original, Absurdly All-Star,
1CC (Original scaling, full route, 1 credit, no continues) and Story
(Original scaling + mob waves). Modes are exclusive — Story and 1CC cannot be
combined. Selecting 1CC skips stage select and starts the full route
immediately. Story still uses stage select.

Credit system: normal runs start with 3 coins; 1CC starts with 1. No coin is
spent automatically on death. The game-over screen offers Continue at the
current boss or Retry the stage, each costing one coin (`spendCredit()`).
Pause → Restart Stage also costs one coin and immediately ends 1CC eligibility.
A 1CC death goes straight to results as a failure; 1CC CLEAR requires the full
route with zero credits spent. The HUD always shows `CREDIT ×N` (hidden only in
demo playback); the results screen totals credits used.

Story flow: `G.needWave` / `G.wave` interleave one mob wave before every boss —
`beginBossFight()` fires only after the wave reports clear (see `story.js`).
The transition clears leftover bullets and grants brief invulnerability.

State machine:
```
title → diff → sel → play ⇄ pause
                       play → gameover → play (continue/retry) or title
                       play → result → title
                     play → result (1CC failure) → title
```

Persistence: `lasr_hi`, `lasr_diff`, `lasr_mvol`, `lasr_svol`, `lasr_mute`, and
`lasr_settings` (JSON: music/SFX volume, mute, shake, bloom, flash, auto-fire,
FPS, AI dialogue). Settings are available from the title (S) and pause menu.

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

- **Movement**: a fixed virtual joystick sits in the lower-left corner.
  Deflection is analog with a 22% deadzone; the ship moves in the stick
  direction at a speed proportional to how far it is pushed. Keyboard arrows
  continue to work.
- **Fire**: the large `FIRE` button in the lower-right holds the shoot key
  (`Z`) for as long as it is pressed, so tapping/holding fires normally. It
  also confirms menu options and advances dialog. Auto-fire is an optional
  Settings toggle (off by default on touch).
- **Bomb / cancel**: in play, `BOMB` sends `X` (flash bomb when the gauge is
  full, deathbomb during the 16-frame window); in menus it acts as
  Back/Cancel.
- **Focus / spell / pause**: the `FOCUS` toggle replaces Shift (0.58× speed
  and homing); `SPELL` spends a spell stock (also usable as a deathbomb);
  `II` pauses.
- **Menus**: the joystick navigates every cursor menu (difficulty, stage
  select, pause, settings) with initial-press and auto-repeat edges;
  `FIRE` confirms, `BOMB` backs out. Touch-specific layouts, tap zones, and
  dialog tap-to-advance remain available. Stage select uses a 2×4 grid with
  SELECT ALL.
- **Hit testing**: draw functions register rectangular zones with
  `TouchUI.add()` each frame; `boot.js` resolves touches against the last
  drawn frame in reverse draw order. The joystick and action buttons are
  resolved first so they always win over menu/dialog zones. Zones reset at
  the start of every `drawScreen()`.
- **Orientation**: portrait phones show a rotate overlay with a
  `PLAY IN PORTRAIT` skip. The 640×480 canvas is letterboxed and scaled to fit
  either orientation.

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

### 4.3 Difficulty System

```js
DIFF_EASY = 0   // DN×0.65, DV×0.85, boss HP×0.75
DIFF_ORIG = 1   // baseline
DIFF_ABEX = 2   // DN×2.2, DV×1.28, boss HP×1.15
MODE_1CC  = 3   // Original scaling, full route, 1 credit, no continues; restart forfeits clear
MODE_STORY = 4  // Original scaling + pre-boss mob waves, 3 credits (see story.js)
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

Boss seeds select a root offset, mode, 8-bar progression, lead waveform,
16-step rhythm masks and melodic contours within that palette. The result is a
shared stage identity with 44 distinct boss themes (verified unique in tests).
Stage music plays during waves and route travel; the boss theme starts on
boss entry and intensifies per spell card.

### Track Structure

- **16-bar loop** (`bar = floor(step/16) % 16`) with 4-bar sections.
- **Lead phrases**: 8 bars of motif A, then 8 bars of motif B, built from
  in-key scale degrees against each chord (chord tones and passing tones).
- **Arrangement gating**: intro groove first, lead in the second section,
  counter-melody and 16th hats at high phase, tom/snare fills every 4 bars,
  stage breakdown at bar 7.
- **Spell phases**: `startBossBgm(def, phase)` advances arrangement energy.
  Phase 1 (first spell) opens the lead; phase 2 (later/final spells) adds
  counter-lines and sparkle. The theme itself never swaps mid-boss.

### Architecture

```
Music.buildBoss(def, phase)   → deterministic per-boss config + 16-bar score
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

### Draw Call Budget

At peak density (~500 bullets):
- ~500 `arc` fills + strokes for ball bullets
- ~100 `fillRect` calls for effects
- ~10 text draws for HUD
- 1 `drawImage` for background gradient cache
- 4 `drawImage` for nebula tiles

Canvas state changes (fillStyle, strokeStyle, globalAlpha) are minimized
by batching same-style operations and avoiding gradient creation inside
per-entity loops.

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

---

<a name="testing"></a>
## 8. Testing

The historical `_smoke.js` harness is not included in this checkout (the file
is ignored by `.gitignore`). Validate changes with syntax checks:

```
node --check engine.js
node --check audio.js
node --check music.js
node --check player.js
node --check boss.js
node --check story.js
node --check render.js
node --check patterns.js
node --check p4.js
node --check p5.js
node --check p6.js
node --check pex.js
node --check pexa.js
node --check main.js
```

Manual regression checklist:
- Title → difficulty → stage select → play.
- 1CC selection starts the full route immediately with 1 credit.
- Normal death opens game over without spending a credit; C, Z, or R spend one.
- Pause → Restart Stage confirms, spends one credit, and ends 1CC eligibility.
- 1CC death reaches results marked 1CC FAILED.
- Story wave clears into the boss with no leftover bullets.
- Title BGM restarts after results or quitting from pause.
- Each boss starts its own theme; spell cards intensify the same theme rather
  than swapping tracks; stage music returns on story waves and route changes.
- Settings/help open from the title (S/H) and pause, and persist after reload.
- Flash bomb fires only when the gauge is full; C always casts a spell.
- Touch: title, difficulty, stage grid, settings, help, pause, game over, and
  result controls all respond; the joystick moves the ship smoothly and does
  not teleport it.
- Touch: joystick up/down/left/right navigates menus with auto-repeat; FIRE
  confirms, BOMB cancels/backs out.
- Touch: FIRE shoots while held; BOMB fires the flash bomb when ready and
  deathbombs during the hit window; SPELL spends a stock.
- Touch: focus toggle slows movement and enables homing; FOCUS survives
  pause/resume but resets on a new run.
- Touch: pause remains reachable during dialog; dialog advances on tap or
  FIRE.
- Portrait orientation shows the rotate overlay and the skip button; landscape
  scales the canvas to fit.
- Auto-fire is optional in touch Settings (off by default).

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

- **Single-threaded**: All updates and rendering run on the main thread.
  At extreme bullet counts (>1200), frame time may spike during dense spells.
- **No replay system**: The game state is not serialized, so replays would
  require recording all inputs deterministically.
- **Fixed resolution**: 640×480 internal, scaled by CSS. No widescreen support.
  On phones, landscape uses most of the screen; portrait is letterboxed and
  prompts rotation, though the game remains playable if skipped.
- **Procedural music limitations**: Themes follow 16-bar loops with
  intro/lead/climax sections and spell-card phases, but there is no authored
  intro/outro or live performance variation — the loop is the song.
- **Modes are exclusive**: Story and 1CC cannot be combined — Story always
  runs at Original scaling with 3 credits.
- **Fixed story waves**: every pre-boss wave uses the same 14-mob composition
  (6 drones, 5 weavers, 3 tanks); only the spawn order and positions are random.
- **No netplay**: The game is single-player only.
- **Browser compatibility**: Requires Web Audio API and PeriodicWave support
  (all modern browsers, but not IE11).
