import { db, collection, doc, getDocs, setDoc, deleteDoc, updateDoc, serverTimestamp, query, where } from '../core/firebase-config.js';
import { requireUser, esc, isoDate, hhmm, thDate, toast } from '../core/session.js';

const LATE_AFTER = '09:15';           // check-in after this time is marked "สาย"
const LEAVE = { sick: 'ลาป่วย', vacation: 'ลาพักร้อน', personal: 'ลากิจ', other: 'อื่นๆ' };
const STATUS = { pending: ['รออนุมัติ', 'badge-pending'], approved: ['อนุมัติแล้ว', 'badge-paid'], rejected: ['ไม่อนุมัติ', 'badge-rejected'] };

let me, myAtt = [], myLeaves = [], today = isoDate();

const $ = (id) => document.getElementById(id);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

(async function init() {
    me = await requireUser();
    $('approve-card').hidden = !me.isAdmin;
    tick(); setInterval(tick, 1000 * 20);
    bindTabs();
    $('clock-btn').addEventListener('click', clock);
    $('leave-form').addEventListener('submit', submitLeave);
    $('lv-start').value = $('lv-end').value = today;
    $('lv-start').addEventListener('change', () => { if ($('lv-end').value < $('lv-start').value) $('lv-end').value = $('lv-start').value; });
    await Promise.all([loadMine(), loadLeaves()]);
    loadTeam();
})();

function tick() {
    $('clock-time').textContent = hhmm();
}

function bindTabs() {
    $('tabs').addEventListener('click', (e) => {
        const b = e.target.closest('.tab'); if (!b) return;
        document.querySelectorAll('#tabs .tab').forEach(t => t.classList.toggle('active', t === b));
        document.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
    });
}

// ── Time clock ───────────────────────────────────────────
async function loadMine() {
    const month = today.slice(0, 7);
    try {
        const snap = await getDocs(query(collection(db, 'attendance'), where('uid', '==', me.uid)));
        myAtt = snap.docs.map(d => d.data()).sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) { console.error(e); toast('โหลดเวลาทำงานไม่สำเร็จ', false); }
    renderClock();
    const mm = myAtt.filter(a => a.date.startsWith(month));
    const late = mm.filter(a => a.checkIn > LATE_AFTER).length;
    $('month-stats').innerHTML = stat(mm.length, 'วันที่มาทำงาน') + stat(late, 'วันที่สาย') + stat(mm.filter(a => a.checkOut).length, 'ลงเวลาออกแล้ว');
    $('month-list').innerHTML = mm.length ? mm.map(a => `<div class="tm-row"><div class="grow"><strong>${esc(thDate(a.date))}</strong>
        <small>${esc(a.checkIn)}${a.checkOut ? ' – ' + esc(a.checkOut) : ' · ยังไม่ลงเวลาออก'}${a.note ? ' · ' + esc(a.note) : ''}</small></div>
        ${a.checkIn > LATE_AFTER ? '<span class="badge badge-pending">สาย</span>' : '<span class="badge badge-paid">ตรงเวลา</span>'}</div>`).join('')
        : '<div class="tm-empty">เดือนนี้ยังไม่มีบันทึก</div>';
}
const stat = (n, l) => `<div class="tm-stat"><b>${n}</b><span>${l}</span></div>`;

function renderClock() {
    const t = myAtt.find(a => a.date === today);
    const btn = $('clock-btn');
    btn.disabled = false;
    if (!t) { btn.textContent = 'เข้างาน'; $('clock-sub').textContent = 'วันนี้ยังไม่ได้ลงเวลาเข้างาน'; }
    else if (!t.checkOut) { btn.textContent = 'ออกงาน'; $('clock-sub').textContent = `เข้างานเมื่อ ${t.checkIn} น.${t.checkIn > LATE_AFTER ? ' (สาย)' : ''}`; }
    else { btn.textContent = 'แก้เวลาออกงาน'; $('clock-sub').textContent = `เข้า ${t.checkIn} · ออก ${t.checkOut} น.`; }
}

async function clock() {
    const id = `${me.uid}_${today}`;
    const t = myAtt.find(a => a.date === today);
    $('clock-btn').disabled = true;
    try {
        if (!t) {
            await setDoc(doc(db, 'attendance', id), { uid: me.uid, name: me.name, date: today, checkIn: hhmm(), checkOut: '', createdAt: serverTimestamp() });
            toast('บันทึกเข้างานแล้ว');
        } else {
            await updateDoc(doc(db, 'attendance', id), { checkOut: hhmm(), updatedAt: serverTimestamp() });
            toast('บันทึกออกงานแล้ว ขอบคุณครับ');
        }
        await loadMine(); loadTeam();
    } catch (e) { console.error(e); toast('บันทึกไม่สำเร็จ: ' + e.message, false); renderClock(); }
}

