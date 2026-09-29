/* ═══════════════════════════════════════════════
   cursor — the dot and its trailing ring. Pointer devices only;
   self-contained, nothing imports from it.
   ═══════════════════════════════════════════════ */

/* ═══════════ CURSOR ═══════════ */
const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursorRing");
if (window.matchMedia("(hover: hover)").matches) {
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });
  const rxTo = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
  const ryTo = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
  gsap.set([cursor, ring], { opacity: 0 });
  window.addEventListener("pointermove", (e) => {
    gsap.to([cursor, ring], { opacity: 1, duration: 0.3, overwrite: "auto" });
    xTo(e.clientX); yTo(e.clientY);
    rxTo(e.clientX); ryTo(e.clientY);
  });
  document.querySelectorAll("[data-hover], a, button, input").forEach((el) => {
    el.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
    el.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
  });
}

