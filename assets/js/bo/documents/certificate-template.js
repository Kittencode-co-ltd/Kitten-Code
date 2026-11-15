// ============================================================
//  certificate-template.js — shared A4 renderer for:
//  1) หนังสือรับรองแนวตั้ง (A4 Portrait 210×297mm):
//     - employment : หนังสือรับรองการทำงาน
//     - internship : หนังสือรับรองการฝึกงาน
//  2) ประกาศนียบัตร / เกียรติบัตร แนวนอน (A4 Landscape 297×210mm):
//     - award_training          : ประกาศนียบัตรผ่านการอบรม / เวิร์กชอป
//     - award_speaker           : เกียรติบัตรขอบคุณวิทยากร / ที่ปรึกษา
//     - award_competition       : เกียรติบัตรรางวัลการแข่งขัน / ผลงานดีเด่น
//     - award_participation     : เกียรติบัตรเข้าร่วมโครงการ / สัมมนา
//     - award_partner           : เกียรติบัตรขอบคุณหน่วยงานพันธมิตร / ผู้สนับสนุน
//     - award_intern_excellence : ประกาศนียบัตรสำเร็จการฝึกงาน (แนวนอน)
//
//  Used by back-office/certificate.html (live preview & PDF export) and
//  back-office/document-viewer.html (re-print from Document Record).
//  Exposes window.KCCertificate = { render, TYPES, THEMES, isLandscapeCert, buildLandscapeDraft, ... }.
//  All values are raw text; escaping happens here at render time.
// ============================================================
(function () {
    'use strict';

    const TYPES = {
        // ---- แนวตั้ง (A4 Portrait) ----
        employment: {
            orientation: 'portrait',
            icon: 'fa-user-tie',
            title: 'หนังสือรับรองการทำงาน',
            titleEn: 'Certificate of Employment',
            short: 'รับรองการทำงาน'
        },
        internship: {
            orientation: 'portrait',
            icon: 'fa-user-graduate',
            title: 'หนังสือรับรองการฝึกงาน',
            titleEn: 'Certificate of Internship',
            short: 'รับรองการฝึกงาน'
        },

        // ---- แนวนอน (A4 Landscape 297×210mm — ประกาศนียบัตร / เกียรติบัตร) ----
        award_training: {
            orientation: 'landscape',
            icon: 'fa-graduation-cap',
            title: 'ประกาศนียบัตร',
            titleEn: 'CERTIFICATE OF COMPLETION',
            short: 'ผ่านการอบรม / เวิร์กชอป'
        },
        award_speaker: {
            orientation: 'landscape',
            icon: 'fa-chalkboard-teacher',
            title: 'เกียรติบัตร',
            titleEn: 'CERTIFICATE OF APPRECIATION',
            short: 'ขอบคุณวิทยากร / ที่ปรึกษา'
        },
        award_competition: {
            orientation: 'landscape',
            icon: 'fa-trophy',
            title: 'เกียรติบัตร',
            titleEn: 'CERTIFICATE OF ACHIEVEMENT',
            short: 'รางวัลการแข่งขัน / ผลงานดีเด่น'
        },
        award_participation: {
            orientation: 'landscape',
            icon: 'fa-certificate',
            title: 'เกียรติบัตร',
            titleEn: 'CERTIFICATE OF PARTICIPATION',
            short: 'เข้าร่วมโครงการ / สัมมนา'
        },
        award_partner: {
            orientation: 'landscape',
            icon: 'fa-handshake',
            title: 'เกียรติบัตร',
            titleEn: 'CERTIFICATE OF APPRECIATION',
            short: 'ขอบคุณหน่วยงานพันธมิตร'
        },
        award_intern_excellence: {
            orientation: 'landscape',
            icon: 'fa-medal',
            title: 'ประกาศนียบัตร',
            titleEn: 'CERTIFICATE OF INTERNSHIP EXCELLENCE',
            short: 'สำเร็จการฝึกงาน (แนวนอน)'
        }
    };

    const THEMES = {
        gold: {
            label: 'ทอง-กรมท่า (Royal Gold)',
            primary: '#0f2942',
            accent: '#b8860b',
            accentLight: '#e6c665',
            borderOuter: '#0f2942',
            borderInner: '#c59b27',
            bgTint: '#fffdf7',
            cornerColor: '#b8860b',
            sealBg: '#b8860b'
        },
        blue: {
            label: 'น้ำเงิน Kitten Code (Azure)',
            primary: '#0f172a',
            accent: '#0a72e8',
            accentLight: '#60a5fa',
            borderOuter: '#1e3a8a',
            borderInner: '#0a72e8',
            bgTint: '#f8fbff',
            cornerColor: '#0a72e8',
            sealBg: '#0a72e8'
        },
        orange: {
            label: 'ส้ม-กรมท่า (Kitten Signature)',
            primary: '#1a3a5c',
            accent: '#f26522',
            accentLight: '#fb923c',
            borderOuter: '#1a3a5c',
            borderInner: '#f26522',
            bgTint: '#fffaf6',
            cornerColor: '#f26522',
            sealBg: '#f26522'
        },
        emerald: {
            label: 'เขียวมรกต (Academic Emerald)',
            primary: '#064e3b',
            accent: '#059669',
            accentLight: '#34d399',
            borderOuter: '#064e3b',
            borderInner: '#059669',
            bgTint: '#f7fdfa',
            cornerColor: '#059669',
            sealBg: '#059669'
        }
    };

    const isLandscapeCert = (t) => !!(TYPES[t] && TYPES[t].orientation === 'landscape');

    const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const escapeHTML = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
    };

    function parseDate(s) {
        if (!s || typeof s !== 'string') return null;
        const p = s.split('-');
        if (p.length !== 3) return null;
        const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        return isNaN(d) ? null : d;
    }

    function thaiDateLong(s) {
        const d = parseDate(s);
        if (!d) return '';
        return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    }

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

    // ============================================================
    //  1) PORTRAIT CERTIFICATE (หนังสือรับรองการทำงาน / ฝึกงาน)
    // ============================================================
    const COMPANY_HEADER = `
        <div class="header-section-centered">
            <img src="../assets/img/LOGO-KittenCode.png" class="cert-logo-center" alt="Kitten Code Logo" onerror="this.style.display='none'">
            <h1 class="cert-company-name">บริษัท คิทเท่น โค้ด จำกัด (KITTEN CODE Co.,Ltd)</h1>
            <p class="cert-company-address">สำนักงานใหญ่ : 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</p>
            <p class="cert-company-contact">
                โทรศัพท์ : <span>+66 8 0885 0555</span> &nbsp;·&nbsp;
                อีเมล : <span>kittencode.co.ltd@gmail.com</span> &nbsp;·&nbsp;
                เลขประจำตัวผู้เสียภาษีอากร : <span>0655569001411</span>
            </p>
        </div>`;

    const b = (v) => `<strong>${escapeHTML(v)}</strong>`;

    function buildPortraitBody(d) {
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

    // ============================================================
    //  2) LANDSCAPE CERTIFICATE / DIPLOMA (ประกาศนียบัตร / เกียรติบัตร แนวนอน)
    // ============================================================
    function buildLandscapeDraft(d) {
        d = d || {};
        const cType = d.certType || 'award_training';
        const info = TYPES[cType] || TYPES.award_training;
        const eventTitle = d.eventTitle || 'โครงการพัฒนาศักยภาพด้านเทคโนโลยีดิจิทัลและนวัตกรรมซอฟต์แวร์';
        const awardRank = d.awardRank || '';
        const hoursTxt = d.totalHours ? ` รวมระยะเวลา ${d.totalHours} ชั่วโมง` : '';

        let dateRangeTxt = '';
        if (d.startDate && d.endDate && d.startDate !== d.endDate) {
            dateRangeTxt = ` ระหว่างวันที่ ${thaiDateLong(d.startDate)} ถึงวันที่ ${thaiDateLong(d.endDate)}`;
        } else if (d.startDate) {
            dateRangeTxt = ` เมื่อวันที่ ${thaiDateLong(d.startDate)}`;
        }

        if (cType === 'award_speaker') {
            return {
                awardHeader: info.title,
                awardHeaderEn: info.titleEn,
                awardLead: 'ขอมอบเกียรติบัตรฉบับนี้ไว้เพื่อแสดงความขอบคุณ',
                awardReason: `ที่ได้ให้ความอนุเคราะห์เป็น${awardRank || 'วิทยากรผู้ทรงคุณวุฒิ'}บรรยายและถ่ายทอดองค์ความรู้ใน "${eventTitle}"${dateRangeTxt}`,
                awardBlessing: 'ขอขอบพระคุณในความเสียสละและคุณูปการอันเป็นประโยชน์ยิ่ง ขออำนวยพรให้ท่านประสบแต่ความสุข ความเจริญรุ่งเรืองสืบไป'
            };
        }
        if (cType === 'award_competition') {
            return {
                awardHeader: info.title,
                awardHeaderEn: info.titleEn,
                awardLead: 'ขอมอบเกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า',
                awardReason: `ได้รับรางวัล "${awardRank || 'ชนะเลิศ'}" ในการแข่งขัน "${eventTitle}"${dateRangeTxt}`,
                awardBlessing: 'ขอชื่นชมในความคิดสร้างสรรค์ ความสามารถ และความมุ่งมั่นตั้งใจ ขอให้ประสบความสำเร็จยิ่งขึ้นไป'
            };
        }
        if (cType === 'award_participation') {
            return {
                awardHeader: info.title,
                awardHeaderEn: info.titleEn,
                awardLead: 'ขอมอบเกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า',
                awardReason: `ได้เข้าร่วมกิจกรรมและแลกเปลี่ยนองค์ความรู้ใน "${eventTitle}"${hoursTxt}${dateRangeTxt}`,
                awardBlessing: 'ขอให้มีความเจริญก้าวหน้าในการศึกษา การปฏิบัติงาน และประสบความสำเร็จในสิ่งที่มุ่งหวังทุกประการ'
            };
        }
        if (cType === 'award_partner') {
            return {
                awardHeader: info.title,
                awardHeaderEn: info.titleEn,
                awardLead: 'ขอมอบเกียรติบัตรฉบับนี้ไว้เพื่อแสดงความขอบคุณ',
                awardReason: `ที่ได้ให้ความร่วมมือและสนับสนุนการดำเนินงาน "${eventTitle}"${dateRangeTxt} ด้วยดียิ่ง`,
                awardBlessing: 'บริษัทฯ ขอขอบพระคุณในไมตรีจิตและความร่วมมืออันดียิ่ง และหวังเป็นอย่างยิ่งว่าจะได้ร่วมสร้างสรรค์ประโยชน์ร่วมกันสืบไป'
            };
        }
        if (cType === 'award_intern_excellence') {
            const posTxt = d.position ? ` ในตำแหน่ง ${d.position}` : '';
            return {
                awardHeader: info.title,
                awardHeaderEn: info.titleEn,
                awardLead: 'ขอมอบประกาศนียบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า',
                awardReason: `ได้ผ่านการฝึกปฏิบัติงานสหกิจศึกษา / ฝึกงานด้านเทคโนโลยีดิจิทัล${posTxt}${hoursTxt}${dateRangeTxt}`,
                awardBlessing: 'ด้วยความวิริยะอุตสาหะ มีวินัย และมีผลการปฏิบัติงานในระดับดีเยี่ยม ขอให้ประสบความสำเร็จในวิชาชีพสืบไป'
            };
        }
        // Default: award_training
        return {
            awardHeader: info.title,
            awardHeaderEn: info.titleEn,
            awardLead: 'ขอมอบประกาศนียบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า',
            awardReason: `ได้ผ่านการอบรมและพัฒนาทักษะในหลักสูตร "${eventTitle}"${hoursTxt}${dateRangeTxt}`,
            awardBlessing: 'เป็นผู้มีความมุ่งมั่นตั้งใจในการเรียนรู้และพัฒนาทักษะทางเทคโนโลยีดิจิทัล ขอให้ประสบความสำเร็จและมีความเจริญก้าวหน้าสืบไป'
        };
    }

    function renderLandscape(d, opts = {}) {
        const defaults = buildLandscapeDraft(d);
        const themeKey = (d.certTheme && THEMES[d.certTheme]) ? d.certTheme : 'gold';
        const th = THEMES[themeKey];

        const company = d.companyName || 'บริษัท คิทเท่น โค้ด จำกัด (KITTEN CODE Co.,Ltd)';
        const headerTitle = d.awardHeader || defaults.awardHeader;
        const headerTitleEn = d.awardHeaderEn || defaults.awardHeaderEn;
        const leadText = d.awardLead || defaults.awardLead;
        const recipientFull = `${d.namePrefix || ''}${d.personName || '......................................................'}`.trim();
        const recipientSub = d.recipientSub || d.institution || '';
        const reasonText = d.awardReason || defaults.awardReason;
        const blessingText = d.awardBlessing || defaults.awardBlessing;
        const givenDate = thaiDateLong(d.docDate) || '-';
        const hasCoSign = Boolean(d.coSignName && d.coSignName.trim());
        const showSeal = d.showSeal !== false;

        const sealHtml = showSeal ? `
            <div class="lc-seal">
                <div class="lc-seal-ribbons">
                    <span class="lc-ribbon lc-ribbon-l"></span>
                    <span class="lc-ribbon lc-ribbon-r"></span>
                </div>
                <div class="lc-seal-disc">
                    <div class="lc-seal-inner">
                        <div class="lc-seal-stars">★ ★ ★</div>
                        <div class="lc-seal-brand">KITTEN CODE</div>
                        <div class="lc-seal-sub">OFFICIAL SEAL</div>
                    </div>
                </div>
            </div>` : '<div></div>';

        const sigBlockHtml = hasCoSign ? `
            <div class="lc-footer-grid lc-footer-dual">
                <div class="lc-sign-col">
                    <div class="lc-sig-line"></div>
                    <div class="lc-sig-name">(${escapeHTML(d.signName || '..............................................')})</div>
                    <div class="lc-sig-pos">${escapeHTML(d.signPosition || 'กรรมการผู้จัดการ')}</div>
                    <div class="lc-sig-org">${escapeHTML(company)}</div>
                </div>
                ${sealHtml}
                <div class="lc-sign-col">
                    <div class="lc-sig-line"></div>
                    <div class="lc-sig-name">(${escapeHTML(d.coSignName)})</div>
                    <div class="lc-sig-pos">${escapeHTML(d.coSignPosition || '')}</div>
                    <div class="lc-sig-org">${escapeHTML(d.coSignOrg || '')}</div>
                </div>
            </div>
        ` : `
            <div class="lc-footer-grid lc-footer-single">
                ${sealHtml}
                <div class="lc-sign-col">
                    <div class="lc-sig-line"></div>
                    <div class="lc-sig-name">(${escapeHTML(d.signName || '..............................................')})</div>
                    <div class="lc-sig-pos">${escapeHTML(d.signPosition || 'กรรมการผู้จัดการ')}</div>
                    <div class="lc-sig-org">${escapeHTML(company)}</div>
                </div>
            </div>
        `;

        const page = document.createElement('div');
        page.className = 'a4-page cert-page cert-landscape';
        page.innerHTML = `
            <style>
                .a4-page.cert-landscape {
                    width: 297mm !important;
                    height: 210mm !important;
                    min-height: 210mm !important;
                    max-height: 210mm !important;
                    background: ${th.bgTint} !important;
                }
                .cert-landscape::before,
                .cert-landscape .page-top-border { display: none !important; }
                .cert-landscape .content-wrapper {
                    width: 297mm !important;
                    height: 210mm !important;
                    max-height: 210mm !important;
                    padding: 11mm 13mm !important;
                    box-sizing: border-box;
                }
                .lc-outer-frame {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border: 3px solid ${th.borderOuter};
                    padding: 4.5mm;
                    box-sizing: border-box;
                    background: linear-gradient(180deg, #ffffff 0%, ${th.bgTint} 100%);
                }
                .lc-inner-frame {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border: 1.5px solid ${th.borderInner};
                    padding: 8mm 16mm 7mm 16mm;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;
                    color: #111827;
                }
                /* Corner ornaments */
                .lc-corner {
                    position: absolute;
                    width: 22px;
                    height: 22px;
                    border-color: ${th.cornerColor};
                    border-style: solid;
                    pointer-events: none;
                }
                .lc-corner.tl { top: 4px; left: 4px; border-width: 3px 0 0 3px; }
                .lc-corner.tr { top: 4px; right: 4px; border-width: 3px 3px 0 0; }
                .lc-corner.bl { bottom: 4px; left: 4px; border-width: 0 0 3px 3px; }
                .lc-corner.br { bottom: 4px; right: 4px; border-width: 0 3px 3px 0; }

                .lc-docno {
                    position: absolute;
                    top: 10px;
                    right: 16px;
                    font-size: 11.5px;
                    color: #475569;
                    font-weight: 600;
                }
                .lc-top-block {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .lc-logo {
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    margin-bottom: 4px;
                }
                .lc-issuer {
                    font-size: 15px;
                    font-weight: 700;
                    color: ${th.primary};
                    letter-spacing: 0.02em;
                    margin-bottom: 6px;
                }
                .lc-title-th {
                    font-size: 34px;
                    font-weight: 700;
                    color: ${th.primary};
                    line-height: 1.15;
                    letter-spacing: 0.06em;
                    margin: 0;
                }
                .lc-title-en {
                    font-size: 12px;
                    font-weight: 700;
                    color: ${th.accent};
                    letter-spacing: 0.24em;
                    text-transform: uppercase;
                    margin-top: 2px;
                }
                .lc-divider {
                    width: 120px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, ${th.borderInner}, transparent);
                    margin: 8px auto 0;
                }

                .lc-body-block {
                    width: 100%;
                    max-width: 225mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }
                .lc-lead {
                    font-size: 15.5px;
                    color: #334155;
                    margin: 0;
                }
                .lc-recipient {
                    font-size: 28px;
                    font-weight: 700;
                    color: ${th.primary};
                    padding: 2px 28px 5px;
                    border-bottom: 1.5px solid ${th.borderInner};
                    margin: 2px 0;
                    line-height: 1.3;
                    min-width: 110mm;
                }
                .lc-recipient-sub {
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    margin-top: 1px;
                }
                .lc-reason {
                    font-size: 16.5px;
                    font-weight: 600;
                    color: #0f172a;
                    line-height: 1.65;
                    margin: 6px 0 0;
                    white-space: pre-wrap;
                }
                .lc-blessing {
                    font-size: 14.5px;
                    color: #334155;
                    line-height: 1.6;
                    margin: 2px 0 0;
                    white-space: pre-wrap;
                }
                .lc-given {
                    font-size: 14px;
                    color: #334155;
                    margin-top: 6px;
                }

                /* Footer Signatures & Seal */
                .lc-footer-grid {
                    width: 100%;
                    display: grid;
                    align-items: end;
                    margin-top: 4px;
                }
                .lc-footer-dual {
                    grid-template-columns: 1fr 140px 1fr;
                    gap: 16px;
                }
                .lc-footer-single {
                    grid-template-columns: 1fr 280px;
                    padding: 0 24mm;
                }
                .lc-sign-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-size: 13.5px;
                    line-height: 1.55;
                    color: #111827;
                }
                .lc-sig-line {
                    width: 200px;
                    height: 36px;
                    border-bottom: 1px dotted #64748b;
                    margin-bottom: 5px;
                }
                .lc-sig-name {
                    font-weight: 700;
                    color: #0f172a;
                }
                .lc-sig-pos {
                    color: #334155;
                    font-size: 13px;
                }
                .lc-sig-org {
                    color: #475569;
                    font-size: 12.5px;
                }

                /* Gold / Accent Seal */
                .lc-seal {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                }
                .lc-seal-disc {
                    width: 74px;
                    height: 74px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, ${th.accentLight}, ${th.sealBg});
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 5px;
                    position: relative;
                    z-index: 2;
                }
                .lc-seal-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 1.5px dashed #ffffff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    line-height: 1.15;
                }
                .lc-seal-stars { font-size: 8px; letter-spacing: 2px; }
                .lc-seal-brand { font-size: 7.5px; font-weight: 800; letter-spacing: 0.06em; margin-top: 2px; }
                .lc-seal-sub { font-size: 6px; letter-spacing: 0.08em; opacity: 0.9; }
                .lc-seal-ribbons {
                    position: absolute;
                    bottom: -10px;
                    display: flex;
                    gap: 10px;
                    z-index: 1;
                }
                .lc-ribbon {
                    width: 14px;
                    height: 22px;
                    background: ${th.primary};
                    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%);
                }
                .lc-ribbon-l { transform: rotate(14deg); }
                .lc-ribbon-r { transform: rotate(-14deg); }

                /* Responsive preview scaling on screen so 297mm wide page fits comfortably */
                @media screen and (min-width: 1300px) {
                    .preview-panel .a4-page.cert-landscape { zoom: 0.78; }
                }
                @media screen and (min-width: 1120px) and (max-width: 1299px) {
                    .preview-panel .a4-page.cert-landscape { zoom: 0.64; }
                }
                @media screen and (min-width: 860px) and (max-width: 1119px) {
                    .preview-panel .a4-page.cert-landscape { zoom: 0.52; }
                }
                @media screen and (max-width: 639px) {
                    .preview-panel .a4-page.cert-landscape { zoom: 0.34; }
                }

                /* Print as true A4 Landscape PDF */
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0mm;
                    }
                    html, body, .preview-panel {
                        width: 297mm !important;
                        height: 210mm !important;
                    }
                    .a4-page.cert-landscape {
                        zoom: 1 !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        min-height: 210mm !important;
                        max-height: 210mm !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .a4-page.cert-landscape .content-wrapper {
                        width: 297mm !important;
                        height: 210mm !important;
                        max-height: 210mm !important;
                    }
                }
            </style>
            ${opts.isReprint ? '<div class="watermark-reprint">ฉบับสำเนา (COPY)</div>' : ''}
            <div class="content-wrapper">
                <div class="lc-outer-frame">
                    <div class="lc-inner-frame">
                        <span class="lc-corner tl"></span>
                        <span class="lc-corner tr"></span>
                        <span class="lc-corner bl"></span>
                        <span class="lc-corner br"></span>
                        <div class="lc-docno">เลขที่ ${escapeHTML(d.docNo || '-')}</div>

                        <div class="lc-top-block">
                            <img src="../assets/img/LOGO-KittenCode.png" class="lc-logo" alt="Kitten Code Logo" onerror="this.style.display='none'">
                            <div class="lc-issuer">${escapeHTML(company)}</div>
                            <h1 class="lc-title-th">${escapeHTML(headerTitle)}</h1>
                            <div class="lc-title-en">${escapeHTML(headerTitleEn)}</div>
                            <div class="lc-divider"></div>
                        </div>

                        <div class="lc-body-block">
                            <p class="lc-lead">${escapeHTML(leadText)}</p>
                            <div class="lc-recipient">${escapeHTML(recipientFull)}</div>
                            ${recipientSub ? `<div class="lc-recipient-sub">${escapeHTML(recipientSub)}</div>` : ''}
                            <p class="lc-reason">${escapeHTML(reasonText)}</p>
                            <p class="lc-blessing">${escapeHTML(blessingText)}</p>
                            <div class="lc-given">ให้ไว้ ณ วันที่ ${escapeHTML(givenDate)}</div>
                        </div>

                        ${sigBlockHtml}
                    </div>
                </div>
            </div>`;
        return page;
    }

    /**
     * Render one A4 certificate page (Portrait or Landscape).
     * @param {object} d   certificate data
     * @param {object} [opts] { isReprint: boolean }
     * @returns {HTMLElement}
     */
    function render(d, opts = {}) {
        d = d || {};
        if (isLandscapeCert(d.certType)) {
            return renderLandscape(d, opts);
        }

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
                ${buildPortraitBody(d)}
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

    window.KCCertificate = {
        render,
        TYPES,
        THEMES,
        isLandscapeCert,
        buildLandscapeDraft,
        thaiDateLong,
        durationText,
        bahtText,
        escapeHTML
    };
})();
