/* ==========================================================================
   VenAI — coming soon page interactivity
   Lightweight: no scroll listeners, no continuous animations.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- Smooth in-page anchor scroll ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---- Reveal sections on scroll (one-shot, fires once per section) ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );

    document.querySelectorAll("section").forEach(function (s) {
      s.classList.add("reveal");
      io.observe(s);
    });
  }

  /* ---- Waitlist tabs (founder / investor) — sliding pill ---- */
  var tabsWrap = document.querySelector(".tabs");
  var tabFounder = document.getElementById("tab-founder");
  var tabVC = document.getElementById("tab-vc");
  var founderFields = document.getElementById("founder-fields");
  var vcFields = document.getElementById("vc-fields");
  var orgLabel = document.getElementById("org-label");
  var formLabel = document.getElementById("form-label");
  var emailInput = document.getElementById("email");
  var orgInput = document.getElementById("org");
  var submitLabel = document.getElementById("submit-label");

  function setTab(which) {
    var isFounder = which === "founder";

    if (tabsWrap) tabsWrap.setAttribute("data-active", which);

    if (tabFounder) tabFounder.classList.toggle("active", isFounder);
    if (tabVC) tabVC.classList.toggle("active", !isFounder);

    if (founderFields) founderFields.style.display = isFounder ? "grid" : "none";
    if (vcFields) vcFields.style.display = isFounder ? "none" : "grid";

    if (orgLabel) orgLabel.textContent = isFounder ? "Company name" : "Fund or syndicate name";
    if (orgInput) orgInput.placeholder = isFounder ? "e.g. Greenway Grid Ltd" : "e.g. Alder Park Ventures";
    if (emailInput) emailInput.placeholder = isFounder ? "you@company.co.uk" : "you@fund.com";
    if (formLabel) {
      formLabel.textContent = isFounder
        ? "Founder application · 30 seconds"
        : "Investor application · 30 seconds";
    }
    if (submitLabel) {
      submitLabel.textContent = isFounder
        ? "Request early access"
        : "Apply as an investor";
    }
  }

  if (tabFounder && tabVC) {
    tabFounder.addEventListener("click", function () { setTab("founder"); });
    tabVC.addEventListener("click", function () { setTab("vc"); });
  }

  /* ---- Waitlist form submit (client-side only, no backend) ---- */
  var form = document.getElementById("waitlist-form");
  var success = document.getElementById("success");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!emailInput) return;
      var email = emailInput.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!email || !valid) {
        emailInput.style.borderColor = "#E84855";
        emailInput.style.boxShadow = "0 0 0 4px rgba(232,72,85,0.14)";
        emailInput.focus();
        emailInput.addEventListener("input", function clear() {
          emailInput.style.borderColor = "";
          emailInput.style.boxShadow = "";
          emailInput.removeEventListener("input", clear);
        });
        return;
      }

      form.style.display = "none";
      if (success) {
        success.style.display = "block";
      }
    });
  }
})();
