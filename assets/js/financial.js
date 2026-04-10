// ============================================================
//  financial.js — Kitten Code Financial Module
//  Firebase Firestore + Real-time onSnapshot
//  Config: reads window.__ENV__ (injected by GitHub Actions)
//          falls back to local dev constants if not present
// ============================================================
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// ── Config: GitHub Actions injects window.__ENV__ at build time. ───
// For local development the hardcoded values below act as fallback.
// NEVER remove the fallback block — it makes local dev zero-config.
const __ENV__ = (typeof window !== 'undefined' && window.__ENV__) || {};

const firebaseConfig = {
    apiKey:            __ENV__.FIREBASE_API_KEY            || 'AIzaSyC6H2iwP7VKaFX5rOzOGJDFBY6ayR1mpTc',
    authDomain:        __ENV__.FIREBASE_AUTH_DOMAIN        || 'kitten-code.firebaseapp.com',
    projectId:         __ENV__.FIREBASE_PROJECT_ID         || 'kitten-code',
    storageBucket:     __ENV__.FIREBASE_STORAGE_BUCKET     || 'kitten-code.firebasestorage.app',
    messagingSenderId: __ENV__.FIREBASE_MESSAGING_SENDER_ID|| '309423062731',
    appId:             __ENV__.FIREBASE_APP_ID             || '1:309423062731:web:19a94778a32f87a8f3654e'
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

const CATS_COL   = 'fin_categories';
const TXNS_COL   = 'fin_transactions';

// ── In-memory cache (filled by onSnapshot) ──────────────────
let _categories   = [];
let _transactions  = [];
let _isLoading    = true;  // skeleton state flag

// ── Skeleton Helpers ────────────────────────────────────────
function showSkeleton(containerId, rows = 3, cols = 4) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const skRow = `<tr>${Array.from({ length: cols }, () =>
        `<td><div class="skeleton" style="height:16px;border-radius:4px;"></div></td>`
    ).join('')}</tr>`;
    el.innerHTML = Array(rows).fill(skRow).join('');
}

function showMetricSkeleton() {
    document.querySelectorAll('.metric-value').forEach(el =>
        el.innerHTML = '<div class="skeleton" style="width:120px;height:32px;border-radius:6px;"></div>'
    );
}

// ── Helpers ──────────────────────────────────────────────────
function fmt(n)    { return '฿' + Math.round(n).toLocaleString('th-TH'); }
function fmtNum(n) { return Math.round(n).toLocaleString('th-TH'); }

function getCatByCode(code) { return _categories.find(c => c.code === code); }

// ── Quota Period Helpers ─────────────────────────────────────

/**
 * Calculates the end date of the current quota period for a category.
 * Returns null if no quota is defined.
 * @param {string} lastResetDate  ISO date string of last reset
 * @param {number} quotaValue     Number of units
 * @param {string} quotaUnit      'days' | 'months' | 'years'
 * @returns {Date|null}
 */
function calcQuotaEnd(lastResetDate, quotaValue, quotaUnit) {
    if (!lastResetDate || !quotaValue || !quotaUnit) return null;
    const start = new Date(lastResetDate);
    const end   = new Date(start);
    if (quotaUnit === 'days')   end.setDate(end.getDate() + quotaValue);
    if (quotaUnit === 'months') end.setMonth(end.getMonth() + quotaValue);
    if (quotaUnit === 'years')  end.setFullYear(end.getFullYear() + quotaValue);
    return end;
}

/**
 * Returns true if a transaction date falls within the category's current quota window.
 * If the category has no quota defined, always returns true (no filtering).
 */
function isWithinCurrentQuota(txnDate, cat) {
    if (!cat.quota_unit || !cat.quota_value || !cat.last_reset_date) return true;
    const start = new Date(cat.last_reset_date);
    const end   = calcQuotaEnd(cat.last_reset_date, cat.quota_value, cat.quota_unit);
    const txn   = new Date(txnDate);
    return txn >= start && txn <= end;
}

function getUsed(catCode) {
    const cat = getCatByCode(catCode);
    return _transactions
        .filter(t => t.catCode === catCode && t.payment_status === 2 && isWithinCurrentQuota(t.date, cat || {}))
        .reduce((s, t) => s + t.amount, 0);
}

