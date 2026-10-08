/* ═══════════════════════════════════════════════
   i18n-runtime — the language machinery, shared by every page.

   English lives in the markup and is snapshotted on first touch, so i18n.js
   only ever carries translations. Switching re-swaps innerHTML, updates
   <html lang>, persists the choice, and rebuilds the switcher.

   Anything page-specific happens through the two hooks. index.html passes
   them because its text is split by SplitText (a split holds references to
   DOM it created, so it has to be reverted before the swap and re-run after)
   and because the book's jacket is a canvas texture that must be repainted.
   A page with neither passes nothing.
   ═══════════════════════════════════════════════ */
import { LANGS, DEFAULT_LANG, OFFER, TRANSLATIONS } from "./i18n.js?v=97";

const LANG_KEY = "byfrancia-lang";

export function initI18n({ beforeSwap = null, afterSwap = null } = {}) {
  const EN = new Map();
  let LANG = DEFAULT_LANG;

  function remember(el, attr, read) {
    const k = el.getAttribute(attr);
    if (k && !EN.has(k)) EN.set(k, read(el));
    return k;
  }

  /* Also used on nodes created after load — the "revisit another feeling"
     links are built in JS and arrive after the first pass. */
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
    if (beforeSwap) beforeSwap(lang);
    applyTo(document, lang);
    if (afterSwap) afterSwap(lang);
    document.documentElement.lang = LANGS[lang].htmlLang;
    if (persist) { try { localStorage.setItem(LANG_KEY, lang); } catch (e) {} }
    renderSwitch();
  }

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

  /* On index.html this runs before the text is split, so the swap is a plain
     innerHTML write and the hero reveal still animates from scratch. */
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

  const api = {
    applyLanguage,
    applyTo,
    restoreSavedLanguage,
    offerLanguage,
    getLang: () => LANG,
  };
  // console/testing hooks, same names every page
  window.__setLang = applyLanguage;
  window.__offerLang = offerLanguage;
  return api;
}
