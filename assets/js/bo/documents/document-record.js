import { db, auth, onAuthStateChanged, collection, getDocs, doc, deleteDoc, getDoc, updateDoc, addDoc, serverTimestamp } from '../core/firebase-config.js';

let allDocs = [];
let currentFilter = 'all';
let searchText = '';
let issuerFilter = 'all';          // all | company | shop
let statusFilter = 'all';          // all | pending | paid | rejected
let finCategories = [];
let ledgerTarget = null;

const TYPE_INFO = {
    quotations:   { label: 'ใบเสนอราคา',     badge: 'badge-quote',       editor: 'quotation',   hash: '#quotation' },
    invoices:     { label: 'ใบแจ้งหนี้',      badge: 'badge-invoice',     editor: 'invoice',     hash: '#invoice' },
    receipts:     { label: 'ใบเสร็จ',         badge: 'badge-receipt',     editor: 'receipt',     hash: '#receipt' },
    deliveries:   { label: 'ใบส่งของ',        badge: 'badge-letter',      editor: 'delivery',    hash: '#delivery' },
    vouchers:     { label: 'เบิก/ซื้อ/จ้าง/PV', badge: 'badge-voucher',    editor: 'voucher',     hash: '#voucher' },
    certificates: { label: 'หนังสือรับรอง',    badge: 'badge-certificate', editor: 'certificate', hash: '#certificate' },
    letters:      { label: 'หนังสือภายนอก',   badge: 'badge-letter',      editor: 'letter',      hash: '#letter' },
    contracts:    { label: 'สัญญา/หนังสือเตือน', badge: 'badge-contract',    editor: 'contract',    hash: '#contract' }
};

// Sales documents that can be issued as the company or as the registered shop (ทะเบียนพาณิชย์)
const ISSUER_TYPES = new Set(['quotations', 'invoices', 'receipts', 'deliveries']);

const VOUCHER_SUBLABELS = {
    pr: 'ใบขอซื้อ/จ้าง (PR)',
    po: 'ใบสั่งซื้อ/จ้าง (PO)',
    exp: 'ใบขอเบิกเงิน (EXP)',
    pv: 'ใบสำคัญจ่าย (PV)'
};

const CERT_SUBLABELS = {
    employment: 'รับรองการทำงาน',
    internship: 'รับรองการฝึกงาน',
    award_training: 'ประกาศนียบัตรอบรม',
    award_speaker: 'เกียรติบัตรวิทยากร',
    award_competition: 'เกียรติบัตรรางวัล',
    award_participation: 'เกียรติบัตรเข้าร่วมงาน',
    award_partner: 'เกียรติบัตรพันธมิตร',
    award_intern_excellence: 'ประกาศนียบัตรฝึกงาน'
};

const CONTRACT_SUBLABELS = {
    service: 'สัญญาจ้างทำของ',
    revshare: 'จ้างทำของ (แบ่งรายได้)',
    employment: 'สัญญาจ้างแรงงาน',
    nda: 'สัญญารักษาความลับ',
    software: 'จ้างพัฒนาเว็บ/ซอฟต์แวร์',
    warning: 'หนังสือเตือนพนักงาน',
    breach: 'แจ้งเตือนผิดสัญญา',
    dismissal: 'หนังสือเลิกจ้าง',
    termination: 'บอกเลิกสัญญา',
    mutual_end: 'ข้อตกลงยกเลิกสัญญา',
    commission: 'ใบรับเงินค่าคอมมิชชั่น',
    wht50: 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)'
};

