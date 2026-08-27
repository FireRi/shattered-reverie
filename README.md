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
  ├── patterns.js    Stage 1–3 boss patterns + shared helpers
  ├── p4.js          Stage 4 bosses
  ├── p5.js          Stage 5 bosses
  ├── p6.js          Stage 6 bosses
  ├── pex.js         Extra stage bosses
  ├── pexa.js        Extra+a bosses + route definitions
  └── main.js        Game state machine, rendering, HUD, menus
```

**Load order matters.** Each file builds on globals defined by previous files.
The dependency chain is:

```
engine.js  →  patterns.js  →  p4/p5/p6/pex/pexa  →  main.js
(core)       (S1–3 data)      (more data)           (state machine)
```

All cross-file communication uses global scope. Functions declared in one file
are callable from any later file. Shared mutable state (`G`, `PL`, `BOSS`,
`eshots`) is defined in `engine.js` and accessed everywhere.

---

<a name="files"></a>
## 2. File Structure

### engine.js (~1300 lines)

The foundation layer. Contains everything that must exist before any content:

| Section | What it does |
|---------|-------------|
| Config & constants | Screen dimensions, color palette, key bindings, hitbox radii |
| Input system | Edge-triggered (`hitK`) and held (`down`) key polling, per-tick edge clearing |
| Object pooling | `killE`/`spawnE` recycle bullet objects to reduce GC pressure |
| Entity arrays | `eshots[]`, `pshots[]`, `items[]`, `fx[]`, `ftext[]`, `elasers[]` |
| Audio system | Web Audio context management, SFX synthesis, sample-buffer playback |
| Music engine | Seeded procedural chiptune sequencer with arrangement gating |
| Player | Movement, shooting, options, graze, flash bomb, spell, trance, deathbomb |
| Boss framework | State machine (enter→dialog→fight→rest), attack lifecycle, damage rates |
| Item system | Spawning, magnet collection, floor expiry |
| Laser system | Telegraphed straight-line hazards with warm-up/active/fade states |
| Effects | Ring, spark, shard, trail, puff, crescent, bloom, beam, seigaiha overlay |

### patterns.js + p4–pexa.js (~1900 lines total)

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

### main.js (~720 lines)

Game state machine, screen renderer, HUD, menus, results screen, music-reactive
visuals, and the requestAnimationFrame loop.

State machine:
```
title → diff → sel → play ⇄ pause
                       play → gameover → play (retry) or title
                       play → result → title
```

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
| Shot types | Power < 3: twin rapid bolts. Power ≥ 3: continuous beam (requires vertical alignment within cone). Both always fire option pellets alongside. |
| Options | 3 orbs (power < 2) or 5 orbs (power ≥ 2), orbiting when focused. Fire pellets every 4 frames. |
| Homing | When focused (Shift), the center 2 option pellets become homing seekers (7°/frame turn rate, 50% damage). |
| Graze | Bullets passing within 14px of hitbox grant +500 score, +1 flash gauge, OD meter progress. |
| Flash Bomb | X when gauge full: clears all bullets, brief invulnerability, no bonus penalty. |
| Spell | C key: screen-wide attack + sustained clearing ray. Costs one stock. |
| Deathbomb | Press X/C within 16 frames of being hit: consumes a spell, cancels death. |
| Trance | OD meter fills from grazing while flash gauge is full. Auto-triggers: +50% damage, bullets slow near player, aura visuals. |
| Streak | Consecutive spell captures multiply capture bonus up to ×4. Reset on timeout or death. |

### 3.5 Collision Model

All collision is circle-vs-circle using squared distances (no sqrt):

```
Player hitbox: 2.6px radius (tiny, Touhou-style)
Graze radius: 14px ring around hitbox
Enemy bullet hit: dist² < (PLAYER_HIT_R + b.r × 0.55)²
Boss shot collision: dist² < (BOSS_HIT_R + 3)²
Laser: point-to-segment distance < laser_width / 2 + PLAYER_HIT_R
```

The player's visible sprite is ~22px wide, but the hitbox is 2.6px —
standard danmaku convention where the sprite is decorative and the hitbox
is the true target.

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
DIFF_ABEX  = 2  // DN×2.2, DV×1.28, boss HP×1.15
```

---

<a name="music"></a>
## 5. Music Engine

The music is fully procedural chiptune generated at runtime by a seeded
composition system. No audio files are used for BGM.

### Architecture

