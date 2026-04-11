// ============================================================
//  financial.js — Kitten Code Financial Module
//  Firebase Firestore + Real-time onSnapshot
//  Config: reads window.__ENV__ (injected by GitHub Actions)
//          falls back to local dev constants if not present
// ============================================================
import { 
    app, 
    auth, 
    db, 
    onAuthStateChanged,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp 
} from './firebase-config.js';

const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
};

const showDraftToast = () => {
    if(document.getElementById('kcToast')) return;
    const toast = document.createElement('div');
    toast.id = 'kcToast';
    toast.className = 'kc-toast-container';
    toast.innerHTML = `
        <i class="bi bi-check-circle kc-toast-icon"></i>
        <div class="kc-toast-content">
            <span class="kc-toast-title">Draft Restored</span>
            <span class="kc-toast-message">Your unsaved form data has been recovered.</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

function saveDraftTxn() {
    const draft = {
        date: document.getElementById('txn-date')?.value || '',
        cat: document.getElementById('txn-cat')?.value || '',
        desc: document.getElementById('txn-desc')?.value || '',
        amount: document.getElementById('txn-amount')?.value || '',
        ref: document.getElementById('txn-ref')?.value || '',
        contact: document.getElementById('txn-contact')?.value || '',
        status: document.getElementById('txn-status')?.value || '',
        paidDate: document.getElementById('txn-paid-date')?.value || ''
    };
    localStorage.setItem('draft_financial_data', JSON.stringify(draft));
}

let _txnDraftRestored = false;
function restoreDraftTxn() {
    if (_txnDraftRestored) return;
    const saved = localStorage.getItem('draft_financial_data');
    if (saved) {
        try {
            const draft = JSON.parse(saved);
            const bind = (id, val) => { if(val && document.getElementById(id)) document.getElementById(id).value = escapeHTML(val); };
            bind('txn-date', draft.date);
            bind('txn-cat', draft.cat);
            bind('txn-desc', draft.desc);
            bind('txn-amount', draft.amount);
            bind('txn-ref', draft.ref);
            bind('txn-contact', draft.contact);
            bind('txn-status', draft.status);
            bind('txn-paid-date', draft.paidDate);
            showDraftToast();
        } catch(e) {}
    }
    _txnDraftRestored = true;
}

document.addEventListener('DOMContentLoaded', () => {
    ['txn-date', 'txn-cat', 'txn-desc', 'txn-amount', 'txn-ref', 'txn-contact', 'txn-status', 'txn-paid-date'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', saveDraftTxn);
            el.addEventListener('change', saveDraftTxn);
        }
    });
});

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
function fmt(n)    { return '฿' + Math.round(n).toLocaleString('en-US'); }
function fmtNum(n) { return Math.round(n).toLocaleString('en-US'); }

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
    if (status === 2) return '<span class="badge badge-paid">Paid</span>';
    if (status === 1) return '<span class="badge badge-pending">Pending</span>';
    return '<span class="badge badge-rejected">Rejected</span>';
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
        budgetEl.innerHTML = '<div class="empty-state">No expense categories with a budget set yet.</div>';
    } else {
        budgetEl.innerHTML = expCats.map(c => {
            const used       = getUsed(c.code);
            const pendingAmt = getPending(c.code);
            const pct        = Math.min(100, Math.round((used / c.budget) * 100));
            const fillClass  = pct >= 90 ? 'fill-over' : pct >= 70 ? 'fill-warn' : 'fill-ok';
            const pendNote   = pendingAmt > 0
                ? `<span style="font-size:11px;color:var(--color-warn);"> + ${fmt(pendingAmt)} pending</span>`
                : '';
            return `<div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
            <span style="font-size:14px;">${c.name}</span>
            <span style="font-size:14px;color:var(--text-secondary);">${fmtNum(used)} / ${fmtNum(c.budget)} THB${pendNote}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
          <div class="pct">Paid ${pct}% — Remaining ${fmt(c.budget - used)}</div>
        </div>`;
        }).join('');
    }

    // Recent transactions (last 5)
    const recentEl = document.getElementById('recent-txns');
    const recent = [..._transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    if (!recent.length) {
        recentEl.innerHTML = '<div class="empty-state">No recent transactions.</div>';
        return;
    }
    recentEl.innerHTML = `<table class="txn-table"><thead><tr><th>Date</th><th>Description</th><th style="text-align:center;">Status</th><th style="text-align:right;">Amount</th></tr></thead><tbody>` +
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
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No categories available.</td></tr>';
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
            const endStr    = endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const unitLabel = c.quota_unit === 'days' ? 'days' : c.quota_unit === 'months' ? 'months' : 'years';

            quotaCell = `
              <div style="line-height:1.6;">
                <span class="quota-period-tag">${c.quota_value} ${unitLabel}</span>
                <div style="font-size:11px;margin-top:4px;color:${isExpired ? 'var(--color-exp)' : 'var(--text-secondary)'}">
                  ${isExpired
                    ? '<span style="color:var(--color-exp);font-weight:600;">Expired</span>'
                    : `Ends: <span style="color:var(--accent-primary);">${escapeHTML(endStr)}</span>`}
                </div>
                ${isExpired
                  ? `<button class="btn-reset-quota" onclick="resetQuota('${c.id}')">↺ Reset Period</button>`
                  : ''}
              </div>`;
        }

        return `<tr>
        <td><span class="tag-code">${escapeHTML(c.code)}</span></td>
        <td>${escapeHTML(c.name)}</td>
        <td><span class="badge ${c.type === 1 ? 'badge-inc' : 'badge-exp'}">${c.type === 1 ? 'Income' : 'Expense'}</span></td>
        <td style="text-align:right;">${c.budget > 0 ? fmtNum(c.budget) : '<span style="color:var(--text-tertiary);font-size:11px;">Unlimited</span>'}</td>
        <td style="text-align:right;color:#993C1D;font-weight:500;">${fmtNum(used)}</td>
        <td style="text-align:right;">${remaining !== null
            ? `<span style="color:${remaining < 0 ? '#D85A30' : '#0F6E56'};font-weight:500;">${fmtNum(remaining)}</span>
               ${pct !== null ? `<div class="progress-bar" style="margin-top:4px;"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>` : ''}`
            : '<span style="color:var(--text-tertiary);font-size:11px;">-</span>'}</td>
        <td>${quotaCell}</td>
        <td>
          <div style="display:flex;gap:4px;justify-content:center;">
             <button class="action-btn" onclick="openEditModal('${c.id}', '${CATS_COL}')" title="Edit">Edit</button>
          </div>
        </td>
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
    if (!txns.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No transactions found.</td></tr>'; return; }
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
                <button class="btn-txn-action btn-mark-rejected" onclick="updateDisbursementStatus('${t.id}', 0, '')" title="Reject this transaction">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Reject
                </button>
               </div>`
            : '';

        return `<tr>
        <td style="font-size:12px;color:var(--text-secondary);">${t.date}</td>
        <td>${escapeHTML(t.desc)}</td>
        <td><span class="tag-code">${escapeHTML(cat?.code) || ''}</span></td>
        <td style="font-size:12px;color:var(--text-secondary);">${escapeHTML(t.ref) || '-'}</td>
        <td style="font-size:12px;color:var(--text-secondary);">${escapeHTML(t.contact) || '-'}</td>
        <td style="text-align:center;">${statusBadge(t.payment_status)}</td>
        <td style="font-size:12px;color:var(--text-secondary);">${t.paid_date || '-'}</td>
        <td style="text-align:right;" class="${cls}">${sign}${fmt(t.amount)}</td>
        <td style="text-align:center;min-width:160px;">
            <div style="display:flex;gap:4px;justify-content:center;margin-bottom:${t.payment_status === 1 ? '6px' : '0'};">
                <button class="action-btn" onclick="openEditModal('${t.id}', '${TXNS_COL}')" title="Edit">Edit</button>
            </div>
            ${actionBtns}
        </td>
      </tr>`;
    }).join('');
}

// ── Add Transaction Form ──────────────────────────────────────
function renderAddForm() {
    // Only set defaults if draft hasn't been injected or if clear was triggered
    if (!_txnDraftRestored) {
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('txn-date').value = today;
    }
    const sel = document.getElementById('txn-cat');
    
    // Remember current value before wiping innerHTML to rebuild options
    const prevCat = sel.value; 
    sel.innerHTML = _categories.map(c => `<option value="${c.code}">[${c.type === 1 ? 'Income' : 'Expense'}] ${c.name}</option>`).join('');
    if (prevCat) sel.value = prevCat;

    if (!_txnDraftRestored) {
        const statusSel = document.getElementById('txn-status');
        if (statusSel) statusSel.value = '1';
        const paidDate = document.getElementById('txn-paid-date');
        if (paidDate) paidDate.value = '';
    }

    restoreDraftTxn();
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

    if (!code || !name) { alert('Please enter both code and name.'); return; }
    if (quotaUnit && (!quotaVal || quotaVal < 1)) { alert('Please enter a valid quota amount.'); return; }

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
    } catch (e) { alert('An error occurred: ' + e.message); }
};

// Reset quota: update last_reset_date to today for a category
window.resetQuota = async function (catId) {
    const today = new Date().toISOString().slice(0, 10);
    try {
        await updateDoc(doc(db, CATS_COL, catId), { last_reset_date: today, updated_at: serverTimestamp() });
    } catch (e) { alert('Failed to reset quota: ' + e.message); }
};

window.deleteCategory = async function (id) {
    const cat  = _categories.find(c => c.id === id);
    const inUse = _transactions.some(t => t.catCode === cat?.code);
    if (inUse) { alert('Cannot delete: This category is in use by transactions.'); return; }
    try {
        await deleteDoc(doc(db, CATS_COL, id));
    } catch (e) { alert('An error occurred: ' + e.message); }
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
        msgEl.innerHTML = '<span style="color:#D85A30;">Please fill in all required fields.</span>';
        return;
    }
    try {
        await addDoc(collection(db, TXNS_COL), {
            date, catCode, desc, amount, ref, contact,
            payment_status, paid_date,
            created_at: serverTimestamp()
        });
        msgEl.innerHTML = '<span style="color:#0F6E56;">Transaction saved successfully!</span>';
        ['txn-desc', 'txn-amount', 'txn-ref', 'txn-contact'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (document.getElementById('txn-status')) document.getElementById('txn-status').value = '1';
        if (document.getElementById('txn-paid-date')) document.getElementById('txn-paid-date').value = '';
        setTimeout(() => { msgEl.innerHTML = ''; }, 3000);
        
        // Clear autosaved draft heavily
        localStorage.removeItem('draft_financial_data');
        _txnDraftRestored = false;
        
    } catch (e) {
        msgEl.innerHTML = `<span style="color:#D85A30;">An error occurred: ${e.message}</span>`;
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
        alert('Failed to update status: ' + e.message);
    }
};

window.deleteTransaction = async function(id) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;
    try {
        await deleteDoc(doc(db, TXNS_COL, id));
    } catch(e) {
        alert('Failed to delete transaction: ' + e.message);
    }
};

// ── Edit Record Logic ─────────────────────────────────────────

window.confirmDeleteFromModal = async function() {
    const docId = document.getElementById('edit-doc-id').value;
    const collectionName = document.getElementById('edit-col-name').value;
    
    if (collectionName === TXNS_COL) {
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, TXNS_COL, docId));
            closeEditModal();
        } catch(e) { alert('Failed to delete transaction: ' + e.message); }
    } else if (collectionName === CATS_COL) {
        const cat  = _categories.find(c => c.id === docId);
        const inUse = _transactions.some(t => t.catCode === cat?.code);
        if (inUse) { alert('Cannot delete: This category is in use by transactions.'); return; }
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, CATS_COL, docId));
            closeEditModal();
        } catch (e) { alert('An error occurred: ' + e.message); }
    }
};

window.openEditModal = function(docId, collectionName) {
    document.getElementById('edit-modal').style.display = 'flex';
    document.getElementById('edit-doc-id').value = docId;
    document.getElementById('edit-col-name').value = collectionName;
    
    if (collectionName === TXNS_COL) {
        document.getElementById('edit-txn-fields').style.display = 'grid';
        document.getElementById('edit-cat-fields').style.display = 'none';
        
        const txn = _transactions.find(t => t.id === docId);
        if (txn) {
            document.getElementById('edit-txn-date').value = escapeHTML(txn.date);
            document.getElementById('edit-txn-desc').value = escapeHTML(txn.desc);
            document.getElementById('edit-txn-amount').value = txn.amount;
            document.getElementById('edit-txn-ref').value = escapeHTML(txn.ref || '');
            document.getElementById('edit-txn-contact').value = escapeHTML(txn.contact || '');
            document.getElementById('edit-txn-status').value = txn.payment_status?.toString() || '1';
            document.getElementById('edit-txn-paid-date').value = escapeHTML(txn.paid_date || '');
            
            // Populate categories in the select
            const sel = document.getElementById('edit-txn-cat');
            sel.innerHTML = _categories.map(c => `<option value="${c.code}">[${c.type === 1 ? 'Income' : 'Expense'}] ${c.name}</option>`).join('');
            sel.value = escapeHTML(txn.catCode);
        }
    } else if (collectionName === CATS_COL) {
        document.getElementById('edit-txn-fields').style.display = 'none';
        document.getElementById('edit-cat-fields').style.display = 'grid';
        
        const cat = _categories.find(c => c.id === docId);
        if (cat) {
            document.getElementById('edit-cat-name').value = escapeHTML(cat.name);
            document.getElementById('edit-cat-budget').value = cat.budget;
            document.getElementById('edit-cat-quota-value').value = cat.quota_value || '';
            document.getElementById('edit-cat-quota-unit').value = cat.quota_unit || '';
        }
    }
};

window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
};

window.submitEdit = async function() {
    if (!auth.currentUser) {
        alert("You must be logged in to update data.");
        return;
    }
    const docId = document.getElementById('edit-doc-id').value;
    const collectionName = document.getElementById('edit-col-name').value;
    
    let updatedData = {};
    if (collectionName === TXNS_COL) {
        const date = document.getElementById('edit-txn-date').value;
        const catCode = document.getElementById('edit-txn-cat').value;
        const desc = document.getElementById('edit-txn-desc').value.trim();
        const amount = parseFloat(document.getElementById('edit-txn-amount').value);
        const ref = document.getElementById('edit-txn-ref').value.trim();
        const contact = document.getElementById('edit-txn-contact').value.trim();
        const payment_status = parseInt(document.getElementById('edit-txn-status').value);
        const paid_date = document.getElementById('edit-txn-paid-date').value;
        
        if (!date || !catCode || !desc || isNaN(amount) || amount <= 0) {
            alert("Please fill in all transaction fields correctly.");
            return;
        }
        updatedData = {
           date: escapeHTML(date),
           catCode: escapeHTML(catCode),
           desc: escapeHTML(desc),
           amount: amount,
           ref: escapeHTML(ref),
           contact: escapeHTML(contact),
           payment_status: payment_status,
           paid_date: escapeHTML(paid_date),
           updated_at: serverTimestamp()
        };
    } else if (collectionName === CATS_COL) {
        const name = document.getElementById('edit-cat-name').value.trim();
        const budget = parseFloat(document.getElementById('edit-cat-budget').value);
        const quotaVal = parseInt(document.getElementById('edit-cat-quota-value').value) || null;
        const quotaUnit = document.getElementById('edit-cat-quota-unit').value || null;
        
        if (!name || isNaN(budget) || budget < 0) {
            alert("Please fill in a valid Category Name and Budget.");
            return;
        }
        updatedData = {
           name: escapeHTML(name),
           budget: budget,
           quota_value: quotaUnit ? quotaVal : null,
           quota_unit: quotaUnit || null,
           // Note: if quota is modified, we leave last_reset_date untouched to avoid resetting the cycle artificially
           updated_at: serverTimestamp()
        };
    }
    
    try {
        await updateDoc(doc(db, collectionName, docId), updatedData);
        closeEditModal();
        // Since we are using real-time listeners (onSnapshot), the table and dashboard will automatically refresh and calculate the new balances!
    } catch(e) {
        alert("Error updating document: " + e.message);
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
            <strong>\u26a0 Please Sign In to access the Financial Management system.</strong><br>
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