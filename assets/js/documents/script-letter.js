// ============================================================
//  script-letter.js — Kitten Code Official External
//  Correspondence & Invitation Letter Generator
//  Requires doc-common.js (window.KCDoc) & letter-template.js (window.KCLetter)
// ============================================================

const DRAFT_KEY = 'draft_letter_data';

let state = {
    isReprint: false
};

const INPUT_IDS = [
    'letter-type',
    'doc-no',
    'doc-date',
    'company-name',
    'subject',
    'recipient-title',
    'recipient-org',
    'ref-doc',
    'enclosures',
    'topic-name',
    'event-date',
    'event-time',
    'event-location',
    'rep-name',
    'rep-id-card',
    'rep-position',
    'witness-1',
    'witness-2',
    'para-reason',
    'para-detail',
    'para-closing',
    'sign-name',
    'sign-position',
    'coord-name',
    'coord-tel',
    'coord-email'
];

function getEl(id) {
    return document.getElementById(`in-${id}`);
}

function getInputValue(id) {
    const el = getEl(id);
    if (!el) return '';
    return el.value.trim();
}

function setInputValue(id, value) {
    const el = getEl(id);
    if (el) el.value = value ?? '';
}

function collectData() {
    const letterType = getInputValue('letter-type') || 'invite_advisor';
    const recipientTitle = getInputValue('recipient-title');
    const recipientOrg = getInputValue('recipient-org');
    return {
        letterType,
        docNo: getInputValue('doc-no'),
        docDate: getInputValue('doc-date'),
        companyName: getInputValue('company-name') || 'บริษัท คิทเช่น โค้ด จำกัด',
        subject: getInputValue('subject'),
        recipientTitle,
        recipientOrg,
        custName: [recipientTitle, recipientOrg].filter(Boolean).join(' ') || '-',
        projName: getInputValue('topic-name') || getInputValue('subject'),
        refDoc: getInputValue('ref-doc'),
        enclosures: getInputValue('enclosures'),
        topicName: getInputValue('topic-name'),
        eventDate: getInputValue('event-date'),
        eventTime: getInputValue('event-time'),
        eventLocation: getInputValue('event-location'),
        repName: getInputValue('rep-name'),
        repIdCard: getInputValue('rep-id-card'),
        repPosition: getInputValue('rep-position'),
        witness1: getInputValue('witness-1'),
        witness2: getInputValue('witness-2'),
        paraReason: getInputValue('para-reason'),
        paraDetail: getInputValue('para-detail'),
        paraClosing: getInputValue('para-closing'),
        signName: getInputValue('sign-name'),
        signPosition: getInputValue('sign-position'),
        coordName: getInputValue('coord-name'),
        coordTel: getInputValue('coord-tel'),
        coordEmail: getInputValue('coord-email')
    };
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
            <span class="kc-toast-message">${window.KCLetter.escapeHTML(message)}</span>
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
        if (el) inputs[id] = el.value;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ inputs }));
}

function restoreDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
        const draft = JSON.parse(saved);
        if (draft && draft.inputs) {
            Object.keys(draft.inputs).forEach(id => setInputValue(id, draft.inputs[id]));
        }
    } catch (e) {
        console.error('Could not restore letter draft', e);
    }
}

window.clearDraft = function () {
    localStorage.removeItem(DRAFT_KEY);
    if (window.KCDoc) window.KCDoc.resetEditing('letter');
    location.reload();
};

window.handleLetterTypeChange = function (type) {
    const letterType = type || getInputValue('letter-type') || 'invite_advisor';
    setInputValue('letter-type', letterType);

    document.querySelectorAll('.type-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === letterType);
    });

    document.querySelectorAll('[data-show-for]').forEach(el => {
        const list = (el.getAttribute('data-show-for') || '').split(',');
        el.style.display = list.includes(letterType) ? '' : 'none';
    });

    buildPreview();
};

window.fillStandardLetterBody = function () {
    const d = collectData();
    const generated = window.KCLetter.buildDefaultDraft({ ...d, subject: '' });
    if (!getInputValue('subject')) {
        setInputValue('subject', generated.subject);
    }
    setInputValue('para-reason', generated.paraReason);
    setInputValue('para-detail', generated.paraDetail);
    setInputValue('para-closing', generated.paraClosing);
    buildPreview();
};

function buildPreview() {
    saveDraft();
    const container = document.getElementById('preview-panel');
    if (!container || !window.KCLetter) return;
    const scrollPos = container.scrollTop;
    container.innerHTML = '';
    const data = collectData();
    const page = window.KCLetter.render(data, { isReprint: state.isReprint });
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
            throw new Error('กรุณาระบุเลขที่หนังสือ (เช่น กค 001/2569 หรือ LET-2569-001)');
        }
        if (!data.recipientTitle && !data.recipientOrg) {
            throw new Error('กรุณาระบุผู้รับหนังสือ (เรียน / หน่วยงาน)');
        }
        const defaults = window.KCLetter.buildDefaultDraft(data);
        const record = {
            ...data,
            subject: data.subject || defaults.subject,
            paraReason: data.paraReason || defaults.paraReason,
            paraDetail: data.paraDetail || defaults.paraDetail,
            paraClosing: data.paraClosing || defaults.paraClosing,
            docDate: data.docDate || new Date().toISOString().split('T')[0],
            amountTotal: 0,
            type: 'letter',
            status: 'Issued',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid
        };

        await window.KCDoc.save('letter', data.docNo, record);
        showSaveToast('บันทึกหนังสือภายนอกไปยังระบบเรียบร้อยแล้ว', 'success');
        setTimeout(() => {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fas fa-check"></i> บันทึก';
            }
        }, 1800);
        return true;
    } catch (error) {
        console.error('Error saving letter:', error);
        showSaveToast(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        alert('Error: ' + (error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'));
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fas fa-check"></i> บันทึก';
        }
        return false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = getEl('doc-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    if (!window.KCDoc || !window.KCDoc.applyEditData('letter', state, setInputValue)) {
        restoreDraft();
    }
    if (window.KCDoc) {
        window.KCDoc.ensureDocNo('letter');
    }

    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach(el => {
        el.addEventListener('input', () => buildPreview());
        el.addEventListener('change', () => buildPreview());
    });

    window.handleLetterTypeChange(getInputValue('letter-type') || 'invite_advisor');

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => buildPreview());
    }
    setTimeout(() => buildPreview(), 350);
});