```
Music.build(seed)     → generates deterministic config (key, tempo, progression,
                        drum pattern, motif rhythm, waveforms)
Music.tick()          → lookahead scheduler (25ms interval, 240ms buffer)
Music.scheduleStep()  → synthesizes one 16th note using WebAudio nodes
```

### Composition System

Each track is built from:

- **Harmonic progression**: minor-key chord sequences (i–VI–III–VII etc.)
  with raised leading tone (harmonic minor dominant)
- **Motif rhythm**: a seeded 16-step boolean mask repeated identically across
  chords — repetition creates melodic hooks
- **Voice leading**: lead notes chosen from current chord tones nearest to the
  previous note, constrained to the harmonic minor scale
- **Arrangement gating**: bars 0–1 are drums+bass only; arp joins at bar 2;
  lead enters at bar 4; bar 7 breaks down (drums drop, snare roll fill)

### Synthesis Voices

| Voice | Technique | Used for |
|-------|-----------|----------|
| Lead | Dual detuned pulse waves (25% duty via Fourier periodic wave), vibrato LFO, feedback-delay echo send | Melody |
| Bass | Sawtooth through lowpass filter (static 320Hz cutoff), short envelope | Root notes |
| Arp | Square wave pluck, fast decay | Chord arpeggios |
| Pad | Soft square chord stabs at phrase boundaries | Harmonic glue |
| Kick | Pitch-swept sine (155Hz → 44Hz) | Pulse |
| Snare | Bandpassed noise burst + body tone | Backbeat |
| Hat | Highpassed noise micro-bursts | Offbeat texture |
| Crash | Long highpass noise swell | Phrase boundary accent |

All voices connect through a shared gain node → compressor → master output.
A separate echo bus (delay + feedback + highpass) adds spatial depth to the
lead voice.

### Intensity Layering

When a boss activates a spell card (`BOSS.spellActive`), intensity rises to
level 2, unlocking: lead melody on all bars, denser arpeggios, pad octave
doubling, and extra percussion. When the spell ends, layers drop back.

---

<a name="rendering"></a>
## 6. Rendering Pipeline

Single canvas, redrawn from scratch every frame:

```
drawScreen()
  ├── drawBG()           Gradient + parallax stars + nebula blits +
  │                      aurora ribbons + vignette + route scenic backdrop
  ├── drawEntities()     Lasers → enemy bullets → player bullets → items →
  │                      player → FX particles → floating text
  ├── drawBoss()         Aura rings + monogram + hurt flash + charge effect
  ├── drawHUD()          Score, boss bar, timer, lives, spells, power,
  │                      flash gauge, OD meter, streak, spell history
  ├── drawCutin()        Speedlines + gradient band + letter cascade +
  │                      portrait panel (during spell declarations)
  └── Overlays           Warning banner, dialog box, screen flash, dim fade
```

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
| Tinted sprites | Source sprite + `source-in` fill = recolored copy, cached by `(sprite, color)` key |

---

<a name="testing"></a>
## 8. Testing

`_smoke.js` is a headless test harness that stubs DOM/Canvas/Audio and drives
the game through simulated input across ~60k frames. It verifies:

**Structural assertions:**
- All 45 boss lifecycle chains complete (enter → attacks → death → onDone)
- No NaN values leak into entity arrays
- Density ceilings respected (bullets ≤1600, fx ≤300)
- Pool recycling active (>50% reuse)

**Behavioral assertions:**
- Menu navigation flow works (title→diff→sel→play)
- Patterns keep firing throughout entire attack duration
- Passive play deals zero damage (no accidental hits)
- Pause opens/persists/resumes correctly
- Beam requires alignment; rapid shots require line-of-sight
- Focused homing trackers connect from offset positions
- Deathbomb saves life within window
- Flash bomb clears bullets and consumes gauge
- Trance activates from sustained graze and expires
- Streak increments on captures, resets on timeout
- Route chaining produces results screen naturally
- Music schedules dense note graph with zero out-of-key melody notes

Run with:
```
node _smoke.js
```

Exit code 0 = all green. Any assertion failure prints details and exits 1.

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
- **Procedural music limitations**: The seeded composer cannot produce
  structured songs (verse/chorus) — it generates evolving loops within
  harmonic constraints.
- **No netplay**: The game is single-player only.
- **Browser compatibility**: Requires Web Audio API and PeriodicWave support
  (all modern browsers, but not IE11).
