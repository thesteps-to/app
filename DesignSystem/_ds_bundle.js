/* @ds-bundle: {"format":3,"namespace":"ThestepsDesignSystem_8cd6bc","components":[],"sourceHashes":{"js/components.js":"899983ce00cb","ui_kits/app/app.js":"40101efcac10"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ThestepsDesignSystem_8cd6bc = window.ThestepsDesignSystem_8cd6bc || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// js/components.js
try { (() => {
/* ============================================================
   thesteps · components.js
   Dependency-free native Web Components. No framework, no build
   step required to run. Custom elements:

     <disclosure-slider level="1">  (contact / project / financial)
     <ts-toast>    (imperative: TsToast.show("…"))

   The step glyph is a pure-CSS class (.ts-glyph[data-state], see
   css/glyph.css) or the SVG <use> sprite (assets/step-glyph.svg) —
   no JS needed. Static components (button, card, badge, input,
   switch…) are plain HTML + css/components.css.
   ============================================================ */
(function () {
  "use strict";

  var LABELS = {
    done: "Étape faite",
    current: "Étape en cours",
    locked: "Étape verrouillée",
    waiting: "En attente",
    overdue: "En retard",
    node: "Étape"
  };

  /* ---------- disclosure-slider --------------------------- *
   * Three-level data-sharing control: contact → project → financial.
   * Emits "change" with detail.level (1..3). Drives [data-reveal]
   * fields elsewhere via the .reveal(scope) helper.                 */
  var LEVELS = [{
    key: "contact",
    label: "Contact",
    desc: "Nom + e-mail seulement"
  }, {
    key: "project",
    label: "Projet",
    desc: "Détails du projet (sans montants)"
  }, {
    key: "financial",
    label: "Financier",
    desc: "Budget et capacité d’emprunt"
  }];
  if ("customElements" in window && !customElements.get("disclosure-slider")) {
    customElements.define("disclosure-slider", class extends HTMLElement {
      connectedCallback() {
        var lvl = parseInt(this.getAttribute("level") || "1", 10);
        this.classList.add("ts-disclosure");
        this.innerHTML = '<div class="ts-disclosure__head">' + '<span class="ts-disclosure__title">Ce que je partage avec le courtier</span>' + '<span class="ts-disclosure__value" data-value></span>' + '</div>' + '<input class="ts-disclosure__range" type="range" min="1" max="3" step="1" ' + 'value="' + lvl + '" aria-label="Niveau de partage des données">' + '<div class="ts-disclosure__ticks">' + LEVELS.map(function (l, i) {
          return '<button class="ts-disclosure__tick" data-i="' + (i + 1) + '">' + '<span class="ts-disclosure__tick-label">' + l.label + '</span></button>';
        }).join("") + '</div>' + '<p class="ts-disclosure__desc" data-desc></p>';
        var range = this.querySelector("input");
        var self = this;
        function paint() {
          var v = parseInt(range.value, 10);
          self.setAttribute("data-level", v);
          self.querySelector("[data-value]").textContent = LEVELS[v - 1].label;
          self.querySelector("[data-desc]").textContent = LEVELS[v - 1].desc;
          self.querySelectorAll(".ts-disclosure__tick").forEach(function (t) {
            t.classList.toggle("is-on", parseInt(t.dataset.i, 10) <= v);
          });
          range.style.setProperty("--_pct", (v - 1) / 2 * 100 + "%");
          self.dispatchEvent(new CustomEvent("change", {
            detail: {
              level: v,
              key: LEVELS[v - 1].key
            },
            bubbles: true
          }));
        }
        range.addEventListener("input", paint);
        this.querySelectorAll(".ts-disclosure__tick").forEach(function (t) {
          t.addEventListener("click", function () {
            range.value = t.dataset.i;
            paint();
          });
        });
        paint();
      }
    });
  }

  /* ---------- ts-toast (sober, imperative) ---------------- */
  function ensureToastRoot() {
    var r = document.querySelector(".ts-toast-root");
    if (!r) {
      r = document.createElement("div");
      r.className = "ts-toast-root";
      document.body.appendChild(r);
    }
    return r;
  }
  window.TsToast = {
    show: function (msg, opts) {
      opts = opts || {};
      var root = ensureToastRoot();
      var t = document.createElement("div");
      t.className = "ts-toast ts-toast--" + (opts.tone || "done");
      t.setAttribute("role", "status");
      t.innerHTML = (opts.glyph !== false ? '<span class="ts-glyph ts-glyph--sm" data-state="' + (opts.tone === "done" ? "done" : "current") + '"></span>' : "") + '<span>' + msg + "</span>";
      root.appendChild(t);
      requestAnimationFrame(function () {
        t.classList.add("is-in");
      });
      setTimeout(function () {
        t.classList.remove("is-in");
        setTimeout(function () {
          t.remove();
        }, 300);
      }, opts.duration || 3200);
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "js/components.js", error: String((e && e.message) || e) }); }

// ui_kits/app/app.js
try { (() => {
/* thesteps · app UI kit — interactions (vanilla, no framework)
   Single source of truth: the STEPS journey. It renders BOTH the
   home next-action card and the full "parcours" (positioned on the
   current step, past steps recorded above with dates/inputs/livrables,
   connectors carrying their condition). */
(function () {
  "use strict";

  var TOTAL = 9;

  /* ---- the journey (one model, two renderings) ---- */
  var STEPS = [{
    title: "Définir le projet",
    state: "done",
    when: "10 avril",
    fields: [["Projet", "Achat résidence principale"], ["Secteur", "Lyon 3e / 6e"]],
    cond: {
      text: "Projet cadré",
      when: "10 avr."
    }
  }, {
    title: "Estimer ma capacité d’emprunt",
    state: "done",
    when: "28 avril",
    fields: [["Apport", "60 000 €"], ["Capacité estimée", "≈ 320 000 €"]],
    doc: {
      name: "Attestation de financement.pdf",
      meta: "PDF · 180 Ko"
    },
    cond: {
      text: "Capacité confirmée",
      when: "28 avr."
    }
  }, {
    title: "Visiter & faire une offre",
    state: "done",
    when: "12 mai",
    fields: [["Bien", "Appartement · Lyon 3e · 68 m²"], ["Offre", "315 000 €"]],
    doc: {
      name: "Offre d’achat.pdf",
      meta: "Signée · 240 Ko"
    },
    cond: {
      text: "<b>Offre acceptée</b> par le vendeur",
      when: "12 mai"
    }
  }, {
    title: "Signer le compromis de vente",
    state: "current",
    desc: "J’ai préparé le compromis avec le notaire. Relisez-le tranquillement — il ne reste qu’à confirmer le rendez-vous.",
    time: "J-12",
    timeClass: "ts-time--soon",
    pay: "~1 200 €",
    tag: "Notaire",
    provider: true,
    condDone: {
      text: "<b>Compromis signé</b>",
      when: "auj."
    }
  }, {
    title: "Accord de prêt de la banque",
    state: "waiting",
    reason: "Ce n’est pas à vous de jouer — je relance la banque.",
    detail: "~2 semaines"
  }, {
    title: "Préparer les fonds chez le notaire",
    state: "locked",
    reason: "Disponible après le compromis",
    desc: "Je vous indiquerai le montant exact et le RIB du notaire. Rien à préparer avant.",
    time: "~2 semaines",
    tag: "Notaire",
    condDone: {
      text: "<b>Fonds virés</b> au notaire",
      when: "auj."
    }
  }, {
    title: "Signer l’acte définitif",
    state: "locked",
    reason: "Disponible après l’accord de prêt",
    desc: "Le grand jour. Je cale le rendez-vous et rassemble tous les documents — vous n’aurez qu’à signer.",
    time: "Courant juin",
    tag: "Notaire",
    condDone: {
      text: "<b>Acte authentique signé</b>",
      when: "auj."
    }
  }, {
    title: "Récupérer les clés 🔑",
    state: "locked",
    reason: "La dernière étape — j’y suis presque avec vous."
  }];

  /* the user-actionable chain (skips the external "waiting" bank step) */
  var CHAIN = [3, 5, 6];
  var ptr = 0;
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
  var ICON_CHEV = '<svg class="ts-record__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
  function esc(s) {
    return s;
  }

  /* ---------- render: one parcours item ---------- */
  function below(i) {
    return STEPS[i].state === "done" ? "taken" : "future";
  }
  function condPill(c) {
    if (!c) return "";
    return '<p class="ts-cond"><span class="ts-cond__check">' + ICON_CHECK + "</span> " + c.text + (c.when ? ' <span class="ts-cond__when">' + c.when + "</span>" : "") + "</p>";
  }
  function recordBody(s) {
    var parts = "";
    if (s.fields && s.fields.length) {
      parts += '<div class="ts-record__fields"><span class="ts-record__sub">Ce que vous avez indiqué</span>';
      s.fields.forEach(function (f) {
        parts += '<div class="ts-record__kv"><span class="ts-record__k">' + f[0] + '</span><span class="ts-record__v">' + f[1] + "</span></div>";
      });
      parts += "</div>";
    }
    if (s.doc) {
      parts += '<div><span class="ts-record__sub">Livrable</span><div class="ts-docs" style="margin-top:6px">' + '<a class="ts-doc" href="#"><span class="ts-doc__icon">' + ICON_DOC + '</span><span><span class="ts-doc__name">' + s.doc.name + '</span><span class="ts-doc__meta">' + s.doc.meta + "</span></span></a></div></div>";
    }
    return parts;
  }
  function renderItem(s, i) {
    var rail = '<span class="ts-trail__rail"><span class="ts-glyph" data-state="' + (s.state === "current" ? "current" : s.state) + '"></span></span>';
    if (s.state === "done") {
      var hasBody = s.fields && s.fields.length || s.doc;
      var rec = '<details class="ts-record"' + (i === 2 ? " open" : "") + '>' + '<summary class="ts-record__head"><span class="ts-record__titles">' + '<p class="ts-record__title">' + s.title + '</p>' + '<span class="ts-record__when">Fait le ' + (s.when || "—") + '</span></span>' + (hasBody ? ICON_CHEV : "") + "</summary>" + (hasBody ? '<div class="ts-record__body">' + recordBody(s) + "</div>" : "") + "</details>";
      return '<li class="ts-trail__item" data-state="done" data-below="' + below(i) + '">' + rail + rec + condPill(s.cond) + "</li>";
    }
    if (s.state === "current") {
      var meta = "";
      if (s.time) meta += '<span class="ts-time ' + (s.timeClass || "") + '">' + s.time + "</span>";
      if (s.pay) meta += '<span class="ts-pay">💳 ' + s.pay + "</span>";
      var focal = '<div class="ts-focal">' + '<div class="ts-focal__eyebrow"><span class="eyebrow">Vous êtes ici · étape ' + (i + 1) + " / " + TOTAL + "</span></div>" + '<h3 class="ts-focal__title">' + s.title + "</h3>" + (s.desc ? '<p class="ts-focal__desc">' + s.desc + "</p>" : "") + (meta ? '<div class="ts-focal__meta">' + meta + "</div>" : "") + '<button class="ts-btn ts-btn--primary ts-btn--block js-done">C’est fait ' + ICON_CHECK + "</button>" + "</div>";
      return '<li class="ts-trail__item is-current" data-state="current" data-below="future">' + rail + focal + "</li>";
    }

    /* waiting / locked — quiet rows */
    var metaRow = "";
    if (s.state === "waiting") {
      metaRow = '<span class="ts-badge ts-badge--waiting">En attente</span>' + (s.detail ? '<span class="trail-detail">' + s.detail + "</span>" : "");
    } else {
      metaRow = '<span class="ts-trail__reason">' + (s.reason || "") + "</span>";
    }
    return '<li class="ts-trail__item" data-state="' + s.state + '" data-below="' + below(i) + '">' + rail + '<div class="ts-trail__body"><p class="ts-trail__title">' + s.title + '</p><div class="ts-trail__meta">' + metaRow + "</div></div></li>";
  }
  function renderParcours() {
    var ol = document.getElementById("parcours");
    if (!ol) return;
    ol.innerHTML = STEPS.map(renderItem).join("");
  }

  /* ---------- render: home next-action card ---------- */
  function currentIndex() {
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].state === "current") return i;
    return -1;
  }
  function renderHome() {
    var i = currentIndex();
    var card = document.getElementById("actionCard");
    if (i < 0) {
      if (card) {
        card.classList.add("ts-action--done");
        card.querySelector(".ts-action__cta").innerHTML = '<div style="display:flex;align-items:center;gap:10px;color:var(--step-done-text);font:var(--font-cardtitle)">' + '<span class="ts-glyph" data-state="done"></span> Toutes les étapes sont faites. Félicitations.</div>';
        var p = document.getElementById("acProvider");
        if (p) p.style.display = "none";
        document.getElementById("acStep").textContent = "Terminé";
        document.getElementById("acTitle").textContent = "Vous y êtes.";
        document.getElementById("acDesc").textContent = "Votre projet est bouclé. Récupérez vos clés !";
        document.getElementById("acMeta").innerHTML = "";
        document.getElementById("acTime").style.display = "none";
      }
      return;
    }
    var s = STEPS[i];
    document.getElementById("acStep").textContent = "Étape " + (i + 1) + " / " + TOTAL;
    document.getElementById("acTitle").textContent = s.title;
    document.getElementById("acDesc").textContent = s.desc || "";
    var meta = "";
    if (s.pay) meta += '<span class="ts-pay">💳 Estimation <b>' + s.pay + "</b></span>";
    if (s.tag) meta += '<span class="ts-tag">' + s.tag + "</span>";
    document.getElementById("acMeta").innerHTML = meta;
    var t = document.getElementById("acTime");
    t.style.display = s.time ? "" : "none";
    t.textContent = s.time || "";
    t.className = "ts-time " + (s.timeClass || "");
    document.getElementById("acProvider").style.display = s.provider ? "" : "none";
  }
  function setProgress() {
    var done = STEPS.filter(function (s) {
      return s.state === "done";
    }).length;
    var pct = Math.round(done / TOTAL * 100) + "%";
    var label = done + " / " + TOTAL + " étapes faites";
    ["homeFill", "planFill"].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.style.width = pct;
    });
    ["homeProg", "planProg"].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.textContent = label;
    });
  }
  function renderAll() {
    renderParcours();
    renderHome();
    setProgress();
  }

  /* ---------- advance the journey ---------- */
  function advance() {
    var cur = CHAIN[ptr];
    if (STEPS[cur].state !== "current") return;
    STEPS[cur].state = "done";
    STEPS[cur].when = "aujourd’hui";
    STEPS[cur].cond = STEPS[cur].condDone;
    ptr += 1;
    if (ptr < CHAIN.length) STEPS[CHAIN[ptr]].state = "current";
    renderAll();
    if (window.TsToast) TsToast.show("C’est fait — joliment avancé.", {
      tone: "done"
    });
  }

  /* ---------- navigation ---------- */
  function scrollToCurrent() {
    var sc = document.querySelector('.screen[data-screen="plan"]');
    if (!sc) return;
    var el = sc.querySelector(".is-current");
    if (!el) return;
    var top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 56;
    sc.scrollTop = Math.max(0, top);
  }
  function go(name) {
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.toggle("is-active", s.dataset.screen === name);
    });
    var active = document.querySelector(".screen.is-active");
    if (active) active.scrollTop = 0;
    if (name === "plan") {
      renderParcours();
      setTimeout(scrollToCurrent, 80);
    }
  }

  /* ---------- wire up ---------- */
  document.querySelectorAll("[data-set-theme]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.documentElement.setAttribute("data-theme", b.dataset.setTheme);
      document.querySelectorAll("[data-set-theme]").forEach(function (x) {
        x.classList.remove("is-on");
      });
      b.classList.add("is-on");
    });
  });
  document.querySelectorAll("[data-go]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      go(el.dataset.go);
    });
  });
  var consent = document.getElementById("consent");
  document.querySelectorAll("[data-consent]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      if (consent.showModal) consent.showModal();
    });
  });
  document.querySelectorAll("[data-close-consent]").forEach(function (el) {
    el.addEventListener("click", function () {
      consent.close();
    });
  });
  if (consent) consent.addEventListener("click", function (e) {
    var r = consent.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) consent.close();
  });
  var homeBtn = document.getElementById("doneBtn");
  if (homeBtn) homeBtn.addEventListener("click", advance);

  /* delegated: the focal "C’est fait" inside the parcours */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".js-done");
    if (b) {
      advance();
      setTimeout(scrollToCurrent, 80);
    }
  });
  renderAll();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/app.js", error: String((e && e.message) || e) }); }

})();
