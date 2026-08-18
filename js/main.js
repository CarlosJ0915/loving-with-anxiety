/* ═══════════════════════════════════════════════
   BY FRANCIA — The Luminous Mind
   Motion: Lenis + GSAP ScrollTrigger + Three.js
   ═══════════════════════════════════════════════ */

import * as THREE from "three";
import { LANGS, DEFAULT_LANG, COVER, OFFER, TRANSLATIONS } from "./i18n.js";

/* the active language — the cover texture and the copy both read from this */
let LANG = DEFAULT_LANG;

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ═══════════ PHONE ═══════════
   Below 760px the composition is different, not smaller: the book is a moment
   in the hero rather than a surface to typeset on, letters open full-screen in
   #letterSheet, and Movements is a native snap carousel. Every branch that
   depends on that reads this one query. See css/style.css › PHONES. */
const phoneQ = window.matchMedia("(max-width: 760px)");

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

/* ═══════════ AMBIENT SUNLIGHT + DRIFTING DUST ═══════════ */
if (!prefersReduced) {
  // a warm pool of window-light wandering across the page, ~1 minute per pass
  gsap.fromTo(".sunbeam",
    { xPercent: -10, yPercent: -5, rotate: -1.5 },
    { xPercent: 10, yPercent: 5, rotate: 1.5, duration: 52, ease: "sine.inOut", yoyo: true, repeat: -1 });

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

/* ═══════════ THREE.JS — THE BOOK ═══════════ */
const canvas = document.getElementById("webgl");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0.1, 8.5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, phoneQ.matches ? 1.5 : 2));

/* — lighting: soft morning light — */
scene.add(new THREE.HemisphereLight(0xfdfbf5, 0xb9c3cd, 1.15));
scene.add(new THREE.AmbientLight(0xfdf8ee, 0.45));

const key = new THREE.DirectionalLight(0xfdf6e6, 2.1);
key.position.set(4, 6, 5);
scene.add(key);

const rim = new THREE.DirectionalLight(0xc7a86d, 1.3);
rim.position.set(-6, 2, -4);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xe8edf2, 1.0);
fill.position.set(0, 0.5, 8);
scene.add(fill);

/* — the book — */
const book = new THREE.Group();

const slateMat = new THREE.MeshStandardMaterial({ color: 0xded3c1, roughness: 0.62, metalness: 0.04 });
const spineMat = new THREE.MeshStandardMaterial({ color: 0xc9b48c, roughness: 0.6, metalness: 0.12 });
const pageMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf5, roughness: 0.9, metalness: 0 });
const gildMat = new THREE.MeshStandardMaterial({ color: 0xd8c295, roughness: 0.25, metalness: 0.75 });

// front-cover face — receives the painted cover art once fonts are ready
const coverFaceMat = new THREE.MeshStandardMaterial({ color: 0xe6ddcd, roughness: 0.55, metalness: 0.02 });

const W = 2.5, H = 3.6, D = 0.62, CT = 0.09; // width, height, depth, cover thickness

const coverGeo = new THREE.BoxGeometry(W, H, CT);
// BoxGeometry material order: +x, -x, +y, -y, +z, -z — cover art on the outward (+z) face,
// cream on the inward (-z) face so the inside of the cover reads as paper when opened
const innerMat = new THREE.MeshStandardMaterial({ color: 0xf6f1e4, roughness: 0.85, metalness: 0 });
const front = new THREE.Mesh(coverGeo, [slateMat, slateMat, slateMat, slateMat, coverFaceMat, innerMat]);
// hinge the front cover at the spine so it can swing open on scroll
const coverPivot = new THREE.Group();
coverPivot.position.set(-W / 2, 0, D / 2 - CT / 2);
front.position.x = W / 2;
coverPivot.add(front);
const back = new THREE.Mesh(coverGeo, slateMat);
back.position.z = -D / 2 + CT / 2;

const spine = new THREE.Mesh(new THREE.BoxGeometry(CT, H + 0.008, D + 0.008), spineMat);
spine.position.x = -W / 2 + CT / 2 - 0.006;

const pages = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, H - 0.12, D - CT * 2 - 0.015), pageMat);
pages.position.x = 0.05;

// gilded page edge (thin gold slab on the fore-edge)
const gild = new THREE.Mesh(new THREE.BoxGeometry(0.012, H - 0.12, D - CT * 2 - 0.015), gildMat);
gild.position.x = 0.05 + (W - 0.16) / 2;

book.add(coverPivot, back, spine, pages, gild);

/* — premium paper: warm ivory, grain, fibres, afternoon leaf shadows — */
function ovalLeaf(x, cx, cy, s, rot, rnd) {
  // rounded eucalyptus-style leaf: soft oval, faintly tapered at the stem end
  x.save();
  x.translate(cx, cy);
  x.rotate(rot);
  const len = 12 * s * (0.85 + rnd() * 0.3);
  const wid = 7.2 * s * (0.85 + rnd() * 0.3);
  x.beginPath();
  x.moveTo(-len, 0);
  x.bezierCurveTo(-len * 0.55, -wid, len * 0.6, -wid, len, -wid * 0.12);
  x.bezierCurveTo(len * 0.6, wid, -len * 0.55, wid, -len, 0);
  x.closePath();
  x.fill();
  // short stem joining the leaf to its twig
  x.lineWidth = 1.3 * s;
  x.beginPath();
  x.moveTo(-len, 0);
  x.lineTo(-len - 6 * s, (rnd() - 0.5) * 4 * s);
  x.stroke();
  x.restore();
}

function frond(x, x0, y0, x1, y1, s, rnd) {
  // a drooping stem with leaflets attached in orderly opposite pairs
  const dx = x1 - x0, dy = y1 - y0;
  const cxp = x0 + dx * 0.5 - dy * 0.18 + (rnd() - 0.5) * 40;
  const cyp = y0 + dy * 0.5 + dx * 0.18 + (rnd() - 0.5) * 40;
  const pt = (t) => {
    const ax = x0 + (cxp - x0) * t, ay = y0 + (cyp - y0) * t;
    const bx = cxp + (x1 - cxp) * t, by = cyp + (y1 - cyp) * t;
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  };
  x.lineWidth = 2.1 * s;
  x.beginPath();
  x.moveTo(x0, y0);
  x.quadraticCurveTo(cxp, cyp, x1, y1);
  x.stroke();

  const pairs = 7 + Math.floor(rnd() * 4);
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1);
    const [nx, ny] = pt(t);
    const [tx, ty] = pt(Math.min(t + 0.04, 1));
    const tang = Math.atan2(ty - ny, tx - nx);
    const taper = 0.75 + 0.45 * Math.sin(Math.PI * t);
    for (const side of [-1, 1]) {
      const a = tang + side * (0.85 + (rnd() - 0.5) * 0.25);
      const ls = s * taper * (0.9 + rnd() * 0.25);
      ovalLeaf(x, nx + Math.cos(a) * 14 * ls, ny + Math.sin(a) * 14 * ls, ls, a, rnd);
    }
  }
  // terminal leaflet at the tip
  const [ex, ey] = pt(1);
  const [qx, qy] = pt(0.94);
  const ta = Math.atan2(ey - qy, ex - qx);
  ovalLeaf(x, ex + Math.cos(ta) * 12 * s, ey + Math.sin(ta) * 12 * s, s * 0.9, ta, rnd);
}

