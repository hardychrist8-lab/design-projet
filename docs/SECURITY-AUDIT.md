# 🔒 Rapport de Sécurité — DesignCV

**Date** : Juin 2025  
**Version auditée** : v4 (post-fix auth)  
**Portée** : `landing-auth.js`, `auth-gate.js`, `index.html`, `app.html`

---

## Résumé Exécutif

| Niveau | Nombre |
|---|---|
| CRITIQUE | 0 |
| HAUT | 0 |
| MOYEN | 2 |
| BAS | 3 |

L'application est globalement sécurisée. La clé Supabase anon est publique par conception (protégée par RLS côté serveur). Aucune clé privée n'est exposée.

---

## 1. 🔑 Clés API & Secrets

| Check | Statut | Note |
|---|---|---|
| Clé Supabase anon dans le code client | ✅ OK | C'est une clé publique par conception (équivalent à une API key publique). La sécurité repose sur les RLS (Row Level Security) de Supabase. |
| Tokens d'accès/déploiement dans les fichiers | ✅ OK | Aucun token privé dans le code. `.gitignore` exclut `.env*` et `.vercel`. |
| Mots de passe en clair | ✅ OK | Jamais stockés localement. |

---

## 2. 🔐 Authentification & Sessions

| Check | Statut | Note |
|---|---|---|
| Stockage des tokens | ✅ OK | localStorage avec clé préfixée `sb-...`. Pas de cookie vulnérable. |
| Token dans l'URL (OAuth callback) | ✅ OK | Les tokens arrivent dans le `#hash` (fragment), jamais envoyés au serveur. Nettoyés immédiatement après lecture. |
| Session fixation | ✅ OK | Le token est généré côté Supabase, jamais accepté depuis l'extérieur. |
| CSRF | ✅ OK | Auth par token Bearer dans les headers, pas par cookie. Les formulaires ne soumettent pas de données sensibles (e.preventDefault()). |
| Open redirect (OAuth) | ✅ OK | `redirect_to` est codé en dur (`window.location.origin + '/app.html'`), pas injectable. |
| Logout complet | ✅ OK | Token révoqué côté Supabase + supprimé du localStorage. |

---

## 3. ⚠️ Injection (XSS, etc.)

| Check | Statut | Détail |
|---|---|---|
| `escapeHtml()` présent | ✅ OK | Fonction utilitaire qui échappe `& < > "` |
| Données utilisateur dans innerHTML | ⚠️ MOYEN | `cv.name` et user name/email sont échappés avec `escapeHtml()`. Mais les autres données CV (expérience, compétences) utilisées dans `innerHT">  ML` des composants dynamiques méritent une vérification approfondie. |
| Modal auth injecté en innerHTML | ✅ OK | Contenu statique, pas de données utilisateur. |
| `document.write` / `eval()` | ✅ OK | Aucune utilisation. |
| Cloud list rendering | ⚠️ MOYEN | Les noms de CV sont échappés, mais les dates sont formatées via `toLocaleString()` (safe). Vérifier que `cv.data` n'est jamais rendu en HTML brut. |

---

## 4. 🌐 Sécurité réseau

| Check | Statut | Note |
|---|---|---|
| Toutes les requêtes en HTTPS | ✅ OK | Supabase URL en `https://`, pas de `http://` dans le code. |
| CORS | ✅ OK | Géré par Supabase (seul le domaine autorisé peut faire des requêtes). |
| Content-Security-Policy | ⚠️ BAS | Pas de header CSP configuré. Recommandé d'ajouter un `_headers` file sur Vercel. |
| SRI (Subresource Integrity) | ⚠️ BAS | Les scripts CDN (GSAP, html2pdf, Google Fonts) n'ont pas de hash d'intégrité. Un CDN compromis pourrait injecter du code malveillant. |

---

## 5. 💾 Stockage local

| Check | Statut | Note |
|---|---|---|
| Tokens dans localStorage | ⚠️ BAS | Accessible par tout JS sur la page. Acceptable car pas de第三方 scripts non fiables. Les tokens expirent en 1h. |
| Nettoyage au logout | ✅ OK | `localStorage.removeItem()` + révocation côté serveur. |

---

## 6. 📦 Dépendances tierces

| Dépendance | Risque | Note |
|---|---|---|
| GSAP (CDN cloudflare/jsdelivr) | BAS | Animation uniquement. Pas de SRI mais 2 CDN en fallback. |
| html2pdf.js | BAS | Génération PDF côté client. Pas de SRI. |
| Google Fonts | BAS | Polices uniquement. |

---

## 7. 📢 Fuites d'information

| Check | Statut | Note |
|---|---|---|
| `console.log` avec données sensibles | ⚠️ BAS | 8 `console.log` dans auth-gate.js (emails, état session). Acceptable en production mais à nettoyer pour la version finale. |
| Messages d'erreur détaillés | ✅ OK | `friendlyError()` mappe les erreurs Supabase vers des messages génériques en français. |
| Code source commenté | ✅ OK | Pas d'informations sensibles dans les commentaires. |

---

## 🎯 Recommandations par priorité

### MOYEN — À corriger prochaine itération
1. **Revoir les innerHTML avec données CV** : S'assurer que TOUTES les données utilisateur sont passées dans `escapeHtml()` avant insertion dans le DOM, y compris les sections expérience, compétences, formation.
2. **Vérifier le rendu des données CV cloud** : Quand un CV est chargé depuis le cloud, s'assurer que le HTML n'est pas injecté directement.

### BAS — À corriger quand possible
3. **Ajouter des headers CSP** via `vercel.json` ou `_headers` :
   ```
   /*
     Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://nuogpqbwumbvbdmwcyyr.supabase.co; img-src 'self' data: blob:;
   ```
4. **Ajouter SRI** sur les scripts CDN (GSAP, html2pdf.js).
5. **Supprimer les console.log** en production (ou utiliser un build step).)

---

*Audit effectué par analyse statique du code. Aucun test de pénétration dynamique effectué.*