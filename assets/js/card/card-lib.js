// Digital business card: shared renderer used by the public page (card.html) and the back-office editor preview.
// Everything that goes into the DOM is escaped; every link is validated (http/https/tel/mailto only).
export const COMPANY = {
    th: 'บริษัท คิทเท่น โค้ด จำกัด', en: 'KITTEN CODE Co.,Ltd',
    taglineTh: 'ก้าวข้ามขีดจำกัดของเทคโนโลยี เพื่อสร้างความเป็นไปได้ใหม่', taglineEn: 'Beyond Technology, Creating Possibilities.',
    address: '347/11 M.3 THAPHO PHITSANULOK 65000', phone: '+66 8 0885 0555', email: 'kittencode.co.ltd@gmail.com'
};
export const ACCENTS = [['blue', 'น้ำเงิน'], ['violet', 'ม่วง'], ['green', 'เขียว'], ['amber', 'ส้ม'], ['rose', 'ชมพู'], ['ink', 'ดำ']];
const LOGO = new URL('../../img/LOGO-KittenCode.png', import.meta.url).href;

const T = {
    th: { save: 'บันทึกลงรายชื่อติดต่อ', share: 'แชร์', qr: 'QR', back: 'กลับ', call: 'โทร', mail: 'อีเมล', line: 'LINE', web: 'เว็บไซต์', scan: 'สแกนเพื่อเปิดนามบัตรนี้', copied: 'คัดลอกลิงก์แล้ว', saved: 'ดาวน์โหลดไฟล์รายชื่อแล้ว', lang: 'EN', phone: 'โทรศัพท์', address: 'ที่อยู่' },
    en: { save: 'Save to contacts', share: 'Share', qr: 'QR', back: 'Back', call: 'Call', mail: 'Email', line: 'LINE', web: 'Website', scan: 'Scan to open this card', copied: 'Link copied', saved: 'Contact file downloaded', lang: 'ไทย', phone: 'Phone', address: 'Address' }
};
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function webUrl(v) {
    v = String(v || '').trim(); if (!v) return '';
    if (!/^https?:\/\//i.test(v)) { if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ''; v = 'https://' + v.replace(/^\/+/, ''); }
    try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (e) { return ''; }
}
const handleUrl = (v, base) => { v = String(v || '').trim(); if (!v) return ''; return /^@?[\w.]{1,40}$/.test(v) ? base + v.replace(/^@/, '') : webUrl(v); };
export const igUrl = (v) => handleUrl(v, 'https://instagram.com/');
export const fbUrl = (v) => handleUrl(v, 'https://facebook.com/');
export const lineUrl = (v) => { v = String(v || '').trim(); if (!v) return ''; if (/^https?:/i.test(v)) return webUrl(v); return v.startsWith('@') ? 'https://line.me/R/ti/p/' + encodeURIComponent(v) : 'https://line.me/ti/p/~' + encodeURIComponent(v); };
export const telHref = (v) => { const n = String(v || '').replace(/[^\d+]/g, ''); return n ? 'tel:' + n : ''; };
const mailHref = (v) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(String(v || '').trim()) ? 'mailto:' + v.trim() : '';
const short = (u) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;

function names(d, lang) { const en = lang === 'en'; return { name: (en && d.nameEn) || d.name || d.nameEn || '', pos: (en && d.positionEn) || d.position || d.positionEn || '' }; }
function initial(n) { const s = [...String(n).trim()].filter(c => !/[เแโใไ"'()\s]/.test(c))[0] || [...String(n).trim()][0] || '?'; return s.toUpperCase(); }

export function cardHtml(d, lang = 'th') {
    const t = T[lang], { name, pos } = names(d, lang);
    const phone = telHref(d.phone), mail = mailHref(d.email), line = lineUrl(d.line), web = webUrl(d.website), fb = fbUrl(d.facebook), ig = igUrl(d.instagram);
    const act = (href, icon, label, ext) => href ? `<a class="kc-act" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}><i class="bi ${icon}"></i><span>${esc(label)}</span></a>` : '';
    const row = (href, icon, text, ext) => text ? `<li style="--i:%I%"><${href ? 'a' : 'div'} class="kc-row"${href ? ` href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}` : ''}><i class="bi ${icon}"></i><span>${esc(text)}</span></${href ? 'a' : 'div'}></li>` : '';
    const rows = [row(phone, 'bi-telephone', d.phone), row(mail, 'bi-envelope', d.email), row(line, 'bi-chat-dots', d.line && 'LINE: ' + d.line, 1), row(web, 'bi-globe2', web && short(web), 1),
    row(fb, 'bi-facebook', fb && short(fb), 1), row(ig, 'bi-instagram', ig && '@' + short(ig).replace(/^instagram\.com\//, '').split(/[/?]/)[0], 1), row('', 'bi-geo-alt', d.address)].filter(Boolean).map((r, i) => r.replace('%I%', i)).join('');
    const co = lang === 'en' ? COMPANY.en : COMPANY.th;
    return `<div class="kc-flip">
    <section class="kc-face kc-front">
        <div class="kc-top"><div class="kc-brand"><img src="${esc(LOGO)}" alt=""><span>KITTEN CODE</span></div>
            <button type="button" class="kc-lang" data-kc="lang" aria-label="Language">${esc(t.lang)}</button></div>
        <div class="kc-avatar" aria-hidden="true"><span>${esc(initial(name))}</span></div>
        <div class="kc-id"><h1>${esc(name || '—')}</h1>${pos ? `<p class="kc-pos">${esc(pos)}</p>` : ''}<p class="kc-co">${esc(co)}</p>${d.tagline ? `<p class="kc-tag">${esc(d.tagline)}</p>` : ''}</div>
        <div class="kc-acts">${act(phone, 'bi-telephone-fill', t.call)}${act(line, 'bi-chat-dots-fill', t.line, 1)}${act(mail, 'bi-envelope-fill', t.mail)}${act(web, 'bi-globe2', t.web, 1)}</div>
        ${rows ? `<ul class="kc-list">${rows}</ul>` : ''}
        <div class="kc-cta"><button type="button" class="kc-main" data-kc="save"><i class="bi bi-person-plus-fill"></i> ${esc(t.save)}</button>
            <button type="button" class="kc-ghost" data-kc="share" aria-label="${esc(t.share)}"><i class="bi bi-share"></i></button>
            <button type="button" class="kc-ghost" data-kc="flip" aria-label="QR"><i class="bi bi-qr-code"></i></button></div>
    </section>
    <section class="kc-face kc-back" aria-hidden="true" inert>
        <div class="kc-qrbox"><div class="kc-qr" data-kc="qr"></div></div>
        <p class="kc-scan">${esc(t.scan)}</p><p class="kc-qname">${esc(name)}</p>
        <button type="button" class="kc-main" data-kc="flip"><i class="bi bi-arrow-left"></i> ${esc(t.back)}</button>
    </section></div>`;
}

export function vcard(d, lang = 'th') {
    const { name, pos } = names(d, lang);
    const e = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');
    const parts = String(name).trim().split(/\s+/), first = parts[0] || '', last = parts.slice(1).join(' ');
    const web = webUrl(d.website), line = lineUrl(d.line);
    const L = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(last)};${e(first)};;;`, `FN:${e(name)}`, `ORG:${e(lang === 'en' ? COMPANY.en : COMPANY.th)}`];
    if (pos) L.push(`TITLE:${e(pos)}`);
    if (telHref(d.phone)) L.push(`TEL;TYPE=CELL:${String(d.phone).replace(/[^\d+]/g, '')}`);
    if (mailHref(d.email)) L.push(`EMAIL;TYPE=INTERNET:${d.email.trim()}`);
    if (web) L.push(`URL:${web}`); if (line) L.push(`URL;TYPE=LINE:${line}`);
    if (fbUrl(d.facebook)) L.push(`URL;TYPE=Facebook:${fbUrl(d.facebook)}`); if (igUrl(d.instagram)) L.push(`URL;TYPE=Instagram:${igUrl(d.instagram)}`);
    if (d.address) L.push(`ADR;TYPE=WORK:;;${e(d.address)};;;;`);
    if (d.tagline) L.push(`NOTE:${e(d.tagline)}`);
    L.push('END:VCARD'); return L.join('\r\n') + '\r\n';
}

function download(text, file, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
export function makeQr(el, url, size = 200) {
    el.innerHTML = ''; if (!window.QRCode) { el.textContent = url; return; }
    new window.QRCode(el, { text: url, width: size, height: size, colorDark: '#1c1b19', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
}

/** Mounts a card into `root`. opts: { url, lang, onToast, preview } — returns { update(d), setLang(l) }. */
export function mountCard(root, data, opts = {}) {
    let d = data, lang = opts.lang || 'th'; const urlNow = () => (typeof opts.url === 'function' ? opts.url() : opts.url) || location.href; const say = opts.onToast || (() => { });
    root.classList.add('kc-card');
    const draw = () => {
        const flipped = root.classList.contains('flipped');
        root.dataset.accent = ACCENTS.some(a => a[0] === d.accent) ? d.accent : 'blue';
        root.innerHTML = cardHtml(d, lang); root.classList.toggle('flipped', flipped);
        const back = root.querySelector('.kc-back'); back.inert = !flipped; back.setAttribute('aria-hidden', String(!flipped)); root.querySelector('.kc-front').inert = flipped;
        if (flipped) makeQr(root.querySelector('[data-kc="qr"]'), urlNow());
    };
    const flip = () => {
        const on = root.classList.toggle('flipped'); const f = root.querySelector('.kc-front'), b = root.querySelector('.kc-back');
        f.inert = on; b.inert = !on; b.setAttribute('aria-hidden', String(!on));
        if (on) makeQr(root.querySelector('[data-kc="qr"]'), urlNow());
    };
    root.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-kc]'); if (!b) return; const k = b.dataset.kc; if (k === 'qr') return;
        if (k === 'lang') { lang = lang === 'th' ? 'en' : 'th'; draw(); opts.onLang && opts.onLang(lang); }
        else if (k === 'flip') flip();
        else if (k === 'save') { download(vcard(d, lang), (d.nameEn || d.name || 'contact').replace(/[^\w\u0E00-\u0E7F-]+/g, '_') + '.vcf', 'text/vcard;charset=utf-8'); say(T[lang].saved); }
        else if (k === 'share') {
            const url = urlNow();
            try { if (navigator.share) { await navigator.share({ title: names(d, lang).name, url }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
            try { await navigator.clipboard.writeText(url); say(T[lang].copied); } catch (err) { say(url); }
        }
    });
    draw();
    return { update(nd) { d = nd; draw(); }, setLang(l) { lang = l; draw(); }, get lang() { return lang; } };
}