function makePaperTexture({ base, shade, leaves, gutter }) {
  const w = 1024, h = 1523;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // warm ivory base with a gentle vertical drift
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, base);
  g.addColorStop(1, shade);
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  // afternoon light pooling softly on the paper
  const glow = x.createRadialGradient(w * 0.68, h * 0.24, 0, w * 0.68, h * 0.24, h * 0.72);
  glow.addColorStop(0, "rgba(255, 248, 230, 0.35)");
  glow.addColorStop(1, "rgba(255, 248, 230, 0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, w, h);

  // fold shading toward the spine — real page depth instead of a hard line
  const gw = w * 0.17;
  const fold = gutter === "left"
    ? x.createLinearGradient(0, 0, gw, 0)
    : x.createLinearGradient(w, 0, w - gw, 0);
  fold.addColorStop(0, "rgba(96, 80, 58, 0.22)");
  fold.addColorStop(0.45, "rgba(96, 80, 58, 0.08)");
  fold.addColorStop(1, "rgba(96, 80, 58, 0)");
  x.fillStyle = fold;
  x.fillRect(gutter === "left" ? 0 : w - gw, 0, gw, h);

  // paper grain
  for (let i = 0; i < 9000; i++) {
    const a = 0.015 + rnd() * 0.03;
    x.fillStyle = rnd() > 0.5 ? `rgba(110, 95, 70, ${a})` : `rgba(255, 252, 242, ${a + 0.01})`;
    x.fillRect(rnd() * w, rnd() * h, 1.2, 1.2);
  }
  // stray fibres
  x.strokeStyle = "rgba(120, 105, 78, 0.05)";
  x.lineWidth = 0.7;
  for (let i = 0; i < 130; i++) {
    const fx = rnd() * w, fy = rnd() * h;
    const len = 6 + rnd() * 22, ang = rnd() * Math.PI;
    x.beginPath();
    x.moveTo(fx, fy);
    x.lineTo(fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
    x.stroke();
  }

  // botanical shadows — hanging fronds with paired leaflets, two depths of focus
  if (leaves) {
    const ink = (a) => `rgba(105, 92, 70, ${a})`;

    // far layer: softer, out of focus
    x.save();
    x.filter = "blur(11px)";
    x.fillStyle = ink(0.1);
    x.strokeStyle = ink(0.1);
    frond(x, w * 0.28, -40, w * 0.02, h * 0.34, 3.0, rnd);
    frond(x, w * 0.85, -60, w * 0.62, h * 0.3, 3.2, rnd);
    frond(x, w * 1.05, h * 0.38, w * 0.6, h * 0.62, 2.7, rnd);
    x.restore();

    // near layer: crisp enough to read each leaflet on the sunlit paper
    x.save();
    x.filter = "blur(3px)";
    x.fillStyle = ink(0.16);
    x.strokeStyle = ink(0.15);
    frond(x, w * 0.55, -50, w * 0.3, h * 0.3, 2.4, rnd);
    frond(x, w * 1.02, -30, w * 0.72, h * 0.42, 2.6, rnd);
    frond(x, w * 0.95, h * 0.55, w * 0.55, h * 0.85, 2.2, rnd);
    x.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// right page — plain paper; the leaf shadows live on their own layer so they can sway
const rightPageTex = makePaperTexture({ base: "#f6f0e2", shade: "#efe6d2", leaves: false, gutter: "left" });
// left page (inside of the cover) — quieter, gutter on its right
const leftPageTex = makePaperTexture({ base: "#f3ecdb", shade: "#ece2cd", leaves: false, gutter: "right" });

const pageEdgeMat = new THREE.MeshStandardMaterial({ color: 0xefe7d3, roughness: 0.95 });
pages.material = [
  pageEdgeMat, pageEdgeMat, pageEdgeMat, pageEdgeMat,
  new THREE.MeshStandardMaterial({ map: rightPageTex, roughness: 0.94 }),
  pageEdgeMat,
];
front.material[5] = new THREE.MeshStandardMaterial({ map: leftPageTex, roughness: 0.92 });

/* — the foliage shadows: a transparent layer floating on the right page,
     so a breeze can move them without repainting the paper — */
function makeLeafShadowTexture() {
  const w = 1024, h = 1523;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ink = (a) => `rgba(105, 92, 70, ${a})`;

  x.save();
  x.filter = "blur(11px)";
  x.fillStyle = ink(0.1);
  x.strokeStyle = ink(0.1);
  frond(x, w * 0.28, -40, w * 0.02, h * 0.34, 3.0, rnd);
  frond(x, w * 0.85, -60, w * 0.62, h * 0.3, 3.2, rnd);
  frond(x, w * 1.05, h * 0.38, w * 0.6, h * 0.62, 2.7, rnd);
  x.restore();

  x.save();
  x.filter = "blur(3px)";
  x.fillStyle = ink(0.16);
  x.strokeStyle = ink(0.15);
  frond(x, w * 0.55, -50, w * 0.3, h * 0.3, 2.4, rnd);
  frond(x, w * 1.02, -30, w * 0.72, h * 0.42, 2.6, rnd);
  frond(x, w * 0.95, h * 0.55, w * 0.55, h * 0.85, 2.2, rnd);
  x.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

const leafPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(W - 0.16, H - 0.12),
  new THREE.MeshStandardMaterial({
    map: makeLeafShadowTexture(),
    transparent: true,
    roughness: 0.94,
    depthWrite: false,
  })
);
leafPlane.position.set(0.05, 0, (D - CT * 2 - 0.015) / 2 + 0.009);
book.add(leafPlane);

/* — the turning page: a single sheet hinged at the spine, lying on the
     right-hand stack until the reader answers, then turning left — */
const turnPivot = new THREE.Group();
turnPivot.position.set(-W / 2, 0, (D - CT * 2 - 0.015) / 2 + 0.0075);
const sheetEdge = new THREE.MeshStandardMaterial({ color: 0xf3ecdb, roughness: 0.95 });
const turnPage = new THREE.Mesh(
  new THREE.BoxGeometry(W - 0.16, H - 0.12, 0.002),
  [
    sheetEdge, sheetEdge, sheetEdge, sheetEdge,
    new THREE.MeshStandardMaterial({ map: rightPageTex, roughness: 0.94 }),
    new THREE.MeshStandardMaterial({ map: leftPageTex, roughness: 0.92 }),
  ]
);
turnPage.position.x = W / 2 + 0.05;
turnPivot.add(turnPage);
book.add(turnPivot);

/* — a second sheet beneath the first, for letters long enough
     to need another page turn — */
const turnPivot2 = new THREE.Group();
turnPivot2.position.set(-W / 2, 0, (D - CT * 2 - 0.015) / 2 + 0.0035);
const turnPage2 = new THREE.Mesh(
  new THREE.BoxGeometry(W - 0.16, H - 0.12, 0.002),
  [
    sheetEdge, sheetEdge, sheetEdge, sheetEdge,
    new THREE.MeshStandardMaterial({ map: rightPageTex, roughness: 0.94 }),
    new THREE.MeshStandardMaterial({ map: leftPageTex, roughness: 0.92 }),
  ]
);
turnPage2.position.x = W / 2 + 0.05;
turnPivot2.add(turnPage2);
book.add(turnPivot2);

/* — the question printed on the turning sheet, mirroring the DOM layout,
     so the words travel with the paper when the page turns — */
function makeQuestionSheetTexture() {
  const tex = makePaperTexture({ base: "#f6f0e2", shade: "#efe6d2", leaves: false, gutter: "left" });
  const c = tex.image;
  const x = c.getContext("2d");
  const w = c.width, h = c.height;
  const em = w / 23; // same scale the DOM overlay uses (panel width / 23)
  const cx = w / 2;
  let ty = h / 2 - 9.1 * em; // top of the centred text block

  // "How do you"
  x.textAlign = "center";
  x.fillStyle = "#4a4234";
  x.font = `400 ${1.9 * em}px "Cormorant Garamond", serif`;
  x.fillText("How do you", cx, ty + 1.7 * em);
  // "feel today?" — italic gold + roman ink
  const qy2 = ty + 3.85 * em;
  x.font = `italic 400 ${1.9 * em}px "Cormorant Garamond", serif`;
  const feelW = x.measureText("feel ").width;
  x.font = `400 ${1.9 * em}px "Cormorant Garamond", serif`;
  const todayW = x.measureText("today?").width;
  const startX = cx - (feelW + todayW) / 2;
  x.textAlign = "left";
  x.font = `italic 400 ${1.9 * em}px "Cormorant Garamond", serif`;
  x.fillStyle = "#a8905f";
  x.fillText("feel ", startX, qy2);
  x.font = `400 ${1.9 * em}px "Cormorant Garamond", serif`;
  x.fillStyle = "#4a4234";
  x.fillText("today?", startX + feelW, qy2);
  x.textAlign = "center";

  // the paper labels, row by row as the flex layout wraps them
  const rows = [["Anxious", "Lost", "Exhausted"], ["Alone", "Afraid"], ["I don’t know what I feel"]];
  const lf = 0.95 * em;
  x.font = `400 ${lf}px "Cormorant Garamond", serif`;
  const padX = 1.3 * lf;
  const gapX = 0.85 * em, gapY = 0.95 * em;
  const rowH = 2.5 * lf;
  let ry = ty + 7.0 * em;
  for (const row of rows) {
    const widths = row.map((t) => x.measureText(t).width + padX * 2);
    const totalW = widths.reduce((a, b) => a + b, 0) + gapX * (row.length - 1);
    let bx = cx - totalW / 2;
    for (let i = 0; i < row.length; i++) {
      x.fillStyle = "rgba(250, 246, 236, 0.75)";
      x.strokeStyle = "rgba(166, 148, 113, 0.35)";
      x.lineWidth = 1.5;
      x.beginPath();
      x.roundRect(bx, ry, widths[i], rowH, 0.7 * lf);
      x.fill();
      x.stroke();
      x.fillStyle = "#5d5342";
      x.fillText(row[i], bx + widths[i] / 2, ry + rowH / 2 + 0.34 * lf);
      bx += widths[i] + gapX;
    }
    ry += rowH + gapY;
  }

  // caption
  x.font = `400 ${0.82 * em}px "Cormorant Garamond", serif`;
  x.fillStyle = "#85795f";
  x.fillText("There are no wrong answers.", cx, ry + 1.2 * em);

  tex.needsUpdate = true;
  return tex;
}

/* — a letter page printed on paper: word-wrapped paragraphs, centred,
     matching the DOM letter's typography so the words can ride a turning sheet — */
function makeLetterSheetTexture(paragraphs) {
  const tex = makePaperTexture({ base: "#f6f0e2", shade: "#efe6d2", leaves: false, gutter: "left" });
  const c = tex.image;
  const x = c.getContext("2d");
  const w = c.width, h = c.height;
  const em = w / 23;                 // the DOM overlay's base scale
  const noteFont = 0.75 * em;        // .anxious-note font-size
  const lineH = 1.6 * noteFont;
  const gap = 0.72 * noteFont;
  const maxWidth = 20 * noteFont;    // .anxious-note max-width
  x.font = `400 ${noteFont}px "Cormorant Garamond", serif`;
  x.fillStyle = "#6b6252";
  x.textAlign = "center";

  // wrap every paragraph ("\n" = hard break, kept for the letter's rhythm)
  const blocks = paragraphs.map((p) =>
    p.split("\n").flatMap((seg) => {
      const words = seg.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        const attempt = line ? line + " " + word : word;
        if (x.measureText(attempt).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = attempt;
        }
      }
      if (line) lines.push(line);
      return lines;
    })
  );

  const totalLines = blocks.reduce((n, b) => n + b.length, 0);
  const blockH = totalLines * lineH + (blocks.length - 1) * gap;
  let y = (h - blockH) / 2 + lineH * 0.8;
  for (const lines of blocks) {
    for (const line of lines) {
      x.fillText(line, w / 2, y);
      y += lineH;
    }
    y += gap;
  }

  tex.needsUpdate = true;
  return tex;
}

/* — dust that catches the light when the book acknowledges the reader — */
const bookDustCount = 60;
const bookDustPos = new Float32Array(bookDustCount * 3);
for (let i = 0; i < bookDustCount; i++) {
  bookDustPos[i * 3] = -2.1 + Math.random() * 4.5;      // across the open spread
  bookDustPos[i * 3 + 1] = -1.6 + Math.random() * 3.2;
  bookDustPos[i * 3 + 2] = 2.45 + Math.random() * 0.75; // just in front of the pages
}
const bookDustGeo = new THREE.BufferGeometry();
bookDustGeo.setAttribute("position", new THREE.BufferAttribute(bookDustPos, 3));
const bookDust = new THREE.Points(
  bookDustGeo,
  new THREE.PointsMaterial({
    color: 0xf7e9c8,
    size: 0.022,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    depthWrite: false,
  })
);
scene.add(bookDust);
book.rotation.set(0.12, -0.55, 0.06);

const bookHolder = new THREE.Group(); // scroll rotation
const floatHolder = new THREE.Group(); // idle float
floatHolder.add(book);
bookHolder.add(floatHolder);
scene.add(bookHolder);

/* — dust motes — */
const moteCount = 90;
const motePos = new Float32Array(moteCount * 3);
for (let i = 0; i < moteCount; i++) {
  motePos[i * 3] = (Math.random() - 0.5) * 14;
  motePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
  motePos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
const motes = new THREE.Points(
  moteGeo,
  new THREE.PointsMaterial({ color: 0xc7a86d, size: 0.02, transparent: true, opacity: 0.55, sizeAttenuation: true })
);
scene.add(motes);

/* ═══════════ COVER ART — painted at 2048px for crisp rendering ═══════════ */
function drawHeart(x, hx, hy, s, col) {
  x.save();
  x.translate(hx, hy);
  x.scale(s / 30, s / 30);
  x.fillStyle = col;
  x.beginPath();
  x.arc(-6.5, -8, 7.5, 0, Math.PI * 2);
  x.arc(6.5, -8, 7.5, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.moveTo(-13.2, -5.2);
  x.lineTo(13.2, -5.2);
  x.lineTo(0, 12);
  x.closePath();
  x.fill();
  x.restore();
}

function drawSprigs(x, Wpx, Hpx) {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stemCol = "rgba(178, 150, 100, 0.55)";
  const petalCols = ["rgba(190, 162, 108, 0.85)", "rgba(168, 142, 96, 0.7)", "rgba(146, 124, 88, 0.6)"];

  for (let s = 0; s < 7; s++) {
    const baseX = 60 + rnd() * 180;
    const baseY = Hpx * (0.68 + rnd() * 0.32);
    const topX = baseX + (rnd() - 0.55) * 180;
    const topY = baseY - (500 + rnd() * 560);
    const bendX = baseX + (rnd() - 0.5) * 200;

    x.strokeStyle = stemCol;
    x.lineWidth = 2 + rnd() * 1.4;
    x.beginPath();
    x.moveTo(baseX, baseY);
    x.quadraticCurveTo(bendX, (baseY + topY) / 2, topX, topY);
    x.stroke();

    // sub-branches with blossom clusters
    const branches = 3 + Math.floor(rnd() * 3);
    for (let b = 0; b <= branches; b++) {
      const t = 0.35 + (b / branches) * 0.65;
      const sx = baseX + (topX - baseX) * t + (bendX - baseX) * (1 - t) * t * 2 * 0.4;
      const sy = baseY + (topY - baseY) * t;
      const ex = Math.min(sx + (rnd() - 0.55) * 110, 400);
      const ey = sy - 40 - rnd() * 110;
      x.lineWidth = 1.4;
      x.beginPath();
      x.moveTo(sx, sy);
      x.quadraticCurveTo((sx + ex) / 2 + (rnd() - 0.5) * 40, (sy + ey) / 2, ex, ey);
      x.stroke();
      const dots = 4 + Math.floor(rnd() * 5);
      for (let d = 0; d < dots; d++) {
        const a = rnd() * Math.PI * 2;
        const r = rnd() * 26;
        x.fillStyle = petalCols[Math.floor(rnd() * petalCols.length)];
        x.beginPath();
        x.arc(ex + Math.cos(a) * r, ey + Math.sin(a) * r * 1.25, 2.6 + rnd() * 4.4, 0, Math.PI * 2);
        x.fill();
      }
    }
  }
}

function createCoverTexture(lang = LANG) {
  const words = COVER[lang] || COVER[DEFAULT_LANG];
  const Wpx = 1422, Hpx = 2048;
  const c = document.createElement("canvas");
  c.width = Wpx;
  c.height = Hpx;
  const x = c.getContext("2d");

  // warm ivory paper base — kept a shade below white so the light beams
  // below still have headroom to read as light falling across the cover
  const bg = x.createLinearGradient(0, 0, 0, Hpx);
  bg.addColorStop(0, "#ece4d5");
  bg.addColorStop(0.45, "#e3dacb");
  bg.addColorStop(1, "#d5cab6");
  x.fillStyle = bg;
  x.fillRect(0, 0, Wpx, Hpx);

  // soft mottling
  const blobs = [
    [0.2, 0.25, 430, "rgba(255, 253, 246, 0.30)"],
    [0.75, 0.6, 500, "rgba(150, 128, 98, 0.10)"],
    [0.3, 0.8, 470, "rgba(140, 118, 88, 0.12)"],
    [0.65, 0.2, 390, "rgba(255, 253, 246, 0.34)"],
  ];
  for (const [px, py, r, col] of blobs) {
    const g = x.createRadialGradient(px * Wpx, py * Hpx, 0, px * Wpx, py * Hpx, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    x.fillStyle = g;
    x.fillRect(0, 0, Wpx, Hpx);
  }

  // light beams from the top right
  x.save();
  x.translate(Wpx * 0.92, -60);
  x.rotate(Math.PI / 9.5);
  for (const [w0, w1, len, a] of [[30, 190, 1500, 0.42], [90, 420, 1750, 0.26], [10, 80, 1250, 0.52]]) {
    const g = x.createLinearGradient(0, 0, 0, len);
    g.addColorStop(0, `rgba(255, 253, 247, ${a})`);
    g.addColorStop(1, "rgba(255, 253, 247, 0)");
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(-w0 / 2, 0);
    x.lineTo(w0 / 2, 0);
    x.lineTo(w1 / 2, len);
    x.lineTo(-w1 / 2, len);
    x.closePath();
    x.fill();
  }
  x.restore();
  const glow = x.createRadialGradient(Wpx * 0.93, 40, 0, Wpx * 0.93, 40, 620);
  glow.addColorStop(0, "rgba(255, 252, 244, 0.72)");
  glow.addColorStop(1, "rgba(255, 252, 244, 0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, Wpx, Hpx);

  // vignette
  const vg = x.createRadialGradient(Wpx / 2, Hpx * 0.45, Hpx * 0.28, Wpx / 2, Hpx * 0.55, Hpx * 0.85);
  vg.addColorStop(0, "rgba(0, 0, 0, 0)");
  vg.addColorStop(1, "rgba(122, 100, 70, 0.30)");
  x.fillStyle = vg;
  x.fillRect(0, 0, Wpx, Hpx);

  drawSprigs(x, Wpx, Hpx);

  // ——— typography ———
  x.textAlign = "center";
  const cx = Wpx / 2;

  x.fillStyle = "#302c26";
  x.letterSpacing = "26px";
  x.font = '400 238px "Cormorant Garamond", serif';
  x.fillText(words.title1, cx + 13, 580);

  x.letterSpacing = "8px";
  x.font = '400 150px "Cormorant Garamond", serif';
  x.fillText(words.title2, cx + 4, 742);

  x.font = '400 196px "Cormorant Garamond", serif';
  x.fillText(words.title3, cx + 4, 934);

  // divider — ♥ —
  const dy = 1046;
  x.strokeStyle = "rgba(199, 168, 109, 0.9)";
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(cx - 150, dy);
  x.lineTo(cx - 64, dy);
  x.moveTo(cx + 64, dy);
  x.lineTo(cx + 150, dy);
  x.stroke();
  drawHeart(x, cx, dy, 30, "#c7a86d");

  x.fillStyle = "#6d6456";
  x.letterSpacing = "13px";
  x.font = '300 55px "Manrope", sans-serif';
  words.sub.forEach((line, i) => x.fillText(line, cx + 6, 1210 + i * 90));

  x.fillStyle = "#4a443a";
  x.letterSpacing = "20px";
  x.font = '400 58px "Manrope", sans-serif';
  x.fillText(words.author, cx + 10, 1905);
  x.letterSpacing = "0px";

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

const openState = { v: 0 }; // 0 = closed in the hero · 1 = open in the feelings section

/* — layout: book sits right of center on wide screens — */
function layoutScene() {
  if (openState.v > 0.001) return; // the open-book timeline owns the pose
  const aspect = innerWidth / innerHeight;
  if (aspect > 1.1) {
    bookHolder.position.set(2.55, 0.15, 0);
    bookHolder.scale.setScalar(1);
  } else {
    // portrait: the book floats in the band between the nav and the headline
    const t = THREE.MathUtils.clamp((1.1 - aspect) / 0.65, 0, 1); // 0 at square … 1 at phone
    // On a phone the book is the whole composition rather than an object beside
    // the copy, so it sits higher and stays large enough to read as a book.
    bookHolder.position.set(0, 1.06 + 0.52 * t, 0);
    bookHolder.scale.setScalar(0.44 - 0.13 * t);
  }
}
layoutScene();
window.__rig = { bookHolder, camera, layoutScene }; // testing hook, like __openTl

/* — mouse parallax — */
const mouse = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / innerHeight - 0.5) * 2;
});

/* — render loop — */
const clock = new THREE.Clock();
let heroVisible = true;

function render() {
  const t = clock.getElapsedTime();

  if (heroVisible) {
    const calm = 1 - openState.v; // idle motion fades out as the book opens
    floatHolder.position.y = Math.sin(t * 0.8) * 0.14 * calm;
    floatHolder.rotation.z = Math.sin(t * 0.5) * 0.03 * calm;

    if (openState.v < 0.001) {
      book.rotation.y = -0.55 + Math.sin(t * 0.35) * 0.1;
      if (!prefersReduced) {
        bookHolder.rotation.y += (mouse.x * 0.22 - bookHolder.rotation.y + scrollRotY.value) * 0.05;
        bookHolder.rotation.x += (mouse.y * 0.12 - bookHolder.rotation.x + scrollRotX.value) * 0.05;
      }
    }

    motes.rotation.y = t * 0.02;
    if (bookDust.material.opacity > 0.004) {
      bookDust.position.y += 0.0007; // dust drifts slowly upward through the light
      bookDust.rotation.z += 0.00018;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(render);
}

/* — scroll-driven rotation & drift — */
const scrollRotY = { value: 0 };
const scrollRotX = { value: 0 };

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  layoutScene();
});

/* ═══════════ TEXT SPLITTING ═══════════ */
document.fonts.ready.then(() => {

  // paint the cover once the exact faces it needs are available
  Promise.all([
    document.fonts.load('400 238px "Cormorant Garamond"'),
    document.fonts.load('300 55px "Manrope"'),
    document.fonts.load('400 58px "Manrope"'),
  ]).then(() => {
    repaintCover();
  });
  // repaint the jacket whenever the language changes — the cover is a canvas
  // texture, so the title has to be re-drawn rather than re-styled
  function repaintCover() {
    const old = coverFaceMat.map;
    coverFaceMat.map = createCoverTexture(LANG);
    coverFaceMat.color.set(0xffffff);
    coverFaceMat.needsUpdate = true;
    if (old) old.dispose();
  }

  /* ═══════════ LANGUAGE ═══════════
     English lives in the markup and is snapshotted here on first touch, so
     i18n.js only carries translations. Switching re-swaps innerHTML, re-runs
     the SplitText instances over the new text, and repaints the 3D jacket. */
  const EN = new Map();
  const LANG_KEY = "byfrancia-lang";
  let splitsReady = false;

  function remember(el, attr, read) {
    const k = el.getAttribute(attr);
    if (k && !EN.has(k)) EN.set(k, read(el));
    return k;
  }
  function applyTo(root, lang) {
    const dict = TRANSLATIONS[lang] || {};
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = remember(el, "data-i18n", (e) => e.innerHTML);
      const v = lang === DEFAULT_LANG ? EN.get(k) : dict[k];
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const k = remember(el, "data-i18n-placeholder", (e) => e.getAttribute("placeholder") || "");
      const v = lang === DEFAULT_LANG ? EN.get(k) : dict[k];
      if (v != null) el.setAttribute("placeholder", v);
    });
  }

  function applyLanguage(lang, { persist = true } = {}) {
    if (!LANGS[lang]) lang = DEFAULT_LANG;
    LANG = lang;
    // a split holds references to DOM it created — revert before the swap
    if (splitsReady) {
      heroSplits.forEach((s) => s.revert());
      lineSplits.forEach((s) => s.revert());
    }
    applyTo(document, lang);
    if (splitsReady) {
      heroSplits.forEach((s) => s.split());
      lineSplits.forEach((s) => s.split());
      ScrollTrigger.refresh();
    }
    document.documentElement.lang = LANGS[lang].htmlLang;
    repaintCover();
    if (persist) { try { localStorage.setItem(LANG_KEY, lang); } catch (e) {} }
    renderSwitch();
  }
  window.__setLang = applyLanguage; // handy from the console
  window.__offerLang = () => offerLanguage(); // ditto, for testing the prompt

  /* — the switcher builds itself from LANGS, so a new language needs no UI work — */
  const langBox = document.getElementById("langSwitch");
  function renderSwitch() {
    if (!langBox) return;
    langBox.innerHTML = "";
    Object.entries(LANGS).forEach(([code, meta]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lang__btn" + (code === LANG ? " is-on" : "");
      b.textContent = meta.short;
      b.title = meta.label;
      b.setAttribute("aria-label", meta.label);
      if (code === LANG) b.setAttribute("aria-current", "true");
      b.setAttribute("data-hover", "");
      b.addEventListener("click", () => { if (code !== LANG) applyLanguage(code); });
      langBox.append(b);
    });
  }

  /* Restoring a saved choice runs before the text is split, so the swap is a
     plain innerHTML write and the hero reveal still animates from scratch. */
  function restoreSavedLanguage() {
    let saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (saved && saved !== LANG) applyLanguage(saved, { persist: false });
  }

  /* — first visit: if the browser prefers another language we have, offer it — */
  function offerLanguage() {
    let saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (saved) return;
    const want = (navigator.languages || [navigator.language || ""])
      .map((l) => String(l).slice(0, 2).toLowerCase())
      .find((l) => LANGS[l]);
    if (!want || want === LANG) return;
    const copy = OFFER[want];
    if (!copy) return;

    const bar = document.createElement("div");
    bar.className = "lang-offer";
    bar.lang = LANGS[want].htmlLang;
    bar.innerHTML =
      '<p>' + copy.text + '</p>' +
      '<button type="button" class="lang-offer__yes" data-hover>' + copy.yes + '</button>' +
      '<button type="button" class="lang-offer__no" data-hover>' + copy.no + '</button>';
    document.body.append(bar);
    const close = () => {
      bar.classList.remove("is-in");
      setTimeout(() => bar.remove(), 500);
    };
    bar.querySelector(".lang-offer__yes").addEventListener("click", () => { applyLanguage(want); close(); });
    bar.querySelector(".lang-offer__no").addEventListener("click", () => {
      try { localStorage.setItem(LANG_KEY, LANG); } catch (e) {}
      close();
    });
    requestAnimationFrame(() => bar.classList.add("is-in"));
  }

  renderSwitch();
  restoreSavedLanguage(); // before the splits below, so the reveal is unaffected

  // chars alone drops the whitespace inside nested tags (the <em> line lost
  // its word gap) — splitting words too keeps real spaces between them
  const heroSplits = gsap.utils.toArray("[data-split]").map((el) =>
    new SplitText(el, { type: "chars,words", charsClass: "char" })
  );
  gsap.set(heroSplits.flatMap((s) => s.chars), { yPercent: 110, opacity: 0 });
  // the script line stays whole — splitting a connected script breaks its ligatures
  gsap.set(".hero__script", { opacity: 0, y: 34, rotate: -3 });
  splitsReady = true;

  const lineSplits = gsap.utils.toArray("[data-split-lines]").map((el) =>
    new SplitText(el, { type: "lines", linesClass: "split-line", mask: "lines" })
  );
  // A line split measured while the layout had no width (a tab created at
  // 0×0, a hidden container) leaves every word on its own line forever.
  // Re-split whenever the document width the lines were measured at changes.
  let lineSplitWidth = document.documentElement.clientWidth;
  const healLineSplits = () => {
    const w = document.documentElement.clientWidth;
    if (w > 0 && w !== lineSplitWidth) {
      lineSplitWidth = w;
      lineSplits.forEach((s) => s.split());
      ScrollTrigger.refresh();
    }
  };
  window.addEventListener("resize", healLineSplits);
  document.addEventListener("visibilitychange", healLineSplits);

  /* ═══════════ PRELOADER SEQUENCE ═══════════ */
  const counter = { value: 0 };
  const countEl = document.getElementById("loaderCount");

  const intro = gsap.timeline({
    defaults: { ease: "power4.inOut" },
    onComplete: () => {
      lenis.start();
      document.getElementById("loader")?.remove(); // may already be gone — don't abort the rest
      healLineSplits();
      ScrollTrigger.refresh();
      offerLanguage(); // once the page has settled, not over the loader
    },
  });

  intro
    .to(".loader__letter", {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: "power3.out",
    })
    .to(counter, {
      value: 100, duration: 1.6, ease: "power2.inOut",
      onUpdate: () => (countEl.textContent = String(Math.round(counter.value)).padStart(2, "0")),
    }, "<0.2")
    .to("#loaderBar", { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, "<")
    .to(".loader__inner", { opacity: 0, y: -40, duration: 0.7 }, "+=0.25")
    .to(".loader__curtain--2", { scaleY: 0, duration: 1.1 }, "<0.15")
    .to(".loader__curtain--1", { scaleY: 0, duration: 1.1 }, "<0.12")
    // hero entrance
    .to(heroSplits.flatMap((s) => s.chars), {
      yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.028, ease: "power4.out",
    }, "-=0.65")
    .to(".hero__script", { opacity: 1, y: 0, rotate: 0, duration: 1.2, ease: "power3.out" }, "-=1.15")
    .to(".hero__eyebrow", { opacity: 1, duration: 1, ease: "power2.out" }, "-=1")
    .from(".hero__sub .split-line", {
      yPercent: 110, duration: 1, stagger: 0.1, ease: "power3.out",
    }, "-=1.1")
    .to("#nav", { opacity: 1, duration: 1, ease: "power2.out" }, "-=0.9")
    .to(".hero__footer", { opacity: 1, duration: 1, ease: "power2.out" }, "-=0.8")
    .from(bookHolder.position, { z: -9, duration: 2.2, ease: "power3.out" }, "-=1.9")
    .from(book.rotation, { y: 1.6, duration: 2.2, ease: "power3.out" }, "<");

  /* ═══════════ HERO SCROLL-OUT ═══════════ */
  gsap.to(".hero__content", {
    yPercent: -18, opacity: 0, ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "75% top", scrub: true },
  });
  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      scrollRotY.value = self.progress * 1.1;
      scrollRotX.value = self.progress * 0.2;
      if (openState.v < 0.001) bookHolder.position.z = self.progress * 1.6;
    },
  });

  /* ═══════════ HERO — slow breathing of the leaf shadows ═══════════ */
  if (!prefersReduced) {
    gsap.to("#leafShadowA", {
      x: 16, rotation: 1.4, transformOrigin: "50% 50%",
      duration: 26, ease: "sine.inOut", yoyo: true, repeat: -1,
    });
    gsap.to("#leafShadowB", {
      x: -14, rotation: -1.1, transformOrigin: "50% 50%",
      duration: 33, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 4,
    });
    gsap.to("#leafShadowC", {
      x: 10, rotation: 1, transformOrigin: "50% 50%",
      duration: 29, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 9,
    });
    gsap.to("#windowShadow", {
      x: 8, duration: 40, ease: "sine.inOut", yoyo: true, repeat: -1,
    });
  }

  /* ═══════════ THE BOOK OPENS — and stays open ═══════════ */
  // final open-spread pose (world units) — layoutBookPages() projects from these.
  // On wide screens the spread sits right of centre with the copy beside it; on
  // narrow/portrait screens there is no room beside it, so it centres and grows
  // to fill the width instead. Recomputed on every ScrollTrigger refresh.
  const OPEN = { x: 1.25, y: 0, z: 2.35, cover: -3.12, scale: 1 };
  function computeOpenPose() {
    const aspect = innerWidth / innerHeight;
    OPEN.y = 0;
    OPEN.z = 2.35;
    if (aspect > 1.1) {
      OPEN.scale = 1;
    } else {
      // the spread is ~4.73 world units wide at scale 1 — fit it to the viewport
      const dist = camera.position.z - OPEN.z;
      const visW = 2 * dist * Math.tan((camera.fov * Math.PI) / 360) * aspect;
      OPEN.scale = Math.min(1, (visW * 0.97) / 4.73);
    }
    // the cover hinges at -W/2, so the open spread centres 1.25*scale left of
    // the holder — offset the holder by the same amount to keep it on screen
    OPEN.x = 1.25 * OPEN.scale;
    return OPEN;
  }
  computeOpenPose();

  const openTl = gsap.timeline({
    defaults: { ease: "none", immediateRender: false },
    scrollTrigger: {
      trigger: "#feelings",
      start: "top top",
      // on a phone the open pages carry no copy, so a 260% hold is over a
      // viewport of blank spread — the sequence gets to the question faster
      end: phoneQ.matches ? "+=170%" : "+=260%",
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true, // re-read the pose below when the viewport changes
      onRefreshInit: computeOpenPose,
    },
  });
  window.__openTl = openTl;
  openTl
    .to(openState, { v: 1, duration: 0.5 }, 0)
    .to(bookHolder.scale, { x: () => OPEN.scale, y: () => OPEN.scale, z: () => OPEN.scale, duration: 0.35, ease: "power1.inOut" }, 0)
    .to(bookHolder.position, { x: () => OPEN.x, y: () => OPEN.y, z: () => OPEN.z, duration: 0.35, ease: "power1.inOut" }, 0)
    .to(bookHolder.rotation, { x: 0, y: 0, duration: 0.32, ease: "power1.inOut" }, 0)
    .to(book.rotation, { x: 0, y: 0, z: 0, duration: 0.32, ease: "power1.inOut" }, 0)
    .to(coverPivot.rotation, { y: OPEN.cover, duration: 0.3, ease: "power1.inOut" }, 0.24)
    .fromTo("#feelingsInner",
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" }, phoneQ.matches ? 0.42 : 0.5)
    // hold — the book stays open while the reader answers
    .to({}, { duration: 0.36 }, 0.64);

  // the book never blinks away: it is gradually covered as the next
  // section scrolls over it, then rendering pauses once fully hidden
  gsap.fromTo("#webgl", { autoAlpha: 1 }, {
    autoAlpha: 0, ease: "none", immediateRender: false,
    scrollTrigger: {
      trigger: "#book",
      start: "top 90%",
      end: "top 25%",
      scrub: true,
      onLeave: () => (heroVisible = false),
      onEnterBack: () => (heroVisible = true),
    },
  });

  /* — project the open pages into screen space for the DOM overlay — */
  const pageLeftEl = document.getElementById("pageLeft");
  const pageRightEl = document.getElementById("pageRight");
  // On phones the projected pages are far too small to hold the copy, so the
  // book becomes a backdrop and CSS lays the panels out full-width instead.
  const narrowQ = phoneQ; // the projection is skipped on phones
  function layoutBookPages() {
    if (narrowQ.matches) {
      for (const el of [pageLeftEl, pageRightEl]) {
        el.style.left = el.style.top = el.style.width = el.style.height = el.style.fontSize = "";
      }
      return;
    }
    camera.updateMatrixWorld();
    // offsets are measured at scale 1 and scale with the open pose
    const s = OPEN.scale;
    const rects = [
      // [el, x1, x2, halfH, zPlane] in world space at the final pose
      [pageLeftEl, OPEN.x - 3.61 * s, OPEN.x - 1.37 * s, 1.66 * s, OPEN.z + 0.31 * s],
      [pageRightEl, OPEN.x - 1.02 * s, OPEN.x + 1.12 * s, 1.66 * s, OPEN.z + 0.215 * s],
    ];
    for (const [el, x1, x2, halfH, zp] of rects) {
      const tl = new THREE.Vector3(x1, halfH, zp).project(camera);
      const br = new THREE.Vector3(x2, -halfH, zp).project(camera);
      const px1 = ((tl.x + 1) / 2) * innerWidth;
      const py1 = Math.max(((1 - tl.y) / 2) * innerHeight, innerHeight * 0.06);
      const px2 = ((br.x + 1) / 2) * innerWidth;
      const py2 = Math.min(((1 - br.y) / 2) * innerHeight, innerHeight * 0.94);
      el.style.left = px1 + "px";
      el.style.top = py1 + "px";
      el.style.width = (px2 - px1) + "px";
      el.style.height = (py2 - py1) + "px";
      el.style.fontSize = Math.max(13, (px2 - px1) / 23) + "px";
    }
  }
  layoutBookPages();
  window.addEventListener("resize", () => { computeOpenPose(); layoutBookPages(); });
  ScrollTrigger.addEventListener("refresh", layoutBookPages);

  /* ═══════════ ROOM — travel down the sunlit wall as you scroll ═══════════ */
  const roomScene = document.getElementById("roomScene");
  gsap.to(roomScene, {
    y: () => -(roomScene.offsetHeight - innerHeight),
    ease: "none",
    scrollTrigger: {
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
  // individual light patches drift at their own pace for depth
  gsap.to("#lightB", {
    x: -80, ease: "none",
    scrollTrigger: { start: 0, end: () => ScrollTrigger.maxScroll(window), scrub: 2 },
  });
  gsap.to("#lightC", {
    x: 70, ease: "none",
    scrollTrigger: { start: 0, end: () => ScrollTrigger.maxScroll(window), scrub: 2.5 },
  });

  /* ═══════════ THE BOOK ACKNOWLEDGES — breeze, light, dust ═══════════ */
  let ackTl = null;
  function bookAcknowledge() {
    if (prefersReduced) return;
    if (ackTl) ackTl.kill();
    bookDust.position.set(0, -0.04, 0);
    bookDust.rotation.z = 0;
    ackTl = gsap.timeline();
    ackTl
      // a soft breeze moves through the leaf shadows
      .to(leafPlane.rotation, { z: 0.012, duration: 0.45, ease: "sine.inOut" }, 0)
      .to(leafPlane.rotation, { z: -0.007, duration: 0.5, ease: "sine.inOut" }, 0.45)
      .to(leafPlane.rotation, { z: 0, duration: 0.6, ease: "sine.inOut" }, 0.95)
      .to(leafPlane.position, { x: "+=0.016", duration: 0.45, ease: "sine.inOut" }, 0)
      .to(leafPlane.position, { x: 0.05, duration: 1.1, ease: "sine.inOut" }, 0.45)
      // the sunlight breathes a little brighter, then settles
      .to(key, { intensity: 2.5, duration: 0.55, ease: "sine.out" }, 0)
      .to(key, { intensity: 2.1, duration: 1.2, ease: "sine.inOut" }, 0.55)
      .to(fill, { intensity: 1.28, duration: 0.55, ease: "sine.out" }, 0)
      .to(fill, { intensity: 1.0, duration: 1.2, ease: "sine.inOut" }, 0.55)
      // illuminated dust appears, floats, and fades
      .to(bookDust.material, { opacity: 0.5, duration: 0.6, ease: "sine.out" }, 0.1)
      .to(bookDust.material, { opacity: 0, duration: 1.1, ease: "sine.inOut" }, 1.0);
  }

  /* ═══════════ FEELINGS — respond to the reader ═══════════ */
  const feelResponsesByLang = {
    es: {
      anxious: "Respira. Este libro fue escrito exactamente para esto.",
      lost: "Estar perdido es donde empieza todo camino de regreso.",
      exhausted: "Está bien descansar. Aquí no tienes que fingir.",
      alone: "No lo estás. Estas páginas se escribieron pensando en ti.",
      afraid: "El miedo solo significa que te importa. Lo cruzaremos con calma.",
      unsure: "No saberlo también es una respuesta. Empecemos juntos.",
    },
  };
  const feelResponses = {
    anxious: "Breathe. This book was written for exactly this.",
    lost: "Being lost is where every way back begins.",
    exhausted: "It’s okay to rest. You don’t have to pretend here.",
    alone: "You’re not. These pages were written with you in mind.",
    afraid: "Fear only means you care. We’ll walk through it gently.",
    unsure: "Not knowing is also an answer. Let’s begin together.",
  };
  const feelResponse = document.getElementById("feelResponse");

  /* — Nicol's letters: which page views belong to each emotion.
       A letter with two spreads carries a printed copy of its first
       right-hand page, so the words can ride the second turn — */
  const letters = {
    anxious: { spreads: [["#pageLeftAnxious", "#pageRightAnx"]] },
    lost: { spreads: [["#pageLeftLost", "#pageRightLost"]] },
    unsure: { spreads: [["#pageLeftUnsure", "#pageRightUnsure"]] },
    exhausted: {
      spreads: [["#pageLeftExh1", "#pageRightExh1"], ["#pageLeftExh2", "#pageRightExh2"]],
      sheetTex: makeLetterSheetTexture([
        "You’re tired of carrying around endless questions, of analyzing every conversation, every decision, every feeling. Of trying to be okay while your mind never stops racing.",
        "And the hardest part is that, often, you can’t even explain why you feel this way.",
        "You just know you’ve been strong for too long.",
      ]),
    },
    alone: {
      spreads: [["#pageLeftAlone1", "#pageRightAlone1"], ["#pageLeftAlone2", "#pageRightAlone2"]],
      sheetTex: makeLetterSheetTexture([
        "But when everything falls silent, you are once again met with that same sense of emptiness that no one else seems to notice.",
        "And that hurts.",
        "It hurts to feel like you have so much to say but don’t know how to explain it.",
        "It hurts to think that, if you were to truly speak up, perhaps no one would understand what is happening inside you.",
        "Over time, you begin to convince yourself that it is better to stay silent.",
        "That your emotions are too much.\nThat asking for company is a burden.\nThat you have to learn to carry it all on your own.",
      ]),
    },
    afraid: {
      spreads: [["#pageLeftAfraid1", "#pageRightAfraid1"], ["#pageLeftAfraid2", "#pageRightAfraid2"]],
      sheetTex: makeLetterSheetTexture([
        "And so, you start to protect yourself.",
        "You overthink.\nYou doubt everything.\nYou look for signs where there are none.\nYou brace yourself for a pain that doesn’t even exist yet.",
        "It is exhausting to live waiting for the worst-case scenario.",
        "But I want to remind you of something…",
      ]),
    },
  };

  // reveal one spread of a letter: left page, right page, then the closing
  // elements — the voice note and invitation on the final spread, or the
  // quiet "keep reading" on an intermediate one
  function revealSpread(tl, letter, index) {
    const [leftView, rightView] = letter.spreads[index];
    const isFinal = index === letter.spreads.length - 1;
    tl.fromTo(leftView,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.3, ease: "sine.out", lazy: false }, 1.6)
      .fromTo(rightView,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.3, ease: "sine.out", lazy: false }, 2.2);
    if (isFinal) {
      tl.fromTo(rightView + " .audio-card",
          { opacity: 0 },
          { opacity: 1, duration: 1.1, ease: "sine.out", lazy: false }, 3.0)
        .fromTo(rightView + " .feelings__continue",
          { opacity: 0 },
          { opacity: 1, pointerEvents: "auto", duration: 1.3, ease: "sine.out", lazy: false }, 3.8)
        .fromTo(rightView + " .read-another",
          { opacity: 0 },
          { opacity: 1, pointerEvents: "auto", duration: 1.2, ease: "sine.out", lazy: false }, 4.3);
    } else {
      tl.fromTo(rightView + " .letter-more",
        { opacity: 0 },
        { opacity: 1, pointerEvents: "auto", duration: 1.3, ease: "sine.out", lazy: false }, 3.4);
    }
  }

  /* — "Keep reading →": the second sheet turns, carrying its printed page — */
  let secondTurned = false;
  document.querySelectorAll(".letter-more").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (secondTurned) return;
      secondTurned = true;
      const letter = letters[btn.dataset.letter];
      const [firstL, firstR] = letter.spreads[0];
      if (letter.sheetTex) {
        turnPage2.material[4].map = letter.sheetTex;
        turnPage2.material[4].needsUpdate = true;
      }
      const tl = gsap.timeline();
      tl.to(firstR, { autoAlpha: 0, duration: 0.06, ease: "none" }, 0)
        .to(turnPivot2.rotation, { y: -3.0, duration: 1.3, ease: "power2.inOut" }, 0.04)
        .to(firstL, { autoAlpha: 0, duration: 0.45, ease: "power1.inOut" }, 0.58);
      revealSpread(tl, letter, 1);
    });
  });

  /* — the page turns to reveal the book's answer — */
  const questionSheetTex = makeQuestionSheetTexture();
  let pageTurned = false;
  let turnCall = null;
  let activeFeel = "anxious"; // which letter led into the story excerpt
  function turnToResponse(feel) {
    if (pageTurned) return;
    pageTurned = true;
    activeFeel = feel;
    // hand the question over to the turning sheet: the DOM overlay vanishes the
    // same instant its printed twin appears on the paper, so the words travel
    // with the page instead of fading to a blank sheet
    turnPage.material[4].map = questionSheetTex;
    turnPage.material[4].needsUpdate = true;
    const tl = gsap.timeline();
    tl.to("#pageRightQ", { autoAlpha: 0, duration: 0.06, ease: "none" }, 0)
      .to(turnPivot.rotation, { y: -3.05, duration: 1.3, ease: "power2.inOut" }, 0.04)
      // the left page's words disappear beneath the arriving sheet
      .to("#pageLeftIntro", { autoAlpha: 0, duration: 0.45, ease: "power1.inOut" }, 0.58);
    if (letters[feel]) {
      // the letter settles in reading order: left half, right half,
      // then the voice note (or an invitation to keep reading)
      revealSpread(tl, letters[feel], 0);
    } else {
      tl.fromTo("#pageRightA",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }, 1.0)
        // once the quote has fully settled, the invitation breathes in
        .fromTo("#feelContinue",
          { opacity: 0 },
          { opacity: 1, pointerEvents: "auto", duration: 1.3, ease: "sine.out", lazy: false }, 1.95);
    }
  }

  /* ═══════════ PHONE · THE LETTER, FULL SCREEN ═══════════
     A projected page is ~170px wide on a phone, so below 760px nothing is
     typeset onto the book. Choosing a feeling instead MOVES that letter's
     views into #letterSheet and opens it over the page.

     Moved, not cloned, and deliberately: the voice-note card keeps the
     listener it was given at load, the copy stays a single source of truth
     for i18n, and closeLetterSheet() returns every node to the exact place
     it came from. One surface, one scroll, no pinning — which is what the
     old nested scroll box inside the pinned section could never offer. */
  const sheetEl = document.getElementById("letterSheet");
  const sheetInner = document.getElementById("sheetInner");
  const sheetScroll = document.getElementById("sheetScroll");
  const sheetTitle = document.getElementById("sheetTitle");
  const sheetBack = document.getElementById("sheetBack");
  let sheetHome = [];          // [node, parent, nextSibling] for every borrowed view
  let sheetIsOpen = false;

  function sheetBorrow(sel) {
    const el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!el || el.parentNode === sheetInner) return;
    sheetHome.push([el, el.parentNode, el.nextSibling]);
    sheetInner.appendChild(el);
  }

  function openLetterSheet(feel) {
    if (sheetIsOpen) return;
    sheetIsOpen = true;
    activeFeel = feel;
    const chip = document.querySelector('.feel[data-feel="' + feel + '"]');
    sheetTitle.textContent = chip ? chip.textContent.trim() : "";
    const letter = letters[feel];
    if (letter) {
      // every spread in reading order — a phone scrolls, so there is no reason
      // to hold the second half behind a "keep reading" link
      letter.spreads.flat().forEach(sheetBorrow);
    } else {
      sheetBorrow("#pageRightA");
    }
    sheetBorrow("#excerptBridge");
    sheetEl.hidden = false;
    document.body.classList.add("sheet-open");
    lenis.stop();               // the page behind must not scroll with it
    sheetScroll.scrollTop = 0;
    requestAnimationFrame(() => sheetEl.classList.add("is-open"));
    sheetBack.focus({ preventScroll: true });
  }

  function closeLetterSheet() {
    if (!sheetIsOpen) return;
    sheetIsOpen = false;
    audioCards.forEach((c) => c.stop && c.stop());
    sheetEl.classList.remove("is-open");
    document.body.classList.remove("sheet-open");
    lenis.start();
    const putBack = () => {
      sheetEl.hidden = true;
      for (const [el, parent, next] of sheetHome) parent.insertBefore(el, next);
      sheetHome = [];
      sheetExcerptOpen = false;
    };
    if (prefersReduced) putBack(); else setTimeout(putBack, 460);
    document.querySelectorAll(".feel").forEach((b) => b.classList.remove("is-active", "is-glow"));
  }

  let sheetExcerptOpen = false;
  sheetBack.addEventListener("click", closeLetterSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheetIsOpen) closeLetterSheet();
  });

  // links inside the letter: "Turn to the page" opens the excerpt in place,
  // anything else closes the letter and carries on down the page
  sheetInner.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || !sheetIsOpen) return;
    e.preventDefault();
    if (a.id === "excerptOpen") {
      if (sheetExcerptOpen) return;
      sheetExcerptOpen = true;
      const lines = excerptClosings[activeFeel] || excerptClosings.anxious;
      closingParas[0].textContent = lines[0];
      closingParas[1].innerHTML = "<em>" + lines[1] + "</em>";
      a.style.display = "none";
      sheetBorrow("#excerptLeft");
      sheetBorrow("#excerptRight");
      requestAnimationFrame(() => {
        document.getElementById("excerptLeft").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    const href = a.getAttribute("href");
    closeLetterSheet();
    if (href && href.length > 1) {
      setTimeout(() => lenis.scrollTo(href, { duration: 1.4 }), 500);
    }
  });

  document.querySelectorAll(".feel").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (pageTurned || resetting || sheetIsOpen) return;
      document.querySelectorAll(".feel").forEach((b) => b.classList.remove("is-active", "is-glow"));
      btn.classList.add("is-active");
      void btn.offsetWidth; // restart the glow animation cleanly
      btn.classList.add("is-glow");
      feelResponse.textContent = (feelResponsesByLang[LANG] || feelResponses)[btn.dataset.feel];
      bookAcknowledge();                      // leaves stir, light brightens
      if (phoneQ.matches) {
        // …and the letter arrives full-screen instead of on the pages
        gsap.delayedCall(0.5, () => openLetterSheet(btn.dataset.feel));
        return;
      }
      if (turnCall) turnCall.kill();
      turnCall = gsap.delayedCall(1.05, () => turnToResponse(btn.dataset.feel)); // …then the page turns
    });
  });

  /* — "Or revisit another feeling": close the letter, fold the pages back,
       and return the reader to the question to choose again — */
  const allLetterViews = [...new Set(
    Object.values(letters).flatMap((l) => l.spreads.flat())
  )].join(", ");

  let resetting = false;
  function resetToQuestion() {
    if (resetting) return;
    resetting = true;
    gsap.timeline()
      // the letter (or the story excerpt) quietly closes
      .to(allLetterViews + ", #pageRightA, #excerptBridge, #excerptLeft, #excerptRight",
        { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" }, 0)
      .set("#excerptClosing", { autoAlpha: 0 }, 0)
      // the turned sheets fold back onto the right-hand stack
      .to(turnPivot2.rotation, { y: 0, duration: 1.0, ease: "power2.inOut" }, 0.25)
      .to(turnPivot.rotation, { y: 0, duration: 1.1, ease: "power2.inOut" }, 0.35)
      // clear the sheets' printed faces so the returning DOM question isn't doubled
      .call(() => {
        turnPage.material[4].map = rightPageTex;
        turnPage.material[4].needsUpdate = true;
        turnPage2.material[4].map = rightPageTex;
        turnPage2.material[4].needsUpdate = true;
      }, null, 0.55)
      // the question and its prompt return
      .fromTo("#pageRightQ", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "sine.out" }, 1.15)
      .fromTo("#pageLeftIntro", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "sine.out" }, 1.15)
      // the book is ready for a new choice
      .call(() => { pageTurned = false; secondTurned = false; resetting = false; excerptStarted = false; excerptOpened = false; });
    document.querySelectorAll(".feel").forEach((b) => b.classList.remove("is-active", "is-glow"));
  }

  // place the quiet link beneath every letter's final "Continue with me"
  document.querySelectorAll(".fpage__view--letter .feelings__continue[href='#book']").forEach((cont) => {
    const link = document.createElement("a");
    link.href = "#";
    link.className = "read-another";
    link.textContent = "Or revisit another feeling";
    link.setAttribute("data-i18n", "feel.revisit"); // created here, so tag it for i18n
    link.setAttribute("data-hover", "");
    link.addEventListener("click", (e) => { e.preventDefault(); resetToQuestion(); });
    cont.after(link);
    if (LANG !== DEFAULT_LANG) applyTo(link.parentNode, LANG); // built after the initial pass
  });

  /* ═══════════ NICOL'S VOICE NOTES — one per letter ═══════════ */
  const audioCards = [];
  document.querySelectorAll(".audio-card").forEach((card) => {
    const glyph = card.querySelector(".audio-card__btn");
    const label = card.querySelector(".audio-card__label");
    const progress = card.querySelector(".audio-card__line span");
    const state = { card, glyph, voiceNote: null, playing: false };
    audioCards.push(state);
    const stop = () => {
      if (state.voiceNote) state.voiceNote.pause();
      state.playing = false;
      card.classList.remove("is-playing");
      glyph.textContent = "▶";
    };
    state.stop = stop;
    card.addEventListener("click", () => {
      if (!state.voiceNote) {
        const voiceNote = (state.voiceNote = new Audio(card.dataset.audio));
        voiceNote.addEventListener("timeupdate", () => {
          if (voiceNote.duration) {
            progress.style.width = (voiceNote.currentTime / voiceNote.duration) * 100 + "%";
          }
        });
        voiceNote.addEventListener("ended", () => {
          stop();
          progress.style.width = "0%";
          beginExcerpt(); // as the voice note ends, the book invites them deeper
        });
        voiceNote.addEventListener("error", () => {
          stop();
          glyph.textContent = "♥";
          label.textContent = "Nicol’s message is on its way";
          // even without the recording, the journey continues after a gentle beat
          gsap.delayedCall(2.2, beginExcerpt);
        });
      }
      if (state.playing) {
        stop();
      } else {
        audioCards.forEach((other) => other !== state && other.stop());
        state.voiceNote.play().then(() => {
          state.playing = true;
          card.classList.add("is-playing");
          glyph.textContent = "❚❚";
        }).catch(() => { /* the error handler shows the gentle fallback */ });
      }
    });
  });

  /* ═══════════ INTO THE BOOK — a page of the story, as the voice note ends ═══════════ */
  // Nicol's closing words after the excerpt — a different note for each feeling
  const excerptClosings = {
    anxious: ["If these words resonated with you, there is still much to discover.", "This is just the beginning of the journey back to yourself."],
    afraid: ["I lived too long letting fear write my story.", "These pages were the first chapter I wrote with hope."],
    exhausted: ["There’s a kind of exhaustion that sleep can’t cure.", "I hope these pages can give you the rest I was also searching for."],
    alone: ["There are words that only those who have also learned to cry in silence can write.", "If you feel alone today, perhaps these pages have been waiting for you for a long time."],
    lost: ["I wish someone had put these pages in my hands when I felt like this.", "Today I want to put them in yours."],
    unsure: ["We don’t always need answers.", "Sometimes we just need someone to understand the weight we carry inside."],
  };
  const closingParas = document.querySelectorAll("#excerptClosing p");

  let excerptStarted = false;
  let excerptOpened = false;
  function beginExcerpt() {
    if (excerptStarted || resetting) return;
    if (phoneQ.matches) return; // the bridge is already in the open letter
    excerptStarted = true;
    // set the closing to match the feeling that led here
    const lines = excerptClosings[activeFeel] || excerptClosings.anxious;
    closingParas[0].textContent = lines[0];
    closingParas[1].innerHTML = "<em>" + lines[1] + "</em>";
    // the letter softly clears, and a quiet invitation surfaces
    gsap.timeline()
      .to(allLetterViews, { autoAlpha: 0, duration: 0.8, ease: "power1.inOut" }, 0)
      .fromTo("#excerptBridge", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.3, ease: "sine.out", lazy: false }, 0.6)
      .fromTo("#excerptOpen",
        { opacity: 0 },
        { opacity: 1, pointerEvents: "auto", duration: 1.1, ease: "sine.out", lazy: false }, 1.7);
  }

  function revealExcerpt() {
    if (excerptOpened) return;
    if (phoneQ.matches) return; // handled inside #letterSheet
    excerptOpened = true;
    gsap.timeline()
      .to("#excerptBridge", { autoAlpha: 0, duration: 0.7, ease: "power1.inOut" }, 0)
      // a breath of warmer light, as if turning deeper into the book
      .to(key, { intensity: 2.45, duration: 0.7, ease: "sine.out" }, 0)
      .to(key, { intensity: 2.1, duration: 1.4, ease: "sine.inOut" }, 0.7)
      // the actual pages of the story settle in
      .fromTo("#excerptLeft", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "sine.out", lazy: false }, 0.5)
      .fromTo("#excerptRight", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "sine.out", lazy: false }, 0.75)
      // once there's been a moment to read, the closing arrives at the end
      .fromTo("#excerptClosing", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.3, ease: "sine.out", lazy: false }, 4.6);
  }

  const excerptOpenBtn = document.getElementById("excerptOpen");
  if (excerptOpenBtn) {
    excerptOpenBtn.addEventListener("click", (e) => { e.preventDefault(); revealExcerpt(); });
  }

  /* ═══════════ A BREATH BETWEEN CHAPTERS ═══════════ */
  // each chapter settles in like the first page of a printed book:
  // stillness → the title breathes in through the thinning veil → the intro follows
  const veil = document.getElementById("chapterVeil");
  const veilGlow = veil.querySelector("span");
  const chapterIntros = [
    { sel: "#book", title: ".reviews__label", intro: ".review--feature" },
    { sel: ".chapters", title: [".chapters__label", ".chapters__title"], intro: ".chapters__sub" },
    { sel: ".author", title: [".author__label", ".author__name"], intro: [".author__bio", ".author__link"] },
    { sel: ".editions", title: ".editions__head", intro: null },
  ];
  // chapter headings wait, unseen, for their entrance
  chapterIntros.forEach((c) => {
    gsap.set([c.title, c.intro].flat().filter(Boolean), { opacity: 0 });
  });

  let veilBusy = false;
  function chapterStillness(c) {
    const reveal = [c.title].flat();
    const revealIntro = c.intro ? [c.intro].flat() : null;
    if (prefersReduced) {
      gsap.set(reveal.concat(revealIntro || []), { opacity: 1 });
      return;
    }
    if (veilBusy) {
      // a second chapter crossed during a breath — reveal it quietly, no veil
      gsap.to(reveal, { opacity: 1, duration: 1.2, ease: "sine.out", lazy: false });
      if (revealIntro) gsap.to(revealIntro, { opacity: 1, duration: 1.2, ease: "sine.out", delay: 0.3, lazy: false });
      return;
    }
    veilBusy = true;
    const tl = gsap.timeline({ onComplete: () => (veilBusy = false) });
    tl.set(veil, { visibility: "visible" }, 0)
      .fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "sine.out" }, 0)
      .fromTo(veilGlow, { scale: 0.96 }, { scale: 1.05, duration: 1.4, ease: "sine.inOut" }, 0)
      .to(veil, { opacity: 0, duration: 0.6, ease: "sine.inOut" }, 0.8) // rise, hold ~0.5s, dissolve
      // the title emerges through the thinning veil — a pure, unhurried fade
      .to(reveal, { opacity: 1, duration: 1.4, ease: "sine.out", lazy: false }, 0.75)
      .set(veil, { visibility: "hidden" }, 1.4);
    // …and a breath later, the introductory text settles in beneath it
    if (revealIntro) tl.to(revealIntro, { opacity: 1, duration: 1.4, ease: "sine.out", lazy: false }, 1.1);
  }
  chapterIntros.forEach((c) => {
    ScrollTrigger.create({
      trigger: c.sel,
      start: "top 72%",
      once: true,
      onEnter: () => chapterStillness(c),
    });
  });

  /* ═══════════ REVIEWS — each voice settles in softly ═══════════ */
  // the label and the featured quote are revealed by the chapter-stillness
  // sequence; the rest arrive one by one as the reader moves down the page
  gsap.utils.toArray(".reviews__pair .review, .reviews__orn, .review--closing").forEach((el) => {
    gsap.set(el, { opacity: 0 });
    gsap.to(el, {
      opacity: 1, duration: 1.5, ease: "sine.out", lazy: false,
      scrollTrigger: { trigger: el, start: "top 80%", once: true },
    });
  });

  /* ═══════════ CHAPTERS — pinned horizontal scroll ═══════════ */
  const chTrack = document.getElementById("chaptersTrack");
  const getScroll = () => chTrack.scrollWidth - innerWidth + innerWidth * 0.06;

  if (phoneQ.matches) {
    // native snap carousel — the gesture people already expect, and every card
    // arrives whole. CSS does the scrolling; this only keeps the dots honest.
    const dots = document.createElement("div");
    dots.className = "chapters__dots";
    const cards = [...chTrack.children];
    cards.forEach(() => dots.appendChild(document.createElement("span")));
    chTrack.after(dots);
    const marks = [...dots.children];
    const syncDots = () => {
      const mid = chTrack.scrollLeft + chTrack.clientWidth / 2;
      let near = 0, best = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < best) { best = d; near = i; }
      });
      marks.forEach((m, i) => m.classList.toggle("is-on", i === near));
    };
    chTrack.addEventListener("scroll", syncDots, { passive: true });
    syncDots();
  } else {
    gsap.to(chTrack, {
      x: () => -getScroll(),
      ease: "none",
      scrollTrigger: {
        trigger: "#chaptersPin",
        start: "top top",
        end: () => "+=" + getScroll(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }
  // the chapters head is revealed by the chapter-stillness sequence
  gsap.utils.toArray(".chapter").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0, y: 80, duration: 1, delay: i * 0.08, ease: "power3.out",
      scrollTrigger: { trigger: ".chapters", start: "top 45%" },
    });
  });

  /* ═══════════ QUOTE — parallax + line reveal ═══════════ */
  gsap.from(".quote__text .split-line", {
    yPercent: 110, duration: 1.2, stagger: 0.12, ease: "power4.out",
    scrollTrigger: { trigger: ".quote", start: "top 65%" },
  });
  gsap.from(".quote__cite", {
    opacity: 0, duration: 1.4, ease: "power2.out",
    scrollTrigger: { trigger: ".quote", start: "top 50%" },
  });
  gsap.to(".quote__mark", {
    yPercent: 42, ease: "none",
    scrollTrigger: { trigger: ".quote", start: "top bottom", end: "bottom top", scrub: true },
  });

  /* ═══════════ AUTHOR — clip reveal + parallax portrait ═══════════ */
  gsap.from("#authorFrame", {
    clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "power4.inOut",
    scrollTrigger: { trigger: ".author", start: "top 62%" },
  });
  gsap.fromTo(".author__portrait",
    { yPercent: -9 }, { yPercent: 9, ease: "none",
      scrollTrigger: { trigger: ".author", start: "top bottom", end: "bottom top", scrub: true },
    });
  // the author heading and bio are revealed by the chapter-stillness sequence

  /* ═══════════ EDITIONS — stagger up ═══════════ */
  // the editions head is revealed by the chapter-stillness sequence
  gsap.from(".edition", {
    opacity: 0, y: 90, duration: 1.2, stagger: 0.14, ease: "power3.out",
    scrollTrigger: { trigger: ".editions__grid", start: "top 78%" },
  });

  /* ═══════════ FOOTER — big word scale ═══════════ */
  const footSplit = new SplitText("#footerBig", { type: "chars", charsClass: "char" });
  gsap.from(footSplit.chars, {
    yPercent: 105, duration: 1.3, stagger: 0.05, ease: "power4.out",
    scrollTrigger: { trigger: ".footer", start: "top 65%" },
  });
  gsap.from([".footer__hint", ".footer__form"], {
    opacity: 0, y: 30, duration: 1, stagger: 0.15, ease: "power3.out",
    scrollTrigger: { trigger: ".footer", start: "top 55%" },
  });

  render();
});
