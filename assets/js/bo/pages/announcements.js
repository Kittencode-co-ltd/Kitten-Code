import { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from '../core/firebase-config.js';
import { COMPANY_INFO } from './company-info.js';
import { requireUser, esc, thDate, isoDate, toast, openModal, closeModal } from '../core/session.js';

const $ = (id) => document.getElementById(id);
const CATS = { announcement: ['ประกาศ', 'badge-blue'], policy: ['นโยบาย', 'badge-invoice'] };
let me, posts = [], cat = 'all', editId = null;
window.closeM = closeModal;

(async function init() {
    me = await requireUser();
    $('btn-add').hidden = !me.isAdmin;
    $('cats').addEventListener('click', (e) => {
        const b = e.target.closest('.tab'); if (!b) return;
        cat = b.dataset.c;
        document.querySelectorAll('#cats .tab').forEach(t => t.classList.toggle('active', t === b));
        renderList();
    });
    $('btn-add').addEventListener('click', () => openPost(null));
    $('po-ok').addEventListener('click', savePost);
    $('list').addEventListener('click', onList);
    renderAbout();
    $('btn-replay').addEventListener('click', () => { if (window.parent !== window && window.parent.openWelcome) window.parent.openWelcome(); });
    await loadPosts();
})();

function renderAbout() {
    const I = COMPANY_INFO;
    const duo = (o) => `<p class="ab-en">${esc(o.en)}</p><p class="ab-th">${esc(o.th)}</p>`;
    $('about').innerHTML = `
        <div class="ab-hero">
            <div class="ab-vision"><span class="ab-label"><i class="bi bi-eye"></i> วิสัยทัศน์ · Vision</span>${duo(I.vision)}</div>
            <div class="ab-philo"><span class="ab-label"><i class="bi bi-lightbulb"></i> Brand Philosophy</span>${duo(I.philosophy)}</div>
        </div>
        <div class="ab-block">
            <h3 class="ab-title"><i class="bi bi-bullseye"></i> พันธกิจ · Mission</h3>
            <ol class="ab-mission">${I.mission.map(m => `<li><b>${esc(m.en)}</b><span>${esc(m.th)}</span></li>`).join('')}</ol>
        </div>
        <div class="ab-block">
            <h3 class="ab-title"><i class="bi bi-heart"></i> ${esc(I.valuesTitle)} <small>${esc(I.valuesSubtitle)}</small></h3>
            <div class="ab-values">${I.values.map(v => `<article class="ab-value"><span class="ab-letter">${esc(v.letter)}</span><div><b>${esc(v.en)}</b><p>${esc(v.th)}</p><em>${esc(v.tag)}</em></div></article>`).join('')}</div>
        </div>`;
}

async function loadPosts() {
    try { posts = (await getDocs(collection(db, 'announcements'))).docs.map(d => ({ ...d.data(), id: d.id })); }
    catch (e) { console.error(e); toast('โหลดประกาศไม่สำเร็จ', false); }
    posts.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date || '').localeCompare(a.date || ''));
    renderList();
}
function renderList() {
    const list = posts.filter(p => cat === 'all' || p.category === cat);
    $('list').innerHTML = list.length ? list.map(p => {
        const [lab, cls] = CATS[p.category] || CATS.announcement;
        return `<article class="ann-item${p.pinned ? ' pinned' : ''}">
            <div class="ann-meta"><span class="badge ${cls}">${lab}</span>${p.pinned ? '<span><i class="bi bi-pin-angle-fill"></i> ปักหมุด</span>' : ''}<span>${esc(thDate(p.date))}${p.authorName ? ' · ' + esc(p.authorName) : ''}</span></div>
            <h3>${esc(p.title)}</h3><div class="ann-body">${esc(p.body)}</div>
            ${me.isAdmin ? `<div class="tm-actions"><button type="button" class="btn tm-btn-sm" data-edit="${esc(p.id)}">แก้ไข</button><button type="button" class="btn tm-btn-sm tm-btn-danger" data-del="${esc(p.id)}">ลบ</button></div>` : ''}</article>`;
    }).join('') : '<div class="tm-empty">ยังไม่มีรายการ</div>';
}
function onList(e) {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) openPost(posts.find(p => p.id === ed.dataset.edit));
    if (del && confirm('ลบประกาศนี้?')) deleteDoc(doc(db, 'announcements', del.dataset.del)).then(() => { toast('ลบแล้ว'); loadPosts(); }).catch(err => toast('ลบไม่สำเร็จ: ' + err.message, false));
}
function openPost(p) {
    editId = p ? p.id : null;
    $('post-title').textContent = p ? 'แก้ไขประกาศ' : 'เขียนประกาศ';
    $('po-title').value = p ? p.title : ''; $('po-body').value = p ? p.body : '';
    $('po-cat').value = p ? p.category : 'announcement'; $('po-pin').value = p && p.pinned ? '1' : '0';
    openModal('post-modal');
}
async function savePost() {
    const title = $('po-title').value.trim();
    if (!title) { toast('กรุณากรอกหัวข้อ', false); return; }
    const data = { title, body: $('po-body').value.trim(), category: $('po-cat').value, pinned: $('po-pin').value === '1' };
    try {
        if (editId) await updateDoc(doc(db, 'announcements', editId), { ...data, updatedAt: serverTimestamp() });
        else await setDoc(doc(db, 'announcements', `an_${Date.now()}`), { ...data, date: isoDate(), authorName: me.name, createdBy: me.uid, createdAt: serverTimestamp() });
        closeModal('post-modal'); toast('เผยแพร่แล้ว'); loadPosts();
    } catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, false); }
}
