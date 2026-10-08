/* ═══════════════════════════════════════════════
   BY FRANCIA — The Luminous Mind
   Motion: Lenis + GSAP ScrollTrigger + Three.js

   Entry point. The device questions, the smooth scroll, the cursor, the
   ambient layers and the whole Three.js scene now live in their own modules;
   what remains here is the scroll choreography — everything that has to wait
   for the fonts before it can measure or split text.

   ?v= on each import is bumped with the one in index.html: these are separate
   HTTP requests and the browser caches them independently of main.js.
   ═══════════════════════════════════════════════ */

import * as THREE from "three"; // layoutBookPages projects world points to screen
import { DEFAULT_LANG } from "./i18n.js?v=95";
import { initI18n } from "./i18n-runtime.js?v=95";
import { prefersReduced, phoneQ, LITE } from "./config.js?v=95";
import { lenis } from "./scroll.js?v=95";
import "./cursor.js?v=95";
import "./ambient.js?v=95";
import { camera, key, fill } from "./scene/renderer.js?v=95";
import {
  book, bookHolder, coverPivot, coverFaceMat, W,
  backMat, edgeMat, spineMat,
  turnPivot, turnPage, turnPivot2, turnPage2,
  leafPlane, rightPageTex, bookDust,
  openState,
} from "./scene/book.js?v=95";
import { render, setHeroVisible, scrollRotY, scrollRotX } from "./scene/loop.js?v=95";
import {
  createCoverTexture, loadCoverArt,
  createBackCoverTexture, createSpineTexture, sampleCoverEdgeColour,
  makeQuestionSheetTexture, makeLetterSheetTexture,
} from "./scene/textures.js?v=95";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ═══════════ TEXT SPLITTING ═══════════ */
document.fonts.ready.then(() => {

  // Paint the cover once the artwork and the exact faces it needs are here.
  // The fonts still matter: if the artwork fails to load, createCoverTexture
  // falls back to drawing the jacket, and that needs them.
  Promise.all([
    loadCoverArt("assets/art/cover.jpg?v=1"),
    document.fonts.load('400 238px "Cormorant Garamond"'),
    document.fonts.load('300 46px "Manrope"'),
    document.fonts.load('400 58px "Manrope"'),
  ]).then(() => {
    repaintCover();
  });
  // Repaints on a language change. With photographic artwork that redraws the
  // same image — the title lives in the file, not in the code — but the call
  // stays so the drawn fallback still follows the language.
  function repaintCover(lang = i18n.getLang()) {
    const old = coverFaceMat.map;
    coverFaceMat.map = createCoverTexture(lang);
    coverFaceMat.color.set(0xffffff);
    coverFaceMat.needsUpdate = true;
    if (old) old.dispose();
    wrapJacket();
  }

  /* Carry the jacket around the rest of the book. Without this the back board
     and the board edges stay flat cream, which reads as bare card the moment
     the book turns away from the reader. Runs once — the artwork does not
     change with the language. */
  let jacketWrapped = false;
  function wrapJacket() {
    if (jacketWrapped) return;
    const backTex = createBackCoverTexture();
    const spineTex = createSpineTexture();
    const edge = sampleCoverEdgeColour();
    if (!backTex || !spineTex || edge == null) return; // no artwork; leave the cream
    backMat.map = backTex;
    backMat.color.set(0xffffff);
    backMat.needsUpdate = true;
    spineMat.map = spineTex;
    spineMat.color.set(0xffffff);
    spineMat.needsUpdate = true;
    edgeMat.color.setHex(edge);
    edgeMat.needsUpdate = true;
    jacketWrapped = true;
  }

  /* ═══════════ LANGUAGE ═══════════
     The machinery lives in js/i18n-runtime.js so continue.html shares it.
     This page passes the two hooks only it needs: SplitText instances hold
     references to the DOM they created, so they are reverted before the text
     swap and re-run after it; and the book's jacket is a canvas texture, so
     it is repainted in the new language rather than restyled. */
  let splitsReady = false;
  const i18n = initI18n({
    beforeSwap: () => {
      if (!splitsReady) return;
      heroSplits.forEach((s) => s.revert());
      lineSplits.forEach((s) => s.revert());
    },
    afterSwap: (lang) => {
      if (splitsReady) {
        heroSplits.forEach((s) => s.split());
        lineSplits.forEach((s) => s.split());
        ScrollTrigger.refresh();
      }
      repaintCover(lang);
    },
  });
  const applyLanguage = i18n.applyLanguage;
  const applyTo = i18n.applyTo;
  const offerLanguage = i18n.offerLanguage;

  i18n.restoreSavedLanguage(); // before the splits below, so the reveal is unaffected

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
    .from(".hero__cta", {
      autoAlpha: 0, y: 16, duration: 0.9, ease: "power3.out",
    }, "-=0.95")
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
  // Each of these groups is drawn through a feGaussianBlur. Safari re-rasterises
  // a filtered group when it is transformed, so an endless breathing tween on
  // four of them is a permanent raster cost for motion measured in single
  // pixels over half a minute. The shadows stay — they just hold still.
  if (!prefersReduced && !LITE) {
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

  /* — the hero button lands on the question, not on the section —
       #feelings is pinned for 260% of the viewport, and its first screenful
       is the book still closed. A plain anchor to the section top therefore
       drops the reader before anything has happened. Scroll instead to the
       point in the pinned timeline where the spread is open and the question
       has finished fading in (the hold runs 0.64 → 1).
       Captured on document so it runs before the generic anchor handler in
       scroll.js, which would otherwise scroll to the section top. */
  function questionScrollY() {
    const st = openTl.scrollTrigger;
    return st.start + (st.end - st.start) * 0.72;
  }
  document.addEventListener("click", (e) => {
    const cta = e.target.closest?.(".hero__cta");
    if (!cta) return;
    e.preventDefault();
    e.stopPropagation();
    lenis.scrollTo(questionScrollY(), { duration: 2.1 });
  }, true);

  // the book never blinks away: it is gradually covered as the next
  // section scrolls over it, then rendering pauses once fully hidden
  gsap.fromTo("#webgl", { autoAlpha: 1 }, {
    autoAlpha: 0, ease: "none", immediateRender: false,
    scrollTrigger: {
      trigger: "#book",
      start: "top 90%",
      end: "top 25%",
      scrub: true,
      onLeave: () => setHeroVisible(false),
      onEnterBack: () => setHeroVisible(true),
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
  // The wall is a 2,700px SVG carrying five blurred groups. Scrubbing it against
  // scroll asks Safari to re-rasterise those filters on the same frames that are
  // already running the book, the pinned spread and the copy reveals — the one
  // moment a phone has least to spare. On LITE the wall holds its position; it
  // is a lit backdrop either way, and nothing about it is removed.
  const roomScene = document.getElementById("roomScene");
  if (!LITE) {
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
  }

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
  // testing hooks, like __openTl — the sheet is otherwise only reachable
  // through a delayedCall, which a throttled tab never fires
  window.__openSheet = openLetterSheet;
  window.__closeSheet = closeLetterSheet;
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
      feelResponse.textContent = (feelResponsesByLang[i18n.getLang()] || feelResponses)[btn.dataset.feel];
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
  // matched on the i18n key rather than the href: "Continue with me" now leaves
  // for continue.html, and keying off the destination broke this silently once
  document.querySelectorAll('.fpage__view--letter .feelings__continue[data-i18n="feel.continue"]').forEach((cont) => {
    const link = document.createElement("a");
    link.href = "#";
    link.className = "read-another";
    link.textContent = "Or revisit another feeling";
    link.setAttribute("data-i18n", "feel.revisit"); // created here, so tag it for i18n
    link.setAttribute("data-hover", "");
    link.addEventListener("click", (e) => { e.preventDefault(); resetToQuestion(); });
    cont.after(link);
    if (i18n.getLang() !== DEFAULT_LANG) applyTo(link.parentNode, i18n.getLang()); // built after the initial pass
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
        // the letter stays put when the message finishes — the card resets so it
        // can be played again, and the reader keeps both ways on from here
        voiceNote.addEventListener("ended", () => {
          stop();
          progress.style.width = "0%";
        });
        // no recording yet: the card settles into its heart state and the letter
        // stays exactly where it is, same as when a message finishes playing
        voiceNote.addEventListener("error", () => {
          stop();
          glyph.textContent = "♥";
          label.textContent = "Nicol’s message is on its way";
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
