---
title: James' Ladder — Ledger Readability & Chord Analysis
subtitle: Making the ledger the product — readable charts, and everything derivable from one chord
date: 2026-08-20
status: proposal — awaiting go-ahead
type: development-plan
tags: [james-ladder, ledger, readability, analysis, chord-chart]
---

# The Ledger Is the Product

The workflow is: **generate ideas here → read them → play them on a real instrument.**
That makes the ledger the actual output of this app, and the 3D solid the input device.
Everything below follows from taking that seriously.

Companion to [[🎼 James Ladder — Discovery Tool Design]] and
[[🥁 James Ladder — Chord Rhythm & Progression Plan]].

---

## Part 1 — Why the ledger is currently hard to read

Three concrete defects, not vague complaints.

### 1. The chips don't tell you what to play

A chip renders as `roman·rootLetter`:

```
vi·A     IV·F     I·C     V·G
```

**The quality is not shown.** `vi·A` does not say *play A minor* — the only place the
quality appears is the hover tooltip, which does not exist on a phone. And `IV·F` versus
`iv·F` differ **by one character's letter case.** A musician glancing at this to play it
has to decode roman-numeral case conventions to know whether a chord is major or minor.

### 2. Chromatic chords are labelled `?`

`romanInKey()` only knows the seven diatonic degrees:

```js
const m = DIA.find(d => d.semi === iv);
return m ? m.roman : null;
```

So the PLR strip does this:

```js
playPlanar(romanInKey(info.root, curKey) || '?', info.root, info.qual, curKey, fi);
```

Every chromatic P/L/R result — which is **the entire point of PLR transforms** — lands
in the ledger as `?·A♭`. The one feature that finds non-obvious harmony is the one that
produces unreadable entries.

`romanFromSemi()` is a partial fix (it covers ♭II, ♭III, ♭VI, ♭VII) but falls through to
returning a *note name* as if it were a roman numeral for the tritone and for major-quality
2nd, 4th, 6th and 7th degrees.

### 3. No structure — no bars, no key grouping

A progression across three keys is a flat run of chips with `C→G` chips inline. There is
no visual grouping, so you cannot see phrase shape or where a key change actually lands.

### And the export doesn't help

`exportClipboard()` emits CSV:

```
face,key,roman,note,qual,pitchClasses
1,C,vi,A,min,A-C-E
```

That is a spreadsheet row, not a chord chart. It drops rhythm entirely, and nobody reads
CSV off a phone to play guitar.

---

## Part 2 — Theorising: everything derivable from one ledger chord

The ledger entry is six fields. But *in context* — knowing its neighbours, its key, and
the harmonic cloud — an enormous amount is computable. Ranked by how much a musician
about to play it actually cares.

### Tier 1 · What do I play?

| Item | Source |
|---|---|
| Chord symbol — `Am`, `F`, `C#dim` | `note` + `qual` (needs a formatter) |
| Notes — A C E | `chordPCs()` ✓ |
| Quality in words — "minor triad" | `qual` |
| Guitar shape / piano keys | `drawGuitar` / `drawPiano` already exist ✓ |

### Tier 2 · What is it doing here?

| Item | Source |
|---|---|
| Roman numeral | `roman` ✓ (broken for chromatic — see Part 1) |
| Degree name — submediant | new lookup, 12 entries |
| Function — T / PD / D | `HFG` groups ✓ |
| Diatonic / borrowed / secondary dominant / chromatic | derivable from `roman` shape |
| Consonance vs tonic anchor | `chordConsScore()` ✓ |

### Tier 3 · How does it connect? — the most teachable band

| Item | Source |
|---|---|
| Root motion from previous — "up a minor 3rd" | interval arithmetic |
| **Common tones with previous / next** — count *and which notes* | set intersection of `chordPCs` |
| Total voice-leading motion in semitones | `voiceLeadCost()` ✓ |
| PLR relation to previous, if any — "this is R of the last chord" | `plrP/L/R` ✓ |
| Cadence role — "closes an authentic cadence" | `computeCadenceLog()` ✓ (needs chord index added) |
| Position on the tension curve | `renderTensionArc()` ✓ |

Common tones are the single most useful thing here. "F → Am shares two notes (A, C)" tells
a guitarist exactly what to hold and what to move, and it is a two-line computation.

### Tier 4 · What else could this be? — the highest-value band

