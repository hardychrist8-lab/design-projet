/* =====================================================================
 * skill-suggestions.js  —  DesignCV Module 14 (Skills intelligents)
 * ---------------------------------------------------------------------
 * OVERLAY PRINCIPLE : ce script NE MODIFIE PAS app.js ni style.css.
 * Il s'accroche au DOM existant (inputs #tech-skill-input,
 * #other-skill-input, #jobTitle) et appelle les fonctions globales
 * déjà exposées par app.js : window.addSkill('tech'|'other').
 *
 * Comportement :
 *  1. Charge skills-data.json (base de suggestions par famille de métier).
 *  2. Injecte une zone de suggestions sous chaque input de compétence.
 *  3. Écoute #jobTitle (debounced) → détecte la famille de métier.
 *  4. Affiche des chips cliquables ; un clic ajoute la compétence via
 *     window.addSkill() (mécanisme natif, inchangé).
 *  5. Saisie libre TOUJOURS disponible (l'input natif reste fonctionnel).
 *  6. Les compétences déjà ajoutées sont grisées dans les suggestions.
 *  7. Respecte prefers-reduced-motion (pas d'animation).
 *  8. Échoue proprement : si le JSON ne charge pas, l'app reste 100 %
 *     fonctionnelle (saisie libre uniquement).
 * ===================================================================== */

