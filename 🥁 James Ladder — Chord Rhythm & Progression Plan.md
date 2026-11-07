---
title: James' Ladder — Chord Rhythm & Progression Plan
subtitle: Live-session audit of progression discovery + design for a chord-level rhythm engine
date: 2026-08-20
status: active — decisions made, Phase 0 in progress
type: development-plan
tags: [james-ladder, rhythm, progression, mobile, ui, audit]
---

# James' Ladder — Chord Rhythm & Progression Plan

## Method

Served `index.html` at 375×812 (mobile viewport), ignited a tonal centre, built
progressions through the real chord pills, then instrumented every generator and
ran each 400× to measure its actual output space. Theory suite (`music-theory-tests.js`)
run separately: **103 passed, 0 failed, 2 theoretical warnings.**

The theory layer is sound. Everything below is UX and architecture.

> Note: the previous `📋 Android Development Plan.md` describes a 2819-line build.
> The file is now 7036 lines. Panels are already full-screen panes with a 6-button
> bottom nav — Phases 1 and 3 of that plan effectively landed. Phases 4 (touch
> targets) and 5 (sequencer grid) did **not**.

---

## Part 1 — Playing it as a user

Double-tap the solid → `Ignition: C Major`, ledger seeded with `I·C`. Clean.
Tapped `vi → IV → V → I` through the pills. Ledger reads `I vi IV V I`, harmony 76%,
one Authentic cadence detected. The core loop works and feels good.

Then the friction starts.

| What I hit | Measured |
|---|---|
| `⟳ Loop` produced **silence** | `_rhythmGain.gain.value === 0` at startup |
| `▶ Play` ignored my BPM | hard-coded `i*0.72` s per chord |
| `▶ Best` **shortened and de-cadenced** my progression | `I vi IV V I` → `V I IV vi` |
| Ledger chips too small to hit, and tapping one **deletes it** | 23×14 px, `onclick → removeLedgerEntry` |
| Sequencer cells unhittable | **17.25 × 22 px** |
| Canvas shrank as I composed | 371 px at 5 chords → **299 px at 12 chords** |

### The silent-loop bug (highest severity)

`gainR` defaults to `0.00`. Every rhythm-path voice — `playChordStaccato` (grid chord
hits) and `clickPercussive` — routes through `_rhythmGain`. So:

- Loom → load pattern → `▶ Play` = animated grid, **no sound**
- Main page `⟳ Loop` = **no sound**, while the adjacent `▶ Play` is audible (harmonic bus, 0.70)
- The **"First Session" onboarding preset** calls `toggleSoftMode()`, which *sets γR to 0*,
  then loads the Fibonacci pattern — the recommended first experience guarantees a silent sequencer

The γR slider that fixes this lives inside the Loom panel, two screens from the Loop button.

### `▶ Best` degrades the progression

`computeGenreOptimalOrder()` dedupes by roman numeral, then greedily reorders by
outgoing Markov probability. It has no cadential constraint on start or end, so it
picked `V` to open (V→I is 0.70, highest outgoing sum) and left `vi` hanging at the end.
It also silently discards repeats, so it can only ever return as many chords as you
used *distinct* chords. It is a chord-set reorderer labelled as a path finder.

It does not mutate the ledger — playback only — so nothing is lost permanently. What
degrades is the rendition it plays back.

---

## Part 2 — What the generators actually produce

400 runs each, deduplicated:

| Generator | Unique outputs | Shape |
|---|---|---|
| Kha-Ru / Gevurah, length 4 | **5. Total. Ever.** | `I ‹x› V I` |
| Kha-Ru / Gevurah, length 6 | 54 | `I ‹a› ‹b› ‹c› V I`, a≠b≠c |
| Markov (Diatonic, μ=0) | 166 | always `I … V I` |
| Markov (μ=0.5) | 251 | always `I … V I` |

`findGevurahPhrase` is an enumeration of permutations: it picks 3 distinct interior
chords from a 5-chord pool (5P3 = 60, minus 6 blocked by `gevTransCost`) and bookends
them with `I … V I`. **No chord may repeat.** So `I–V–vi–IV` — the most-used progression
in popular music — is unreachable, and so is anything that doesn't cadence.

Markov output includes `I V I V I V I` and `I V I IV V V I` — self-transitions and
V-I stutters are unweighted. Also: `markovPhrase(6)` returns **7** chords
(`1 + (len−2) + 2`). Off-by-one.

All engines draw from a 5-chord pool (`I ii IV V vi`). `iii`, `vii°`, secondary
dominants and borrowed chords exist on the main page but **no generator can reach them.**

---

## Part 3 — Verdict: how easy is a *unique* progression?

**Easy to make a correct one. Hard to make a distinctive one.**

The main page offers 15 chords: 7 diatonic + 4 secondary dominants (behind a 21 px
`▼ V/` toggle) + 4 borrowed (behind `▼ ♭`, Level II+ only). Every one of them is a
**root-position triad plus a doubled root an octave down**:

```js
const iv = qual==='maj' ? [0,4,7] : qual==='min' ? [0,3,7] : qual==='dim' ? [0,3,6] : [0,3,7];
```

Consequences:

1. **No 7ths, 9ths, sus, add, or slash chords on the main page.** Fibonacci extensions
   exist but only fire from the Kha-Ru pane and never enter the ledger.
2. **No inversions or voicings.** The Dijkstra voice-leading engine computes optimal
   voicings beautifully — then `commitVLToLedger()` writes back only
   `{roman, note, qual, key, fi}`. **The voicings are discarded.**
3. **`chordPCs(0,'maj7')` returns `[0,3,7]` — a C minor triad.** Any unknown quality
   silently becomes minor. Adding 7ths anywhere means touching this function first.
4. **Two progressions differing only in voicing or rhythm sound identical.** That is
   the whole problem: the app has no axis of variation below the roman numeral.
5. **No save / name / recall.** You cannot keep two ideas and compare them. Export to
   clipboard/JSON exists, in the Grimoire.
6. **Editing is destructive-only.** Tap a 14 px chip to delete. `undoLast()` only pops
   the tail; a mis-tap mid-sequence is unrecoverable.

### The root cause

```js
ledger entry = { type, roman, note, qual, key, fi }
```

Six fields. No duration, no voicing, no octave, no extension, no accent. Every
downstream feature — loop, playback, export, rhythm — inherits that ceiling.
**Fix the schema and most of the rest becomes possible.**

---

## Part 4 — Rhythm generator audit

