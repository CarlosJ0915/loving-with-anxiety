/* ═══════════════════════════════════════════════
   scene/renderer — the canvas, camera, lights and WebGL context.
   Evaluated before scene/book.js, which needs `renderer` for anisotropy.
   ═══════════════════════════════════════════════ */
import * as THREE from "three";
import { LITE } from "../config.js?v=95";

/* ═══════════ THREE.JS — THE BOOK ═══════════ */
const canvas = document.getElementById("webgl");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 60);
camera.position.set(0, 0.1, 8.5);

/* MSAA and a preserved drawing buffer are both expensive on a mobile GPU:
   preserveDrawingBuffer blocks the compositor from discarding the buffer after
   every frame, and MSAA costs the most on exactly the large flat surfaces this
   book is made of. Both go on LITE.

   Pixel ratio stays at 1.5 rather than dropping to 1.25: an iPhone is a 3x
   display, so 1.25 renders at 42% of native and upscales — the jacket type is
   the one thing on the page that cannot afford to go soft. The frame throttle
   below buys back more than the extra pixels cost. */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !LITE,
  alpha: true,
  preserveDrawingBuffer: !LITE,
  powerPreference: LITE ? "low-power" : "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.5 : 2));

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

export { canvas, scene, camera, renderer, key, rim, fill };
