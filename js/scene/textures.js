/* ═══════════════════════════════════════════════
   scene/textures — everything on this book is painted into a canvas at
   runtime rather than loaded as an image: the jacket, the paper, the leaf
   shadow, the question sheet and each letter page. Keeps the repo small and
   lets the 3D type render in the same web fonts as the rest of the page.

   Pure drawing: nothing here reads the active language. createCoverTexture
   takes the wording it should paint, so the caller owns that decision.
   ═══════════════════════════════════════════════ */
import * as THREE from "three";
import { COVER, DEFAULT_LANG } from "../i18n.js?v=78";
import { renderer } from "./renderer.js?v=78";

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

function createCoverTexture(lang) {
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


export {
  ovalLeaf, frond,
  makePaperTexture, makeLeafShadowTexture,
  makeQuestionSheetTexture, makeLetterSheetTexture,
  drawHeart, drawSprigs, createCoverTexture,
};
