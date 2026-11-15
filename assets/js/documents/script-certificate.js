// ============================================================
//  script-certificate.js — Kitten Code Certificate Generator
//  Supports:
//   - หนังสือรับรองการทำงาน (employment)
//   - หนังสือรับรองการฝึกงาน (internship)
//  Requires certificate-template.js (window.KCCertificate)
// ============================================================

const DRAFT_KEY = 'draft_certificate_data';

const DEFAULT_EVALUATION_INTERN =
    'ตลอดระยะเวลาการฝึกงาน นักศึกษามีความตั้งใจ ขยันหมั่นเพียร มีความรับผิดชอบต่อหน้าที่ที่ได้รับมอบหมาย เรียนรู้งานได้รวดเร็ว และสามารถทำงานร่วมกับผู้อื่นได้เป็นอย่างดี';

let state = {
    isReprint: false
};

const INPUT_IDS = [
    'cert-type',
    'doc-no',
    'doc-date',
    'company-name',
    'name-prefix',
    'person-name',
    'id-card',
    'student-id',
    'institution',
    'faculty',
    'major',
    'position',
    'department',
    'start-date',
    'end-date',
    'still-employed',
    'total-hours',
    'show-salary',
    'salary',
    'duties',
    'evaluation',
    'purpose',
    'sign-name',
    'sign-position'
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
    const certType = getInputValue('cert-type') || 'employment';
    const namePrefix = getInputValue('name-prefix');
    const personName = getInputValue('person-name');
    return {
        certType,
        docNo: getInputValue('doc-no'),
        docDate: getInputValue('doc-date'),
        companyName: getInputValue('company-name') || 'บริษัท คิทเช่น โค้ด จำกัด (Kitten Code Co., Ltd.)',
        namePrefix,
        personName,
        custName: `${namePrefix || ''}${personName || ''}`.trim(),
        idCard: getInputValue('id-card'),
        studentId: getInputValue('student-id'),
        institution: getInputValue('institution'),
        faculty: getInputValue('faculty'),
        major: getInputValue('major'),
        position: getInputValue('position'),
        department: getInputValue('department'),
        startDate: getInputValue('start-date'),
        endDate: getInputValue('end-date'),
        stillEmployed: getInputValue('still-employed'),
        totalHours: getInputValue('total-hours'),
        showSalary: getInputValue('show-salary'),
        salary: Number(getInputValue('salary')) || 0,
        duties: getInputValue('duties'),
        evaluation: getInputValue('evaluation'),
        purpose: getInputValue('purpose'),
        signName: getInputValue('sign-name'),
        signPosition: getInputValue('sign-position')
    };
}

