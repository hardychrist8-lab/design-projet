# 🐛 Bugs Connus & Résolus — DesignCV

Ce fichier documente les bugs rencontrés et leur solution pour faciliter le débogage futur.

---

## BUG-001 : Premier clic sur « Se connecter » rafraîchit la page

| Champ | Détail |
|---|---|
| **Date** | Juin 2025 |
| **Sévérité** | CRITIQUE (bloque l'authentification) |
| **Impact** | Android Chrome, certains navigateurs mobiles lents |
| **Statut** | ✅ RÉSOLU (v4) |

### Symptôme
- L'utilisateur clique sur « Se connecter » → la page se rafraîchit
- Au 2ème clic, la connexion fonctionne
- L'utilisateur a l'impression d'être « connecté directement » sans le flux normal

### Cause racine
Dans `landing-auth.js`, les références DOM étaient déclarées au **niveau supérieur de l'IIFE** :
```javascript
// ❌ AVANT — exécuté IMMÉDIATEMENT avant DOMContentLoaded
(function() {
  var form = $('#auth-form');          // null si DOM pas prêt !
  var emailInput = $('#input-email');  // null !
  function wireEvents() {
    form.addEventListener('submit', function(e) { // CRASH si null
      e.preventDefault(); // JAMAIS ATTEINT
    });
  }
  document.addEventListener('DOMContentLoaded', wireEvents);
})();
```

Même si le `<script>` était en bas du `<body>`, certains navigateurs mobiles (Android WebView, Chrome lent) peuvent exécuter le JS avant que le DOM soit entièrement prêt. `form` = `null` → `addEventListener` crash → aucun handler attaché → soumission par défaut du formulaire HTML → **page refresh**.

### Solution
Déplacer TOUTES les requêtes DOM à l'intérieur de `wireEvents()`, et ajouter des gardes `if (!element) return` :
```javascript
// ✅ APRÈS — tout est dans wireEvents(), après DOMContentLoaded
function wireEvents() {
  var form = $('#auth-form');
  if (!form) { console.error('[DesignCV] #auth-form not found!'); return; }
  325
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    // ... auth logic
  }, false);
}
```

### Leçon
> **Règle dorée** : Ne JAMAIS interroger le DOM en dehors d'un callback DOMContentLoaded (ou d'une fonction appelée par celui-ci), même si le script est en bas du `<body>`. C'est particulièrement vrai pour les navigateurs mobiles.

---

## BUG-002 : Google OAuth ne montre pas le sélecteur de compte

| Champ | Détail |
|---|---|
| **Date** | Juin 2025 |
| **Sévérité** | MOYEN (UX dégradée) |
| **Impact** | Tous les utilisateurs déjà connectés à Google sur leur appareil |
| **Statut** | ✅ RÉSOLU (v4) |

### Symptôme
- L'utilisateur clique « Continuer avec Google »
- Il est connecté directement sans pouvoir choisir un compte
- Impossible de se connecter avec un compte Google différent

### Cause racine
L'URL OAuth Supabase ne contenait pas le paramètre `prompt=select_account`. Sans ce paramètre, Google auto-sélectionne le dernier compte utilisé.

### Solution
```javascript
// ❌ AVANT
var url = AUTH_API + '/authorize?provider=google&redirect_to=' + ...;

// ✅ APRÈS
var url = AUTH_API + '/authorize?provider=google'
  + '&redirect_to=' + encodeURIComponent(redirectTo)
  + '&prompt=select_account';  // Force le sélecteur de compte
```

### Leçon
> Toujours ajouter `prompt=select_account` quand l'utilisateur doit pouvoir choisir son compte Google.

---

## BUG-003 : Reconnexion automatique après déconnexion

| Champ | Détail |
|---|---|
| **Date** | Juin 2025 |
| **Sévérité** | HAUT (UX confuse, impossible de changer de compte) |
| **Impact** | Tous les utilisateurs |
| **Statut** | ✅ RÉSOLU (v4) |

### Symptôme
- L'utilisateur se déconnecte → arrive sur la page de login
- `checkSession()` trouve un token encore valide → redirection automatique vers l'app
- L'utilisateur ne peut pas se reconnecter avec un autre compte

### Cause racine
Le logout supprimait bien le token et redirigeait vers `index.html`. Mais si le token n'était pas encore expiré côté Supabase, ou si le `clearSession()` n'avait pas fini avant le redirect, le flux était cassé.

### Solution
1. Après logout, rediriger vers `index.html?logout=1`
2. Dans `checkSession()` sur la landing, vérifier ce paramètre :
```javascript
if (params.get('logout') === '1') {
  clearSession();
  window.history.replaceState({}, '', window.location.pathname);
  return; // Ne PAS auto-redirect
}
```

### Leçon
> Toujours utiliser un mécanisme de « logout flag » quand on redirige vers une page qui fait de l'auto-login par session.

---

## BUG-004 : CDN Supabase bloqué sur certains réseaux Android

| Champ | Détail |
|---|---|
| **Date** | Juin 2025 |
| **Sévérité** | CRITIQUE (auth complètement cassée) |
| **Impact** | Réseaux avec CDN bloqués (certains FAI africains) |
| **Statut** | ✅ RÉSOLU |

### Symptôme
- `window.supabase` est `undefined`
- Aucune authentification possible
- Erreur « connexion impossible »

### Cause racine
Le script Supabase CDN (`cdn.jsdelivr.net`) était bloqué par le FAI de l'utilisateur.

### Solution
Remplacer complètement l'utilisation du SDK Supabase par des appels `fetch()` directs à l'API REST de Supabase. Aucune dépendance CDN pour l'auth.

### Leçon
> Pour une app destinée à l'Afrique, ne PAS dépendre de CDN américains pour des fonctionnalités critiques. Préférer les appels API directs.

---

## BUG-005 : Page non scrollable sur mobile

| Champ | Détail |
|---|---|
| **Date** | Juin 2025 |
| **Sévérité** | HAUT (UX bloquante sur mobile) |
| **Impact** | Tous les appareils mobiles |
| **Statut** | ✅ RÉSOLU |

### Cause racine
`landing-auth.css` avait `overflow: hidden` sur `html, body`.

### Solution
Ajouter un override mobile dans le CSS :
```css
@media (max-width: 860px) {
  html, body { overflow-y: auto; overflow-x: hidden; height: auto; }
}
```

---

## BUG-006 : OAuth redirect loop (token pas encore sauvegardé)

| Champ | Détail |
|---|---|
| **Date** | Juin 2025 |
| **Sévérité** | CRITIQUE (auth Google cassée) |
| **Statut** | ✅ RÉSOLU |

### Cause racine
`handleOAuthCallback()` dans `auth-gate.js` était `async`. Les tokens étaient sauvés dans un `await fetch()` (pour charger le user info), mais `restoreSession()` vérifiait la session avant que le fetch soit terminé → pas de token → redirect vers login → boucle.

### Solution
Sauver les tokens **de manière synchrone** dans `localStorage` AVANT le fetch asynchrone pour le user info.

---

*Document maintenu par l'équipe DesignCV. Dernière mise à jour : Juin 2025*
