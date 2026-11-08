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
| **Learn** | Ear drills (chords, intervals, cadences) with replay · Voicing (smoothest voice leading, applied to your chords) · Guitar and Keyboard (any scale, or a chord from your progression; tap to hear) |

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

## Sketches — your work is saved as you go

- Everything on Play and Rhythm is a **sketch**: the chords, key changes, keys opened on the
  solid, capo, tempo, chord length and the drum beat. It saves itself every second it changes,
  and again when the app is put away, so closing or reloading never loses an idea.
- **▤ Sketches** (end of the ledger buttons, or ⚙ Settings) lists them, newest first. Tap one to
  reopen it; name it; **＋ New sketch** starts fresh (keeping the beat and tempo);
  **⧉ Duplicate** branches a variation; ✕ twice deletes.
- Sketches live on this device only (browser / app storage). Nothing is uploaded.

## Instruments — Synth, Piano, Guitar, Nylon

- Pick one on **Sound → Instrument**, or tap **♪** in the ledger buttons to cycle through them.
  Each sketch remembers its instrument.
- **Piano** and the two **guitars** are recordings (one every few semitones, re-pitched to fill the
  gaps), so chords, ▶ Play, ⟳ Loop, Rhythm's ＋ Chords, ear drills and Voicing all sound real.
- Guitars play the chord **shapes a guitarist would use** (open chords, otherwise E- or A-shape
  barres) and strum low to high; the *Pulse* figure alternates down and up strums.
- In Learn, the **Guitar** tab always sounds like a guitar and the **Keyboard** tab like a piano.
- Each set (1–2 MB) downloads the first time it's chosen and is then cached for offline use, in a
  cache that survives app updates. The synth plays until it's ready. Soft Tone rounds samples off
  too. Credits and licences: [samples/CREDITS.txt](samples/CREDITS.txt) and the privacy page.

## Offline and privacy

- Three.js (`vendor/`) and the fonts (`fonts/`, SIL OFL) ship with the app, so it starts with no
  connection and contacts no other server. The service worker precaches every file.
- `viewport-fit=cover` plus safe-area insets keep the bars clear of the notch and home bar, so the
  same files work inside an App Store / Play Store wrapper.
- [privacy.html](privacy.html) is the privacy policy and support page the stores ask for.

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
