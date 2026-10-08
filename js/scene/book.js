/* ═══════════════════════════════════════════════
   scene/book — the book itself: boards hinged at the spine, a page block,
   the two sheets that peel over for a page turn, the leaf shadow falling
   across the jacket, and the motes of dust around it.

   Real geometry rather than a video or a sprite sheet, so it answers to
   scroll position continuously and stays sharp at any viewport size.
   ═══════════════════════════════════════════════ */
import * as THREE from "three";
import { phoneQ } from "../config.js?v=97";
import { scene, camera } from "./renderer.js?v=97";
import {
  ovalLeaf, frond,
  makePaperTexture, makeLeafShadowTexture,
} from "./textures.js?v=97";

const book = new THREE.Group();

const slateMat = new THREE.MeshStandardMaterial({ color: 0xded3c1, roughness: 0.62, metalness: 0.04 });
const spineMat = new THREE.MeshStandardMaterial({ color: 0xc9b48c, roughness: 0.6, metalness: 0.12 });
// The jacket wraps: the back carries the artwork's imagery, the board edges take
// a colour sampled from it. Both were one flat cream before, which read as bare
// card wherever the book turned away from the reader.
const backMat = new THREE.MeshStandardMaterial({ color: 0xded3c1, roughness: 0.66, metalness: 0.03 });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xded3c1, roughness: 0.62, metalness: 0.04 });
const pageMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf5, roughness: 0.9, metalness: 0 });
const gildMat = new THREE.MeshStandardMaterial({ color: 0xd8c295, roughness: 0.25, metalness: 0.75 });

// front-cover face — receives the painted cover art once fonts are ready
const coverFaceMat = new THREE.MeshStandardMaterial({ color: 0xe6ddcd, roughness: 0.55, metalness: 0.02 });

const W = 2.5, H = 3.6, D = 0.62, CT = 0.09; // width, height, depth, cover thickness

const coverGeo = new THREE.BoxGeometry(W, H, CT);
// BoxGeometry material order: +x, -x, +y, -y, +z, -z — cover art on the outward (+z) face,
// cream on the inward (-z) face so the inside of the cover reads as paper when opened
const innerMat = new THREE.MeshStandardMaterial({ color: 0xf6f1e4, roughness: 0.85, metalness: 0 });
const front = new THREE.Mesh(coverGeo, [edgeMat, edgeMat, edgeMat, edgeMat, coverFaceMat, innerMat]);
// hinge the front cover at the spine so it can swing open on scroll
const coverPivot = new THREE.Group();
coverPivot.position.set(-W / 2, 0, D / 2 - CT / 2);
front.position.x = W / 2;
coverPivot.add(front);
// order is +x, -x, +y, -y, +z, -z — -z faces out the back of the book
const back = new THREE.Mesh(coverGeo, [edgeMat, edgeMat, edgeMat, edgeMat, innerMat, backMat]);
back.position.z = -D / 2 + CT / 2;

// Only the outward (-x) face of the spine wears the jacket. The inward (+x)
// face is what shows in the gutter once the book is open, and a printed strip
// there reads as a photograph wedged between the pages — no book looks like
// that. It keeps the flat binding colour the whole spine used to have.
const spineInnerMat = new THREE.MeshStandardMaterial({ color: 0xc9b48c, roughness: 0.6, metalness: 0.12 });
const spine = new THREE.Mesh(
  new THREE.BoxGeometry(CT, H + 0.008, D + 0.008),
  [spineInnerMat, spineMat, spineInnerMat, spineInnerMat, spineInnerMat, spineInnerMat]
);
spine.position.x = -W / 2 + CT / 2 - 0.006;

const pages = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, H - 0.12, D - CT * 2 - 0.015), pageMat);
pages.position.x = 0.05;

// gilded page edge (thin gold slab on the fore-edge)
const gild = new THREE.Mesh(new THREE.BoxGeometry(0.012, H - 0.12, D - CT * 2 - 0.015), gildMat);
gild.position.x = 0.05 + (W - 0.16) / 2;

book.add(coverPivot, back, spine, pages, gild);

/* — premium paper: warm ivory, grain, fibres, afternoon leaf shadows — */
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

export {
  book, bookHolder, floatHolder, coverPivot, coverFaceMat,
  backMat, edgeMat, spineMat,
  pageMat, gildMat, W,
  turnPivot, turnPage, turnPivot2, turnPage2,
  leafPlane, rightPageTex, leftPageTex,
  bookDust, motes,
  openState, layoutScene,
};
