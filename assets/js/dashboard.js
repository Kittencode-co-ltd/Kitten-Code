// ============================================================
//  dashboard.js — Kitten Code Financial Analytics Dashboard
//  FinancialDashboard class:
//   - Firebase Firestore real-time via onSnapshot
//   - KPI aggregation (monthly / quarterly)
//   - Chart.js Line (trend) + Doughnut (expense breakdown)
//   - Recent transactions table
//   - Security panel
//   - escapeHTML XSS protection on all Firestore strings
// ============================================================

import {
    auth,
    db,
    onAuthStateChanged,
    collection,
    query,
    orderBy,
    onSnapshot
} from './firebase-config.js';

// ── XSS Hardening: sanitise ALL strings from Firestore before DOM injection ──
const escapeHTML = (str) => {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[m]));
};

// ── Firestore collections ──────────────────────────────────────
const CATS_COL  = 'fin_categories';
const TXNS_COL  = 'fin_transactions';

// ── Chart.js colour palette (dark luxury) ─────────────────────
const CHART_COLORS = [
    '#00A3FF', '#F97316', '#10B981', '#F59E0B',
    '#A855F7', '#EF4444', '#38BDF8', '#EC4899'
];

// ── Number formatter ──────────────────────────────────────────
const fmtTHB = (n) => '฿' + Math.round(n).toLocaleString('en-US');
const fmtShort = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(Math.round(n));
};

