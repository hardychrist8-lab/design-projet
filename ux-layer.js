/* =========================================================
   🧠 DesignCV — UX Layer (Module 6 — Partie JS)
   Comportements décoratifs uniquement.
   ❌ Ne touche jamais à state, syncAndRender, renderCV
   ❌ N'appelle jamais les fonctions internes de app.js
   ✅ Lit/cible uniquement les sélecteurs existants
   ========================================================= */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {

        // ---------- 1. ICÔNE VALIDATION SUR CHAMPS VALIDES ----------
        // On attend que les inputs existent (ils sont déjà dans le DOM au DOMContentLoaded)
        const watchedInputs = document.querySelectorAll(
            '#email, #phone, #firstName, #lastName, #jobTitle, #location, #profile'
        );

        watchedInputs.forEach(input => {
            // Wrapper relatif pour positionner l'icône
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            const icon = document.createElement('span');
            icon.className = 'ux-valid-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '✓';
            icon.style.cssText = `
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%) scale(0);
                color: var(--success, #059669);
                font-size: 14px;
                font-weight: 700;
                pointer-events: none;
                transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 1;
            `;
            wrapper.appendChild(icon);

            const update = () => {
                // Pour textarea, on ne montre pas l'icône (trop encombrant)
                if (input.tagName === 'TEXTAREA') return;
                // Validité native + non vide
                const isValid = input.checkValidity() && input.value.trim().length > 0;
                icon.style.transform = isValid
                    ? 'translateY(-50%) scale(1)'
                    : 'translateY(-50%) scale(0)';
            };

            input.addEventListener('input', update);
            input.addEventListener('blur', update);
            update();
        });

        // ---------- 2. ICÔNE DE STATUT DANS LES SECTION TITLES ----------
        // Ajoute une pastille discrète "complétée" sur les sections remplies
        const sections = document.querySelectorAll('.form-section');
        sections.forEach(section => {
            const title = section.querySelector('.section-title');
            if (!title) return;

            const dot = document.createElement('span');
            dot.className = 'ux-section-dot';
            dot.setAttribute('aria-hidden', 'true');
            dot.style.cssText = `
                display: inline-block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--success, #059669);
                margin-left: 8px;
                opacity: 0;
                transform: scale(0);
                transition: opacity 200ms ease, transform 200ms ease;
            `;
            title.appendChild(dot);

            const update = () => {
                const inputs = section.querySelectorAll('input, textarea, select');
                if (!inputs.length) return;
                const filled = Array.from(inputs).some(i => i.value.trim().length > 0);
                dot.style.opacity = filled ? '1' : '0';
                dot.style.transform = filled ? 'scale(1)' : 'scale(0)';
            };

            inputs.forEach(input => {
                input.addEventListener('input', update);
                input.addEventListener('change', update);
            });
            update();
        });

        // ---------- 3. SOULIGNEMENT DYNAMIQUE DU BOUTON PRIMAIRE ----------
        // Micro-pulse sur le bouton "Télécharger PDF" quand des données sont saisies
        const downloadBtn = document.getElementById('btn-download');
        const preview = document.getElementById('cv-render');
        if (downloadBtn && preview) {
            const observer = new MutationObserver(() => {
                const hasData = preview.querySelector('.theme-classic, .theme-modern, .theme-elegant');
                if (hasData && !downloadBtn.dataset.pulsed) {
                    downloadBtn.dataset.pulsed = '1';
                    downloadBtn.style.animation = 'ctaPulse 600ms ease-out';
                    setTimeout(() => {
                        downloadBtn.style.animation = '';
                    }, 600);
                } else if (!hasData) {
                    delete downloadBtn.dataset.pulsed;
                }
            });
            observer.observe(preview, { childList: true, subtree: true });
        }

        // Keyframe injectée dynamiquement (évite de polluer le CSS)
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ctaPulse {
                0%, 100% { box-shadow: 0 1px 2px rgba(79,70,229,0.25), 0 2px 8px rgba(79,70,229,0.15); }
                50% { box-shadow: 0 0 0 8px rgba(79,70,229,0), 0 1px 2px rgba(79,70,229,0.25); }
            }
        `;
        document.head.appendChild(style);

        // ---------- 4. SAISIE RAPIDE : ENTRÉE SUR CHAMPS TEXT = NEXT ----------
        // Sur les inputs du formulaire identité, Entrée → focus next input
        const identityInputs = ['firstName', 'lastName', 'jobTitle', 'email', 'phone', 'location'];
        identityInputs.forEach((id, idx) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextId = identityInputs[idx + 1];
                    const next = nextId ? document.getElementById(nextId) : document.getElementById('profile');
                    if (next) next.focus();
                }
            });
        });

        // ---------- 5. EFFET "PRESS" SUR LES ENTRY CARDS ----------
        // Légère vibration au clic du bouton supprimer
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.btn-remove');
            if (removeBtn) {
                const card = removeBtn.closest('.entry-card');
                if (card) {
                    card.style.transition = 'opacity 150ms ease, transform 150ms ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(-10px) scale(0.95)';
                }
            }
        });

    });
})();