// --- Toast Helpers ---
function showDraftToast() {
    if (document.getElementById('kcToast')) return;
    const toast = document.createElement('div');
    toast.id = 'kcToast';
    toast.className = 'kc-toast-container';
    toast.innerHTML = `
        <i class="fas fa-check-circle kc-toast-icon" style="color: #10b981"></i>
        <div class="kc-toast-content">
            <span class="kc-toast-title">Draft Restored</span>
            <span class="kc-toast-message">กู้คืนข้อมูลร่างที่ยังไม่ได้บันทึกเรียบร้อยแล้ว</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
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
            <span class="kc-toast-title">${type === 'success' ? 'สำเร็จ (Success)' : 'ข้อผิดพลาด (Error)'}</span>
            <span class="kc-toast-message">${window.KCCertificate.escapeHTML(message)}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// --- Draft Save / Restore ---
function saveDraft() {
    const inputs = {};
    INPUT_IDS.forEach(id => {
        const el = getEl(id);
        if (!el) return;
        inputs[id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ inputs }));
}

function restoreDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
        const draft = JSON.parse(saved);
        if (draft && draft.inputs) {
            Object.keys(draft.inputs).forEach(id => {
                setInputValue(id, draft.inputs[id]);
            });
            showDraftToast();
        }
    } catch (e) {
        console.error('Could not restore certificate draft', e);
    }
}

window.clearDraft = function () {
    localStorage.removeItem(DRAFT_KEY);
    location.reload();
};

// --- Mode & Conditional Field Visibility ---
window.handleCertTypeChange = function (type) {
    const certType = type || getInputValue('cert-type') || 'employment';
    setInputValue('cert-type', certType);

    document.querySelectorAll('.type-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === certType);
    });

    document.querySelectorAll('.only-employment').forEach(el => {
        el.style.display = certType === 'employment' ? '' : 'none';
    });
    document.querySelectorAll('.only-internship').forEach(el => {
        el.style.display = certType === 'internship' ? '' : 'none';
    });

    // Update end-date disabled state if stillEmployed is checked in employment mode
    const endDateEl = getEl('end-date');
    const stillEmp = getInputValue('still-employed');
    if (endDateEl) {
        endDateEl.disabled = (certType === 'employment' && stillEmp);
    }

    // Update salary input visibility
    const salaryGroup = document.getElementById('salary-input-group');
    if (salaryGroup) {
        salaryGroup.style.display = (certType === 'employment' && getInputValue('show-salary')) ? '' : 'none';
    }

    // Pre-fill default internship evaluation text if switching to internship and empty
    const evalEl = getEl('evaluation');
    if (certType === 'internship' && evalEl && !evalEl.value.trim()) {
        evalEl.value = DEFAULT_EVALUATION_INTERN;
    }

    buildPreview();
};

window.fillDefaultEvaluation = function () {
    const certType = getInputValue('cert-type');
    const evalEl = getEl('evaluation');
    if (!evalEl) return;
    if (certType === 'internship') {
        evalEl.value = DEFAULT_EVALUATION_INTERN;
    } else {
        evalEl.value = 'ตลอดระยะเวลาการปฏิบัติงาน พนักงานมีความตั้งใจ ขยันหมั่นเพียร มีความรับผิดชอบต่อหน้าที่ และมีมนุษยสัมพันธ์ที่ดีต่อเพื่อนร่วมงาน';
    }
    buildPreview();
};

function buildPreview() {
    saveDraft();
    const container = document.getElementById('preview-panel');
    if (!container || !window.KCCertificate) return;

    const scrollPos = container.scrollTop;
    container.innerHTML = '';

    const data = collectData();
    const page = window.KCCertificate.render(data, { isReprint: state.isReprint });
    container.appendChild(page);

    container.scrollTop = scrollPos;
}

window.buildPreview = buildPreview;

// --- Firestore Save ---
window.saveDocumentToFirestore = async function () {
    const btnSave = document.getElementById('btn-save-cloud');
    if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    }

    try {
        const { db, auth, doc, setDoc, serverTimestamp } = await import('../core/firebase-config.js');

        if (!auth.currentUser) {
            throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึกเอกสาร (You must be logged in to save documents.)');
        }

        const data = collectData();
        if (!data.docNo || !data.personName) {
            throw new Error("กรุณากรอก 'เลขที่เอกสาร' และ 'ชื่อ-นามสกุลผู้รับรอง' (Missing Document No or Recipient Name)");
        }

        const docDate = data.docDate || new Date().toISOString().split('T')[0];
        const amountTotal = (data.certType === 'employment' && data.showSalary) ? (Number(data.salary) || 0) : 0;

        const record = {
            ...data,
            docDate,
            amountTotal,
            type: 'certificate',
            status: 'Issued',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid
        };

        await setDoc(doc(db, 'certificates', data.docNo), record);

        showSaveToast('บันทึกหนังสือรับรองไปยังระบบเรียบร้อยแล้ว', 'success');
        setTimeout(() => {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fas fa-check"></i> บันทึก';
            }
        }, 2500);
        return true;
    } catch (error) {
        console.error('Error saving certificate:', error);
        showSaveToast(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        alert('Error: ' + (error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'));
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fas fa-check"></i> บันทึก';
        }
        return false;
    }
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = getEl('doc-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    restoreDraft();

    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach(el => {
        el.addEventListener('input', () => window.handleCertTypeChange());
        el.addEventListener('change', () => window.handleCertTypeChange());
    });

    window.handleCertTypeChange(getInputValue('cert-type') || 'employment');

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => buildPreview());
    }
    setTimeout(() => buildPreview(), 400);
});
