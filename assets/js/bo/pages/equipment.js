import { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit } from '../core/firebase-config.js';
import { requireUser, esc, isoDate, thDate, toast, openModal, closeModal } from '../core/session.js';

const $ = (id) => document.getElementById(id);
let me, items = [], filter = 'all', borrowId = null, editId = null;
window.closeM = closeModal;

(async function init() {
    me = await requireUser();
    $('btn-add').hidden = !me.isAdmin;
    $('btn-add').addEventListener('click', () => openItem(null));
    $('filters').addEventListener('click', (e) => {
        const b = e.target.closest('.tab'); if (!b) return;
        filter = b.dataset.f;
        document.querySelectorAll('#filters .tab').forEach(t => t.classList.toggle('active', t === b));
        render();
    });
    $('grid').addEventListener('click', onGrid);
    $('bw-ok').addEventListener('click', doBorrow);
    $('it-ok').addEventListener('click', saveItem);
    await load();
})();

async function load() {
    try {
        items = (await getDocs(collection(db, 'equipment'))).docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
    } catch (e) { console.error(e); toast('โหลดอุปกรณ์ไม่สำเร็จ', false); }
    render(); loadLog();
}

function render() {
    const today = isoDate();
    const list = items.filter(i => filter === 'all' || (filter === 'available' && i.status === 'available') || (filter === 'borrowed' && i.status === 'borrowed') || (filter === 'mine' && i.holderUid === me.uid));
    if (!list.length) { $('grid').innerHTML = `<div class="tm-empty" style="grid-column:1/-1">${items.length ? 'ไม่มีรายการในหมวดนี้' : 'ยังไม่มีอุปกรณ์' + (me.isAdmin ? ' — กด "เพิ่มอุปกรณ์" เพื่อเริ่มต้น' : '')}</div>`; return; }
    $('grid').innerHTML = list.map(i => {
        const mineHeld = i.holderUid === me.uid;
        const late = i.status === 'borrowed' && i.dueDate && i.dueDate < today;
        const badge = i.status === 'available' ? '<span class="badge badge-paid">ว่าง</span>' : i.status === 'repair' ? '<span class="badge badge-rejected">ซ่อม</span>' : '<span class="badge badge-pending">ถูกยืม</span>';
        const holder = i.status === 'borrowed' ? `<div class="eq-holder${late ? ' late' : ''}"><i class="bi bi-person"></i> ${esc(i.holderName)}${i.dueDate ? ' · คืน ' + esc(thDate(i.dueDate)) : ''}${late ? ' (เลยกำหนด)' : ''}</div>` : '';
        let acts = '';
        if (i.status === 'available') acts += `<button type="button" class="btn btn-primary tm-btn-sm" data-act="borrow" data-id="${esc(i.id)}">ยืม</button>`;
        if (i.status === 'borrowed' && (mineHeld || me.isAdmin)) acts += `<button type="button" class="btn btn-primary tm-btn-sm" data-act="return" data-id="${esc(i.id)}">${mineHeld ? 'คืนแล้ว' : 'รับคืนแทน'}</button>`;
        if (me.isAdmin) acts += `<button type="button" class="btn tm-btn-sm" data-act="edit" data-id="${esc(i.id)}">แก้ไข</button>`
            + (i.status !== 'borrowed' ? `<button type="button" class="btn tm-btn-sm" data-act="repair" data-id="${esc(i.id)}">${i.status === 'repair' ? 'ซ่อมเสร็จ' : 'แจ้งซ่อม'}</button>` : '')
            + `<button type="button" class="btn tm-btn-sm tm-btn-danger" data-act="delete" data-id="${esc(i.id)}">ลบ</button>`;
        return `<div class="eq-card"><div class="eq-top"><div><div class="eq-name">${esc(i.name)}</div><div class="eq-meta">${esc(i.category || '')}${i.code ? ' · ' + esc(i.code) : ''}</div></div>${badge}</div>
            ${i.note ? `<div class="eq-meta">${esc(i.note)}</div>` : ''}${holder}<div class="eq-foot">${acts}</div></div>`;
    }).join('');
}

