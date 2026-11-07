# James' Ladder v15

A syncretic 3D harmonic instrument. Dodecahedral geometry maps the Circle of Fifths. Every chord you place materialises a pentagon face. The structure of the song is the structure of the solid.

## Architecture

| Layer | Description |
|-------|-------------|
| Geometry | `THREE.DodecahedronGeometry` → buffer extraction → Gram-Schmidt angular sort → 12 planar pentagons |
| Spatial | BFS face→key mapping, geometric adjacency, persistent bubble nodes, floating centroid signifiers |
| Temporal | 16-step sequencer, polyrhythmic per-row cycle lengths, grid-gated ledger loop |
| Harmonic | 480-candidate consonance matrix, Harmonic Cloud H, Pitch Wheel (Shoelace area metric) |
| Audio | Three buses: Percussion (HP 1200Hz, transients) + Chords (LP 1800Hz, all pitched material) + Metronome (independent). ADSR envelopes. Global stop cancels queued phrases and cuts scheduled voices. |
| Analysis | Transpose (global chromatic offset), Cloud, Scales, Ledger, Presets, Harmony Check, Tonnetz |

## Navigation

Five screens, one row of tabs at the bottom. No overlay menu.

| Tab | Contains |
|-----|----------|
| **Play** | The dodecahedron, chord pills, ledger — the composing surface |
| **Rhythm** | Step sequencer, polyrhythm, pattern library, pitch wheel |
| **Sound** | Every audio control: Stop All, tempo, tap, metronome, mixer, drone, tone, practice timer |
| **Analysis** | Transpose, harmonic cloud, scale matrix, ledger, presets, Harmony Check, Tonnetz |
| **Learn** | Ear, voice leading, cadences, fretboard, keyboard, degrees |

**■ Stop** sits in the top bar on every screen. It cancels queued phrases and cuts
every scheduled voice, not just the transports — a 30-second progression already
committed to the audio clock stops immediately.

## Controls

- **Double-tap** the wireframe → opens your first key
- **Bubble nodes** → play chord, prime modulation state
- **Ghost faces** → tap to fold dodecahedron into adjacent key
- **Percussion** level → percussive transients only — the Rhythm-mode click (default 0; raised
  automatically to 0.45 when you switch into Rhythm mode, so the mode is never silent)
- **Chords** level → all pitched material — chords, bubbles, grid hits, ⟳ Loop, ledger (default 0.7)
- **Metronome** level → metronome click, independent utility level (default 0.55)
- **Pinch / scroll wheel** → zoom

> Pitched material never rides the Percussion bus. Sending grid chords through a bus that defaults to
> zero made **⟳ Loop and the entire sequencer silent on first run** — and made the
> "First Session" preset, which zeroes it via Soft Tone, guarantee a silent grid.
> Soft Tone still kills harsh transients; it no longer kills the harmony with them.

## Session Presets

Open Analysis → Presets for:
- **Soft Tone** — LP fc↓1200Hz, Q=1.2, percussion→0 (removes harsh transients)
- **First Session preset** — C Major, BPM 72, sparse offbeat rhythm
- **Rhythm presets** — evenly spread, easy-to-follow onset patterns
- Functional colour map with consistent emotional anchors

## Pedagogical Levels

| Level | Behaviour |
|-------|-----------|
| I — Planar | Play chords freely within one key. No geometry folds. |
| II — Spatial | Play a chord, then tap a ghost face to modulate. Pivot chord evaluated in both keys. |
| III — Free | Every chord tap plays and immediately materialises the next adjacent face. |
