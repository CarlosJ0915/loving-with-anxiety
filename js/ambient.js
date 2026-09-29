/* ═══════════════════════════════════════════════
   ambient — the wandering sunbeam and the drifting dust motes.
   The dust loop is never registered on LITE (see css › LITE).
   ═══════════════════════════════════════════════ */
import { prefersReduced, LITE } from "./config.js?v=61";

/* ═══════════ AMBIENT SUNLIGHT + DRIFTING DUST ═══════════ */
/* The sunbeam still drifts on a phone — it is one tween on one element and
   costs nothing once its blend mode is gone (see css › LITE). The dust field
   is the opposite: a full-viewport 2D canvas cleared and redrawn every frame
   with a shadowBlur per mote, and shadowBlur is among the slowest things
   canvas2d can do. On a phone those motes are barely perceptible, so the
   canvas is hidden in CSS and this loop is never registered at all. */
if (!prefersReduced) {
  // a warm pool of window-light wandering across the page, ~1 minute per pass
  gsap.fromTo(".sunbeam",
    { xPercent: -10, yPercent: -5, rotate: -1.5 },
    { xPercent: 10, yPercent: 5, rotate: 1.5, duration: 52, ease: "sine.inOut", yoyo: true, repeat: -1 });
}

if (!prefersReduced && !LITE) {
  const dustField = document.getElementById("dustField");
  const dctx = dustField.getContext("2d");
  let DW, DH;
  const sizeDust = () => {
    DW = dustField.width = innerWidth;
    DH = dustField.height = innerHeight;
  };
  sizeDust();
  window.addEventListener("resize", sizeDust);

  // a handful of motes, each with its own long cycle — most of the time unseen
  const ambientDust = Array.from({ length: 14 }, () => ({
    x: Math.random(), y: Math.random(),
    r: 0.7 + Math.random() * 1.1,
    vx: (Math.random() - 0.5) * 0.008,
    vy: -(0.004 + Math.random() * 0.008),
    cycle: 14 + Math.random() * 14,
    off: Math.random() * 30,
  }));
  gsap.ticker.add((time, delta) => {
    dctx.clearRect(0, 0, DW, DH);
    for (const p of ambientDust) {
      p.x = (p.x + (p.vx * delta) / 1000 + 1) % 1;
      p.y = (p.y + (p.vy * delta) / 1000 + 1) % 1;
      const prog = ((time + p.off) % p.cycle) / p.cycle;
      if (prog > 0.45) continue; // resting — motes appear only occasionally
      const a = Math.sin(Math.PI * (prog / 0.45)) * 0.32;
      dctx.beginPath();
      dctx.fillStyle = `rgba(255, 243, 216, ${a})`;
      dctx.shadowColor = "rgba(255, 236, 195, 0.6)";
      dctx.shadowBlur = 4;
      dctx.arc(p.x * DW, p.y * DH, p.r, 0, Math.PI * 2);
      dctx.fill();
    }
  });
}

