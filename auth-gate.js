/* =====================================================================
 * auth-gate.js  —  DesignCV Phase 4 (Modules 2, 3, 4)
 * ---------------------------------------------------------------------
 * Auth Supabase via fetch() direct (ZÉRO CDN) + Cloud Save/Load + Gate.
 *
 * PRINCIPE :
 *  - Auth et DB via fetch() vers l'API REST Supabase.
 *  - Si Supabase n'est PAS configuré → tout fonctionne comme avant
 *    (PDF, historique local, optimisation — AUCUNE régression).
 *  - Si Supabase EST configuré → les actions PDF / Sauvegarde cloud /
 *    Optimisation nécessitent d'être connecté (gate différée).
 * ===================================================================== */

(function () {
  'use strict';

  if (window.__designcvAuthGateLoaded) return;
  window.__designcvAuthGateLoaded = true;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // -----------------------------------------------------------------
  // ⚙️  CONFIGURATION
  // -----------------------------------------------------------------
  const CONFIG = {
    supabaseUrl: 'https://nuogpqbwumbvbdmwcyyr.supabase.co',
    supabaseAnonKey: 'sb_publishable_VMaj7rVvYUYk3o18I0BvVw_an71dkJ5',
  };
  const AUTH_API = CONFIG.supabaseUrl + '/auth/v1';
  const REST_API = CONFIG.supabaseUrl + '/rest/v1';
  const STORAGE_KEY = 'sb-nuogpqbwumbvbdmwcyyr-auth-token';

  // -----------------------------------------------------------------
  // État interne
  // -----------------------------------------------------------------
  let currentUser = null;
  let isConfigured = false;
  let pendingAction = null;
  let modalEl = null;

  // -----------------------------------------------------------------
  // Token helpers
  // -----------------------------------------------------------------
  function getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveSession(data) {
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 3600,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      token_type: data.token_type || 'bearer',
      user: data.user
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getAccessToken() {
    const s = getSession();
    return s ? s.access_token : null;
  }

  function isTokenValid() {
    const s = getSession();
    if (!s || !s.access_token) return false;
    if (s.expires_at && s.expires_at > Math.floor(Date.now() / 1000) + 60) return true;
    return false;
  }

  async function refreshAccessToken() {
    const s = getSession();
    if (!s || !s.refresh_token) return false;
    try {
      const r = await fetch(AUTH_API + '/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.supabaseAnonKey },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      if (!r.ok) { clearSession(); return false; }
      const data = await r.json();
      saveSession(data);
      currentUser = data.user;
      return true;
    } catch (e) { return false; }
  }

  // -----------------------------------------------------------------
  // Init (plus besoin du SDK CDN)
  // -----------------------------------------------------------------
  function initAuth() {
    if (!CONFIG.supabaseUrl || CONFIG.supabaseUrl === 'YOUR_SUPABASE_URL') {
      console.log('[DesignCV] Phase 4 — Supabase non configuré, mode local uniquement.');
      return false;
    }
    isConfigured = true;
    console.log('[DesignCV] Phase 4 — Supabase initialisé (fetch direct).');
    return true;
  }

  // -----------------------------------------------------------------
  // Session restore + protection de la page app.html
  // -----------------------------------------------------------------
  async function restoreSession() {
    try {
      // Handle OAuth callback FIRST (synchronous token save)
      var oauthHandled = handleOAuthCallback();
      if (oauthHandled) {
        // Tokens just saved synchronously, user info loading in background
        // The background fetch will call onLoginSuccess() when done
        console.log('[DesignCV] OAuth tokens saved, waiting for user info...');
        return;
      }

      if (isTokenValid()) {
        var s = getSession();
        currentUser = s.user;
        onLoginSuccess();
        console.log('[DesignCV] Session restaurée pour', currentUser.email);
        return;
      }

      // Tenter le refresh
      if (await refreshAccessToken()) {
        onLoginSuccess();
        console.log('[DesignCV] Session rafraîchie pour', currentUser.email);
        return;
      }

      // Pas de session valide
      if (isConfigured) {
        console.log('[DesignCV] Non connecté, redirection vers la landing.');
        const cvParam = new URLSearchParams(window.location.search).get('cv');
        const redirectUrl = cvParam ? 'index.html?cv=' + encodeURIComponent(cvParam) : 'index.html';
        window.location.replace(redirectUrl);
      }
    } catch (e) { /* silent */ }
  }

  // -----------------------------------------------------------------
  // Handle OAuth callback (Google login redirect)
  // IMPORTANT: must save tokens SYNCHRONOUSLY so restoreSession()
  // can see them before redirecting to index.html.
  // -----------------------------------------------------------------
  function handleOAuthCallback() {
    var hash = window.location.hash;
    if (!hash || hash.indexOf('access_token') === -1) return false;

    var params = new URLSearchParams(hash.substring(1));
    var accessToken = params.get('access_token');
    var refreshToken = params.get('refresh_token');
    var expiresIn = parseInt(params.get('expires_in') || '3600', 10);
    var type = params.get('token_type') || 'bearer';

    if (!accessToken) return false;

    // Save tokens IMMEDIATELY (synchronous) so isTokenValid() works
    var tempSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      token_type: type,
      user: null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempSession));

    // Clean the URL hash immediately
    window.history.replaceState({}, '', window.location.pathname);

    // Fetch user info in background (non-blocking)
    fetch(AUTH_API + '/user', {
      headers: { 'Authorization': 'Bearer ' + accessToken, 'apikey': CONFIG.supabaseAnonKey }
    })
    .then(function(r) { return r.json(); })
    .then(function(user) {
      tempSession.user = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tempSession));
      currentUser = user;
      onLoginSuccess();
      if (typeof window.showToast === 'function') window.showToast('Connecte !', 'success');
    })
    .catch(function(e) {
      console.error('[DesignCV] OAuth user fetch error:', e);
    });

    return true;
  }

  // -----------------------------------------------------------------
  // Auth : login / signup / logout via fetch()
  // -----------------------------------------------------------------
  async function handleLogin(email, password) {
    setLoading(true);
    try {
      const r = await fetch(AUTH_API + '/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.supabaseAnonKey },
        body: JSON.stringify({ email: email, password: password })
      });
      const data = await r.json();
      if (!r.ok) {
        showError(friendlyError(data.msg || data.error_description || data.error || 'Erreur de connexion'));
        return;
      }
      saveSession(data);
      currentUser = data.user;
      closeAuthModal();
      onLoginSuccess();
      if (typeof window.showToast === 'function') window.showToast('Connecté !', 'success');
      if (pendingAction) { var fn = pendingAction; pendingAction = null; setTimeout(fn, 200); }
    } catch (err) {
      showError('Erreur réseau. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(email, password, displayName) {
    setLoading(true);
    try {
      const r = await fetch(AUTH_API + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': CONFIG.supabaseAnonKey },
        body: JSON.stringify({ email: email, password: password, data: { display_name: displayName } })
      });
      const data = await r.json();
      if (!r.ok) {
        showError(friendlyError(data.msg || data.error_description || data.error || 'Erreur lors de la création'));
        return;
      }
      showInfo('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.');
    } catch (err) {
      showError('Erreur réseau. Vérifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      var token = getAccessToken();
      if (token) {
        fetch(AUTH_API + '/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token, 'apikey': CONFIG.supabaseAnonKey }
        }).catch(function() {});
      }
    } catch(e) { /* silent */ }
    clearSession();
    currentUser = null;
    onLogoutCleanup();
    window.location.replace('index.html?logout=1');
  }

  // -----------------------------------------------------------------
  // REST API helpers pour la DB (saved_cvs)
  // -----------------------------------------------------------------
  function dbHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': CONFIG.supabaseAnonKey,
      'Authorization': 'Bearer ' + getAccessToken()
    };
  }

  // -----------------------------------------------------------------
  // Cloud save / load via REST API
  // -----------------------------------------------------------------
  async function saveToCloud(name) {
    if (!currentUser) return false;
    try {
      const cvState = buildCurrentState();
      if (!cvState) return false;

      // Sécurité: limiter la taille des données (max 200KB)
      const dataSize = JSON.stringify(cvState).length;
      if (dataSize > 200 * 1024) {
        console.warn('[DesignCV] Cloud save rejected: data too large (' + dataSize + ' bytes)');
        if (typeof window.showToast === 'function') window.showToast('CV trop volumineux pour le cloud', 'error');
        return false;
      }

      // Sécurité: limiter le nombre de CV par utilisateur (max 50)
      const countR = await fetch(REST_API + '/saved_cvs?select=id&user_id=eq.' + currentUser.id, {
        headers: { 'apikey': CONFIG.supabaseAnonKey, 'Authorization': 'Bearer ' + getAccessToken(), 'Prefer': 'count=exact', 'Range': '0-0' }
      });
      var contentRange = countR.headers.get('content-range');
      if (contentRange) {
        var total = parseInt(contentRange.split('/')[1], 10);
        if (!isNaN(total) && total >= 50) {
          if (typeof window.showToast === 'function') window.showToast('Limite de 50 CV atteinte. Supprimez-en un.', 'error');
          return false;
        }
      }

      var insertR = await fetch(REST_API + '/saved_cvs', {
        method: 'POST',
        headers: dbHeaders(),
        body: JSON.stringify({
          user_id: currentUser.id,
          name: (name || 'Mon CV').substring(0, 200),
          data: cvState,
        })
      });
      var insertData = await insertR.json();
      if (!insertR.ok) {
        console.error('[DesignCV] Cloud save error:', insertData);
        return false;
      }
      if (typeof window.showToast === 'function') window.showToast('CV sauvegardé dans le cloud !', 'success');
      refreshCloudList();
      sendCvSavedEmail(name || 'Mon CV', insertData.id);
      return true;
    } catch (e) { console.error('[DesignCV] Cloud save error:', e); return false; }
  }

  async function loadFromCloud(id) {
    if (!currentUser) return;
    try {
      var r = await fetch(REST_API + '/saved_cvs?id=eq.' + id + '&user_id=eq.' + currentUser.id, {
        headers: dbHeaders()
      });
      var data = await r.json();
      if (!data || data.length === 0) return;
      injectCloudCVAsLocal(data[0]);
      if (typeof window.showToast === 'function') window.showToast('CV chargé depuis le cloud.', 'success');
      closeHistoryModalIfNeeded();
    } catch (e) { console.error('[DesignCV] Cloud load error:', e); }
  }

  async function deleteFromCloud(id) {
    if (!currentUser) return;
    try {
      var r = await fetch(REST_API + '/saved_cvs?id=eq.' + id, {
        method: 'DELETE',
        headers: dbHeaders()
      });
      if (r.ok) {
        refreshCloudList();
        if (typeof window.showToast === 'function') window.showToast('CV supprimé du cloud.', 'success');
      }
    } catch (e) { /* silent */ }
  }

  async function refreshCloudList() {
    if (!currentUser) return;
    try {
      var r = await fetch(REST_API + '/saved_cvs?user_id=eq.' + currentUser.id + '&order=updated_at.desc', {
        headers: dbHeaders()
      });
      var data = await r.json();
      if (!data) return;
      renderCloudList(data);
    } catch (e) { /* silent */ }
  }

  // Construire l'état du CV à partir du DOM
  function buildCurrentState() {
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
    const experiences = collectCards('exp');
    const education = collectCards('edu');
    const projects = collectCards('proj');
    const languages = collectCards('lang');
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
    try {
      const STORAGE_HIST = 'designcv_history';
      let history = JSON.parse(localStorage.getItem(STORAGE_HIST) || '[]');
      history.unshift(entry);
      if (history.length > 20) history = history.slice(0, 20);
      localStorage.setItem(STORAGE_HIST, JSON.stringify(history));
      if (typeof window.loadFromHistory === 'function') {
        window.loadFromHistory(entry.id);
      }
    } catch (e) { console.error('[DesignCV] Cloud load inject error:', e); }
  }

  function closeHistoryModalIfNeeded() {
    const modal = $('#history-modal');
    if (modal) modal.classList.remove('active');
  }

  // -----------------------------------------------------------------
  // Gates (désactivées — l'accès à app.html est protégé par auth)
  // -----------------------------------------------------------------
  function installGates() { /* gates supprimées */ }

  // -----------------------------------------------------------------
  // Auto-save cloud quand on télécharge le PDF
  // -----------------------------------------------------------------
  function installPdfAutoSave() {
    const dlBtn = $('#btn-download');
    if (!dlBtn) return;
    dlBtn.addEventListener('click', async () => {
      if (!currentUser) return;
      const name = $('#firstName')?.value ? `${$('#firstName').value} ${$('#lastName')?.value}`.trim() : 'Mon CV';
      await saveToCloud(name);
    });
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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl?.classList.contains('is-open')) {
        closeAuthModal();
      }
    });
  }

  function showAuthModal(actionAfterLogin) {
    buildAuthModal();
    pendingAction = actionAfterLogin || null;
    modalEl.classList.add('is-open');
    clearMessages();
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
    btn.textContent = loading ? 'Chargement...' : (btn.dataset.originalText || btn.textContent);
    if (!loading && !btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  }

  // -----------------------------------------------------------------
  // UI : user menu dans la navbar + cloud section dans historique
  // -----------------------------------------------------------------
  function onLoginSuccess() {
    renderUserMenu();
    injectCloudUI();
    refreshCloudList();
    installPdfAutoSave();
    checkUrlCvParam();
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
      const histBtn = $('#btn-history');
      if (histBtn) histBtn.click();
      closeDropdown();
    });
    $('#user-logout', menu).addEventListener('click', () => {
      handleLogout();
      closeDropdown();
    });
    document.addEventListener('click', closeDropdown);
  }

  function closeDropdown() {
    const dd = $('#user-dropdown');
    if (dd) { dd.classList.remove('is-open'); }
    const btn = $('#user-menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

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
    const localDesc = modalBody.querySelector('.modal-desc');
    if (localDesc && localDesc.nextSibling) {
      modalBody.insertBefore(cloudDiv, localDesc.nextSibling);
    } else {
      modalBody.prepend(cloudDiv);
    }
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
    $$('.cloud-load-btn', list).forEach(btn => {
      btn.addEventListener('click', () => loadFromCloud(btn.dataset.id));
    });
    $$('.cloud-del-btn', list).forEach(btn => {
      btn.addEventListener('click', () => deleteFromCloud(btn.dataset.id));
    });
  }

  // -----------------------------------------------------------------
  // Email notifications (fire & forget)
  // -----------------------------------------------------------------
  function sendCvSavedEmail(cvName, cvId) {
    if (!currentUser?.email) return;
    const displayName = currentUser.user_metadata?.display_name || currentUser.email.split('@')[0] || '';
    (async () => {
      let total = 1;
      try {
        var countR = await fetch(REST_API + '/saved_cvs?select=id&user_id=eq.' + currentUser.id, {
          headers: { 'apikey': CONFIG.supabaseAnonKey, 'Authorization': 'Bearer ' + getAccessToken(), 'Prefer': 'count=exact', 'Range': '0-0' }
        });
        var cr = countR.headers.get('content-range');
        if (cr) { var t = parseInt(cr.split('/')[1], 10); if (!isNaN(t)) total = t; }
      } catch (_) { /* keep default */ }
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cv-saved',
          email: currentUser.email,
          name: displayName,
          cvName: cvName,
          totalCvs: total,
          cvId: cvId || '',
        }),
      }).catch(function() {});
    })();
  }

  // -----------------------------------------------------------------
  // Auto-load CV depuis URL (?cv=ID)
  // -----------------------------------------------------------------
  function checkUrlCvParam() {
    const params = new URLSearchParams(window.location.search);
    const cvId = params.get('cv');
    if (!cvId || !currentUser) return;
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => loadFromCloud(cvId), 800);
    if (typeof window.showToast === 'function') window.showToast('Chargement de votre CV...', 'info');
  }

  // -----------------------------------------------------------------
  // Utilitaires
  // -----------------------------------------------------------------
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function friendlyError(msg) {
    var map = {
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'invalid_grant': 'Email ou mot de passe incorrect.',
      'User already registered': 'Un compte existe déjà avec cet email.',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
      'Too many requests': 'Trop de tentatives. Réessayez dans quelques instants.',
      'Network request failed': 'Erreur réseau. Vérifiez votre connexion.'
    };
    for (var key in map) {
      if (msg.indexOf(key) !== -1) return map[key];
    }
    return msg;
  }

  // -----------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------
  function boot() {
    if (initAuth()) {
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

  console.log('[DesignCV] Phase 4 — Auth gate chargé.', isConfigured ? '(Supabase fetch direct)' : '(mode local)');
})();