async function loadLog() {
    try {
        const logs = (await getDocs(query(collection(db, 'equipment_log'), orderBy('createdAt', 'desc'), limit(15)))).docs.map(d => d.data());
        $('log').innerHTML = logs.length ? logs.map(l => {
            const t = l.createdAt && l.createdAt.toDate ? l.createdAt.toDate().toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
            return `<div class="tm-row"><div class="grow"><strong>${esc(l.name)}</strong> ${l.action === 'borrow' ? 'ยืม' : 'คืน'} ${esc(l.itemName)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</div><small>${esc(t)}</small></div>`;
        }).join('') : '<div class="tm-empty">ยังไม่มีประวัติ</div>';
    } catch (e) { $('log').innerHTML = '<div class="tm-empty">โหลดประวัติไม่สำเร็จ</div>'; }
}

async function onGrid(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const item = items.find(i => i.id === b.dataset.id); if (!item) return;
    const act = b.dataset.act;
    if (act === 'borrow') {
        borrowId = item.id;
        $('borrow-title').textContent = `ยืม ${item.name}`;
        $('borrow-sub').textContent = item.code || '';
        const d = new Date(); d.setDate(d.getDate() + 1);
        $('bw-due').value = isoDate(d); $('bw-note').value = '';
        openModal('borrow-modal');
    } else if (act === 'return') {
        await mutate(item, { status: 'available', holderUid: '', holderName: '', borrowedAt: '', dueDate: '' }, 'return', '');
    } else if (act === 'repair') {
        await mutate(item, { status: item.status === 'repair' ? 'available' : 'repair' }, null);
    } else if (act === 'edit') openItem(item);
    else if (act === 'delete') {
        if (!confirm(`ลบ "${item.name}" ออกจากรายการ?`)) return;
        try { await deleteDoc(doc(db, 'equipment', item.id)); toast('ลบแล้ว'); load(); } catch (err) { toast('ลบไม่สำเร็จ: ' + err.message, false); }
    }
}

// Re-read the item first so two people cannot take the same thing.
async function mutate(item, patch, logAction, note) {
    try {
        const fresh = await getDoc(doc(db, 'equipment', item.id));
        const cur = fresh.exists() ? fresh.data() : null;
        if (!cur) { toast('ไม่พบอุปกรณ์นี้แล้ว', false); return load(); }
        if (patch.status === 'borrowed' && cur.status !== 'available') { toast('มีคนยืมไปก่อนแล้ว', false); return load(); }
        await updateDoc(doc(db, 'equipment', item.id), patch);
        if (logAction) await setDoc(doc(db, 'equipment_log', `lg_${Date.now()}`), { itemId: item.id, itemName: item.name, uid: me.uid, name: me.name, action: logAction, note: note || '', createdAt: serverTimestamp() });
        toast(logAction === 'return' ? 'คืนอุปกรณ์แล้ว' : logAction === 'borrow' ? 'ยืมแล้ว อย่าลืมคืนตามกำหนด' : 'อัปเดตแล้ว');
        load();
    } catch (err) { console.error(err); toast('ทำรายการไม่สำเร็จ: ' + err.message, false); }
}

async function doBorrow() {
    const item = items.find(i => i.id === borrowId); if (!item) return;
    const due = $('bw-due').value;
    if (!due || due < isoDate()) { toast('กำหนดคืนต้องไม่ใช่วันที่ผ่านมาแล้ว', false); return; }
    closeModal('borrow-modal');
    await mutate(item, { status: 'borrowed', holderUid: me.uid, holderName: me.name, borrowedAt: isoDate(), dueDate: due }, 'borrow', $('bw-note').value.trim());
}

function openItem(item) {
    editId = item ? item.id : null;
    $('item-title').textContent = item ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์';
    $('it-name').value = item ? item.name : ''; $('it-code').value = item ? item.code || '' : '';
    $('it-cat').value = item ? item.category || 'อื่นๆ' : 'กล้อง/กิมบอล'; $('it-note').value = item ? item.note || '' : '';
    openModal('item-modal');
}

async function saveItem() {
    const name = $('it-name').value.trim();
    if (!name) { toast('กรุณากรอกชื่ออุปกรณ์', false); return; }
    const data = { name, code: $('it-code').value.trim(), category: $('it-cat').value, note: $('it-note').value.trim() };
    try {
        if (editId) await updateDoc(doc(db, 'equipment', editId), data);
        else await setDoc(doc(db, 'equipment', `eq_${Date.now()}`), { ...data, status: 'available', holderUid: '', holderName: '', borrowedAt: '', dueDate: '', createdAt: serverTimestamp() });
        closeModal('item-modal'); toast('บันทึกแล้ว'); load();
    } catch (err) { toast('บันทึกไม่สำเร็จ: ' + err.message, false); }
}
