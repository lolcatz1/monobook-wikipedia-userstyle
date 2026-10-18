// ==UserScript==
// @name         wikipedia 2009 companion
// @namespace    levi.wiki2009
// @version      0.2.4
// @description  2009 favicon, contents box back in the article, portal > main page
// @author       leroy
// @match        *://*.wikipedia.org/*
// @match        *://wikipedia.org/*
// @exclude      *://*.m.wikipedia.org/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(function () {
  "use strict";
  // portal redirect
  const REDIRECT_PORTAL = true;
  if (REDIRECT_PORTAL && /^(www\.)?wikipedia\.org$/.test(location.hostname) && (location.pathname === "/" || location.pathname === "")) {
    location.replace("https://en.wikipedia.org/wiki/Main_Page"); return;
  }
  const ready = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());

  // favicon
  const ICON = "data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAEAgQAhIOEAMjHyABIR0gA6ejpAGlqaQCpqKkAKCgoAPz9/AAZGBkAmJiYANjZ2ABXWFcAent6ALm6uQA8OjwAiIiIiIiIiIiIiI4oiL6IiIiIgzuIV4iIiIhndo53KIiIiB/WvXoYiIiIfEZfWBSIiIEGi/foqoiIgzuL84i9iIjpGIoMiEHoiMkos3FojmiLlUipYliEWIF+iDe0GoRa7D6GPbjcu1yIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  // favicon: ours is the only icon link in <head>. capped, so a page or add-on that fights back cannot cause a loop
  function keepIcon(ICON, id) {
    const SEL = 'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], link[rel="mask-icon"], link[rel="fluid-icon"]';
    let busy = false, obs = null, watched = null, spent = [], off = false;
    const allowed = () => { const now = Date.now(); spent = spent.filter((t) => now - t < 10000); if (spent.length >= 12) { off = true; if (obs) obs.disconnect(); return false; } spent.push(now); return true; };
    const apply = (fresh) => {
      if (busy || off) return; const head = document.head; if (!head) return; busy = true;
      try {
        const others = [...head.querySelectorAll(SEL)].filter((l) => l.id !== id); let mine = document.getElementById(id);
        const wrong = !mine || mine.parentNode !== head || mine.getAttribute("href") !== ICON || mine.rel !== "icon" || mine !== head.lastElementChild && others.length;
        if (!others.length && !wrong && fresh !== true) return;
        if ((others.length || wrong) && !allowed()) return;
        for (const l of others) l.remove();
        if (wrong || fresh === true) { if (mine) mine.remove(); mine = document.createElement("link"); mine.id = id; mine.rel = "icon"; mine.type = "image/x-icon"; mine.href = ICON; head.appendChild(mine); }
      } finally { busy = false; if (obs) obs.takeRecords(); }
    };
    const watch = () => { if (off) return; const head = document.head; if (!head) { setTimeout(watch, 25); return; } if (head === watched) return; watched = head;
      if (obs) obs.disconnect(); obs = new MutationObserver(() => apply()); obs.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "rel"] }); apply(); };
    watch();
    for (const ev of ["DOMContentLoaded", "load", "pageshow"]) window.addEventListener(ev, () => { watch(); apply(true); }, true);
    for (const ms of [250, 1500, 5000]) setTimeout(() => { watch(); apply(true); }, ms);
  }
  keepIcon(ICON, "wiki2009icon");

  // contents box
  function moveToc() {
    const toc = document.getElementById("vector-toc"), out = document.querySelector("#mw-content-text .mw-parser-output");
    if (!toc || !out || toc.closest("#bodyContent")) return;
    const mark = out.querySelector('meta[property="mw:PageProp/toc"]');
    const firstHeading = out.querySelector(".mw-heading, h2");
    const holder = document.createElement("div"); holder.id = "wiki2009-toc";
    if (mark) mark.replaceWith(holder); else if (firstHeading) (firstHeading.closest("section") || firstHeading).before(holder); else return;
    holder.appendChild(toc);
    const label = toc.querySelector(".vector-pinnable-header-label"); if (label) label.textContent = "Contents";
    toc.querySelectorAll(".vector-toc-numb").forEach((n) => { n.style.display = "inline"; });
    document.documentElement.classList.add("wiki2009-toc-inline");
  }
  ready(moveToc); window.addEventListener("load", moveToc); setTimeout(moveToc, 1500);
})();
