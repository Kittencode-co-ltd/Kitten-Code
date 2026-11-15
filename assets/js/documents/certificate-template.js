// ============================================================
//  certificate-template.js — shared A4 renderer for
//  หนังสือรับรองการทำงาน (employment) / หนังสือรับรองการฝึกงาน (internship)
//
//  Used by back-office/certificate.html (live preview) and
//  back-office/document-viewer.html (re-print from Document Record).
//  Exposes window.KCCertificate = { render, TYPES, ... }.
//  All values are raw text; escaping happens here at render time.
// ============================================================
(function () {
    'use strict';

    const TYPES = {
        employment: { title: 'หนังสือรับรองการทำงาน', titleEn: 'Certificate of Employment', short: 'รับรองการทำงาน' },
        internship: { title: 'หนังสือรับรองการฝึกงาน', titleEn: 'Certificate of Internship', short: 'รับรองการฝึกงาน' }
    };

    const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const escapeHTML = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
    };

    // "YYYY-MM-DD" -> Date (local, no timezone shift)
    function parseDate(s) {
        if (!s || typeof s !== 'string') return null;
        const p = s.split('-');
        if (p.length !== 3) return null;
        const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        return isNaN(d) ? null : d;
    }

    // 2026-11-15 -> "15 พฤศจิกายน พ.ศ. 2569"
    function thaiDateLong(s) {
        const d = parseDate(s);
        if (!d) return '';
        return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    }

    // Inclusive duration between two dates -> "1 ปี 2 เดือน 3 วัน"
    function durationText(startStr, endStr) {
        const start = parseDate(startStr);
        const end = parseDate(endStr);
        if (!start || !end || end < start) return '';
        const endIncl = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
        let y = endIncl.getFullYear() - start.getFullYear();
        let m = endIncl.getMonth() - start.getMonth();
        let d = endIncl.getDate() - start.getDate();
        if (d < 0) {
            m -= 1;
            d += new Date(endIncl.getFullYear(), endIncl.getMonth(), 0).getDate();
        }
        if (m < 0) { y -= 1; m += 12; }
        const parts = [];
        if (y > 0) parts.push(`${y} ปี`);
        if (m > 0) parts.push(`${m} เดือน`);
        if (d > 0) parts.push(`${d} วัน`);
        return parts.join(' ');
    }

    function formatMoney(n) {
        return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function bahtText(amount) {
        const n = Math.round((Number(amount) || 0) * 100) / 100;
        if (n === 0) return 'ศูนย์บาทถ้วน';
        const NUM = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
        const POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
        const readInt = (str) => {
            str = String(str).replace(/^0+/, '');
            if (!str) return '';
            if (str.length > 6) {
                return readInt(str.slice(0, -6)) + 'ล้าน' + readInt(str.slice(-6));
            }
            let out = '';
            const len = str.length;
            for (let i = 0; i < len; i++) {
                const digit = Number(str[i]);
                const pos = len - i - 1;
                if (digit === 0) continue;
                if (pos === 1 && digit === 1) out += 'สิบ';
                else if (pos === 1 && digit === 2) out += 'ยี่สิบ';
                else if (pos === 0 && digit === 1 && len > 1) out += 'เอ็ด';
                else out += NUM[digit] + POS[pos];
            }
            return out;
        };
        const [intPart, decRaw = ''] = n.toFixed(2).split('.');
        const satang = Number(decRaw);
        let text = intPart !== '0' ? readInt(intPart) + 'บาท' : '';
        text += satang ? readInt(String(satang)) + 'สตางค์' : 'ถ้วน';
        return text;
    }

    const COMPANY_HEADER = `
        <div class="header-section-centered">
            <img src="../assets/img/LOGO-KittenCode.png" class="cert-logo-center" alt="Kitten Code Logo" onerror="this.style.display='none'">
            <h1 class="cert-company-name">บริษัท คิทเช่น โค้ด จำกัด (Kitten Code Co., Ltd.)</h1>
            <p class="cert-company-address">สำนักงานใหญ่ : 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</p>
            <p class="cert-company-contact">
                โทรศัพท์ : <span>+66 8 0885 0555</span> &nbsp;·&nbsp;
                อีเมล : <span>kittencode.co.ltd@gmail.com</span> &nbsp;·&nbsp;
                เลขประจำตัวผู้เสียภาษีอากร : <span>0655569001411</span>
            </p>
        </div>`;

    const b = (v) => `<strong>${escapeHTML(v)}</strong>`;

    function buildBody(d) {
        const company = d.companyName || 'บริษัท';
        const person = `${d.namePrefix || ''}${d.personName || '..............................'}`;
        const paragraphs = [];

        if (d.certType === 'internship') {
            let p = `หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า ${b(person)}`;
            if (d.studentId) p += ` รหัสนักศึกษา ${escapeHTML(d.studentId)}`;
            const edu = [];
            if (d.major) edu.push(`สาขาวิชา${escapeHTML(d.major)}`);
            if (d.faculty) edu.push(`คณะ${escapeHTML(d.faculty)}`);
            if (d.institution) edu.push(escapeHTML(d.institution));
            if (edu.length) p += ` นักศึกษา${edu.join(' ')}`;
            p += ` ได้เข้ารับการฝึกงานกับ ${b(company)}`;
            if (d.position) p += ` ในตำแหน่ง ${b(d.position)}`;
            if (d.department) p += ` ฝ่าย${escapeHTML(d.department)}`;
            if (d.startDate) p += ` ตั้งแต่วันที่ ${escapeHTML(thaiDateLong(d.startDate))}`;
            if (d.endDate) p += ` ถึงวันที่ ${escapeHTML(thaiDateLong(d.endDate))}`;
            const dur = durationText(d.startDate, d.endDate);
            if (dur) p += ` รวมระยะเวลา ${escapeHTML(dur)}`;
            if (d.totalHours) p += ` (รวม ${escapeHTML(d.totalHours)} ชั่วโมง)`;
            paragraphs.push(p);
        } else {
            let p = `หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า ${b(person)}`;
            if (d.idCard) p += ` เลขประจำตัวประชาชน ${escapeHTML(d.idCard)}`;
            p += ` เป็นพนักงานของ ${b(company)}`;
            if (d.startDate) p += ` ตั้งแต่วันที่ ${escapeHTML(thaiDateLong(d.startDate))}`;
            const endForDuration = d.stillEmployed ? d.docDate : d.endDate;
            if (d.stillEmployed) p += ' จนถึงปัจจุบัน';
            else if (d.endDate) p += ` ถึงวันที่ ${escapeHTML(thaiDateLong(d.endDate))}`;
            const dur = durationText(d.startDate, endForDuration);
            if (dur) p += ` รวมระยะเวลา ${escapeHTML(dur)}`;
            if (d.position) {
                p += d.stillEmployed ? ` ปัจจุบันดำรงตำแหน่ง ${b(d.position)}` : ` ในตำแหน่ง ${b(d.position)}`;
            }
            if (d.department) p += ` ฝ่าย${escapeHTML(d.department)}`;
            if (d.showSalary && Number(d.salary) > 0) {
                p += ` ได้รับเงินเดือนอัตราเดือนละ ${b(formatMoney(d.salary))} บาท (${escapeHTML(bahtText(d.salary))})`;
            }
            paragraphs.push(p);
        }

        if (d.duties) {
            paragraphs.push(`<strong>หน้าที่ความรับผิดชอบ :</strong> <span style="white-space: pre-wrap;">${escapeHTML(d.duties)}</span>`);
        }
        if (d.evaluation) {
            paragraphs.push(`<span style="white-space: pre-wrap;">${escapeHTML(d.evaluation)}</span>`);
        }

        paragraphs.push(d.purpose
            ? `หนังสือรับรองฉบับนี้ออกให้เพื่อใช้ประกอบ${escapeHTML(d.purpose)}`
            : 'จึงออกหนังสือรับรองฉบับนี้ให้ไว้เพื่อเป็นหลักฐาน');

        return paragraphs.map(p => `<p class="cert-paragraph">${p}</p>`).join('');
    }

    /**
     * Render one A4 certificate page.
     * @param {object} d   certificate data (see script-certificate.js collectData)
     * @param {object} [opts] { isReprint: boolean }
     * @returns {HTMLElement}
     */
    function render(d, opts = {}) {
        d = d || {};
        const type = TYPES[d.certType] || TYPES.employment;
        const page = document.createElement('div');
        page.className = 'a4-page cert-page';

        page.innerHTML = `
            <style>
                .cert-page::before,
                .cert-page .page-top-border { display: none !important; }
                .cert-page .content-wrapper { padding: 20mm 22mm 20mm 24mm !important; color: #111827; }
                .cert-page .header-section-centered { text-align: center; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1.5px solid #cbd5e1; }
                .cert-page .cert-logo-center { width: 76px; height: 76px; object-fit: contain; display: block; margin: 0 auto 8px auto; }
                .cert-page .cert-company-name { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 3px 0; letter-spacing: 0.01em; }
                .cert-page .cert-company-address,
                .cert-page .cert-company-contact { font-size: 11.5px; color: #334155; margin: 0; line-height: 1.55; }
                .cert-page .cert-company-contact span { font-weight: 600; color: #0f172a; }
                .cert-page .cert-paragraph { text-indent: 2.5cm; line-height: 2; font-size: 15px; margin: 0 0 12px 0; color: #111827; text-align: justify; }
                .cert-page .cert-meta { display: flex; justify-content: flex-end; font-size: 14.5px; margin: 4px 0 18px 0; color: #111827; }
                .cert-page .cert-title { text-align: center; font-size: 22px; font-weight: 700; margin: 0 0 4px 0; letter-spacing: 0.02em; color: #111827; }
                .cert-page .cert-title-en { text-align: center; font-size: 12.5px; color: #475569; margin: 0 0 24px 0; letter-spacing: 0.06em; text-transform: uppercase; }
                .cert-page .cert-given { text-align: center; font-size: 15px; margin: 20px 0 0 0; color: #111827; }
                .cert-page .cert-sign { margin-left: auto; width: 290px; text-align: center; font-size: 15px; line-height: 1.8; margin-top: 36px; color: #111827; }
                .cert-page .cert-sign .sig-space { height: 60px; }
            </style>
            <div class="page-top-border"></div>
            ${opts.isReprint ? '<div class="watermark-reprint">ฉบับสำเนา (COPY)</div>' : ''}
            <div class="content-wrapper">
                ${COMPANY_HEADER}
                <div class="cert-meta">
                    <div><strong>เลขที่</strong> ${escapeHTML(d.docNo || '-')}</div>
                </div>
                <h2 class="cert-title">${type.title}</h2>
                <div class="cert-title-en">${type.titleEn}</div>
                ${buildBody(d)}
                <p class="cert-given">ให้ไว้ ณ วันที่ ${escapeHTML(thaiDateLong(d.docDate) || '-')}</p>
                <div class="cert-sign">
                    <div>ขอแสดงความนับถือ</div>
                    <div class="sig-space"></div>
                    <div>(${escapeHTML(d.signName || '..............................................')})</div>
                    <div>${escapeHTML(d.signPosition || '')}</div>
                    <div>${escapeHTML(d.companyName || '')}</div>
                </div>
            </div>`;
        return page;
    }

    window.KCCertificate = { render, TYPES, thaiDateLong, durationText, bahtText, escapeHTML };
})();