const LETTER_SUBLABELS = {
    invite_advisor: 'เชิญเป็นที่ปรึกษา',
    invite_speaker: 'เชิญเป็นวิทยากร',
    cooperation: 'ขอความร่วมมือ/เข้าพบ',
    authorization: 'หนังสือมอบอำนาจ',
    delivery: 'ส่งมอบงาน/เอกสาร',
    invite_event: 'เชิญเข้าร่วมงาน',
    request_reference: 'ขอหนังสือรับรองผลงาน',
    vendor_register: 'ขอขึ้นทะเบียนผู้ค้า',
    site_access: 'ขอเข้าปฏิบัติงาน',
    proposal: 'เสนอราคา/ข้อเสนอ',
    extension: 'ขอขยายระยะเวลา',
    clarification: 'ชี้แจงข้อเท็จจริง',
    ma_renewal: 'สิ้นสุดประกัน/เสนอ MA',
    termination: 'บอกเลิกสัญญา',
    billing: 'ขอเบิกเงินค่าจ้าง',
    payment_reminder: 'ติดตามการชำระเงิน',
    guarantee_return: 'ขอคืนหลักประกัน',
    notify_change: 'แจ้งเปลี่ยนแปลงข้อมูล',
    service_notice: 'แจ้งปิดปรับปรุงระบบ',
    thanks: 'หนังสือขอบคุณ',
    reply_speaker: 'ตอบรับเป็นวิทยากร',
    reply_advisor: 'ตอบรับเป็นที่ปรึกษา',
    reply_committee: 'ตอบรับเป็นกรรมการ',
    reply_attend: 'ตอบรับเข้าร่วมงาน',
    reply_cooperation: 'ตอบรับความอนุเคราะห์',
    decline: 'ปฏิเสธคำเชิญ'
};

