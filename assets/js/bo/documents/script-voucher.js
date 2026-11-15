// ============================================================
//  script-voucher.js — Kitten Code Corporate Expense,
//  Procurement & Payment Voucher Generator (PR / PO / EXP / PV)
//  Requires doc-common.js (window.KCDoc) & voucher-template.js (window.KCVoucher)
// ============================================================

const DRAFT_KEY = 'draft_voucher_data';

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

let state = {
    items: [{ id: generateId(), desc: '', qty: 1, unit: 'รายการ', price: 0 }],
    discount: 0,
    note: '',
    isReprint: false
};

const INPUT_IDS = [
    'voucher-type',
    'doc-no',
    'doc-date',
    'needed-date',
    'ref-no',
    'proj-name',
    'requester-name',
    'department',
    'claim-type',
    'purpose',
    'vendor-name',
    'vendor-tax',
    'vendor-tel',
    'vendor-addr',
    'pay-terms',
    'pay-method',
    'bank-name',
    'bank-account',
    'bank-owner',
    'doc-discount',
    'doc-vat',
    'doc-wht',
    'certify-no-receipt',
    'note',
    'sign-requester',
    'sign-reviewer',
    'sign-approver',
    'sign-payer',
    'sign-payee'
];

function getEl(id) {
    return document.getElementById(`in-${id}`);
}

function getInputValue(id) {
    const el = getEl(id);
    if (!el) return '';
    if (el.type === 'checkbox') return Boolean(el.checked);
    return el.value.trim();
}

function setInputValue(id, value) {
    const el = getEl(id);
    if (!el) return;
    if (el.type === 'checkbox') {
        el.checked = Boolean(value);
    } else {
        el.value = value ?? '';
    }
}

function collectData() {
    const voucherType = getInputValue('voucher-type') || 'pv';
    const requesterName = getInputValue('requester-name');
    const vendorName = getInputValue('vendor-name');
    const d = {
        voucherType,
        docNo: getInputValue('doc-no'),
        docDate: getInputValue('doc-date'),
        neededDate: getInputValue('needed-date'),
        refNo: getInputValue('ref-no'),
        projName: getInputValue('proj-name'),
        requesterName,
        department: getInputValue('department'),
        claimType: getInputValue('claim-type'),
        purpose: getInputValue('purpose'),
        vendorName,
        vendorTax: getInputValue('vendor-tax'),
        vendorTel: getInputValue('vendor-tel'),
        vendorAddr: getInputValue('vendor-addr'),
        payTerms: getInputValue('pay-terms'),
        payMethod: getInputValue('pay-method'),
        bankName: getInputValue('bank-name'),
        bankAccount: getInputValue('bank-account'),
        bankOwner: getInputValue('bank-owner'),
        discountAmount: Number(getInputValue('doc-discount')) || 0,
        vatRate: Number(getInputValue('doc-vat')) || 0,
        whtRate: Number(getInputValue('doc-wht')) || 0,
        certifyNoReceipt: getInputValue('certify-no-receipt'),
        note: getInputValue('note'),
        signRequester: getInputValue('sign-requester'),
        signReviewer: getInputValue('sign-reviewer'),
        signApprover: getInputValue('sign-approver'),
        signPayer: getInputValue('sign-payer'),
        signPayee: getInputValue('sign-payee'),
        custName: vendorName || requesterName || '-',
        items: state.items.map(it => ({
            desc: it.desc || '',
            qty: Number(it.qty) || 0,
            unit: it.unit || '',
            price: Number(it.price) || 0
        }))
    };
    const totals = window.KCVoucher.calcTotals(d);
    d.subtotal = totals.subtotal;
    d.vatAmount = totals.vatAmount;
    d.whtAmount = totals.whtAmount;
    d.amountTotal = totals.netPayable;
    return d;
}

function showSaveToast(message, type = 'success') {
    const existing = document.getElementById('saveToast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'saveToast';
    toast.className = 'kc-toast-container';
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} kc-toast-icon" style="color: ${type === 'success' ? '#10b981' : '#ef4444'}"></i>
        <div class="kc-toast-content">
            <span class="kc-toast-title">${type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}</span>
            <span class="kc-toast-message">${window.KCVoucher.escapeHTML(message)}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 80);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

function saveDraft() {
    const inputs = {};
    INPUT_IDS.forEach(id => {
        const el = getEl(id);
        if (!el) return;
        inputs[id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ state, inputs }));
}

function restoreDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
        const draft = JSON.parse(saved);
        if (draft.state && Array.isArray(draft.state.items) && draft.state.items.length) {
            state = draft.state;
        }
        if (draft.inputs) {
            Object.keys(draft.inputs).forEach(id => setInputValue(id, draft.inputs[id]));
        }
    } catch (e) {
        console.error('Could not restore voucher draft', e);
    }
}

