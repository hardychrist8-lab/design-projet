/* =========================================
   🧠 DesignCV - Logique Principale (app.js)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {

    // 1. ÉTAT GLOBAL
    const state = {
        personal: { firstName: '', lastName: '', jobTitle: '', email: '', phone: '', location: '', photo: null },
        profile: '',
        experiences: [], education: [], languages: [], projects: [],
        skills: { technical: [], other: [] },
        theme: 'classic', color: '#4F46E5', variant: 'balanced'
    };

    // 2. RÉFÉRENCES DOM
    const dom = {
        inputs: {
            lastName: document.getElementById('lastName'), firstName: document.getElementById('firstName'),
            jobTitle: document.getElementById('jobTitle'), email: document.getElementById('email'),
            phone: document.getElementById('phone'), location: document.getElementById('location'),
            profile: document.getElementById('profile')
        },
        photoInput: document.getElementById('photoInput'), photoPreview: document.getElementById('photoPreview'),
        lists: { exp: document.getElementById('experience-list'), edu: document.getElementById('education-list'), lang: document.getElementById('language-list'), proj: document.getElementById('project-list') },
        skills: { techInput: document.getElementById('tech-skill-input'), techBtn: document.getElementById('btn-add-tech'), techCont: document.getElementById('tech-skills-container'),
                  otherInput: document.getElementById('other-skill-input'), otherBtn: document.getElementById('btn-add-other'), otherCont: document.getElementById('other-skills-container') },
        addBtns: { exp: document.getElementById('btn-add-exp'), edu: document.getElementById('btn-add-edu'), lang: document.getElementById('btn-add-lang'), proj: document.getElementById('btn-add-proj') },
        preview: document.getElementById('cv-render'), themeBtns: document.querySelectorAll('.theme-btn'), colorDots: document.querySelectorAll('.color-dot'),
        optBtn: document.getElementById('btn-optimize'), optModal: document.getElementById('opt-modal'), closeModal: document.getElementById('btn-close-modal'),
        cancelOpt: document.getElementById('btn-cancel-opt'), applyOpt: document.getElementById('btn-apply-opt'), optCards: document.querySelectorAll('.opt-card'),
        downloadBtn: document.getElementById('btn-download'), toast: document.getElementById('toast'),
        historyBtn: document.getElementById('btn-history'), historyModal: document.getElementById('history-modal'),
        closeHistory: document.getElementById('btn-close-history'), closeHistoryFooter: document.getElementById('btn-close-history-footer'),
        historyList: document.getElementById('history-list'), clearHistory: document.getElementById('btn-clear-history')
    };

    // 💾 GESTION HISTORIQUE
    function getHistory() { const s = localStorage.getItem('designcv_history'); return s ? JSON.parse(s) : []; }
    function saveToHistory() {
        const history = getHistory();
        const entry = { id: Date.now(), name: `${state.personal.firstName} ${state.personal.lastName}`.trim() || 'CV', date: new Date().toLocaleString('fr-FR'), data: JSON.parse(JSON.stringify(state)) };
        history.unshift(entry); localStorage.setItem('designcv_history', JSON.stringify(history)); showToast('Sauvegardé dans l\'historique', 'success');
    }
    function loadFromHistory(id) {
        const entry = getHistory().find(h => h.id === id); if (!entry) return;
        Object.assign(state, entry.data);
        dom.inputs.lastName.value = state.personal.lastName || ''; dom.inputs.firstName.value = state.personal.firstName || '';
        dom.inputs.jobTitle.value = state.personal.jobTitle || ''; dom.inputs.email.value = state.personal.email || '';
        dom.inputs.phone.value = state.personal.phone || ''; dom.inputs.location.value = state.personal.location || '';
        dom.inputs.profile.value = state.profile || '';
        if (state.personal.photo) dom.photoPreview.innerHTML = `<img src="${state.personal.photo}">`;
        dom.lists.exp.innerHTML = ''; dom.lists.edu.innerHTML = ''; dom.lists.proj.innerHTML = ''; dom.lists.lang.innerHTML = '';
        state.experiences.forEach(() => addDynamicEntry('exp', false)); state.education.forEach(() => addDynamicEntry('edu', false));
        state.projects.forEach(() => addDynamicEntry('proj', false)); state.languages.forEach(() => addDynamicEntry('lang', false));
        renderSkillsUI(); 
        setTimeout(() => { fillCards('exp', state.experiences); fillCards('edu', state.education); fillCards('proj', state.projects); fillCards('lang', state.languages); renderCV(); showToast('CV chargé', 'success'); closeHistoryModal(); }, 50);
    }
    function deleteFromHistory(id) { let h = getHistory().filter(x => x.id !== id); localStorage.setItem('designcv_history', JSON.stringify(h)); renderHistoryList(); showToast('Supprimé', 'success'); }
    function clearAllHistory() { if (confirm('Voulez-vous vraiment tout effacer ?')) { localStorage.removeItem('designcv_history'); renderHistoryList(); showToast('Historique vidé', 'success'); } }
    function renderHistoryList() {
        const h = getHistory();
        dom.historyList.innerHTML = h.length ? h.map(e => `<div class="history-item"><div class="history-info"><h4>${e.name}</h4><p>${e.date}</p></div><div class="history-actions"><button class="btn btn-primary btn-sm" onclick="loadFromHistory(${e.id})">Charger</button><button class="btn btn-ghost btn-sm" onclick="deleteFromHistory(${e.id})" style="color:#EF4444">Supprimer</button></div></div>`).join('') : `<div class="history-empty"><div class="history-empty-icon">📭</div><h4>Aucun CV sauvegardé</h4></div>`;
    }
    function openHistoryModal() { renderHistoryList(); dom.historyModal.classList.add('active'); }
    function closeHistoryModal() { dom.historyModal.classList.remove('active'); }

    // 🖼️ RENDU CV
    function renderCV() {
        const hasData = state.personal.firstName || state.personal.lastName || state.profile || state.experiences.length;
        if (!hasData) { dom.preview.innerHTML = `<div class="cv-placeholder"><div class="cv-placeholder-icon">📄</div><h3>Votre CV apparaîtra ici</h3></div>`; return; }
        const styles = { balanced: { padding: '40px 48px' }, compact: { padding: '24px 32px' }, spacious: { padding: '56px 64px' } };
        dom.preview.style.padding = styles[state.variant].padding; dom.preview.style.setProperty('--cv-color', state.color);
        const p = state.personal, fullName = `${p.firstName} ${p.lastName}`.trim() || 'Votre Nom';
        const photoHTML = p.photo ? `<img src="${p.photo}" class="cv-photo">` : '';
        const contactHTML = `<div class="cv-contact">${p.email?`<span>✉ ${p.email}</span>`:''}${p.phone?`<span>📞 ${p.phone}</span>`:''}${p.location?`<span>📍 ${p.location}</span>`:''}</div>`;
        const exps = sortItems(state.experiences), edus = sortItems(state.education);
        let html = '';
        if (state.theme === 'classic') {
            html = `<div class="theme-classic"><header class="cv-header">${photoHTML}<div class="cv-name">${fullName}</div>${p.jobTitle?`<div style="font-weight:500;color:#4B5563;margin-top:4px">${p.jobTitle}</div>`:''}${contactHTML}</header>${buildSections(exps, edus)}</div>`;
        } else if (state.theme === 'modern') {
            html = `<div class="theme-modern"><aside class="cv-sidebar" style="background:${state.color}">${photoHTML}<div class="cv-name">${fullName}</div>${p.jobTitle?`<div style="opacity:0.8;margin-bottom:24px;font-size:13px;text-align:center">${p.jobTitle}</div>`:''}
            <div class="cv-section"><div class="cv-section-title">Contact</div>${p.email?`<div class="cv-contact-item">✉ ${p.email}</div>`:''}${p.phone?`<div class="cv-contact-item">📞 ${p.phone}</div>`:''}${p.location?`<div class="cv-contact-item">📍 ${p.location}</div>`:''}</div>
            ${state.skills.technical.length?`<div class="cv-section"><div class="cv-section-title">Tech</div><div style="display:flex;flex-wrap:wrap;gap:6px">${state.skills.technical.map(s=>`<span style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;font-size:11px;padding:3px 8px;border-radius:4px">${s}</span>`).join('')}</div></div>`:''}
            ${state.skills.other.length?`<div class="cv-section"><div class="cv-section-title">Autres</div><div style="display:flex;flex-wrap:wrap;gap:6px">${state.skills.other.map(s=>`<span style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;font-size:11px;padding:3px 8px;border-radius:4px">${s}</span>`).join('')}</div></div>`:''}
            ${state.languages.length?`<div class="cv-section"><div class="cv-section-title">Langues</div>${state.languages.map(l=>`<div style="margin-bottom:6px;font-size:12px"><strong>${l.main}</strong><br><span style="opacity:0.7">${l.sub}</span></div>`).join('')}</div>`:''}</aside><main class="cv-main">${buildSections(exps, edus, true)}</main></div>`;
        } else {
            html = `<div class="theme-elegant"><header class="cv-header">${photoHTML}<div><div class="cv-name">${fullName}</div>${p.jobTitle?`<div style="font-style:normal;margin-bottom:8px">${p.jobTitle}</div>`:''}<div style="display:flex;gap:16px;font-size:13px;color:#6B7280;font-style:normal;font-family:'Inter',sans-serif;flex-wrap:wrap">${p.email?`<span>✉ ${p.email}</span>`:''}${p.phone?`<span>📞 ${p.phone}</span>`:''}${p.location?`<span>📍 ${p.location}</span>`:''}</div></div></header>${buildSections(exps, edus)}</div>`;
        }
        dom.preview.innerHTML = html;
    }

    function buildSections(exps, edus, modern = false) {
        let h = '';
        if (state.profile) h += `<section class="cv-section"><div class="cv-section-title">Profil</div><div class="cv-text">${state.profile.replace(/\n/g, '<br>')}</div></section>`;
        const tExp = modern ? 'Expériences' : 'Expériences Professionnelles';
        if (exps.length) { h += `<section class="cv-section"><div class="cv-section-title">${tExp}</div>`; exps.forEach(e => { const right = e.current ? '<span class="current-badge">En cours</span>' : `<span class="cv-entry-date">${e.start} ${e.end?'→ '+e.end:''}</span>`; h += `<div class="cv-entry"><div class="cv-entry-header"><span class="cv-entry-title">${e.main||''}</span>${right}</div><div class="cv-entry-sub">${e.sub||''}</div>${e.desc?formatDesc(e.desc):''}</div>`; }); h += `</section>`; }
        if (edus.length) { h += `<section class="cv-section"><div class="cv-section-title">Formation</div>`; edus.forEach(e => { const right = e.current ? '<span class="current-badge">En cours</span>' : `<span class="cv-entry-date">${e.start} ${e.end?'→ '+e.end:''}</span>`; h += `<div class="cv-entry"><div class="cv-entry-header"><span class="cv-entry-title">${e.main||''}</span>${right}</div><div class="cv-entry-sub">${e.sub||''}</div>${e.desc?formatDesc(e.desc):''}</div>`; }); h += `</section>`; }
        if (state.projects.length) { h += `<section class="cv-section"><div class="cv-section-title">Projets Réalisés</div>`; state.projects.forEach(p => h += `<div class="cv-entry"><div class="cv-entry-title">${p.main}</div>${p.link?`<a href="${p.link}" class="cv-link" target="_blank">${p.link}</a>`:''}${p.desc?formatDesc(p.desc):''}</div>`); h += `</section>`; }
        if (!modern) {
            if (state.skills.technical.length) h += `<section class="cv-section"><div class="cv-section-title">Compétences Techniques</div><div class="cv-skills">${state.skills.technical.map(s=>`<span class="cv-skill">${s}</span>`).join('')}</div></section>`;
            if (state.skills.other.length) h += `<section class="cv-section"><div class="cv-section-title">Autres Compétences</div><div class="cv-skills">${state.skills.other.map(s=>`<span class="cv-skill">${s}</span>`).join('')}</div></section>`;
            if (state.languages.length) h += `<section class="cv-section"><div class="cv-section-title">Langues</div>${state.languages.map(l=>`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span style="font-weight:600">${l.main}</span><span style="color:#666">${l.sub}</span></div>`).join('')}</section>`;
        }
        return h;
    }

    // ⚙️ UTILITAIRES
    function syncAndRender() {
        state.personal = { ...state.personal, lastName: dom.inputs.lastName.value, firstName: dom.inputs.firstName.value, jobTitle: dom.inputs.jobTitle.value, email: dom.inputs.email.value, phone: dom.inputs.phone.value, location: dom.inputs.location.value };
        state.profile = dom.inputs.profile.value;
        state.experiences = collectDynamicData('exp'); state.education = collectDynamicData('edu'); state.projects = collectDynamicData('proj'); state.languages = collectDynamicData('lang');
        renderCV();
    }
    function collectDynamicData(type) { return Array.from(dom.lists[type].querySelectorAll('.entry-card')).map(card => ({ main: card.querySelector(`.${type}-main`)?.value||'', sub: card.querySelector(`.${type}-sub`)?.value||'', start: card.querySelector(`.${type}-start`)?.value||'', end: card.querySelector('.current-check input')?.checked ? 'En cours' : card.querySelector(`.${type}-end`)?.value||'', desc: card.querySelector(`.${type}-desc`)?.value||'', link: card.querySelector(`.${type}-link`)?.value||'', current: card.querySelector('.current-check input')?.checked||false })); }
    function addDynamicEntry(type, sync=true) {
        const c = dom.lists[type], n = c.children.length+1;
        let h = `<div class="entry-card"><div class="entry-header"><span class="entry-badge">${type==='exp'?'Expérience':type==='edu'?'Formation':type==='proj'?'Projet':'Langue'} #${n}</span><button type="button" class="btn-icon btn-remove">✕</button></div>`;
        if (type==='lang') h += `<div class="form-group"><label>Langue</label><input type="text" class="form-input lang-main" oninput="syncAndRender()"></div><div class="form-group"><label>Niveau</label><select class="form-select lang-sub" onchange="syncAndRender()"><option value="">Sélectionner...</option><option>Natif</option><option>Courant</option><option>Avancé</option><option>Intermédiaire</option><option>Débutant</option></select></div>`;
        else if (type==='proj') h += `<div class="form-group"><label>Titre du projet</label><input type="text" class="form-input proj-main" oninput="syncAndRender()"></div><div class="form-group"><label>Lien / Tech stack</label><input type="text" class="form-input proj-link" placeholder="https://... ou React, Node..." oninput="syncAndRender()"></div><div class="form-group"><label>Description</label><textarea class="form-textarea proj-desc" oninput="syncAndRender()"></textarea></div>`;
        else { const l = type==='exp'?['Poste','Entreprise']:['Diplôme','Établissement']; h += `<div class="form-group"><label>${l[0]}</label><input type="text" class="form-input ${type}-main" oninput="syncAndRender()"></div><div class="form-group"><label>${l[1]}</label><input type="text" class="form-input ${type}-sub" oninput="syncAndRender()"></div><div class="form-row"><div class="form-group"><label>Début</label><input type="text" class="form-input ${type}-start" placeholder="Ex: 2020" oninput="syncAndRender()"></div><div class="form-group"><label>Fin</label><input type="text" class="form-input ${type}-end" placeholder="Ex: 2023" oninput="syncAndRender()"></div></div><label class="current-check"><input type="checkbox" onchange="this.closest('.entry-card').querySelector('.${type}-end').disabled=this.checked; syncAndRender()"> En cours / Présent</label><div class="form-group" style="margin-top:10px"><label>Description</label><textarea class="form-textarea ${type}-desc" oninput="syncAndRender()"></textarea></div>`; }
        c.insertAdjacentHTML('beforeend', h+'</div>'); if (sync) syncAndRender();
    }
    function fillCards(type, data) { const cards = dom.lists[type].querySelectorAll('.entry-card'); data.forEach((d,i)=>{ if(!cards[i]||!d)return; const s=(sel,val)=>{const el=cards[i].querySelector(sel);if(el)el.value=val||''}; s(`.${type}-main`,d.main);s(`.${type}-sub`,d.sub);s(`.${type}-start`,d.start);s(`.${type}-end`,d.end);s(`.${type}-desc`,d.desc);s(`.${type}-link`,d.link); const c=cards[i].querySelector('.current-check input'); if(c){c.checked=!!d.current;if(d.current&&cards[i].querySelector(`.${type}-end`))cards[i].querySelector(`.${type}-end`).disabled=true;} }); }
    function sortItems(items) { return [...items].sort((a,b)=>{const ac=a.current||/cours|présent/i.test(a.end||''),bc=b.current||/cours|présent/i.test(b.end||'');if(ac&&!bc)return-1;if(!ac&&bc)return 1;return 0;}); }
    function formatDesc(t){if(!t)return'';let h='<div class="cv-desc">',inList=false; t.split('\n').map(l=>l.trim()).filter(l=>l).forEach(line=>{const isItem=/^[-*•]|\d+\./.test(line);if(isItem){if(!inList){h+='<ul>';inList=true;}h+=`<li>${line.replace(/^[-*•]|\d+\.\s*/,'')}</li>`;}else{if(inList){h+='</ul>';inList=false;}h+=`<p>${line}</p>`;}}); if(inList)h+='</ul>'; return h+'</div>'; }

    // ⚡ COMPÉTENCES
    function addSkill(type) { const i=type==='tech'?dom.skills.techInput:dom.skills.otherInput, c=type==='tech'?dom.skills.techCont:dom.skills.otherCont, a=type==='tech'?'technical':'other', v=i.value.trim(); if(v&&!state.skills[a].includes(v)){state.skills[a].push(v);i.value='';renderSkillsUI();syncAndRender();} }
    function removeSkill(type,idx){const a=type==='tech'?'technical':'other';state.skills[a].splice(idx,1);renderSkillsUI();syncAndRender();}
    function renderSkillsUI() { if(dom.skills.techCont)dom.skills.techCont.innerHTML=state.skills.technical.map((s,i)=>`<span class="skill-tag">${s} <span class="skill-remove" onclick="removeSkill('tech',${i})" style="cursor:pointer;margin-left:6px;font-weight:bold">✕</span></span>`).join(''); if(dom.skills.otherCont)dom.skills.otherCont.innerHTML=state.skills.other.map((s,i)=>`<span class="skill-tag">${s} <span class="skill-remove" onclick="removeSkill('other',${i})" style="cursor:pointer;margin-left:6px;font-weight:bold">✕</span></span>`).join(''); }

    // 📸 PHOTO
    dom.photoInput.addEventListener('change', e => { const f=e.target.files[0]; if(!f||f.size>2*1024*1024)return; const r=new FileReader(); r.onload=ev=>{state.personal.photo=ev.target.result;dom.photoPreview.innerHTML=`<img src="${ev.target.result}" alt="Photo">`;renderCV();showToast('Photo ajoutée','success')}; r.readAsDataURL(f); });

    // 🎨 THÈMES & COULEURS
    function switchTheme(t){dom.preview.classList.add('fading');setTimeout(()=>{state.theme=t;syncAndRender();dom.preview.classList.remove('fading')},300);}
    dom.themeBtns.forEach(b=>b.addEventListener('click',()=>{dom.themeBtns.forEach(x=>x.classList.remove('active'));b.classList.add('active');switchTheme(b.dataset.theme);}));
    dom.colorDots.forEach(d=>d.addEventListener('click',()=>{dom.colorDots.forEach(x=>x.classList.remove('active'));d.classList.add('active');state.color=d.dataset.color;document.documentElement.style.setProperty('--cv-color',state.color);syncAndRender();}));

    // 🎛️ OPTIMISATION
    dom.optBtn.addEventListener('click',()=>dom.optModal.classList.add('active')); dom.closeModal.addEventListener('click',()=>dom.optModal.classList.remove('active')); dom.cancelOpt.addEventListener('click',()=>dom.optModal.classList.remove('active')); dom.optModal.addEventListener('click',e=>{if(e.target===dom.optModal)dom.optModal.classList.remove('active');});
    dom.optCards.forEach(c=>c.addEventListener('click',()=>{dom.optCards.forEach(x=>x.classList.remove('selected'));c.classList.add('selected');state.variant=c.dataset.variant;})); dom.applyOpt.addEventListener('click',()=>{syncAndRender();dom.optModal.classList.remove('active');showToast('Design optimisé appliqué','success');});

    // 📚 HISTORIQUE EVENTS
    dom.historyBtn.addEventListener('click',openHistoryModal); dom.closeHistory.addEventListener('click',closeHistoryModal); dom.closeHistoryFooter.addEventListener('click',closeHistoryModal); dom.historyModal.addEventListener('click',e=>{if(e.target===dom.historyModal)closeHistoryModal();}); dom.clearHistory.addEventListener('click',clearAllHistory);

    // 🗑️ SUPPRESSION & COMPÉTENCES EVENTS
    dom.addBtns.exp.addEventListener('click',()=>addDynamicEntry('exp')); dom.addBtns.edu.addEventListener('click',()=>addDynamicEntry('edu')); dom.addBtns.lang.addEventListener('click',()=>addDynamicEntry('lang')); dom.addBtns.proj.addEventListener('click',()=>addDynamicEntry('proj'));
    dom.skills.techBtn?.addEventListener('click',()=>addSkill('tech')); dom.skills.otherBtn?.addEventListener('click',()=>addSkill('other'));
    dom.skills.techInput?.addEventListener('keypress',e=>{if(e.key==='Enter')addSkill('tech');}); dom.skills.otherInput?.addEventListener('keypress',e=>{if(e.key==='Enter')addSkill('other');});
    document.addEventListener('click',e=>{if(e.target.closest('.btn-remove')){e.target.closest('.entry-card').remove();syncAndRender();}if(e.target.closest('.skill-remove'))removeSkill(e.target.dataset.type,parseInt(e.target.dataset.idx));});

    // ✉️ INPUTS
    Object.values(dom.inputs).forEach(i=>i.addEventListener('input',syncAndRender));

    // 📄 EXPORT PDF (VERSION PUPPETEER - QUALITÉ PRO)
    dom.downloadBtn.addEventListener('click', async () => {
        if (!state.personal.firstName && !state.personal.lastName) { 
            showToast('Remplissez au moins un champ', 'info'); 
            return; 
        }
        
        showToast('Génération du PDF...', 'info');
        
        const element = document.getElementById('cv-render');
        const cvSheet = element.parentElement; // .cv-sheet
        
        // Récupérer le HTML complet du CV
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    ${document.querySelector('style').innerHTML}
                    body { margin: 0; padding: 0; }
                    .cv-sheet { width: 210mm; min-height: auto; background: white; }
                </style>
            </head>
            <body>
                <div class="cv-sheet">
                    ${element.innerHTML}
                </div>
            </body>
            </html>
        `;

        try {
            // Appel à l'API Puppeteer
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    html: htmlContent,
                    filename: `DesignCV_${state.personal.lastName || 'CV'}.pdf`
                })
            });

            if (!response.ok) throw new Error('Erreur API');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DesignCV_${state.personal.lastName || 'CV'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            if (typeof gtag !== 'undefined') {
                gtag('event', 'download_pdf', { event_category: 'engagement', value: 1 });
            }
            showToast('✅ PDF téléchargé !', 'success');
        } catch (err) {
            console.error('Erreur PDF:', err);
            showToast('❌ Erreur PDF', 'error');
        }
    });

    // UTILS
    function showToast(msg, type='info') { dom.toast.textContent=msg; dom.toast.className=`toast ${type} show`; setTimeout(()=>dom.toast.classList.remove('show'),3000); }
    function closeModal() { dom.optModal.classList.remove('active'); }

    // GLOBALS
    window.addSkill = addSkill; window.removeSkill = removeSkill; window.syncAndRender = syncAndRender; window.addDynamicEntry = addDynamicEntry; window.loadFromHistory = loadFromHistory; window.deleteFromHistory = deleteFromHistory;

    // INIT
    addDynamicEntry('exp'); addDynamicEntry('edu'); syncAndRender();
});