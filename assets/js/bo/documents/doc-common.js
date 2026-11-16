/**
 * Shared helpers for the quotation / invoice / receipt editors.
 * Loaded as a classic script before each editor script; exposes window.KCDoc.
 *
 * - Auto document numbers:   QT-2569-001, INV-2569-001, RC-2569-001
 * - Safe save:               a new document can never overwrite an existing one
 *                            with the same number; editing keeps status/createdAt
 * - Edit mode:               document-record.html hands a saved document to the
 *                            editor via localStorage 'kc_edit_doc'
 */
(function () {
    'use strict';

    const PREFIX = {
        quotations: 'QT',
        invoices: 'INV',
        receipts: 'RC',
        certificates: 'CERT',
        vouchers: 'PV',
        letters: 'LET',
        contracts: 'CT'
    };
    const TYPE_TO_COL = {
        quotation: 'quotations',
        invoice: 'invoices',
        receipt: 'receipts',
        certificate: 'certificates',
        voucher: 'vouchers',
        letter: 'letters',
        contract: 'contracts'
    };

    // Saved field name → editor input id (without the "in-" prefix) where
    // the default camelCase → kebab-case rule does not apply.
    const FIELD_OVERRIDES = {
        vatRate: 'doc-vat',
        whtRate: 'doc-wht',
        witness1: 'witness-1',
        witness2: 'witness-2',
        discountAmount: { receipts: 'special-discount', default: 'doc-discount' }
    };
    const SKIP_FIELDS = new Set(['items', 'note', 'amountTotal', 'subtotal', 'vatAmount', 'whtAmount', 'type', 'status',
        'createdAt', 'updatedAt', 'updatedBy', 'id', 'collectionName', 'ledgerTxnId']);

    const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

    function inputIdFor(field, col) {
        const o = FIELD_OVERRIDES[field];
        if (typeof o === 'string') return o;
        if (o) return o[col] || o.default;
        return kebab(field);
    }

    let editing = null; // { col, docNo } while editing an existing document

    /** Fill the editor from a saved document. Returns true when edit data was applied. */
    function applyEditData(type, state, setInputValue) {
        const col = TYPE_TO_COL[type];
        let payload;
        try { payload = JSON.parse(localStorage.getItem('kc_edit_doc') || 'null'); } catch { payload = null; }
        if (!payload || payload.col !== col) return false;
        localStorage.removeItem('kc_edit_doc');

        const data = payload.data || {};
        Object.keys(data).forEach((field) => {
            if (SKIP_FIELDS.has(field)) return;
            const v = data[field];
            if (v === null || typeof v === 'object') return;
            setInputValue(inputIdFor(field, col), typeof v === 'string' ? v.replace(/คิท[เแ]ช่น/g, 'คิทเท่น').replace(/\(Kitten Code Co\., ?Ltd\.?\)/gi, '(KITTEN CODE Co.,Ltd)') : v);
        });
        state.note = data.note || '';
        setInputValue('note', state.note);
        state.discount = Number(data.discountAmount) || 0;
        if (Array.isArray(data.items) && data.items.length) {
            state.items = data.items.map((it, i) => ({
                id: Date.now() + i,
                desc: it.desc || '',
                qty: Number(it.qty) || 0,
                unit: it.unit || '',
                price: Number(it.price) || 0,
                discount: Number(it.discount) || 0
            }));
        }

        editing = { col, docNo: data.docNo };
        const noInput = document.getElementById('in-doc-no');
        if (noInput) {
            noInput.readOnly = true;
            noInput.title = 'เลขที่เอกสารแก้ไขไม่ได้ระหว่างแก้เอกสารเดิม';
        }
        notice(`กำลังแก้ไข ${data.docNo} — บันทึกแล้วจะทับฉบับเดิม`);
        return true;
    }

    /** Suggest the next number when the doc-no field is empty. */
    async function ensureDocNo(type, customPrefix) {
        const input = document.getElementById('in-doc-no');
        if (!input || input.value.trim() || editing) return;
        const col = TYPE_TO_COL[type];
        try {
            const fb = await import('../core/firebase-config.js');
            await waitForUser(fb);
            input.value = await nextDocNo(fb, col, customPrefix);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {
            console.warn('Could not suggest a document number', e);
        }
    }

    async function nextDocNo(fb, col, customPrefix) {
        const year = new Date().getFullYear() + 543;
        const pfx = customPrefix || PREFIX[col];
        const head = `${pfx}-${year}-`;
        const snap = await fb.getDocs(fb.collection(fb.db, col));
        let max = 0;
        snap.forEach((d) => {
            const no = String(d.id);
            if (no.startsWith(head)) {
                const n = parseInt(no.slice(head.length), 10);
                if (n > max) max = n;
            }
        });
        return head + String(max + 1).padStart(3, '0');
    }

    function waitForUser(fb) {
        return new Promise((resolve, reject) => {
            if (fb.auth.currentUser) return resolve(fb.auth.currentUser);
            const stop = fb.onAuthStateChanged(fb.auth, (u) => {
                stop();
                u ? resolve(u) : reject(new Error('ยังไม่ได้เข้าสู่ระบบ'));
            });
        });
    }

    /**
     * Save a document. New documents refuse to overwrite an existing number;
     * edits keep the original status and createdAt.
     */
    async function save(type, docNo, data) {
        const fb = await import('../core/firebase-config.js');
        await waitForUser(fb);
        const col = TYPE_TO_COL[type];
        if (docNo.includes('/')) throw new Error('เลขที่เอกสารห้ามมีเครื่องหมาย /');
        const ref = fb.doc(fb.db, col, docNo);
        const existing = await fb.getDoc(ref);
        const isEdit = editing && editing.col === col && editing.docNo === docNo;

        if (existing.exists() && !isEdit) {
            throw new Error(`เลขที่ ${docNo} มีอยู่แล้วในระบบ — เปลี่ยนเลขที่ หรือเปิดแก้ไขจากหน้าทะเบียนเอกสาร`);
        }
        const payload = { ...data };
        if (existing.exists()) {
            delete payload.status;     // status is managed from the record page
            delete payload.createdAt;
            await fb.setDoc(ref, payload, { merge: true });
        } else {
            await fb.setDoc(ref, payload);
        }
        editing = { col, docNo };      // further saves update this same document
        const noInput = document.getElementById('in-doc-no');
        if (noInput) noInput.readOnly = true;
    }

    /** Start a fresh document (clears edit mode and suggests a new number). */
    function resetEditing(type) {
        editing = null;
        const noInput = document.getElementById('in-doc-no');
        if (noInput) { noInput.readOnly = false; noInput.value = ''; }
        ensureDocNo(type);
    }

    function notice(text) {
        let bar = document.getElementById('kc-edit-notice');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'kc-edit-notice';
            bar.className = 'kc-edit-notice';
            const panel = document.querySelector('.form-panel') || document.body;
            panel.prepend(bar);
        }
        bar.textContent = text;
    }

    window.KCDoc = { applyEditData, ensureDocNo, save, resetEditing, isEditing: () => !!editing };
})();
