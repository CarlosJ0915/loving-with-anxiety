# Working on this project

A static landing page for *Loving with Anxiety* by Nicol Montoya (imprint: BY FRANCIA).
No build step, no framework, no bundler — `index.html`, `css/style.css`, `js/main.js`,
`js/i18n.js`. Everything third-party loads from a CDN. Read `README.md` for why the
book is real Three.js geometry and how the i18n snapshot works; read `MOBILE.md`
before touching anything below 760px.

## Ground rules

- **`index.html` is the English source of truth.** `js/i18n.js` carries only
  *translations* — never duplicate English into it. New user-facing strings need a
  `data-i18n` key in the markup and a matching entry in the `es` block.
- **Bump the cache-buster** when you edit CSS or JS: `style.css?v=NN`, `main.js?v=NN`
  in `index.html`. GitHub Pages caches aggressively.
- **Serve over HTTP to test** (`python3 -m http.server 4173`). The page uses ES
  modules, so opening `index.html` from the filesystem will not work.
- **Two compositions, one codebase.** Above 760px the book sits beside the copy and
  letters are projected onto its pages; below 760px the book is a hero moment and
  letters open full-screen in `#letterSheet`. The switch is `phoneQ` in `js/main.js`
  and `@media (max-width: 760px)` in `css/style.css`. Changing one composition should
  not change the other — check both before calling a change done.

## Layout of the JS

`js/main.js` runs top to bottom: Lenis + ScrollTrigger setup, the Three.js scene and
its canvas-painted textures, then a long init block holding the scroll choreography
(`openTl`, `layoutBookPages`, the letters, the excerpt flow, the chapters carousel).
Testing hooks: `window.__rig` (bookHolder, camera, layoutScene), `window.__openTl`,
`window.lenis`.

`letters` maps a feeling to its spreads as pairs of view selectors —
`anxious: { spreads: [["#pageLeftAnxious", "#pageRightAnx"]] }`. Adding a letter means
adding the views to the markup and an entry to that map; the phone sheet reads the
same map, so it needs no separate wiring.

## The phone letter sheet

`openLetterSheet()` **moves** `.fpage__view` nodes into `#sheetInner` and
`closeLetterSheet()` puts them back at their recorded parent and next sibling. They are
moved rather than cloned so the voice-note card keeps its listener and the copy stays a
single source of truth for i18n. If you add anything to a letter view that carries a
JS listener, it will survive the move — but anything that *queries* the DOM at init and
caches positions will not.

## Testing

Playwright with `devices['iPhone 13']` against a local server. Scroll with
`lenis.scrollTo(y, { immediate: true })`; `window.scrollTo` fights Lenis. Element
`.click()` via `page.evaluate` rather than `page.click` — the scrubbed animations mean
Playwright's stability check never settles.

Check after any layout change: no element wider than the viewport outside the
carousel track, no `a`/`button` under 44px tall, no page errors, and both
compositions still render.
