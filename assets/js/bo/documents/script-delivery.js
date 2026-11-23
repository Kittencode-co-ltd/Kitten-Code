// Delivery note editor (ใบส่งของ). Layout and pagination live in delivery-template.js.
const escapeHTML = (str) => (str == null ? '' : String(str).replace(/[&<>'"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m])));
const DRAFT_KEY = 'draft_delivery_data';
const generateId = () => Date.now() + Math.floor(Math.random() * 1000);
let state = { items: [{ id: generateId(), desc: '', qty: 1, unit: '' }], note: '' };

const getInputValue = (id) => { const el = document.getElementById(`in-${id}`); return el ? el.value : ''; };
const setInputValue = (id, v) => { const el = document.getElementById(`in-${id}`); if (el) el.value = v ?? ''; };

function saveDraft() {
    const draft = { state, inputs: {} };
    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach((el) => { if (el.id) draft.inputs[el.id] = el.value; });
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* storage full or blocked */ }
}
function restoreDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (!draft) return;
        state = draft.state || state;
        Object.keys(draft.inputs || {}).forEach((id) => { const el = document.getElementById(id); if (el) el.value = draft.inputs[id] ?? ''; });
    } catch (e) { console.warn('Could not restore draft', e); }
}
window.clearDraft = function () { localStorage.removeItem(DRAFT_KEY); location.reload(); };

function addItemLine() { state.items.push({ id: generateId(), desc: '', qty: 1, unit: '' }); renderItemsForm(); buildPreview(); }
function removeItem(id) { state.items = state.items.filter((i) => i.id !== id); if (!state.items.length) state.items.push({ id: generateId(), desc: '', qty: 1, unit: '' }); renderItemsForm(); buildPreview(); }
function handleItemChange(id, field, value) { const it = state.items.find((i) => i.id === id); if (it) { it[field] = field === 'qty' ? Number(value) : value; buildPreview(); } }

function renderItemsForm() {
    document.getElementById('items-container').innerHTML = state.items.map((item, index) => `
        <div class="item-entry">
            <button type="button" class="btn btn-danger btn-sm remove-btn" onclick="removeItem(${item.id})" title="ลบรายการ"><i class="fas fa-times"></i></button>
            <div class="form-group full-width" style="margin-bottom:8px;">
                <label>รายการที่ ${index + 1} - รายละเอียด</label>
                <textarea oninput="handleItemChange(${item.id}, 'desc', this.value)">${escapeHTML(item.desc)}</textarea>
            </div>
            <div class="form-grid">
                <div class="form-group"><label>จำนวน</label><input type="number" step="1" value="${Number(item.qty) || 0}" oninput="handleItemChange(${item.id}, 'qty', this.value)"></div>
                <div class="form-group"><label>หน่วย</label><input type="text" value="${escapeHTML(item.unit)}" placeholder="เช่น ชิ้น, งาน, ชุด" oninput="handleItemChange(${item.id}, 'unit', this.value)"></div>
            </div>
        </div>`).join('');
}

function collect() {
    return {
        issuer: getInputValue('issuer') || 'company', docNo: getInputValue('doc-no'), docDate: getInputValue('doc-date'), docRef: getInputValue('doc-ref'),
        custName: getInputValue('cust-name'), custAddr: getInputValue('cust-addr'), custTel: getInputValue('cust-tel'), shipTo: getInputValue('ship-to'),
        note: state.note || '', signReceiver: getInputValue('sign-receiver'), signSender: getInputValue('sign-sender'), signAuth: getInputValue('sign-auth'),
        items: state.items.map((i) => ({ desc: i.desc, qty: Number(i.qty) || 0, unit: i.unit || '' }))
    };
}

function buildPreview() {
    saveDraft();
    const container = document.getElementById('preview-panel'); if (!container) return;
    const top = container.scrollTop; container.innerHTML = '';
    window.KCDelivery.render(collect(), container);
    container.scrollTop = top;
}