What exists: a 5×16 boolean grid, 19 named patterns, 4 procedural generators
(Euclidean / Random / Sparse / Dense), Fibonacci and φ-phyllotactic loaders,
per-row polyrhythm cycle lengths {3,4,5,6,7,8,12,16} with phase offsets, and
genre "transmute". That's a genuinely rich rhythm *texture* engine. Verified:
all seven genre transmutes hit their requested onset densities exactly, no
modular collision loss. The Euclidean implementation is correct (Bjorklund).

But it is not a rhythm generator **for chord sequences**, for six reasons:

### 1. The rows are the wrong axis *(structural)*

```js
const ROW_DEF = [{roman:'IV'}, {roman:'I'}, {roman:'V'}, {roman:'ii'}, {roman:'vi'}];
```

Rows are **fixed diatonic degrees, not your progression.** Build `I–vi–iii–IV` and the
grid has no `iii` row and a `ii` row for a chord you never played. `vii°`, secondary
dominants and borrowed chords are unrepresentable. The rhythm engine and the harmony
engine do not share a data model.

### 2. Chords have no duration

Chord advance is `seqStep % ledgerSpread === 0` — one global number (default 4).
**Every chord is the same length. Every progression is isochronous.** You cannot write:

```
| I . . . | vi . | IV . | V . . . |
```

### 3. The clock is `setInterval` with immediate audio starts

```js
seqTimer = setInterval(tickSeq, (60/seqBpm/4)*1000);
...
const a = getAC(), t = a.currentTime + delay;   // every voice
```

No lookahead, no audio-clock scheduling. Main-thread jitter — competing with a
Three.js `requestAnimationFrame` loop — lands directly on note onsets. Measured under
background throttling: ticks arrived at **~1000 ms against a 107 ms target** (BPM 140),
3.5 s of drift in 4 s. Foreground jitter is smaller but structurally present, and
**swing is impossible** without absolute scheduled times.

### 4. Cells are booleans

`typeof seqPat[0][0] === 'boolean'`. No velocity, no accent, no note length, no tie,
no ghost note. No `swing` variable exists anywhere in the file.

### 5. Named time signatures don't change the meter

`Waltz 3/4` writes onsets at steps 0, 4, 8 and leaves 4 steps of rest — then leaves
`rowLen` at 16. It loops as **4/4 with a silent fourth beat**, not 3/4. Same for
`5/4 Dave` and `7/8 Balkan`. Only Fibonacci, φ and transmute set `rowLen`;
`loadPat()` never touches it.

### 6. 17 × 22 px cells

Phase 5 of the Android plan never landed. `grid-template-columns: 28px repeat(16, 1fr)`
inside a 375 px pane gives 17.25 px columns. A fingertip is ~40 px. Also in the Loom:
range slider tracks are **2 px** tall, and every `.lbtn` is 22 px.

### Plus two smaller ones

- **The metronome bypasses the buses.** `clickBeat()` does `e.connect(a.destination)`,
  so γR does not control it and it sounds even at γR = 0. The README claims otherwise.
- **`playLedger()` ignores BPM** — `playChord(..., i*0.72)`, a fixed ~83 BPM.

---

## Part 5 — Proposal: the Chord Rhythm Track

One new primitive, on the main page, mobile-first. **Rhythm is where progressions
become unique**, and it is the axis the app currently has no way to author.

### 5.1 — Schema first (the keystone)

```js
// ledger entry, extended — all new fields optional, absent ⇒ current behaviour
{
  type, roman, note, qual, key, fi,   // unchanged
  beats:   4,        // duration in beats  (default: chordBeats)
  figure: 'hold',    // hold | strum | arp-up | arp-dn | pulse | charleston
  accent:  1.0,      // 0.4 … 1.4
  voicing: null,     // [midi,…] — filled by Dijkstra; null ⇒ root triad
  ext:     0,        // per-chord Fibonacci extension level
}
```

Every reader falls back to the current global when a field is absent, so this ships
without breaking a single existing feature. Make `commitVLToLedger()` write `voicing`
and the Dijkstra engine stops throwing its own answer away.

### 5.2 — The strip (one 44 px row under the ledger)

Chip width **proportional to duration**. Tap = audition. Selected chip reveals one
44 px control row; nothing else is added to the layout.

```
Rhythm   4/4  ♩=100  swing 0%                        [⟳ Generate]
┌───────────────┬───────┬───────┬───────────────────┐
│ I             │ vi    │ IV    │ V                 │
└───────────────┴───────┴───────┴───────────────────┘
  ▲ selected: I
  ⟨ − ⟩ 4 beats ⟨ + ⟩   ✋ hold  ⌇ strum  ↗ arp  ● pulse
```

Tap = audition, not delete. Deletion moves to a `✕` on the selected chip — this also
fixes the 14 px destructive-tap trap.

### 5.3 — The generators (one tap each)

Seven named generators, each grounded in machinery the app already has:

| Generator | Rule | Reuses |
|---|---|---|
| **Even** | equal division | current behaviour |
| **Anacrusis** | short pickup, long final | — |
| **Cadential weight** | chords at cadence points get 2× | `computeCadenceLog()` |
| **Tension-driven** | dissonant → short, consonant → long | `chordConsScore`, `renderTensionArc` |
| **Euclidean** | N chord onsets over M beats, maximally even | `euclid()` — hoist from `genEuclidean` |
| **Fibonacci / φ** | durations from 2,3,5,8; φ-point climax | `PHI`, Walhuu timer |
| **Clave-locked** | chord changes snap to clave onsets | `PATTERNS['Son Clave']` etc. |

Clave-locked is the important one: it is the missing bridge that finally couples the
existing 19-pattern library to the chord track instead of to five phantom degrees.

Then a feel layer: **swing %**, **accent pattern**, per-chord **figure**.

### 5.4 — Fix the clock

Lookahead scheduler on the audio clock:

```js
const LOOKAHEAD = 0.12, TICK_MS = 25;
function scheduler(){
  while (nextStepTime < ac.currentTime + LOOKAHEAD){
    scheduleStep(step, nextStepTime);      // absolute time
    nextStepTime += stepDur * swungOffset(step);
    step = (step + 1) % totalSteps;
  }
}
```

Requires a mechanical refactor: `rhythmVoice` / `harmonicVoice` / `staccatoVoice`
currently take a *relative* `delay` and compute `a.currentTime + delay`. They need to
accept an **absolute** `when`. ~6 call-site groups. This is what makes swing possible
at all, and it removes jitter and drift.

### 5.5 — Un-mute the rhythm path

Recommended: route `playChordStaccato` through the **harmonic** bus and keep γR
strictly for the percussive click. That preserves Soft Mode's intent (kill harsh
transients) without silencing harmony, and makes `⟳ Loop` audible out of the box.
Add a small volume/mute control to the main page so γR is reachable from where it matters.

