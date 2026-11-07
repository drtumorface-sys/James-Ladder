---
title: James' Ladder — Android UI & Functionality Plan
subtitle: Full audit of current breakage + implementation roadmap for mobile
date: 2026-04-05
status: active
type: development-plan
tags: [james-ladder, android, mobile, ui, pwa]
---

# James' Ladder — Android Development Plan

## Source Files

| File | Lines | Role |
|------|-------|------|
| `index.html` | 2819 | Primary app — v15 (most recent) |
| `james_ladder_v9.html` | 1897 | Older build — v9, for reference only |
| `sw.js` | 30 | Service worker — caches Three.js CDN + assets |
| `manifest.json` | 18 | PWA manifest — icon is an external CDN URL (broken offline) |

**Working base: `index.html`** — v9 is superseded. All work targets `index.html`.

---

## What the App Is

A 3D syncretic harmonic instrument built in a single HTML file. The geometry is a dodecahedron with 12 pentagonal faces — each face maps to a key on the Circle of Fifths. The user taps faces to materialise tonal centres. Two sliding panels:

- **Temporal Loom** (left, 320px) — BPM, 5×16 step sequencer, polyrhythm, pitch constellation
- **Grimoire** (right, 360px) — Plasma Transposer (chromatic offset), Harmonic Cloud, Consonance Matrix, Scale Advisor, Chord Ledger, Sensory Preset

Audio chain: two buses — `γR` (rhythmic, HP 1200Hz) and `γH` (harmonic, LP 1800Hz). Dual-chain triangle oscillators with ADSR envelopes. 480-candidate consonance scoring matrix. Three pedagogical levels.

---

## Audit — What Breaks on Android

### 1. Panel Width vs Screen Width *(Critical)*

The Grimoire panel is **360px wide**. The Loom panel is **320px wide**. On a typical Android device (360–412px viewport), a single panel occupies the full or near-full screen width. Both panels open simultaneously: `bot.style.left = 324px; bot.style.right = 364px` — the bottom bar collapses to a negative width, everything overlaps.

The canvas behind the panels remains full-screen (fixed, z=0) but is completely obscured by the panel.

**Impact:** Panels are unusable as side drawers on phones. One open = canvas gone.

---

### 2. Top Bar Overflow *(Critical)*

The `#bar` header contains nine interactive controls inline:

```
⊟ Loom | I·Planar | II·Spatial | III·Free | Guide | Manual | Auto⟳ | ⊞ Grimoire | ☀
```

At 360px viewport width with 20px side padding, all nine controls compete for 320px. At 8px font size they are already at the minimum readable threshold. On Android they will either:
- overflow and clip (the bar is `overflow:hidden` via `body{overflow:hidden}`), or
- compress below usable touch target size

The `#sub` sub-bar (level tag + status + face count) compounds this — text at 8px, `white-space:nowrap`, hidden by ellipsis.

**Impact:** Controls unreachable; level selector invisible; status line unreadable.

---

### 3. Bottom Bar Touch Target Sizes *(High)*

`#key-row`: 12 Circle of Fifths key buttons (`.ks`), each `padding:3px 9px` → ~24px tall.
`#chord-row`: up to 7 chord buttons (`.cp`), each `padding:5px 11px` → ~28px tall.
`#led-row`: Ledger row with Play/Loop/Undo buttons (`.pa`), `padding:4px 11px` → ~26px tall.

Android minimum touch target recommendation is **48×48dp**. All current targets are ~24–28px — half the minimum. On the canvas, bubble spheres are 28–50px diameter — similar problem for `.role-secondary` bubbles (28px).

**Impact:** Precision touch required on every interaction. Error rate will be high.

---

### 4. No Safe Area Insets *(High)*

No `env(safe-area-inset-*)` padding anywhere. On Android phones with navigation gesture bars:
- Bottom bar sits directly at the screen edge, under the system navigation region
- Top bar sits at top, potentially overlapping the status bar in standalone PWA mode

In standalone mode (`"display": "standalone"` in manifest), Android's gesture navigation bar eats ~48px at the bottom. The bottom bar controls become unreachable.

**Impact:** Bottom controls physically blocked by system UI.

---

### 5. Viewport Height Instability *(High)*

`html, body { height: 100% }` and the use of `innerHeight` throughout (raycasting, bubble positioning, signifier projection) are based on the initial viewport height. On Android Chrome, the address bar appears/disappears as the user scrolls (even when `overflow:hidden` — the bar still affects the visual viewport). This causes:
- Canvas height mismatch
- Bubble positions calculated against wrong height
- Three.js camera aspect ratio becomes stale

