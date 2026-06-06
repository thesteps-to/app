/* thesteps · app UI kit — interactions (vanilla, no framework) */
(function () {
  "use strict";

  /* ---- theme toggle (kit chrome) ---- */
  document.querySelectorAll("[data-set-theme]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.documentElement.setAttribute("data-theme", b.dataset.setTheme);
      document.querySelectorAll("[data-set-theme]").forEach(function (x) { x.classList.remove("is-on"); });
      b.classList.add("is-on");
    });
  });

  /* ---- screen navigation ---- */
  function go(name) {
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.toggle("is-active", s.dataset.screen === name);
    });
    var phone = document.querySelector(".phone");
    if (phone) phone.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll("[data-go]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); go(el.dataset.go); });
  });

  /* ---- consent dialog ---- */
  var consent = document.getElementById("consent");
  document.querySelectorAll("[data-consent]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); if (consent.showModal) consent.showModal(); });
  });
  document.querySelectorAll("[data-close-consent]").forEach(function (el) {
    el.addEventListener("click", function () { consent.close(); });
  });
  if (consent) consent.addEventListener("click", function (e) {
    var r = consent.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) consent.close();
  });

  /* ---- the "C’est fait" flow: advance the next action ---- */
  var ACTIONS = [
    {
      step: "Étape 4 / 9", time: "J-12", timeClass: "ts-time--soon",
      title: "Signer le compromis de vente",
      desc: "J’ai préparé le compromis avec le notaire. Relisez-le tranquillement — il ne vous reste qu’à confirmer le rendez-vous.",
      meta: '<span class="ts-pay">💳 Estimation <b>~1 200 €</b></span><span class="ts-tag">Notaire</span>',
      provider: true,
    },
    {
      step: "Étape 5 / 9", time: "~2 semaines", timeClass: "",
      title: "Préparer les fonds chez le notaire",
      desc: "Je vous indiquerai le montant exact et le RIB du notaire dès que la banque aura confirmé. Rien à préparer avant.",
      meta: '<span class="ts-tag">Notaire</span>',
      provider: false,
    },
    {
      step: "Étape 6 / 9", time: "Courant juin", timeClass: "",
      title: "Signer l’acte définitif",
      desc: "Le grand jour. Je cale le rendez-vous et rassemble tous les documents — vous n’aurez qu’à signer.",
      meta: '<span class="ts-tag">Notaire</span>',
      provider: false,
    },
  ];

  var idx = 0;
  var doneCount = 3;
  var TOTAL = 9;

  function setProgress() {
    var pct = Math.round((doneCount / TOTAL) * 100) + "%";
    var label = doneCount + " / " + TOTAL + " étapes faites";
    ["homeFill", "planFill"].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.width = pct; });
    ["homeProg", "planProg"].forEach(function (id) { var e = document.getElementById(id); if (e) e.textContent = label; });
  }

  function trailItemByTitle(t) {
    return Array.prototype.find.call(document.querySelectorAll("#trail .ts-trail__item"), function (li) {
      var el = li.querySelector(".ts-trail__title");
      return el && el.textContent.trim() === t;
    });
  }

  function completeTrailItem(title) {
    var li = trailItemByTitle(title);
    if (!li) return;
    li.dataset.state = "done";
    li.dataset.below = "taken";
    var g = li.querySelector(".ts-glyph"); if (g) g.dataset.state = "done";
    var meta = li.querySelector(".ts-trail__meta");
    if (meta) meta.innerHTML = '<span class="ts-badge ts-badge--done">Fait</span>';
  }

  function unlockTrailItem(title) {
    var li = trailItemByTitle(title);
    if (!li || li.dataset.state === "done") return;
    li.dataset.state = "current";
    li.dataset.below = "open";
    var g = li.querySelector(".ts-glyph"); if (g) g.dataset.state = "current";
    var meta = li.querySelector(".ts-trail__meta");
    if (meta) meta.innerHTML = '<span class="ts-badge ts-badge--current">À faire</span>';
  }

  function renderAction(a) {
    document.getElementById("acStep").textContent = a.step;
    document.getElementById("acTitle").textContent = a.title;
    document.getElementById("acDesc").textContent = a.desc;
    document.getElementById("acMeta").innerHTML = a.meta;
    var t = document.getElementById("acTime");
    t.textContent = a.time;
    t.className = "ts-time " + (a.timeClass || "");
    document.getElementById("acProvider").style.display = a.provider ? "" : "none";
  }

  var btn = document.getElementById("doneBtn");
  if (btn) btn.addEventListener("click", function () {
    var current = ACTIONS[idx];
    completeTrailItem(current.title);
    doneCount = Math.min(doneCount + 1, TOTAL);
    setProgress();

    if (window.TsToast) TsToast.show("C’est fait — joliment avancé.", { tone: "done" });

    if (idx < ACTIONS.length - 1) {
      idx += 1;
      unlockTrailItem(ACTIONS[idx].title);
      // soft transition: fade card, swap, restore
      var card = document.getElementById("actionCard");
      card.style.transition = "opacity .22s var(--ease-out)";
      card.style.opacity = "0";
      setTimeout(function () { renderAction(ACTIONS[idx]); card.style.opacity = "1"; }, 220);
    } else {
      // final celebration — sober
      var card = document.getElementById("actionCard");
      card.classList.add("ts-action--done");
      card.querySelector(".ts-action__cta").innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;color:var(--step-done-text);font:var(--font-cardtitle)">' +
        '<span class="ts-glyph" data-state="done"></span> Toutes les étapes sont faites. Félicitations.</div>';
      document.getElementById("acProvider").style.display = "none";
    }
  });

  setProgress();
})();
