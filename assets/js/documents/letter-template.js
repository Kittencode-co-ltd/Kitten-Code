// ============================================================
//  letter-template.js — shared A4 renderer for Official External
//  Correspondence & Invitations (หนังสือติดต่อหน่วยงานภายนอก รัฐ/เอกชน):
//   - invite_advisor : หนังสือเชิญเป็นที่ปรึกษาโครงการ / บริษัท
//   - invite_speaker : หนังสือเชิญเป็นวิทยากรบรรยาย / ฝึกอบรม
//   - cooperation    : หนังสือขอความอนุเคราะห์ / ความร่วมมือ / ขอเข้าพบ
//   - authorization  : หนังสือมอบอำนาจ / แต่งตั้งตัวแทนติดต่อหน่วยงาน
//   - delivery       : หนังสือส่งมอบงาน / นำส่งเอกสารทางการ
//
//  Exposes window.KCLetter = { render, TYPES, buildDefaultDraft, ... }.
//  All values are raw text; HTML escaping happens here at render time.
// ============================================================
(function () {
    'use strict';

    const TYPES = {
        invite_advisor: {
            title: 'หนังสือเชิญเป็นที่ปรึกษา',
            short: 'เชิญเป็นที่ปรึกษา',
            defaultSubject: 'ขอเรียนเชิญเป็นที่ปรึกษาโครงการพัฒนาซอฟต์แวร์และนวัตกรรมดิจิทัล'
        },
        invite_speaker: {
            title: 'หนังสือเชิญเป็นวิทยากร',
            short: 'เชิญเป็นวิทยากร',
            defaultSubject: 'ขอเรียนเชิญเป็นวิทยากรบรรยายให้ความรู้'
        },
        cooperation: {
            title: 'หนังสือขอความอนุเคราะห์ / ความร่วมมือ',
            short: 'ขอความร่วมมือ/เข้าพบ',
            defaultSubject: 'ขอความอนุเคราะห์เข้าพบเพื่อหารือความร่วมมือด้านเทคโนโลยีดิจิทัล'
        },
        authorization: {
            title: 'หนังสือมอบอำนาจและแต่งตั้งตัวแทน',
            short: 'หนังสือมอบอำนาจ',
            defaultSubject: 'การมอบอำนาจให้ดำเนินการแทนบริษัท คิทเช่น โค้ด จำกัด'
        },
        delivery: {
            title: 'หนังสือส่งมอบงาน / นำส่งเอกสาร',
            short: 'ส่งมอบงาน/เอกสาร',
            defaultSubject: 'ขอส่งมอบงานและเอกสารประกอบการตรวจรับ'
        }
    };

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

    function buildDefaultDraft(d) {
        d = d || {};
        const lType = d.letterType || 'invite_advisor';
        const company = d.companyName || 'บริษัท คิทเช่น โค้ด จำกัด';
        const topic = d.topicName || 'โครงการพัฒนาระบบเทคโนโลยีดิจิทัล';
        const eventDateStr = d.eventDate ? thaiDateLong(d.eventDate) : 'วันและเวลาตามที่ท่านสะดวก';
        const timeStr = d.eventTime ? ` เวลา ${d.eventTime} น.` : '';
        const locStr = d.eventLocation || 'ณ ห้องประชุมบริษัท คิทเช่น โค้ด จำกัด หรือผ่านระบบประชุมออนไลน์';

        if (lType === 'invite_advisor') {
            return {
                subject: d.subject || `ขอเรียนเชิญเป็นที่ปรึกษา${topic}`,
                paraReason: `ด้วย ${company} ได้ดำเนินงานด้านการพัฒนาซอฟต์แวร์ ระบบสารสนเทศ และนวัตกรรมดิจิทัลสำหรับองค์กรภาครัฐและภาคเอกชน โดยขณะนี้บริษัทฯ อยู่ระหว่างการดำเนินงาน "${topic}" ซึ่งมุ่งเน้นการยกระดับมาตรฐานทางวิชาการและเทคโนโลยีให้สามารถนำไปประยุกต์ใช้งานได้อย่างมีประสิทธิภาพสูงสุด`,
                paraDetail: `ในการนี้ บริษัทฯ พิจารณาเห็นว่าท่านเป็นผู้ทรงคุณวุฒิที่มีความรู้ ความเชี่ยวชาญ และประสบการณ์สูงในสาขาที่เกี่ยวข้อง จึงใคร่ขอเรียนเชิญท่านเป็นที่ปรึกษา${topic} เพื่อร่วมให้ข้อเสนอแนะ แนวทางการพัฒนา และแนวปฏิบัติที่เป็นมาตรฐาน${d.eventDate ? ` ตั้งแต่วันที่ ${eventDateStr} เป็นต้นไป` : ''}`,
                paraClosing: `จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และบริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์จากท่านด้วยดี ขอขอบพระคุณมา ณ โอกาสนี้`
            };
        }
        if (lType === 'invite_speaker') {
            return {
                subject: d.subject || `ขอเรียนเชิญเป็นวิทยากรบรรยายในหัวข้อ "${topic}"`,
                paraReason: `ด้วย ${company} ได้จัดโครงการพัฒนาศักยภาพบุคลากรและถ่ายทอดองค์ความรู้ด้านเทคโนโลยีดิจิทัล โดยมีวัตถุประสงค์เพื่อเสริมสร้างทักษะ ความเข้าใจ และแลกเปลี่ยนประสบการณ์เชิงลึกให้แก่ทีมพัฒนาซอฟต์แวร์และผู้เข้าร่วมอบรมของบริษัทฯ`,
                paraDetail: `ในการนี้ บริษัทฯ พิจารณาเห็นว่าท่านเป็นผู้ทรงคุณวุฒิที่มีความเชี่ยวชาญและประสบการณ์ตรง จึงใคร่ขอเรียนเชิญท่านเป็นวิทยากรบรรยายในหัวข้อ "${topic}" ในวันที่ ${eventDateStr}${timeStr} ${locStr}`,
                paraClosing: `จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์เป็นวิทยากรตามวัน เวลา และสถานที่ดังกล่าว บริษัทฯ หวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณเป็นอย่างสูงมา ณ โอกาสนี้`
            };
        }
        if (lType === 'cooperation') {
            return {
                subject: d.subject || `ขอความอนุเคราะห์${topic}`,
                paraReason: `ด้วย ${company} เป็นผู้ประกอบการด้านการออกแบบและพัฒนาระบบซอฟต์แวร์ เว็บแอปพลิเคชัน และเทคโนโลยีดิจิทัลในจังหวัดพิษณุโลก มีความมุ่งมั่นในการสร้างเครือข่ายความร่วมมือทางวิชาการ การวิจัยพัฒนา และการประยุกต์ใช้เทคโนโลยีร่วมกับหน่วยงานภาครัฐ สถาบันการศึกษา และองค์กรเอกชน`,
                paraDetail: `ในการนี้ บริษัทฯ จึงใคร่ขอความอนุเคราะห์เกี่ยวกับ${topic} ในวันที่ ${eventDateStr}${timeStr} ${locStr} เพื่อร่วมแลกเปลี่ยนแนวทางและวางกรอบการดำเนินงานร่วมกันต่อไป`,
                paraClosing: `จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบพระคุณในความร่วมมือด้วยดีมา ณ โอกาสนี้`
            };
        }
        if (lType === 'authorization') {
            const rep = d.repName || 'ผู้รับมอบอำนาจ';
            const repId = d.repIdCard ? ` (เลขประจำตัวประชาชน ${d.repIdCard})` : '';
            const repPos = d.repPosition ? ` ตำแหน่ง ${d.repPosition}` : '';
            return {
                subject: d.subject || `หนังสือมอบอำนาจและแต่งตั้งตัวแทนดำเนินการแทนบริษัท`,
                paraReason: `หนังสือฉบับนี้ทำขึ้นเพื่อแสดงว่า ${company} สำนักงานตั้งอยู่เลขที่ 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก เลขประจำตัวผู้เสียภาษีอากร 0655569001411 โดย ${d.signName || 'กรรมการผู้มีอำนาจลงนาม'} ขอมอบอำนาจและแต่งตั้งให้ ${rep}${repId}${repPos} เป็นผู้รับมอบอำนาจกระทำการแทนบริษัทฯ`,
                paraDetail: `โดยให้ผู้รับมอบอำนาจมีอำนาจดำเนินการเกี่ยวกับ ${topic} ตลอดจนการยื่นเอกสาร การลงลายมือชื่อรับรองสำเนาเอกสาร การชี้แจงข้อเท็จจริง การแก้ไขเพิ่มเติมถ้อยคำในเอกสาร และการดำเนินการอื่นใดที่เกี่ยวข้องจนเสร็จการ${d.eventDate ? ` ทั้งนี้ ตั้งแต่วันที่ ${eventDateStr} เป็นต้นไป` : ''}`,
                paraClosing: `การใดที่ผู้รับมอบอำนาจได้กระทำไปภายในขอบเขตแห่งการมอบอำนาจนี้ ให้ถือเสมือนหนึ่งว่าบริษัทฯ ได้กระทำด้วยตนเองทุกประการ จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน`
            };
        }
        // delivery
        return {
            subject: d.subject || `ขอส่งมอบงานและเอกสารประกอบ (${topic})`,
            paraReason: `ตามที่หน่วยงานของท่านได้ตกลงว่าจ้าง / สั่งซื้อจาก ${company} เพื่อดำเนินงาน "${topic}"${d.refDoc ? ` ตามอ้างถึง ${d.refDoc}` : ''} นั้น บัดนี้ บริษัทฯ ได้ดำเนินการตามขอบเขตงานเสร็จสิ้นครบถ้วนเรียบร้อยแล้ว`,
            paraDetail: `ในการนี้ บริษัทฯ จึงขอส่งมอบงานและเอกสารประกอบการตรวจรับตามรายการในสิ่งที่ส่งมาด้วย เพื่อให้ท่านและคณะกรรมการตรวจรับได้โปรดพิจารณาตรวจสอบความถูกต้องต่อไป`,
            paraClosing: `จึงเรียนมาเพื่อโปรดพิจารณาตรวจรับมอบงาน และดำเนินการในส่วนที่เกี่ยวข้องต่อไป ขอขอบพระคุณมา ณ โอกาสนี้`
        };
    }

    const COMPANY_HEADER = `
        <div class="header-section flex-between align-start" style="margin-bottom: 10px;">
            <div class="logo-area">
                <img src="../assets/img/LOGO-KittenCode.png" class="company-logo" alt="Kitten Code Logo" onerror="this.style.display='none'">
            </div>
            <div class="company-details">
                <h1 class="company-name">Kitten Code</h1>
                <p class="company-address">บริษัท คิทเช่น โค้ด จำกัด · 347/11 หมู่ 3 ต.ท่าโพธิ์ อ.เมืองพิษณุโลก จ.พิษณุโลก 65000</p>
                <p class="company-contact">โทร : <span>+66 8 0885 0555</span> &nbsp;&nbsp; อีเมล : <span>kittencode.co.ltd@gmail.com</span></p>
                <p class="company-tax-id">เลขประจำตัวผู้เสียภาษีอากร : <span>0655569001411</span></p>
            </div>
        </div>`;

    function render(d, opts = {}) {
        d = d || {};
        const defaults = buildDefaultDraft(d);
        const subject = d.subject || defaults.subject;
        const recipient = [d.recipientTitle, d.recipientOrg].filter(Boolean).join(' ') || '....................................................';
        const para1 = d.paraReason || defaults.paraReason;
        const para2 = d.paraDetail || defaults.paraDetail;
        const para3 = d.paraClosing || defaults.paraClosing;
        const isAuth = d.letterType === 'authorization';

        const optionalRows = [];
        if (d.refDoc) {
            optionalRows.push(`
                <div class="let-head-row">
                    <span class="let-head-label">อ้างถึง</span>
                    <span class="let-head-val">${escapeHTML(d.refDoc)}</span>
                </div>`);
        }
        if (d.enclosures) {
            optionalRows.push(`
                <div class="let-head-row">
                    <span class="let-head-label">สิ่งที่ส่งมาด้วย</span>
                    <span class="let-head-val" style="white-space:pre-wrap;">${escapeHTML(d.enclosures)}</span>
                </div>`);
        }

        const sigHtml = isAuth
            ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px 28px; margin-top:26px; text-align:center; font-size:14px;">
                    <div>
                        <div style="height:40px; border-bottom:1px dashed #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.signName || '..............................................')})</div>
                        <div style="font-weight:600;">ผู้มอบอำนาจ (${escapeHTML(d.signPosition || 'กรรมการผู้มีอำนาจ')})</div>
                    </div>
                    <div>
                        <div style="height:40px; border-bottom:1px dashed #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.repName || '..............................................')})</div>
                        <div style="font-weight:600;">ผู้รับมอบอำนาจ${d.repPosition ? ` (${escapeHTML(d.repPosition)})` : ''}</div>
                    </div>
                    <div>
                        <div style="height:36px; border-bottom:1px dashed #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.witness1 || '..............................................')})</div>
                        <div>พยาน</div>
                    </div>
                    <div>
                        <div style="height:36px; border-bottom:1px dashed #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.witness2 || '..............................................')})</div>
                        <div>พยาน</div>
                    </div>
                </div>`
            : `
                <div class="let-sign">
                    <div>ขอแสดงความนับถือ</div>
                    <div class="sig-space"></div>
                    <div>(${escapeHTML(d.signName || '..............................................')})</div>
                    <div>${escapeHTML(d.signPosition || 'กรรมการผู้จัดการ')}</div>
                    <div>${escapeHTML(d.companyName || 'บริษัท คิทเช่น โค้ด จำกัด')}</div>
                </div>`;

        const coordParts = [];
        if (d.coordName) coordParts.push(`ผู้ประสานงาน: ${escapeHTML(d.coordName)}`);
        if (d.coordTel) coordParts.push(`โทร. ${escapeHTML(d.coordTel)}`);
        if (d.coordEmail) coordParts.push(`อีเมล ${escapeHTML(d.coordEmail)}`);

        const footerHtml = coordParts.length
            ? `<div class="let-footer">${coordParts.join(' &nbsp;·&nbsp; ')}</div>`
            : '';

        const page = document.createElement('div');
        page.className = 'a4-page letter-page';
        page.innerHTML = `
            <style>
                .letter-page .let-meta-bar { display:flex; justify-content:space-between; font-size:14.5px; margin: 6px 0 14px; color:#1e293b; }
                .letter-page .let-head-block { margin-bottom: 16px; font-size:15px; line-height:1.85; color:#1e293b; }
                .letter-page .let-head-row { display:flex; align-items:flex-start; margin-bottom:4px; }
                .letter-page .let-head-label { width: 110px; font-weight:700; flex-shrink:0; }
                .letter-page .let-head-val { flex:1; }
                .letter-page .let-paragraph { text-indent: 2.5em; line-height: 1.95; font-size: 15px; margin: 0 0 12px 0; color: #1e293b; text-align: justify; white-space: pre-wrap; }
                .letter-page .let-sign { margin-left: auto; width: 290px; text-align: center; font-size: 15px; line-height: 1.8; margin-top: 28px; }
                .letter-page .let-sign .sig-space { height: 52px; }
                .letter-page .let-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12.5px; color: #475569; }
            </style>
            <div class="page-top-border"></div>
            ${opts.isReprint ? '<div class="watermark-reprint">ฉบับสำเนา (COPY)</div>' : ''}
            <div class="content-wrapper">
                ${COMPANY_HEADER}
                <div class="let-meta-bar">
                    <div><strong>ที่</strong> ${escapeHTML(d.docNo || '-')}</div>
                    <div><strong>วันที่</strong> ${escapeHTML(thaiDateLong(d.docDate) || '-')}</div>
                </div>
                <div class="let-head-block">
                    <div class="let-head-row">
                        <span class="let-head-label">เรื่อง</span>
                        <span class="let-head-val"><strong>${escapeHTML(subject)}</strong></span>
                    </div>
                    <div class="let-head-row">
                        <span class="let-head-label">เรียน</span>
                        <span class="let-head-val">${escapeHTML(recipient)}</span>
                    </div>
                    ${optionalRows.join('')}
                </div>
                <p class="let-paragraph">${escapeHTML(para1)}</p>
                <p class="let-paragraph">${escapeHTML(para2)}</p>
                <p class="let-paragraph">${escapeHTML(para3)}</p>
                ${sigHtml}
                ${footerHtml}
            </div>`;
        return page;
    }

    window.KCLetter = { render, TYPES, buildDefaultDraft, thaiDateLong, escapeHTML };
})();
