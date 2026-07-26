/* =====================================================================
 * help.js  —  DesignCV Module 8 (Système d'aide contextuelle)
 * ---------------------------------------------------------------------
 * OVERLAY : ne modifie ni app.js ni style.css.
 *
 * Composantes :
 *  1. Icônes ⓘ injectées à côté de chaque titre de section (.section-title).
 *     Au survol/clic → tooltip avec conseils contextualisés.
 *  2. Bouton "Aide" dans la navbar → ouvre un panneau latéral coulissant
 *     (slide-in from right) contenant :
 *       - FAQ accordéon
 *       - Raccourcis clavier (Phase 1 + Module 7)
 *       - Bouton "Relancer l'assistant"
 *       - Lien vers le support / contact
 *  3. Tooltips accessibles (aria-describedby, Esc pour fermer, focus).
 * ===================================================================== */

(function () {
  'use strict';

  if (window.__designcvHelpLoaded) return;
  window.__designcvHelpLoaded = true;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // -----------------------------------------------------------------
  // Base de conseils par section (data-help="key")
  // -----------------------------------------------------------------
  const TIPS = {
    photo: {
      title: 'Photo de profil',
      items: [
        'Utilisez une photo professionnelle récente, de préférence carrée.',
        'Format JPG ou PNG, 2 Mo maximum.',
        'Un fond neutre et un visage souriant donnent un CV plus humain.',
        'Cette étape est optionnelle — un CV sans photo est parfaitement acceptable.',
      ],
    },
    identity: {
      title: 'Identité & Contact',
      items: [
        'Indiquez un email professionnel (prénom.nom@...), pas d\'email perso humoristique.',
        'Le titre du poste est crucial : il déclenche les suggestions de compétences intelligentes.',
        'Un numéro au format international (+33 6...) est recommandé pour les candidatures internationales.',
        'La localisation aide les recruteurs à filtrer géographiquement.',
      ],
    },
    profile: {
      title: 'Profil Professionnel',
      items: [
        'Rédigez 2 à 4 lignes max : qui vous êtes, votre expertise, votre objectif.',
        'Évitez les formules vagues (« dynamique et motivé »). Soyez concret.',
        'Adaptez ce résumé à chaque offre d\'emploi visée.',
        'C\'est la première chose qu\'un recruteur lira — soignez-le.',
      ],
    },
    experience: {
      title: 'Expériences',
      items: [
        'Commencez par le poste le plus récent (ordre antichronologique automatique).',
        'Utilisez des verbes d\'action : « Dirigé », « Développé », « Optimisé ».',
        'Quantifiez vos résultats : « +30% de ventes », « 5 personnes gérées ».',
        'Cochez « En cours / Présent » si vous occupez toujours le poste.',
      ],
    },
    education: {
      title: 'Formation',
      items: [
        'Listez vos diplômes du plus récent au plus ancien.',
        'Indiquez l\'établissement, la ville et les années.',
        'Les certifications professionnelles comptent aussi (MOOC, bootcamps).',
        'Si vous êtes junior, mettez cette section AVANT les expériences.',
      ],
    },
    projects: {
      title: 'Projets Réalisés',
      items: [
        'Cette section est optionnelle mais très valorisée par les recruteurs.',
        'Ajoutez un lien (GitHub, site web) si le projet est consultable.',
        'Décrivez le problème résolu, votre rôle, et les technologies utilisées.',
        'Privilégiez 2-3 projets pertinents plutôt qu\'une longue liste.',
      ],
    },
    skills: {
      title: 'Compétences',
      items: [
        'Cliquez sur les suggestions intelligentes qui s\'adaptent à votre poste.',
        'Vous pouvez aussi saisir vos propres compétences librement.',
        'Séparez les compétences techniques (outils, langages) des soft skills.',
        'Visez 6 à 12 compétences — trop nuit à la lisibilité.',
      ],
    },
    languages: {
      title: 'Langues',
      items: [
        'Indiquez votre niveau honnêtement : Natif, Courant, Avancé, Intermédiaire, Débutant.',
        'Cette section est surtout utile pour les postes internationaux.',
        'Mentionnez les certifications (TOEIC, DALF, DELE) si vous en avez.',
      ],
    },
    design: {
      title: 'Personnalisation du design',
      items: [
        '3 thèmes disponibles : Classique (sobre), Moderne (sidebar colorée), Élégant (serif).',
        '5 couleurs d\'accent au choix — restez cohérent avec votre secteur.',
        'Le thème Moderne met la photo en avant dans une sidebar colorée.',
        'Testez l\'export PDF avant de finaliser : le rendu peut légèrement différer.',
      ],
    },
  };

  // Mapping titre de section → clé de conseil
  const SECTION_MAP = [
    { selector: '.form-section:nth-of-type(1) .section-title', key: 'photo' },
    { selector: '.form-section:nth-of-type(2) .section-title', key: 'identity' },
    { selector: '.form-section:nth-of-type(3) .section-title', key: 'profile' },
    { selector: '.form-section:nth-of-type(4) .section-title', key: 'experience' },
    { selector: '.form-section:nth-of-type(5) .section-title', key: 'education' },
    { selector: '.form-section:nth-of-type(6) .section-title', key: 'projects' },
    { selector: '.form-section:nth-of-type(7) .section-title', key: 'skills' },
    { selector: '.form-section:nth-of-type(8) .section-title', key: 'languages' },
    { selector: '.preview-toolbar .toolbar-label', key: 'design' },
  ];

  // -----------------------------------------------------------------
  // FAQ pour le panneau d'aide
  // -----------------------------------------------------------------
  const FAQ = [
    {
      q: 'Mes données sont-elles sauvegardées ?',
      a: 'Oui. Toutes vos informations restent dans votre navigateur (localStorage). Rien n\'est envoyé sur un serveur. Vous pouvez consulter et recharger vos CV précédents via le bouton « Historique ».',
    },
    {
      q: 'Comment exporter mon CV en PDF ?',
      a: 'Cliquez sur « Télécharger PDF » dans la barre de navigation, ou utilisez le raccourci Ctrl+S (Cmd+S sur Mac). Le PDF est généré localement dans votre navigateur.',
    },
    {
      q: 'Le PDF est illisible ou mal coupé, que faire ?',
      a: 'Essayez de raccourcir vos descriptions, ou passez au thème « Compact » via le bouton « Optimiser ». Évitez les textes trop longs dans une seule expérience.',
    },
    {
      q: 'Puis-je utiliser mes propres compétences au lieu des suggestions ?',
      a: 'Absolument. Les suggestions sont des raccourcis : tapez librement votre compétence dans le champ puis appuyez sur Entrée ou cliquez sur « + ».',
    },
    {
      q: 'Comment changer l\'ordre des expériences ?',
      a: 'L\'ordre est automatiquement antichronologique (du plus récent au plus ancien) basé sur les dates. Indiquez des années dans les champs « Début » et « Fin ».',
    },
    {
      q: 'L\'assistant s\'est fermé, comment le relancer ?',
      a: 'Cliquez sur « Assistant » dans la barre de navigation, ou utilisez Alt+W. Vous reprendrez à l\'étape où vous étiez.',
    },
    {
      q: 'Mes données disparaissent au refresh, pourquoi ?',
      a: 'Cliquez sur « Historique » puis « Sauvegarder » régulièrement. La sauvegarde automatique arrive dans une prochaine phase. Pour l\'instant, pensez à sauvegarder avant de fermer l\'onglet.',
    },
  ];

  // Raccourcis clavier (Phase 1 + Module 7)
  const SHORTCUTS = [
    { keys: 'Ctrl + S', desc: 'Télécharger le PDF' },
    { keys: 'Ctrl + H', desc: 'Ouvrir l\'historique' },
    { keys: 'Ctrl + ,', desc: 'Optimiser le design' },
    { keys: 'Alt + W', desc: 'Lancer l\'assistant' },
    { keys: '← / →', desc: 'Étape précédente / suivante (assistant)' },
    { keys: 'Échap', desc: 'Fermer modale / assistant / aide' },
  ];

  // -----------------------------------------------------------------
  // 1. Injection des icônes ⓘ dans les titres de section
  // -----------------------------------------------------------------
  let activeTooltip = null;

  function injectInfoIcons() {
    SECTION_MAP.forEach(({ selector, key }) => {
      const titleEl = $(selector);
      if (!titleEl) return;
      if (titleEl.querySelector('.help-info-btn')) return; // déjà injecté

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'help-info-btn';
      btn.setAttribute('aria-label', `Aide — ${TIPS[key].title}`);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('data-help-key', key);
      btn.innerHTML = '<span aria-hidden="true">ⓘ</span>';
      btn.title = 'Astuces pour cette section';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTooltip(btn, key);
      });
      btn.addEventListener('mouseenter', () => showTooltip(btn, key));
      btn.addEventListener('mouseleave', () => {
        // Délai pour permettre de survoler le tooltip
        setTimeout(() => {
          if (activeTooltip && !activeTooltip.matches(':hover')) {
            hideTooltip();
          }
        }, 200);
      });

      titleEl.appendChild(btn);
    });
  }

  function showTooltip(btn, key) {
    hideTooltip();
    const data = TIPS[key];
    if (!data) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.innerHTML = `
      <div class="help-tooltip-title">${data.title}</div>
      <ul class="help-tooltip-list">
        ${data.items.map(i => `<li>${i}</li>`).join('')}
      </ul>
    `;
    document.body.appendChild(tooltip);

    // Positionnement relatif au bouton
    const rect = btn.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;

    // Ajustement si débordement à droite
    if (left + tipRect.width > window.innerWidth - 12) {
      left = window.innerWidth - tipRect.width - 12;
    }
    // Ajustement si débordement en bas
    if (top + tipRect.height > window.innerHeight - 12) {
      top = rect.top - tipRect.height - 8;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${Math.max(12, left)}px`;
    tooltip.classList.add('is-visible');

    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-describedby', 'help-tooltip-active');
    tooltip.id = 'help-tooltip-active';

    activeTooltip = { el: tooltip, btn };

    // Fermer au clic extérieur
    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 0);
  }

  function hideTooltip() {
    if (!activeTooltip) return;
    activeTooltip.el.remove();
    if (activeTooltip.btn) {
      activeTooltip.btn.setAttribute('aria-expanded', 'false');
      activeTooltip.btn.removeAttribute('aria-describedby');
    }
    activeTooltip = null;
    document.removeEventListener('click', onOutsideClick);
  }

  function toggleTooltip(btn, key) {
    if (activeTooltip && activeTooltip.btn === btn) {
      hideTooltip();
    } else {
      showTooltip(btn, key);
    }
  }

  function onOutsideClick(e) {
    if (!activeTooltip) return;
    if (!activeTooltip.el.contains(e.target) && !activeTooltip.btn.contains(e.target)) {
      hideTooltip();
    }
  }

  // Esc ferme le tooltip
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeTooltip) {
      hideTooltip();
    }
  });

  // -----------------------------------------------------------------
  // 2. Panneau d'aide latéral (slide-in)
  // -----------------------------------------------------------------
  let panelEl = null;
  let overlayEl = null;
  let isOpen = false;

  function buildHelpPanel() {
    if (panelEl) return;

    // Overlay (clique pour fermer)
    overlayEl = document.createElement('div');
    overlayEl.className = 'help-overlay';
    overlayEl.addEventListener('click', closeHelpPanel);

    panelEl = document.createElement('aside');
    panelEl.className = 'help-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', 'help-panel-title');

    panelEl.innerHTML = `
      <header class="help-panel-header">
        <div>
          <h2 id="help-panel-title" class="help-panel-title">Centre d'aide</h2>
          <p class="help-panel-subtitle">DesignCV — Guide & raccourcis</p>
        </div>
        <button type="button" class="help-panel-close" id="help-close" aria-label="Fermer l'aide">✕</button>
      </header>

      <div class="help-panel-body">

        <section class="help-section">
          <h3 class="help-section-title">🚀 Démarrage rapide</h3>
          <p class="help-section-text">Pas sûr par où commencer ? L'assistant vous guide étape par étape.</p>
          <button type="button" class="btn btn-primary btn-sm" id="help-relaunch-wizard">
            🧭 Relancer l'assistant
          </button>
        </section>

        <section class="help-section">
          <h3 class="help-section-title">⌨️ Raccourcis clavier</h3>
          <ul class="help-shortcuts">
            ${SHORTCUTS.map(s => `
              <li class="help-shortcut">
                <kbd>${s.keys}</kbd>
                <span>${s.desc}</span>
              </li>
            `).join('')}
          </ul>
        </section>

        <section class="help-section">
          <h3 class="help-section-title">❓ Questions fréquentes</h3>
          <div class="help-faq">
            ${FAQ.map((item, i) => `
              <details class="help-faq-item"${i === 0 ? ' open' : ''}>
                <summary class="help-faq-q">${item.q}</summary>
                <div class="help-faq-a">${item.a}</div>
              </details>
            `).join('')}
          </div>
        </section>

        <section class="help-section">
          <h3 class="help-section-title">💡 Conseils par section</h3>
          <p class="help-section-text">Survolez l'icône <span class="help-info-inline">ⓘ</span> à côté de chaque titre de section pour voir des astuces contextualisées.</p>
        </section>

        <section class="help-section help-section-about">
          <h3 class="help-section-title">À propos</h3>
          <p class="help-section-text">
            DesignCV v2.2 — Générateur de CV intelligent.<br>
            Phase 3 : Assistant guidé + Aide contextuelle.
          </p>
        </section>

      </div>
    `;

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    $('#help-close', panelEl).addEventListener('click', closeHelpPanel);
    $('#help-relaunch-wizard', panelEl).addEventListener('click', () => {
      closeHelpPanel();
      setTimeout(() => {
        if (window.designcvWizard) {
          window.designcvWizard.start();
        }
      }, 300);
    });

    // Focus trap
    panelEl.addEventListener('keydown', trapFocus);
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = $$('button, [href], input, details summary, [tabindex]:not([tabindex="-1"])', panelEl)
      .filter(el => el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openHelpPanel() {
    buildHelpPanel();
    isOpen = true;
    overlayEl.classList.add('is-visible');
    panelEl.classList.add('is-open');
    document.body.classList.add('help-panel-open');
    // Focus sur le bouton fermer
    setTimeout(() => $('#help-close', panelEl)?.focus(), REDUCED_MOTION ? 0 : 300);
  }

  function closeHelpPanel() {
    if (!isOpen) return;
    isOpen = false;
    overlayEl.classList.remove('is-visible');
    panelEl.classList.remove('is-open');
    document.body.classList.remove('help-panel-open');
  }

  // Esc ferme aussi le panneau
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeHelpPanel();
    }
  });

  // -----------------------------------------------------------------
  // 3. Bouton "Aide" dans la navbar
  // -----------------------------------------------------------------
  function injectNavButton() {
    const navActions = $('.nav-actions');
    if (!navActions) return;
    if ($('#btn-help')) return;

    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.id = 'btn-help';
    btn.innerHTML = '❓ Aide';
    btn.setAttribute('aria-label', 'Ouvrir le centre d\'aide');
    btn.title = 'Centre d\'aide (Alt+?)';
    btn.addEventListener('click', openHelpPanel);

    // Insère après le bouton Assistant (ou en 2e position)
    const wizardBtn = $('#btn-wizard');
    if (wizardBtn && wizardBtn.nextSibling) {
      navActions.insertBefore(btn, wizardBtn.nextSibling);
    } else {
      navActions.insertBefore(btn, navActions.firstChild);
    }
  }

  // Raccourci Alt+? (Alt+Shift+/ sur la plupart des claviers → '?')
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === '/' || e.key === '?')) {
      e.preventDefault();
      openHelpPanel();
    }
  });

  // -----------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------
  function boot() {
    injectInfoIcons();
    injectNavButton();
    console.log('[DesignCV] Module 8 — Aide contextuelle chargée.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // API publique
  window.designcvHelp = {
    open: openHelpPanel,
    close: closeHelpPanel,
  };
})();