**A chord's roman numeral in every other key where it's diatonic.**

```
Am  is  vi in C  ·  iii in F  ·  ii in G
```

Each of those is a modulation door. And here is the part that connects to what makes this
app unusual: **the app already knows which of those keys are geometrically reachable from
the current face.** So the card can say:

> `Am` is also **ii in G** — and G is one fold away.

That is a genuinely novel piece of information. No other tool can say it, because no other
tool has a modulation adjacency graph. It turns the dodecahedron from decoration into a
functioning part of the analysis.

Also derivable: which of the 35 candidate scales contain the chord.

### Tier 5 · What could I put instead?

| Item | Source |
|---|---|
| P / L / R neighbours with common-tone counts | `computePLR` ✓ |
| Relative major / minor | R transform ✓ |
| Tritone substitution, when it's functioning as a dominant | trivial |
| The secondary dominant that targets it — `V/x` | `SEC_DOM_TARGETS` ✓ |
| Chromatic mediants | interval arithmetic |

### Tier 6 · Whole-progression readouts

Not per-chord, but reachable from the same ledger and worth surfacing in the chart footer:
key-centre estimate and confidence, pitch classes used vs unused, cadence inventory,
best-fitting scale **and its unused chords**, genre fingerprint.

---

## Part 3 — Three things to build

### 3.1 · Fix chord naming — the prerequisite

Two small functions everything else depends on.

```js
// "Am", "F", "C#dim" — what you actually play
function chordSymbol(note, qual, ascii=false)

// Correct roman for ANY root, chromatic included. Replaces the `?`.
// 0:I 1:♭II 2:II 3:♭III 4:III 5:IV 6:♭V 7:V 8:♭VI 9:VI 10:♭VII 11:VII
// cased by quality: major upper, minor lower, dim lower + °
function romanAny(note, key, qual)
```

Then route the PLR strip through `romanAny` instead of `romanInKey(...) || '?'`.

### 3.2 · Readable ledger chips

Two lines: **what you play** on top, function underneath.

```
┌────────┬────────┬────────┬────────┐
│  Am    │  F     │  C     │  G     │   ← chord symbol, 13px, full contrast
│  vi    │  IV    │  I     │  V     │   ← roman, 8px, muted
└────────┴────────┴────────┴────────┘
```

Key changes stop being inline chips and become **dividers with a key label**, so runs of
chords in one key group visually:

```
  ╭─ C major ─────────────────╮ ╭─ G major ──────────────╮
  │  Am    F     C*    │        │  C     Am    D     G   │
  │  vi    IV    I     │        │  IV    ii    V     I   │
  ╰────────────────────╯        ╰────────────────────────╯
      * pivot — also IV in G
```

Pivots keep the gold border and show their dual reading. Substitutions show `V/ii`, `♭VII`
on the lower line, which now actually fits.

### 3.3 · Chord chart export — two formats

**Chart** — for pasting into a notes app:

```
JAMES' LADDER — 20 Aug 2026

KEY OF C MAJOR
  Am    F     C     G
  vi    IV    I     V

  >> pivot on C  (I in C = IV in G)

KEY OF G MAJOR
  C     Am    D     G
  IV    ii    V     I

8 chords · 2 keys · ends on an authentic cadence
best fit: C major (94%)
```

**One line** — for messaging:

```
C: Am F C G | G: C Am D G
```

Both buttons go **next to the ledger on the Play screen**, not buried in Analysis. Once
`beats` exists (Stage 1 of the other plan), the chart gains bar lines:

```
| Am     | F      | C    G  |
```

### 3.4 · The chord card — tap a chip

Tapping already auditions and selects. A `ⓘ` on the selected chip opens a bottom sheet:

```
╭─────────────────────────────────────╮
│  Am                            ×    │
│  A · C · E — minor triad            │
├─────────────────────────────────────┤
│  vi of C major · submediant         │
│  Tonic function · diatonic          │
│  Consonance 82% vs tonic            │
├─────────────────────────────────────┤
│  ← from F   root up a 3rd           │
│             2 common tones (A, C)   │
│             2 semitones of motion   │
│  → to C     root down a 3rd         │
│             2 common tones (C, E)   │
├─────────────────────────────────────┤
│  ALSO READS AS                      │
│  iii in F      ii in G  ← 1 fold    │
├─────────────────────────────────────┤
│  INSTEAD, TRY                       │
│  C (R) · F (L) · Am7 · A♭ (mediant) │
├─────────────────────────────────────┤
│  [ Fretboard ]  [ Keyboard ]        │
╰─────────────────────────────────────╯
```