document.addEventListener('DOMContentLoaded', () => {
    const date = document.getElementById('in-doc-date');
    if (date && !date.value) { const t = new Date(); date.value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach((el) => { el.addEventListener('input', buildPreview); el.addEventListener('change', buildPreview); });
    if (!window.KCDoc.applyEditData('delivery', state, setInputValue)) restoreDraft();
    renderItemsForm();
    window.KCDoc.ensureDocNo('delivery');
    KCIssuers.bind('delivery', buildPreview);
    document.fonts.ready.then(buildPreview);
    setTimeout(buildPreview, 500);
});

const showSaveToast = (message, type = 'success') => {
    const old = document.getElementById('saveToast'); if (old) old.remove();
    const t = document.createElement('div'); t.id = 'saveToast'; t.className = 'kc-toast-container';
    t.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} kc-toast-icon" style="color:${type === 'success' ? '#10b981' : '#ef4444'}"></i>
        <div class="kc-toast-content"><span class="kc-toast-title">${type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}</span><span class="kc-toast-message">${escapeHTML(message)}</span></div>`;
    document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 100); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
};

window.saveDocumentToFirestore = async function () {
    const btn = document.getElementById('btn-save-cloud');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก…'; }
    try {
        const { auth, serverTimestamp } = await import('../core/firebase-config.js');
        if (!auth.currentUser) throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึก');
        const d = collect();
        if (!d.docNo || !d.custName) throw new Error("กรุณากรอก 'เลขที่ใบส่งของ' และ 'ชื่อลูกค้า'");
        await window.KCDoc.save('delivery', d.docNo, {
            ...d, docDate: d.docDate || new Date().toISOString().split('T')[0], amountTotal: 0, type: 'delivery', status: 'Pending',
            createdAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid
        });
        showSaveToast('บันทึกใบส่งของเรียบร้อยแล้ว');
        return true;
    } catch (err) {
        console.error('Error saving document:', err);
        const denied = err && (err.code === 'permission-denied' || /permission/i.test(err.message || ''));
        showSaveToast(denied ? 'ยังบันทึกเข้าระบบไม่ได้ (รอทีม deploy กฎ Firestore) — พิมพ์ได้ตามปกติ และกด "ดาวน์โหลดสำรอง" เก็บข้อมูลไว้' : (err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'), 'error');
        return false;
    } finally {
        setTimeout(() => { if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> บันทึก'; } }, 800);
    }
};

// Manual channel: keep a copy of the note as a file (works without the database), and load it back later.
window.downloadBackup = function () {
    const d = collect();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ kind: 'kc-delivery-note', ...d }, null, 2)], { type: 'application/json' }));
    a.download = `${(d.docNo || 'delivery-note').replace(/[^\w.-]+/g, '_')}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
};
window.loadBackup = function (input) {
    const f = input.files && input.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
        try {
            const d = JSON.parse(r.result); if (d.kind !== 'kc-delivery-note') throw new Error('ไม่ใช่ไฟล์ใบส่งของสำรอง');
            ['issuer', 'doc-no', 'doc-date', 'doc-ref', 'cust-name', 'cust-addr', 'cust-tel', 'ship-to', 'sign-receiver', 'sign-sender', 'sign-auth'].forEach((k) => {
                const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); setInputValue(k, d[key === 'docNo' ? 'docNo' : key]);
            });
            state.note = d.note || ''; setInputValue('note', state.note);
            state.items = (d.items || []).map((it, i) => ({ id: generateId() + i, desc: it.desc || '', qty: Number(it.qty) || 0, unit: it.unit || '' }));
            if (!state.items.length) state.items = [{ id: generateId(), desc: '', qty: 1, unit: '' }];
            renderItemsForm(); buildPreview(); showSaveToast('โหลดไฟล์สำรองแล้ว');
        } catch (e) { showSaveToast(e.message || 'อ่านไฟล์ไม่ได้', 'error'); }
        input.value = '';
    };
    r.readAsText(f);
};