### 5.6 — Progression library

Eight localStorage slots as a scrollable 44 px row: name, chords + rhythm, key, BPM.
Needed for "unique progressions" — you cannot judge distinctiveness without A/B.
Also gives a real undo for destructive ledger edits.

---

## Part 6 — Mobile layout budget

Measured at 375 × 812, the current chrome:

| Region | Height |
|---|---|
| `#bar` (3 stacked rows) | **156** |
| `#bot` (grows with ledger) | 229 → **301** at 12 chords |
| `#bottom-nav` | 56 |
| **Canvas** | **371 → 299** |

On a 360×640 phone with 12 chords the canvas is **127 px**. The instrument disappears
as you use it. So the rhythm strip must pay for itself.

**It can.** `bar-r2` is 79 px of buttons that belong in the `⊹ Menu` overlay that
already exists: Level I/II/III, Guide, Fold Mode, Auto ⟳, Reset. Move them and the top
bar drops **156 → ~72 px**, funding the 88 px rhythm strip at zero net cost.

Also: make `#led-seq` a horizontally scrolling single line instead of `flex-wrap: wrap`,
so the bottom bar stops growing without bound.

---

## Part 7 — Phased plan

| Phase | Work | Effort | Why now |
|---|---|---|---|
| **0** | γR routing fix · `playLedger` honours BPM · metronome onto the bus | 30 min | Loop is silent today. Ship first. |
| **1** | Ledger schema `+beats/figure/accent/voicing/ext`, all optional | 45 min | Unblocks everything below |
| **2** | Ledger chips: tap = audition, `✕` = delete, 44 px, h-scroll | 1 hr | Stops progression loss; stops canvas shrink |
| **3** | Chord Rhythm Strip — render, select, `± beats` | 2 hr | The core feature |
| **4** | Top bar → `⊹ Menu` migration (156 → 72 px) | 45 min | Pays for Phase 3 |
| **5** | The 7 generators + `⟳ Generate` | 2 hr | The ask |
| **6** | Lookahead scheduler + swing | 2 hr | Rhythm that actually swings |
| **7** | Per-chord figures (strum / arp / pulse) | 1.5 hr | Texture without extra UI |
| **8** | Progression library (8 localStorage slots) | 1.5 hr | Uniqueness needs comparison |
| **9** | Sequencer grid: 32 px cells + h-scroll + bar dots | 45 min | Old Phase 5 debt |
| **10** | Fix `▶ Best`: cadential start/end constraint, keep repeats | 1 hr | Currently makes progressions worse |
| **11** | Generator pool: admit `iii`, `vii°`, sec-dom, borrowed; allow repeats | 1.5 hr | 5 outputs → hundreds |
| **12** | `rowLen` from time signature; real 3/4, 5/4, 7/8 | 30 min | Named meters currently lie |

**Phases 0–5 ≈ 7 hours** and deliver the feature. 6–12 ≈ 8 hours of depth.

### Deferred, needs its own decision

Extending `chordPCs` beyond maj/min/dim. It is 3 lines, but the consonance matrix,
harmonic cloud, Tonnetz, PLR engine, Gevurah scoring and the 103-test suite all
assume triads. Real 7th chords are a project, not a phase.

---

## Decisions — settled 2026-08-20

1. **Placement: main page, under the ledger.** Rhythm is part of composing, not a
   separate activity. The 88 px is funded by migrating `bar-r2` into the `⊹ Menu`
   overlay (Phase 4).
2. **γR: re-route, not re-default.** `playChordStaccato` moves to the harmonic bus;
   γR keeps control of the percussive click only. Preserves Soft Mode's design intent
   (kill harsh transients) without silencing harmony.
3. **Order: fix-first.** Phases 0 → 2 → 10, then build 1 → 3 → 5. Phase 2 is a
   prerequisite for the rhythm strip regardless.
4. **`▶ Best` keeps repeated chords** and gains a tonic-function start constraint plus
   a cadential end constraint.

### Working order

```
Phase 0  ── un-mute the rhythm path              ✓ shipped
Phase 2  ── ledger chips: audition, ✕, 44 px, h-scroll   ✓ shipped
Phase 10 ── ▶ Best: keep repeats + cadential constraints ✓ shipped
   ↓
Phase 1  ── ledger schema (+beats/figure/accent/voicing/ext)
Phase 3  ── Chord Rhythm Strip
Phase 4  ── top bar → ⊹ Menu (pays for Phase 3)
Phase 5  ── the 7 generators
   ↓
Phases 6–12 ── scheduler/swing, figures, library, grid, pool, meters
```

---

## Shipped — 2026-08-20

### Phase 0 — audio routing

| Change | Verified |
|---|---|
| `staccatoVoice` → harmonic bus (was γR) | `⟳ Loop` / grid: bus `harmonic`, level 0.70, **audible at defaults** |
| `clickBeat` → new γM bus (was `a.destination`) | metronome now attenuable, level 0.55, audible |
| γR narrowed to percussive transients only | `clickPercussive` alone rides γR |
| Rhythm mode lifts γR off zero on entry | 0 → 0.45, slider + label sync; Tonal leaves it alone |
| `playLedger()` honours BPM | gaps measured exactly `beats × 60/bpm`: 120/×2→1.000 s, 60/×2→2.000 s, 120/×4→2.000 s |
| γM slider added beside γR / γH | present in Loom transport |

Soft Mode still zeroes γR — which is now exactly right: it kills harsh transients
without taking the harmony with them.

### Unplanned but blocking — `sw.js` rewritten

The service worker was **cache-first with a constant cache name** (`james-ladder-v15`).
`activate` evicts keys `!== CACHE`, but CACHE never changed, and the fetch handler never
revalidated. Once a user loaded the app they were **frozen on that build permanently** —
no later fix could ever reach them. This is not hypothetical: it silently served a stale
build during this very session and swallowed the first round of Phase 0 edits.

Now split by asset type: **network-first** for the document and same-origin files (cache
as offline fallback), **cache-first** for the version-pinned Three.js CDN URL. `VERSION`
constant bumped to `v16`. A failed CDN precache no longer aborts install.

### Phase 2 — ledger chips

- Tap = **audition + select**, not delete. `✕ Remove` is a full 44 px action on the selection.
- All `.pa` actions 22 px → **44 px**.
- `#led-seq` `flex-wrap:wrap` → single horizontally scrolling line, auto-scrolled to newest.
- Selection index survives removals beneath it; cleared by `resetAll()`.

Layout is now **bounded**, measured at 375×812:

| Chords | Before (`#bot` / canvas) | After |
|---|---|---|
| 4 | 229 / 371 | 330 / 270 |
| 12 | 301 / 299 | **330 / 270** |
| 27 | grows | **330 / 270** |
| 57 | grows | **330 / 270** |

