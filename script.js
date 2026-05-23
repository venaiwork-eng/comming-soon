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
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
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

    if (founderFields)
      founderFields.style.display = isFounder ? "grid" : "none";
    if (vcFields) vcFields.style.display = isFounder ? "none" : "grid";

    if (orgLabel)
      orgLabel.textContent = isFounder
        ? "Company name"
        : "Fund or syndicate name";
    if (orgInput)
      orgInput.placeholder = isFounder
        ? "e.g. Greenway Grid Ltd"
        : "e.g. Alder Park Ventures";
    if (emailInput)
      emailInput.placeholder = isFounder ? "you@company.co.uk" : "you@fund.com";
    if (formLabel) {
      formLabel.textContent = isFounder
        ? "Founder application"
        : "Investor application";
    }
    if (submitLabel) {
      submitLabel.textContent = isFounder
        ? "Request early access"
        : "Apply as an investor";
    }
  }

  if (tabFounder && tabVC) {
    tabFounder.addEventListener("click", function () {
      setTab("founder");
    });
    tabVC.addEventListener("click", function () {
      setTab("vc");
    });
  }

  /* ---- Waitlist form submit → Google Apps Script web app ---- */
  // Paste the /exec URL you got after deploying Code.gs as a Web App.
  var SHEET_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbw5Nmt2Wh3eoh1nxc8AKpAaNuN6jKE2r6InsOBAZ9qk0RF-g2VnnUHR6_Yq35m4FK05/exec";

  var form = document.getElementById("waitlist-form");
  var success = document.getElementById("success");
  var submitBtn = document.getElementById("submit-btn");

  function flagInvalid(input) {
    input.style.borderColor = "#E84855";
    input.style.boxShadow = "0 0 0 4px rgba(232,72,85,0.14)";
    input.focus();
    input.addEventListener("input", function clear() {
      input.style.borderColor = "";
      input.style.boxShadow = "";
      input.removeEventListener("input", clear);
    });
  }

  function getActiveTab() {
    return tabsWrap && tabsWrap.getAttribute("data-active") === "vc"
      ? "vc"
      : "founder";
  }

  function collectPayload() {
    var tab = getActiveTab();
    var base = {
      type: tab, // "founder" or "vc"
      email: emailInput ? emailInput.value.trim() : "",
      org: orgInput ? orgInput.value.trim() : "",
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || "",
      pageUrl: location.href,
    };

    if (tab === "founder") {
      var stage = document.getElementById("stage");
      var raise = document.getElementById("raise");
      base.stage = stage ? stage.value : "";
      base.raise = raise ? raise.value : "";
    } else {
      var investorType = document.getElementById("investor-type");
      var cheque = document.getElementById("cheque");
      base.investorType = investorType ? investorType.value : "";
      base.cheque = cheque ? cheque.value : "";
    }
    return base;
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.style.opacity = isSubmitting ? "0.7" : "";
    submitBtn.style.cursor = isSubmitting ? "wait" : "";
    if (submitLabel) {
      if (isSubmitting) {
        submitBtn.dataset.originalLabel = submitLabel.textContent;
        submitLabel.textContent = "Sending…";
      } else if (submitBtn.dataset.originalLabel) {
        submitLabel.textContent = submitBtn.dataset.originalLabel;
      }
    }
  }

  function showSuccess() {
    if (form) form.style.display = "none";
    if (success) success.style.display = "block";
  }

  function showError(message) {
    // Lightweight inline error — replace with a toast/banner if you prefer.
    var existing = document.getElementById("form-error");
    if (existing) existing.remove();
    var div = document.createElement("div");
    div.id = "form-error";
    div.style.cssText =
      "margin-top:12px;padding:10px 12px;border-radius:8px;background:#FDECEE;color:#9B2C36;font-size:13px;border:1px solid #F5C6CB;";
    div.textContent =
      message || "We couldn't submit your request. Please try again.";
    if (form) form.appendChild(div);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!emailInput) return;

      var email = emailInput.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!email || !valid) {
        flagInvalid(emailInput);
        return;
      }

      var payload = collectPayload();
      setSubmitting(true);

      // Important: Content-Type is text/plain (a "simple" CORS request),
      // so the browser does NOT send an OPTIONS preflight. Apps Script
      // doesn't handle OPTIONS, but it can read JSON from a text/plain body.
      fetch(SHEET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Bad status: " + res.status);
          return res.json().catch(function () {
            return { status: "ok" };
          });
        })
        .then(function (data) {
          if (data && data.status === "error") {
            throw new Error(data.message || "Server error");
          }
          showSuccess();
        })
        .catch(function (err) {
          console.error("Submission failed:", err);
          setSubmitting(false);
          showError();
        });
    });
  }
})();