Every band is computable from machinery that already exists. The `← 1 fold` marker is the
part that only this app can produce.

---

## Part 4 — Build order

| Step | Work | Effort |
|---|---|---|
| **1** | `chordSymbol()` + `romanAny()`; route PLR through it — kills every `?` | 45 min |
| **2** | Two-line ledger chips; key-group dividers | 1.5 hr |
| **3** | Chord chart export, both formats, buttons on Play | 1.5 hr |
| **4** | Chord card sheet — Tiers 1–3 | 2 hr |
| **5** | Chord card — Tier 4 "also reads as" + fold-distance marker | 1 hr |
| **6** | Chord card — Tier 5 substitutions | 1 hr |
| **7** | Chart footer analysis (key fit, cadences, unused notes) | 45 min |
| **8** | Fretboard / keyboard buttons wired into the card | 45 min |

**≈ 9.5 hours.** Steps 1–3 are the readability fix and are worth shipping alone. Step 1 is
a genuine bug fix and should go regardless.

### Interaction with the other plans

- Step 1 is a **prerequisite** for the Neighbour Chords strip (Discovery A) — that feature
  would otherwise add more `?` entries.
- The chart gains bar lines free once the `beats` schema lands (Rhythm Stage 1).
- Tier 4's fold-distance marker overlaps with Pivot Finder (Discovery D); build the shared
  "which keys is this chord diatonic in, and how far is each" helper once.

---

## Decisions — settled 2026-08-20

1. **Two-line chips** — symbol above, roman below.
2. **Unicode on screen, ASCII in export** — `A♯m` / `C°` in the UI, `A#m` / `Cdim` /
   `bVI` in the chart.

---

## Shipped — Steps 1–3 (2026-08-20)

### Step 1 · Chord naming

Added `chordSymbol()`, `entrySymbol()`, `displayNote()`, `romanAny()`, `noteAscii()`,
`romanAscii()`, `degreeTerm()`.

`romanAny()` covers all twelve degrees, cased by quality — verified exhaustively:

```
maj   I  ♭II  II  ♭III  III  IV  ♭V  V  ♭VI  VI  ♭VII  VII
min   i  ♭ii  ii  ♭iii  iii  iv  ♭v  v  ♭vi  vi  ♭vii  vii
dim   i° ♭ii° ii° ♭iii° iii° iv° ♭v° v° ♭vi° vi° ♭vii° vii°
```

Both chord-labelling sites now route through it — the PLR strip and `applyChain2`
(the Tonnetz chain). **No `?` can reach the ledger any more.** The two remaining
`romanInKey()` callers are genuine diatonic gates and were left alone.

### Step 2 · Ledger chips

Two lines — `Am` at full contrast over `vi` small and muted, inside the existing 44 px
(verified 44 × 46). Key changes became `▸ G` dividers instead of inline `C→G` chips.
Pivots show their dual reading on the roman line: `C` / `I→IV`.

### Step 3 · Chord chart export

`⎘ Chart` and `⎘ Line` next to the ledger on Play. Output:

```
JAMES' LADDER  —  Thu Aug 20 2026

KEY OF C MAJOR
  C     Am    F     G     C
  I     vi    IV    V     I

  >> pivot on C  (I in C = IV in G)

KEY OF G MAJOR
  C     D     G
  IV    V     I

8 chords · 2 keys · ends on an authentic cadence
best fit: C Major (Ionian)  (1 note outside it)
```

### Four bugs found while building it

1. **Pivot labels ignored quality.** `romanInKey()` matches on scale degree only, so a
   C minor pivoting into G was labelled `IV in G` — but IV in G is C *major*. The root
   check still gates whether the fold is offered; the label now uses `romanAny` and
   tells the truth (`iv in G`).
2. **"ends on a authentic cadence."** Now article-aware.
3. **`best fit: C Chromatic`.** The Chromatic scale contains every pitch class by
   definition, so it always won on wide material and said nothing. `getTopScale()` takes
   `{excludeChromatic:true}`, and the footer reports how many notes fall outside the
   winner.
