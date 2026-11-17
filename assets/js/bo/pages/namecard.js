// Electronic business card editor. One card per person at cards/{slug}; the owner decides what is public.
// users/{uid}.cardSlug remembers which card is mine (staff cannot list the cards collection).
import { db, auth, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from '../core/firebase-config.js';
import { requireUser, esc, toast } from '../core/session.js';
import { mountCard, vcard, makeQr, ACCENTS, COMPANY, SLUG_RE } from '../../card/card-lib.js';

const $ = (id) => document.getElementById(id);
const FIELDS = [
    ['name', 'ชื่อ–นามสกุล *', 'text', 1], ['nameEn', 'ชื่อ (ภาษาอังกฤษ)', 'text'], ['position', 'ตำแหน่ง', 'text'], ['positionEn', 'ตำแหน่ง (ภาษาอังกฤษ)', 'text'],
    ['tagline', 'ข้อความแนะนำตัวสั้นๆ', 'textarea', 1], ['phone', 'เบอร์โทร', 'tel'], ['email', 'อีเมล', 'email'], ['line', 'LINE ID', 'text'],
    ['website', 'เว็บไซต์', 'text'], ['facebook', 'Facebook (ลิงก์หรือชื่อเพจ)', 'text'], ['instagram', 'Instagram (@ชื่อ)', 'text'], ['address', 'ที่อยู่', 'text', 1]
];
const LIMITS = { name: 80, nameEn: 80, position: 80, positionEn: 80, tagline: 200, phone: 30, email: 100, line: 50, website: 200, facebook: 200, instagram: 200, address: 200 };
const ACC_BG = { blue: '#0a72e8', violet: '#5b3cc4', green: '#16803c', amber: '#a15c00', rose: '#c2255c', ink: '#1c1b19' };
const BASE = new URL('../card.html', location.href);
const urlOf = (slug) => `${BASE.origin}${BASE.pathname}?u=${slug}`;

let me, uid, saved = null, savedSlug = '', accent = 'blue', mount, userDoc = {}, dirty = false;

(async function init() {
    me = await requireUser(); uid = auth.currentUser.uid;
    try { const s = await getDoc(doc(db, 'users', uid)); userDoc = s.exists() ? s.data() : {}; } catch (e) { console.warn(e); }
    $('nc-fields').innerHTML = FIELDS.map(([k, label, type, full]) => `<div class="form-group${full ? ' full' : ''}"><label for="nc-${k}">${esc(label)}</label>`
        + (type === 'textarea' ? `<textarea id="nc-${k}" rows="2" maxlength="${LIMITS[k]}"></textarea>` : `<input id="nc-${k}" type="${type}" maxlength="${LIMITS[k]}">`) + '</div>').join('');
    $('nc-accents').innerHTML = ACCENTS.map(([k, l]) => `<button type="button" class="nc-ac" data-ac="${k}" style="background:${ACC_BG[k]}" aria-label="${esc(l)}" title="${esc(l)}"></button>`).join('');
    $('nc-base').textContent = `${BASE.host}${BASE.pathname.replace(/[^/]*$/, '')}card.html?u=`;

    let existing = null;
    if (userDoc.cardSlug) { try { const s = await getDoc(doc(db, 'cards', userDoc.cardSlug)); if (s.exists()) { existing = s.data(); savedSlug = userDoc.cardSlug; } } catch (e) { console.warn(e); } }
    const d = existing || prefill();
    fill(d); $('nc-slug').value = savedSlug || suggestSlug(); saved = existing;
    mount = mountCard($('nc-card'), read(), { url: () => urlOf($('nc-slug').value || 'your-name'), preview: true, onToast: toast });
    themeSync(); refresh();

    $('nc-form').addEventListener('input', (e) => { if (e.target.id === 'nc-slug') e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); dirty = true; refresh(); });
    $('nc-accents').addEventListener('click', (e) => { const b = e.target.closest('[data-ac]'); if (!b) return; accent = b.dataset.ac; dirty = true; refresh(); });
    $('nc-form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
    $('nc-copy').addEventListener('click', copy);
    $('nc-share-btn').addEventListener('click', share);
    $('nc-vcf').addEventListener('click', () => { const d = read(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([vcard(d)], { type: 'text/vcard;charset=utf-8' })); a.download = (d.nameEn || $('nc-slug').value || 'contact') + '.vcf'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); });
    $('nc-qr').addEventListener('click', downloadQr);
    new MutationObserver(themeSync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (me.isAdmin) loadTeam();
})();

function prefill() {
    const u = userDoc, name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return { name, position: u.position || '', phone: u.phone || '', email: u.email || auth.currentUser.email || '', address: COMPANY.address, tagline: '', published: false, accent: 'blue' };
}
function suggestSlug() { const s = String(userDoc.username || '').toLowerCase().replace(/[^a-z0-9-]/g, ''); return s.length >= 3 ? s.slice(0, 30) : ''; }
function fill(d) { FIELDS.forEach(([k]) => { $('nc-' + k).value = d[k] || ''; }); $('nc-published').checked = !!d.published; accent = d.accent || 'blue'; }
function read() { const d = {}; FIELDS.forEach(([k]) => { d[k] = $('nc-' + k).value.trim(); }); d.published = $('nc-published').checked; d.accent = accent; return d; }
function themeSync() { $('nc-card').classList.toggle('kc-dark', document.documentElement.dataset.theme === 'dark'); }

function refresh() {
    const d = read(), slug = $('nc-slug').value, ok = SLUG_RE.test(slug), url = urlOf(slug || 'your-name');
    mount.update(d); // keeps flip state; QR target follows the link name
    document.querySelectorAll('.nc-ac').forEach(b => b.classList.toggle('on', b.dataset.ac === accent));
    $('nc-url').value = ok ? url : '';
    $('nc-pub-note').textContent = d.published ? 'เปิดอยู่ — ใครมีลิงก์ก็เปิดดูได้' : 'ปิดอยู่ — มีแค่คุณที่เห็น';
    const live = saved && saved.published && savedSlug === slug && !dirty;
    $('nc-state').className = 'nc-state' + (live ? ' live' : '');
    $('nc-state').textContent = live ? 'เผยแพร่แล้ว — ลิงก์ใช้งานได้' : saved && !saved.published ? 'ยังไม่เผยแพร่ — คนอื่นเปิดลิงก์ไม่ได้' : saved ? 'มีการแก้ไขที่ยังไม่บันทึก' : 'ยังไม่ได้สร้าง — กรอกข้อมูลแล้วกดบันทึก';
    const op = $('nc-open'); op.hidden = !(saved && ok); if (ok) op.href = url;
    $('nc-dirty').textContent = dirty ? 'มีการแก้ไขที่ยังไม่บันทึก' : ''; $('nc-dirty').classList.toggle('on', dirty);
    ['nc-copy', 'nc-qr', 'nc-share-btn'].forEach(id => { $(id).disabled = !ok; });
}

async function save() {
    const d = read(), slug = $('nc-slug').value;
    if (!d.name) { toast('กรุณากรอกชื่อ', false); $('nc-name').focus(); return; }
    if (!SLUG_RE.test(slug)) { toast('ชื่อลิงก์ใช้ a–z, 0–9 และ - ยาว 3–30 ตัว', false); $('nc-slug').focus(); return; }
    const btn = $('nc-save'); btn.disabled = true;
    try {
        await setDoc(doc(db, 'cards', slug), { ...d, uid, updatedAt: serverTimestamp() });
        if (savedSlug && savedSlug !== slug) { try { await deleteDoc(doc(db, 'cards', savedSlug)); } catch (e) { console.warn(e); } }
        if (userDoc.cardSlug !== slug) { await updateDoc(doc(db, 'users', uid), { cardSlug: slug }); userDoc.cardSlug = slug; }
        saved = d; savedSlug = slug; dirty = false; toast(d.published ? 'บันทึกและเผยแพร่แล้ว' : 'บันทึกแล้ว (ยังไม่เผยแพร่)'); refresh(); if (me.isAdmin) loadTeam();
    } catch (err) {
        console.error(err);
        toast(err.code === 'permission-denied' ? 'ใช้ชื่อลิงก์นี้ไม่ได้ (อาจมีคนใช้แล้ว) ลองชื่ออื่น' : 'บันทึกไม่สำเร็จ: ' + err.message, false);
    } finally { btn.disabled = false; }
}
async function copy() { try { await navigator.clipboard.writeText($('nc-url').value); toast('คัดลอกลิงก์แล้ว'); } catch (e) { $('nc-url').select(); toast('เลือกลิงก์แล้ว กด Ctrl/Cmd+C'); } }
async function share() { const url = $('nc-url').value; try { if (navigator.share) return await navigator.share({ title: read().name, url }); } catch (e) { if (e && e.name === 'AbortError') return; } copy(); }
function downloadQr() {
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(box);
    makeQr(box, $('nc-url').value, 512);
    setTimeout(() => { const c = box.querySelector('canvas'); if (c) { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `qr-${$('nc-slug').value}.png`; a.click(); toast('ดาวน์โหลด QR แล้ว'); } box.remove(); }, 80);
}

async function loadTeam() {
    try {
        const snap = await getDocs(collection(db, 'cards')); const rows = snap.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
        $('nc-team').hidden = false; $('nc-team-n').textContent = rows.length ? `${rows.length} ใบ` : '';
        $('nc-team-list').innerHTML = rows.length ? rows.map((r, i) => `<div class="nc-trow" style="--i:${i}"><div class="grow"><b>${esc(r.name)}</b><small>${esc(r.position || '')}</small></div>
            <span class="badge ${r.published ? 'badge-paid' : 'badge-pending'}">${r.published ? 'เผยแพร่' : 'ยังไม่เผยแพร่'}</span>
            <button type="button" class="btn tm-btn-sm" data-copy="${esc(r.id)}">คัดลอกลิงก์</button>
            <a class="btn tm-btn-sm" href="${esc(urlOf(r.id))}" target="_blank" rel="noopener">เปิด</a></div>`).join('') : '<div class="tm-empty">ยังไม่มีใครสร้างนามบัตร</div>';
        $('nc-team-list').onclick = async (e) => { const b = e.target.closest('[data-copy]'); if (b) { try { await navigator.clipboard.writeText(urlOf(b.dataset.copy)); toast('คัดลอกลิงก์แล้ว'); } catch (x) { toast(urlOf(b.dataset.copy)); } } };
    } catch (e) { console.warn(e); }
}
