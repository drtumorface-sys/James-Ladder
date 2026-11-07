---
title: James' Ladder — Discovery Tool Design
subtitle: What the app is uniquely good at, where overlooked harmony and rhythm hide, and the build order to reach it
date: 2026-08-20
status: proposal — awaiting go-ahead
type: development-plan
tags: [james-ladder, harmony, rhythm, discovery, design]
---

# James' Ladder as a Discovery Tool

Companion to [[🥁 James Ladder — Chord Rhythm & Progression Plan]]. That document
audits what is broken. This one asks a different question: **what is this app
positioned to find that other tools won't?** — and what to build to make it do that.

---

## Part 1 — The honest differentiators

Seven things this app has that a DAW, Scaler, Hookpad or Chordbot does not:

### 1. Modulation is a constrained graph walk, not a dropdown

Each of the 12 faces has **exactly 5 neighbours** in a fixed 30-edge graph. You cannot
modulate anywhere you like — you must cross an edge that exists. Measured distribution
of all 60 directed edges, in Circle-of-Fifths steps:

| CoF distance | 1 (fifth) | 2 | 3 | 4 | 5 | 6 (tritone) |
|---|---|---|---|---|---|---|
| edges | 18 | 8 | 6 | 8 | 12 | **8** |

Only 30% of available modulations are the obvious fifth. **Eight edges are tritone
relations.** The geometry actively pushes you toward distant keys you would never pick
off a list. This is the single most distinctive thing the app does.

> **Correction to the README:** it claims "Dodecahedral geometry maps the Circle of
> Fifths." That is loose. The BFS face→key assignment does not produce a consistent
> CoF embedding — C's neighbours happen to be G D A E B (steps 1–5), but G's are
> C F♯ D B D♭ (steps 1, 5, 1, 4, 6). It is a fixed irregular relation graph over the
> 12 keys. For *discovery* that is better than a clean circle. But it should be
> described accurately.

### 2. Pivot-chord dual reading is already computed

`modulate()` re-labels the departing chord with its function in **both** keys
(`roman` + `romanInDest`). Reading one chord two ways is the core skill of modulation,
and the app calculates it silently on every fold without ever showing you the
alternatives beforehand.

### 3. Neo-Riemannian PLR with a shortest-path finder

`plrP/L/R`, `plrDist`, `plrShortestPath`. Chord relationships by **voice-leading
parsimony** rather than by harmonic function. This is the machinery that reaches
chromatic mediants, which functional thinking has no slot for.

### 4. Dijkstra voice leading over real voicings

3, 4 or 5 voices, bounded to a MIDI range, minimising total semitone motion across the
whole progression. Genuinely rare in a phone-sized tool.

### 5. Consonance ranking of your material against 35+ scales

480-candidate matrix. Give it what you played and it tells you which scale fits best —
which may not be the one you thought you were in.

### 6. Per-lane polyrhythm cycle lengths

Each of the 5 grid rows takes an independent cycle length from {3,4,5,6,7,8,12,16} plus
a phase offset. Almost no mainstream tool exposes this.

### 7. Correct Euclidean rhythm generation

Verified Bjorklund implementation, plus 19 hand-entered world patterns (Afro-Cuban,
Brazilian, West African, funk, odd meters).

---

## What it is *not*, and shouldn't try to be

- **Not a DAW.** No recording, tracks, mixing, plugins, automation.
- **No MIDI export and no MIDI out.** This is the biggest practical gap. You can
  discover something excellent and have no way to get it into anything else. Export is
  CSV/JSON to clipboard, and both **drop rhythm and voicing entirely.**
- **Triads only** — maj, min, dim. No 7ths in the ledger, no aug, no sus. `chordPCs`
  silently returns a minor triad for any quality it doesn't know.
- **Sketchpad sound.** Three triangle oscillators plus a doubled bass root.

**So position it as an idea generator and practice instrument whose output you take
elsewhere.** That single decision reorders the priorities below: export stops being a
nice-to-have and becomes load-bearing.

---

## Part 2 — Where overlooked material actually hides

### Harmony

| Blind spot | Why it gets missed | Asset that reaches it |
|---|---|---|
| **Chromatic mediants** (I→♭VI, I→III, I→♭III) | not diatonic, not secondary dominants — functional theory has no slot | PLR L and R moves |
| **Common-tone modulation to distant keys** | nobody *chooses* C→F♯; a shared chord makes it smooth | the 8 tritone edges + `romanInKey` |
| **Modal reinterpretation of your own loop** | nobody re-reads their material against 35 scales | consonance matrix |
| **Unused chords of a better-fitting scale** | you found Lydian Dominant fits, but only played 4 of its 7 triads | scale matrix ∆ harmonic cloud |
| **Voice-leading-first progressions** | everyone picks chords then voices them, never the reverse | Dijkstra VL, inverted |
| **Non-authentic cadences** | V–I dominates by habit | cadence log already classifies 5 types |