window.clearDraft = function () {
    localStorage.removeItem(DRAFT_KEY);
    if (window.KCDoc) window.KCDoc.resetEditing('voucher');
    location.reload();
};

function renderItemsForm() {
    const container = document.getElementById('items-container');
    if (!container) return;
    const esc = window.KCVoucher.escapeHTML;
    container.innerHTML = state.items.map((item, idx) => `
        <div class="item-entry">
            <button type="button" class="btn btn-danger btn-sm remove-btn" onclick="removeItem(${item.id})" title="ลบรายการ">
                <i class="fas fa-times"></i>
            </button>
            <div class="form-group full-width" style="margin-bottom: 8px;">
                <label>รายการที่ ${idx + 1} — รายละเอียดการเบิก / ซื้อ / จ้าง</label>
                <textarea rows="2" placeholder="ระบุรายละเอียดสินค้า บริการ หรือค่าใช้จ่าย..."
                    oninput="handleItemChange(${item.id}, 'desc', this.value)">${esc(item.desc)}</textarea>
            </div>
            <div class="form-grid" style="grid-template-columns: 1fr 1fr 1.2fr;">
                <div class="form-group">
                    <label>จำนวน</label>
                    <input type="number" step="any" min="0" value="${item.qty}"
                        oninput="handleItemChange(${item.id}, 'qty', this.value)">
                </div>
                <div class="form-group">
                    <label>หน่วย</label>
                    <input type="text" value="${esc(item.unit || '')}" placeholder="ชิ้น / งาน / เดือน"
                        oninput="handleItemChange(${item.id}, 'unit', this.value)">
                </div>
                <div class="form-group">
                    <label>ราคา/หน่วย (บาท)</label>
                    <input type="number" step="0.01" min="0" value="${item.price}"
                        oninput="handleItemChange(${item.id}, 'price', this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

window.addItemLine = function () {
    state.items.push({ id: generateId(), desc: '', qty: 1, unit: 'รายการ', price: 0 });
    renderItemsForm();
    buildPreview();
};

window.removeItem = function (id) {
    if (state.items.length <= 1) {
        state.items[0] = { id: generateId(), desc: '', qty: 1, unit: 'รายการ', price: 0 };
    } else {
        state.items = state.items.filter(it => it.id !== id);
    }
    renderItemsForm();
    buildPreview();
};

window.handleItemChange = function (id, field, value) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    if (field === 'desc' || field === 'unit') {
        item[field] = value;
    } else {
        item[field] = Number(value) || 0;
    }
    buildPreview();
};

window.handleVoucherTypeChange = async function (type, skipNumberUpdate = false) {
    const voucherType = type || getInputValue('voucher-type') || 'pv';
    setInputValue('voucher-type', voucherType);

    document.querySelectorAll('.type-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === voucherType);
    });

    document.querySelectorAll('[data-show-for]').forEach(el => {
        const list = (el.getAttribute('data-show-for') || '').split(',');
        el.style.display = list.includes(voucherType) ? '' : 'none';
    });

    const nextBtn = document.getElementById('btn-next-step');
    if (nextBtn) {
        if (voucherType === 'pr') {
            nextBtn.style.display = '';
            nextBtn.innerHTML = 'ออกใบสั่งซื้อ/จ้างต่อ (PO) <i class="fas fa-arrow-right"></i>';
        } else if (voucherType === 'po' || voucherType === 'exp') {
            nextBtn.style.display = '';
            nextBtn.innerHTML = 'ออกใบสำคัญจ่ายต่อ (PV) <i class="fas fa-arrow-right"></i>';
        } else {
            nextBtn.style.display = 'none';
        }
    }

    // Update docNo prefix if not editing an existing doc and docNo matches standard prefix
    if (!skipNumberUpdate && window.KCDoc && !window.KCDoc.isEditing()) {
        const noEl = getEl('doc-no');
        const prefix = (window.KCVoucher.TYPES[voucherType] || window.KCVoucher.TYPES.pv).prefix;
        if (noEl && (!noEl.value.trim() || /^(PR|PO|EXP|PV)-\d{4}-\d+$/.test(noEl.value.trim()))) {
            noEl.value = '';
            await window.KCDoc.ensureDocNo('voucher', prefix);
        }
    }

    buildPreview();
};

function applyConvertedVoucher() {
    const raw = localStorage.getItem('kc_convert_voucher');
    if (!raw) return false;
    localStorage.removeItem('kc_convert_voucher');
    try {
        const p = JSON.parse(raw);
        if (p.targetType) setInputValue('voucher-type', p.targetType);
        if (p.sourceDocNo) setInputValue('ref-no', p.sourceDocNo);
        if (p.projName) setInputValue('proj-name', p.projName);
        if (p.requesterName) setInputValue('requester-name', p.requesterName);
        if (p.department) setInputValue('department', p.department);
        if (p.purpose) setInputValue('purpose', p.purpose);
        if (p.vendorName) setInputValue('vendor-name', p.vendorName);
        if (p.vendorTax) setInputValue('vendor-tax', p.vendorTax);
        if (p.vendorTel) setInputValue('vendor-tel', p.vendorTel);
        if (p.vendorAddr) setInputValue('vendor-addr', p.vendorAddr);
        if (p.payMethod) setInputValue('pay-method', p.payMethod);
        if (p.bankName) setInputValue('bank-name', p.bankName);
        if (p.bankAccount) setInputValue('bank-account', p.bankAccount);
        if (p.bankOwner) setInputValue('bank-owner', p.bankOwner);
        setInputValue('doc-discount', p.discountAmount || 0);
        setInputValue('doc-vat', p.vatRate ?? 0);
        setInputValue('doc-wht', p.whtRate ?? 0);
        if (Array.isArray(p.items) && p.items.length) {
            state.items = p.items.map((it, idx) => ({
                id: generateId() + idx,
                desc: it.desc || '',
                qty: Number(it.qty) || 1,
                unit: it.unit || 'รายการ',
                price: Number(it.price) || 0
            }));
        }
        return true;
    } catch (e) {
        console.error('Invalid kc_convert_voucher', e);
        return false;
    }
}

window.convertNextStep = async function () {
    const saved = await window.saveDocumentToFirestore();
    if (!saved) return;
    const d = collectData();
    const targetType = d.voucherType === 'pr' ? 'po' : 'pv';
    localStorage.setItem('kc_convert_voucher', JSON.stringify({
        targetType,
        sourceDocNo: d.docNo,
        projName: d.projName,
        requesterName: d.requesterName,
        department: d.department,
        purpose: d.purpose,
        vendorName: d.vendorName || d.requesterName,
        vendorTax: d.vendorTax,
        vendorTel: d.vendorTel,
        vendorAddr: d.vendorAddr,
        payMethod: d.payMethod,
        bankName: d.bankName,
        bankAccount: d.bankAccount,
        bankOwner: d.bankOwner,
        discountAmount: d.discountAmount,
        vatRate: d.vatRate,
        whtRate: d.whtRate,
        items: d.items
    }));
    if (window.KCDoc) window.KCDoc.resetEditing('voucher');
    localStorage.removeItem(DRAFT_KEY);
    location.reload();
};

function buildPreview() {
    saveDraft();
    const container = document.getElementById('preview-panel');
    if (!container || !window.KCVoucher) return;
    const scrollPos = container.scrollTop;
    container.innerHTML = '';
    const data = collectData();
    const page = window.KCVoucher.render(data, { isReprint: state.isReprint });
    container.appendChild(page);
    container.scrollTop = scrollPos;
}

window.buildPreview = buildPreview;

window.saveDocumentToFirestore = async function () {
    const btnSave = document.getElementById('btn-save-cloud');
    if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    }
    try {
        const { auth, serverTimestamp } = await import('../core/firebase-config.js');
        if (!auth.currentUser) {
            throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึกเอกสาร');
        }
        const data = collectData();
        if (!data.docNo) {
            throw new Error('กรุณาระบุเลขที่เอกสาร');
        }
        if (!data.vendorName && !data.requesterName) {
            throw new Error('กรุณาระบุชื่อผู้ขอเบิก หรือ ชื่อผู้ขาย/ผู้รับเงิน');
        }
        const defaultStatus = data.voucherType === 'pv' ? 'Paid' : 'Pending';
        const record = {
            ...data,
            docDate: data.docDate || new Date().toISOString().split('T')[0],
            type: 'voucher',
            status: defaultStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid
        };

        await window.KCDoc.save('voucher', data.docNo, record);
        showSaveToast('บันทึกเอกสารไปยังระบบเรียบร้อยแล้ว', 'success');
        setTimeout(() => {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fas fa-check"></i> บันทึก';
            }
        }, 1800);
        return true;
    } catch (error) {
        console.error('Error saving voucher:', error);
        showSaveToast(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        alert('Error: ' + (error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'));
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fas fa-check"></i> บันทึก';
        }
        return false;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const dateInput = getEl('doc-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    const edited = window.KCDoc && window.KCDoc.applyEditData('voucher', state, setInputValue);
    if (!edited) {
        const converted = applyConvertedVoucher();
        if (!converted) restoreDraft();
    }

    renderItemsForm();

    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach(el => {
        el.addEventListener('input', () => buildPreview());
        el.addEventListener('change', () => buildPreview());
    });

    const activeType = getInputValue('voucher-type') || 'pv';
    await window.handleVoucherTypeChange(activeType, Boolean(edited));

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => buildPreview());
    }
    setTimeout(() => buildPreview(), 350);
});