4. **Clipboard failure was a dead end.** Writes fail on an unfocused document, in
   permission-restricted webviews, and on http in some Android builds. For a feature
   whose entire purpose is getting material out, that cannot just print an error — added
   a selectable-text fallback dialog, verified to carry the exact chart.

### Unplanned fix — the bottom bar was eating the canvas

Adding `✕ Remove`, `⎘ Chart` and `⎘ Line` exposed that **every selector row wrapped
instead of scrolling**, so each extra control stole another 34–36 px band:

| Row | Before | After |
|---|---|---|
| `#key-row` (12 keys) | 72 | **34** |
| `#chord-row` (7 pills + 2 toggles) | 102 | **36** |
| `#borrowed-row` | 76 | **36** |
| `#sec-dom-row` | 76 | **36** |
| `#led-acts` (7 actions) | 500 px wide in a 343 px box — **last buttons unreachable** | **44**, scrolls |

All five are now single scrolling lines. With every row open the bottom bar is **333 px
and the canvas 226 px — flat from 8 chords to 28** (previously it hit 435/124).

`music-theory-tests.js`: **103 passed, 0 failed.** No JS errors.

### Note on measuring this

`getBoundingClientRect()` reported chips at 31.68 px when `offsetHeight` said 44. The
`lein` keyframe animation starts at `scale(0.72)`, and **CSS animations do not advance
in a hidden document** — same starvation as `requestAnimationFrame`. Use `offsetHeight`
when measuring this app through a non-compositing browser pane.

---

## Shipped — Chord card, "also reads as" band (2026-08-20)

Tap any ledger chip: it auditions, selects, and opens a bottom sheet. Header gives the
symbol and notes for context; the first band is Tier 4.

```
Am
A · C · E — minor triad

ALSO READS AS
 vi    in C major      current key
 ii    in G major      1 fold away
 iii   in F major      3 folds
```

### `chordReadings()` — quality-aware, unlike romanInKey

`romanInKey()` matches on scale degree alone, which would have claimed A minor belongs to
D major (where the fifth degree is A *major*). Matching quality too gives a clean result,
verified exhaustively across all 12 roots:

- **every major and minor triad is diatonic in exactly 3 major keys**
- **every diminished triad in exactly 1**

Spot checks: `Am` → vi/C, ii/G, iii/F · `C` → I/C, IV/G, V/F · `B°` → vii°/C only.
`Am` correctly refuses D major.

### `foldDistances()` — BFS over the 30-edge graph

From face C: G, D, A, E, B at **1 fold**; F♯, A♭, E♭, D♭, B♭ at **2**; and **F at 3** —
the farthest key on the solid. The subdominant is three folds away while the tritone is
two. That is the irregular geometry from the discovery plan showing up as a concrete,
usable fact.

Distances are measured from wherever you are standing, so they update as you move.
The same `Am` card, before and after folding C → G:

| | standing on C | standing on G |
|---|---|---|
| vi in C | current key | already open |
| ii in G | 1 fold away | current key |
| iii in F | 3 folds | **2 folds** |

### One design bug caught in testing

`is-current` initially compared against the key the chord was *played in* rather than the
key you are standing in now. That made the whole band meaningless after a modulation — the
point is which doors are near **you**, so it now tests `curKey`.

Transposition is handled: at +2 the card reads `Bm` / `B · D · F♯` with keys D, A, G and
the roman numerals unchanged, because transposing preserves function.

### Verified

Card lifecycle: closes on backdrop tap, on `✕ Remove` of the chord it describes (with the
index shifted correctly for removals beneath it), and on `resetAll()`. Re-renders on
transpose. Selection survives closing. All rows 44 px.

Regression: `Stop All` still cuts 60 voices and four transports to zero; all five panes
still build; chart export unchanged. `music-theory-tests.js` **103 passed, 0 failed.**
No JS errors.

---

## Shipped — Chord card, Movement band (Tier 3, 2026-08-20)

Sits above "also reads as", because how a chord connects to its neighbours matters
more to someone holding an instrument than where else it could go.

```
Am
A · C · E — minor triad

MOVEMENT
 ← from C    root down a minor 3rd
             2 common tones (C, E) · 2 semitones of voice motion
 → to F      root down a major 3rd
             2 common tones (A, C) · 1 semitone of voice motion

ALSO READS AS
 vi   in C major    current key
 ...
```

### Three primitives, unit-checked against hand-worked cases

