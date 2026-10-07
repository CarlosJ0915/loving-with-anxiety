/* ═══════════════════════════════════════════════
   scene/loop — mouse parallax, the render loop, and the resize handler.

   heroVisible is written from the scroll choreography but read here every
   frame, so it lives behind setHeroVisible() rather than being exported
   directly: an imported binding cannot be assigned to.
   ═══════════════════════════════════════════════ */
import * as THREE from "three";
import { prefersReduced, LITE } from "../config.js?v=79";
import { scene, camera, renderer } from "./renderer.js?v=79";
import {
  book, bookHolder, floatHolder, motes, bookDust,
  openState, layoutScene,
} from "./book.js?v=79";

/* — mouse parallax — */
const mouse = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / innerHeight - 0.5) * 2;
});

/* — render loop — */
const clock = new THREE.Clock();
let heroVisible = true;

/* On a phone the book only ever breathes — a slow float and a drift of motes.
   Half the frames carry that motion just as well, and halving the frame count
   halves the GPU time the scene costs while the reader is scrolling past it.
   Rendering also stops entirely when the tab is backgrounded. */
const FRAME_MS = LITE ? 1000 / 30 : 0;
let lastFrame = 0;
let docHidden = false;
document.addEventListener("visibilitychange", () => {
  docHidden = document.hidden;
});

function render(now = 0) {
  requestAnimationFrame(render);
  if (docHidden) return;
  if (FRAME_MS && now - lastFrame < FRAME_MS) return;
  lastFrame = now;

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

/* the choreography calls this as the book scrolls in and out of view */
function setHeroVisible(v) { heroVisible = v; }

export { render, setHeroVisible, mouse, scrollRotY, scrollRotX };
