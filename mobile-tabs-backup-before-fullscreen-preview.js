/* ============================================
   MOBILE TABS WIZARD — DesignCV
   Sur mobile : CV en haut, formulaire par étapes en bas
   5 étapes : Identité, Profil, Expérience, Compétences, Design
   ============================================ */

(function () {
  'use strict';

  const STEPS = [
    { id: 'step-identity',    icon: '\u{1F464}', label: 'Identit\u00e9',       sections: ['photo-section', 'identity-section'] },
    { id: 'step-profile',     icon: '\u{1F4CB}', label: 'Profil',         sections: ['profile-section'] },
    { id: 'step-experience',  icon: '\u{1F4BC}', label: 'Exp\u00e9rience',    sections: ['experience-section', 'education-section', 'project-section'] },
    { id: 'step-skills',      icon: '\u{26A1}',  label: 'Comp\u00e9tences',   sections: ['skills-section', 'languages-section'] },
    { id: 'step-design',      icon: '\u{1F3A8}', label: 'Design',         sections: [] }
  ];

  let currentStep = 0;
  let isMobile = false;

  function checkMobile() {
    return window.innerWidth <= 700;
  }

  /* ---- Map form sections to IDs ---- */
  function mapSections() {
    var allSections = document.querySelectorAll('.form-panel > .form-section');
    if (allSections.length < 7) return;
    allSections[0].id = 'photo-section';
    allSections[1].id = 'identity-section';
    allSections[2].id = 'profile-section';
    allSections[3].id = 'experience-section';
    allSections[4].id = 'education-section';
    allSections[5].id = 'project-section';
    allSections[6].id = 'skills-section';
    if (allSections[7]) allSections[7].id = 'languages-section';
  }

  /* ---- Ensure ALL form inputs trigger CV update ---- */
  function bindAllInputs() {
    var formPanel = document.querySelector('.form-panel');
    if (!formPanel) return;

    // Use event delegation on the entire form panel
    formPanel.addEventListener('input', function (e) {
      if (e.target.matches('input, textarea, select') && typeof window.syncAndRender === 'function') {
        window.syncAndRender();
      }
    });

    formPanel.addEventListener('change', function (e) {
      if (e.target.matches('input, textarea, select') && typeof window.syncAndRender === 'function') {
        window.syncAndRender();
      }
    });
  }

  /* ---- Build step bar ---- */
  function buildStepBar() {
    if (document.getElementById('mobile-step-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'mobile-step-bar';
    bar.style.display = 'none';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', '\u00c9tapes du formulaire');

    STEPS.forEach(function (step, i) {
      var tab = document.createElement('button');
      tab.className = 'mobile-step-tab' + (i === 0 ? ' active' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      tab.setAttribute('aria-controls', step.id);
      tab.dataset.step = i;
      tab.innerHTML =
        '<span class="step-icon">' + step.icon + '</span>' +
        '<span class="step-label">' + step.label + '</span>';
      tab.addEventListener('click', function () { goToStep(i); });
      bar.appendChild(tab);
    });

    var formPanel = document.querySelector('.form-panel');
    if (formPanel) formPanel.insertBefore(bar, formPanel.firstChild);
  }

  /* ---- Build design step ---- */
  function buildDesignStep() {
    if (document.getElementById('mobile-design-controls')) return;
    if (document.getElementById('step-design')) return;

    var section = document.createElement('section');
    section.className = 'form-section';
    section.id = 'step-design';

    var html = '<h2 class="section-title">\u{1F3A8} Design du CV</h2>';
    html += '<div id="mobile-design-controls">';

    html += '<div class="mobile-control-row">';
    html += '<span class="mobile-control-label">Th\u00e8me</span>';
    html += '<div class="mobile-theme-switcher">';
    ['classic', 'moderne', '\u00e9l\u00e9gant'].forEach(function (t) {
      var val = t === 'moderne' ? 'modern' : t === '\u00e9l\u00e9gant' ? 'elegant' : 'classic';
      html += '<button class="mobile-theme-btn" data-theme="' + val + '">' + t + '</button>';
    });
    html += '</div></div>';

    html += '<div class="mobile-control-row">';
    html += '<span class="mobile-control-label">Couleur</span>';
    html += '<div class="mobile-color-picker">';
    ['#4F46E5', '#059669', '#0F172A', '#DC2626', '#7C3AED'].forEach(function (c) {
      html += '<button class="mobile-color-dot" data-color="' + c + '" style="background:' + c + '"></button>';
    });
    html += '</div></div>';
    html += '</div>';
    section.innerHTML = html;

    var formPanel = document.querySelector('.form-panel');
    if (formPanel) {
      var nav = document.getElementById('mobile-step-nav');
      if (nav) formPanel.insertBefore(section, nav);
      else formPanel.appendChild(section);
    }

    section.querySelectorAll('.mobile-theme-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = this.dataset.theme;
        var desktopBtn = document.querySelector('.theme-btn[data-theme="' + theme + '"]');
        if (desktopBtn) desktopBtn.click();
        section.querySelectorAll('.mobile-theme-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    section.querySelectorAll('.mobile-color-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        var color = this.dataset.color;
        var desktopDot = document.querySelector('.color-dot[data-color="' + color + '"]');
        if (desktopDot) desktopDot.click();
        section.querySelectorAll('.mobile-color-dot').forEach(function (d) { d.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  }

  /* ---- Build prev/next nav ---- */
  function buildStepNav() {
    if (document.getElementById('mobile-step-nav')) return;

    var nav = document.createElement('div');
    nav.id = 'mobile-step-nav';
    nav.style.display = 'none';
    nav.innerHTML =
      '<button class="btn btn-prev" id="mobile-prev">\u2190 Pr\u00e9c\u00e9dent</button>' +
      '<button class="btn btn-next" id="mobile-next">Suivant \u2192</button>';

    var formPanel = document.querySelector('.form-panel');
    if (formPanel) formPanel.appendChild(nav);

    document.getElementById('mobile-prev').addEventListener('click', function () {
      if (currentStep > 0) goToStep(currentStep - 1);
    });

    document.getElementById('mobile-next').addEventListener('click', function () {
      if (currentStep < STEPS.length - 1) goToStep(currentStep + 1);
    });
  }

  /* ---- Go to step ---- */
  function goToStep(index) {
    if (index < 0 || index >= STEPS.length) return;
    currentStep = index;
    sessionStorage.setItem('designcv_mobile_step', String(index));

    document.querySelectorAll('.form-panel > .form-section').forEach(function (s) {
      s.classList.remove('mobile-active');
    });

    var step = STEPS[index];
    if (step.sections.length > 0) {
      step.sections.forEach(function (secId) {
        var el = document.getElementById(secId);
        if (el) el.classList.add('mobile-active');
      });
    } else if (step.id === 'step-design') {
      var designEl = document.getElementById('step-design');
      if (designEl) designEl.classList.add('mobile-active');
    }

    document.querySelectorAll('.mobile-step-tab').forEach(function (tab, i) {
      tab.classList.toggle('active', i === index);
      tab.classList.toggle('completed', i < index);
      tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    var prevBtn = document.getElementById('mobile-prev');
    var nextBtn = document.getElementById('mobile-next');
    if (prevBtn) prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    if (nextBtn) {
      nextBtn.textContent = index === STEPS.length - 1 ? '\u{1F4C4} T\u00e9l\u00e9charger' : 'Suivant \u2192';
    }

    // Force CV re-render after step switch to pick up any hidden section data
    if (typeof window.syncAndRender === 'function') {
      setTimeout(function () { window.syncAndRender(); }, 10);
    }

    var firstActive = document.querySelector('.form-panel .form-section.mobile-active');
    if (firstActive) firstActive.scrollTop = 0;
  }

  /* ---- Activate ---- */
  function activateMobile() {
    if (isMobile) return;
    isMobile = true;

    var stepBar = document.getElementById('mobile-step-bar');
    var stepNav = document.getElementById('mobile-step-nav');
    if (stepBar) stepBar.style.display = 'flex';
    if (stepNav) stepNav.style.display = 'flex';

    goToStep(currentStep);
    syncDesignControls();
  }

  /* ---- Deactivate ---- */
  function deactivateMobile() {
    if (!isMobile) return;
    isMobile = false;

    var stepBar = document.getElementById('mobile-step-bar');
    var stepNav = document.getElementById('mobile-step-nav');
    if (stepBar) stepBar.style.display = 'none';
    if (stepNav) stepNav.style.display = 'none';

    document.querySelectorAll('.form-panel > .form-section').forEach(function (s) {
      s.classList.remove('mobile-active');
      s.style.display = '';
    });
  }

  /* ---- Sync design controls ---- */
  function syncDesignControls() {
    var activeTheme = document.querySelector('.theme-btn.active');
    if (activeTheme) {
      var t = activeTheme.dataset.theme;
      document.querySelectorAll('.mobile-theme-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.theme === t);
      });
    }
    var activeColor = document.querySelector('.color-dot.active');
    if (activeColor) {
      var c = activeColor.dataset.color;
      document.querySelectorAll('.mobile-color-dot').forEach(function (d) {
        d.classList.toggle('active', d.dataset.color === c);
      });
    }
  }

  /* ---- Download on last step ---- */
  function bindDownloadNav() {
    var nextBtn = document.getElementById('mobile-next');
    if (!nextBtn) return;
    nextBtn.addEventListener('click', function () {
      if (currentStep === STEPS.length - 1) {
        var dlBtn = document.getElementById('btn-download');
        if (dlBtn) dlBtn.click();
      }
    });
  }

  /* ---- Observe desktop theme/color changes ---- */
  function observeDesktopChanges() {
    var observer = new MutationObserver(function () {
      if (isMobile) syncDesignControls();
    });
    var toolbar = document.querySelector('.preview-toolbar');
    if (toolbar) {
      observer.observe(toolbar, { attributes: true, subtree: true, attributeFilter: ['class', 'data-theme', 'data-color'] });
    }
  }

  /* ---- Init ---- */
  function init() {
    mapSections();
    buildStepBar();
    buildDesignStep();
    buildStepNav();
    bindAllInputs();
    bindDownloadNav();
    observeDesktopChanges();

    if (checkMobile()) activateMobile();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (checkMobile()) activateMobile();
        else deactivateMobile();
      }, 150);
    });

    var savedStep = sessionStorage.getItem('designcv_mobile_step');
    if (savedStep !== null) {
      var n = parseInt(savedStep, 10);
      if (n >= 0 && n < STEPS.length) currentStep = n;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