Flat from 4 chords to 57. The 44 px touch targets cost ~29 px at short lengths and win
back everything beyond ~14 chords. Phase 4 recovers 84 px from the top bar, which takes
the canvas to ~354 px at *any* progression length.

### Phase 10 — `▶ Best`

Repeats kept; opens on a tonic-function chord; reserves a dominant as the cadential
approach; closes on a tonic. Greedy ordering now applies only to the interior. Capped at
the last 24 chords, and it says so. `playBestPath` computes the order once instead of
twice (the second call's status message used to clobber the first's).

| Input | Old | New |
|---|---|---|
| `I vi IV V I` | `V I IV vi` | `I IV vi V I` |
| `I V vi IV` | — | `vi IV V I` |
| `vi ii V I vi ii V I` | — | `I V vi ii vi ii V I` |
| `I iii IV ii V I vi V` | — | `I IV V vi ii iii V I` |

Across 8 test progressions: length preserved 8/8, multiset preserved 8/8, ends on a
tonic 8/8 wherever the input contained one, cadential approach 7/8. When only one
tonic-function chord exists it is reserved for the *ending* rather than the opening —
resolution matters more than the downbeat.

`music-theory-tests.js`: **103 passed, 0 failed** — unchanged.

---

## Shipped — UI consolidation & renaming (2026-08-20, second pass)

Requested directly: a stop button, all sound in one place, simpler navigation, and
musical names instead of Goetia / Kha-Ru.

### Global Stop

`■ Stop` in the top bar on every screen, plus a full-width `■ Stop All Sound` in Sound.

This needed more than a flag. Voices are scheduled ahead on the audio clock and
phrases via timers, so a 9-chord progression at 60 BPM keeps sounding for ~36 s after
any naive "stop". Added two registries — `_liveVoices` (every oscillator, self-cleaning
on `ended`) and `_liveTimers` (via a new `musicTimeout()` that replaced `setTimeout` at
all 8 musical scheduling sites). `stopAll()` cancels timers, stops all five transports,
then fades and stops every live voice.

**Verified:** 84 live voices + 8 queued timers → **0 / 0**, all transports off, and
nothing re-fires a second later. Second run: 40 voices → 0.

### One home for sound

New **Sound** pane: Stop All · tempo (± / big readout / tap / slider) · chord length ·
metronome · four-channel mixer · Soft Tone · full drone section (on-off, follow key,
12 root buttons, octave, waveform, level) · practice timer.

Removed from elsewhere: the mixer and BPM left the Rhythm transport; drone and Soft
Mode left the old Sensory tab. **Three separate metronome UIs became one** — the `#bot`
metro strip and its `♩` top-bar toggle are gone.

Also fixed: range sliders had **2 px** tracks. Now 40 px tall inputs with 20 px thumbs,
track still visually thin. Every Sound control is ≥44 px.

### Navigation: 6 screens + 15-card overlay → 5 tabs

**Play · Rhythm · Sound · Analysis · Learn**

The 15-card mode overlay is **deleted** — it duplicated the nav bar and was the main
reason the app read as a maze. Practice + Scales merged into **Learn** (6 tabs; the
Root/Scale selectors auto-hide on the three drill tabs). Icosahedron moved to Analysis,
practice timer to Sound.

### Renaming

| Was | Now |
|---|---|
| Kha-Ru · Gevurah Engine | **Harmony Check** |
| "Virtue" / CHAOTIC↔PURE | Rule Score / BREAKS RULES ↔ FOLLOWS RULES |
| Five Laws of Gevurah | Common-Practice Rules |
| Teshuvah · Contextual Resolution | Suggest a Resolution |
| Goetic Heuristic Engine | Progression Styles |
| Bael / Paimon / Amon / Asmodeus / Dantalion | Tonic Pedal / Extended Harmony / Smooth Resolution / Tritone Substitution / Modal Turn |
| Temporal Loom · Harmonic Grimoire | Rhythm · Analysis |
| Plasma Transposer | Transpose |
| Soft Mode (Sensory Shielding) | Soft Tone |
| Walhuu Timer · Four Worlds phases | Practice Timer · Warm-up/Explore/Develop/Resolve |
| Four Worlds indicator (Atziluth→Assiah) | No key yet / Single key / Modulating / Full circle |
| "faces 0/12" | "keys 0/12" |
| Fibonacci Extensions · Fibonacci Scaffold | Chord Extensions · Rhythm Presets |
| Pitch Constellation | Pitch Wheel |
| Ignition | Started in / your first key |
| Gate / Entrain | Follow Ledger |
| γR / γH / γM / γD | Percussion / Chords / Metronome / Drone |
| PLR Distance Oracle | PLR Path Finder |

Two status lines were leaking internal names to the user (`BAEL · I–IV–…` and
`Teshuvah · CHAOS · …`); both now go through `STYLE_NAMES` / `MODE_LABELS` display maps
so the internal keys keep working for the generator switch and element ids.

**Scope note — deliberately not renamed:** internal identifiers (`findGevurahPhrase`,
`setPlasmaOffset`, `applySensoryPreset`, `goeticMode`, `.goetic-btn`, `#gpane-kharu`,
`gev-score`). None are user-visible; renaming them is a large mechanical refactor with
real regression risk and zero benefit to the player. Worth doing only alongside another
change to those functions.

### Unplanned fix

`showPane()` built the sequencer grid, Learn drills and instrument controls inside
`requestAnimationFrame`. rAF is **completely starved while the document is hidden**
(measured: 0 frames in 500 ms at `visibilityState:'hidden'`), so switching panes while
backgrounded left them empty. Now called directly — `buildSeqGrid()` already re-queues
itself if its container has no width.

**Verified with rAF starved:** sequencer 80 cells, 5 polyrhythm rows, 19 patterns,
ear 4, cadence 4, 12 instrument roots, 36 scales, 7 Analysis tabs, 12 drone roots.

`music-theory-tests.js`: **103 passed, 0 failed.** Zero JS errors across all five panes.

---

## Learn pane repair — 2026-08-20

The Practice + Instruments merge left five defects. Recording them because four are
the *same class of mistake*: verifying a class attribute instead of the rendered result.

### 1. The pane had no styling at all *(critical)*

The merge renamed the element to `id="learn"` but every rule still targeted
`#practice`. So `#learn` matched **nothing**: `position: static`, `display: block`,
`z-index: auto`.

Consequences, none of which `classList.contains('open')` would ever reveal:

- `#learn.open{display:flex}` never applied — opening it did nothing via CSS
- it sat in normal document flow at 375 × 608, **on screen and occupying layout space
  even while "closed"**, only masked by `body{overflow:hidden}` and the fixed bars
  painting over it
- height was content-driven (846 px in an 812 px viewport) instead of the
  `inset:0; bottom:56px` box every sibling pane uses

Fixed by renaming the selector and all six of the pane's own ids to `learn-*`.
**The `.ptab` / `.ppane` class names deliberately stay** — `.ltab` / `.lpane` are
already the Rhythm pane's, so renaming would collide.

Now: closed → `display:none`, `offsetHeight:0`, off screen. Open → `display:flex`,
**756 px, exactly `innerHeight − 56`**.

### 2. Root and Scale changed nothing

`instUpdate()` decided what to redraw by reading `.itab.on` — the *old* Instruments
tab row, which the merge deleted. `activeTab` was permanently `undefined`, so
changing root or scale redrew no instrument. Now reads `.ptab.on`.

Verified by counting draw calls rather than guessing at pixels: root click →
`guitar:0-2-5-7-10`; scale change → redraw; switching to Keyboard → `piano:` with the
same pitch set; changing root *while on Keyboard* → redraws the **piano**, not the guitar.

> My first attempt to check this sampled the top 40 px of the guitar canvas, got
> identical bytes, and reported "no redraw". That region is blank margin above the nut.
> Counting the calls was the right instrument.

### 3. A shadowing duplicate `showITab`

Two declarations existed: the working alias next to `showPTab`, and the original
operating on `.itab` / `.ipane` / `#it-` / `#ipane-`. The original came **later in the
file, so it won** — the alias was dead. Stale one removed.

### 4. Voice Leading never finished

`runDijkstraVL()` yielded via `requestAnimationFrame` before computing, so the status
would paint first. Sound intent — but **rAF does not fire in a hidden document**, so
the search silently never ran and the pane sat on `Dijkstra 3v running…` forever. This
is the third instance of this trap in the file (after `showPane` and the chip animation).
Switched to `setTimeout`, which still yields a turn and always fires.

Now completes: cost 12 at 3 voices, 20 at 5, Play and Commit both revealed.

### 5. Touch targets

`.exp-btn` — the primary **▶ Play Chord / Play Interval / Play Cadence** action in
every drill — was 26 px. `.vl-vsb` voice-count buttons 22 px. `#learn-close` 27 px.
All now ≥44 px; a sweep of every button, select and input in the pane returns **zero**
sub-40 px targets.

Also removed the orphaned `#instruments` / `#inst-header` / `#inst-body` / `.itab` /
`.ipane` / `.inst-tabs` CSS, and retuned `#inst-controls` and `.inst-section`, whose
margins assumed the old zero-padding instrument body and were double-indenting inside
the Learn body.

### Verified

All six tabs render with no horizontal overflow; Root/Scale controls appear only on the
three instrument tabs. Pane isolation checked across all five screens — exactly one
pane shown at a time, never two. `Stop All` cuts 20 voices to zero; sequencer 80 cells,
12 drone roots, 7 Analysis tabs, 9 Neighbour pills; chart export intact; no page-level
horizontal overflow. `music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

---

---

## Rhythm pane repair — 2026-08-20

Unlike Learn, the pane box was already correct (fixed, 756 px, no id/CSS mismatch).
The problems were the controls and one piece of dishonesty.

### Phase 5 debt paid — the sequencer grid

`grid-template-columns: 28px repeat(16, 1fr)` crushed 16 columns into 336 px = **17 px
each** against a ~40 px fingertip, and the container did not scroll, so there was no
way out of it.

Now **fixed 34 px columns that overflow and scroll**, like a hardware step sequencer:
cells **17×22 → 34×34**, grid 606 px scrolling inside 336 px. Two additions make the
scroll navigable: **row labels are `position:sticky`** so `IV I V ii vi` stay visible
while the steps move under them, and every 4th step gets a heavier left border with a
gold beat number, so the header reads `1···2···3···4···` instead of `····4····8`.

### 71 sub-40 px targets → 0

| Control | Was | Now |
|---|---|---|
| `.lbtn` transport (Play, Loop, Mode, Follow Ledger, Clear) | 22 px | 44 |
| `.plb` polyrhythm lengths — 40 of them | 24×20 | 36×40 |
| poly phase-offset number inputs | 32×15 | 48×40 |
| `.pbtn2` pattern library — 19 of them | 21 px | 44 |
| `#loom-close` | 24×27 | 44×44 |
| the "Sound" inline link | 27×14 | 44 |

The polyrhythm rows also could not scroll, so at 36 px per length button the later
options would have been clipped; they now scroll like every other strip.

### The named meters were decorative — now real

`Waltz 3/4` wrote onsets at steps 0, 4, 8 and left `rowLen` at 16, so it looped as
**4/4 with a silent fourth beat**.

Setting `rowLen` alone was not enough either: the master clock was hard-wired
`seqStep = (seqStep+1) % SEQ_STEPS`, so `rowLen = 12` produced a 12-against-16
*polymeter*, not 3/4. Added **`seqCycle`** — how many of the 16 authored steps actually
play before looping — and `tickSeq` now wraps on it.

Verified by driving `tickSeq` directly and recording the step sequence:

| Pattern | `seqCycle` | Observed loop |
|---|---|---|
| Waltz 3/4 | 12 | `0…11, 0…11, 0,1` |
| 5/8 Odd | 10 | `0…9, 0…9, 0…5` |
| 7/8 Balkan | 14 | `0…13, 0…11` |
| Son Clave | 16 | `0…15, 0…9` |

Steps outside the cycle are shaded at 26% opacity so the grid shows which columns are
in play — counts confirmed exactly: 3/4 dims 4 numbers and 20 cells, 5/8 dims 6 and 30,
7/8 dims 2 and 10, 4/4 dims none. `Clear` and `Reset` return to 16.

**`5/4 Dave` was renamed `5/8 Odd`.** 5/4 is 20 sixteenths and `seqStep` only reaches
15, so a true 5/4 is impossible without enlarging the grid — but its onsets (0, 3, 5, 8)
all sit inside ten steps, so at `seqCycle = 10` it becomes a genuine five-based cycle
rather than a mislabelled one. The length selector gained 10 and 14 to match.

Manual polyrhythm still works independently of the master cycle — a row set to 5
against a 16-step master behaves exactly as before.

### Label fixes

The mode button shipped reading `Tonal` while `toggleSeqMode()` wrote `Mode: Tonal` /
`Mode: Rhythm`, so the first press appeared to skip a state. Now starts at
`Mode: Tonal`, and the percussive state is **`Mode: Percussion`** — "Rhythm" is the
pane's own name now, so reusing it for the mode was confusing. Bare `✕` became
`✕ Clear`.

