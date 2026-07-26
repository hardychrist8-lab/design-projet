/* =====================================================================
 * wizard.js  —  DesignCV Module 7 (Assistant de création guidée)
 * ---------------------------------------------------------------------
 * OVERLAY PRINCIPLE : ne modifie ni app.js ni style.css.
 * Approche "guided tour" : le wizard pilote les champs EXISTANTS en
 * attirant l'attention (spotlight + scroll) vers chaque section,
 * sans dupliquer les inputs. L'utilisateur remplit le vrai formulaire.
 *
 * Comportement :
 *  1. Au 1er visit (localStorage flag absent), lance automatiquement.
 *  2. Panel flottant (bottom-right) avec : étape X/N, titre, instructions,
 *     barre de progression, boutons Précédent / Suivant / Terminer / Passer.
 *  3. Met en surbrillance (spotlight) la section active via classe CSS.
 *  4. Scroll la section dans le viewport (smooth, respect reduced-motion).
 *  5. Esc = fermer (avec confirmation douce via tooltip, pas de alert()).
 *  6. Bouton "Assistant" dans la navbar permet de relancer manuellement.
 *  7. Progression sauvegardée dans sessionStorage (reprise si on quitte).
 * ===================================================================== */

(function () {
  'use strict';

  if (window.__designcvWizardLoaded) return;
  window.__designcvWizardLoaded = true;

  // -----------------------------------------------------------------
  // Config
  // -----------------------------------------------------------------
  const STORAGE_DONE = 'designcv_wizard_done';
  const STORAGE_STEP = 'designcv_wizard_step';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Les étapes du wizard — chacune pointe vers une section existante
  // via un sélecteur CSS et donne des instructions contextualisées.
  const STEPS = [
    {
      id: 'photo',
      title: 'Photo de profil',
      icon: '📸',
      selector: '.form-section:nth-of-type(1)',
      instructions: 'Ajoutez une photo professionnelle (JPG/PNG, 2 Mo max). Cliquez sur la zone « Ajouter une photo » à gauche. Cette étape est <strong>optionnelle</strong> — vous pouvez la passer.',
      optional: true,
      ctaFocus: '#photoPreview',
    },
    {
      id: 'identity',
      title: 'Identité & Contact',
      icon: '👤',
      selector: '.form-section:nth-of-type(2)',
      instructions: 'Renseignez votre <strong>nom, prénom, titre du poste</strong> et vos coordonnées. Le titre du poste déclenche automatiquement les <strong>suggestions de compétences intelligentes</strong> (Module 14).',
      ctaFocus: '#firstName',
    },
    {
      id: 'profile',
      title: 'Profil Professionnel',
      icon: '💼',
      selector: '.form-section:nth-of-type(3)',
      instructions: 'Rédigez un <strong>résumé de 2 à 4 lignes</strong> qui présente votre parcours et vos atouts. Soyez concret et direct : c\'est la première chose qu\'un recruteur lira.',
      ctaFocus: '#profile',
    },
    {
      id: 'experience',
      title: 'Expériences professionnelles',
      icon: '🏢',
      selector: '.form-section:nth-of-type(4)',
      instructions: 'Cliquez sur « + Ajouter » pour chaque poste. Renseignez le <strong>poste, l\'entreprise, les dates</strong> et une description de vos missions. Cochez « En cours » si vous y travaillez actuellement.',
      ctaFocus: '#btn-add-exp',
    },
    {
      id: 'education',
      title: 'Formation',
      icon: '🎓',
      selector: '.form-section:nth-of-type(5)',
      instructions: 'Ajoutez vos <strong>diplômes et formations</strong> les plus pertinents. Indiquez l\'établissement et les années. Les formations les plus récentes doivent apparaître en premier.',
      ctaFocus: '#btn-add-edu',
    },
    {
      id: 'projects',
      title: 'Projets Réalisés',
      icon: '🚀',
      selector: '.form-section:nth-of-type(6)',
      instructions: 'Mettez en avant vos <strong>projets personnels ou professionnels</strong>. Cette section est optionnelle mais très valorisée par les recruteurs. Ajoutez un lien si le projet est en ligne.',
      optional: true,
      ctaFocus: '#btn-add-proj',
    },
    {
      id: 'skills',
      title: 'Compétences',
      icon: '⚡',
      selector: '.form-section:nth-of-type(7)',
      instructions: 'Cliquez sur les <strong>suggestions intelligentes</strong> qui s\'affichent sous le titre du poste, ou saisissez vos propres compétences librement. Séparez techniques et soft skills.',
      ctaFocus: '#tech-skill-input',
    },
    {
      id: 'languages',
      title: 'Langues',
      icon: '🌍',
      selector: '.form-section:nth-of-type(8)',
      instructions: 'Ajoutez les <strong>langues que vous parlez</strong> et votre niveau (Natif, Courant, Avancé...). Cette étape est optionnelle mais utile pour les postes internationaux.',
      optional: true,
      ctaFocus: '#btn-add-lang',
    },
    {
      id: 'design',
      title: 'Personnalisation du design',
      icon: '🎨',
      selector: '.preview-toolbar',
      instructions: 'Choisissez un <strong>thème</strong> (Classique, Moderne, Élégant) et une <strong>couleur d\'accent</strong> dans la barre d\'outils à droite. Le CV se met à jour en temps réel.',
      optional: true,
      ctaFocus: '.theme-btn.active',
    },
    {
      id: 'finish',
      title: 'Votre CV est prêt !',
      icon: '🎉',
      selector: '#btn-download',
      instructions: 'Félicitations ! Vous pouvez maintenant <strong>télécharger votre CV en PDF</strong>, le <strong>sauvegarder dans l\'historique</strong>, ou continuer à l\'ajuster. L\'assistant reste accessible via le bouton « Assistant » de la barre de navigation.',
      optional: true,
      isLast: true,
    },
  ];

  // -----------------------------------------------------------------
  // État
  // -----------------------------------------------------------------
  let currentStep = 0;
  let panelEl = null;
  let isActive = false;

  // -----------------------------------------------------------------
  // Utilitaires
  // -----------------------------------------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function getStep() {
    const saved = sessionStorage.getItem(STORAGE_STEP);
    if (saved !== null) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= 0 && n < STEPS.length) return n;
    }
    return 0;
  }

  function saveStep(n) {
    try { sessionStorage.setItem(STORAGE_STEP, String(n)); } catch (e) { /* ignore */ }
  }

  function markDone() {
    try {
      localStorage.setItem(STORAGE_DONE, '1');
      sessionStorage.removeItem(STORAGE_STEP);
    } catch (e) { /* ignore */ }
  }

  function isFirstVisit() {
    try { return localStorage.getItem(STORAGE_DONE) !== '1'; } catch (e) { return false; }
  }

  // -----------------------------------------------------------------
  // Construction du panel UI
  // -----------------------------------------------------------------
  function buildPanel() {
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.className = 'wizard-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'false');
    panelEl.setAttribute('aria-labelledby', 'wizard-title');
    panelEl.innerHTML = `
      <div class="wizard-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="1" id="wizard-progress-bar">
        <div class="wizard-progress-fill" id="wizard-progress-fill"></div>
      </div>
      <div class="wizard-header">
        <div class="wizard-step-indicator">
          <span class="wizard-step-icon" id="wizard-step-icon">📸</span>
          <div>
            <div class="wizard-step-counter" id="wizard-step-counter">Étape 1 / ${STEPS.length}</div>
            <h3 class="wizard-title" id="wizard-title">Photo de profil</h3>
          </div>
        </div>
        <button type="button" class="wizard-close" id="wizard-close" aria-label="Fermer l'assistant" title="Fermer (Échap)">✕</button>
      </div>
      <div class="wizard-body">
        <p class="wizard-instructions" id="wizard-instructions"></p>
        <div class="wizard-tips" id="wizard-tips"></div>
      </div>
      <div class="wizard-footer">
        <button type="button" class="btn btn-ghost btn-sm" id="wizard-prev">← Précédent</button>
        <button type="button" class="btn btn-outline btn-sm" id="wizard-skip">Passer</button>
        <button type="button" class="btn btn-primary btn-sm" id="wizard-next">Suivant →</button>
      </div>
    `;
    document.body.appendChild(panelEl);

    // Wire boutons
    $('#wizard-close', panelEl).addEventListener('click', closeWizard);
    $('#wizard-prev', panelEl).addEventListener('click', () => go(-1));
    $('#wizard-next', panelEl).addEventListener('click', () => go(1));
    $('#wizard-skip', panelEl).addEventListener('click', () => {
      // "Passer" saute à la dernière étape (finish)
      currentStep = STEPS.length - 1;
      saveStep(currentStep);
      render();
    });

    // Esc pour fermer
    document.addEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (!isActive) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeWizard();
    } else if (e.key === 'ArrowRight' && !e.shiftKey) {
      // Ctrl+→ ou juste → ? On garde → pour avancer, Shift+← pour reculer
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  }

  // -----------------------------------------------------------------
  // Rendu d'une étape
  // -----------------------------------------------------------------
  function render() {
    if (!panelEl) return;
    const step = STEPS[currentStep];

    // Progression
    const progress = ((currentStep + 1) / STEPS.length) * 100;
    $('#wizard-progress-fill', panelEl).style.width = `${progress}%`;
    $('#wizard-progress-bar', panelEl).setAttribute('aria-valuenow', currentStep + 1);

    // Icône + titre + compteur
    $('#wizard-step-icon', panelEl).textContent = step.icon;
    $('#wizard-step-counter', panelEl).textContent = `Étape ${currentStep + 1} / ${STEPS.length}`;
    $('#wizard-title', panelEl).textContent = step.title;

    // Instructions
    $('#wizard-instructions', panelEl).innerHTML = step.instructions;

    // Astuce contextuelle (optionnelle)
    const tipsEl = $('#wizard-tips', panelEl);
    if (step.tip) {
      tipsEl.innerHTML = `<div class="wizard-tip">💡 <span>${step.tip}</span></div>`;
      tipsEl.style.display = '';
    } else {
      tipsEl.style.display = 'none';
    }

    // Boutons
    const prevBtn = $('#wizard-prev', panelEl);
    const nextBtn = $('#wizard-next', panelEl);
    const skipBtn = $('#wizard-skip', panelEl);

    prevBtn.disabled = currentStep === 0;

    if (step.isLast) {
      nextBtn.textContent = '✓ Terminer';
      nextBtn.classList.add('btn-success');
      skipBtn.style.display = 'none';
    } else {
      nextBtn.textContent = 'Suivant →';
      nextBtn.classList.remove('btn-success');
      skipBtn.style.display = step.optional ? '' : 'none';
    }

    // Spotlight : retire l'ancien, ajoute le nouveau
    $$('.wizard-spotlight').forEach(el => el.classList.remove('wizard-spotlight'));
    const target = $(step.selector);
    if (target) {
      target.classList.add('wizard-spotlight');
      // Scroll smooth (sauf reduced-motion)
      target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
      // Focus discret sur le champ clé
      if (step.ctaFocus) {
        setTimeout(() => {
          const focusEl = $(step.ctaFocus);
          if (focusEl && focusEl !== document.activeElement) {
            // On ne vole pas le focus si l'utilisateur tape déjà ailleurs
            // mais on met un outline renforcé
            focusEl.classList.add('wizard-cta-pulse');
            setTimeout(() => focusEl.classList.remove('wizard-cta-pulse'), 2500);
          }
        }, REDUCED_MOTION ? 0 : 400);
      }
    }

    saveStep(currentStep);
  }

  function go(delta) {
    const next = currentStep + delta;
    if (next < 0) return;
    if (next >= STEPS.length) {
      // Terminé
      markDone();
      closeWizard();
      // Petit toast de félicitations
      if (typeof window.showToast === 'function') {
        window.showToast('CV complété avec l\'assistant ! 🎉', 'success');
      }
      return;
    }
    currentStep = next;
    render();
  }

  // -----------------------------------------------------------------
  // Ouverture / fermeture
  // -----------------------------------------------------------------
  function openWizard(opts) {
    opts = opts || {};
    buildPanel();
    isActive = true;
    if (opts.fromStart) {
      currentStep = 0;
    } else {
      currentStep = getStep();
    }
    panelEl.classList.add('is-active');
    document.body.classList.add('wizard-active');
    render();
  }

  function closeWizard() {
    isActive = false;
    if (panelEl) {
      panelEl.classList.remove('is-active');
    }
    document.body.classList.remove('wizard-active');
    $$('.wizard-spotlight').forEach(el => el.classList.remove('wizard-spotlight'));
  }

  // API publique pour relancer manuellement
  window.designcvWizard = {
    start: () => openWizard({ fromStart: true }),
    open: () => openWizard({}),
    close: closeWizard,
  };

  // -----------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------
  function boot() {
    // Bouton "Assistant" dans la navbar (injecté dynamiquement)
    const navActions = $('.nav-actions');
    if (navActions) {
      const wizardBtn = document.createElement('button');
      wizardBtn.className = 'btn btn-ghost';
      wizardBtn.id = 'btn-wizard';
      wizardBtn.innerHTML = '🧭 Assistant';
      wizardBtn.setAttribute('aria-label', 'Lancer l\'assistant de création guidée');
      wizardBtn.title = 'Assistant de création (Ctrl+W)';
      wizardBtn.addEventListener('click', () => openWizard({ fromStart: true }));
      // Insère avant le bouton Historique
      navActions.insertBefore(wizardBtn, navActions.firstChild);
    }

    // Raccourci clavier Ctrl+W ( Attention : ne pas capturer le Ctrl+W du navigateur
    // qui ferme l'onglet. On utilise plutôt Alt+W pour éviter le conflit.
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        openWizard({ fromStart: true });
      }
    });

    // Auto-launch au 1er visit (après un court délai pour laisser app.js initialiser)
    if (isFirstVisit()) {
      setTimeout(() => {
        openWizard({ fromStart: true });
      }, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  console.log('[DesignCV] Module 7 — Assistant de création (wizard) chargé.');
})();