### Rhythm

| Blind spot | Why it gets missed | Asset |
|---|---|---|
| **Harmony and rhythm on different periods** | DAWs default every lane to the bar | per-row cycle length + new chord cycle |
| **Non-isochronous chord durations** | grid tools make every chord equal | new chord rhythm track |
| **Odd and additive meters** (5/8, 7/8, 9/8) | need explicit support; the app's are fake | `rowLen` + new meter control |
| **Euclidean k/n at non-obvious values** | E(5,16), E(7,16) are great and nobody tries them | already there, buried |
| **Phase offset as a compositional device** | shifting one lane by 3 steps transforms a pattern | `rowOffset` exists, buried |

---

## Part 3 — Eight use cases, and the feature for each

### A · "I'm stuck on I–V–vi–IV" → **Neighbour Chords** strip

On the Play screen, for whatever chord you just played, show its P / L / R
transformations plus its chromatic mediants. Each labelled with **common tones** and
**voice-motion cost in semitones**. Tap to hear, `+` to add.

*Exists:* `computePLR`, `plrP/L/R`, `plrDist`, `voiceLeadCost`, and a `#plr-row` that is
`display:none` by default and only ever shows P/L/R.
*New:* common-tone counts, the chromatic-mediant set, 44 px targets, add-to-ledger.

**Why it finds things:** `C → E minor` (L) and `C → A♭` (chromatic mediant) share two
and one common tones respectively. Neither appears anywhere in a diatonic chord palette.

---

### B · "What did I actually just play?" → **Reinterpret** card

Show the best-fitting scale, then — the part that matters — **the triads of that scale
you have not yet used.**

*Exists:* `getTopScale`, `computeHarmonicCloud`, `consonanceScore`, `CANDIDATE_SCALES`.
*New:* diff the played chord set against the scale's diatonic triads; render the unused
ones as playable pills.

**Why it finds things:** the app can already tell you your loop is 94% Lydian Dominant.
It cannot yet tell you which three chords of that scale you're leaving on the table.

---

### C · "Give me something that barely moves" → **Smooth Loop** generator

Given a starting chord, a length, and a maximum per-voice motion budget (say ≤2
semitones), search for **closed** loops that minimise total voice motion. Ignores
harmonic function completely.

*Exists:* `generateVoicings`, `voicingAssign`, `dijkstraVL`, `voiceLeadCost`.
*New:* beam search over the 24 major/minor triads with a closed-loop constraint.

**Why it finds things:** this is how ambient and film harmony is actually built, and it
is the exact inverse of every generator currently in the app — all five existing styles
are function-driven and all end V–I.

---

### D · "Modulate somewhere I wouldn't have chosen" → **Pivot Finder**

Before you fold, show all 5 adjacent faces and what your current chord *becomes* in
each. Rank by smoothness. Add a **common-chord-only** filter — the textbook technique.

*Exists:* `romanInKey`, `ADJ`, `getAvailable`, `modulate` (computes this after the fact).
*New:* preview UI, ranking, filter.

**Why it finds things:** this turns the tritone edges from an oddity into a tool. Your
A minor is `vi` in C, `iii` in F, `ii` in G — and the app already knows.

---

### E · **Chord Rhythm Track** + polymeter readout

The strip from the other plan, plus a chord-cycle length **independent** of the grid
cycle, plus a composite-period readout: *"5 chords × 3-step lane → repeats every 15
steps."*

*Exists:* `rowLen`, `rowOffset`, `ledgerSpread`.
*New:* per-chord `beats`, the strip, the lcm readout.

**Why it finds things:** that readout is the discovery instrument. It tells you when
you've built something that does not loop trivially — which is the whole point.

---

### F · **Real time signatures**

3/4, 5/4, 6/8, 5/8, 7/8, 9/8, 12/8 — setting both step count and `rowLen`.

*New:* meter control; and fix `loadPat` so the named patterns stop lying (`Waltz 3/4`
currently loops as 4/4 with a silent fourth beat).

---

### G · **Rhythm from harmony** — tension-driven durations

Consonant chords get length, dissonant chords get brevity and become passing motion.
Plus a cadence-weighted variant.

*Exists:* `chordConsScore`, `computeCadenceLog`, `renderTensionArc` — all of it.
*New:* the mapping from score to duration.

---

### H · **Get it out** — MIDI export + progression library

A real `.mid` file carrying the actual voicings and rhythm. Plus localStorage slots so
you can keep and A/B two ideas.

*Exists:* MIDI note numbers throughout the voice-leading engine; `exportJSON`.
*New:* a Standard MIDI File writer (~80 lines, no dependencies); the library.

**Why it matters most:** every other item on this list produces something you currently
cannot remove from the app.

---

