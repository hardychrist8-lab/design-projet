/* =====================================================================
 * auth-gate.js  —  DesignCV Phase 4 (Modules 2, 3, 4)
 * ---------------------------------------------------------------------
 * Auth Supabase + Cloud Save/Load + Gate différée hybride.
 *
 * PRINCIPE :
 *  - Si Supabase n'est PAS configuré → tout fonctionne comme avant
 *    (PDF, historique local, optimisation — AUCUNE régression).
 *  - Si Supabase EST configuré → les actions PDF / Sauvegarde cloud /
 *    Optimisation nécessitent d'être connecté (gate différée).
 *    L'utilisateur découvre l'app librement ; la connexion est
 *    demandée uniquement au moment de l'action.
 *
 * NE MODIFIE PAS app.js. Intercepte les clics en phase de capture
 * (stopImmediatePropagation) pour ne pas laisser les handlers
 * existants de app.js se déclencher.
 * ===================================================================== */

(function () {
  'use strict';

  if (window.__designcvAuthGateLoaded) return;
  window.__designcvAuthGateLoaded = true;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // -----------------------------------------------------------------
  // ⚙️  CONFIGURATION — Remplacer par vos vraies valeurs Supabase
  // -----------------------------------------------------------------
  const CONFIG = {
    supabaseUrl: 'https://nuogpqbwumbvbdmwcyvr.supabase.co',
    supabaseAnonKey: 'sb_publishable_VMaj7rVvYUYk3o18I0BvVw_an71dkJ5',
  };

  // -----------------------------------------------------------------
  // État interne
  // -----------------------------------------------------------------
  let supabase = null;
  let currentUser = null;
  let isConfigured = false;
  let pendingAction = null; // fonction à exécuter après connexion
  let modalEl = null;

  // -----------------------------------------------------------------
  // Init Supabase
  // -----------------------------------------------------------------
  function initSupabase() {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[DesignCV] Supabase JS client non chargé.');
      return false;
    }
    if (!CONFIG.supabaseUrl || CONFIG.supabaseUrl === 'YOUR_SUPABASE_URL') {
      console.log('[DesignCV] Phase 4 — Supabase non configuré, mode local uniquement.');
      return false;
    }
    try {
      supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
      isConfigured = true;
      console.log('[DesignCV] Phase 4 — Supabase initialisé.');
      return true;
    } catch (err) {
      console.error('[DesignCV] Erreur init Supabase:', err);
      return false;
    }
  }

  // -----------------------------------------------------------------
  // Session restore
  // -----------------------------------------------------------------
  async function restoreSession() {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUser = session.user;
        onLoginSuccess();
        console.log('[DesignCV] Session restaurée pour', currentUser.email);
      }
    } catch (e) { /* silent */ }
  }

  // -----------------------------------------------------------------
  // Auth : login / signup / logout
  // -----------------------------------------------------------------
  async function handleLogin(email, password) {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { showError(error.message); return; }
    currentUser = data.user;
    closeAuthModal();
    onLoginSuccess();
    if (typeof window.showToast === 'function') window.showToast('Connecté !', 'success');
    if (pendingAction) { const fn = pendingAction; pendingAction = null; setTimeout(fn, 200); }
  }

  async function handleSignup(email, password, displayName) {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) { showError(error.message); return; }
    showInfo('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.');
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    currentUser = null;
    onLogoutCleanup();
    if (typeof window.showToast === 'function') window.showToast('Déconnecté.', 'success');
  }

  // -----------------------------------------------------------------
  // Cloud save / load
  // -----------------------------------------------------------------
  async function saveToCloud(name) {
    if (!supabase || !currentUser) return false;
    try {
      // Récupérer l'état actuel du CV depuis app.js
      // On passe par le DOM car le state n'est pas exposé globalement
      const cvState = buildCurrentState();
      if (!cvState) return false;

      const { error } = await supabase.from('saved_cvs').insert({
        user_id: currentUser.id,
        name: name || 'Mon CV',
        data: cvState,
      });
      if (error) { console.error('[DesignCV] Cloud save error:', error); return false; }
      if (typeof window.showToast === 'function') window.showToast('CV sauvegardé dans le cloud !', 'success');
      refreshCloudList();
      return true;
    } catch (e) { console.error('[DesignCV] Cloud save error:', e); return false; }
  }

  async function loadFromCloud(id) {
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase
        .from('saved_cvs')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return;
      // Utilise le mécanisme natif de chargement de l'historique
      // en injectant dans localStorage et en appelant loadFromHistory
      injectCloudCVAsLocal(data);
      if (typeof window.showToast === 'function') window.showToast('CV chargé depuis le cloud.', 'success');
      closeHistoryModalIfNeeded();
    } catch (e) { console.error('[DesignCV] Cloud load error:', e); }
  }

  async function deleteFromCloud(id) {
    if (!supabase || !currentUser) return;
    const { error } = await supabase.from('saved_cvs').delete().eq('id', id);
    if (!error) {
      refreshCloudList();
      if (typeof window.showToast === 'function') window.showToast('CV supprimé du cloud.', 'success');
    }
  }

  async function refreshCloudList() {
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase
        .from('saved_cvs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });
      if (error || !data) return;
      renderCloudList(data);
    } catch (e) { /* silent */ }
  }

  // Construire l'état du CV à partir du DOM (puisque app.js state n'est pas exposé)
  function buildCurrentState() {
    // On capture les valeurs du formulaire
    const personal = {
      firstName: $('#firstName')?.value || '',
      lastName: $('#lastName')?.value || '',
      jobTitle: $('#jobTitle')?.value || '',
      email: $('#email')?.value || '',
      phone: $('#phone')?.value || '',
      location: $('#location')?.value || '',
      photo: $('#photoPreview img')?.src || null,
    };
    const profile = $('#profile')?.value || '';
    const techSkills = Array.from($$('#tech-skills-container .skill-tag')).map(t => {
      const c = t.cloneNode(true); const r = c.querySelector('.skill-remove'); if (r) r.remove(); return c.textContent.trim();
    });
    const otherSkills = Array.from($$('#other-skills-container .skill-tag')).map(t => {
      const c = t.cloneNode(true); const r = c.querySelector('.skill-remove'); if (r) r.remove(); return c.textContent.trim();
    });
    // Experiences, education, projects, languages — on lit les entry-cards
    const experiences = collectCards('exp');
    const education = collectCards('edu');
    const projects = collectCards('proj');
    const languages = collectCards('lang');
    // Theme et couleur
    const theme = ($('.theme-btn.active')?.dataset.theme) || 'classic';
    const color = ($('.color-dot.active')?.dataset.color) || '#4F46E5';
    return { personal, profile, experiences, education, projects, languages, skills: { technical: techSkills, other: otherSkills }, theme, color };
  }

  function collectCards(type) {
    const list = $(`#${type === 'exp' ? 'experience' : type === 'edu' ? 'education' : type === 'proj' ? 'project' : 'language'}-list`);
    if (!list) return [];
    return $$('.entry-card', list).map(card => {
      const main = $(`.${type}-main`, card)?.value || '';
      const sub = $(`.${type}-sub`, card)?.value || '';
      const start = $(`.${type}-start`, card)?.value || '';
      const end = $(`.${type}-end`, card)?.value || '';
      const desc = $(`.${type}-desc`, card)?.value || '';
      const link = $(`.${type}-link`, card)?.value || '';
      if (type === 'lang') return { id: Date.now(), main, sub };
      if (type === 'proj') return { id: Date.now(), main, link, desc };
      return { id: Date.now(), main, sub, start, end, desc };
    });
  }

  // Injecter un CV cloud dans le localStorage puis le charger
  function injectCloudCVAsLocal(cvRecord) {
    const d = cvRecord.data;
    // Construit une entrée compatible avec le format localStorage de app.js
    const entry = {
      id: Date.now(),
      name: cvRecord.name,
      date: new Date(cvRecord.updated_at).toLocaleString('fr-FR'),
      data: {
        personal: d.personal || { firstName: '', lastName: '', jobTitle: '', email: '', phone: '', location: '', photo: null },
        profile: d.profile || '',
        experiences: d.experiences || [],
        education: d.education || [],
        projects: d.projects || [],
        languages: d.languages || [],
        skills: d.skills || { technical: [], other: [] },
        theme: d.theme || 'classic',
        color: d.color || '#4F46E5',
      },
    };
    // Sauvegarder dans localStorage au format app.js
    try {
      let history = JSON.parse(localStorage.getItem('cvHistory') || '[]');
      history.unshift(entry);
      if (history.length > 20) history = history.slice(0, 20);
      localStorage.setItem('cvHistory', JSON.stringify(history));
      // Appeler la fonction native de chargement
      if (typeof window.loadFromHistory === 'function') {
        window.loadFromHistory(entry);
      }
    } catch (e) { console.error('[DesignCV] Cloud load inject error:', e); }
  }

  function closeHistoryModalIfNeeded() {
    const modal = $('#history-modal');
    if (modal) modal.classList.remove('active');
  }

  // -----------------------------------------------------------------
  // Gate différée hybride
  // Intercepte PDF / Historique-save / Optimiser en phase de capture.
 // -----------------------------------------------------------------
  function installGates() {
    if (!isConfigured) return;

    // PDF Download gate
    const pdfBtn = $('#btn-download');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', function (e) {
        if (currentUser) return; // connecté → laisse passer
        e.stopImmediatePropagation();
        e.preventDefault();
        showAuthModal(() => {
          // Après connexion, clique programmatique sur le bouton
          pdfBtn.click();
        });
      }, true);
    }

    // Optimize gate
    const optBtn = $('#btn-optimize');
    if (optBtn) {
      optBtn.addEventListener('click', function (e) {
        if (currentUser) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        showAuthModal(() => {
          optBtn.click();
        });
      }, true);
    }
  }

  // -----------------------------------------------------------------
  // Auth Modal UI
  // -----------------------------------------------------------------
  function buildAuthModal() {
    if (modalEl) return;
    modalEl = document.createElement('div');
    modalEl.className = 'auth-overlay';
    modalEl.id = 'auth-modal';
    modalEl.innerHTML = `
      <div class="auth-card">
        <button type="button" class="auth-close" id="auth-close" aria-label="Fermer">\u2715</button>
        <div class="auth-header">
          <div class="auth-logo">Design<span>CV</span></div>
          <p class="auth-subtitle" id="auth-subtitle">Connectez-vous pour sauvegarder vos CV</p>
        </div>
        <form id="auth-form" class="auth-form" novalidate>
          <div class="auth-field" id="auth-name-field" style="display:none">
            <label for="auth-name">Nom d'affichage</label>
            <input type="text" id="auth-name" class="auth-input" placeholder="Jean Dupont" autocomplete="name">
          </div>
          <div class="auth-field">
            <label for="auth-email">Email</label>
            <input type="email" id="auth-email" class="auth-input" placeholder="jean@email.com" autocomplete="email" required>
          </div>
          <div class="auth-field">
            <label for="auth-password">Mot de passe</label>
            <input type="password" id="auth-password" class="auth-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" autocomplete="current-password" required minlength="6">
          </div>
          <div class="auth-error" id="auth-error" role="alert"></div>
          <div class="auth-info" id="auth-info" role="status"></div>
          <button type="submit" class="auth-submit btn btn-primary" id="auth-submit">Se connecter</button>
        </form>
        <div class="auth-toggle">
          <span id="auth-toggle-text">Pas de compte ?</span>
          <button type="button" class="auth-toggle-btn" id="auth-toggle-btn">Créer un compte</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    // Wire events
    let isSignup = false;
    const form = $('#auth-form', modalEl);
    const toggleBtn = $('#auth-toggle-btn', modalEl);
    const toggleText = $('#auth-toggle-text', modalEl);
    const nameField = $('#auth-name-field', modalEl);
    const submitBtn = $('#auth-submit', modalEl);
    const subtitle = $('#auth-subtitle', modalEl);

    toggleBtn.addEventListener('click', () => {
      isSignup = !isSignup;
      nameField.style.display = isSignup ? '' : 'none';
      submitBtn.textContent = isSignup ? 'Créer mon compte' : 'Se connecter';
      toggleText.textContent = isSignup ? 'Déjà un compte ?' : 'Pas de compte ?';
      toggleBtn.textContent = isSignup ? 'Se connecter' : 'Créer un compte';
      subtitle.textContent = isSignup ? 'Créez votre compte gratuitement' : 'Connectez-vous pour sauvegarder vos CV';
      clearMessages();
    });

    $('#auth-close', modalEl).addEventListener('click', closeAuthModal);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeAuthModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#auth-email', modalEl).value.trim();
      const password = $('#auth-password', modalEl).value;
      if (!email || !password) { showError('Email et mot de passe requis.'); return; }
      if (isSignup) {
        const name = $('#auth-name', modalEl).value.trim();
        handleSignup(email, password, name);
      } else {
        handleLogin(email, password);
      }
    });

    // Esc ferme la modale
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl?.classList.contains('is-open')) {
        closeAuthModal();
      }
    });

    // Écouter les changements d'auth Supabase
    if (supabase) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          currentUser = session.user;
          onLoginSuccess();
        } else if (event === 'SIGNED_OUT') {
          currentUser = null;
          onLogoutCleanup();
        }
      });
    }
  }

  function showAuthModal(actionAfterLogin) {
    buildAuthModal();
    pendingAction = actionAfterLogin || null;
    modalEl.classList.add('is-open');
    clearMessages();
    // Reset form
    $('#auth-form', modalEl).reset();
    const emailInput = $('#auth-email', modalEl);
    if (emailInput) setTimeout(() => emailInput.focus(), REDUCED_MOTION ? 0 : 200);
  }

  function closeAuthModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    pendingAction = null;
  }

  function showError(msg) {
    const el = $('#auth-error', modalEl);
    if (el) { el.textContent = msg; el.style.display = ''; }
    const info = $('#auth-info', modalEl);
    if (info) info.style.display = 'none';
  }

  function showInfo(msg) {
    const el = $('#auth-info', modalEl);
    if (el) { el.textContent = msg; el.style.display = ''; }
    const err = $('#auth-error', modalEl);
    if (err) err.style.display = 'none';
  }

  function clearMessages() {
    if (!modalEl) return;
    $('#auth-error', modalEl).style.display = 'none';
    $('#auth-info', modalEl).style.display = 'none';
  }

  function setLoading(loading) {
    const btn = $('#auth-submit', modalEl);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Chargement...' : btn.textContent;
  }

  // -----------------------------------------------------------------
  // UI : user menu dans la navbar + cloud section dans historique
  // -----------------------------------------------------------------
  function onLoginSuccess() {
    renderUserMenu();
    injectCloudUI();
    refreshCloudList();
  }

  function onLogoutCleanup() {
    renderUserMenu();
    removeCloudUI();
  }

  function renderUserMenu() {
    let menu = $('#user-menu');
    if (!currentUser) {
      if (menu) menu.remove();
      return;
    }
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'user-menu';
      menu.id = 'user-menu';
      const navActions = $('.nav-actions');
      if (navActions) navActions.insertBefore(menu, navActions.firstChild);
    }
    const email = currentUser.email || '';
    const initial = email.charAt(0).toUpperCase();
    const name = currentUser.user_metadata?.display_name || email.split('@')[0] || 'Compte';
    menu.innerHTML = `
      <button class="user-menu-btn" id="user-menu-btn" aria-label="Menu utilisateur" aria-expanded="false">
        <span class="user-avatar">${initial}</span>
        <span class="user-name">${escapeHtml(name)}</span>
      </button>
      <div class="user-dropdown" id="user-dropdown">
        <div class="user-dropdown-header">
          <span class="user-dropdown-email">${escapeHtml(email)}</span>
        </div>
        <button type="button" class="user-dropdown-item" id="user-save-cloud">
          \u2601 Sauvegarder ce CV
        </button>
        <button type="button" class="user-dropdown-item" id="user-open-history">
          \uD83D\uDCC1 Mes CV sauvegardés
        </button>
        <hr class="user-dropdown-sep">
        <button type="button" class="user-dropdown-item user-dropdown-danger" id="user-logout">
          Déconnexion
        </button>
      </div>
    `;
    // Wire
    $('#user-menu-btn', menu).addEventListener('click', (e) => {
      e.stopPropagation();
      const dd = $('#user-dropdown', menu);
      const isOpen = dd.classList.toggle('is-open');
      $('#user-menu-btn', menu).setAttribute('aria-expanded', String(isOpen));
    });
    $('#user-save-cloud', menu).addEventListener('click', () => {
      const name = $('#firstName')?.value ? `${$('#firstName').value} ${$('#lastName')?.value}`.trim() : 'Mon CV';
      saveToCloud(name);
      closeDropdown();
    });
    $('#user-open-history', menu).addEventListener('click', () => {
      // Ouvre la modale historique
      const histBtn = $('#btn-history');
      if (histBtn) histBtn.click();
      closeDropdown();
    });
    $('#user-logout', menu).addEventListener('click', () => {
      handleLogout();
      closeDropdown();
    });
    // Fermer le dropdown au clic extérieur
    document.addEventListener('click', closeDropdown);
  }

  function closeDropdown() {
    const dd = $('#user-dropdown');
    if (dd) { dd.classList.remove('is-open'); }
    const btn = $('#user-menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  // Inject cloud section dans la modale historique
  function injectCloudUI() {
    if (!currentUser) return;
    const modalBody = $('.modal-body', $('#history-modal'));
    if (!modalBody || $('#cloud-section')) return;
    const cloudDiv = document.createElement('div');
    cloudDiv.id = 'cloud-section';
    cloudDiv.className = 'cloud-section';
    cloudDiv.innerHTML = `
      <div class="cloud-header">
        <h4>\u2601 CV dans le cloud</h4>
        <button type="button" class="btn btn-primary btn-sm" id="cloud-save-btn">+ Sauvegarder ce CV</button>
      </div>
      <div class="cloud-list" id="cloud-list">
        <p class="cloud-empty">Chargement...</p>
      </div>
    `;
    // Insère avant la section locale
    const localDesc = modalBody.querySelector('.modal-desc');
    if (localDesc && localDesc.nextSibling) {
      modalBody.insertBefore(cloudDiv, localDesc.nextSibling);
    } else {
      modalBody.prepend(cloudDiv);
    }
    // Wire save button
    $('#cloud-save-btn', cloudDiv).addEventListener('click', () => {
      const name = $('#firstName')?.value ? `${$('#firstName').value} ${$('#lastName')?.value}`.trim() : 'Mon CV';
      saveToCloud(name);
    });
    refreshCloudList();
  }

  function removeCloudUI() {
    const cs = $('#cloud-section');
    if (cs) cs.remove();
  }

  function renderCloudList(cvs) {
    const list = $('#cloud-list');
    if (!list) return;
    if (!cvs || cvs.length === 0) {
      list.innerHTML = '<p class="cloud-empty">Aucun CV sauvegardé dans le cloud.</p>';
      return;
    }
    list.innerHTML = cvs.map(cv => {
      const date = new Date(cv.updated_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="cloud-item">
          <div class="cloud-item-info">
            <span class="cloud-item-name">${escapeHtml(cv.name)}</span>
            <span class="cloud-item-date">${date}</span>
          </div>
          <div class="cloud-item-actions">
            <button type="button" class="btn btn-ghost btn-sm cloud-load-btn" data-id="${cv.id}">Charger</button>
            <button type="button" class="btn btn-ghost btn-sm cloud-del-btn" data-id="${cv.id}">\u2715</button>
          </div>
        </div>`;
    }).join('');
    // Wire
    $$('.cloud-load-btn', list).forEach(btn => {
      btn.addEventListener('click', () => loadFromCloud(btn.dataset.id));
    });
    $$('.cloud-del-btn', list).forEach(btn => {
      btn.addEventListener('click', () => deleteFromCloud(btn.dataset.id));
    });
  }

  // -----------------------------------------------------------------
  // Utilitaires
  // -----------------------------------------------------------------
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // -----------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------
  function boot() {
    if (initSupabase()) {
      restoreSession();
      installGates();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // API publique
  window.designcvAuth = {
    saveToCloud,
    loadFromCloud,
    deleteFromCloud,
    refreshCloudList,
    isConfigured: () => isConfigured,
    isLoggedIn: () => !!currentUser,
    getUser: () => currentUser,
  };

  console.log('[DesignCV] Phase 4 — Auth gate chargé.', isConfigured ? '(Supabase actif)' : '(mode local)');
})();
