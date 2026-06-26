/* ==========================================================================
   VenAI — coming soon page interactivity
   Lightweight: no scroll listeners, no continuous animations.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- Dark mode toggle (initial theme already applied in <head>) ---- */
  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem("venai-theme", next);
      } catch (e) {}
    });
  }

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

  /* ---- Founder application form → Google Apps Script web app ---- */
  // Paste the /exec URL you got after deploying Code.gs as a Web App.
  var SHEET_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbw5Nmt2Wh3eoh1nxc8AKpAaNuN6jKE2r6InsOBAZ9qk0RF-g2VnnUHR6_Yq35m4FK05/exec";

  var form = document.getElementById("waitlist-form");
  var success = document.getElementById("success");
  var submitBtn = document.getElementById("submit-btn");
  var submitLabel = document.getElementById("submit-label");
  var emailInput = document.getElementById("email");
  var orgInput = document.getElementById("org");
  var userTypeSelect = document.getElementById("user-type");
  var orgLabel = document.getElementById("org-label");

  function getSubmissionType() {
    if (!userTypeSelect) return "founder";
    return userTypeSelect.value === "investor" ? "vc" : "founder";
  }

  function updateFormForUserType() {
    var isInvestor = getSubmissionType() === "vc";
    if (orgLabel) {
      orgLabel.textContent = isInvestor ? "Fund name" : "Company name";
    }
    if (orgInput) {
      orgInput.placeholder = isInvestor
        ? "e.g. Alder Park Ventures"
        : "e.g. Greenway Grid Ltd";
    }
  }

  if (userTypeSelect) {
    userTypeSelect.addEventListener("change", updateFormForUserType);
    updateFormForUserType();
  }

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

  function collectPayload() {
    return {
      type: getSubmissionType(),
      email: emailInput ? emailInput.value.trim() : "",
      org: orgInput ? orgInput.value.trim() : "",
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || "",
      pageUrl: location.href,
    };
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
    var existing = document.getElementById("form-error");
    if (existing) existing.remove();
    var div = document.createElement("div");
    div.id = "form-error";
    div.style.cssText =
      "margin-top:12px;padding:10px 12px;border-radius:8px;background:#FDECEE;color:#9B2C36;font-size:13px;border:1px solid #F5C6CB;";
    div.textContent =
      message || "We couldn't submit your waitlist request. Please try again.";
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

      // Content-Type text/plain avoids a CORS preflight Apps Script can't handle.
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