**`rootMotion()`** names motion by the smaller interval, the way a player would —
`C→G` is "down a perfect 4th", not "up a 5th"; past the tritone it flips direction.

| | C→F | C→G | C→A | C→E | C→F♯ | C→B |
|---|---|---|---|---|---|---|
| | up P4 | down P4 | down m3 | up M3 | tritone | down m2 |

**`commonTones()`** — the notes you do *not* have to move. Verified:
`F→Am` 2 (A, C) · `C→Am` 2 (C, E) · `C→G` 1 (G) · `C→Em` 2 (E, G) ·
`C→F♯` 0 · `C→Dm` 0 · `C→C` 3.

**`cadenceBetween()`** mirrors `computeCadenceLog()` for a single transition, and the
card reports whether the cadence lands *arriving here* or *into the next chord*.
A trailing `V` gets the Half cadence.

Worked example, `C Am F G C` — every figure confirmed by hand:

| chord | to | motion | common | semitones |
|---|---|---|---|---|
| C | Am | down m3 | C, E | 2 (G→A) |
| Am | F | down M3 | A, C | **1** (E→F) |
| F | G | up M2 | none | 6 (2+2+2) |
| G | C | up P4 | G | 3 (B→C, D→E) |

`G` also reports **Authentic cadence · into the next chord**, and the final `C` reports
the same cadence *arriving here*.

The pivot chip reads correctly too: symbol `C`, roman `I→IV`, `← from G` 1 common tone,
`→ to C` same root / 3 common tones / **0 semitones** — the chord repeating across the
modulation, which is exactly what a pivot is.

### Two bugs fixed along the way

1. **`voiceLeadCost()` was reading the Learn pane's voice-count selector.** `C→G` came
   back as 3, 4 or 5 semitones depending on a 3/4/5 control on a different screen. The
   ledger stores triads, so `triadVoiceCost()` now pins the measurement to three voices
   and restores the caller's setting. Verified stable across the selector.
2. **`??` precedence dropped the transpose.** Nine sites share the idiom
   `KS[x]??0+globalOffset+120`, which parses as `KS[x] ?? (0+globalOffset+120)` — so
   `globalOffset` is discarded. Seven of them compare two values that *both* discard it,
   so the interval stays correct and adding parentheses there would introduce an
   asymmetry against `tonicAnchor.semi` and break the scoring. The two that render note
   *names* were visibly wrong (the PLR strip showed untransposed roots at any non-zero
   offset) and now use `displayNote()`. **The other seven are left deliberately — noted
   here so the idiom is not "tidied" into a regression later.**

### Verified

Layout at 375 × 812: bottom bar 249 px, canvas 310 px. Card content fits without
scrolling. `Stop All` cuts 48 voices and four transports to zero. All five panes build.
Chart export unchanged. `music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

---

## Shipped — Chord card, "Instead, try" band (Tier 5, 2026-08-20)

The card is now complete at three bands: **Movement · Also reads as · Instead, try.**

Substitutions are **sorted smoothest first** — most shared notes, then least voice
motion — because that ordering answers the actual question: what can I swap in without
disturbing everything around it. Rows are tappable to audition and never touch the
ledger. Diatonic results carry an `in key` badge with their roman numeral.

For `Am` in C:

```
INSTEAD, TRY
 A      parallel — flip major/minor              2 shared · 1 st
 F      leading-tone exchange      [IV in key]   2 shared · 1 st
 C      relative major/minor       [I in key]    2 shared · 2 st
 C♯m    chromatic mediant                        1 shared · 2 st
 Fm     chromatic mediant                        1 shared · 2 st
 E      its own dominant — approach              1 shared · 2 st
 Cm     chromatic mediant                        1 shared · 3 st
 F♯m    chromatic mediant                        1 shared · 3 st