No `visualViewport` listener or `100dvh`/`100svh` fallback is present.

**Impact:** Bubbles misalign; canvas clips; signifiers drift from faces after bar toggles.

---

### 6. Double-Tap Ignition vs Browser Gestures *(Medium)*

Primary ignition fires on double-tap (`DBL_TAP_MS=320`). Android Chrome's default double-tap zoom was supposed to be disabled by `user-scalable=no` in the viewport meta, but:
- In standalone PWA mode, this often behaves differently
- Android 11+ Chrome removed support for `user-scalable=no` disabling the double-tap behaviour in some builds
- The 320ms threshold may race with system-level gesture recognisers

A custom pointer-events approach (`pointermove` / `pointerup` with `touch-action:none` on the canvas) is more reliable than mixing `touchstart/touchend` with `dblclick`.

**Impact:** Ignition may not fire reliably; or zooms the page on older Chrome.

---

### 7. Sequencer Grid Cell Size *(Medium)*

The sequencer grid uses `grid-template-columns: 28px repeat(16, 1fr)`. Inside the 320px Loom panel with 36px padding (18px each side), the 16 step columns share 256px → **16px per column**. The cells are 22px tall. A finger tip contact area (~10mm = ~38dp on hdpi Android) is more than twice the cell width.

**Impact:** Step cells cannot be reliably toggled on a phone. Adjacent cells fire.

---

### 8. AudioContext First-Touch Unlock *(Medium)*

`getAC()` lazily creates the `AudioContext` on first call. Web Audio policy on Android Chrome requires a user gesture before the context starts (state = 'suspended' until user interaction). The app calls `getAC()` in the audio chain but doesn't include a dedicated unlock gesture for the case where the context is created mid-session.

**Impact:** Audio may be silent on first chord tap if the context was created before a touch gesture hit `getAC()`.

---

### 9. Broken PWA Icon *(Low)*

`manifest.json` references:
```json
"src": "https://raw.githubusercontent.com/GoogleChromeLabs/pwacompat/master/test/icon-512.png"
```

This is an external URL to the GoogleChromeLabs test suite. It:
- Will not be cached by the service worker (sw.js only caches the app assets)
- Will show a broken icon on the Android home screen
- Displays an unrelated icon (pwacompat test asset)

**Impact:** Home screen icon is wrong or missing.

---

### 10. `onUp()` Guard Pixel Offsets *(Low)*

```javascript
if(grimoireOpen && x > innerWidth - 370) return;
if(loomOpen && x < 325) return;
```

These pixel guards block raycasting when the tap is inside a panel. On mobile, where panels will be full-width bottom sheets (not side drawers), these guards will either always block or never block depending on the new layout. They will need to change.

**Impact:** Ghost face taps inside mobile panel overlay silently blocked.

---

## Architecture Decision: Mobile Layout Strategy

### The Core Problem

Side-drawer panels work on ≥640px screens. On phones they consume the entire viewport. The right approach for a narrow screen music instrument:

**Panels become bottom sheets on mobile (< 640px breakpoint).**

This is the standard mobile music app pattern (GarageBand, Koala Sampler, Launchpad). The 3D canvas remains fully visible above the sheet. The sheet slides up to ~65vh, scrollable internally.

### Responsive Layout Diagram

**Desktop (≥640px) — unchanged:**
```
[═══════════ TOP BAR ═══════════════]
[══════ SUB BAR ════════════════════]
[Loom │                             │ Grimoire]
[panel│     THREE.js canvas         │ panel  ]
[     │                             │        ]
[═══════════ BOTTOM CONTROLS ═══════]
```

**Mobile (<640px) — new:**
```
[══ COMPACT TOP BAR ══════ ☰ ]
[                            ]
[    THREE.js canvas         ]
[    (full screen)           ]
[                            ]
[═══ BOTTOM SHELF ═══════════]
[  Keys (scroll) │ Chords   ]
[══ ▲ Loom  ▲ Grimoire ══════]
```

When Loom or Grimoire opens on mobile:
```
[                            ]
[  canvas (dimmed)           ]  ← tap backdrop to close
[                            ]
[════════════════════════════]
[  Loom / Grimoire           ]  ← slides up 65vh
[  (scrollable content)      ]
[                            ]
[════════════════════════════]
```

---

## Implementation Phases

### Phase 0 — PWA Completeness (30 min)

**0.1 — Fix manifest icon**
Replace external CDN URL with a local fallback icon. Can be a generated SVG data URI embedded directly or a small 192/512 PNG generated from the dodecahedron theme.

```json
"icons": [
  { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
]
```

