import { db, auth, onAuthStateChanged, collection, getDocs, doc, getDoc, setDoc, serverTimestamp, query, where } from '../core/firebase-config.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function go(hash) {
    const inShell = window.parent !== window && window.parent.location.pathname.endsWith('back-office.html');
    if (inShell) window.parent.location.hash = '#' + hash;
    else window.location.href = { calendar: 'calendar.html', financial: 'financial.html', 'document-record': 'document-record.html' }[hash] || hash + '.html';
}
document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    go(a.dataset.go);
});

const PENDING = [
    { col: 'quotations', label: 'ใบเสนอราคารออนุมัติ', status: 'Pending' },
    { col: 'invoices', label: 'ใบแจ้งหนี้รอชำระ', status: 'Pending' },
    { col: 'vouchers', label: 'ใบเบิก/ซื้อ/จ้างรออนุมัติ', status: 'Pending' }
];

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.replace('login.html'); return; }
    let name = '', isAdmin = false;
    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const u = snap.exists() ? snap.data() : {};
        name = u.firstName || u.username || (user.email || '').split('@')[0];
        isAdmin = u.role === 'admin';
    } catch (e) { console.warn(e); }

    const h = new Date().getHours();
    const greet = h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
    document.getElementById('hello').textContent = `${greet}${name ? ' ' + name : ''}`;
    document.getElementById('today-date').textContent = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    loadAnnouncement();
    loadTasks(user.uid);
    loadPending(isAdmin);
});

async function loadAnnouncement() {
    try {
        const snap = await getDocs(collection(db, 'announcements'));
        const list = snap.docs.map(d => d.data()).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date || '').localeCompare(a.date || ''));
        if (!list.length) return;
        const a = list[0];
        document.getElementById('ann').innerHTML = `<strong>${a.pinned ? '📌 ' : ''}${esc(a.title)}</strong><div class="task-meta">${esc(a.date || '')}</div><p style="margin-top:.4rem;white-space:pre-wrap;font-size:.9rem;max-height:6.5rem;overflow:hidden">${esc(a.body)}</p>`;
        document.getElementById('ann-card').hidden = false;
    } catch (e) { console.warn(e); }
}

async function loadTasks(uid) {
    const box = document.getElementById('my-tasks');
    try {
        const snap = await getDocs(collection(db, 'calendar_events'));
        const today = iso(new Date());
        const soon = iso(new Date(Date.now() + 7 * 86400000));
        const mine = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(e => {
            const a = e.assignees || [];
            const isMine = a.includes(uid) || (a.length === 0 && e.createdBy === uid);
            return isMine && e.status !== 'done' && (e.startDate || '') <= soon;
        }).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
        if (!mine.length) { box.innerHTML = '<div class="today-empty">ไม่มีงานค้าง เยี่ยมมาก 🎉</div>'; return; }
        box.innerHTML = mine.slice(0, 8).map(e => {
            const end = e.endDate || e.startDate;
            const late = end < today;
            const when = late ? 'เลยกำหนด ' + end : e.startDate === today ? 'วันนี้' : e.startDate;
            const label = e.status === 'doing' ? 'ทำเสร็จ' : 'เริ่มทำ';
            return `<div class="task-row">
                <div class="task-main"><span class="task-title">${esc(e.title)}</span>
                <span class="task-meta${late ? ' late' : ''}">${esc(when)}${e.project ? ' · ' + esc(e.project) : ''}</span></div>
                <button type="button" class="btn task-go" data-adv="${esc(e.id)}" data-next="${e.status === 'doing' ? 'done' : 'doing'}">${label}</button>
            </div>`;
        }).join('');
        box.onclick = async (ev) => {
            const b = ev.target.closest('[data-adv]');
            if (!b) return;
            b.disabled = true;
            try {
                await setDoc(doc(db, 'calendar_events', b.dataset.adv), { status: b.dataset.next, updatedAt: serverTimestamp(), updatedBy: uid }, { merge: true });
                loadTasks(uid);
            } catch (e) { b.disabled = false; alert('บันทึกไม่สำเร็จ: ' + e.message); }
        };
    } catch (e) {
        console.error(e);
        box.innerHTML = '<div class="today-empty">โหลดงานไม่สำเร็จ ลองรีเฟรชหน้านี้</div>';
    }
}

async function loadPending(isAdmin) {
    const box = document.getElementById('pending');
    const rows = await Promise.all(PENDING.map(async (p) => {
        try {
            const snap = await getDocs(collection(db, p.col));
            return { ...p, n: snap.docs.filter(d => (d.data().status || 'Pending') === p.status).length };
        } catch { return { ...p, n: null }; }
    }));
    if (isAdmin) {
        try {
            const snap = await getDocs(collection(db, 'fin_transactions'));
            rows.push({ label: 'รายการเบิกจ่ายรออนุมัติ', go: 'financial', n: snap.docs.filter(d => d.data().payment_status === 1).length });
        } catch { /* ledger unavailable */ }
    }
    const ok = rows.filter(r => r.n !== null);
    if (!ok.length) { box.innerHTML = '<div class="today-empty">ไม่มีรายการรอดำเนินการ</div>'; return; }
    box.innerHTML = ok.map(r => `<a href="#" class="pending-row" data-go="${r.go || 'document-record'}"><span>${esc(r.label)}</span><span class="pending-count${r.n ? '' : ' zero'}">${r.n}</span></a>`).join('');
}
