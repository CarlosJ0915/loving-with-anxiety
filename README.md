# Amar con ansiedad — Book Landing Page

An interactive landing page for *Amar con ansiedad* ("Loving with Anxiety") by Nicol Montoya — a
book about living and loving alongside an anxious mind.

The centrepiece is a **3D book that opens as you scroll** and then asks the reader a question:
*How do you feel today?* Choosing an emotion turns the page to a personal letter from the author
written for that specific feeling.

**Live site:** https://CarlosJ0915.github.io/loving-with-anxiety/

---

## Why it's built this way

The brief was a premium, quiet, editorial feel — closer to a printed art book than a typical
product page. That drove most of the technical decisions.

### The book is real geometry, not a video or an image sequence

The book is a Three.js scene: box geometry for the boards and page block, a cover hinged at the
spine so it can swing open, and thin sheets that peel over for page turns. Because it's real
geometry, it responds to scroll position continuously rather than snapping between baked frames,
and it stays sharp at any viewport size.

### Cover art and page text are painted onto canvas at runtime

There are no image files for the cover or the page contents. `createCoverTexture()` paints the
jacket into a 1422×2048 canvas — paper gradient, mottling, hand-drawn sprigs, a light beam
raking in from the top-right corner — and hands it to Three.js as a texture. Page contents are
painted the same way. This keeps the repository small and means the typography renders with the
same web fonts as the rest of the page.

Preserving that corner light through a full palette change (the cover went from dusk-blue to
ivory) meant re-deriving the light values rather than just recolouring: on a dark cover a beam
reads because it is brighter than the base, but on ivory there is almost no headroom above the
base colour, so the base was set a shade below white and the beams and vignette were rebalanced
to keep the light legible by contrast.

### The reader's copy is projected from 3D into the DOM

The letters and the emotion buttons are real HTML, not canvas text — they need to be selectable,
accessible, and clickable. `layoutBookPages()` takes the book's world-space page corners,
projects them through the camera, and positions two absolutely-placed DOM panels onto the
resulting screen rectangles, scaling the font to match. The text sits exactly on the open pages
while remaining ordinary DOM.

### Two languages, including the 3D cover

The page ships in English and Spanish. English lives in `index.html` and is the
single source of truth: on load, the innerHTML of every `[data-i18n]` element is
snapshotted into memory, so `js/i18n.js` only carries *translations* and there is
no duplicated English to drift out of sync.

Switching languages does three things that a normal i18n layer doesn't have to:
it reverts the GSAP SplitText instances before swapping text and re-splits after
(a split holds references to DOM it generated, so swapping underneath it would
strand the animation); it repaints the book's cover texture, since the jacket is
canvas-painted rather than an image and the title has to be re-drawn; and it
refreshes ScrollTrigger, because translated copy changes the page height.

On a first visit the browser's preferred language is compared against the page's.
If it differs and we have that language, a quiet prompt offers to switch — worded
in the language being offered. The choice persists in `localStorage`, and the
prompt never appears again once answered.

**Adding a third language** means adding an entry to `LANGS` and a matching block
to `TRANSLATIONS` in `js/i18n.js`. The switcher builds itself from `LANGS`, so
there is no UI work.

### Mobile gets a different treatment on purpose

On a phone, each projected page is roughly 170px wide — far too small to hold a letter. Below
760px the projection is skipped entirely: the book stays as a backdrop and the copy is laid out
full-width over it, with its own scrolling and comfortable tap targets. Same content and same
choreography, a layout that actually fits the device.

---

## Tech

| | |
|---|---|
| 3D | Three.js 0.160 (ES modules via import map) |
| Animation | GSAP 3.13 — ScrollTrigger, SplitText |
| Smooth scroll | Lenis 1.3 |
| Styling | Hand-written CSS, custom properties, `clamp()` type scale |
| Build | None — static HTML/CSS/JS |

No bundler, no framework, no dependencies to install. Everything third-party loads from a CDN.

---

## Running locally

The page uses ES modules, so it needs to be served over HTTP — opening `index.html` directly from
the filesystem will not work.

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

---

## Structure

```
index.html          markup and content (English — the i18n source of truth)
css/style.css       all styling, including the phone layout
js/main.js          Three.js scene, canvas textures, scroll choreography
js/i18n.js          translations and cover wording per language
assets/art/         author portrait and the four "Movements" photographs
audio/              voice notes (see below)
```

### A note on the audio

Each letter offers a "Listen to a message from Nicol" card that plays `audio/nicol-<feeling>.mp3`
(`anxious`, `lost`, `exhausted`, `alone`, `afraid`, `unsure`). Those recordings are not in the
repository. The player degrades gracefully when a file is missing — it shows a heart and moves
the reader on to the book excerpt — so the flow stays intact until the recordings are added.

---

## Credits

Written by Nicol Montoya. Design and build by Carlos Artiles.
