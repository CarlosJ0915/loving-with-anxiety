/* ═══════════════════════════════════════════════
   checkout.html — choosing a format.

   Deliberately does not take a payment. The card fields on this page are an
   inert visual placeholder (see the comment around #cardMount in the markup):
   card details must never be typed into inputs this site controls. When a
   provider is chosen, its Elements mount into #cardMount and this file gains
   the confirm call — nothing else here changes.
   ═══════════════════════════════════════════════ */

import { prefersReduced } from "./config.js?v=92";
import { lenis } from "./scroll.js?v=92";
import "./cursor.js?v=92";
import { initI18n } from "./i18n-runtime.js?v=92";

const i18n = initI18n();
i18n.restoreSavedLanguage();
lenis.start();

/* ═══════════ WHICH FORMAT ═══════════ */
const PLANS = { digital: "9.99", experience: "24.99", printed: "39.99" };
const plans = [...document.querySelectorAll(".plan")];

/* arriving from continue.html: ?path=read lands on the digital format,
   ?path=listen on the full experience, which is the one with the audio */
const wanted = new URLSearchParams(location.search).get("path");
const fromPath = wanted === "listen" ? "experience" : wanted === "read" ? "digital" : null;

function choose(key) {
  plans.forEach((p) => p.classList.toggle("is-chosen", p.dataset.plan === key));
  try { sessionStorage.setItem("byfrancia-plan", key); } catch (e) {}
}

plans.forEach((p) => {
  p.querySelector(".plan__pick").addEventListener("click", () => {
    choose(p.dataset.plan);
    document.getElementById("pay").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  });
});

let saved = null;
try { saved = sessionStorage.getItem("byfrancia-plan"); } catch (e) {}
choose(fromPath || saved || "experience"); // the featured one by default

/* ═══════════ THE FORM ═══════════ */
const form = document.getElementById("payForm");
const status = document.getElementById("payStatus");

form.addEventListener("submit", (e) => {
  // Nothing is sent anywhere. Until a payment provider is wired up this is the
  // honest behaviour — better a clear message than a button that looks like it
  // charged someone.
  e.preventDefault();
  status.classList.add("is-shown");
  status.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
});

/* ═══════════ THE PAGE SETTLES IN ═══════════ */
if (!prefersReduced) {
  gsap.from(".co__title, .co__aside, .co__orn, .co__lede", {
    autoAlpha: 0, y: 18, duration: 1, ease: "power2.out", stagger: 0.1,
  });
  gsap.from(".plan", {
    autoAlpha: 0, y: 30, duration: 1.05, ease: "power3.out", stagger: 0.12, delay: 0.35,
  });
  gsap.from(".co__quote, .pay, .trust", {
    autoAlpha: 0, y: 20, duration: 1, ease: "power2.out", stagger: 0.1, delay: 0.75,
  });
}

i18n.offerLanguage();
