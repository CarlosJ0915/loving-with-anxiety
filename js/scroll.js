/* ═══════════════════════════════════════════════
   scroll — Lenis, wired to ScrollTrigger and to the nav's scrolled state.
   Starts stopped; the preloader releases it.
   ═══════════════════════════════════════════════ */

/* ═══════════ SMOOTH SCROLL ═══════════ */
const lenis = new Lenis({
  duration: 1.35,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
window.lenis = lenis;
lenis.on("scroll", ScrollTrigger.update);
lenis.on("scroll", ({ scroll }) => {
  document.getElementById("nav").classList.toggle("is-scrolled", scroll > 40);
});
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop(); // hold until the loader finishes

// anchor links through Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = a.getAttribute("href");
    if (target.length > 1 && document.querySelector(target)) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.8 });
    }
  });
});

export { lenis };
