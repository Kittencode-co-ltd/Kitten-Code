// ============================================================
//  script-contract.js — contract editor (chooser → form → live preview)
//  Classic script. Needs doc-common.js (KCDoc) and contract-templates.js (KCContract).
// ============================================================
(function () {
    'use strict';

    const C = window.KCContract;
    const $ = (id) => document.getElementById(id);
    const esc = C.escapeHTML;
    const DRAFT = (t) => 'draft_contract_' + t;

    const GROUP_TITLES = (t) => ({
        doc: 'ข้อมูลสัญญา',
        a: t.roles.a + (t.kittenSide === 'a' ? ' (บริษัท)' : ' (คู่สัญญา)'),
        b: t.roles.b + (t.kittenSide === 'b' ? ' (บริษัท)' : ' (คู่สัญญา)'),
        terms: 'เงื่อนไขและรายละเอียดงาน',
        pay: 'ค่าตอบแทนและการชำระเงิน',
        extra: 'ข้อตกลงเพิ่มเติม'
    });
    const GROUP_ICONS = { doc: 'fa-file-lines', a: 'fa-building', b: 'fa-user', terms: 'fa-list-check', pay: 'fa-money-bill-wave', extra: 'fa-pen' };
    const GROUP_ORDER = ['doc', 'a', 'b', 'terms', 'pay', 'extra'];
    const COLLAPSED = new Set(['extra']);          // folded until asked for

    const STEPS = [
        { id: 'parties', label: 'คู่สัญญา', icon: 'fa-users', groups: ['__other', '__kitten'] },
        { id: 'terms', label: 'งาน', icon: 'fa-list-check', groups: ['terms'] },
        { id: 'pay', label: 'เงิน', icon: 'fa-money-bill-wave', groups: ['pay'] },
        { id: 'review', label: 'ตรวจ', icon: 'fa-circle-check', groups: ['doc', 'extra'] }
    ];
    let steps = [];
    let step = 0;
    let partyBook = {};

    let type = null;
    let fields = {};
    let editing = false;
    let chosen = false;

    // ---------- type chooser ----------
    function chooserHTML() {
        return C.GROUPS.map((g) => {
            const cards = Object.entries(C.TYPES).filter(([, t]) => t.group === g.id).map(([id, t]) =>
                `<button type="button" class="cert-card" data-pick="${id}"><i class="fas ${t.icon}"></i><b>${esc(t.short)}</b><small>${esc(t.desc)}</small></button>`).join('');
            return cards ? `<div class="cert-chooser-group">${esc(g.label)}</div><div class="cert-chooser-grid">${cards}</div>` : '';
        }).join('');
    }

    window.openContractChooser = function () { $('ct-chooser').hidden = false; };

    // ---------- form ----------
    function inputHTML(fl, val) {
        const id = 'ctf-' + fl.id;
        const v = esc(val);
        let ctl;
        if (fl.type === 'textarea') ctl = `<textarea id="${id}" data-f="${fl.id}" rows="3">${v}</textarea>`;
        else if (fl.type === 'select') ctl = `<select id="${id}" data-f="${fl.id}">${fl.options.map((o) => `<option value="${esc(o)}"${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
        else ctl = `<input id="${id}" data-f="${fl.id}" type="${fl.type || 'text'}" value="${v}"${fl.type === 'number' ? ' step="any" inputmode="decimal"' : ''}>`;
        return `<div class="form-group${fl.full || fl.type === 'textarea' ? ' full' : ''}"><label for="${id}">${esc(fl.label)}</label>${ctl}</div>`;
    }

    function buildForm() {
        const t = C.TYPES[type];
        const titles = GROUP_TITLES(t);
        const byGroup = {};
        t.fields.forEach((fl) => { (byGroup[fl.group] = byGroup[fl.group] || []).push(fl); });
        const other = t.kittenSide === 'a' ? 'b' : 'a';
        const resolve = (g) => (g === '__other' ? other : g === '__kitten' ? t.kittenSide : g);

        steps = STEPS.map((st) => ({ ...st, real: st.groups.map(resolve).filter((g) => byGroup[g]) })).filter((st) => st.real.length);
        if (step >= steps.length) step = 0;

        const sectionHTML = (g) => {
            const body = `<div class="ct-form-grid">${byGroup[g].map((fl) => inputHTML(fl, fields[fl.id] != null ? fields[fl.id] : '')).join('')}</div>`;
            const docNo = g === 'doc'
                ? `<div class="ct-form-grid"><div class="form-group full"><label for="in-doc-no">เลขที่สัญญา</label><input type="text" id="in-doc-no" placeholder="เช่น CT-2569-001"></div></div>` : '';
            const kittenNote = g === t.kittenSide ? '<p class="ct-note">ข้อมูลบริษัทใส่ให้แล้ว — ตรวจชื่อผู้มีอำนาจลงนามให้ครบ</p>' : '';
            return `<div class="form-section ${COLLAPSED.has(g) ? 'kc-collapse' : ''}" data-hint="${COLLAPSED.has(g) ? 'ไม่บังคับ' : ''}"><h3><i class="fas ${GROUP_ICONS[g]}"></i> ${esc(titles[g])}</h3>${kittenNote}${docNo}${body}</div>`;
        };
        $('ct-form').innerHTML = steps.map((st, i) =>
            `<div class="ct-step" data-step="${i}"${i === step ? '' : ' hidden'}>${st.id === 'review' ? '<div class="ct-summary" id="ct-summary"></div>' : ''}${st.real.map(sectionHTML).join('')}</div>`).join('');
        $('ct-law').textContent = 'อ้างอิง: ' + t.law;
        $('ct-form-title').textContent = t.title;
        $('ct-current-label').textContent = t.short;
        renderStepper();
        bindCollapse();
        bindPartyBook();
    }

    function renderStepper() {
        $('ct-steps').innerHTML = steps.map((st, i) =>
            `<button type="button" class="ct-step-chip${i === step ? ' active' : ''}${i < step ? ' done' : ''}" data-go="${i}"><span class="ct-step-n">${i < step ? '<i class="fas fa-check"></i>' : i + 1}</span><span>${esc(st.label)}</span></button>`).join('');
        const last = step === steps.length - 1;
        $('btn-prev').hidden = step === 0;
        $('btn-next').hidden = last;
        $('btn-print').hidden = !last;
        $('btn-save-cloud').hidden = !last;
        $('ct-next-label').textContent = steps[step + 1] ? steps[step + 1].label : '';
    }

    function goStep(i) {
        step = Math.max(0, Math.min(steps.length - 1, i));
        document.querySelectorAll('#ct-form .ct-step').forEach((el) => { el.hidden = Number(el.dataset.step) !== step; });
        renderStepper();
        refresh();
        const panel = document.querySelector('.form-panel');
        if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function bindCollapse() {
        document.querySelectorAll('#ct-form .form-section.kc-collapse').forEach((sec) => {
            const h3 = sec.querySelector('h3');
            const hint = sec.dataset.hint;
            if (hint && !h3.querySelector('.kc-collapse-hint')) { const s = document.createElement('span'); s.className = 'kc-collapse-hint'; s.textContent = hint; h3.appendChild(s); }
            sec.addEventListener('click', (e) => { if (e.target.closest('h3')) sec.classList.toggle('open'); });
            if (fields.extra) sec.classList.add('open');
        });
    }

    function collect() {
        const out = {};
        document.querySelectorAll('#ct-form [data-f]').forEach((el) => { out[el.dataset.f] = el.value; });
        return out;
    }

    // ---------- remembered counterparties ----------
    function bindPartyBook() {
        const t = C.TYPES[type];
        const other = t.kittenSide === 'a' ? 'b' : 'a';
        let dl = $('ct-party-list');
        if (!dl) { dl = document.createElement('datalist'); dl.id = 'ct-party-list'; document.body.appendChild(dl); }
        dl.innerHTML = Object.keys(partyBook).map((n) => `<option value="${esc(n)}">`).join('');
        const nameEl = $('ctf-' + other + 'Name');
        if (!nameEl) return;
        nameEl.setAttribute('list', 'ct-party-list');
        nameEl.addEventListener('change', () => {
            const hit = partyBook[nameEl.value.trim()];
            if (!hit) return;
            ['Id', 'Rep', 'RepPos', 'Address'].forEach((k) => {
                const el = $('ctf-' + other + k);
                if (el && !el.value.trim() && hit[k]) el.value = hit[k];
            });
            refresh();
        });
    }

    async function loadPartyBook() {
        try {
            const fb = await import('../core/firebase-config.js');
            const snap = await fb.getDocs(fb.collection(fb.db, 'contracts'));
            snap.forEach((d) => {
                const x = d.data(), f = x.fields || {}, tp = C.TYPES[x.contractType];
                if (!tp) return;
                const o = tp.kittenSide === 'a' ? 'b' : 'a';
                const name = String(f[o + 'Name'] || '').trim();
                if (name && !partyBook[name]) partyBook[name] = { Id: f[o + 'Id'] || '', Rep: f[o + 'Rep'] || '', RepPos: f[o + 'RepPos'] || '', Address: f[o + 'Address'] || '' };
            });
            if (type) bindPartyBook();
        } catch (e) { /* admin-only collection; silently skip */ }
    }

    // ---------- preview / warnings ----------
    function docNoValue() { const el = $('in-doc-no'); return el ? el.value.trim() : ''; }

    function refresh() {
        if (!type) return;
        fields = Object.assign({}, fields, collect());
        const rec = { contractType: type, fields, docNo: docNoValue() };
        const panel = $('preview-panel');
        panel.innerHTML = '';
        panel.appendChild(C.render(rec));

        const w = C.warnings(type, fields);
        const box = $('ct-warn');
        const onReview = steps.length && steps[step] && steps[step].id === 'review';
        if (w.length) { box.className = 'ct-warn'; box.innerHTML = '<ul>' + w.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>'; }
        else { box.className = 'ct-warn ok'; box.textContent = 'ข้อมูลหลักครบแล้ว — ตรวจตัวอย่างแล้วพิมพ์หรือบันทึกได้'; }
        box.hidden = !onReview;
        const chip = document.querySelector('.ct-step-chip[data-go="' + (steps.length - 1) + '"] .ct-step-n');
        if (chip && step !== steps.length - 1) chip.dataset.warn = w.length ? w.length : '';
        renderSummary(w);
        saveDraft();
    }

    function renderSummary(w) {
        const el = $('ct-summary');
        if (!el) return;
        const t = C.TYPES[type];
        const sm = C.summary(type, fields);
        const row = (k, v) => `<div class="ct-sum-row"><span>${esc(k)}</span><b>${v ? esc(v) : '<i>ยังไม่ระบุ</i>'}</b></div>`;
        el.innerHTML = row('ชนิดสัญญา', t.short) + row(t.kittenSide === 'a' ? t.roles.b : t.roles.a, sm.party)
            + row('งาน / ตำแหน่ง', sm.subject)
            + row('มูลค่า', sm.amountTotal ? '฿' + Number(sm.amountTotal).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '');
    }

    function saveDraft() {
        if (editing) return;
        try { localStorage.setItem(DRAFT(type), JSON.stringify({ fields, docNo: docNoValue() })); } catch (e) { /* ignore */ }
    }

    function loadDraft(t) {
        try { return JSON.parse(localStorage.getItem(DRAFT(t)) || 'null'); } catch (e) { return null; }
    }

    // ---------- choose / switch ----------
    function setType(t, keepValues) {
        const prev = fields;
        type = t;
        step = 0;
        const base = C.defaults(t);
        fields = Object.assign(base, keepValues ? sharedValues(prev, base) : {});
        buildForm();
        refresh();
    }

    // when switching type, carry over fields that exist in both (parties, place, date …)
    function sharedValues(prev, base) {
        const out = {};
        Object.keys(base).forEach((k) => { if (prev && prev[k] !== undefined && prev[k] !== '' && ['signPlace', 'signDate', 'witness1', 'witness2', 'aName', 'aId', 'aRep', 'aRepPos', 'aAddress', 'bName', 'bId', 'bRep', 'bRepPos', 'bAddress', 'bankName', 'bankHolder', 'bankNo'].includes(k)) out[k] = prev[k]; });
        return out;
    }

    function pick(t, useDraft) {
        const had = !!type;
        const draft = useDraft ? loadDraft(t) : null;
        if (draft && draft.fields && !had) {
            type = t; fields = Object.assign(C.defaults(t), draft.fields); buildForm();
            if (draft.docNo) $('in-doc-no').value = draft.docNo;
            refresh();
        } else {
            setType(t, had);
        }
        chosen = true;
        $('ct-chooser').hidden = true;
        if (!editing) ensureNumber();
        const first = document.querySelector('#ct-form [data-f=bName], #ct-form [data-f=aName]');
        if (first) first.focus({ preventScroll: true });
    }

    async function ensureNumber() {
        if (window.KCDoc && !docNoValue()) { await window.KCDoc.ensureDocNo('contract'); refresh(); }
    }

    // ---------- actions ----------
    window.printContract = function () {
        refresh();
        const prev = document.title;
        const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]/g, '_');
        document.title = `${clean(docNoValue() || 'CONTRACT')}-${clean(fields.bName || fields.aName)}`;
        window.print();
        setTimeout(() => { document.title = prev; }, 600);
    };

    window.clearContractDraft = function () {
        if (!confirm('ล้างข้อมูลที่กรอกและเริ่มสัญญาใหม่?')) return;
        try { localStorage.removeItem(DRAFT(type)); } catch (e) { /* ignore */ }
        if (window.KCDoc) window.KCDoc.resetEditing('contract');
        location.href = location.pathname + '?type=' + encodeURIComponent(type);
    };

    function toast(msg, ok) {
        const old = $('kcToast'); if (old) old.remove();
        const el = document.createElement('div');
        el.id = 'kcToast'; el.className = 'kc-toast-container';
        el.innerHTML = `<i class="fas fa-${ok ? 'check-circle' : 'exclamation-triangle'} kc-toast-icon" style="color:${ok ? '#10b981' : '#ef4444'}"></i><div class="kc-toast-content"><span class="kc-toast-title">${ok ? 'สำเร็จ' : 'ข้อผิดพลาด'}</span><span class="kc-toast-message">${esc(msg)}</span></div>`;
        document.body.appendChild(el);
        setTimeout(() => el.classList.add('show'), 50);
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
    }

    window.saveContract = async function () {
        refresh();
        const docNo = docNoValue();
        if (!docNo) { toast('กรุณากรอกเลขที่สัญญา', false); return; }
        const btn = $('btn-save-cloud');
        btn.disabled = true;
        try {
            const fb = await import('../core/firebase-config.js');
            const s = C.summary(type, fields);
            const record = {
                docNo, docDate: fields.signDate || '', contractType: type, fields,
                custName: s.party, amountTotal: s.amountTotal, subject: s.subject,
                status: 'Draft', createdAt: fb.serverTimestamp(), updatedAt: fb.serverTimestamp()
            };
            await window.KCDoc.save('contract', docNo, record);
            try { localStorage.removeItem(DRAFT(type)); } catch (e) { /* ignore */ }
            editing = true;
            toast('บันทึกสัญญาลงทะเบียนเอกสารแล้ว', true);
        } catch (e) {
            console.error(e);
            toast(e.message || 'บันทึกไม่สำเร็จ', false);
        }
        btn.disabled = false;
    };

    // ---------- init ----------
    document.addEventListener('DOMContentLoaded', () => {
        $('ct-chooser-groups').innerHTML = chooserHTML();
        $('ct-chooser').addEventListener('click', (e) => {
            const c = e.target.closest('[data-pick]');
            if (c) pick(c.dataset.pick);
            if (e.target.closest('#ct-resume')) { $('ct-chooser').hidden = true; }
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && chosen && !$('ct-chooser').hidden) $('ct-chooser').hidden = true; });
        $('ct-steps').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) goStep(Number(b.dataset.go)); });
        $('btn-prev').addEventListener('click', () => goStep(step - 1));
        $('btn-next').addEventListener('click', () => goStep(step + 1));
        loadPartyBook();
        $('ct-form').addEventListener('input', refresh);
        $('ct-form').addEventListener('change', refresh);

        // Opened from the register to edit?
        let payload = null;
        try { payload = JSON.parse(localStorage.getItem('kc_edit_doc') || 'null'); } catch (e) { payload = null; }
        if (payload && payload.col === 'contracts' && payload.data && C.TYPES[payload.data.contractType]) {
            editing = true;
            type = payload.data.contractType;
            fields = Object.assign(C.defaults(type), payload.data.fields || {});
            buildForm();
            if (window.KCDoc) window.KCDoc.applyEditData('contract', {}, (id, v) => {
                if (id === 'doc-no') { const el = $('in-doc-no'); if (el) el.value = v; }
            });
            refresh();
            chosen = true;
            return;
        }

        const wanted = new URLSearchParams(location.search).get('type');
        if (C.TYPES[wanted]) { pick(wanted); return; }

        // No type: ask first; offer an unfinished draft.
        const draftType = Object.keys(C.TYPES).find((t) => { const d = loadDraft(t); return d && d.fields && (d.fields.bName || d.fields.aName !== C.defaults(t).aName); });
        if (draftType) {
            const r = $('ct-resume');
            r.hidden = false;
            r.textContent = `ทำต่อจากร่างที่ค้างไว้ (${C.TYPES[draftType].short})`;
            r.addEventListener('click', () => pick(draftType, true));
        }
        $('ct-chooser').hidden = false;
    });
})();
