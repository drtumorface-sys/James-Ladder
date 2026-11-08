# James' Ladder v15

A syncretic 3D harmonic instrument. Dodecahedral geometry maps the Circle of Fifths. Every chord you place materialises a pentagon face. The structure of the song is the structure of the solid.

## Architecture

| Layer | Description |
|-------|-------------|
| Geometry | `THREE.DodecahedronGeometry` → buffer extraction → Gram-Schmidt angular sort → 12 planar pentagons |
| Spatial | BFS face→key mapping, geometric adjacency, persistent bubble nodes, floating centroid signifiers |
| Temporal | Drum machine: 8 synthesised drums × 16 steps, accents, swing, 4/4 · 3/4 · 5/8 · 7/8, per-drum loop lengths (true polyrhythm). One clock shared with the ledger loop |
| Harmonic | 480-candidate consonance matrix, Harmonic Cloud H, Pitch Wheel (Shoelace area metric) |
| Audio | Three buses: Drums (synthesised kit → lowpass → limiter) + Chords (LP 1800Hz, all pitched material) + Metronome (independent). ADSR envelopes. Global stop cancels queued phrases and cuts scheduled voices. |
| Analysis | Reads the ledger in key areas (split at key changes, relative minor recognised), duration-weighted scale fit, cadences, key-aware rule check, Tonnetz, generators, capo (global chromatic offset) |

## Navigation

Five screens, one row of tabs at the bottom. No overlay menu.

| Tab | Contains |
|-----|----------|
| **Play** | The dodecahedron, chord pills, ledger — the composing surface |
| **Rhythm** | Drum machine — 8 drums, pattern library, tempo, swing, meter, per-drum loops; ＋ Chords plays your progression with the beat |
| **Sound** | Every audio control: Stop All, tempo, tap, metronome, mixer, drone, tone, practice timer |
| **Analysis** | Five tabs — **Progression** (key areas, Roman numerals, cadences, how each key change happens, rule check, style fit) · **Scales** (best-fit scales per key area, notes used, pitch wheel) · **Tonnetz** · **Generate** (adds whole phrases; one Undo removes them) · **Pitch** (capo, session presets, CSV/JSON export) |
| **Learn** | Ear, voice leading, cadences, fretboard, keyboard, degrees |

**■ Stop** sits in the top bar on every screen. It cancels queued phrases and cuts
every scheduled voice, not just the transports — a 30-second progression already
committed to the audio clock stops immediately.

## Controls

- **Double-tap** the wireframe → opens your first key
- **Bubble nodes** → play chord, prime modulation state
- **Ghost faces** → tap to fold dodecahedron into adjacent key
- **Drums** level → the drum machine (default 0.7)
- **Chords** level → all pitched material — chords, bubbles, ⟳ Loop, ledger (default 0.7)
- **Metronome** level → metronome click, independent utility level (default 0.55)
- **Pinch / scroll wheel** → zoom

> Pitched material never rides the Drums bus, and Soft Tone no longer mutes it: it rounds the
> drums off with a lowpass instead, so a gentle session still has a beat.

## Rhythm — drum machine

- **Tap a step** to cycle it: on → accent → off. On phones, pick a drum from the overview and
  edit its 16 steps as a 4×4 pad grid (one row per beat).
- **Loop length per drum** — shorter than the bar and it drifts against the others
  (a 3-step rim against a 16-step kick lines up again every 3 bars).
- **＋ Chords** — ▶ also plays the ledger progression, on the same clock, so chords and drums
  land together. The *Drum-locked* rhythm generator times chord changes to the kick.
- The beat is saved in the browser on this device.

## Session Presets

Open Analysis → Pitch for:
- **Soft Tone** — LP fc↓1200Hz, Q=1.2, drums rounded off (lowpass 3.5 kHz)
- **First Session preset** — C Major, BPM 72, sparse offbeat rhythm
- **Rhythm presets** — sparse Fibonacci and golden-angle drum patterns, loaded into the drum machine
- Functional colour map with consistent emotional anchors

## Pedagogical Levels

| Level | Behaviour |
|-------|-----------|
| I — Planar | Play chords freely within one key. No geometry folds. |
| II — Spatial | Play a chord, then tap a ghost face to modulate. Pivot chord evaluated in both keys. |
| III — Free | Every chord tap plays and immediately materialises the next adjacent face. |