// ── Leave ────────────────────────────────────────────────
async function loadLeaves() {
    try {
        const snap = await getDocs(query(collection(db, 'leave_requests'), where('uid', '==', me.uid)));
        myLeaves = snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => b.startDate.localeCompare(a.startDate));
    } catch (e) { console.error(e); }
    const year = today.slice(0, 4);
    const used = (t) => myLeaves.filter(l => l.status === 'approved' && l.type === t && l.startDate.startsWith(year)).reduce((s, l) => s + (l.days || 0), 0);
    $('leave-stats').innerHTML = Object.keys(LEAVE).map(t => stat(used(t), `${LEAVE[t]} (วัน/ปีนี้)`)).join('');
    $('my-leaves').innerHTML = myLeaves.length ? myLeaves.map(l => {
        const [lab, cls] = STATUS[l.status] || STATUS.pending;
        return `<div class="tm-row"><div class="grow"><strong>${LEAVE[l.type] || ''}</strong> · ${l.days} วัน
            <small>${esc(thDate(l.startDate))}${l.endDate !== l.startDate ? ' – ' + esc(thDate(l.endDate)) : ''}${l.reason ? ' · ' + esc(l.reason) : ''}</small></div>
            <span class="badge ${cls}">${lab}</span>
            ${l.status === 'pending' ? `<button type="button" class="btn tm-btn-sm tm-btn-danger" data-cancel="${esc(l.id)}">ยกเลิก</button>` : ''}</div>`;
    }).join('') : '<div class="tm-empty">ยังไม่มีใบลา</div>';
}
$('my-leaves').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    if (!confirm('ยกเลิกใบลานี้?')) return;
    try { await deleteDoc(doc(db, 'leave_requests', b.dataset.cancel)); toast('ยกเลิกใบลาแล้ว'); await loadLeaves(); loadTeam(); }
    catch (err) { toast('ยกเลิกไม่สำเร็จ: ' + err.message, false); }
});

async function submitLeave(e) {
    e.preventDefault();
    const startDate = $('lv-start').value, endDate = $('lv-end').value;
    if (!startDate || endDate < startDate) { toast('ตรวจสอบวันที่ลาอีกครั้ง', false); return; }
    const btn = $('lv-submit'); btn.disabled = true;
    try {
        const id = `lv_${Date.now()}`;
        await setDoc(doc(db, 'leave_requests', id), {
            uid: me.uid, name: me.name, type: $('lv-type').value, startDate, endDate,
            days: daysBetween(startDate, endDate), reason: $('lv-reason').value.trim(),
            status: 'pending', createdAt: serverTimestamp()
        });
        $('lv-reason').value = '';
        toast('ส่งใบลาแล้ว รอผู้อนุมัติ');
        await loadLeaves(); loadTeam();
    } catch (err) { console.error(err); toast('ส่งใบลาไม่สำเร็จ: ' + err.message, false); }
    btn.disabled = false;
}

// ── Team today ───────────────────────────────────────────
async function loadTeam() {
    let staff = [], att = [], leaves = [];
    try { staff = (await getDocs(collection(db, 'staff_directory'))).docs.map(d => d.data()); } catch (e) { console.warn(e); }
    try { att = (await getDocs(query(collection(db, 'attendance'), where('date', '==', today)))).docs.map(d => d.data()); } catch (e) { console.warn(e); }
    if (me.isAdmin) { try { leaves = (await getDocs(collection(db, 'leave_requests'))).docs.map(d => ({ ...d.data(), id: d.id })); } catch (e) { console.warn(e); } }

    const onLeave = new Set(leaves.filter(l => l.status === 'approved' && l.startDate <= today && l.endDate >= today).map(l => l.uid));
    staff.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    const inCount = att.length;
    $('roster-count').textContent = `เข้างานแล้ว ${inCount}/${staff.length}`;
    $('roster').innerHTML = staff.length ? staff.map(s => {
        const a = att.find(x => x.uid === s.uid);
        let badge = '<span class="badge badge-gray">ยังไม่เข้า</span>', sub = '';
        if (a) { badge = a.checkOut ? '<span class="badge badge-blue">ออกแล้ว</span>' : '<span class="badge badge-paid">อยู่ที่ทำงาน</span>'; sub = `เข้า ${a.checkIn}${a.checkOut ? ' · ออก ' + a.checkOut : ''}`; }
        else if (onLeave.has(s.uid)) { badge = '<span class="badge badge-pending">ลา</span>'; }
        return `<div class="tm-row"><div class="grow">${esc(s.name)}${sub ? `<small>${sub}</small>` : ''}</div>${badge}</div>`;
    }).join('') : '<div class="tm-empty">ยังไม่มีรายชื่อพนักงาน</div>';

    if (!me.isAdmin) return;
    const pend = leaves.filter(l => l.status === 'pending').sort((a, b) => a.startDate.localeCompare(b.startDate));
    $('pend-dot').innerHTML = pend.length ? ` <span class="badge badge-pending">${pend.length}</span>` : '';
    $('approvals').innerHTML = pend.length ? pend.map(l => `<div class="tm-row"><div class="grow"><strong>${esc(l.name)}</strong> · ${LEAVE[l.type]} ${l.days} วัน
        <small>${esc(thDate(l.startDate))}${l.endDate !== l.startDate ? ' – ' + esc(thDate(l.endDate)) : ''}${l.reason ? ' · ' + esc(l.reason) : ''}</small></div>
        <div class="tm-actions"><button type="button" class="btn btn-primary tm-btn-sm" data-decide="approved" data-id="${esc(l.id)}">อนุมัติ</button>
        <button type="button" class="btn tm-btn-sm tm-btn-danger" data-decide="rejected" data-id="${esc(l.id)}">ไม่อนุมัติ</button></div></div>`).join('')
        : '<div class="tm-empty">ไม่มีใบลารออนุมัติ</div>';
}
$('approvals').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-decide]'); if (!b) return;
    b.disabled = true;
    try {
        await updateDoc(doc(db, 'leave_requests', b.dataset.id), { status: b.dataset.decide, decidedBy: me.uid, decidedAt: serverTimestamp() });
        toast(b.dataset.decide === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติแล้ว');
        loadTeam();
    } catch (err) { b.disabled = false; toast('ทำรายการไม่สำเร็จ: ' + err.message, false); }
});
