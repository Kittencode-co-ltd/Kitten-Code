import { db, auth, onAuthStateChanged, collection, getDocs, doc, deleteDoc, getDoc, updateDoc, addDoc, serverTimestamp } from '../core/firebase-config.js';

let allDocs = [];
let currentFilter = 'all';
let searchText = '';
let incomeCategories = [];
let ledgerTarget = null;

const TYPE_INFO = {
    quotations:   { label: 'ใบเสนอราคา', badge: 'badge-quote',       editor: 'quotation', hash: '#quotation' },
    invoices:     { label: 'ใบแจ้งหนี้',  badge: 'badge-invoice',     editor: 'invoice',   hash: '#invoice' },
    receipts:     { label: 'ใบเสร็จ',     badge: 'badge-receipt',     editor: 'receipt',   hash: '#receipt' },
    certificates: { label: 'หนังสือรับรอง', badge: 'badge-certificate', editor: null,        hash: '#certificate' }
};

// Allowed statuses per document type: [value, Thai label, badge style]
const STATUSES = {
    quotations:   [['Pending', 'รออนุมัติ', 'pending'], ['Approved', 'อนุมัติแล้ว', 'paid'], ['Rejected', 'ไม่อนุมัติ', 'rejected']],
    invoices:     [['Pending', 'รอชำระ', 'pending'], ['Paid', 'ชำระแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    receipts:     [['Completed', 'รับเงินแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    certificates: [['Issued', 'ออกแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']]
};

// What "continue" creates next
const NEXT_STEP = {
    quotations: { label: 'ออกใบแจ้งหนี้', to: 'invoices', sourceType: 'quotation' },
    invoices:   { label: 'ออกใบเสร็จ',   to: 'receipts', sourceType: 'invoice' }
};

document.addEventListener('DOMContentLoaded', () => {
    window.switchTab = switchTab;
    window.deleteDocument = deleteDocument;
    window.printDocument = printDocument;
    window.editDocument = editDocument;
    window.continueDocument = continueDocument;
    window.changeStatus = changeStatus;
    window.openLedger = openLedger;
    window.closeLedger = closeLedger;
    window.confirmLedger = confirmLedger;

    const search = document.getElementById('doc-search');
    const tbody = document.getElementById('doc-tbody');
    const actions = { print: printDocument, edit: editDocument, continue: continueDocument, ledger: openLedger, delete: deleteDocument };
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (btn) actions[btn.dataset.action](btn.dataset.col, btn.dataset.id);
    });
    tbody.addEventListener('change', (e) => {
        const sel = e.target.closest('select.status-select');
        if (sel) changeStatus(sel.dataset.col, sel.dataset.id, sel);
    });

    if (search) search.addEventListener('input', () => { searchText = search.value.trim().toLowerCase(); renderDocuments(); });

    // Firestore rules need a signed-in user — wait for the restored session.
    onAuthStateChanged(auth, (user) => {
        if (user) loadDocuments();
    });
});

async function loadDocuments() {
    const tbody = document.getElementById('doc-tbody');
    if (!tbody) return;
    const loaded = [];
    const failed = [];

    for (const colName of Object.keys(TYPE_INFO)) {
        try {
            const snap = await getDocs(collection(db, colName));
            snap.forEach(s => {
                const data = decodeLegacyEntities(s.data());
                data.id = s.id;
                data.collectionName = colName;
                loaded.push(data);
            });
        } catch (err) {
            console.warn(`Could not load ${colName}:`, err);
            failed.push(TYPE_INFO[colName].label);
        }
    }

    loaded.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
    allDocs = loaded;
    renderDocuments();
    if (failed.length) toast(`โหลดไม่ได้: ${failed.join(', ')}`, false);
}

function sortKey(d) {
    if (d.docDate) return d.docDate;
    if (d.createdAt && d.createdAt.toDate) return d.createdAt.toDate().toISOString().slice(0, 10);
    return '';
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.tabs .tab').forEach(b => b.classList.toggle('active', b === btn));
    currentFilter = tabId;
    renderDocuments();
}

function statusInfo(d) {
    const list = STATUSES[d.collectionName] || [];
    const value = d.status || (list[0] && list[0][0]) || 'Pending';
    return list.find(s => s[0].toLowerCase() === String(value).toLowerCase()) || [value, value, 'pending'];
}

