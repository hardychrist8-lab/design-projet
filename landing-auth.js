/* =====================================================================
 * landing-auth.js  —  DesignCV Landing Page Auth
 * ---------------------------------------------------------------------
 * Auth Supabase via fetch() direct (zero CDN).
 * Login / Signup + Google OAuth + redirect vers app.html.
 * ===================================================================== */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://nuogpqbwumbvbdmwcyyr.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_VMaj7rVvYUYk3o18I0BvVw_an71dkJ5';
  var AUTH_API = SUPABASE_URL + '/auth/v1';
  var isSignup = false;

  // -----------------------------------------------------------------
  // Token storage (compatible supabase-js format)
  // -----------------------------------------------------------------
  function saveSession(data) {
    var session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      token_type: data.token_type || 'bearer',
      user: data.user
    };
    localStorage.setItem('sb-nuogpqbwumbvbdmwcyyr-auth-token', JSON.stringify(session));
    return session;
  }

  function getStoredSession() {
    try {
      var raw = localStorage.getItem('sb-nuogpqbwumbvbdmwcyyr-auth-token');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem('sb-nuogpqbwumbvbdmwcyyr-auth-token');
  }

  // -----------------------------------------------------------------
  // DOM refs
  // -----------------------------------------------------------------
  var $ = function (s) { return document.querySelector(s); };
  var form = $('#auth-form');
  var nameField = $('#field-name');
  var emailInput = $('#input-email');
  var passwordInput = $('#input-password');
  var passwordToggle = $('#password-toggle');
  var meterBar = $('#password-meter-bar');
  var passwordHint = $('#password-hint');
  var submitBtn = $('#auth-submit');
  var submitText = $('.auth-submit-text');
  var submitLoader = $('.auth-submit-loader');
  var errorEl = $('#auth-error');
  var successEl = $('#auth-success');
  var subtitleEl = $('#auth-subtitle');
  var toggleText = $('#auth-toggle-text');
  var toggleLink = $('#auth-toggle-link');
  var googleBtn = $('#auth-google');
  var forgotBtn = $('#auth-forgot');

  // -----------------------------------------------------------------
  // Auth handlers via fetch() REST API
  // -----------------------------------------------------------------
  async function handleLogin(email, password) {
    setLoading(true);
    try {
      var r = await fetch(AUTH_API + '/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await r.json();
      if (!r.ok) {
        showError(friendlyError(data.msg || data.error_description || data.error || 'Erreur de connexion'));
        return;
      }
      saveSession(data);
      redirectToApp();
    } catch (err) {
      showError('Erreur reseau. Verifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(email, password, name) {
    setLoading(true);
    try {
      var r = await fetch(AUTH_API + '/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: email,
          password: password,
          data: { display_name: name }
        })
      });
      var data = await r.json();
      if (!r.ok) {
        showError(friendlyError(data.msg || data.error_description || data.error || 'Erreur lors de la creation du compte'));
        return;
      }
      sendWelcomeEmail(email, name);
      if (data.user && !data.access_token) {
        showSuccess('Compte cree ! Verifiez votre email puis connectez-vous.');
        switchToLogin();
        return;
      }
      if (data.access_token) {
        saveSession(data);
      }
      redirectToApp();
    } catch (err) {
      showError('Erreur reseau. Verifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    var redirectTo = window.location.origin + '/app.html';
    var url = AUTH_API + '/authorize?provider=google&redirect_to=' + encodeURIComponent(redirectTo);
    window.location.href = url;
  }

  async function handleForgotPassword() {
    var email = emailInput.value.trim();
    if (!email) {
      showError('Entrez votre email pour reinitialiser le mot de passe.');
      return;
    }
    setLoading(true);
    try {
      var r = await fetch(AUTH_API + '/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email: email })
      });
      var data = await r.json();
      if (!r.ok) {
        showError(friendlyError(data.msg || data.error_description || data.error || 'Erreur'));
        return;
      }
      showSuccess('Un email de reinitialisation a ete envoye a ' + email + '.');
    } catch (err) {
      showError('Erreur reseau. Verifiez votre connexion internet.');
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------------------
  // Session restore
  // -----------------------------------------------------------------
  async function checkSession() {
    var session = getStoredSession();
    if (!session || !session.access_token) return;
    var now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at > now + 60) {
      redirectToApp();
      return;
    }
    if (session.refresh_token) {
      try {
        var r = await fetch(AUTH_API + '/token?grant_type=refresh_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ refresh_token: session.refresh_token })
        });
        if (r.ok) {
          var data = await r.json();
          saveSession(data);
          redirectToApp();
        } else {
          clearSession();
        }
      } catch (e) {
        // network unavailable
      }
    }
  }

  // -----------------------------------------------------------------
  // Email helper (fire and forget)
  // -----------------------------------------------------------------
  function sendWelcomeEmail(email, name) {
    if (!email) return;
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'welcome', email: email, name: name || '' }),
    }).catch(function () {});
  }

  // -----------------------------------------------------------------
  // Password meter
  // -----------------------------------------------------------------
  function updatePasswordMeter() {
    var len = passwordInput.value.length;
    if (len === 0) {
      meterBar.style.width = '0%';
      meterBar.style.background = 'var(--text-muted)';
      passwordHint.innerHTML = '&nbsp;';
      return;
    }
    if (len < 6) {
      meterBar.style.width = '25%';
      meterBar.style.background = '#EF4444';
      passwordHint.textContent = 'Trop court';
      passwordHint.style.color = '#FCA5A5';
    } else if (len < 10) {
      meterBar.style.width = '60%';
      meterBar.style.background = '#F59E0B';
      passwordHint.textContent = 'Mot de passe correct';
      passwordHint.style.color = '#FCD34D';
    } else {
      meterBar.style.width = '100%';
      meterBar.style.background = '#22C55E';
      passwordHint.textContent = 'Excellent';
      passwordHint.style.color = '#86EFAC';
    }
  }

  // -----------------------------------------------------------------
  // Toggle login / signup
  // -----------------------------------------------------------------
  function switchToSignup() {
    isSignup = true;
    nameField.classList.add('auth-field--visible');
    submitText.textContent = 'Creer mon compte';
    subtitleEl.textContent = 'Creez votre compte gratuitement';
    toggleText.textContent = 'Deja un compte ?';
    toggleLink.textContent = 'Se connecter';
    passwordInput.setAttribute('autocomplete', 'new-password');
    forgotBtn.style.display = 'none';
    clearMessages();
  }

  function switchToLogin() {
    isSignup = false;
    nameField.classList.remove('auth-field--visible');
    submitText.textContent = 'Se connecter';
    subtitleEl.textContent = 'Connectez-vous pour acceder a votre espace';
    toggleText.textContent = 'Pas encore de compte ?';
    toggleLink.textContent = 'Creer un compte';
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
    var map = {
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'invalid_grant': 'Email ou mot de passe incorrect.',
      'User already registered': 'Un compte existe deja avec cet email.',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
      'Too many requests': 'Trop de tentatives. Reessayez dans quelques instants.'
    };
    for (var key in map) {
      if (msg.indexOf(key) !== -1) return map[key];
    }
    return msg;
  }

  function redirectToApp() {
    var cvParam = new URLSearchParams(window.location.search).get('cv');
    var url = cvParam ? 'app.html?cv=' + encodeURIComponent(cvParam) : 'app.html';
    window.location.href = url;
  }

  // -----------------------------------------------------------------
  // GSAP entrance animations
  // -----------------------------------------------------------------
  function playEntrance() {
    if (typeof gsap === 'undefined') {
      document.body.classList.add('gsap-fallback');
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
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
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      if (!email || !password) {
        showError('Veuillez remplir tous les champs.');
        return;
      }
      if (isSignup) {
        var name = $('#input-name').value.trim();
        handleSignup(email, password, name);
      } else {
        handleLogin(email, password);
      }
    });

    toggleLink.addEventListener('click', function () {
      if (isSignup) switchToLogin(); else switchToSignup();
    });

    googleBtn.addEventListener('click', handleGoogle);
    forgotBtn.addEventListener('click', handleForgotPassword);

    passwordToggle.addEventListener('click', function () {
      var isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      passwordToggle.querySelector('.eye-open').style.display = isHidden ? 'none' : '';
      passwordToggle.querySelector('.eye-closed').style.display = isHidden ? '' : 'none';
    });

    passwordInput.addEventListener('input', updatePasswordMeter);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') clearMessages();
    });
  }

  // -----------------------------------------------------------------
  // Boot
  // -----------------------------------------------------------------
  function boot() {
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
