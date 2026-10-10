/* ═══════════════════════════════════════════════
   checkout.html — choosing a format, then handing the payment over.

   This page never takes a card. It collects who the customer is, and Buy now
   sends them to a Stripe Payment Link — a page on Stripe's own domain, listed
   in checkout-links.js — carrying the format they chose and their email. Card
   details typed into fields this site controls would put the whole project in
   PCI scope, and there is no reason to accept that for three fixed prices.
   ═══════════════════════════════════════════════ */

import { prefersReduced } from "./config.js?v=101";
import { lenis } from "./scroll.js?v=101";
import "./cursor.js?v=101";
import { initI18n } from "./i18n-runtime.js?v=101";
import { PAYMENT_LINKS } from "./checkout-links.js?v=101";

const i18n = initI18n();
i18n.restoreSavedLanguage();
lenis.start();

/* ═══════════ WHICH FORMAT ═══════════ */
const plans = [...document.querySelectorAll(".plan")];
let chosen = null;

/* arriving from continue.html: ?path=read lands on the digital format,
   ?path=listen on the full experience, which is the one with the audio */
const wanted = new URLSearchParams(location.search).get("path");
const fromPath = wanted === "listen" ? "experience" : wanted === "read" ? "digital" : null;

function choose(key) {
  chosen = key;
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
const email = document.getElementById("payEmail");
const emailErr = document.getElementById("emailErr");

/* the error clears itself as soon as they start fixing it */
email.addEventListener("input", () => {
  email.closest(".field").classList.remove("is-invalid");
  emailErr.classList.remove("is-shown");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // the field is type="email" required, so the browser does the parsing
  if (!email.checkValidity()) {
    email.closest(".field").classList.add("is-invalid");
    emailErr.classList.add("is-shown");
    email.focus();
    return;
  }

  const link = PAYMENT_LINKS[chosen];
  if (!link) {
    // No Payment Link pasted in yet. Say so rather than leave a button that
    // looks like it charged someone.
    status.classList.add("is-shown");
    status.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
    return;
  }

  // Stripe's hosted page takes the email as a prefill, so it is not retyped
  const url = new URL(link, location.href);
  url.searchParams.set("prefilled_email", email.value.trim());
  location.assign(url.toString());
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
