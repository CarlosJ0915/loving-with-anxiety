/* ═══════════════════════════════════════════════
   continue.html — the entry point for the choice page.

   No book, no pinned sections, no carousel: this page only needs the shared
   foundations. It costs a fraction of what index.html does, which is the
   point of it being its own route.

   The language machinery is the same module index.html uses, so a reader who
   chose Español on the way in still lands here in Español.
   ═══════════════════════════════════════════════ */

import { prefersReduced } from "./config.js?v=95";
import { lenis } from "./scroll.js?v=95";
import "./cursor.js?v=95";
import { initI18n } from "./i18n-runtime.js?v=95";

gsap.registerPlugin(ScrollTrigger);

/* no SplitText and no canvas jacket here, so neither hook is needed */
const i18n = initI18n();
i18n.restoreSavedLanguage();

lenis.start(); // index.html holds it for the preloader; this page has none

/* ═══════════ THE COPY SETTLES IN ═══════════ */
if (!prefersReduced) {
  gsap.from(".choose__eyebrow, .choose__rule", {
    autoAlpha: 0, y: 14, duration: 1.1, ease: "power2.out", stagger: 0.08,
  });
  gsap.from(".choose__title", {
    autoAlpha: 0, y: 26, duration: 1.3, ease: "power3.out", delay: 0.15,
  });
  gsap.from(".choose__intro p", {
    autoAlpha: 0, y: 18, duration: 1, ease: "power2.out", stagger: 0.12, delay: 0.4,
  });
  gsap.from(".choose__heart", {
    autoAlpha: 0, scale: 0.7, duration: 0.9, ease: "back.out(2)", delay: 1.0,
  });
  gsap.from(".path", {
    autoAlpha: 0, y: 34, duration: 1.1, ease: "power3.out", stagger: 0.14, delay: 1.15,
  });
  gsap.from(".choose__foot, .choose__rule--end", {
    autoAlpha: 0, duration: 1, ease: "sine.out", delay: 1.6,
  });
}

/* the cursor ring swells over anything marked data-hover (see cursor.js) */
i18n.offerLanguage();