### Correction to the Learn write-up above

That section claims a sweep found "zero" sub-40 px targets in Learn. **That was wrong.**
The sweep ran on a tab where `#inst-controls` was `display:none`, and hidden elements
report zero width, so the filter skipped them — the 12 Root buttons (36×24) and the
scale select (27 px) were never measured.

Re-swept properly across **all 15 tab combinations** with control groups forced visible.
Fixed: Root buttons → 40×44, scale select → 44, `#grimoire-close` → 44×44, the ♭/♯
transpose nudges → 44×44, 12 `.tkey` transpose keys → 40×44, 7 `.genre-btn` → 44,
5 `.fib-btn` extension buttons → 44, `.goetic-btn` → 44, the `▼ V/` and `▼ ♭`
expanders → 40.

### Deliberately left under 40 px

- **`.ks` key row (34 px) and `.cp` chord pills (36 px)** on Play. These are dense
  horizontally-scrolling selector strips; at 44 px each, twelve keys plus seven chords
  plus eight substitutions would add roughly 30 px of bottom bar and take it straight
  out of the canvas. 34–36 px in a scrolling strip is a considered trade, not an oversight.
- **The "Follow key" checkbox (18 px)** in Sound — it sits inside a 44 px `.snd-check`
  label, so the tap target is already 44.

### Verified

Exhaustive per-tab sweep: 2 rhythm tabs, 7 Analysis tabs, 6 Learn tabs, Sound, Play.
Everything ≥40 px except the two categories above. Pane isolation correct across all
five screens. `Stop All` cuts 28–52 voices and four transports to zero. Grid 80 cells,
12 drone roots, 7 Analysis tabs, 6 Learn tabs, 9 Neighbour pills, chart export intact,
no page-level horizontal overflow. `music-theory-tests.js` **103 passed, 0 failed.**
No JS errors.

---

---

## Analysis pane repair — 2026-08-20

The pane box was already correct (fixed, 756 px, all seven tabs render, no overflow).
All 46 buttons across the seven tabs were clicked; none threw. The defects were
navigation and stale text.

### Two dead navigation functions

```js
function toggleGrimoire(){ showPane(grimoireOpen ? 'ladder' : 'grimoire'); }
function toggleLoom(){     showPane(loomOpen     ? 'ladder' : 'loom'); }
```

Both still passed **pre-merge pane names**. `showPane()` validates against
`PANES = ['ladder','rhythm','sound','analysis','learn']` and falls back to `'ladder'`
for anything unknown — so `toggleGrimoire()` could never open Analysis. It silently
jumped to Play.

That mattered because `applySensoryPreset()` relies on it to land the user on
Analysis → Presets after applying a preset. **The session presets navigated to the wrong
screen.** Fixed, and the preset now calls `showPane('analysis')` directly rather than
going through a legacy flag. Verified: applying "First Session" lands on Analysis with
the Presets tab active.

### An inverted verdict scale

```js
const verdicts=['Chaos reigns','Dissonant','Strained','Acceptable','Coherent','Virtuous','Pure Din'];
const vi=Math.floor(res.score/17);
```

Seven labels for six reachable buckets — `floor(100/17) = 5`, so index 6 was dead — and
`'Pure Din'` sat **above** `'Virtuous'`, meaning if it had ever fired the worst label
would have shown for the best score. Replaced with six ordered labels describing rule
compliance: *Breaks every rule → Mostly outside the rules → Loosely follows the rules →
Broadly by the book → Close to textbook → Textbook voice-leading*, with the index clamped
to the array.

### Stale text the rename pass missed

`'Virtuous · 8 chords'` verdict · `'First Session — C Major · Fibonacci scaffold · Soft
Mode active'` · `'Soft Mode attenuates harsh upper harmonics'` · and all five chord
extension descriptions, which still read *"9ths engaged — Paimon stirs"* and *"full
Fibonacci scaffold, Paimon ascendant"*. All now describe what the setting does to the
sound: *"9ths — richer, and the sense of key starts to loosen"*.

### Verified

Preset navigation lands correctly. 46 buttons clicked with zero throws. Harmony Check
score 100 with five rule dots green; Cloud reports 7 of 12 pitch classes; Tonnetz draws
and reports PLR neighbours. `Stop All` cuts 44 voices to zero. Pane isolation correct
across all five screens. `music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

---

---

## Phase 1 + Phase 3 shipped — 2026-08-20

### Phase 1 · The schema

Ledger entries gained five **optional** fields. Every reader falls back to the existing
global, so entries that predate them behave exactly as before — including anything
already exported.

```js
{ type, roman, note, qual, key, fi,      // unchanged
  beats,    // duration in beats      → entryBeats(e)   ?? chordBeats
  figure,   // hold|strum|arp-up|arp-dn|pulse
  accent,   // velocity scale
  voicing,  // [midi,…] from Dijkstra; null = root triad
  ext }     // per-chord extension level