function getPending(catCode) {
    const cat = getCatByCode(catCode);
    return _transactions
        .filter(t => t.catCode === catCode && t.payment_status === 1 && isWithinCurrentQuota(t.date, cat || {}))
        .reduce((s, t) => s + t.amount, 0);
}

function statusBadge(status) {
    if (status === 2) return '<span class="badge badge-paid">จ่ายแล้ว</span>';
    if (status === 1) return '<span class="badge badge-pending">รอจ่าย</span>';
    return '<span class="badge badge-rejected">ปฏิเสธ</span>';
}

// ── Tab Switching ─────────────────────────────────────────────
function switchTab(t) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + t).classList.add('active');
    const tabs = ['dashboard', 'register', 'transactions', 'add'];
    const idx = tabs.indexOf(t);
    if (idx >= 0) document.querySelectorAll('.tab')[idx].classList.add('active');
    if (t === 'add') renderAddForm();
}
window.switchTab = switchTab;

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard() {
    const incTxns = _transactions.filter(t => getCatByCode(t.catCode)?.type === 1 && t.payment_status === 2);
    const expTxns = _transactions.filter(t => getCatByCode(t.catCode)?.type === 2 && t.payment_status === 2);
    const pendTxns = _transactions.filter(t => getCatByCode(t.catCode)?.type === 2 && t.payment_status === 1);

    const inc  = incTxns.reduce((s, t) => s + t.amount, 0);
    const exp  = expTxns.reduce((s, t) => s + t.amount, 0);
    const pend = pendTxns.reduce((s, t) => s + t.amount, 0);

    document.getElementById('total-inc').textContent     = fmt(inc);
    document.getElementById('total-exp').textContent     = fmt(exp);
    document.getElementById('total-bal').textContent     = fmt(inc - exp);
    document.getElementById('total-pending').textContent = fmt(pend);

    // Budget overview
    const budgetEl = document.getElementById('budget-overview');
    const expCats  = _categories.filter(c => c.type === 2 && c.budget > 0);
    if (!expCats.length) {
        budgetEl.innerHTML = '<div class="empty-state">ยังไม่มีหมวดรายจ่ายที่ตั้งงบ</div>';
    } else {
        budgetEl.innerHTML = expCats.map(c => {
            const used       = getUsed(c.code);
            const pendingAmt = getPending(c.code);
            const pct        = Math.min(100, Math.round((used / c.budget) * 100));
            const fillClass  = pct >= 90 ? 'fill-over' : pct >= 70 ? 'fill-warn' : 'fill-ok';
            const pendNote   = pendingAmt > 0
                ? `<span style="font-size:11px;color:var(--color-warn);"> + ${fmt(pendingAmt)} รอจ่าย</span>`
                : '';
            return `<div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
            <span style="font-size:13px;">${c.name}</span>
            <span style="font-size:12px;color:var(--text-secondary);">${fmtNum(used)} / ${fmtNum(c.budget)} บาท${pendNote}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
          <div class="pct">จ่ายแล้ว ${pct}% — คงเหลือ ${fmt(c.budget - used)}</div>
        </div>`;
        }).join('');
    }

    // Recent transactions (last 5)
    const recentEl = document.getElementById('recent-txns');
    const recent = [..._transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    if (!recent.length) {
        recentEl.innerHTML = '<div class="empty-state">ยังไม่มีรายการ</div>';
        return;
    }
    recentEl.innerHTML = `<table class="txn-table"><thead><tr><th>วันที่</th><th>รายการ</th><th style="text-align:center;">สถานะ</th><th style="text-align:right;">จำนวน</th></tr></thead><tbody>` +
        recent.map(t => {
            const cat  = getCatByCode(t.catCode);
            const cls  = cat?.type === 1 ? 'amount-inc' : 'amount-exp';
            const sign = cat?.type === 1 ? '+'           : '-';
            return `<tr>
          <td style="color:var(--text-secondary);font-size:12px;">${t.date}</td>
          <td>${t.desc}<br><span class="tag-code">${cat?.code || ''}</span></td>
          <td style="text-align:center;">${statusBadge(t.payment_status)}</td>
          <td style="text-align:right;" class="${cls}">${sign}${fmt(t.amount)}</td>
        </tr>`;
        }).join('') + '</tbody></table>';
}

// ── Register Table ────────────────────────────────────────────
function renderRegister() {
    const tbody = document.getElementById('cat-tbody');
    if (!_categories.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">ยังไม่มีหมวดหมู่</td></tr>';
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tbody.innerHTML = _categories.map(c => {
        const used      = getUsed(c.code);
        const remaining = c.budget > 0 ? c.budget - used : null;
        const pct       = c.budget > 0 ? Math.min(100, Math.round((used / c.budget) * 100)) : null;
        const fillClass = pct >= 90 ? 'fill-over' : pct >= 70 ? 'fill-warn' : 'fill-ok';

        // ── Quota cell ───────────────────────────────────────
        let quotaCell = '<span style="color:var(--text-tertiary);font-size:11px;">—</span>';
        if (c.quota_unit && c.quota_value && c.last_reset_date) {
            const endDate   = calcQuotaEnd(c.last_reset_date, c.quota_value, c.quota_unit);
            const isExpired = endDate < today;
            const endStr    = endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
            const unitLabel = c.quota_unit === 'days' ? 'วัน' : c.quota_unit === 'months' ? 'เดือน' : 'ปี';

            quotaCell = `
              <div style="line-height:1.6;">
                <span class="quota-period-tag">${c.quota_value} ${unitLabel}</span>
                <div style="font-size:11px;margin-top:4px;color:${isExpired ? 'var(--color-exp)' : 'var(--text-secondary)'}">
                  ${isExpired
                    ? '<span style="color:var(--color-exp);font-weight:600;">หมดอายุแล้ว</span>'
                    : `สิ้นสุด: <span style="color:var(--accent-primary);">${endStr}</span>`}
                </div>
                ${isExpired
                  ? `<button class="btn-reset-quota" onclick="resetQuota('${c.id}')">↺ รีเซ็ตงวด</button>`
                  : ''}
              </div>`;
        }

        return `<tr>
        <td><span class="tag-code">${c.code}</span></td>
        <td>${c.name}</td>
        <td><span class="badge ${c.type === 1 ? 'badge-inc' : 'badge-exp'}">${c.type === 1 ? 'รายรับ' : 'รายจ่าย'}</span></td>
        <td style="text-align:right;">${c.budget > 0 ? fmtNum(c.budget) : '<span style="color:var(--text-tertiary);font-size:11px;">ไม่จำกัด</span>'}</td>
        <td style="text-align:right;color:#993C1D;font-weight:500;">${fmtNum(used)}</td>
        <td style="text-align:right;">${remaining !== null
            ? `<span style="color:${remaining < 0 ? '#D85A30' : '#0F6E56'};font-weight:500;">${fmtNum(remaining)}</span>
               ${pct !== null ? `<div class="progress-bar" style="margin-top:4px;"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>` : ''}`
            : '<span style="color:var(--text-tertiary);font-size:11px;">-</span>'}</td>
        <td>${quotaCell}</td>
        <td><button class="action-btn" onclick="deleteCategory('${c.id}')">ลบ</button></td>
      </tr>`;
    }).join('');
}

// ── Transactions Table ────────────────────────────────────────
function renderTxns() {
    const ft = document.getElementById('filter-type')?.value || '';
    const fm = document.getElementById('filter-month')?.value || '';
    let txns = [..._transactions];
    if (ft) txns = txns.filter(t => String(getCatByCode(t.catCode)?.type) === ft);
    if (fm) txns = txns.filter(t => t.date.startsWith(fm));
    txns.sort((a, b) => b.date.localeCompare(a.date));

    const tbody = document.getElementById('txn-tbody');
    if (!txns.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-state">ไม่พบรายการ</td></tr>'; return; }
    tbody.innerHTML = txns.map(t => {
        const cat  = getCatByCode(t.catCode);
        const cls  = cat?.type === 1 ? 'amount-inc' : 'amount-exp';
        const sign = cat?.type === 1 ? '+' : '-';

        const actionBtns = t.payment_status === 1
            ? `<div style="display:flex;gap:6px;justify-content:center;">
                <button class="btn-txn-action btn-mark-paid" onclick="updateDisbursementStatus('${t.id}', 2, '')" title="ยืนยันการจ่ายเงิน">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verify Payment
                </button>
                <button class="btn-txn-action btn-mark-rejected" onclick="updateDisbursementStatus('${t.id}', 0, '')" title="ปฏิเสธรายการนี้">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  ปฏิเสธ
                </button>
               </div>`
            : '';

        return `<tr>
        <td style="font-size:12px;color:var(--text-secondary);">${t.date}</td>
        <td>${t.desc}</td>
        <td><span class="tag-code">${cat?.code || ''}</span></td>
        <td style="font-size:12px;color:var(--text-secondary);">${t.ref || '-'}</td>
        <td style="font-size:12px;color:var(--text-secondary);">${t.contact || '-'}</td>
        <td style="text-align:center;">${statusBadge(t.payment_status)}</td>
        <td style="font-size:12px;color:var(--text-secondary);">${t.paid_date || '-'}</td>
        <td style="text-align:right;" class="${cls}">${sign}${fmt(t.amount)}</td>
        <td style="text-align:center;min-width:160px;">${actionBtns}</td>
      </tr>`;
    }).join('');
}

// ── Add Transaction Form ──────────────────────────────────────
function renderAddForm() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('txn-date').value = today;
    const sel = document.getElementById('txn-cat');
    sel.innerHTML = _categories.map(c => `<option value="${c.code}">[${c.type === 1 ? 'รายรับ' : 'รายจ่าย'}] ${c.name}</option>`).join('');
    const statusSel = document.getElementById('txn-status');
    if (statusSel) statusSel.value = '1';
    const paidDate = document.getElementById('txn-paid-date');
    if (paidDate) paidDate.value = '';
}

// ── CRUD: Categories ──────────────────────────────────────────
window.showAddCategory = function () {
    document.getElementById('add-cat-form').style.display = 'block';
    // Watch quota unit to show/hide last_reset_date
    const unitSel = document.getElementById('cat-quota-unit');
    const resetGroup = document.getElementById('cat-reset-date-group');
    unitSel.onchange = () => {
        const hasQuota = unitSel.value !== '';
        resetGroup.style.display = hasQuota ? 'block' : 'none';
        if (hasQuota && !document.getElementById('cat-reset-date').value) {
            document.getElementById('cat-reset-date').value = new Date().toISOString().slice(0, 10);
        }
    };
};

window.addCategory = async function () {
    const code        = document.getElementById('cat-code').value.trim();
    const name        = document.getElementById('cat-name').value.trim();
    const type        = parseInt(document.getElementById('cat-type').value);
    const budget      = parseFloat(document.getElementById('cat-budget').value) || 0;
    const quotaVal    = parseInt(document.getElementById('cat-quota-value').value) || null;
    const quotaUnit   = document.getElementById('cat-quota-unit').value || null;
    const resetDate   = document.getElementById('cat-reset-date').value || null;

    if (!code || !name) { alert('กรุณากรอกรหัสและชื่อหมวดหมู่'); return; }
    if (quotaUnit && (!quotaVal || quotaVal < 1)) { alert('กรุณาระบุจำนวนงวดโครตาให้ถูกต้อง'); return; }

    const data = {
        code, name, type, budget,
        created_at:      serverTimestamp(),
        quota_value:     quotaUnit ? quotaVal  : null,
        quota_unit:      quotaUnit || null,
        last_reset_date: quotaUnit ? (resetDate || new Date().toISOString().slice(0, 10)) : null
    };

    try {
        await addDoc(collection(db, CATS_COL), data);
        document.getElementById('add-cat-form').style.display = 'none';
        ['cat-code', 'cat-name', 'cat-budget', 'cat-quota-value'].forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('cat-quota-unit').value = '';
        document.getElementById('cat-reset-date-group').style.display = 'none';
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message); }
};

// Reset quota: update last_reset_date to today for a category
window.resetQuota = async function (catId) {
    const today = new Date().toISOString().slice(0, 10);
    try {
        await updateDoc(doc(db, CATS_COL, catId), { last_reset_date: today, updated_at: serverTimestamp() });
    } catch (e) { alert('รีเซ็ตงวดไม่สำเร็จ: ' + e.message); }
};

window.deleteCategory = async function (id) {
    const cat  = _categories.find(c => c.id === id);
    const inUse = _transactions.some(t => t.catCode === cat?.code);
    if (inUse) { alert('ไม่สามารถลบได้ มีรายการที่ใช้งานหมวดนี้อยู่'); return; }
    try {
        await deleteDoc(doc(db, CATS_COL, id));
    } catch (e) { alert('เกิดข้อผิดพลาด: ' + e.message); }
};

// ── CRUD: Transactions ────────────────────────────────────────
window.addTransaction = async function () {
    const date           = document.getElementById('txn-date').value;
    const catCode        = document.getElementById('txn-cat').value;
    const desc           = document.getElementById('txn-desc').value.trim();
    const amount         = parseFloat(document.getElementById('txn-amount').value);
    const ref            = document.getElementById('txn-ref').value.trim();
    const contact        = document.getElementById('txn-contact').value.trim();
    const payment_status = parseInt(document.getElementById('txn-status')?.value ?? '1');
    const paid_date      = document.getElementById('txn-paid-date')?.value ?? '';

    const msgEl = document.getElementById('add-msg');
    if (!date || !desc || !amount || !catCode) {
        msgEl.innerHTML = '<span style="color:#D85A30;">กรุณากรอกข้อมูลให้ครบถ้วน</span>';
        return;
    }
    try {
        await addDoc(collection(db, TXNS_COL), {
            date, catCode, desc, amount, ref, contact,
            payment_status, paid_date,
            created_at: serverTimestamp()
        });
        msgEl.innerHTML = '<span style="color:#0F6E56;">บันทึกรายการสำเร็จ!</span>';
        ['txn-desc', 'txn-amount', 'txn-ref', 'txn-contact'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (document.getElementById('txn-status')) document.getElementById('txn-status').value = '1';
        if (document.getElementById('txn-paid-date')) document.getElementById('txn-paid-date').value = '';
        setTimeout(() => { msgEl.innerHTML = ''; }, 3000);
    } catch (e) {
        msgEl.innerHTML = `<span style="color:#D85A30;">เกิดข้อผิดพลาด: ${e.message}</span>`;
    }
};

// ── Disbursement Status Update ────────────────────────────────
window.updateDisbursementStatus = async function (txnId, newStatus, paidDate) {
    const today = new Date().toISOString().slice(0, 10);
    const updateData = {
        payment_status: newStatus,
        paid_date: newStatus === 2 ? (paidDate || today) : '',
        updated_at: serverTimestamp()
    };
    try {
        await updateDoc(doc(db, TXNS_COL, txnId), updateData);
        // onSnapshot will auto-refresh all views
    } catch (e) {
        alert('อัปเดตสถานะไม่สำเร็จ: ' + e.message);
    }
};

// ── Real-time Listeners ───────────────────────────────────────
function initRealtimeListeners() {
    // Categories listener
    onSnapshot(
        query(collection(db, CATS_COL), orderBy('created_at', 'asc')),
        snapshot => {
            _categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            renderDashboard();
            renderRegister();
            renderTxns();
            renderAddForm();
        },
        err => console.error('Categories listener error:', err)
    );

    // Transactions listener
    onSnapshot(
        query(collection(db, TXNS_COL), orderBy('created_at', 'asc')),
        snapshot => {
            _transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            renderDashboard();
            renderRegister();
            renderTxns();
        },
        err => console.error('Transactions listener error:', err)
    );
}

// ── Filter change handler ─────────────────────────────────────
window.renderTxns = renderTxns;

// ── Boot: wait for Firebase Auth before touching Firestore ────
// Firestore rules require request.auth != null on all collections.
// onAuthStateChanged fires once with the current user (or null),
// so the page never makes an unauthenticated Firestore request.
onAuthStateChanged(auth, user => {
    if (user) {
        initRealtimeListeners();
    } else {
        // Not signed in — display a clear error instead of raw Firestore exception
        _isLoading = false;
        const errHtml = `
          <tr><td colspan="10" style="text-align:center;padding:2.5rem;color:var(--color-exp);">
            <strong>\u26a0 \u0e01\u0e23\u0e38\u0e13\u0e32 Sign In \u0e01\u0e48\u0e2d\u0e19\u0e40\u0e02\u0e49\u0e32\u0e16\u0e36\u0e07\u0e23\u0e30\u0e1a\u0e1a\u0e01\u0e32\u0e23\u0e40\u0e07\u0e34\u0e19</strong><br>
            <span style="font-size:12px;color:var(--text-secondary);margin-top:6px;display:block;">
              Firebase Auth session not found \u2014 please log in via the Back Office
            </span>
          </td></tr>`;
        ['cat-tbody', 'txn-tbody'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = errHtml;
        });
    }
});