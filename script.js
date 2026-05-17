/* ==========================================================================
   VanAI — coming soon page interactivity
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Smooth in-page anchor scroll ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---- Reveal sections on scroll ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('section').forEach(function (s) {
    s.classList.add('reveal');
    io.observe(s);
  });

  /* ---- Waitlist tabs (founder / VC) ---- */
  var tabFounder    = document.getElementById('tab-founder');
  var tabVC         = document.getElementById('tab-vc');
  var founderFields = document.getElementById('founder-fields');
  var vcFields      = document.getElementById('vc-fields');
  var orgLabel      = document.getElementById('org-label');
  var formLabel     = document.getElementById('form-label');
  var emailInput    = document.getElementById('email');
  var orgInput      = document.getElementById('org');
  var submitLabel   = document.getElementById('submit-label');

  function setTab(which) {
    var isFounder = which === 'founder';

    tabFounder.classList.toggle('active',  isFounder);
    tabVC.classList.toggle('active',      !isFounder);

    founderFields.style.display = isFounder ? 'grid' : 'none';
    vcFields.style.display      = isFounder ? 'none' : 'grid';

    orgLabel.textContent  = isFounder ? 'Company name' : 'Fund or syndicate name';
    orgInput.placeholder  = isFounder ? 'e.g. Greenway Grid Ltd' : 'e.g. Alder Park Ventures';
    emailInput.placeholder = isFounder ? 'you@startup.co' : 'you@fund.com';
    formLabel.textContent = isFounder
      ? 'Founder application · 30 seconds'
      : 'Investor application · 30 seconds';
    submitLabel.textContent = isFounder ? 'Join the waitlist' : 'Request early access';
  }

  if (tabFounder && tabVC) {
    tabFounder.addEventListener('click', function () { setTab('founder'); });
    tabVC.addEventListener('click',      function () { setTab('vc');      });
  }

  /* ---- Waitlist form submit (client-side only) ---- */
  var form    = document.getElementById('waitlist-form');
  var success = document.getElementById('success');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailInput.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!email || !valid) {
        emailInput.style.borderColor = 'var(--ws-accent-crimson)';
        emailInput.focus();
        return;
      }

      form.classList.add('hidden');
      form.style.display = 'none';
      if (success) success.style.display = 'block';
    });
  }
})();