function renderDocuments() {
    const tbody = document.getElementById('doc-tbody');
    if (!tbody) return;

    const filtered = allDocs.filter(d => {
        if (currentFilter !== 'all' && d.collectionName !== currentFilter) return false;
        if (!searchText) return true;
        const hay = [d.docNo, d.custName, d.personName, d.projName].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(searchText);
    });

    const count = document.getElementById('doc-count');
    if (count) count.textContent = `${filtered.length} รายการ`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${allDocs.length ? 'ไม่พบเอกสารที่ค้นหา' : 'ยังไม่มีเอกสาร'}</div></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const info = TYPE_INFO[d.collectionName];
        const [statusValue, , statusStyle] = statusInfo(d);
        const options = (STATUSES[d.collectionName] || [])
            .map(([v, label]) => `<option value="${v}"${v === statusValue ? ' selected' : ''}>${label}</option>`).join('');
        const amount = (d.collectionName === 'certificates' && !d.amountTotal)
            ? '<span class="muted">—</span>'
            : `<strong>฿${formatMoney(d.amountTotal || 0)}</strong>`;
        const key = `data-col="${d.collectionName}" data-id="${escapeHTML(d.id)}"`;
        const next = NEXT_STEP[d.collectionName];

        const actions = [
            `<button class="row-btn" data-action="print" ${key} title="ดู / พิมพ์"><i class="fas fa-print"></i></button>`,
            info.editor ? `<button class="row-btn" data-action="edit" ${key} title="แก้ไข"><i class="fas fa-pen"></i></button>` : '',
            next ? `<button class="row-btn row-btn-text" data-action="continue" ${key}>${next.label} <i class="fas fa-arrow-right"></i></button>` : '',
            d.collectionName === 'receipts'
                ? (d.ledgerTxnId
                    ? `<span class="ledger-done" title="ลงบัญชีรายรับแล้ว"><i class="fas fa-check"></i> ลงบัญชีแล้ว</span>`
                    : `<button class="row-btn row-btn-text" data-action="ledger" ${key}>ลงบัญชีรายรับ</button>`)
                : '',
            `<button class="row-btn row-btn-danger" data-action="delete" ${key} title="ลบ"><i class="fas fa-trash"></i></button>`
        ].join('');

        return `<tr>
            <td>${escapeHTML(d.docDate || '-')}</td>
            <td><strong>${escapeHTML(d.docNo || d.id)}</strong></td>
            <td><span class="badge ${info.badge}">${info.label}</span></td>
            <td>${escapeHTML(d.custName || d.personName || '-')}</td>
            <td style="text-align:right;">${amount}</td>
            <td><select class="status-select status-${statusStyle}" ${key}>${options}</select></td>
            <td><div class="row-actions">${actions}</div></td>
        </tr>`;
    }).join('');
}

function findDoc(colName, id) {
    return allDocs.find(d => d.collectionName === colName && d.id === id);
}

