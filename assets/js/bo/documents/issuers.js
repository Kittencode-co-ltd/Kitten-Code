/**
 * Who issues a quotation / invoice / receipt / delivery note:
 *   company — บริษัท คิทเท่น โค้ด จำกัด (juristic person, VAT as configured on the document)
 *   shop    — คิทเท่น โค้ด (ทะเบียนพาณิชย์, sole proprietor, not VAT-registered)
 * Classic script; exposes window.KCIssuers. Saved documents store `issuer: 'company' | 'shop'`
 * (documents saved before this existed have no field and are treated as 'company').
 */
(function () {
    'use strict';
    const ADDRESS = 'ที่อยู่: 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000';
    const CONTACT = 'โทร : <span>+66 8 0885 0555</span> &nbsp;&nbsp; อีเมล : <span>kittencode.co.ltd@gmail.com</span>';
    const ISSUERS = {
        company: {
            key: 'company', label: 'บริษัท คิทเท่น โค้ด จำกัด', kind: 'นิติบุคคล', short: 'บริษัท', vat: 7, vatRegistered: true, prefixSuffix: '',
            nameTh: 'บริษัท คิทเท่น โค้ด จำกัด', nameEn: 'KITTEN CODE Co.,Ltd', owner: '', bankHolder: 'บริษัท คิทเท่น โค้ด จำกัด',
            taxLabel: 'เลขประจำตัวผู้เสียภาษีอากร', taxId: '0655569001411'
        },
        shop: {
            key: 'shop', label: 'คิทเท่น โค้ด (ทะเบียนพาณิชย์)', kind: 'บุคคลธรรมดา', short: 'พาณิชย์', vat: 0, vatRegistered: false, prefixSuffix: '-S',
            bankHolder: 'คิทเท่น โค้ด', nameTh: 'คิทเท่น โค้ด', nameEn: 'Kitten Code', owner: 'ประกอบกิจการโดย นางสาวพิมพ์สิริ อนุรักษ์ชนะชัย',
            taxLabel: 'เลขประจำตัวผู้เสียภาษีอากร / ทะเบียนพาณิชย์', taxId: '1659902192591'
        }
    };
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const get = (k) => ISSUERS[k] || ISSUERS.company;

    /** Inner HTML of the `.company-details` block in the A4 header. */
    function detailsHtml(k) {
        const i = get(k);
        return `<h1 class="company-name">${esc(i.nameTh)}</h1><p class="company-name-en">${esc(i.nameEn)}</p>`
            + (i.owner ? `<p class="company-owner" style="margin:0;font-size:12px;">${esc(i.owner)}</p>` : '')
            + `<p class="company-address">${ADDRESS}</p><p class="company-contact">${CONTACT}</p>`
            + `<p class="company-tax-id">${esc(i.taxLabel)} : <span>${esc(i.taxId)}</span></p>`;
    }

    /**
     * Wire the "issue as" <select id="in-issuer"> on an editor page: switching to the shop turns VAT off,
     * switching back restores 7 %, and re-suggests the next document number in the matching series.
     */
    function bind(type, onChange) {
        const sel = document.getElementById('in-issuer');
        if (!sel) return;
        const vat = document.getElementById('in-doc-vat');
        const apply = (userChange) => {
            const i = get(sel.value);
            if (vat) {
                if (userChange) vat.value = String(i.vat);
                vat.readOnly = !i.vatRegistered; vat.title = i.vatRegistered ? '' : 'พาณิชย์ไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม';
            }
            const no = document.getElementById('in-doc-no');
            if (userChange && no && window.KCDoc && !window.KCDoc.isEditing() && (!no.value.trim() || /^[A-Z]+(-S)?-\d{4}-\d{3}$/.test(no.value.trim()))) {
                no.value = ''; window.KCDoc.ensureDocNo(type);
            }
            if (onChange) onChange(i);
        };
        sel.addEventListener('change', () => apply(true));
        apply(false);
    }

    window.KCIssuers = { ISSUERS, get, detailsHtml, bind, ADDRESS };
})();