**0.2 — Add fonts to SW cache**
Add the Google Fonts URLs to `ASSETS` in sw.js so the app renders correctly offline:
```javascript
'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Fira+Code:wght@300;400&display=swap'
```

**0.3 — Safe area insets in CSS**
```css
#bar  { padding-top:    max(0px, env(safe-area-inset-top)); }
#bot  { padding-bottom: max(10px, env(safe-area-inset-bottom)); }
```
Add to both the existing bar/bot rules.

**0.4 — Dynamic viewport height**
Replace `height:100%` on html/body with:
```css
html, body { height: 100svh; /* falls back to 100vh */ }
```
Add a `visualViewport resize` listener that updates `innerHeight`-dependent calculations (bubble positions, camera aspect).

---

### Phase 1 — Mobile Top Bar (1 hour)

The nine-control top bar needs to compress for narrow screens.

**Strategy: Two-tier responsive bar**

On mobile (<640px), collapse to:
```
[James' Ladder]          [Loom] [Grimoire] [☀] [⋮]
```

The `[⋮]` overflow menu contains: Level selector, Guide, Fold Mode, Auto-Rotate, Reset.

CSS approach: use `@media (max-width: 639px)` to hide/show elements:
```css
@media (max-width: 639px) {
  #lvl-seg  { display: none; } /* moved to overflow menu */
  #fold-mode-btn { display: none; }
  #btn-rot  { display: none; }
  .tb[onclick="toggleDrawer()"] { display: none; }
  #overflow-menu-btn { display: flex; }
}
```

Add an overflow menu `<div id="overflow-menu">` that slides down when `[⋮]` is tapped, containing:
- Level I / II / III radio buttons (larger targets)
- Guide link
- Fold Mode selector
- Auto-Rotate toggle

All overflow menu items get minimum 44px height.

---

### Phase 2 — Mobile Bottom Bar (1 hour)

**Strategy: Horizontally scrollable strips, larger targets**

The key row and chord row both become horizontally scrollable single-line strips:

```css
@media (max-width: 639px) {
  #key-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    padding-bottom: 4px;
  }
  .ks {
    flex-shrink: 0;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: start;
    font-size: 10px;
  }
  .cp {
    flex-shrink: 0;
    min-height: 44px;
    padding: 10px 16px;
    font-size: 10px;
  }
}
```

The ledger Play/Loop/Undo actions stack below as a separate `flex-wrap: wrap` row, each button minimum 44px height.

---

### Phase 3 — Panels as Bottom Sheets (2 hours)

This is the main structural change.

**3.1 — CSS media query: reposition panels**

```css
@media (max-width: 639px) {
  #grimoire {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;             /* collapsed */
    max-height: 70vh;
    border-left: none;
    border-top: 1px solid var(--glass-border);
    border-radius: 14px 14px 0 0;
    transform: translateY(100%);  /* slide up from bottom */
    transition: transform 0.38s cubic-bezier(0.16,1,0.3,1),
                height 0.38s;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
  }
  #grimoire.open {
    height: 70vh;
    transform: translateY(0);
  }
  #loom {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 0;
    max-height: 70vh;
    border-right: none;
    border-top: 1px solid var(--glass-border);
    border-radius: 14px 14px 0 0;
    transform: translateY(100%);
    transition: transform 0.38s cubic-bezier(0.16,1,0.3,1),
                height 0.38s;
  }
  #loom.open {
    height: 70vh;
    transform: translateY(0);
  }
}
```

**3.2 — Drag handle pill for bottom sheets**

Add a pill indicator inside each panel header on mobile (visible only on mobile):
```html
<div class="sheet-handle" aria-hidden="true"></div>
```
```css
@media (max-width: 639px) {
  .sheet-handle {
    width: 36px; height: 4px;
    background: var(--border2);
    border-radius: 2px;
    margin: 0 auto 12px;
  }
}
```

**3.3 — Backdrop overlay**

Add a backdrop div that appears behind the panel on mobile:
```html
<div id="panel-backdrop" onclick="closeAllPanels()"></div>
```
```css
#panel-backdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 499; /* below panels */
}
@media (max-width: 639px) {
  #panel-backdrop.active { display: block; }
}
```

**3.4 — Update `syncPanelMargins()`**

On mobile, panels don't push the bottom bar sideways — they overlay it. The function needs to detect screen width:
```javascript
function syncPanelMargins(){
  const bot = document.getElementById('bot');
  if (!bot) return;
  if (window.innerWidth < 640) {
    // Mobile: panels overlay bottom bar; no margin adjustment needed
    bot.style.left = '0';
    bot.style.right = '0';
    return;
  }
  // Desktop: side drawer margins
  bot.style.left  = (loomOpen ? 324 : 0) + 'px';
  bot.style.right = (grimoireOpen ? 364 : 0) + 'px';
}
```

