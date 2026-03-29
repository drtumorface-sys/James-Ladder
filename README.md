# James' Ladder v15

A syncretic 3D harmonic instrument. Dodecahedral geometry maps the Circle of Fifths. Every chord you place materialises a pentagon face. The structure of the song is the structure of the solid.

## Deploy to GitHub Pages (5 steps)

1. Create a new repository named `james-ladder`
2. Upload these four files to the root:
   - `index.html` → rename `james_ladder_v15.html` to `index.html`
   - `manifest.json`
   - `sw.js`
   - (optional) `icon.png` — 512×512px app icon
3. Go to **Settings → Pages**
4. Set Source to **Deploy from a branch**, select `main`, folder `/root`
5. Live at `https://[username].github.io/james-ladder/`

## Architecture

| Layer | Description |
|-------|-------------|
| Geometry | `THREE.DodecahedronGeometry` → buffer extraction → Gram-Schmidt angular sort → 12 planar pentagons |
| Spatial | BFS face→key mapping, geometric adjacency, persistent bubble nodes, floating centroid signifiers |
| Temporal | 16-step sequencer, polyrhythmic per-row cycle lengths, grid-gated ledger loop |
| Harmonic | 480-candidate consonance matrix, Harmonic Cloud H, Pitch Constellation (Shoelace area metric) |
| Audio | Dual-chain: γR (HP 1200Hz, rhythmic) + γH (LP 1800Hz, harmonic). ADSR envelopes. |
| Grimoire | Plasma Transposer (global chromatic offset), Cloud, Scales, Ledger, Sensory Preset |

## Controls

- **Double-tap** the wireframe → Primary Ignition (opens first tonal center)
- **Bubble nodes** → play chord, prime modulation state
- **Ghost faces** → tap to fold dodecahedron into adjacent key
- **γR slider** → rhythmic bus volume (sequencer + click, default 0)
- **γH slider** → harmonic bus volume (chords + loop, default 0.7)
- **Pinch / scroll wheel** → zoom

## Sensory Preset

Open the Grimoire → Sensory tab for:
- **Soft Mode** — LP fc↓1200Hz, Q=1.2, γR→0 (removes harsh transients)
- **First Session preset** — C Major, BPM 72, Fibonacci rhythm scaffold
- **Fibonacci Pattern** — natural rhythms based on F(n) sequence
- Functional colour map with consistent emotional anchors

## Pedagogical Levels

| Level | Behaviour |
|-------|-----------|
| I — Planar | Play chords freely within one key. No geometry folds. |
| II — Spatial | Play a chord, then tap a ghost face to modulate. Pivot chord evaluated in both keys. |
| III — Free | Every chord tap plays and immediately materialises the next adjacent face. |
