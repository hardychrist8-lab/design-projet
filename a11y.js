/* =========================================================
   ♿ DesignCV — Accessibilité (Module 10 — Partie JS)
   ARIA injection + focus trap + raccourcis clavier
   ❌ N'altère jamais le comportement des inputs natifs
   ✅ Ajoute uniquement attributs ARIA + écouteurs clavier
   ========================================================= */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {

        // ---------- 1. SKIP LINK ----------
        const skipLink = document.createElement('a');
        skipLink.href = '#cv-render';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Aller au contenu principal';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Cible du skip link
        const cvRender = document.getElementById('cv-render');
        if (cvRender) {
            cvRender.setAttribute('tabindex', '-1');
        }

        // ---------- 2. ARIA SUR BOUTONS ICÔNES ----------
        const iconButtons = [
            { sel: '#btn-close-modal', label: 'Fermer la modale d\'optimisation' },
            { sel: '#btn-close-history', label: 'Fermer l\'historique' },
            { sel: '#btn-close-history-footer', label: 'Fermer l\'historique' }
        ];
        iconButtons.forEach(({ sel, label }) => {
            const el = document.querySelector(sel);
            if (el) {
                el.setAttribute('aria-label', label);
                if (!el.textContent.trim()) {
                    el.setAttribute('aria-hidden', 'true');
                }
            }
        });

        // Boutons ✕ de suppression (entry cards)
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.btn-remove');
            if (removeBtn && !removeBtn.getAttribute('aria-label')) {
                removeBtn.setAttribute('aria-label', 'Supprimer cette entrée');
                removeBtn.setAttribute('title', 'Supprimer');
            }
        });
        // Au chargement, marquer les boutons remove existants
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.setAttribute('aria-label', 'Supprimer cette entrée');
            btn.setAttribute('title', 'Supprimer');
        });

        // Skill remove (✕ dans les tags de compétence)
        const labelSkillRemove = () => {
            document.querySelectorAll('.skill-remove').forEach(el => {
                el.setAttribute('aria-label', 'Retirer cette compétence');
                el.setAttribute('role', 'button');
                el.setAttribute('tabindex', '0');
            });
        };
        labelSkillRemove();
        // Re-marquer après chaque ajout de skill
        const skillsContainers = document.querySelectorAll('.skills-container');
        skillsContainers.forEach(c => {
            new MutationObserver(labelSkillRemove).observe(c, { childList: true });
        });

        // ---------- 3. ARIA SUR NAVBAR ----------
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.setAttribute('role', 'navigation');

        const brandLink = document.querySelector('.brand');
        if (brandLink) brandLink.setAttribute('aria-label', 'DesignCV - Accueil');

        // Boutons de navigation
        const navLabels = {
            'btn-history': 'Historique des CV sauvegardés',
            'btn-optimize': 'Optimiser le design',
            'btn-download': 'Télécharger le CV en PDF'
        };
        Object.entries(navLabels).forEach(([id, label]) => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('aria-label', label);
        });

        // ---------- 4. ARIA SUR SECTIONS FORMULAIRES ----------
        document.querySelectorAll('.form-section').forEach((section, i) => {
            const title = section.querySelector('.section-title');
            if (title) {
                const titleId = `form-section-${i}`;
                title.id = titleId;
                section.setAttribute('aria-labelledby', titleId);
            }
        });

        // ---------- 5. ARIA SUR MODALES ----------
        const modales = [
            { overlay: '#opt-modal', titleText: 'Optimisation du design', closeBtn: '#btn-close-modal' },
            { overlay: '#history-modal', titleText: 'Historique des CV', closeBtn: '#btn-close-history' }
        ];

        modales.forEach(({ overlay, titleText, closeBtn }) => {
            const ov = document.querySelector(overlay);
            if (!ov) return;
            ov.setAttribute('role', 'dialog');
            ov.setAttribute('aria-modal', 'true');
            ov.setAttribute('aria-hidden', 'true');
            ov.setAttribute('aria-label', titleText);

            // Observer pour mettre à jour aria-hidden selon la classe .active
            new MutationObserver(() => {
                const isActive = ov.classList.contains('active');
                ov.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                if (isActive) trapFocus(ov);
            }).observe(ov, { attributes: true, attributeFilter: ['class'] });
        });

        // ---------- 6. ARIA LIVE SUR TOAST ----------
        const toast = document.getElementById('toast');
        if (toast) {
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.setAttribute('aria-atomic', 'true');
        }

        // ---------- 7. FOCUS TRAP ----------
        let lastFocusedBeforeModal = null;

        function trapFocus(modal) {
            const focusable = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable.length) return;

            // Mémoriser le focus précédent
            if (!lastFocusedBeforeModal) {
                lastFocusedBeforeModal = document.activeElement;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            // Focus initial sur le bouton de fermeture
            const closeBtn = modal.querySelector('[aria-label^="Fermer"]');
            if (closeBtn) {
                setTimeout(() => closeBtn.focus(), 50);
            } else {
                setTimeout(() => first.focus(), 50);
            }

            // Handler Tab
            const handler = (e) => {
                if (e.key !== 'Tab') return;
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            };

            // Handler Échap
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    modal.classList.remove('active');
                }
            };

            modal.addEventListener('keydown', handler);
            modal.addEventListener('keydown', escHandler);

            // Cleanup quand la modale se ferme
            const observer = new MutationObserver(() => {
                if (!modal.classList.contains('active')) {
                    modal.removeEventListener('keydown', handler);
                    modal.removeEventListener('keydown', escHandler);
                    observer.disconnect();
                    if (lastFocusedBeforeModal) {
                        lastFocusedBeforeModal.focus();
                        lastFocusedBeforeModal = null;
                    }
                }
            });
            observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        }

        // ---------- 8. RACCOURCIS CLAVIER GLOBAUX ----------
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S → déclenche le téléchargement PDF (au lieu de la sauvegarde navigateur)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const btn = document.getElementById('btn-download');
                if (btn && !btn.disabled) btn.click();
            }

            // Ctrl/Cmd + , → ouvre l'optimisation
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                const btn = document.getElementById('btn-optimize');
                if (btn) btn.click();
            }

            // Ctrl/Cmd + H → ouvre l'historique
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                const btn = document.getElementById('btn-history');
                if (btn) btn.click();
            }
        });

        // ---------- 9. ARIA SUR INPUTS ----------
        const inputLabels = {
            'lastName': 'Nom',
            'firstName': 'Prénom',
            'jobTitle': 'Titre du poste',
            'email': 'Adresse email',
            'phone': 'Numéro de téléphone',
            'location': 'Localisation',
            'profile': 'Profil professionnel'
        };
        Object.entries(inputLabels).forEach(([id, label]) => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('aria-label', label);
                if (id === 'email') el.setAttribute('autocomplete', 'email');
                if (id === 'phone') {
                    el.setAttribute('autocomplete', 'tel');
                    el.setAttribute('inputmode', 'tel');
                }
                if (id === 'firstName') el.setAttribute('autocomplete', 'given-name');
                if (id === 'lastName') el.setAttribute('autocomplete', 'family-name');
            }
        });

        // ---------- 10. ARIA SUR COLOR DOTS & THEME BTNS ----------
        document.querySelectorAll('.color-dot').forEach((dot, i) => {
            const color = dot.dataset.color;
            const colorNames = {
                '#4F46E5': 'Indigo',
                '#059669': 'Émeraude',
                '#0F172A': 'Noir',
                '#DC2626': 'Rouge',
                '#7C3AED': 'Violet'
            };
            const name = colorNames[color] || `Couleur ${i + 1}`;
            dot.setAttribute('role', 'button');
            dot.setAttribute('tabindex', '0');
            dot.setAttribute('aria-label', `Couleur ${name}`);
            dot.setAttribute('aria-pressed', dot.classList.contains('active') ? 'true' : 'false');

            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d =>
                    d.setAttribute('aria-pressed', 'false'));
                dot.setAttribute('aria-pressed', 'true');
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
            const themeName = btn.dataset.theme;
            const labels = { classic: 'Thème classique', modern: 'Thème moderne', elegant: 'Thème élégant' };
            btn.setAttribute('aria-label', labels[themeName] || 'Thème');

            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b =>
                    b.setAttribute('aria-pressed', 'false'));
                btn.setAttribute('aria-pressed', 'true');
            });
        });

        // ---------- 11. NAVIGATION CLAVIER SUR OPT-CARDS ----------
        document.querySelectorAll('.opt-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

    });
})();
