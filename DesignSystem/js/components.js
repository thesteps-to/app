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
    done: "Étape faite", current: "Étape en cours", locked: "Étape verrouillée",
    waiting: "En attente", overdue: "En retard", node: "Étape",
  };

  /* ---------- disclosure-slider --------------------------- *
   * Three-level data-sharing control: contact → project → financial.
   * Emits "change" with detail.level (1..3). Drives [data-reveal]
   * fields elsewhere via the .reveal(scope) helper.                 */
  var LEVELS = [
    { key: "contact",   label: "Contact",   desc: "Nom + e-mail seulement" },
    { key: "project",   label: "Projet",    desc: "Détails du projet (sans montants)" },
    { key: "financial", label: "Financier", desc: "Budget et capacité d’emprunt" },
  ];

  if ("customElements" in window && !customElements.get("disclosure-slider")) {
    customElements.define("disclosure-slider", class extends HTMLElement {
      connectedCallback() {
        var lvl = parseInt(this.getAttribute("level") || "1", 10);
        this.classList.add("ts-disclosure");
        this.innerHTML =
          '<div class="ts-disclosure__head">' +
            '<span class="ts-disclosure__title">Ce que je partage avec le courtier</span>' +
            '<span class="ts-disclosure__value" data-value></span>' +
          '</div>' +
          '<input class="ts-disclosure__range" type="range" min="1" max="3" step="1" ' +
            'value="' + lvl + '" aria-label="Niveau de partage des données">' +
          '<div class="ts-disclosure__ticks">' +
            LEVELS.map(function (l, i) {
              return '<button class="ts-disclosure__tick" data-i="' + (i + 1) + '">' +
                '<span class="ts-disclosure__tick-label">' + l.label + '</span></button>';
            }).join("") +
          '</div>' +
          '<p class="ts-disclosure__desc" data-desc></p>';

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
          range.style.setProperty("--_pct", ((v - 1) / 2 * 100) + "%");
          self.dispatchEvent(new CustomEvent("change", { detail: { level: v, key: LEVELS[v - 1].key }, bubbles: true }));
        }
        range.addEventListener("input", paint);
        this.querySelectorAll(".ts-disclosure__tick").forEach(function (t) {
          t.addEventListener("click", function () { range.value = t.dataset.i; paint(); });
        });
        paint();
      }
    });
  }

  /* ---------- ts-toast (sober, imperative) ---------------- */
  function ensureToastRoot() {
    var r = document.querySelector(".ts-toast-root");
    if (!r) { r = document.createElement("div"); r.className = "ts-toast-root"; document.body.appendChild(r); }
    return r;
  }
  window.TsToast = {
    show: function (msg, opts) {
      opts = opts || {};
      var root = ensureToastRoot();
      var t = document.createElement("div");
      t.className = "ts-toast ts-toast--" + (opts.tone || "done");
      t.setAttribute("role", "status");
      t.innerHTML =
        (opts.glyph !== false
          ? '<span class="ts-glyph ts-glyph--sm" data-state="' + (opts.tone === "done" ? "done" : "current") + '"></span>'
          : "") +
        '<span>' + msg + "</span>";
      root.appendChild(t);
      requestAnimationFrame(function () { t.classList.add("is-in"); });
      setTimeout(function () {
        t.classList.remove("is-in");
        setTimeout(function () { t.remove(); }, 300);
      }, opts.duration || 3200);
    },
  };
})();