**3.5 — Update `onUp()` panel guards**

```javascript
function onUp(x, y) {
  drag = false; if (moved) return;
  const W = window.innerWidth;
  const mobile = W < 640;
  if (mobile) {
    // On mobile, panels are bottom sheets; they don't block x-axis raycasting
    // (the backdrop click handler closes them; we skip raycasting if a panel is open)
    if ((loomOpen || grimoireOpen)) return;
  } else {
    if (grimoireOpen && x > W - 370) return;
    if (loomOpen && x < 325) return;
  }
  // ... rest of raycasting unchanged
}
```

**3.6 — Swipe-to-close gesture**

Add a `touchstart` / `touchmove` / `touchend` listener on each panel to detect downward swipe (dy > 60px → close):
```javascript
function addSwipeToClose(panelId, closeFn) {
  const el = document.getElementById(panelId);
  let sy0 = 0, swipeDy = 0;
  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    sy0 = e.touches[0].clientY;
    swipeDy = 0;
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    swipeDy = e.touches[0].clientY - sy0;
    if (swipeDy > 0) {
      el.style.transform = `translateY(${swipeDy}px)`;
    }
  }, { passive: true });
  el.addEventListener('touchend', () => {
    el.style.transform = '';
    if (swipeDy > 60) closeFn();
    swipeDy = 0;
  }, { passive: true });
}
```

---

### Phase 4 — Touch Target Enlargement (45 min)

All interactive buttons across the entire app must reach 44×44px minimum:

| Element | Current | Target |
|---------|---------|--------|
| `.ks` (key buttons) | ~24px h | 44px min-height |
| `.cp` (chord buttons) | ~28px h | 44px min-height |
| `.pa` (ledger actions) | ~26px h | 44px min-height |
| `.ls` (level selector) | ~28px h | 44px min-height |
| `.tb` (toolbar buttons) | ~28px h | 44px min-height |
| `.lbtn` (loom buttons) | ~28px h | 44px min-height |
| `.seq-cell` (sequencer) | 22px h | 32px min on mobile |
| `.bsphere.role-secondary` | 28px ⌀ | 36px ⌀ on mobile |
| `#theme-btn` | 34px ⌀ | 44px ⌀ |
| `#grimoire-close`, `#loom-close` | ~28px | 44px min |

Implementation: single `@media (max-width: 639px)` block at the end of `<style>`:

```css
@media (max-width: 639px) {
  .ks, .cp, .pa, .ls, .tb, .lbtn, .pbtn, .pbtn2, .plb {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #theme-btn, #grimoire-close, #loom-close {
    width: 44px; height: 44px;
  }
  .bubble.role-secondary .bsphere { --bsz: 36px; }
  .seq-cell { height: 30px; }
}
```

---

### Phase 5 — Sequencer Grid on Mobile (45 min)

The 5×16 grid at 16px column width is not usable. Two approaches:

**Option A — Horizontal scroll inside Loom**
The grid scrolls horizontally within the panel. Steps remain individual. Add:
```css
@media (max-width: 639px) {
  #seq-grid {
    grid-template-columns: 28px repeat(16, 28px); /* fixed 28px per step */
    overflow-x: auto;
    width: 100%;
  }
}
```

**Option B — Compact 8-step view with page arrows**
Show only 8 steps at a time, with `< >` page buttons. Simpler for single-hand use.

**Recommendation: Option A** — horizontal scroll is standard (Roland MC-series, Koala), keeps the full 16 steps visible on pan. Add a scroll position indicator (8 dots).

---

### Phase 6 — AudioContext Mobile Unlock (20 min)

Add a dedicated unlock gate at app start:

```javascript
let _acUnlocked = false;
function unlockAC() {
  if (_acUnlocked) return;
  const ac = getAC();
  if (ac.state === 'suspended') {
    ac.resume().then(() => { _acUnlocked = true; });
  } else {
    _acUnlocked = true;
  }
}
document.addEventListener('touchstart', unlockAC, { once: true, passive: true });
document.addEventListener('pointerdown', unlockAC, { once: true, passive: true });
```

This ensures the AudioContext is always running before the first intentional chord tap.

---

### Phase 7 — Double-Tap Reliability (30 min)

Replace the mixed `touchend` + `dblclick` approach with a pure pointer-events implementation:

```javascript
// Remove the existing dblclick listener.
// Extend onUp to use pointer events exclusively.
// The existing touchend → onIgnition path is fine.
// Add: pointer capture on canvas for better Android compatibility
rd.setPointerCapture = true; // already handled via touch-action:none
```

The current `DBL_TAP_MS=320` threshold is reasonable. The primary risk is the `dblclick` fallback on desktop interfering. On Android this is not an issue since `dblclick` doesn't fire for touch. The current code is actually structurally correct — just need to verify the timing with real device testing.

Add minimum movement threshold to prevent double-tap from firing if the user moved between taps (could accidentally trigger on portrait scroll momentum):
```javascript
// In touchend handler:
const dx = t2.clientX - _firstTapX, dy = t2.clientY - _firstTapY;
const moved2 = Math.sqrt(dx*dx + dy*dy) > 12;
if (now - lastTapTime < DBL_TAP_MS && !moved2) {
  onIgnition(t2.clientX, t2.clientY);
  // ...
}
// Store first tap position:
_firstTapX = t2.clientX; _firstTapY = t2.clientY;
```

---

### Phase 8 — Viewport Height Stability (30 min)

```javascript
// Replace static canvas setup with dynamic resize handler
function onViewportResize() {
  const vvp = window.visualViewport;
  const W = vvp ? vvp.width  : window.innerWidth;
  const H = vvp ? vvp.height : window.innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
  updateBubbles();
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onViewportResize);
  window.visualViewport.addEventListener('scroll', onViewportResize);
} else {
  window.addEventListener('resize', onViewportResize);
}
```

CSS: replace `height:100%` on `html,body` with `height:100svh` (small viewport, excludes address bar).

---

## Testing Checklist

### Devices to Test

| Device | Viewport | Notes |
|--------|----------|-------|
| Samsung Galaxy A series | 360×800 | Most common Android |
| Pixel 6/7 | 412×915 | Google reference |
| Galaxy S series | 384×854 | Narrow/tall |
| iPad 10.2" | 810×1080 | Tablet — desktop layout should kick in |

### Test Protocol

```
□ Install as PWA (Add to Home Screen)
□ Icon appears correctly on home screen
□ Opens in standalone mode (no browser chrome)
□ Safe area bars don't overlap controls
□ Top bar fits without overflow at 360px width
□ ⋮ overflow menu opens and all controls accessible
□ Loom button opens bottom sheet (not side drawer)
□ Grimoire button opens bottom sheet (not side drawer)
□ Backdrop dismisses panel on tap
□ Swipe down on panel header closes it
□ All key buttons tappable without adjacent-key misfires
□ All chord buttons tappable
□ Double-tap on dodecahedron triggers ignition
□ Bubble nodes tappable — chord plays and audio heard
□ Audio plays on first tap (not silent until second tap)
□ Sequencer step cells individually toggleable
□ BPM slider responds to touch drag
□ Pinch-zoom changes camera distance
□ Single-finger drag rotates dodecahedron
□ 3D canvas reflows correctly after address bar hide/show
□ Bubbles and signifiers remain aligned after viewport change
□ Theme toggle works (light/dark)
□ App loads offline (after first visit caches assets)
```

---

## Priority Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Phase 3 — Bottom sheets | 2 hr | Panels actually usable |
| P1 | Phase 1 — Compact top bar | 1 hr | Controls accessible |
| P2 | Phase 4 — Touch targets | 45 min | Basic usability |
| P3 | Phase 2 — Bottom bar scroll | 1 hr | Key/chord selection |
| P4 | Phase 6 — AudioContext unlock | 20 min | Audio plays on first tap |
| P5 | Phase 0 — PWA fixes | 30 min | Proper installation |
| P6 | Phase 8 — Viewport height | 30 min | Layout stability |
| P7 | Phase 5 — Sequencer grid | 45 min | Sequencer usable |
| P8 | Phase 7 — Double-tap | 30 min | Ignition reliability |

**Total estimated effort: ~7.5 hours.**

Begin with Phase 3 (bottom sheets) — it unblocks everything else. The panel architecture is the root constraint that makes the app non-functional on Android.

---

## What v9 Has That v15 Doesn't

After a brief comparison, `james_ladder_v9.html` appears to be an earlier, lighter build:
- No Temporal Loom panel
- No sequencer / polyrhythm
- No Pitch Constellation
- Simpler top bar (fewer controls)
- No `syncPanelMargins()` complexity

It is **not the target** for development — v15 (`index.html`) is the canonical version. v9 may be useful as a reference for simpler layout patterns, but no code should be pulled from it into v15 without review.

---

*James' Ladder — Android Development Plan*
*Created: 2026-04-05*
*Status: Ready for Implementation*