## Part 4 — Build order

The dependency spine is the schema. Rhythm, voicing and MIDI export all read from the
ledger entry, so it goes first.

### Stage 1 — Foundation · ~1.5 hr
1. Ledger schema: `beats`, `figure`, `accent`, `voicing`, `ext` — all optional, absent
   fields fall back to today's globals.
2. `commitVLToLedger()` writes `voicing` instead of discarding it.

### Stage 2 — Discovery on the Play screen · ~3 hr
Highest value per hour, and it adds **no new screens**.
3. Neighbour Chords strip (A)
4. Pivot Finder (D)

### Stage 3 — Rhythm · ~5 hr
5. Chord Rhythm Track + polymeter readout (E)
6. Real time signatures (F)
7. Duration generators, including tension-driven (G)

### Stage 4 — Generation and re-reading · ~3.5 hr
8. Smooth Loop generator (C)
9. Reinterpret card (B)

### Stage 5 — Get it out · ~3 hr
10. MIDI file export (H)
11. Progression library, 8 slots (H)

**Total ≈ 16 hours.** Stages are independently shippable in order.

### Carried over, now homeless
Phase 4 of the other plan (reclaiming 84 px from the 156 px top bar) was going to move
Level / Guide / Fold / Auto-rotate **into** the mode overlay — which no longer exists.
They need a new home: either a small overflow sheet on Play, or Level moves inline and
the rest go to Sound/Analysis.

---

---

## Shipped — Use case A · Neighbour Chords strip (2026-08-20)

The hidden three-button PLR row is now a **Neighbours strip** on the Play screen, driven
by `chordSubstitutions()` (built for the chord card, reused here unchanged).

```
Next   C  │ Cm    Em    Am    E     G♯    D♯    A     G     F♯
          │ P·2   L·2   R·2   med·1 med·1 med·1 med·1 V/·1  tri·0
```

Each pill is the chord symbol over a short kind code and its **common-tone count** with
the source chord. Sorted smoothest first — most shared notes, then least voice motion —
so at 375 px the **five immediately reachable pills are P, L, R and the two closest
chromatic mediants**, with the rest a swipe away. Consonance percentage, shared note
names, semitone cost and the in-key roman all live in the tooltip rather than cluttering
the pill.

### It is walkable, which is the point

Tapping goes through `playPlanar()` exactly like a chord pill, so a neighbour is played
**and logged**, and the strip immediately reloads around the new chord. Verified chaining
five taps deep: `C → Cm (P) → G♯ (L) → Cm (L) → G♯ …` — each tap opens a fresh set.

That is the escape from functional gravity this plan asked for: the diatonic palette above
can only ever offer seven triads plus two collapsed substitution rows, and no amount of
tapping it reaches `G♯` from `C`.

### Three fixes it surfaced

1. **Ignition left the strip empty.** `onIgnition()` writes its chord straight into the
   ledger without going through `playPlanar()`, so no neighbours appeared until the first
   chord-pill tap. It now populates the strip, making the feature available from the very
   first chord.
2. **`undoLast()` never refreshed the strip**, so after an undo it kept offering
   neighbours of a chord no longer in the ledger. Traced through both removal paths:
   `G → F → F → Am` now follows correctly.
3. **Status lines still used the old `VI·A` format.** Now `A — VI in C`, matching the
   chord-symbol convention used everywhere else.

### Verified

9 pills for a major triad, 8 for minor, 4 for diminished. All 44 px. Row is a single
44 px scrolling line with no page-level overflow. Works at all three pedagogy levels.
Hidden until a chord exists; hidden again by reset. Layout 272 px bottom bar / 286 px
canvas at 375 × 812. Chord card unaffected — still three bands.
`music-theory-tests.js` **103 passed, 0 failed.** No JS errors.

**Use case A is done.** Remaining from Part 3: B (Reinterpret), C (Smooth Loop),
D (Pivot Finder), E–G (rhythm), H (MIDI export + library). D is now cheap — it shares
`foldDistances()` and `chordReadings()` with the card's "also reads as" band.

---

## What I deliberately would *not* build

- **7th chords and extensions in the ledger.** Three lines in `chordPCs`, but the
  consonance matrix, harmonic cloud, Tonnetz, PLR engine, Harmony Check scoring and all
  103 tests assume triads. It's a project, not a feature.
- **Audio export / recording.** Wrong tool. MIDI export covers the real need.
- **More generators of the kind that already exist.** There are five function-driven
  ones ending V–I. A sixth adds nothing; the Smooth Loop generator is valuable precisely
  because it is not one of those.
- **Microtonality, alternate temperaments.** The geometry is 12-TET throughout.

---

*James' Ladder — Discovery Tool Design*
*2026-08-20 · adjacency distribution measured over all 60 directed edges*
*Status: proposal — awaiting go-ahead on stage order*
