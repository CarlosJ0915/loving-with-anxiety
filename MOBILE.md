# The phone version

**Status:** first pass landed. Audited at 390×664 (iPhone 13), 320×568 and 430×780,
against commit `c67ee5b`. Desktop composition is unchanged — every change below is
inside `@media (max-width: 760px)` or behind the `phoneQ` test in `js/main.js`.

---

## Why the site looked wrong on a phone

It was not broken so much as **unaware of one**. Every layout decision — the book
beside the copy, letters projected onto page rectangles, a pinned horizontal
gallery, a transparent nav floating over inset content — only holds above roughly
1000px wide. The old `@media (max-width: 760px)` block shrank those decisions
rather than replacing them.

What the audit found, worst first:

| | Issue | Evidence |
|---|---|---|
| A | Letter body text computed to **11.5px** (kicker 9.8px), centred, in a scroll box inside a pinned section | the emotional core of the site, unreadable |
| B | `.nav` is `position: fixed`, **108px tall, fully transparent** | copy collided with it in four of eight screens |
| C | Reading panels pinned to **vh fractions** (`top: 13vh; height: 29vh`) | drifts as the iOS address bar collapses |
| D | **Nested scrolling** inside a pinned, Lenis-driven section | a swipe has to choose between the letter and the page; they fight |
| E | Hero book rendered at **0.23 scale (~90px)**, then opened to a blank spread | full-screen WebGL to show a 90px prop |
| F | Movements drove **686px of horizontal travel through 232px cards** | never a whole card on screen |
| G | Tap targets under 44px | `Continue with me` 135×33, `Or revisit another feeling` 92×15 |
| H | **9,938px** of scroll-jacked page | ~15 viewports, two pinned sections |
| I | No `env(safe-area-inset-*)`, no `viewport-fit=cover` | nav and footer against the system UI |
| J | `100vh` on `.feelings` and `.chapters__pin` | the *largest* viewport height on mobile |

---

## What the phone does now

**The letter is the product.** Below 760px nothing is typeset onto the book. Choosing
a feeling opens `#letterSheet` — a full-screen view at 17px base / 16px body with a
1.78 line-height and a 34–48ch measure, its own single scroll, a persistent
`← Another feeling` bar, and the voice-note card at full width.

The letter views are **moved into the sheet, not cloned**. That is deliberate:

- the voice-note card keeps the listener it was given at load
- the copy stays a single source of truth, so i18n keeps working
- `closeLetterSheet()` returns every node to the exact parent and sibling it came from

Because a phone scrolls, all of a letter's spreads are placed at once — the
`Keep reading →` gate is hidden inside the sheet. `Turn to the page` reveals the
excerpt in place rather than running the 3D page-turn.

**The nav** is 3.5rem, sits below the safe-area inset, and frosts (`.is-scrolled`,
driven from the Lenis scroll callback) once you leave the top.

**The hero** book is now `scale 0.44 - 0.13t` at `y = 1.06 + 0.52t` — large enough to
read as a book, clear of both the nav and the headline, which starts below where the
jacket lands.

**The open-book sequence** is `+=170%` instead of `+=260%`, and the question fades in
at 0.42 of the timeline instead of 0.5 — the old timing held a blank spread for over
a viewport, because on a phone there is nothing printed on those pages.

**Movements** is a native snap carousel: `overflow-x: auto`, `scroll-snap-align: start`,
`scroll-padding-left: 1.4rem`, cards at `min(80vw, 320px)`, with progress dots built
in JS. The pinned horizontal ScrollTrigger is skipped entirely below 760px.

**Sections** use `100svh` rather than `100vh` — the *small* viewport height, which is
stable when the address bar collapses and does not churn ScrollTrigger.

**Performance:** `setPixelRatio` caps at 1.5 on phones (a 390px canvas at DPR 3 was
rendering 780×1328). The render loop already gates on `heroVisible`.

### Measured

| | before | after |
|---|---|---|
| letter body | 11.5px | 16px / 28.5px line-height |
| measure | ~52ch centred | 34–48ch, left-aligned |
| tap targets < 44px | 20+ | 0 |
| page height (390px) | 9,938px | 8,735px |
| pinned sections | 2 | 1 |
| JS errors | 0 | 0 |

---

## Still open

- **The open-book beat is still quiet on a phone.** 170% is better than 260%, but
  there is a stretch where the spread is blank before the question arrives. Worth
  considering whether the book should open *behind* the question rather than before it.
- **Landscape phones** are untested. `(max-width: 760px)` catches a portrait phone;
  a landscape one at 844×390 falls into the desktop branch with 390px of height.
- **`prefers-reduced-motion`** on phone is untested end to end.
- **Real-device testing.** Everything here is Playwright at phone viewports — it does
  not reproduce iOS Safari's address-bar behaviour, momentum scrolling, or the actual
  cost of the WebGL canvas on a warm phone.
- **The audio files are still absent** from the repo, so the voice-note card degrades
  to its heart state in every test.

---

## Testing it

`(max-width: 760px)` is the whole switch — resize a desktop browser under 760px and
the phone composition appears, including the letter sheet. For screenshots:

```bash
python3 -m http.server 4173
```

then drive it with Playwright using `devices['iPhone 13']`. Scroll with
`window.lenis.scrollTo(y, { immediate: true })` — plain `window.scrollTo` fights Lenis.
`window.__rig` and `window.__openTl` are exposed as testing hooks.