```

### Three families, none of which a diatonic palette offers

| Family | Rule | Why it earns a row |
|---|---|---|
| **P / L / R** | the neo-Riemannian moves | each shifts exactly one note — the smoothest swaps that exist |
| **Chromatic mediants** | thirds away with the quality *kept* | the gap functional theory has no slot for |
| **Functional** | tritone sub (major only); the chord's own V | reharmonisation and approach chords |

All nine `C major` substitutions were verified by hand, including the tritone sub
`F♯` at 0 shared notes and 6 semitones (C→C♯, E→F♯, G→A♯) and both `G♯`/`D♯`
chromatic mediants at 1 shared note.

### The diminished case needed its own branch

`computePLR` is defined on consonant triads only, so a diminished chord fell through the
whole block and produced a single, near-useless row. But a diminished triad has good
substitutions once you treat it as what it is — a dominant seventh with the root missing:

- **parent dominant**, the major triad a major third below: `B°` → `G`, sharing B and D
  (because `G7` = G B D F contains all of B D F)
- **the diminished cycle**, minor-third transpositions: `D°`, `G♯°`, `F°`, each sharing
  two notes

`B°` now returns four genuinely usable options instead of one.

### Verified

Every chord in a five-chord progression plus a `vii°` opens a complete card with no
errors. Row counts behave correctly at the edges: the first chord shows one movement row
instead of two, and `B°` shows a single reading (diminished triads belong to one key) with
four substitutions. Transposing +3 while open re-labels `B°` → `D°` with parent dominant
`A♯`. Tapping a substitution auditions it and leaves the ledger untouched.

Regression: `Stop All` cuts 38 voices and all transports to zero; all five panes build;
layout 249 px bottom bar / 310 px canvas; chart export unchanged.
`music-theory-tests.js` **103 passed, 0 failed.**

---

## Shipped — Replace from the card (2026-08-20)

The "Instead, try" band can now **swap the chord in the ledger** for one of its
substitutions. Audition and commit stay separate so browsing never edits the progression:

1. Tap a row → highlights it and auditions the chord. Ledger untouched.
2. The highlighted row reveals **`⇄ Replace`**. Tapping that commits the swap.
3. Tapping the highlighted row again clears it.

After a swap the card rebuilds around the *new* chord, so all three bands update, and
the highlight clears. `Am → C♯m` reports `Am → C♯m · ♭ii in C`.

`replaceLedgerChord()` also keeps the surrounding state honest: the roman is recomputed
in the entry's own key, the Neighbours strip and `lastChord` follow if the swapped chord
was the last one, and the genre tints and voice-leading dots refresh.

### Three subtleties that needed correcting

1. **The tonic anchor followed the wrong chord.** All consonance percentages are measured
   against `tonicAnchor`, and I first tested for it with "is this the first chord entry".
   But ignition writes `ledger[0]` *without* setting `tonicAnchor` — the anchor is set by
   the first chord played through `playPlanar`. Swapping entry 0 therefore moved an anchor
   that entry 0 never owned. Now matched by content: the anchor follows only when the
   chord being replaced actually is the anchor. Verified a non-anchor swap leaves it alone.

2. **Pivot demotion used a quality-blind test.** `romanInKey()` matches on scale degree
   alone, so it reported C minor as "IV in G" — right degree, but C minor is not in
   G major. A swap to `Cm` stayed labelled a pivot. Added `isDiatonicIn(note,qual,key)`
   and the entry now demotes to a plain chord when the replacement is not genuinely common
   to both keys. Spot-checked: `Cm` in G false, `C` in G true, `Am` in C true,
   `A` in D true, `Am` in D false.

3. **Demotion was one-way.** Deleting `destKey` on demotion meant swapping to a
   non-common chord and back again lost the pivot annotation permanently. `destKey` is now
   retained while demoted and pivot status is **re-derived on every swap**:

```
C(I→IV)*            pivot
  → swap Cm         Cm(i)              demoted, keymod intact
  → swap Am         Am(vi→ii)*         pivot restored, dual reading correct
```

The chart export follows: the `>> pivot on Am (vi in C = ii in G)` line disappears on
demotion and returns on restoration.

---

## Still to build

- **Tier 2** — function group, degree name, borrowed/secondary classification, consonance
  percentage. Deliberately last: it mostly restates what the roman numeral already says.
- Fretboard / keyboard buttons in the card (`drawGuitar` / `drawPiano` already exist).
- Chart footer extras.

≈ 2 hr. The card's three shipped bands cover what a player needs; Tier 2 is polish.
The more valuable next move is the **Neighbour Chords strip** from
[[🎼 James Ladder — Discovery Tool Design]], which puts `chordSubstitutions()` on the
Play screen so these options are reachable while composing rather than only on inspection.

---

*James' Ladder — Ledger Readability & Chord Analysis*
*2026-08-20 · Steps 1–3 shipped and verified; chord card next*
