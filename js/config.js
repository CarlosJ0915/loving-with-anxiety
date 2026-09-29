/* ═══════════════════════════════════════════════
   config — the two questions every other module asks about this device.
   Imported everywhere; imports nothing itself.
   ═══════════════════════════════════════════════ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ═══════════ PHONE ═══════════
   Below 760px the composition is different, not smaller: the book is a moment
   in the hero rather than a surface to typeset on, letters open full-screen in
   #letterSheet, and Movements is a native snap carousel. Every branch that
   depends on that reads this one query. See css/style.css › PHONES. */
const phoneQ = window.matchMedia("(max-width: 760px)");

/* ═══════════ LITE MODE ═══════════
   The ambient stack that makes this page feel like paper on a desktop — an
   animated grain plate four times the size of the screen, a screen-blended
   sunbeam, a canvas dust field, blurred SVG light, MSAA — is exactly the set
   of effects a mobile GPU is worst at. Each one forces a full-screen repaint
   or a backdrop read-back every frame, and on iOS Safari they compound.

   LITE keeps every one of those effects *visible* but stops them being
   re-computed per frame: the grain becomes a still plate, the sunbeam loses
   its blend mode, the dust field and the parallax stop. Nothing is recoloured
   and nothing disappears — see css/style.css › LITE. */
const LITE =
  phoneQ.matches ||
  (navigator.hardwareConcurrency || 8) <= 4 ||
  (navigator.deviceMemory || 8) <= 4;
document.documentElement.classList.toggle("lite", LITE);

export { prefersReduced, phoneQ, LITE };