// Allowed statuses per document type: [value, Thai label, badge style]
const STATUSES = {
    quotations:   [['Pending', 'รออนุมัติ', 'pending'], ['Approved', 'อนุมัติแล้ว', 'paid'], ['Rejected', 'ไม่อนุมัติ', 'rejected']],
    invoices:     [['Pending', 'รอชำระ', 'pending'], ['Paid', 'ชำระแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    receipts:     [['Completed', 'รับเงินแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    deliveries:   [['Pending', 'รอส่งมอบ', 'pending'], ['Delivered', 'ส่งมอบแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    vouchers:     [['Pending', 'รออนุมัติ', 'pending'], ['Approved', 'อนุมัติแล้ว', 'paid'], ['Paid', 'จ่ายเงินแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    certificates: [['Issued', 'ออกแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    letters:      [['Issued', 'ออกหนังสือแล้ว', 'paid'], ['Sent', 'ส่งแล้ว', 'paid'], ['Cancelled', 'ยกเลิก', 'rejected']],
    contracts:    [['Draft', 'ร่าง', 'pending'], ['Signed', 'ลงนาม/ออกแล้ว', 'paid'], ['Terminated', 'สิ้นสุด/ยกเลิก', 'rejected']]
};

// What "continue" creates next
const NEXT_STEP = {
    quotations: { label: 'ออกใบแจ้งหนี้', to: 'invoices', sourceType: 'quotation' },
    invoices:   { label: 'ออกใบเสร็จ',   to: 'receipts', sourceType: 'invoice' }
};

const VOUCHER_NEXT = {
    pr:  { label: 'ออกใบสั่งซื้อ (PO)', targetType: 'po' },
    po:  { label: 'ออกใบสำคัญจ่าย (PV)', targetType: 'pv' },
    exp: { label: 'ออกใบสำคัญจ่าย (PV)', targetType: 'pv' }
};

document.addEventListener('DOMContentLoaded', () => {
    window.switchTab = switchTab;
    window.createNewDocument = createNewDocument;
    window.deleteDocument = deleteDocument;
    window.printDocument = printDocument;
    window.editDocument = editDocument;
    window.continueDocument = continueDocument;
    window.changeStatus = changeStatus;
    window.openLedger = openLedger;
    window.closeLedger = closeLedger;
    window.confirmLedger = confirmLedger;

    const search = document.getElementById('doc-search');
    const issuerSel = document.getElementById('doc-issuer');
    if (issuerSel) issuerSel.addEventListener('change', () => { issuerFilter = issuerSel.value; renderDocuments(); });
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

    document.addEventListener('click', (e) => {
        const card = e.target.closest('[data-status]');
        if (card) { statusFilter = statusFilter === card.dataset.status ? 'all' : card.dataset.status; renderDocuments(); return; }
        if (e.target.closest('[data-reset]')) {
            statusFilter = 'all'; searchText = ''; if (search) search.value = '';
            renderDocuments();
        }
    });

    if (search) search.addEventListener('input', () => { searchText = search.value.trim().toLowerCase(); renderDocuments(); });

    // Firestore rules need a signed-in user — wait for the restored session.
    onAuthStateChanged(auth, (user) => {
        if (user) loadDocuments();
    });
});

let isAdminUser = false;

async function loadDocuments() {
    try {
        const me = await getDoc(doc(db, 'users', auth.currentUser.uid));
        isAdminUser = !!(me.exists() && me.data().role === 'admin');
    } catch (e) { /* non-admin or offline */ }
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
            if (colName !== 'contracts') failed.push(TYPE_INFO[colName].label);   // contracts are admin-only
        }
    }

    if (loaded.some(d => d.collectionName === 'contracts') || isAdminUser) {
        const tab = document.getElementById('tab-contracts');
        if (tab) tab.hidden = false;
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
    const labelEl = document.getElementById('btn-new-doc-label');
    if (labelEl) {
        const targetInfo = TYPE_INFO[tabId] || TYPE_INFO.quotations;
        labelEl.textContent = `สร้าง${targetInfo.label}`;
    }
    renderDocuments();
}

function createNewDocument() {
    const targetInfo = TYPE_INFO[currentFilter] || TYPE_INFO.quotations;
    goTo(targetInfo.hash, targetInfo.editor + '.html');
}

function statusInfo(d) {
    const list = STATUSES[d.collectionName] || [];
    const value = d.status || (list[0] && list[0][0]) || 'Pending';
    return list.find(s => s[0].toLowerCase() === String(value).toLowerCase()) || [value, value, 'pending'];
}

function renderStats(list) {
    const box = document.getElementById('doc-stats');
    if (!box) return;
    const by = (st) => list.filter(d => statusInfo(d)[2] === st);
    const live = list.filter(d => statusInfo(d)[2] !== 'rejected');
    const total = live.reduce((s, d) => s + (Number(d.amountTotal) || 0), 0);
    const card = (key, n, label, cls) => `<button type="button" class="doc-stat ${cls}${statusFilter === key ? ' active' : ''}" data-status="${key}"><b>${n}</b><span>${label}</span></button>`;
    box.innerHTML = card('all', list.length, 'ทั้งหมด', '')
        + card('pending', by('pending').length, 'รอดำเนินการ', 'is-pending')
        + card('paid', by('paid').length, 'เสร็จสมบูรณ์', 'is-paid')
        + card('rejected', by('rejected').length, 'ยกเลิก / ไม่อนุมัติ', 'is-rejected')
        + `<div class="doc-stat doc-stat-sum"><b>฿${formatMoney(total)}</b><span>มูลค่ารวม (ไม่นับที่ยกเลิก)</span></div>`;
}

function renderDocuments() {
    const tbody = document.getElementById('doc-tbody');
    if (!tbody) return;

    const inScope = allDocs.filter(d => {
        if (currentFilter !== 'all' && d.collectionName !== currentFilter) return false;
        if (issuerFilter !== 'all' && (!ISSUER_TYPES.has(d.collectionName) || (d.issuer || 'company') !== issuerFilter)) return false;
        if (!searchText) return true;
        const hay = [d.docNo, d.custName, d.personName, d.vendorName, d.requesterName, d.recipientTitle, d.recipientOrg, d.subject, d.projName].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(searchText);
    });
    renderStats(inScope);
    const filtered = inScope.filter(d => statusFilter === 'all' || statusInfo(d)[2] === statusFilter);

    const count = document.getElementById('doc-count');
    if (count) count.textContent = `${filtered.length} รายการ`;

    if (filtered.length === 0) {
        const none = allDocs.length
            ? 'ไม่พบเอกสารตามที่เลือก <button type="button" class="row-btn row-btn-text" data-reset="1">ล้างตัวกรอง</button>'
            : 'ยังไม่มีเอกสาร กดปุ่ม "สร้าง…" ด้านล่างเพื่อเริ่มต้น';
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${none}</div></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const info = TYPE_INFO[d.collectionName];
        const [statusValue, , statusStyle] = statusInfo(d);
        const options = (STATUSES[d.collectionName] || [])
            .map(([v, label]) => {
                const adminOnly = !isAdminUser && ['quotations', 'vouchers'].includes(d.collectionName) && ['Approved', 'Paid'].includes(v) && v !== statusValue;
                return `<option value="${v}"${v === statusValue ? ' selected' : ''}${adminOnly ? ' disabled' : ''}>${label}${adminOnly ? ' (แอดมิน)' : ''}</option>`;
            }).join('');
        const isZeroDoc = (d.collectionName === 'certificates' || d.collectionName === 'letters' || d.collectionName === 'deliveries') && !d.amountTotal;
        const amount = isZeroDoc
            ? '<span class="muted">—</span>'
            : `<strong>฿${formatMoney(d.amountTotal || 0)}</strong>`;
        const key = `data-col="${d.collectionName}" data-id="${escapeHTML(d.id)}"`;
        const next = d.collectionName === 'vouchers'
            ? VOUCHER_NEXT[d.voucherType]
            : NEXT_STEP[d.collectionName];

        let badgeLabel = info.label;
        if (d.collectionName === 'vouchers' && VOUCHER_SUBLABELS[d.voucherType]) {
            badgeLabel = VOUCHER_SUBLABELS[d.voucherType];
        } else if (d.collectionName === 'certificates' && CERT_SUBLABELS[d.certType]) {
            badgeLabel = CERT_SUBLABELS[d.certType];
        } else if (d.collectionName === 'letters' && LETTER_SUBLABELS[d.letterType]) {
            badgeLabel = LETTER_SUBLABELS[d.letterType];
        } else if (d.collectionName === 'contracts' && CONTRACT_SUBLABELS[d.contractType]) {
            badgeLabel = CONTRACT_SUBLABELS[d.contractType];
        }

        // Posting to the ledger records a paid entry — admin only (firestore.rules)
        const isCommission = d.collectionName === 'contracts' && d.contractType === 'commission';
        const canLedger = isAdminUser && (d.collectionName === 'receipts' || isCommission ||
            (d.collectionName === 'vouchers' && (d.voucherType === 'pv' || d.voucherType === 'exp')));
        const ledgerLabel = (d.collectionName === 'vouchers' || isCommission) ? 'ลงบัญชีรายจ่าย' : 'ลงบัญชีรายรับ';

        const actions = [
            `<button class="row-btn" data-action="print" ${key} title="ดู / พิมพ์"><i class="fas fa-print"></i></button>`,
            info.editor ? `<button class="row-btn" data-action="edit" ${key} title="แก้ไข"><i class="fas fa-pen"></i></button>` : '',
            next ? `<button class="row-btn row-btn-text" data-action="continue" ${key}>${next.label} <i class="fas fa-arrow-right"></i></button>` : '',
            canLedger
                ? (d.ledgerTxnId
                    ? `<span class="ledger-done" title="บันทึกบัญชีแล้ว"><i class="fas fa-check"></i> ลงบัญชีแล้ว</span>`
                    : `<button class="row-btn row-btn-text" data-action="ledger" ${key}>${ledgerLabel}</button>`)
                : '',
            `<button class="row-btn row-btn-danger" data-action="delete" ${key} title="ลบ"><i class="fas fa-trash"></i></button>`
        ].join('');

        const party = d.custName || d.vendorName || d.requesterName || d.personName || d.recipientOrg || '-';

        return `<tr>
            <td>${escapeHTML(d.docDate || '-')}</td>
            <td><strong>${escapeHTML(d.docNo || d.id)}</strong>${d.issuer === 'shop' ? ' <span class="badge badge-gray" title="ออกในนามทะเบียนพาณิชย์">พาณิชย์</span>' : ''}</td>
            <td><span class="badge ${info.badge}">${escapeHTML(badgeLabel)}</span></td>
            <td>${escapeHTML(party)}</td>
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
    if (colName === 'vouchers') {
        try {
            const d = await fetchFresh(colName, id);
            const vNext = VOUCHER_NEXT[d.voucherType];
            if (!vNext) return;
            localStorage.setItem('kc_convert_voucher', JSON.stringify({
                targetType: vNext.targetType,
                sourceDocNo: d.docNo || id,
                projName: d.projName || '',
                requesterName: d.requesterName || '',
                department: d.department || '',
                purpose: d.purpose || '',
                vendorName: d.vendorName || d.requesterName || '',
                vendorTax: d.vendorTax || '',
                vendorTel: d.vendorTel || '',
                vendorAddr: d.vendorAddr || '',
                payMethod: d.payMethod || '',
                bankName: d.bankName || '',
                bankAccount: d.bankAccount || '',
                bankOwner: d.bankOwner || '',
                discountAmount: Number(d.discountAmount) || 0,
                vatRate: Number(d.vatRate) || 0,
                whtRate: Number(d.whtRate) || 0,
                items: (d.items || []).map(it => ({ desc: it.desc, qty: it.qty, unit: it.unit || 'รายการ', price: it.price }))
            }));
            goTo('#voucher', 'voucher.html');
        } catch (e) {
            toast(e.message, false);
        }
        return;
    }

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
            issuer: d.issuer || 'company',
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
        const typeMap = {
            quotations: 'quotation',
            invoices: 'invoice',
            receipts: 'receipt',
            deliveries: 'delivery',
            vouchers: 'voucher',
            certificates: 'certificate',
            letters: 'letter',
            contracts: 'contract'
        };
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

// ── Receipt → income / Voucher → expense transaction ──────────
async function openLedger(colName, id) {
    const d = findDoc(colName, id);
    if (!d) return;
    ledgerTarget = d;
    const isExpense = colName === 'vouchers' || colName === 'contracts';
    const wantType = isExpense ? 2 : 1;

    if (!finCategories.length) {
        try {
            const snap = await getDocs(collection(db, 'fin_categories'));
            finCategories = snap.docs.map(s => s.data())
                .sort((a, b) => String(a.code).localeCompare(String(b.code)));
        } catch (e) {
            toast('โหลดหมวดบัญชีไม่สำเร็จ: ' + e.message, false);
            return;
        }
    }
    const matchingCats = finCategories.filter(c => Number(c.type) === wantType);
    if (!matchingCats.length) {
        toast(`ยังไม่มีหมวด${isExpense ? 'รายจ่าย' : 'รายรับ'} — เพิ่มที่หน้าบัญชีก่อน`, false);
        return;
    }

    const titleEl = document.getElementById('ledger-modal-title');
    const catLabelEl = document.getElementById('ledger-cat-label');
    const dateLabelEl = document.getElementById('ledger-date-label');
    const confirmBtn = document.getElementById('ledger-confirm');
    if (titleEl) titleEl.textContent = isExpense ? 'ลงบัญชีรายจ่าย' : 'ลงบัญชีรายรับ';
    if (catLabelEl) catLabelEl.textContent = isExpense ? 'หมวดรายจ่าย' : 'หมวดรายรับ';
    if (dateLabelEl) dateLabelEl.textContent = isExpense ? 'วันที่จ่ายเงิน' : 'วันที่รับเงิน';
    if (confirmBtn) confirmBtn.textContent = isExpense ? 'บันทึกรายจ่าย' : 'บันทึกรายรับ';

    document.getElementById('ledger-cat').innerHTML = matchingCats
        .map(c => `<option value="${escapeHTML(c.code)}">${escapeHTML(c.code)} · ${escapeHTML(c.name)}</option>`).join('');
    document.getElementById('ledger-doc').textContent = `${d.docNo || d.id} · ${d.custName || d.vendorName || d.requesterName || '-'}`;
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
    const isExpense = d.collectionName === 'vouchers' || d.collectionName === 'contracts';
    const amount = parseFloat(document.getElementById('ledger-amount').value);
    const date = document.getElementById('ledger-date').value;
    const catCode = document.getElementById('ledger-cat').value;
    if (!(amount > 0) || !date) { toast('กรอกจำนวนเงินและวันที่ให้ครบ', false); return; }

    const btn = document.getElementById('ledger-confirm');
    btn.disabled = true;
    try {
        const party = d.custName || d.vendorName || d.requesterName || '';
        const prefixDesc = isExpense
            ? `จ่ายเงินตามเอกสาร ${d.docNo || d.id}`
            : `รับเงินตามใบเสร็จ ${d.docNo || d.id}`;
        const ref = await addDoc(collection(db, 'fin_transactions'), {
            date, catCode, amount,
            desc: `${prefixDesc}${party ? ' — ' + party : ''}`.slice(0, 500),
            ref: d.docNo || d.id,
            contact: party,
            payment_status: 2,
            paid_date: date,
            created_at: serverTimestamp()
        });
        await updateDoc(doc(db, d.collectionName, d.id), { ledgerTxnId: ref.id });
        d.ledgerTxnId = ref.id;
        closeLedger();
        renderDocuments();
        toast(isExpense ? 'ลงบัญชีรายจ่ายแล้ว' : 'ลงบัญชีรายรับแล้ว');
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
