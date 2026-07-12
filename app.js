/* =========================================
   🧠 DesignCV - Logique Principale (js/app.js)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {

    // 1. ÉTAT GLOBAL DE L'APPLICATION
    const state = {
        personal: { firstName: '', lastName: '', jobTitle: '', email: '', phone: '', location: '', photo: null },
        profile: '',
        experiences: [],
        education: [],
        languages: [],
        projects: [],
        skills: { technical: [], other: [] },
        theme: 'classic',
        color: '#4F46E5',
        variant: 'balanced' // balanced, compact, spacious
    };

    // 2. RÉFÉRENCES DOM (Cache)
    const dom = {
        inputs: {
            lastName: document.getElementById('lastName'),
            firstName: document.getElementById('firstName'),
            jobTitle: document.getElementById('jobTitle'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            location: document.getElementById('location'),
            profile: document.getElementById('profile')
        },
        photoInput: document.getElementById('photoInput'),
        photoPreview: document.getElementById('photoPreview'),
        lists: {
            exp: document.getElementById('experience-list'),
            edu: document.getElementById('education-list'),
            lang: document.getElementById('language-list'),
            proj: document.getElementById('project-list')
        },
        skills: {
            techInput: document.getElementById('tech-skill-input'),
            techBtn: document.getElementById('btn-add-tech'),
            techCont: document.getElementById('tech-skills-container'),
            otherInput: document.getElementById('other-skill-input'),
            otherBtn: document.getElementById('btn-add-other'),
            otherCont: document.getElementById('other-skills-container')
        },
        addBtns: {
            exp: document.getElementById('btn-add-exp'),
            edu: document.getElementById('btn-add-edu'),
            lang: document.getElementById('btn-add-lang'),
            proj: document.getElementById('btn-add-proj')
        },
        preview: document.getElementById('cv-render'),
        themeBtns: document.querySelectorAll('.theme-btn'),
        colorDots: document.querySelectorAll('.color-dot'),
        optBtn: document.getElementById('btn-optimize'),
        optModal: document.getElementById('opt-modal'),
        closeModal: document.getElementById('btn-close-modal'),
        cancelOpt: document.getElementById('btn-cancel-opt'),
        applyOpt: document.getElementById('btn-apply-opt'),
        optCards: document.querySelectorAll('.opt-card'),
        downloadBtn: document.getElementById('btn-download'),
        toast: document.getElementById('toast'),
        // Historique
        historyBtn: document.getElementById('btn-history'),
        historyModal: document.getElementById('history-modal'),
        closeHistory: document.getElementById('btn-close-history'),
        closeHistoryFooter: document.getElementById('btn-close-history-footer'),
        historyList: document.getElementById('history-list'),
        clearHistory: document.getElementById('btn-clear-history')
    };

    // ==========================================
    // 💾 GESTION DE L'HISTORIQUE (LocalStorage)
    // ==========================================
    function getHistory() {
        const saved = localStorage.getItem('designcv_history');
        return saved ? JSON.parse(saved) : [];
    }

    function saveToHistory() {
        const history = getHistory();
        const now = new Date();
        const name = `${state.personal.firstName} ${state.personal.lastName}`.trim() || 'CV Sans Titre';
        const entry = {
            id: Date.now(),
            name: name,
            date: now.toLocaleString('fr-FR'),
            timestamp: now.getTime(),
            data: JSON.parse(JSON.stringify(state))
        };
        history.unshift(entry);
        localStorage.setItem('designcv_history', JSON.stringify(history));
        showToast('CV sauvegardé dans l\'historique', 'success');
    }

    function loadFromHistory(id) {
        const history = getHistory();
        const entry = history.find(h => h.id === id);
        if (!entry) return;

        Object.assign(state, entry.data);
        
        dom.inputs.lastName.value = state.personal.lastName || '';
        dom.inputs.firstName.value = state.personal.firstName || '';
        dom.inputs.jobTitle.value = state.personal.jobTitle || '';
        dom.inputs.email.value = state.personal.email || '';
        dom.inputs.phone.value = state.personal.phone || '';
        dom.inputs.location.value = state.personal.location || '';
        dom.inputs.profile.value = state.profile || '';
        
        if (state.personal.photo) {
            dom.photoPreview.innerHTML = `<img src="${state.personal.photo}" alt="Photo">`;
        }

        dom.lists.exp.innerHTML = '';
        dom.lists.edu.innerHTML = '';
        dom.lists.proj.innerHTML = '';
        dom.lists.lang.innerHTML = '';
        
        state.experiences.forEach(() => addDynamicEntry('exp', false));
        state.education.forEach(() => addDynamicEntry('edu', false));
        state.projects.forEach(() => addDynamicEntry('proj', false));
        state.languages.forEach(() => addDynamicEntry('lang', false));
        renderSkillsUI();

        setTimeout(() => {
            fillCards('exp', state.experiences);
            fillCards('edu', state.education);
            fillCards('proj', state.projects);
            fillCards('lang', state.languages);
            renderCV();
            showToast('CV chargé avec succès', 'success');
            closeHistoryModal();
        }, 50);
    }

    function deleteFromHistory(id) {
        let history = getHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem('designcv_history', JSON.stringify(history));
        renderHistoryList();
        showToast('CV supprimé de l\'historique', 'success');
    }

    function clearAllHistory() {
        if (confirm('Voulez-vous vraiment supprimer tout l\'historique ?')) {
            localStorage.removeItem('designcv_history');
            renderHistoryList();
            showToast('Historique vidé', 'success');
        }
    }

    function renderHistoryList() {
        const history = getHistory();
        if (history.length === 0) {
            dom.historyList.innerHTML = `
                <div class="history-empty">
                    <div class="history-empty-icon">📭</div>
                    <h4>Aucun CV sauvegardé</h4>
                    <p>Utilisez le bouton "💾 Sauvegarder" pour conserver une version de votre CV.</p>
                </div>`;
            return;
        }

        dom.historyList.innerHTML = history.map(entry => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${entry.name}</h4>
                    <p>Sauvegardé le ${entry.date}</p>
                </div>
                <div class="history-actions">
                    <button class="btn btn-primary btn-sm" onclick="loadFromHistory(${entry.id})">Charger</button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteFromHistory(${entry.id})" style="color:#EF4444">Supprimer</button>
                </div>
            </div>
        `).join('');
    }

    function openHistoryModal() {
        renderHistoryList();
        dom.historyModal.classList.add('active');
    }

    function closeHistoryModal() {
        dom.historyModal.classList.remove('active');
    }

    // ==========================================
    // 🖼️ RENDU VISUEL DU CV (Moteur)
    // ==========================================
    function renderCV() {
        const hasData = state.personal.firstName || state.personal.lastName || state.profile || state.experiences.length > 0;
        
        if (!hasData) {
            dom.preview.innerHTML = `<div class="cv-placeholder"><div class="cv-placeholder-icon">📄</div><h3>Votre CV apparaîtra ici</h3></div>`;
            return;
        }
        
        const styles = { balanced: { padding: '40px 48px' }, compact: { padding: '24px 32px' }, spacious: { padding: '56px 64px' } };
        dom.preview.style.padding = styles[state.variant].padding;
        dom.preview.style.setProperty('--cv-color', state.color);

        const p = state.personal; 
        const fullName = `${p.firstName} ${p.lastName}`.trim() || 'Votre Nom';
        const photoHTML = p.photo ? `<img src="${p.photo}" class="cv-photo" alt="Photo">` : '';
        const contactHTML = `<div class="cv-contact">${p.email?`<span>✉ ${p.email}</span>`:''}${p.phone?`<span>📞 ${p.phone}</span>`:''}${p.location?`<span>📍 ${p.location}</span>`:''}</div>`;
        
        const exps = sortItems(state.experiences);
        const edus = sortItems(state.education);

        let html = '';

        if (state.theme === 'classic') {
            html = `
            <div class="theme-classic">
                <header class="cv-header">
                    ${photoHTML}
                    <div class="cv-name">${fullName}</div>
                    ${p.jobTitle?`<div class="cv-text" style="font-weight:500;color:#4B5563;margin-top:4px">${p.jobTitle}</div>`:''}
                    ${contactHTML}
                </header>
                ${buildSections(exps, edus)}
            </div>`;
        
        } else if (state.theme === 'modern') {
            html = `
            <div class="theme-modern">
                <aside class="cv-sidebar" style="background:${state.color}">
                    ${photoHTML}
                    <div class="cv-name">${fullName}</div>
                    ${p.jobTitle?`<div style="opacity:0.8;margin-bottom:24px;font-size:13px;text-align:center">${p.jobTitle}</div>`:''}
                    <div class="cv-section">
                        <div class="cv-section-title">Contact</div>
                        ${p.email?`<div class="cv-contact-item">✉ ${p.email}</div>`:''}
                        ${p.phone?`<div class="cv-contact-item">📞 ${p.phone}</div>`:''}
                        ${p.location?`<div class="cv-contact-item">📍 ${p.location}</div>`:''}
                    </div>
                    ${state.skills.technical.length?`<div class="cv-section"><div class="cv-section-title">Tech</div><div style="display:flex;flex-wrap:wrap;gap:6px">${state.skills.technical.map(s=>`<span class="cv-skill" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;font-size:11px;padding:3px 8px;border-radius:4px">${s}</span>`).join('')}</div></div>`:''}
                    ${state.skills.other.length?`<div class="cv-section"><div class="cv-section-title">Autres</div><div style="display:flex;flex-wrap:wrap;gap:6px">${state.skills.other.map(s=>`<span class="cv-skill" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;font-size:11px;padding:3px 8px;border-radius:4px">${s}</span>`).join('')}</div></div>`:''}
                    ${state.languages.length?`<div class="cv-section"><div class="cv-section-title">Langues</div>${state.languages.map(l=>`<div style="margin-bottom:6px;font-size:12px"><strong>${l.main}</strong><br><span style="opacity:0.7">${l.sub}</span></div>`).join('')}</div>`:''}
                </aside>
                <main class="cv-main">${buildSections(exps, edus, true)}</main>
            </div>`;
        
        } else {
            html = `
            <div class="theme-elegant">
                <header class="cv-header">
                    ${photoHTML}
                    <div>
                        <div class="cv-name">${fullName}</div>
                        ${p.jobTitle?`<div class="cv-text" style="font-style:normal;margin-bottom:8px">${p.jobTitle}</div>`:''}
                        <div style="display:flex;gap:16px;font-size:13px;color:#6B7280;font-style:normal;font-family:'Inter',sans-serif;flex-wrap:wrap">
                            ${p.email?`<span>✉ ${p.email}</span>`:''}
                            ${p.phone?`<span>📞 ${p.phone}</span>`:''}
                            ${p.location?`<span>📍 ${p.location}</span>`:''}
                        </div>
                    </div>
                </header>
                ${buildSections(exps, edus)}
            </div>`;
        }

        dom.preview.innerHTML = html;
    }

    function buildSections(exps, edus, modern = false) {
        let h = '';
        if (state.profile) h += `<section class="cv-section"><div class="cv-section-title">Profil</div><div class="cv-text">${state.profile.replace(/\n/g, '<br>')}</div></section>`;
        
        const tExp = modern ? 'Expériences' : 'Expériences Professionnelles';
        if (exps.length) {
            h += `<section class="cv-section"><div class="cv-section-title">${tExp}</div>`;
            exps.forEach(e => {
                const rightContent = e.current 
                    ? '<span class="current-badge">En cours</span>' 
                    : `<span class="cv-entry-date">${e.start} ${e.end?'→ '+e.end:''}</span>`;
                
                h += `<div class="cv-entry">
                    <div class="cv-entry-header">
                        <span class="cv-entry-title">${e.main || ''}</span>
                        ${rightContent}
                    </div>
                    <div class="cv-entry-sub">${e.sub || ''}</div>
                    ${e.desc?formatDesc(e.desc):''}
                </div>`;
            });
            h += `</section>`;
        }
        if (edus.length) {
            h += `<section class="cv-section"><div class="cv-section-title">Formation</div>`;
            edus.forEach(e => {
                const rightContent = e.current 
                    ? '<span class="current-badge">En cours</span>' 
                    : `<span class="cv-entry-date">${e.start} ${e.end?'→ '+e.end:''}</span>`;
                
                h += `<div class="cv-entry">
                    <div class="cv-entry-header">
                        <span class="cv-entry-title">${e.main || ''}</span>
                        ${rightContent}
                    </div>
                    <div class="cv-entry-sub">${e.sub || ''}</div>
                    ${e.desc?formatDesc(e.desc):''}
                </div>`;
            });
            h += `</section>`;
        }
        if (state.projects.length) {
            h += `<section class="cv-section"><div class="cv-section-title">Projets Réalisés</div>`;
            state.projects.forEach(p => h += `
                <div class="cv-entry">
                    <div class="cv-entry-title">${p.main}</div>
                    ${p.link?`<a href="${p.link}" class="cv-link" target="_blank">${p.link}</a>`:''}
                    ${p.desc?formatDesc(p.desc):''}
                </div>`);
            h += `</section>`;
        }
        if (!modern) {
            if (state.skills.technical.length) h += `<section class="cv-section"><div class="cv-section-title">Compétences Techniques</div><div class="cv-skills">${state.skills.technical.map(s=>`<span class="cv-skill">${s}</span>`).join('')}</div></section>`;
            if (state.skills.other.length) h += `<section class="cv-section"><div class="cv-section-title">Autres Compétences</div><div class="cv-skills">${state.skills.other.map(s=>`<span class="cv-skill">${s}</span>`).join('')}</div></section>`;
            if (state.languages.length) h += `<section class="cv-section"><div class="cv-section-title">Langues</div>${state.languages.map(l=>`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span style="font-weight:600">${l.main}</span><span style="color:#666">${l.sub}</span></div>`).join('')}</section>`;
        }
        return h;
    }

    // ==========================================
    // ⚙️ LOGIQUE MÉTIER & UTILITAIRES
    // ==========================================

    function syncAndRender() {
        state.personal = { 
            ...state.personal, 
            lastName: dom.inputs.lastName.value, 
            firstName: dom.inputs.firstName.value, 
            jobTitle: dom.inputs.jobTitle.value, 
            email: dom.inputs.email.value, 
            phone: dom.inputs.phone.value, 
            location: dom.inputs.location.value 
        };
        state.profile = dom.inputs.profile.value;
        
        state.experiences = collectDynamicData('exp');
        state.education = collectDynamicData('edu');
        state.projects = collectDynamicData('proj');
        state.languages = collectDynamicData('lang');
        
        renderCV();
    }

    function collectDynamicData(type) {
        return Array.from(dom.lists[type].querySelectorAll('.entry-card')).map(card => {
            const main = card.querySelector(`.${type}-main`);
            const sub = card.querySelector(`.${type}-sub`);
            const start = card.querySelector(`.${type}-start`);
            const end = card.querySelector(`.${type}-end`);
            const desc = card.querySelector(`.${type}-desc`);
            const link = card.querySelector(`.${type}-link`);
            const curr = card.querySelector('.current-check input');
            return {
                main: main ? main.value : '', 
                sub: sub ? sub.value : '',
                start: start ? start.value : '', 
                end: (curr && curr.checked) ? 'En cours' : (end ? end.value : ''),
                desc: desc ? desc.value : '', 
                link: link ? link.value : '',
                current: curr ? curr.checked : false
            };
        });
    }

    function addDynamicEntry(type, sync = true) {
        const container = dom.lists[type]; 
        const count = container.children.length + 1;
        let html = `<div class="entry-card"><div class="entry-header"><span class="entry-badge">${type==='exp'?'Expérience':type==='edu'?'Formation':type==='proj'?'Projet':'Langue'} #${count}</span><button type="button" class="btn-icon btn-remove">✕</button></div>`;
        
        if (type === 'lang') {
            html += `<div class="form-group"><label>Langue</label><input type="text" class="form-input lang-main" oninput="syncAndRender()"></div>
                     <div class="form-group"><label>Niveau</label><select class="form-select lang-sub" onchange="syncAndRender()"><option value="">Sélectionner...</option><option>Natif</option><option>Courant</option><option>Avancé</option><option>Intermédiaire</option><option>Débutant</option></select></div>`;
        } else if (type === 'proj') {
            html += `<div class="form-group"><label>Titre du projet</label><input type="text" class="form-input proj-main" oninput="syncAndRender()"></div>
                     <div class="form-group"><label>Lien / Tech stack</label><input type="text" class="form-input proj-link" placeholder="https://... ou React, Node..." oninput="syncAndRender()"></div>
                     <div class="form-group"><label>Description</label><textarea class="form-textarea proj-desc" oninput="syncAndRender()"></textarea></div>`;
        } else {
            const labels = type==='exp'?['Poste','Entreprise']:['Diplôme','Établissement'];
            html += `<div class="form-group"><label>${labels[0]}</label><input type="text" class="form-input ${type}-main" oninput="syncAndRender()"></div>
                     <div class="form-group"><label>${labels[1]}</label><input type="text" class="form-input ${type}-sub" oninput="syncAndRender()"></div>
                     <div class="form-row"><div class="form-group"><label>Début</label><input type="text" class="form-input ${type}-start" placeholder="Ex: 2020" oninput="syncAndRender()"></div>
                     <div class="form-group"><label>Fin</label><input type="text" class="form-input ${type}-end" placeholder="Ex: 2023" oninput="syncAndRender()"></div></div>
                     <label class="current-check"><input type="checkbox" onchange="this.closest('.entry-card').querySelector('.${type}-end').disabled=this.checked; syncAndRender()"> En cours / Présent</label>
                     <div class="form-group" style="margin-top:10px"><label>Description</label><textarea class="form-textarea ${type}-desc" oninput="syncAndRender()"></textarea></div>`;
        }
        container.insertAdjacentHTML('beforeend', html + '</div>');
        
        if (sync) syncAndRender();
    }

    function fillCards(type, dataArr) {
        const cards = dom.lists[type].querySelectorAll('.entry-card');
        dataArr.forEach((d, i) => {
            if(!cards[i] || !d) return;
            const setVal = (sel, val) => { const el = cards[i].querySelector(sel); if(el) el.value = val || ''; };
            setVal(`.${type}-main`, d.main);
            setVal(`.${type}-sub`, d.sub);
            setVal(`.${type}-start`, d.start);
            setVal(`.${type}-end`, d.end);
            setVal(`.${type}-desc`, d.desc);
            setVal(`.${type}-link`, d.link);
            const curr = cards[i].querySelector('.current-check input'); 
            if(curr) { 
                curr.checked = !!d.current; 
                if(d.current) { 
                    const endEl = cards[i].querySelector(`.${type}-end`); 
                    if(endEl) endEl.disabled = true; 
                } 
            }
        });
    }

    function sortItems(items) {
        return [...items].sort((a, b) => {
            const aCur = a.current || (a.end && /cours|présent|maintenant/i.test(a.end));
            const bCur = b.current || (b.end && /cours|présent|maintenant/i.test(b.end));
            if (aCur && !bCur) return -1;
            if (!aCur && bCur) return 1;
            return 0;
        });
    }

    function formatDesc(text) {
        if (!text) return '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        let html = '<div class="cv-desc">';
        let inList = false;
        lines.forEach(line => {
            const isItem = /^[-*•]|\d+\./.test(line);
            if (isItem) {
                if (!inList) { html += '<ul>'; inList = true; }
                html += `<li>${line.replace(/^[-*•]|\d+\.\s*/, '')}</li>`;
            } else {
                if (inList) { html += '</ul>'; inList = false; }
                html += `<p>${line}</p>`;
            }
        });
        if (inList) html += '</ul>';
        return html + '</div>';
    }

    // ==========================================
    // ⚡ GESTION DES COMPÉTENCES
    // ==========================================
    function addSkill(type) {
        const input = type === 'tech' 
            ? document.getElementById('tech-skill-input') 
            : document.getElementById('other-skill-input');
            
        const val = input.value.trim();
        if (val && !state.skills[type].includes(val)) {
            state.skills[type].push(val);
            input.value = '';
            renderSkillsUI();
            syncAndRender();
        }
    }

    function removeSkill(type, idx) { 
        state.skills[type].splice(idx, 1); 
        renderSkillsUI(); 
        syncAndRender(); 
    }

    function renderSkillsUI() {
        const techCont = document.getElementById('tech-skills-container');
        const otherCont = document.getElementById('other-skills-container');
        
        if (techCont) {
            techCont.innerHTML = state.skills.technical.map((s, i) => 
                `<span class="skill-tag">${s} <span class="skill-remove" onclick="removeSkill('tech', ${i})">✕</span></span>`
            ).join('');
        }
        if (otherCont) {
            otherCont.innerHTML = state.skills.other.map((s, i) => 
                `<span class="skill-tag">${s} <span class="skill-remove" onclick="removeSkill('other', ${i})">✕</span></span>`
            ).join('');
        }
    }

    // Photo Upload
    dom.photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) return showToast('Image trop volumineuse (max 2MB)', 'info');
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.personal.photo = ev.target.result;
            dom.photoPreview.innerHTML = `<img src="${ev.target.result}" alt="Photo">`;
            renderCV();
            showToast('Photo ajoutée', 'success');
        };
        reader.readAsDataURL(file);
    });

    // Changement de thème avec transition
    function switchTheme(newTheme) {
        dom.preview.classList.add('fading');
        setTimeout(() => {
            state.theme = newTheme; 
            syncAndRender();
            dom.preview.classList.remove('fading');
        }, 300);
    }

    // Toasts
    function showToast(msg, type = 'info') {
        dom.toast.textContent = msg; 
        dom.toast.className = `toast ${type} show`; 
        setTimeout(() => dom.toast.classList.remove('show'), 3000); 
    }

    // ==========================================
    //  ÉCOUTEURS D'ÉVÉNEMENTS
    // ==========================================
    
    Object.values(dom.inputs).forEach(i => i.addEventListener('input', syncAndRender));

    dom.addBtns.exp.addEventListener('click', () => addDynamicEntry('exp'));
    dom.addBtns.edu.addEventListener('click', () => addDynamicEntry('edu'));
    dom.addBtns.lang.addEventListener('click', () => addDynamicEntry('lang'));
    dom.addBtns.proj.addEventListener('click', () => addDynamicEntry('proj'));

    dom.skills.techBtn?.addEventListener('click', () => addSkill('tech'));
    dom.skills.otherBtn?.addEventListener('click', () => addSkill('other'));
    
    dom.skills.techInput?.addEventListener('keypress', e => { if(e.key === 'Enter') addSkill('tech'); });
    dom.skills.otherInput?.addEventListener('keypress', e => { if(e.key === 'Enter') addSkill('other'); });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove')) { 
            e.target.closest('.entry-card').remove(); 
            syncAndRender(); 
        }
        if (e.target.closest('.skill-remove')) {
            removeSkill(e.target.dataset.type, parseInt(e.target.dataset.idx));
        }
    });

    dom.themeBtns.forEach(b => b.addEventListener('click', () => {
        dom.themeBtns.forEach(x => x.classList.remove('active')); 
        b.classList.add('active');
        switchTheme(b.dataset.theme);
    }));
    dom.colorDots.forEach(d => d.addEventListener('click', () => { 
        dom.colorDots.forEach(x => x.classList.remove('active')); 
        d.classList.add('active'); 
        state.color = d.dataset.color; 
        document.documentElement.style.setProperty('--cv-color', state.color); 
        syncAndRender(); 
    }));

    dom.historyBtn.addEventListener('click', openHistoryModal);
    dom.closeHistory.addEventListener('click', closeHistoryModal);
    dom.closeHistoryFooter.addEventListener('click', closeHistoryModal);
    dom.historyModal.addEventListener('click', (e) => { if(e.target === dom.historyModal) closeHistoryModal(); });
    dom.clearHistory.addEventListener('click', clearAllHistory);

    dom.optBtn.addEventListener('click', () => dom.optModal.classList.add('active'));
    dom.closeModal.addEventListener('click', () => dom.optModal.classList.remove('active'));
    dom.cancelOpt.addEventListener('click', () => dom.optModal.classList.remove('active'));
    dom.optModal.addEventListener('click', (e) => { if(e.target === dom.optModal) dom.optModal.classList.remove('active'); });
    dom.optCards.forEach(c => c.addEventListener('click', () => { 
        dom.optCards.forEach(x => x.classList.remove('selected')); 
        c.classList.add('selected'); 
        state.variant = c.dataset.variant; 
    }));
    dom.applyOpt.addEventListener('click', () => { 
        syncAndRender(); 
        dom.optModal.classList.remove('active'); 
        showToast('Design optimisé appliqué', 'success'); 
    });

    // 📄 EXPORT PDF (VERSION CORRIGÉE)
    dom.downloadBtn.addEventListener('click', () => {
        if (!state.personal.firstName && !state.profile) { 
            showToast('Remplissez au moins un champ', 'info'); 
            return; 
        }
        
        if (confirm('Voulez-vous sauvegarder cette version dans l\'historique avant de télécharger le PDF ?')) {
            saveToHistory();
        }
        
        showToast('Génération du PDF...', 'info');
        
        const clone = dom.preview.cloneNode(true); 
        clone.style.transform = 'none'; 
        clone.style.margin = '0';
        document.body.appendChild(clone); 
        clone.style.position = 'absolute'; 
        clone.style.left = '-9999px'; 
        clone.style.zIndex = '-100';
        
        html2pdf().set({ 
            margin: 0,  /* ✅ Marges à 0 pour éviter page 2 */
            filename: `DesignCV_${state.personal.lastName || 'CV'}.pdf`, 
            image: { type: 'jpeg', quality: 1 }, 
            html2canvas: { 
                scale: 4,  /* ✅ Échelle x4 pour photo HD */
                useCORS: true, 
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        }).from(clone).save().then(() => { 
            // ✅ TRACKING GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download_pdf', { event_category: 'engagement', value: 1 });
            }
            document.body.removeChild(clone); 
            showToast('Téléchargement réussi', 'success'); 
        }).catch(() => { 
            document.body.removeChild(clone); 
            showToast('Erreur export', 'info'); 
        });
    });

    // Fonctions globales
    window.syncAndRender = syncAndRender;
    window.addDynamicEntry = addDynamicEntry;
    window.loadFromHistory = loadFromHistory;
    window.deleteFromHistory = deleteFromHistory;
    window.removeSkill = removeSkill;

    // Initialisation
    addDynamicEntry('exp');
    addDynamicEntry('edu');
    syncAndRender();
});