// ── Date helpers ──────────────────────────────────────────────
function getMonthKey(dateStr) { return dateStr ? dateStr.slice(0, 7) : ''; }  // "YYYY-MM"
function getCurrentMonthKey() { return new Date().toISOString().slice(0, 7); }
function pastMonths(n) {
    const result = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
}
function getCurrentQuarterMonths() {
    const now = new Date();
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    return [0, 1, 2].map(i => {
        const d = new Date(now.getFullYear(), qStart + i, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
}

// ================================================================
//  FinancialDashboard — Main Controller Class
// ================================================================
class FinancialDashboard {
    constructor() {
        this._categories   = [];
        this._transactions = [];
        this._currentUser  = null;
        this._period       = 'month';   // 'month' | 'quarter'
        this._lineChart    = null;
        this._donutChart   = null;
        this._unsubCats    = null;
        this._unsubTxns    = null;
    }

    // ── Init ─────────────────────────────────────────────────
    init() {
        this._bindPeriodButtons();
        this._showSkeletons();

        onAuthStateChanged(auth, user => {
            if (!user) {
                window.location.replace('login.html');
                return;
            }
            this._currentUser = user;
            this._updateSecurityPanel();
            this._startListeners();
        });
    }

    // ── Period buttons ────────────────────────────────────────
    _bindPeriodButtons() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._period = btn.dataset.period;
                this._render();
            });
        });
    }

    // ── Skeleton loaders ─────────────────────────────────────
    _showSkeletons() {
        // KPI values
        ['kpi-net','kpi-inc','kpi-exp','kpi-pend'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<span class="skel" style="width:100px;height:28px;display:inline-block;"></span>';
        });
    }

    // ── Firestore real-time listeners ─────────────────────────
    _startListeners() {
        // Categories
        this._unsubCats = onSnapshot(
            query(collection(db, CATS_COL), orderBy('created_at', 'asc')),
            snap => {
                this._categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                this._render();
            },
            err => console.error('[Dashboard] Categories:', err)
        );

        // Transactions
        this._unsubTxns = onSnapshot(
            query(collection(db, TXNS_COL), orderBy('created_at', 'asc')),
            snap => {
                this._transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                this._render();
            },
            err => console.error('[Dashboard] Transactions:', err)
        );
    }

    // ── Main render dispatcher ────────────────────────────────
    _render() {
        this._renderKPI();
        this._renderLineChart();
        this._renderDonutChart();
        this._renderRecentTxns();
    }

    // ── Period filter: returns only txns in the selected window ──
    _getCatByCode(code) { return this._categories.find(c => c.code === code); }

    _filterTxns(txns) {
        const months = this._period === 'quarter'
            ? getCurrentQuarterMonths()
            : [getCurrentMonthKey()];
        return txns.filter(t => months.includes(getMonthKey(t.date)));
    }

    // ── KPI Cards ─────────────────────────────────────────────
    _renderKPI() {
        const filtered = this._filterTxns(this._transactions);

        const incTxns  = filtered.filter(t => this._getCatByCode(t.catCode)?.type === 1 && t.payment_status === 2);
        const expTxns  = filtered.filter(t => this._getCatByCode(t.catCode)?.type === 2 && t.payment_status === 2);
        const pendTxns = filtered.filter(t => this._getCatByCode(t.catCode)?.type === 2 && t.payment_status === 1);

        const inc  = incTxns.reduce((s, t) => s + (t.amount || 0), 0);
        const exp  = expTxns.reduce((s, t) => s + (t.amount || 0), 0);
        const net  = inc - exp;
        const pend = pendTxns.reduce((s, t) => s + (t.amount || 0), 0);
        const pendCount = pendTxns.length;

        this._animateValue('kpi-net',  net,  fmtTHB);
        this._animateValue('kpi-inc',  inc,  fmtTHB);
        this._animateValue('kpi-exp',  exp,  fmtTHB);

        // Pending: show count + amount
        const pendEl = document.getElementById('kpi-pend');
        if (pendEl) pendEl.innerHTML = `
            <span style="display:block;">${pendCount} Items</span>
            <span style="font-size:16px;font-weight:600;opacity:0.7;">${fmtTHB(pend)}</span>
        `;

        // Net badge
        const badge = document.getElementById('kpi-net-badge');
        if (badge) {
            badge.textContent = net >= 0 ? '▲ Profit' : '▼ Loss';
            badge.className = 'kpi-badge ' + (net >= 0 ? 'badge-pos' : 'badge-neg');
        }

        // Period label
        const label = this._period === 'quarter' ? 'This Year' : 'This Month';
        document.querySelectorAll('.kpi-period-label').forEach(el => { el.textContent = label; });
    }

    // Smooth number animation
    _animateValue(id, target, fmt) {
        const el = document.getElementById(id);
        if (!el) return;
        let start = 0;
        const duration = 700;
        const startTime = performance.now();
        const step = (now) => {
            const p = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(start + (target - start) * ease);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ── Line Chart: Monthly Net Profit Trend ──────────────────
    _renderLineChart() {
        const months = pastMonths(6);
        const labels = months.map(m => {
            const [y, mo] = m.split('-');
            return new Date(+y, +mo - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
        });

        const netByMonth = months.map(m => {
            const inc = this._transactions
                .filter(t => getMonthKey(t.date) === m && this._getCatByCode(t.catCode)?.type === 1 && t.payment_status === 2)
                .reduce((s, t) => s + (t.amount || 0), 0);
            const exp = this._transactions
                .filter(t => getMonthKey(t.date) === m && this._getCatByCode(t.catCode)?.type === 2 && t.payment_status === 2)
                .reduce((s, t) => s + (t.amount || 0), 0);
            return inc - exp;
        });

        const incByMonth = months.map(m =>
            this._transactions
                .filter(t => getMonthKey(t.date) === m && this._getCatByCode(t.catCode)?.type === 1 && t.payment_status === 2)
                .reduce((s, t) => s + (t.amount || 0), 0)
        );

        const expByMonth = months.map(m =>
            this._transactions
                .filter(t => getMonthKey(t.date) === m && this._getCatByCode(t.catCode)?.type === 2 && t.payment_status === 2)
                .reduce((s, t) => s + (t.amount || 0), 0)
        );

        const ctx = document.getElementById('lineChart')?.getContext('2d');
        if (!ctx) return;

        if (this._lineChart) { this._lineChart.destroy(); }

        this._lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incByMonth,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16,185,129,0.08)',
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#10B981',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Expenses',
                        data: expByMonth,
                        borderColor: '#F97316',
                        backgroundColor: 'rgba(249,115,22,0.06)',
                        pointBackgroundColor: '#F97316',
                        pointBorderColor: '#F97316',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Net Profit',
                        data: netByMonth,
                        borderColor: '#00A3FF',
                        backgroundColor: 'rgba(0,163,255,0.08)',
                        pointBackgroundColor: '#00A3FF',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1.5,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: false,
                        borderWidth: 3,
                        borderDash: [],
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#475569',
                            font: { size: 11, family: "'Inter', sans-serif" },
                            boxWidth: 12, boxHeight: 12,
                            padding: 16,
                            usePointStyle: true, pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderWidth: 1,
                        titleColor: '#0F172A',
                        bodyColor: '#475569',
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${fmtTHB(ctx.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(15,23,42,0.06)', drawBorder: false },
                        ticks: { color: '#94A3B8', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(15,23,42,0.06)', drawBorder: false },
                        ticks: {
                            color: '#94A3B8',
                            font: { size: 11 },
                            callback: v => fmtShort(v)
                        }
                    }
                },
                animation: { duration: 900, easing: 'easeOutQuart' }
            }
        });
    }

    // ── Doughnut Chart: Expense Breakdown ─────────────────────
    _renderDonutChart() {
        const filtered = this._filterTxns(this._transactions);
        const expCats  = this._categories.filter(c => c.type === 2);

        const catTotals = expCats.map(c => ({
            name: c.name,
            total: filtered
                .filter(t => t.catCode === c.code && t.payment_status === 2)
                .reduce((s, t) => s + (t.amount || 0), 0)
        })).filter(c => c.total > 0)
           .sort((a, b) => b.total - a.total);

        const ctx = document.getElementById('donutChart')?.getContext('2d');
        if (!ctx) return;
        if (this._donutChart) { this._donutChart.destroy(); }

        if (!catTotals.length) {
            const wrap = document.getElementById('donut-legend');
            if (wrap) wrap.innerHTML = '<div class="empty-state">No expense data</div>';
            return;
        }

        const total = catTotals.reduce((s, c) => s + c.total, 0);

        this._donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: catTotals.map(c => c.name),
                datasets: [{
                    data: catTotals.map(c => c.total),
                    backgroundColor: CHART_COLORS.slice(0, catTotals.length),
                    borderColor: '#FFFFFF',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#0F172A',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderWidth: 1,
                        titleColor: '#0F172A',
                        bodyColor: '#475569',
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label: ctx => ` ${fmtTHB(ctx.raw)} (${Math.round((ctx.raw / total) * 100)}%)`
                        }
                    }
                },
                animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' }
            }
        });

        // Custom legend
        const legend = document.getElementById('donut-legend');
        if (legend) {
            legend.innerHTML = catTotals.map((c, i) => `
                <div class="donut-legend-item">
                    <span class="legend-dot" style="background:${CHART_COLORS[i] || '#8B949E'};"></span>
                    <span class="legend-label">${escapeHTML(c.name)}</span>
                    <span class="legend-pct">${Math.round((c.total / total) * 100)}%</span>
                </div>
            `).join('');
        }
    }

    // ── Recent Transactions Table ─────────────────────────────
    _renderRecentTxns() {
        const tbody = document.getElementById('txn-tbody');
        if (!tbody) return;

        const recent = [...this._transactions]
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .slice(0, 5);

        if (!recent.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No transactions yet</td></tr>`;
            return;
        }

        tbody.innerHTML = recent.map(t => {
            const cat    = this._getCatByCode(t.catCode);
            const isInc  = cat?.type === 1;
            const sign   = isInc ? '+' : '−';
            const cls    = isInc ? 'txt-inc' : 'txt-exp';
            const badge  = this._statusBadge(t.payment_status);

            return `<tr>
                <td class="txn-date">${escapeHTML(t.date || '—')}</td>
                <td>
                    <div class="txn-desc">${escapeHTML(t.desc || '—')}</div>
                    <span class="txn-cat-tag">${escapeHTML(cat?.code || t.catCode || '')}</span>
                </td>
                <td>${badge}</td>
                <td class="txn-amount ${cls}">${sign}${fmtTHB(t.amount || 0)}</td>
                <td style="font-size:12px;color:var(--text-secondary);">${escapeHTML(cat?.name || '—')}</td>
            </tr>`;
        }).join('');
    }

    _statusBadge(status) {
        if (status === 2) return '<span class="status-badge sb-paid">✓ Paid</span>';
        if (status === 1) return '<span class="status-badge sb-pending">⏳ Pending</span>';
        return '<span class="status-badge sb-rejected">✕ Rejected</span>';
    }

    // ── Security & System Panel ───────────────────────────────
    _updateSecurityPanel() {
        const container = document.getElementById('sec-panel');
        if (!container) return;

        const user = this._currentUser;
        const lastLogin = user?.metadata?.lastSignInTime
            ? new Date(user.metadata.lastSignInTime).toLocaleString('en-US', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : '—';
        const loginEmail = escapeHTML(user?.email || '—');
        const uid = escapeHTML(user?.uid?.slice(0, 12) + '...' || '—');

        container.innerHTML = `
            <div class="sec-list">
                <div class="sec-item">
                    <span class="sec-dot dot-ok"></span>
                    <div class="sec-content">
                        <div class="sec-label">Admin Session</div>
                        <div class="sec-value">${loginEmail}</div>
                        <div class="sec-meta">UID: ${uid}</div>
                    </div>
                </div>
                <div class="sec-item">
                    <span class="sec-dot dot-info"></span>
                    <div class="sec-content">
                        <div class="sec-label">Last Sign-in</div>
                        <div class="sec-value">${escapeHTML(lastLogin)}</div>
                        <div class="sec-meta">Firebase Auth</div>
                    </div>
                </div>
                <div class="sec-item">
                    <span class="sec-dot dot-ok"></span>
                    <div class="sec-content">
                        <div class="sec-label">Firestore Rules</div>
                        <div class="sec-value">Authenticated-only</div>
                        <div class="sec-meta">request.auth != null enforced</div>
                    </div>
                </div>
                <div class="sec-item">
                    <span class="sec-dot dot-ok"></span>
                    <div class="sec-content">
                        <div class="sec-label">XSS Protection</div>
                        <div class="sec-value">Active — DOM Sanitised</div>
                        <div class="sec-meta">escapeHTML on all Firestore output</div>
                    </div>
                </div>
                <div class="sec-item">
                    <span class="sec-dot dot-warn"></span>
                    <div class="sec-content">
                        <div class="sec-label">Dependabot</div>
                        <div class="sec-value">Check on GitHub</div>
                        <div class="sec-meta">github.com/Kittencode-co-ltd</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ── Cleanup ───────────────────────────────────────────────
    destroy() {
        this._unsubCats?.();
        this._unsubTxns?.();
        this._lineChart?.destroy();
        this._donutChart?.destroy();
    }
}

// ── Bootstrap ─────────────────────────────────────────────────
const dashboard = new FinancialDashboard();
dashboard.init();