```

Helpers: `entryBeats`, `entryFigure`, `entryAccent`, `entryPitches`, `playEntry`.

**`commitVLToLedger()` no longer throws the voicings away.** It used to rebuild entries
from six fields, which meant the entire Dijkstra search was discarded the instant you
committed it — the defect flagged in the discovery plan. Verified: 5 voicings stored,
first reads `C3 E3 G3`, and `entryPitches()` then returns 131/165/196 Hz, so playback
really uses them. Per-chord `beats` survive the commit too.

### Phase 3 · The Chord Rhythm Track

One row on the Play screen. Segment width is proportional to duration, so the shape of
the progression is something you read rather than infer. Bar lines fall every 4 beats.

Given beats `4, 1, 1, 2, 8` the segments measured **33, 12, 12, 17, 66 px** — the 8-beat
chord exactly twice the 4-beat one — with `16 beats · 4 bars` in the readout and bar
lines on the segments starting at beats 4 and 8.

Selection is **shared with the ledger chips**: tapping either selects the same chord,
highlights both, and opens the card. The inline `− beats +` acts on that selection and
greys out when nothing is chosen.

### Playback actually renders it

`playLedger()` accumulates time from each chord's own length instead of a fixed step.
With `4,1,1,2,8` at ♩=120 the chord onsets landed at **0, 2.0, 2.5, 3.0, 4.0 s** — exactly
0.5 s per beat.

The grid **Loop** honours it too. It used to advance every `ledgerSpread` steps
regardless, so the rhythm track had no effect on it at all; a `loopHold` counter now
holds each chord for `beats × 4` sixteenths. Verified: with a 4-beat opening chord the
loop advanced twice in 2.6 s, because the first chord genuinely occupies 16 sixteenths.

`figure` is audible: **hold** spreads notes 30 ms, **strum** 55 ms, **arp up/down**
distributes across the chord's own length (so a long chord arpeggiates slowly and a short
one is nearly a strum), **pulse** re-articulates once per beat.

### Layout — the cost, and a correction mid-build

My first attempt used a separate 46 px control row under the track. That put the bottom
bar at **375 px and the canvas at 184 px**, which is too little for the solid that is the
app's input device. Rebuilt: the ± folded inline into the track row and the figure picker
became a **fourth card band ("Rhythm")**, where per-chord editing already lives.

| | bottom bar | canvas |
|---|---|---|
| before the track | 249 | 310 |
| first attempt (separate control row) | 375 | **184** |
| shipped | **335** | **224** |

So the whole feature costs **40 px** — one row. The remaining difference from 310 is the
Neighbours strip (44 px), which also only appears once a chord exists.

**Phase 4 is now the binding constraint.** At 224 px the canvas is usable but tight;
reclaiming the top bar's 156 → ~72 px would take it to roughly 308 px with the full
rhythm feature present.

### Verified

Beats survive a card Replace (6 beats held across `Am → A`, readout updated to
`14 beats · 3.5 bars`) and a removal shrinks the track from 5 segments to 4. Reset hides
the track and clears `loopHold`. `Stop All` cuts 22 voices to zero and clears the playing
highlight. Pane isolation correct across all five screens; grid 80 cells, 12 drone roots,
7 Analysis tabs, 6 Learn tabs, 9 Neighbour pills; chart export intact; no sub-40 px
targets in the new row; no page overflow. `music-theory-tests.js` **103 passed, 0 failed.**
No JS errors.

---

---

## Phase 4 shipped — top bar 156 → 76 px (2026-08-20)

Three rows became two. `bar-r2` — a nine-control row that wrapped to two lines — is gone;
its contents moved into a new **Settings bottom sheet** behind a `⚙` in the bar.

```
[ James' Ladder            II · △ 3/12   ■   ⚙ ]   40px
[ status line                                  ]   13px
```

**What stayed in the bar:** the title, a compact readout, `■ Stop` (a 40 px glyph — the
panic button has to be reachable from anywhere), and the gear.

**What moved into Settings:** Level I/II/III with the full level name, "What do the levels
do?", Fold Mode, Auto-rotate, Theme, and `↺ Clear everything` — the destructive action is
safer behind a sheet anyway. All controls kept their existing ids, so `syncLevelUI`,
`cycleFoldMode`, `toggleRot` and `toggleTheme` needed no changes.

**One readout replaced two elements.** The separate `#lvl-tag` row and the Four-Worlds
`#world-ind` collapsed into `II · △ 3/12` — level, stage glyph, keys opened — with the
full description in its tooltip: *"Level II · Modulation Gateway — Single key: one tonal
centre (1/12 keys)"*.

### A latent bug this surfaced

`syncLevelUI()` set `#lvl-tag.innerHTML` to a string containing its own `<b>` — but
`<b id="lvl-n">` was **nested inside `#lvl-tag`** in the markup. So the first level change
destroyed `#lvl-n`, and every later update hit the `if(n)` guard and silently did nothing.
Separating them into the sheet and the bar fixed it by construction; `#lvl-n` now tracks
correctly through I → III → II.

### The payoff

At 375 × 812, with the rhythm track, Neighbours strip and a five-chord progression all
present:

| | bar | canvas | bottom | nav |
|---|---|---|---|---|
| before Phase 4 | 156 | 224 | 322 | 56 |
| **after** | **76** | **358** | 322 | 56 |

Sums to exactly 812. The canvas is now **larger than the 310 px it had before the rhythm
track existed** — Phase 4 more than paid for Phase 3.

### Honest limit on short phones

At **360 × 640** the same layout gives a **186 px** canvas, and opening both optional
substitution rows takes it to **102 px**. Before Phase 4 those figures were 106 and 22 —
so this moved a short phone from unusable to tight, not to comfortable. The bottom bar is
still half the viewport on a 640 px screen.

If that matters, the next lever is making `#bot` collapsible on short viewports rather
than shaving anything further off the top. Not done — flagging it rather than assuming it.

### Verified

All nine Settings controls ≥44 px, zero small targets. Level changes propagate to both
the sheet and the bar readout. Fold Mode cycles, Auto-rotate and Theme toggle (and Theme
keeps its label now that the glyph swap no longer eats the word). Ignition still raycasts
correctly at the new canvas geometry and the five bubbles align. Settings sheet 493 px of
525 allowed on a 640 px screen; chord card scrolls within its cap. `Stop All` cuts 52
voices to zero. Pane isolation correct across all five screens. Chart export intact, no
page overflow. `music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

---

---

## Phase 5 + clean loop playback — 2026-08-20

### The loop was stacking chords

Two separate causes, both real:

1. It was gated on **`anyActive`** — a chord change only landed on a grid column that
   happened to contain an onset. So the timing was driven by whatever pattern was loaded
   rather than by the durations set on the rhythm track, and changes arrived early or
   late depending on the grid.
2. **Nothing stopped the outgoing chord.** Each `playEntry` scheduled notes for the
   chord's full length; when the next chord fired, the previous one's tail — and with the
   `pulse` figure, its queued re-articulations — kept sounding underneath.

Fixed by giving voices an owner. `trackVoice()` now returns its record, `harmonicVoice()`
returns it onward, `playEntry()` takes a collector array, and a new `releaseVoices(group)`
fades and stops a set. The loop holds the sounding chord in `_loopVoices` and releases it
at the instant the next one starts. The `anyActive` gate is gone — a chord fires exactly
when the previous one's beats run out.

**Measured** at ♩=140 with Golden (`3,2,3,2,3,5`): gaps of **1285 ms and 854 ms** against
expected 1286 and 857, and **exactly 4 voices held at every chord change** — a constant,
which is the proof that the previous chord is always released before the next begins.
Loop → Stop → Loop again leaves no residue (0 voices, 0 timers, 0 highlights).

### The sounding chord is now marked

`setPlayingChord(idx)` sustains a highlight for the chord's whole duration on **both** the
rhythm-track segment and the ledger chip, instead of the old 200 ms flash, and scrolls the
ledger to keep the sounding chord in view on a long progression. Verified: exactly one
segment and one chip highlighted at a time; both cleared by `Stop All` and `stopLoop`.

### Phase 5 · Seven generators

Behind a `⟳` in the track row, opening a picker sheet. Each writes `beats` across the
whole progression. On `I vi IV V I ii` with Son Clave loaded:

| Generator | Result | Rule |
|---|---|---|
| Even | `2 2 2 2 2 2` | equal division |
| Anacrusis | `1 2 2 2 2 6` | short pickup, long final |
| Cadential weight | `2 2 2 2 4 4` | cadence arrivals get double |
| Tension-driven | `3 4 4 2 3 4` | consonance → length, via `chordConsScore` |
| Euclidean | `2 3 3 2 3 3` | maximally even over whole bars |
| Golden | `3 2 3 2 3 5` | long–short alternation, opening out |
| Clave-locked | `1.5 1.5 2 1 2 1.5` | gaps between grid onsets |

**All seven produce distinct shapes.** Two needed correcting after the first run:

- **Euclidean collapsed into Even** at six chords: `round(6×2/4) = 3` bars, and 12 beats
  over 6 chords divides exactly. Maximal evenness is only audible when the bar length in
  beats does *not* divide the chord count, so it now tries a few bar counts before
  settling — and when it genuinely cannot differ (any n divisible by 4) it says so in the
  status rather than appearing to do nothing.
- **Clave-locked produced quarter-beat durations.** Reading all five rows gave an onset at
  almost every step. It now reads **row 0 only** — the row that actually carries the clave —
  and treats a grid step as an eighth rather than a sixteenth, because clave patterns are
  two-bar figures written across these 16 steps. Son Clave's row-0 onsets `0,3,6,10,12`
  give gaps `3,3,4,2,4` → `1.5, 1.5, 2, 1, 2` beats, which totals two bars exactly.

Generated rhythms and per-chord overrides coexist: after Cadential weight gave
`2 2 2 2 4`, nudging the first chord produced `3 2 2 2 4`.

### Verified

Layout holds at **76 / 345 / 335** (bar / canvas / bottom). Zero sub-40 px targets in the
track row; picker items 56 px. Reset clears `loopHold`, the voice group and the highlight.
Pane isolation correct across all five screens; grid 80 cells, 12 drone roots, 7 Analysis
tabs, 6 Learn tabs. Chart export intact, no page overflow.
`music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

---

---

## Phase 6 shipped — lookahead scheduler and swing (2026-08-20)

### The problem, restated precisely

Both transports were a bare `setInterval` that played notes at `ac.currentTime`. Two
consequences: every scrap of main-thread jitter — competing with a Three.js render loop —
landed directly on the note onsets, and **swing was impossible**, because swing is nothing
but placing a note at a deliberate offset, and a note could only ever be played "now".

### The scheduling origin

The obvious fix is to pass an absolute `when` into every voice, but that meant changing
~20 call sites. Instead the voices read a module-level origin:

```js
let _schedOrigin=null;
function voiceTime(delay){
  const ac=getAC();
  return (_schedOrigin!=null?_schedOrigin:ac.currentTime)+(delay||0);
}
```

All five voice constructors (`rhythmVoice`, `harmonicVoice` and its Soft Tone rebuild,
`staccatoVoice`, `clickBeat`) now start at `voiceTime(delay)`. The scheduler sets the
origin synchronously around one step and clears it in a `finally`, so nothing asynchronous
can observe it. Zero signature changes; behaviour unchanged when no origin is set.

### One clock for both transports

`tickSeq` did three jobs at once — paint, schedule audio, advance counters — which is
precisely why it could not be scheduled ahead. Split into:

- **`scheduleStep(step, when)`** — audio only, at an exact absolute time
- **`paintStep(step)`** — the grid column and metronome dots
- **`advanceStep()`** — step counter and ledger cursor

One scheduler now serves the sequencer *and* the metronome: it wakes every 25 ms, looks
120 ms ahead, and queues each step's visuals to be drained against the audio clock rather
than painted when the callback happens to run.

`requestAnimationFrame` drives the visual drain, and here that is the right choice — if
the document is not rendering there is nothing to update. (Audio does not depend on it,
which is the distinction the three earlier rAF bugs in this file were about.)

`setBpm` no longer restarts the transport. It used to `stopSeq(); startSeq();`, resetting
the loop to the top on every tempo nudge; the scheduler reads `stepDurationSec()` fresh on
each wake, so a tempo change takes effect on the next step and the loop keeps its place.

### Measured

Scheduler wakes came 16–32 ms apart while the document was hidden, and the scheduled note
times were unaffected:

| | target | mean | **std dev** | notes |
|---|---|---|---|---|
| straight, ♩=120 | 125 ms | **125.000** | **0** | 19 |

Zero jitter. For contrast, the audit at the start of this work measured the old
`setInterval` path arriving at **~1000 ms against a 107 ms target** under throttling.

### Swing

The second sixteenth of each pair is pushed later by `swing × stepDuration`, which
lengthens the first and shortens the second — the definition of a swung pair. Control in
Sound, 0–50%.

| setting | gaps | ratio |
|---|---|---|
| 0% | 125 / 125 | 1.00 : 1 straight |
| 33% | **166.25 / 83.75** | **1.985 : 1** — triplet feel |
| 50% | 187.5 / 62.5 | 3 : 1 hard shuffle |

### Verified

Metronome alone starts and stops the shared clock; running both and stopping one keeps the
clock alive for the other; stopping both stops it. Tempo change mid-flight preserves the
loop position. Loop with swing on still holds exactly 4 voices per chord — no overlap — and
one highlight. `Stop All` leaves clock off, 0 voices, 0 timers, 0 highlights. Odd meters
still loop odd (Waltz 3/4 → cycle 12, 20 dimmed cells). One-shot `▶ Play` unaffected
(onsets at 0,1,2,3,4 s for five 2-beat chords at ♩=120). Layout 76 / 345 / 335.
No stale `setInterval(tickSeq` or `setInterval(clickBeat` remain.
`music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

---

### Next

Phase 8 (progression library), and from the discovery plan: MIDI export — now the most
valuable remaining item, since everything discoverable in the app still cannot leave it as
anything but a text chart — plus Pivot Finder, Smooth Loop and Reinterpret.

Phase 12 (real time signatures) landed ahead of schedule — `seqCycle` was the missing
piece, and the track's bar lines read from the same 4-beat grouping.

Phase 4 is now cheaper than planned: `bar-r2` has one fewer button (the `♩` toggle is
gone), and the Menu overlay it was going to migrate controls *into* no longer exists —
so Level / Guide / Fold / Auto-rotate need a new home. Simplest option is a small
overflow sheet on the Play screen, or moving Level into the Play pane itself.

---

*James' Ladder — Chord Rhythm & Progression Plan*
*Audit: 2026-08-20 · live session at 375×812 · 400-run generator sampling*
*Status: active — Phases 0, 2, 10 shipped and verified; Phase 1 next*