(function () {
  'use strict';

  // -----------------------------------------------------------------
  // Garde-fou : ne pas ré-exécuter si déjà chargé (hot reload / double include)
  // -----------------------------------------------------------------
  if (window.__designcvSkillSuggestionsLoaded) return;
  window.__designcvSkillSuggestionsLoaded = true;

  // -----------------------------------------------------------------
  // Configuration
  // -----------------------------------------------------------------
  const CONFIG = {
    jsonPath: 'skills-data.json',
    debounceMs: 280,
    maxChipsPerColumn: 12,        // on plafonne pour ne pas saturer l'écran
    collapsedByDefault: false,
  };

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------------------------------------------
  // État interne
  // -----------------------------------------------------------------
  let DATA = null;                // contenu de skills-data.json
  let currentFamilyId = 'default';// famille détectée
  let collapsed = { tech: CONFIG.collapsedByDefault, other: CONFIG.collapsedByDefault };

  // -----------------------------------------------------------------
  // Utilitaires
  // -----------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Normalise une chaîne : minuscules, sans accents, espaces simplifiées. */
  function normalize(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // accents
      .replace(/[^a-z0-9\s-]/g, ' ')     // ponctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Debounce simple. */
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /** Échappe le HTML pour éviter toute injection dans les chips. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Lit les compétences déjà sélectionnées depuis le DOM (source de vérité = app.js). */
  function readSelected(type) {
    const containerId = type === 'tech' ? 'tech-skills-container' : 'other-skills-container';
    const container = document.getElementById(containerId);
    if (!container) return [];
    return $$('.skill-tag', container).map(tag => {
      // Le tag contient "SkillName ✕" — on extrait le texte avant le bouton remove.
      const clone = tag.cloneNode(true);
      const removeBtn = clone.querySelector('.skill-remove');
      if (removeBtn) removeBtn.remove();
      return clone.textContent.trim();
    });
  }

  /** Détection de la famille de métier à partir du titre du poste. */
  function detectFamily(jobTitle) {
    if (!DATA) return null;
    const normalized = normalize(jobTitle);
    if (!normalized) return DATA.default;

    for (const family of DATA.families) {
      for (const kw of family.keywords) {
        // Match par mot entier ou sous-chaîne (les mots-clés sont déjà normalisés dans le JSON)
        if (normalized.includes(kw)) {
          return family;
        }
      }
    }
    return DATA.default;
  }

  // -----------------------------------------------------------------
  // Injection des conteneurs de suggestions dans le DOM existant
  // -----------------------------------------------------------------
  function injectContainers() {
    const columns = [
      { type: 'tech',  inputId: 'tech-skill-input',  containerId: 'tech-skills-container' },
      { type: 'other', inputId: 'other-skill-input', containerId: 'other-skills-container' },
    ];

    columns.forEach(col => {
      const input = document.getElementById(col.inputId);
      const existingContainer = document.getElementById(col.containerId);
      if (!input || !existingContainer) return;
      // Evite la double injection (hot reload)
      if (input.parentElement.querySelector(`.skill-suggestions[data-type="${col.type}"]`)) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'skill-suggestions';
      wrapper.setAttribute('data-type', col.type);
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', `Suggestions de compétences — ${col.type === 'tech' ? 'techniques' : 'soft skills'}`);
      wrapper.innerHTML = `
        <div class="skill-suggestions-header">
          <span class="skill-suggestions-badge" data-badge>Suggestions</span>
          <button type="button" class="skill-suggestions-toggle" data-toggle aria-expanded="${!collapsed[col.type]}">
            <span class="skill-suggestions-toggle-label">${collapsed[col.type] ? 'Afficher' : 'Masquer'}</span>
            <span class="skill-suggestions-chevron" aria-hidden="true">▾</span>
          </button>
        </div>
        <div class="skill-suggestions-body" data-body>
          <div class="skill-suggestions-chips" data-chips></div>
          <p class="skill-suggestions-hint">Cliquez pour ajouter, ou saisissez librement votre compétence ci-dessus.</p>
        </div>
      `;

      // Insère ENTRE .skill-input-group et .skills-container
      const inputGroup = input.parentElement; // .skill-input-group
      inputGroup.parentElement.insertBefore(wrapper, existingContainer);

      // Toggle afficher/masquer
      const toggleBtn = wrapper.querySelector('[data-toggle]');
      const body = wrapper.querySelector('[data-body]');
      const toggleLabel = wrapper.querySelector('.skill-suggestions-toggle-label');
      toggleBtn.addEventListener('click', () => {
        collapsed[col.type] = !collapsed[col.type];
        body.classList.toggle('is-collapsed', collapsed[col.type]);
        toggleLabel.textContent = collapsed[col.type] ? 'Afficher' : 'Masquer';
        toggleBtn.setAttribute('aria-expanded', String(!collapsed[col.type]));
      });

      if (collapsed[col.type]) body.classList.add('is-collapsed');
    });
  }

  // -----------------------------------------------------------------
  // Rendu des chips
  // -----------------------------------------------------------------
  function renderChips(type) {
    const wrapper = document.querySelector(`.skill-suggestions[data-type="${type}"]`);
    if (!wrapper || !DATA) return;

    const family = (currentFamilyId === 'default')
      ? DATA.default
      : (DATA.families.find(f => f.id === currentFamilyId) || DATA.default);

    const pool = type === 'tech' ? family.technical : family.soft;
    const selected = readSelected(type);
    const selectedSet = new Set(selected.map(normalize));

    const chipsHost = wrapper.querySelector('[data-chips]');
    const badge = wrapper.querySelector('[data-badge]');

    // Badge dynamique : nom de la famille détectée
    badge.textContent = `Suggestions — ${family.label}`;

    // Construit les chips (limitées)
    const chips = pool.slice(0, CONFIG.maxChipsPerColumn).map(skill => {
      const already = selectedSet.has(normalize(skill));
      return `<button type="button"
          class="skill-chip${already ? ' is-added' : ''}"
          data-skill="${escapeHtml(skill)}"
          ${already ? 'aria-disabled="true" tabindex="-1"' : 'aria-pressed="false"'}>
          ${escapeHtml(skill)}${already ? ' <span class="skill-chip-check" aria-hidden="true">✓</span>' : ''}
        </button>`;
    }).join('');

    chipsHost.innerHTML = chips;

    // Wire les clics
    $$('button.skill-chip', chipsHost).forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-added')) return;
        const skill = btn.getAttribute('data-skill');
        if (!skill) return;

        // Pousse la valeur dans l'input puis déclenche addSkill natif
        const inputId = type === 'tech' ? 'tech-skill-input' : 'other-skill-input';
        const input = document.getElementById(inputId);
        if (input) {
          input.value = skill;
          input.focus();
        }
        // Appel natif app.js (exposé globalement)
        if (typeof window.addSkill === 'function') {
          window.addSkill(type);
        } else {
          // Fallback : déclenche Enter sur l'input
          if (input) input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
        }

        // Feedback visuel immédiat (la MutationObserver re-rendra proprement)
        btn.classList.add('is-added');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('tabindex', '-1');
        btn.innerHTML = `${escapeHtml(skill)} <span class="skill-chip-check" aria-hidden="true">✓</span>`;

        // Petit pulse discret (sauf reduced-motion)
        if (!REDUCED_MOTION) {
          btn.animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }],
            { duration: 220, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
          );
        }
      });
    });
  }

  function renderAllChips() {
    renderChips('tech');
    renderChips('other');
  }

  // -----------------------------------------------------------------
  // Détection + rendu lié au jobTitle
  // -----------------------------------------------------------------
  const handleJobTitleChange = debounce(() => {
    const jobInput = document.getElementById('jobTitle');
    if (!jobInput) return;
    const family = detectFamily(jobInput.value);
    if (!family) return;
    const newId = family.id || 'default';
    if (newId !== currentFamilyId) {
      currentFamilyId = newId;
      renderAllChips();
    }
  }, CONFIG.debounceMs);

  // -----------------------------------------------------------------
  // MutationObserver : re-rend les chips quand les compétences changent
  // (ajout/suppression via app.js) pour griser/dégriser les chips.
  // -----------------------------------------------------------------
  function observeSkillsContainers() {
    ['tech-skills-container', 'other-skills-container'].forEach((id, idx) => {
      const container = document.getElementById(id);
      if (!container) return;
      const type = idx === 0 ? 'tech' : 'other';
      const obs = new MutationObserver(() => {
        // Re-render uniquement les chips de ce type (perf)
        renderChips(type);
      });
      obs.observe(container, { childList: true, subtree: false });
    });
  }

  // -----------------------------------------------------------------
  // Chargement du JSON
  // -----------------------------------------------------------------
  async function loadData() {
    try {
      const res = await fetch(CONFIG.jsonPath, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DATA = await res.json();
      return true;
    } catch (err) {
      console.warn('[DesignCV] skills-data.json introuvable, suggestions désactivées. Saisie libre reste disponible.', err);
      return false;
    }
  }

  // -----------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------
  function init() {
    injectContainers();

    // Si le JSON n'a pas pu charger, on laisse l'app fonctionner normalement
    // (les conteneurs restent vides mais l'input natif marche).
    loadData().then(ok => {
      if (!ok) {
        // Cache les conteneurs vides pour ne pas polluer l'UI
        $$('.skill-suggestions').forEach(el => el.classList.add('is-unavailable'));
        return;
      }

      // Détection initiale (au cas où le jobTitle est pré-rempli par loadFromHistory)
      const jobInput = document.getElementById('jobTitle');
      if (jobInput) {
        const family = detectFamily(jobInput.value);
        if (family) currentFamilyId = family.id || 'default';
        jobInput.addEventListener('input', handleJobTitleChange);
        jobInput.addEventListener('change', handleJobTitleChange);
      }

      renderAllChips();
      observeSkillsContainers();

      /* Module 14 — Skills intelligents actif. */
    });
  }

  // -----------------------------------------------------------------
  // Boot : on attend que app.js ait construit le DOM (DOMContentLoaded
  // ou après, car app.js est chargé en defer-like à la fin du body).
  // -----------------------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Le DOM est déjà prêt (script chargé en fin de body après app.js)
    init();
  }
})();