async function changeStatus(colName, id, select) {
    const d = findDoc(colName, id);
    const prev = d ? d.status : null;
    try {
        await updateDoc(doc(db, colName, id), { status: select.value, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
        if (d) d.status = select.value;
        renderDocuments();
        toast('อัปเดตสถานะแล้ว');
    } catch (e) {
        console.error('Status update failed', e);
        if (d) d.status = prev;
        renderDocuments();
        toast('อัปเดตสถานะไม่สำเร็จ: ' + e.message, false);
    }
}

// Open a page of the back office: switch the hub menu when inside its iframe.
function goTo(hash, file) {
    if (window.parent !== window && window.parent.location.pathname.endsWith('back-office.html')) {
        window.parent.location.hash = hash;
    } else {
        window.location.href = file;
    }
}

async function fetchFresh(colName, id) {
    const snap = await getDoc(doc(db, colName, id));
    if (!snap.exists()) throw new Error('ไม่พบเอกสารนี้ในระบบ');
    return decodeLegacyEntities(snap.data());
}

async function editDocument(colName, id) {
    try {
        const data = await fetchFresh(colName, id);
        if (!data.docNo) data.docNo = id;
        localStorage.setItem('kc_edit_doc', JSON.stringify({ col: colName, data }));
        goTo(TYPE_INFO[colName].hash, TYPE_INFO[colName].editor + '.html');
    } catch (e) {
        toast(e.message, false);
    }
}

async function continueDocument(colName, id) {
    const next = NEXT_STEP[colName];
    if (!next) return;
    try {
        const d = await fetchFresh(colName, id);
        const payload = {
            sourceType: next.sourceType,
            sourceDocNo: d.docNo || id,
            custName: d.custName || '',
            custAddr: d.custAddr || '',
            custTel: d.custTel || '',
            custTax: d.custTax || '',
            projName: d.projName || '',
            projContact: d.projContact || '',
            discount: Number(d.discountAmount) || 0,
            vatRate: d.vatRate ?? 7,
            items: (d.items || []).map(it => ({ desc: it.desc, qty: it.qty, price: it.price }))
        };
        localStorage.setItem('kc_convert_data', JSON.stringify(payload));
        const target = TYPE_INFO[next.to];
        goTo(target.hash, target.editor + '.html');
    } catch (e) {
        toast(e.message, false);
    }
}

async function printDocument(colName, id) {
    try {
        const data = await fetchFresh(colName, id);
        const typeMap = { quotations: 'quotation', invoices: 'invoice', receipts: 'receipt', certificates: 'certificate' };
        localStorage.setItem('kc_view_doc', JSON.stringify({ type: typeMap[colName] || colName, data: { ...data } }));
        window.location.href = 'document-viewer.html';
    } catch (e) {
        console.error('Error loading document for view:', e);
        toast('เปิดเอกสารไม่สำเร็จ: ' + e.message, false);
    }
}

async function deleteDocument(colName, id) {
    const d = findDoc(colName, id);
    if (!confirm(`ลบ ${TYPE_INFO[colName].label} ${d ? (d.docNo || id) : id} ?\nลบแล้วกู้คืนไม่ได้`)) return;
    try {
        await deleteDoc(doc(db, colName, id));
        allDocs = allDocs.filter(x => !(x.id === id && x.collectionName === colName));
        renderDocuments();
        toast('ลบเอกสารแล้ว');
    } catch (e) {
        console.error('Error deleting document:', e);
        toast(e.code === 'permission-denied' ? 'ลบเอกสารได้เฉพาะแอดมิน' : 'ลบไม่สำเร็จ: ' + e.message, false);
    }
}

// ── Receipt → income transaction ──────────────────────────────
async function openLedger(colName, id) {
    const d = findDoc(colName, id);
    if (!d) return;
    ledgerTarget = d;
    if (!incomeCategories.length) {
        try {
            const snap = await getDocs(collection(db, 'fin_categories'));
            incomeCategories = snap.docs.map(s => s.data()).filter(c => c.type === 1)
                .sort((a, b) => String(a.code).localeCompare(String(b.code)));
        } catch (e) {
            toast('โหลดหมวดรายรับไม่สำเร็จ: ' + e.message, false);
            return;
        }
    }
    if (!incomeCategories.length) {
        toast('ยังไม่มีหมวดรายรับ — เพิ่มที่หน้าบัญชีก่อน', false);
        return;
    }
    document.getElementById('ledger-cat').innerHTML = incomeCategories
        .map(c => `<option value="${escapeHTML(c.code)}">${escapeHTML(c.code)} · ${escapeHTML(c.name)}</option>`).join('');
    document.getElementById('ledger-doc').textContent = `${d.docNo || d.id} · ${d.custName || '-'}`;
    document.getElementById('ledger-amount').value = Number(d.amountTotal || 0).toFixed(2);
    document.getElementById('ledger-date').value = d.docDate || new Date().toISOString().slice(0, 10);
    document.getElementById('ledger-modal').classList.add('open');
}

function closeLedger() {
    document.getElementById('ledger-modal').classList.remove('open');
    ledgerTarget = null;
}

async function confirmLedger() {
    const d = ledgerTarget;
    if (!d) return;
    const amount = parseFloat(document.getElementById('ledger-amount').value);
    const date = document.getElementById('ledger-date').value;
    const catCode = document.getElementById('ledger-cat').value;
    if (!(amount > 0) || !date) { toast('กรอกจำนวนเงินและวันที่ให้ครบ', false); return; }

    const btn = document.getElementById('ledger-confirm');
    btn.disabled = true;
    try {
        const ref = await addDoc(collection(db, 'fin_transactions'), {
            date, catCode, amount,
            desc: `รับเงินตามใบเสร็จ ${d.docNo || d.id}${d.custName ? ' — ' + d.custName : ''}`.slice(0, 500),
            ref: d.docNo || d.id,
            contact: d.custName || '',
            payment_status: 2,
            paid_date: date,
            created_at: serverTimestamp()
        });
        await updateDoc(doc(db, 'receipts', d.id), { ledgerTxnId: ref.id });
        d.ledgerTxnId = ref.id;
        closeLedger();
        renderDocuments();
        toast('ลงบัญชีรายรับแล้ว');
    } catch (e) {
        console.error('Ledger post failed', e);
        toast('ลงบัญชีไม่สำเร็จ: ' + e.message, false);
    } finally {
        btn.disabled = false;
    }
}

// ── Helpers ───────────────────────────────────────────────────
// Legacy records were HTML-escaped before being saved; decode them once so
// render-time escapeHTML does not double-encode (e.g. "&amp;amp;").
function decodeLegacyEntities(val) {
    if (typeof val === 'string') {
        return val.replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]));
    }
    if (Array.isArray(val)) return val.map(decodeLegacyEntities);
    if (val && typeof val === 'object' && val.constructor === Object) {
        const out = {};
        for (const k in val) out[k] = decodeLegacyEntities(val[k]);
        return out;
    }
    return val;
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
}

function formatMoney(amount) {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toast(msg, ok = true) {
    const t = document.getElementById('doc-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'kc-toast show' + (ok ? '' : ' error');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.className = 'kc-toast'; }, 3200);
}
