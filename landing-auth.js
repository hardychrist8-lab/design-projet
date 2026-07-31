/* =====================================================================
 * landing-auth.js  —  DesignCV Landing Page Auth
 * ---------------------------------------------------------------------
 * Gère l'authentification Supabase sur la landing page.
 * Login / Signup + Google OAuth + redirect vers app.html.
 * ===================================================================== */

(function () {
  'use strict';

  // -----------------------------------------------------------------
  // Supabase Config
  // -----------------------------------------------------------------
  const SUPABASE_URL = 'https://nuogpqbwumbvbdmwcyyr.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_VMaj7rVvYUYk3o18I0BvVw_an71dkJ5';

  let supabase = null;
  let isSignup = false;

  // -----------------------------------------------------------------
  // DOM refs
  // -----------------------------------------------------------------
  const $ = (s) => document.querySelector(s);
  const form = $('#auth-form');
  const nameField = $('#field-name');
  const emailInput = $('#input-email');
  const passwordInput = $('#input-password');
  const passwordToggle = $('#password-toggle');
  const meterBar = $('#password-meter-bar');
  const passwordHint = $('#password-hint');
  const submitBtn = $('#auth-submit');
  const submitText = $('.auth-submit-text');
  const submitLoader = $('.auth-submit-loader');
  const errorEl = $('#auth-error');
  const successEl = $('#auth-success');
  const subtitleEl = $('#auth-subtitle');
  const toggleText = $('#auth-toggle-text');
  const toggleLink = $('#auth-toggle-link');
  const googleBtn = $('#auth-google');
  const forgotBtn = $('#auth-forgot');

  // -----------------------------------------------------------------
  // Init Supabase
  // -----------------------------------------------------------------
  function initSupabase() {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[DesignCV] Supabase JS non disponible.');
      return false;
    }
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return true;
    } catch (err) {
      console.error('[DesignCV] Erreur init Supabase:', err);
      return false;
    }
  }

  // -----------------------------------------------------------------
  // Session restore — si déjà connecté, redirect direct
  // -----------------------------------------------------------------
  async function checkSession() {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        redirectToApp();
      }
    } catch (e) { /* silent */ }
  }

  // -----------------------------------------------------------------
  // Auth handlers
  // -----------------------------------------------------------------
  async function handleLogin(email, password) {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      showError(friendlyError(error.message));
      return;
    }
    redirectToApp();
  }

  async function handleSignup(email, password, name) {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (error) {
      showError(friendlyError(error.message));
      return;
    }
    // Si email confirmation activée, afficher un message
    if (data.user && !data.session) {
      showSuccess('Compte créé ! Vérifiez votre email puis connectez-vous.');
      switchToLogin();
      return;
    }
    // Sinon redirection directe
    redirectToApp();
  }

  async function handleGoogle() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app.html',
      },
    });
    if (error) showError(friendlyError(error.message));
  }

  async function handleForgotPassword() {
    if (!supabase) return;
    const email = emailInput.value.trim();
    if (!email) { showError('Entrez votre email pour réinitialiser le mot de passe.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/index.html',
    });
    setLoading(false);
    if (error) { showError(friendlyError(error.message)); return; }
    showSuccess('Un email de réinitialisation a été envoyé à ' + email + '.');
  }

  // -----------------------------------------------------------------
  // Password UX — indicateur visuel simple, PAS restrictif
  // -----------------------------------------------------------------
  function updatePasswordMeter() {
    const len = passwordInput.value.length;
    const bar = meterBar;
    const hint = passwordHint;

    if (len === 0) {
      bar.style.width = '0%';
      bar.style.background = 'var(--text-muted)';
      hint.innerHTML = '&nbsp;';
      return;
    }

    // 3 niveaux visuels uniquement, aucune restriction
    if (len < 6) {
      bar.style.width = '25%';
      bar.style.background = '#EF4444';
      hint.textContent = 'Trop court';
      hint.style.color = '#FCA5A5';
    } else if (len < 10) {
      bar.style.width = '60%';
      bar.style.background = '#F59E0B';
      hint.textContent = 'Mot de passe correct';
      hint.style.color = '#FCD34D';
    } else {
      bar.style.width = '100%';
      bar.style.background = '#22C55E';
      hint.textContent = 'Excellent';
      hint.style.color = '#86EFAC';
    }
  }

  // -----------------------------------------------------------------
  // Toggle login / signup
  // -----------------------------------------------------------------
  function switchToSignup() {
    isSignup = true;
    nameField.classList.add('auth-field--visible');
    submitText.textContent = 'Créer mon compte';
    subtitleEl.textContent = 'Créez votre compte gratuitement';
    toggleText.textContent = 'Déjà un compte ?';
    toggleLink.textContent = 'Se connecter';
    passwordInput.setAttribute('autocomplete', 'new-password');
    forgotBtn.style.display = 'none';
    clearMessages();
  }

  function switchToLogin() {
    isSignup = false;
    nameField.classList.remove('auth-field--visible');
    submitText.textContent = 'Se connecter';
    subtitleEl.textContent = 'Connectez-vous pour accéder à votre espace';
    toggleText.textContent = 'Pas encore de compte ?';
    toggleLink.textContent = 'Créer un compte';
    passwordInput.setAttribute('autocomplete', 'current-password');
    forgotBtn.style.display = '';
    clearMessages();
  }

  // -----------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    successEl.style.display = 'none';
  }

  function showSuccess(msg) {
    successEl.textContent = msg;
    successEl.style.display = 'block';
    errorEl.style.display = 'none';
  }

  function clearMessages() {
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitText.style.display = loading ? 'none' : '';
    submitLoader.style.display = loading ? 'flex' : 'none';
  }

  function friendlyError(msg) {
    // Traduction des erreurs Supabase courantes
    const map = {
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'User already registered': 'Un compte existe déjà avec cet email.',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
      'Too many requests': 'Trop de tentatives. Réessayez dans quelques instants.',
      'Network request failed': 'Erreur réseau. Vérifiez votre connexion.',
    };
    for (const [key, val] of Object.entries(map)) {
      if (msg.includes(key)) return val;
    }
    return msg;
  }

  function redirectToApp() {
    window.location.href = 'app.html';
  }

  // -----------------------------------------------------------------
  // GSAP entrance animations
  // -----------------------------------------------------------------
  function playEntrance() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.landing-bg', { opacity: 0, duration: 0.8 })
      .from('.brand-badge', { opacity: 0, y: 20, duration: 0.6 }, '-=0.3')
      .from('.brand-title', { opacity: 0, y: 30, duration: 0.7 }, '-=0.4')
      .from('.brand-tagline', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
      .from('.feature-item', { opacity: 0, x: -20, duration: 0.4, stagger: 0.1 }, '-=0.3')
      .from('.auth-card', { opacity: 0, y: 40, scale: 0.96, duration: 0.8 }, '-=0.6');
  }

  // -----------------------------------------------------------------
  // Wire events
  // -----------------------------------------------------------------
  function wireEvents() {
    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) { showError('Veuillez remplir tous les champs.'); return; }
      if (isSignup) {
        const name = $('#input-name').value.trim();
        handleSignup(email, password, name);
      } else {
        handleLogin(email, password);
      }
    });

    // Toggle login/signup
    toggleLink.addEventListener('click', () => {
      if (isSignup) switchToLogin(); else switchToSignup();
    });

    // Google OAuth
    googleBtn.addEventListener('click', handleGoogle);

    // Forgot password
    forgotBtn.addEventListener('click', handleForgotPassword);

    // Password toggle visibility
    passwordToggle.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      passwordToggle.querySelector('.eye-open').style.display = isHidden ? 'none' : '';
      passwordToggle.querySelector('.eye-closed').style.display = isHidden ? '' : 'none';
    });

    // Password meter
    passwordInput.addEventListener('input', updatePasswordMeter);

    // Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearMessages();
      }
    });
  }

  // -----------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------
  function boot() {
    if (!initSupabase()) {
      // Si Supabase pas dispo, on laisse l'UI mais montre un avertissement
      showError('Service temporairement indisponible. Réessayez plus tard.');
    }
    wireEvents();
    playEntrance();
    checkSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
