// ============================================================
//  letter-template.js — shared A4 renderer for Official External
//  Correspondence & Invitations (หนังสือติดต่อหน่วยงานภายนอก รัฐ/เอกชน):
//   - invite_advisor : หนังสือเชิญเป็นที่ปรึกษาโครงการ / บริษัท
//   - invite_speaker : หนังสือเชิญเป็นวิทยากรบรรยาย / ฝึกอบรม
//   - cooperation    : หนังสือขอความอนุเคราะห์ / ความร่วมมือ / ขอเข้าพบ
//   - authorization  : หนังสือมอบอำนาจ / แต่งตั้งตัวแทนติดต่อหน่วยงาน
//   - delivery       : หนังสือส่งมอบงาน / นำส่งเอกสารทางการ
//  หนังสือส่งออกเพิ่มเติม (บริษัทเป็นผู้ริเริ่ม):
//   - invite_event, request_reference, vendor_register, site_access
//   - proposal, extension, clarification, ma_renewal, termination
//   - billing, payment_reminder, guarantee_return
//   - notify_change, service_notice, thanks
//  หนังสือตอบรับ / ตอบกลับคำเชิญ (group: 'reply'):
//   - reply_speaker     : ตอบรับเป็นวิทยากร
//   - reply_advisor     : ตอบรับเป็นที่ปรึกษา
//   - reply_committee   : ตอบรับเป็นกรรมการ / ผู้ทรงคุณวุฒิ / กรรมการตัดสิน
//   - reply_attend      : ตอบรับเข้าร่วมงาน / ประชุม / สัมมนา และแจ้งผู้แทน
//   - reply_cooperation : ตอบรับความอนุเคราะห์ (เข้าพบ ศึกษาดูงาน รับฝึกงาน ฯลฯ)
//   - decline           : ขอบคุณและปฏิเสธคำเชิญอย่างสุภาพ
//
//  Exposes window.KCLetter = { render, TYPES, buildDefaultDraft, ... }.
//  All values are raw text; HTML escaping happens here at render time.
// ============================================================
(function () {
    'use strict';

    // หมวดหมู่หนังสือ (ใช้จัดกลุ่มปุ่มเลือกประเภทในหน้าฟอร์ม)
    const GROUPS = [
        { key: 'invite',  label: 'เชิญ / ขอความร่วมมือ', icon: 'fa-paper-plane' },
        { key: 'project', label: 'โครงการ / สัญญา',      icon: 'fa-diagram-project' },
        { key: 'finance', label: 'การเงิน',               icon: 'fa-coins' },
        { key: 'notice',  label: 'แจ้งให้ทราบ / ทั่วไป',  icon: 'fa-bullhorn' },
        { key: 'reply',   label: 'ตอบรับ / ตอบกลับ',     icon: 'fa-reply' }
    ];

    const TYPES = {
        // ---- เชิญ / ขอความร่วมมือ ----
        invite_advisor: {
            group: 'invite', icon: 'fa-user-graduate',
            title: 'หนังสือเชิญเป็นที่ปรึกษา',
            short: 'เชิญเป็นที่ปรึกษา'
        },
        invite_speaker: {
            group: 'invite', icon: 'fa-chalkboard-teacher',
            title: 'หนังสือเชิญเป็นวิทยากร',
            short: 'เชิญเป็นวิทยากร'
        },
        invite_event: {
            group: 'invite', icon: 'fa-calendar-plus',
            title: 'หนังสือเชิญเข้าร่วมงาน / ประชุม / สัมมนา',
            short: 'เชิญเข้าร่วมงาน/ประชุม'
        },
        cooperation: {
            group: 'invite', icon: 'fa-handshake',
            title: 'หนังสือขอความอนุเคราะห์ / ความร่วมมือ',
            short: 'ขอความร่วมมือ/เข้าพบ'
        },
        request_reference: {
            group: 'invite', icon: 'fa-award',
            title: 'หนังสือขอหนังสือรับรองผลงาน',
            short: 'ขอหนังสือรับรองผลงาน'
        },
        vendor_register: {
            group: 'invite', icon: 'fa-store',
            title: 'หนังสือขอขึ้นทะเบียนผู้ค้า / ผู้ให้บริการ',
            short: 'ขอขึ้นทะเบียนผู้ค้า'
        },
        site_access: {
            group: 'invite', icon: 'fa-id-card-clip',
            title: 'หนังสือขออนุญาตเข้าปฏิบัติงาน / แจ้งรายชื่อผู้ปฏิบัติงาน',
            short: 'ขอเข้าปฏิบัติงาน'
        },

        // ---- โครงการ / สัญญา ----
        proposal: {
            group: 'project', icon: 'fa-file-signature',
            title: 'หนังสือนำส่งใบเสนอราคา / ข้อเสนอโครงการ',
            short: 'เสนอราคา/ข้อเสนอโครงการ'
        },
        delivery: {
            group: 'project', icon: 'fa-box-open',
            title: 'หนังสือส่งมอบงาน / นำส่งเอกสาร',
            short: 'ส่งมอบงาน/เอกสาร'
        },
        extension: {
            group: 'project', icon: 'fa-hourglass-half',
            title: 'หนังสือขอขยายระยะเวลาดำเนินงาน',
            short: 'ขอขยายระยะเวลา'
        },
        clarification: {
            group: 'project', icon: 'fa-comment-dots',
            title: 'หนังสือชี้แจงข้อเท็จจริง / ตอบข้อซักถาม',
            short: 'ชี้แจงข้อเท็จจริง'
        },
        ma_renewal: {
            group: 'project', icon: 'fa-screwdriver-wrench',
            title: 'หนังสือแจ้งสิ้นสุดการรับประกัน / เสนอบริการบำรุงรักษา',
            short: 'สิ้นสุดประกัน/เสนอ MA'
        },
        termination: {
            group: 'project', icon: 'fa-file-circle-xmark',
            title: 'หนังสือแจ้งบอกเลิกสัญญา / ยกเลิกบริการ',
            short: 'บอกเลิกสัญญา'
        },

        // ---- การเงิน ----
        billing: {
            group: 'finance', icon: 'fa-file-invoice-dollar',
            title: 'หนังสือขอเบิกเงินค่าจ้างตามงวดงาน',
            short: 'ขอเบิกเงินค่าจ้าง'
        },
        payment_reminder: {
            group: 'finance', icon: 'fa-bell',
            title: 'หนังสือติดตามการชำระเงิน',
            short: 'ติดตามการชำระเงิน'
        },
        guarantee_return: {
            group: 'finance', icon: 'fa-shield-halved',
            title: 'หนังสือขอคืนหลักประกันสัญญา',
            short: 'ขอคืนหลักประกันสัญญา'
        },

        // ---- แจ้งให้ทราบ / ทั่วไป ----
        notify_change: {
            group: 'notice', icon: 'fa-pen-to-square',
            title: 'หนังสือแจ้งเปลี่ยนแปลงข้อมูลบริษัท',
            short: 'แจ้งเปลี่ยนแปลงข้อมูล'
        },
        service_notice: {
            group: 'notice', icon: 'fa-server',
            title: 'หนังสือแจ้งปิดปรับปรุงระบบ / เหตุขัดข้อง',
            short: 'แจ้งปิดปรับปรุงระบบ'
        },
        thanks: {
            group: 'notice', icon: 'fa-heart',
            title: 'หนังสือขอบคุณ',
            short: 'หนังสือขอบคุณ'
        },
        authorization: {
            group: 'notice', icon: 'fa-id-badge',
            title: 'หนังสือมอบอำนาจและแต่งตั้งตัวแทน',
            short: 'หนังสือมอบอำนาจ'
        },

        // ---- หนังสือตอบรับ / ตอบกลับคำเชิญจากหน่วยงานภายนอก ----
        reply_speaker: {
            group: 'reply', icon: 'fa-microphone',
            title: 'หนังสือตอบรับเป็นวิทยากร',
            short: 'ตอบรับเป็นวิทยากร'
        },
        reply_advisor: {
            group: 'reply', icon: 'fa-user-tie',
            title: 'หนังสือตอบรับเป็นที่ปรึกษา',
            short: 'ตอบรับเป็นที่ปรึกษา'
        },
        reply_committee: {
            group: 'reply', icon: 'fa-gavel',
            title: 'หนังสือตอบรับเป็นกรรมการ / ผู้ทรงคุณวุฒิ',
            short: 'ตอบรับเป็นกรรมการ'
        },
        reply_attend: {
            group: 'reply', icon: 'fa-users',
            title: 'หนังสือตอบรับเข้าร่วมงาน / ประชุม / ส่งผู้แทน',
            short: 'ตอบรับเข้าร่วมงาน'
        },
        reply_cooperation: {
            group: 'reply', icon: 'fa-hands-helping',
            title: 'หนังสือตอบรับความอนุเคราะห์ / ความร่วมมือ',
            short: 'ตอบรับความอนุเคราะห์'
        },
        decline: {
            group: 'reply', icon: 'fa-circle-xmark',
            title: 'หนังสือขอบคุณและปฏิเสธคำเชิญ',
            short: 'ปฏิเสธคำเชิญ (สุภาพ)'
        }
    };

    const isReplyType = (t) => !!(TYPES[t] && TYPES[t].group === 'reply');

    // ---- จำนวนเงิน: "53,500.00 บาท (ห้าหมื่นสามพันห้าร้อยบาทถ้วน)" ----
    const TH_DIGITS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const TH_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

    function readThaiInt(numStr) {
        numStr = String(numStr).replace(/^0+/, '');
        if (!numStr) return '';
        if (numStr.length > 6) {
            const head = numStr.slice(0, numStr.length - 6);
            const tail = numStr.slice(-6);
            return readThaiInt(head) + 'ล้าน' + readThaiInt(tail);
        }
        let out = '';
        const len = numStr.length;
        for (let i = 0; i < len; i++) {
            const n = Number(numStr[i]);
            const pos = len - i - 1;
            if (n === 0) continue;
            if (pos === 0 && n === 1 && len > 1) out += 'เอ็ด';
            else if (pos === 1 && n === 2) out += 'ยี่';
            else if (pos === 1 && n === 1) out += '';
            else out += TH_DIGITS[n];
            out += TH_UNITS[pos];
        }
        return out;
    }

    function thaiBahtText(amount) {
        const num = Number(amount);
        if (!isFinite(num) || num < 0) return '';
        const [intPart, decPart] = num.toFixed(2).split('.');
        const bahtTxt = intPart === '0' ? 'ศูนย์' : readThaiInt(intPart);
        const satang = Number(decPart);
        return satang === 0
            ? `${bahtTxt}บาทถ้วน`
            : `${bahtTxt}บาท${readThaiInt(decPart)}สตางค์`;
    }

    function formatBaht(amount) {
        const raw = String(amount ?? '').replace(/[,\s]/g, '');
        if (raw === '' || isNaN(Number(raw))) return '';
        const num = Number(raw);
        const [i, dec] = num.toFixed(2).split('.');
        const withComma = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${withComma}.${dec} บาท (${thaiBahtText(num)})`;
    }

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

    // รูปแบบวันเดือนปีตามระเบียบงานสารบรรณ (หนังสือภายนอก): "15 พฤศจิกายน 2569"
    function thaiDateSaraban(s) {
        const d = parseDate(s);
        if (!d) return '';
        return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    }

    function buildDefaultDraft(d) {
        d = d || {};
        const lType = d.letterType || 'invite_advisor';
        const company = d.companyName || 'บริษัท คิทเช่น โค้ด จำกัด';
        const topic = d.topicName || 'โครงการพัฒนาระบบเทคโนโลยีดิจิทัล';
        const eventDateStr = d.eventDate ? thaiDateLong(d.eventDate) : 'วันและเวลาตามที่ท่านสะดวก';
        const timeStr = d.eventTime ? ` เวลา ${d.eventTime} น.` : '';
        const locStr = d.eventLocation || 'ณ ห้องประชุมบริษัท คิทเช่น โค้ด จำกัด หรือผ่านระบบประชุมออนไลน์';

        if (isReplyType(lType)) {
            return buildReplyDraft(d, lType, company);
        }
        if (OUTGOING_BUILDERS[lType]) {
            return OUTGOING_BUILDERS[lType](makeCtx(d, company));
        }

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

    // "อ้างถึง" อัตโนมัติจากเลขที่/วันที่หนังสือเชิญของต้นทาง
    // เช่น "หนังสือมหาวิทยาลัยนเรศวร ที่ อว 0603.1/1234 ลงวันที่ 1 พฤศจิกายน 2569"
    function buildInviteRef(d) {
        d = d || {};
        if (d.refDoc) return d.refDoc;
        if (!isReplyType(d.letterType)) return '';
        if (!d.invRefNo && !d.invRefDate) return '';
        const parts = [`หนังสือ${d.recipientOrg || ''}`];
        if (d.invRefNo) parts.push(`ที่ ${d.invRefNo}`);
        if (d.invRefDate) parts.push(`ลงวันที่ ${thaiDateSaraban(d.invRefDate)}`);
        return parts.join(' ').replace(/\s+/g, ' ').trim();
    }

    // ร่างข้อความหนังสือตอบรับ / ตอบกลับคำเชิญ ตามแบบหนังสือภายนอก
    // ย่อหน้า 1: อ้างเหตุ ("ตามหนังสือที่อ้างถึง ... ความละเอียดแจ้งแล้ว นั้น")
    // ย่อหน้า 2: ความประสงค์ (ตอบรับ / มอบหมายผู้แทน / ปฏิเสธพร้อมเหตุผล)
    // ย่อหน้า 3: สรุป ("จึงเรียนมาเพื่อโปรดทราบ")
    function buildReplyDraft(d, lType, company) {
        const org = d.recipientOrg || 'หน่วยงานของท่าน';
        const topic = d.topicName || '';
        const hasRef = !!buildInviteRef(d);
        const opener = hasRef ? 'ตามหนังสือที่อ้างถึง' : 'ตามที่';
        const dateTxt = d.eventDate ? ` ในวันที่ ${thaiDateLong(d.eventDate)}` : '';
        const timeTxt = d.eventTime ? ` เวลา ${d.eventTime} น.` : '';
        const locTxt = d.eventLocation ? ` ${d.eventLocation}` : '';
        const whenWhere = `${dateTxt}${timeTxt}${locTxt}`;
        const person = d.inviteeName
            ? `${d.inviteeName}${d.inviteePosition ? ` ตำแหน่ง ${d.inviteePosition}` : ''}`
            : '';
        const note = d.replyNote ? ` ทั้งนี้ ${d.replyNote}` : '';
        const coord = d.coordName
            ? ` สำหรับการประสานงาน บริษัทฯ ได้มอบหมายให้ ${d.coordName} โทรศัพท์ ${d.coordTel || '080-885-0555'} เป็นผู้ประสานงาน`
            : '';
        const thanks = `${company} ขอขอบคุณที่ให้เกียรติและเห็นความสำคัญของบริษัทฯ`;
        const closeAccept = 'จึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณมา ณ โอกาสนี้';

        if (lType === 'reply_speaker') {
            const who = person || `บุคลากรของ${company}`;
            const t = topic ? `ในหัวข้อ "${topic}"` : '';
            return {
                subject: `ตอบรับเป็นวิทยากรบรรยาย${t}`,
                paraReason: `${opener} ${org} ได้ขอความอนุเคราะห์ให้ ${who} เป็นวิทยากรบรรยาย${t}${whenWhere} ความละเอียดแจ้งแล้ว นั้น`,
                paraDetail: `${thanks} และยินดีให้ความร่วมมือ โดยขอตอบรับให้ ${who} เป็นวิทยากรตามวัน เวลา และสถานที่ดังกล่าว${note}${coord}`,
                paraClosing: closeAccept
            };
        }
        if (lType === 'reply_advisor') {
            const who = person || company;
            const t = topic || 'โครงการ';
            const since = d.eventDate ? ` ตั้งแต่วันที่ ${thaiDateLong(d.eventDate)} เป็นต้นไป` : '';
            return {
                subject: `ตอบรับเป็นที่ปรึกษา${t}`,
                paraReason: `${opener} ${org} ได้ขอเรียนเชิญ ${who} เป็นที่ปรึกษา${t} ความละเอียดแจ้งแล้ว นั้น`,
                paraDetail: `${thanks} และยินดีตอบรับเป็นที่ปรึกษา${t}${since} โดยพร้อมให้คำแนะนำ ข้อเสนอแนะทางวิชาการและเทคนิค เพื่อให้การดำเนินงานบรรลุวัตถุประสงค์อย่างมีประสิทธิภาพ${note}${coord}`,
                paraClosing: closeAccept
            };
        }
        if (lType === 'reply_committee') {
            const who = person || `ผู้แทนของ${company}`;
            const t = topic ? `ใน${topic}` : '';
            return {
                subject: `ตอบรับเป็นกรรมการผู้ทรงคุณวุฒิ${t}`,
                paraReason: `${opener} ${org} ได้ขอเรียนเชิญ ${who} เป็นกรรมการผู้ทรงคุณวุฒิ${t}${whenWhere} ความละเอียดแจ้งแล้ว นั้น`,
                paraDetail: `${thanks} และยินดีให้ความร่วมมือ โดยขอตอบรับให้ ${who} ปฏิบัติหน้าที่กรรมการตามที่ได้รับเชิญ และพร้อมปฏิบัติหน้าที่ด้วยความเป็นกลาง โปร่งใส ตามหลักเกณฑ์ที่หน่วยงานกำหนด${note}${coord}`,
                paraClosing: closeAccept
            };
        }
        if (lType === 'reply_attend') {
            const t = topic || 'งานดังกล่าว';
            const rep = person
                ? `โดยได้มอบหมายให้ ${person} เป็นผู้แทนบริษัทฯ เข้าร่วม${t}`
                : `โดยจะจัดส่งผู้แทนบริษัทฯ เข้าร่วม${t}`;
            return {
                subject: `ตอบรับเข้าร่วม${t}`,
                paraReason: `${opener} ${org} ได้ขอเชิญ ${company} เข้าร่วม${t}${whenWhere} ความละเอียดแจ้งแล้ว นั้น`,
                paraDetail: `${thanks} และยินดีตอบรับเข้าร่วม${t} ${rep} ตามวัน เวลา และสถานที่ดังกล่าว${note}${coord}`,
                paraClosing: closeAccept
            };
        }
        if (lType === 'reply_cooperation') {
            const t = topic || 'เรื่องดังกล่าว';
            const sched = whenWhere ? ` โดยกำหนด${whenWhere.trim()}` : '';
            return {
                subject: `ยินดีให้ความอนุเคราะห์${topic ? topic : 'ตามที่ขอ'}`,
                paraReason: `${opener} ${org} ได้ขอความอนุเคราะห์จาก ${company} เกี่ยวกับ${t} ความละเอียดแจ้งแล้ว นั้น`,
                paraDetail: `${company} พิจารณาแล้ว ยินดีให้ความอนุเคราะห์ตามที่ขอ${sched}${note}${coord}`,
                paraClosing: 'จึงเรียนมาเพื่อโปรดทราบ และดำเนินการในส่วนที่เกี่ยวข้องต่อไป'
            };
        }
        // decline — ปฏิเสธคำเชิญอย่างสุภาพ
        const who = person || company;
        const t = topic ? `ร่วม${topic}` : 'ตามคำเชิญดังกล่าว';
        const reason = d.replyNote || 'ติดภารกิจสำคัญที่ได้กำหนดไว้ล่วงหน้าในช่วงเวลาดังกล่าว';
        return {
            subject: `ขอขอบคุณและแจ้งไม่สามารถตอบรับคำเชิญ${topic ? `ร่วม${topic}` : ''}`,
            paraReason: `${opener} ${org} ได้ขอเรียนเชิญ ${who} ${t}${whenWhere} ความละเอียดแจ้งแล้ว นั้น`,
            paraDetail: `${thanks} แต่เนื่องจาก${reason} จึงไม่สามารถตอบรับคำเชิญในครั้งนี้ได้ บริษัทฯ ต้องขออภัยมา ณ ที่นี้ และหวังเป็นอย่างยิ่งว่าจะได้มีโอกาสร่วมงานกับท่านในโอกาสต่อไป`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดทราบ และขออภัยมา ณ โอกาสนี้'
        };
    }

    // ============================================================
    //  หนังสือส่งออก (บริษัทเป็นผู้ริเริ่ม) — ร่างข้อความ 3 ย่อหน้า
    //  ตามแบบหนังสือภายนอก: เหตุ → ความประสงค์ → สรุป
    // ============================================================
    function makeCtx(d, company) {
        const topic = d.topicName || '';
        const contract = d.contractNo || '';
        const hasRef = !!buildInviteRef(d);
        const dateTxt = d.eventDate ? ` ในวันที่ ${thaiDateLong(d.eventDate)}` : '';
        const timeTxt = d.eventTime ? ` เวลา ${d.eventTime} น.` : '';
        const locTxt = d.eventLocation ? ` ${d.eventLocation}` : '';
        const opener = hasRef ? 'ตามหนังสือที่อ้างถึง ' : 'ตามที่ ';
        return {
            d, company, topic, contract,
            org: d.recipientOrg || 'หน่วยงานของท่าน',
            opener,
            whenWhere: `${dateTxt}${timeTxt}${locTxt}`,
            amt: formatBaht(d.amount),
            inst: d.installment || '',
            due: d.dueDate ? thaiDateLong(d.dueDate) : '',
            newDate: d.newDate ? thaiDateLong(d.newDate) : '',
            effective: d.eventDate ? thaiDateLong(d.eventDate) : '',
            extra: (d.extraDetail || '').trim(),
            contractClause: `${opener}${company} ได้รับการว่าจ้างจาก ${d.recipientOrg || 'หน่วยงานของท่าน'} ให้ดำเนินงาน "${topic || 'ตามสัญญา'}"${contract ? ` ตามสัญญา / ใบสั่งจ้างเลขที่ ${contract}` : ''}`
        };
    }

    const withExtra = (extra) => (extra ? ` ทั้งนี้ ${extra}` : '');
    const listOr = (extra) => (extra || '1. ................................................................');

    const OUTGOING_BUILDERS = {
        invite_event: (c) => {
            const ev = c.topic || 'งานสัมมนา';
            return {
                subject: `ขอเรียนเชิญเข้าร่วม${ev}`,
                paraReason: `ด้วย ${c.company} กำหนดจัด${ev}${c.whenWhere} โดยมีวัตถุประสงค์เพื่อ${c.extra || 'แลกเปลี่ยนองค์ความรู้ นำเสนอผลงาน และสร้างเครือข่ายความร่วมมือด้านเทคโนโลยีดิจิทัลระหว่างหน่วยงานภาครัฐและภาคเอกชน'}`,
                paraDetail: `ในการนี้ บริษัทฯ จึงขอเรียนเชิญท่านหรือผู้แทนเข้าร่วม${ev}ตามวัน เวลา และสถานที่ดังกล่าว และขอความอนุเคราะห์แจ้งยืนยันการเข้าร่วม${c.due ? `ภายในวันที่ ${c.due}` : ''} ที่ผู้ประสานงานตามรายละเอียดท้ายหนังสือฉบับนี้`,
                paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาเข้าร่วม และขอขอบพระคุณมา ณ โอกาสนี้'
            };
        },
        request_reference: (c) => ({
            subject: `ขอความอนุเคราะห์ออกหนังสือรับรองผลงาน${c.topic ? ` "${c.topic}"` : ''}`,
            paraReason: `${c.contractClause} ซึ่งบริษัทฯ ได้ดำเนินงานแล้วเสร็จและส่งมอบงานครบถ้วนเรียบร้อยแล้ว นั้น`,
            paraDetail: `ในการนี้ บริษัทฯ มีความประสงค์จะนำผลงานดังกล่าวไปใช้ประกอบการยื่นข้อเสนอและแสดงประสบการณ์ในการเสนอราคากับหน่วยงานอื่น จึงใคร่ขอความอนุเคราะห์ท่านออกหนังสือรับรองผลงาน โดยระบุชื่อโครงการ มูลค่างาน${c.amt ? ` ${c.amt}` : ''} ระยะเวลาดำเนินงาน และผลการปฏิบัติงานของบริษัทฯ${withExtra(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และขอขอบพระคุณมา ณ โอกาสนี้'
        }),
        vendor_register: (c) => ({
            subject: 'ขอขึ้นทะเบียนเป็นผู้ค้า / ผู้ให้บริการ',
            paraReason: `ด้วย ${c.company} เลขประจำตัวผู้เสียภาษีอากร 0655569001411 ประกอบธุรกิจด้านการออกแบบและพัฒนาซอฟต์แวร์ เว็บแอปพลิเคชัน ระบบสารสนเทศ และให้คำปรึกษาด้านเทคโนโลยีดิจิทัลแก่หน่วยงานภาครัฐและภาคเอกชน`,
            paraDetail: `บริษัทฯ มีความประสงค์ขอขึ้นทะเบียนเป็นผู้ค้า / ผู้ให้บริการของ ${c.org}${c.topic ? ` ในหมวด${c.topic}` : ''} เพื่อมีโอกาสเสนอราคาและให้บริการแก่หน่วยงานของท่าน โดยได้แนบเอกสารประกอบการพิจารณาตามสิ่งที่ส่งมาด้วย${withExtra(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณา และขอขอบพระคุณมา ณ โอกาสนี้'
        }),
        site_access: (c) => ({
            subject: 'ขออนุญาตเข้าปฏิบัติงานและแจ้งรายชื่อผู้ปฏิบัติงาน',
            paraReason: `${c.contractClause} นั้น`,
            paraDetail: `ในการนี้ บริษัทฯ มีความจำเป็นต้องส่งเจ้าหน้าที่เข้าปฏิบัติงานติดตั้ง ตรวจสอบ และบำรุงรักษาระบบในพื้นที่ของ ${c.org}${c.whenWhere} จึงขออนุญาตให้ผู้ปฏิบัติงานของบริษัทฯ เข้าพื้นที่ ดังรายชื่อต่อไปนี้\n${listOr(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาอนุญาต และขอขอบคุณมา ณ โอกาสนี้'
        }),
        proposal: (c) => ({
            subject: `ขอเสนอราคาและข้อเสนอ${c.topic ? `โครงการ "${c.topic}"` : 'โครงการ'}`,
            paraReason: `ด้วย ${c.company} เป็นผู้ให้บริการออกแบบและพัฒนาระบบซอฟต์แวร์ เว็บแอปพลิเคชัน และเทคโนโลยีดิจิทัล ซึ่งมีประสบการณ์ดำเนินงานให้แก่หน่วยงานภาครัฐและภาคเอกชน${c.opener.startsWith('ตามหนังสือ') ? ` และได้รับทราบความต้องการของ ${c.org} ตามหนังสือที่อ้างถึงแล้ว` : ''}`,
            paraDetail: `ในการนี้ บริษัทฯ ขอเสนอราคาและรายละเอียดข้อเสนอสำหรับ "${c.topic || 'โครงการ'}"${c.amt ? ` เป็นจำนวนเงินทั้งสิ้น ${c.amt} ซึ่งรวมภาษีมูลค่าเพิ่มแล้ว` : ''} รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย โดยราคาที่เสนอมีผลยืนราคา${c.due ? `ถึงวันที่ ${c.due}` : 'เป็นระยะเวลา 30 วัน นับจากวันที่ในหนังสือฉบับนี้'}${withExtra(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณา หากท่านต้องการข้อมูลเพิ่มเติม บริษัทฯ ยินดีนำเสนอรายละเอียดเพิ่มเติม ขอขอบคุณมา ณ โอกาสนี้'
        }),
        extension: (c) => ({
            subject: `ขอขยายระยะเวลาดำเนินงาน${c.topic ? ` "${c.topic}"` : ''}`,
            paraReason: `${c.contractClause}${c.due ? ` โดยมีกำหนดแล้วเสร็จภายในวันที่ ${c.due}` : ''} นั้น`,
            paraDetail: `เนื่องจาก${c.extra || 'มีการปรับเปลี่ยนขอบเขตและความต้องการของระบบระหว่างการดำเนินงาน ซึ่งมิได้เกิดจากความผิดของบริษัทฯ'} ทำให้บริษัทฯ ไม่สามารถดำเนินงานให้แล้วเสร็จได้ทันตามกำหนด จึงขอขยายระยะเวลาดำเนินงาน${c.newDate ? `ออกไปจนถึงวันที่ ${c.newDate}` : 'ออกไปตามความเหมาะสม'} ทั้งนี้ บริษัทฯ ยังคงยึดถือเงื่อนไขอื่นตามสัญญาทุกประการ`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ และขอขอบคุณมา ณ โอกาสนี้'
        }),
        clarification: (c) => ({
            subject: `ชี้แจงข้อเท็จจริง${c.topic ? `กรณี${c.topic}` : ''}`,
            paraReason: `${c.opener}${c.org} ได้ขอให้ ${c.company} ชี้แจงข้อเท็จจริง${c.topic ? `กรณี${c.topic}` : ''} นั้น`,
            paraDetail: `บริษัทฯ ขอเรียนชี้แจงข้อเท็จจริง ดังนี้\n${listOr(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณา หากต้องการข้อมูลเพิ่มเติม บริษัทฯ ยินดีให้ข้อมูลทุกประการ ขอขอบคุณมา ณ โอกาสนี้'
        }),
        ma_renewal: (c) => ({
            subject: 'แจ้งสิ้นสุดระยะเวลารับประกันและเสนอบริการบำรุงรักษาระบบ',
            paraReason: `${c.contractClause} ซึ่งระยะเวลารับประกันความชำรุดบกพร่องของระบบจะสิ้นสุดลง${c.due ? `ในวันที่ ${c.due}` : 'ในเร็ว ๆ นี้'} นั้น`,
            paraDetail: `เพื่อให้ระบบสามารถให้บริการได้อย่างต่อเนื่อง มีเสถียรภาพ และปลอดภัย บริษัทฯ จึงขอเสนอบริการบำรุงรักษาระบบ (Maintenance Agreement)${c.amt ? ` ในอัตรา ${c.amt} ต่อปี` : ''} ครอบคลุมการแก้ไขข้อผิดพลาด การสำรองข้อมูล การปรับปรุงความปลอดภัย และการสนับสนุนผู้ใช้งาน${withExtra(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณา และขอขอบคุณที่ไว้วางใจบริษัทฯ มา ณ โอกาสนี้'
        }),
        termination: (c) => ({
            subject: `แจ้งบอกเลิกสัญญา${c.contract ? ` เลขที่ ${c.contract}` : ''}`,
            paraReason: `${c.contractClause} นั้น`,
            paraDetail: `เนื่องจาก${c.extra || '................................................................'} บริษัทฯ จึงขอแจ้งบอกเลิกสัญญาดังกล่าว${c.effective ? ` โดยมีผลตั้งแต่วันที่ ${c.effective}` : ' โดยมีผลเมื่อครบกำหนด 30 วัน นับจากวันที่ท่านได้รับหนังสือฉบับนี้ ตามเงื่อนไขของสัญญา'} ทั้งนี้ บริษัทฯ จะส่งมอบงาน ข้อมูล และเอกสารที่เกี่ยวข้องในส่วนที่ได้ดำเนินการแล้วให้แก่ท่านต่อไป`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดทราบ และดำเนินการในส่วนที่เกี่ยวข้องต่อไป'
        }),
        billing: (c) => {
            const instTxt = c.inst ? `งวดที่ ${c.inst}` : '';
            return {
                subject: `ขอเบิกเงินค่าจ้าง${instTxt ? ` ${instTxt}` : ''}${c.topic ? ` (${c.topic})` : ''}`,
                paraReason: `${c.contractClause} นั้น`,
                paraDetail: `บัดนี้ บริษัทฯ ได้ดำเนินงาน${instTxt || 'ตามสัญญา'}แล้วเสร็จ และได้ส่งมอบงานเรียบร้อยแล้ว จึงขอเบิกเงินค่าจ้าง${instTxt}${c.amt ? ` เป็นจำนวนเงิน ${c.amt}` : ''} โดยขอให้โอนเข้าบัญชีของบริษัทฯ ตามรายละเอียดในใบแจ้งหนี้ที่ส่งมาด้วย${withExtra(c.extra)}`,
                paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาเบิกจ่ายเงินค่าจ้างให้แก่บริษัทฯ ต่อไป ขอขอบคุณมา ณ โอกาสนี้'
            };
        },
        payment_reminder: (c) => {
            const instTxt = c.inst ? `งวดที่ ${c.inst}` : '';
            return {
                subject: `ขอติดตามการชำระเงินค่าจ้าง${instTxt ? ` ${instTxt}` : ''}`,
                paraReason: `${c.opener}${c.company} ได้ส่งมอบงาน "${c.topic || 'ตามสัญญา'}"${c.contract ? ` ตามสัญญา / ใบสั่งจ้างเลขที่ ${c.contract}` : ''} และได้แจ้งหนี้${instTxt}${c.amt ? ` จำนวนเงิน ${c.amt}` : ''}${c.due ? ` ซึ่งครบกำหนดชำระในวันที่ ${c.due}` : ''} นั้น`,
                paraDetail: `บริษัทฯ ตรวจสอบแล้ว ปรากฏว่ายังไม่ได้รับชำระเงินจำนวนดังกล่าว จึงขอความอนุเคราะห์ท่านโปรดดำเนินการชำระเงิน${c.newDate ? `ภายในวันที่ ${c.newDate}` : 'ภายใน 15 วัน นับจากวันที่ได้รับหนังสือฉบับนี้'} หากท่านได้ชำระเงินแล้ว บริษัทฯ ขออภัยมา ณ ที่นี้ และขอความกรุณาส่งหลักฐานการชำระเงินให้บริษัทฯ เพื่อตรวจสอบต่อไป${withExtra(c.extra)}`,
                paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ และขอขอบคุณมา ณ โอกาสนี้'
            };
        },
        guarantee_return: (c) => ({
            subject: `ขอคืนหลักประกันสัญญา${c.contract ? ` เลขที่ ${c.contract}` : ''}`,
            paraReason: `${c.contractClause} โดยบริษัทฯ ได้วางหลักประกันสัญญา${c.amt ? ` จำนวนเงิน ${c.amt}` : ''} ไว้เป็นที่เรียบร้อยแล้ว นั้น`,
            paraDetail: `บัดนี้ บริษัทฯ ได้ปฏิบัติตามสัญญาครบถ้วนและพ้นข้อผูกพันตามสัญญาแล้ว รวมถึงพ้นระยะเวลารับประกันความชำรุดบกพร่อง${c.due ? `เมื่อวันที่ ${c.due}` : 'แล้ว'} จึงขอรับคืนหลักประกันสัญญาดังกล่าว${withExtra(c.extra)}`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดพิจารณาคืนหลักประกันสัญญาให้แก่บริษัทฯ ต่อไป ขอขอบคุณมา ณ โอกาสนี้'
        }),
        notify_change: (c) => ({
            subject: `แจ้งการเปลี่ยนแปลง${c.topic || 'ข้อมูลบริษัท'}`,
            paraReason: `ด้วย ${c.company} ได้มีการเปลี่ยนแปลง${c.topic || 'ข้อมูลของบริษัท'}${c.effective ? ` โดยมีผลตั้งแต่วันที่ ${c.effective} เป็นต้นไป` : ''}`,
            paraDetail: `ในการนี้ บริษัทฯ จึงขอแจ้งรายละเอียดการเปลี่ยนแปลง ดังนี้\n${listOr(c.extra)}\nทั้งนี้ ขอความกรุณาท่านโปรดใช้ข้อมูลดังกล่าวในการติดต่อ ออกเอกสาร และทำธุรกรรมกับบริษัทฯ นับแต่วันที่มีผลเป็นต้นไป`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดทราบ และขอขอบคุณมา ณ โอกาสนี้'
        }),
        service_notice: (c) => ({
            subject: `แจ้งปิดปรับปรุงระบบ${c.topic ? ` ${c.topic}` : ''}`,
            paraReason: `ด้วย ${c.company} ในฐานะผู้พัฒนาและดูแลระบบ${c.topic ? ` ${c.topic}` : ''}${c.contract ? ` ตามสัญญาเลขที่ ${c.contract}` : ''} มีความจำเป็นต้องปิดปรับปรุงระบบเพื่อ${c.extra || 'บำรุงรักษา ปรับปรุงประสิทธิภาพ และยกระดับความปลอดภัยของระบบ'}`,
            paraDetail: `ในการนี้ บริษัทฯ จึงขอแจ้งกำหนดการปิดปรับปรุงระบบ${c.whenWhere || ' ตามกำหนดการที่ส่งมาด้วย'} ซึ่งในระหว่างนี้ผู้ใช้งานจะไม่สามารถเข้าใช้งานระบบได้ชั่วคราว บริษัทฯ ขออภัยในความไม่สะดวก และจะดำเนินการให้แล้วเสร็จโดยเร็วที่สุด`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดทราบ และแจ้งผู้เกี่ยวข้องทราบต่อไป ขอขอบคุณมา ณ โอกาสนี้'
        }),
        thanks: (c) => ({
            subject: `ขอขอบคุณ${c.topic ? `ที่ให้ความอนุเคราะห์${c.topic}` : ''}`,
            paraReason: `${c.opener}${c.org} ได้ให้ความอนุเคราะห์${c.topic || 'แก่บริษัทฯ'}${c.whenWhere} นั้น`,
            paraDetail: `${c.company} ขอขอบพระคุณเป็นอย่างสูงในความอนุเคราะห์และความร่วมมือดังกล่าว ซึ่งเป็นประโยชน์อย่างยิ่งต่อการดำเนินงานของบริษัทฯ${withExtra(c.extra)} และหวังเป็นอย่างยิ่งว่าจะได้รับความร่วมมือที่ดีจากท่านเช่นนี้ตลอดไป`,
            paraClosing: 'จึงเรียนมาเพื่อโปรดทราบ และขอขอบพระคุณมา ณ โอกาสนี้'
        })
    };

    const COMPANY_HEADER = `
        <div class="header-section-centered">
            <img src="../assets/img/LOGO-KittenCode.png" class="let-logo-center" alt="Kitten Code Logo" onerror="this.style.display='none'">
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
        const refText = buildInviteRef(d);

        const optionalRows = [];
        if (refText) {
            optionalRows.push(`
                <div class="let-head-row">
                    <span class="let-head-label">อ้างถึง</span><span class="let-head-val">${escapeHTML(refText)}</span>
                </div>`);
        }
        if (d.enclosures) {
            optionalRows.push(`
                <div class="let-head-row">
                    <span class="let-head-label">สิ่งที่ส่งมาด้วย</span><span class="let-head-val" style="white-space:pre-wrap;">${escapeHTML(d.enclosures)}</span>
                </div>`);
        }

        const sigHtml = isAuth
            ? `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:22px 28px; margin-top:28px; text-align:center; font-size:14.5px; color:#111827;">
                    <div>
                        <div style="height:42px; border-bottom:1px dotted #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.signName || '..............................................')})</div>
                        <div style="font-weight:600;">ผู้มอบอำนาจ (${escapeHTML(d.signPosition || 'กรรมการผู้มีอำนาจ')})</div>
                    </div>
                    <div>
                        <div style="height:42px; border-bottom:1px dotted #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.repName || '..............................................')})</div>
                        <div style="font-weight:600;">ผู้รับมอบอำนาจ${d.repPosition ? ` (${escapeHTML(d.repPosition)})` : ''}</div>
                    </div>
                    <div>
                        <div style="height:38px; border-bottom:1px dotted #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.witness1 || '..............................................')})</div>
                        <div>พยาน</div>
                    </div>
                    <div>
                        <div style="height:38px; border-bottom:1px dotted #64748b; width:75%; margin:0 auto 6px;"></div>
                        <div>(${escapeHTML(d.witness2 || '..............................................')})</div>
                        <div>พยาน</div>
                    </div>
                </div>`
            : `
                <div class="let-sign">
                    <div class="let-closing">ขอแสดงความนับถือ</div>
                    <div class="sig-space"></div>
                    <div>(${escapeHTML(d.signName || '..............................................')})</div>
                    <div>${escapeHTML(d.signPosition || 'กรรมการผู้จัดการ')}</div>
                    <div>${escapeHTML(d.companyName || 'บริษัท คิทเช่น โค้ด จำกัด')}</div>
                </div>`;

        const footerLines = [
            `<div class="let-footer-org">${escapeHTML(d.companyName || 'บริษัท คิทเช่น โค้ด จำกัด')}</div>`
        ];
        if (d.coordName) footerLines.push(`<div>ผู้ประสานงาน : ${escapeHTML(d.coordName)}</div>`);
        footerLines.push(`<div>โทรศัพท์ : ${escapeHTML(d.coordTel || '080-885-0555')}</div>`);
        footerLines.push(`<div>อีเมล : ${escapeHTML(d.coordEmail || 'kittencode.co.ltd@gmail.com')}</div>`);

        const footerHtml = `<div class="let-footer">${footerLines.join('')}</div>`;

        const page = document.createElement('div');
        page.className = 'a4-page letter-page';
        page.innerHTML = `
            <style>
                .letter-page::before,
                .letter-page .page-top-border { display: none !important; }
                .letter-page .content-wrapper { padding: 20mm 20mm 18mm 28mm !important; color: #111827; }
                .letter-page .header-section-centered { text-align: center; margin-bottom: 4px; }
                .letter-page .let-logo-center { width: 78px; height: 78px; object-fit: contain; display: block; margin: 0 auto; }
                .letter-page .let-meta-bar { display: flex; justify-content: space-between; align-items: flex-start; font-size: 15px; margin: 0 0 8px 0; color: #111827; line-height: 1.65; }
                .letter-page .let-docno { width: 48%; padding-right: 8px; }
                .letter-page .let-office-addr { width: 48%; text-align: left; font-size: 15px; color: #111827; line-height: 1.65; }
                .letter-page .let-date-row { margin-left: 52%; margin-bottom: 16px; font-size: 15px; color: #111827; line-height: 1.65; }
                .letter-page .let-head-block { margin-bottom: 14px; font-size: 15px; line-height: 1.75; color: #111827; }
                .letter-page .let-head-row { display: flex; align-items: baseline; margin-bottom: 8px; }
                .letter-page .let-head-label { font-weight: 700; flex-shrink: 0; margin-right: 0.75em; }
                .letter-page .let-head-val { flex: 1; }
                .letter-page .let-paragraph { text-indent: 2.5cm; line-height: 1.85; font-size: 15px; margin: 0 0 10px 0; color: #111827; text-align: justify; white-space: pre-wrap; }
                .letter-page .let-sign { margin-left: 46%; width: 54%; text-align: center; font-size: 15px; line-height: 1.75; margin-top: 26px; color: #111827; }
                .letter-page .let-sign .let-closing { margin-bottom: 4px; }
                .letter-page .let-sign .sig-space { height: 50px; }
                .letter-page .let-footer { margin-top: auto; padding-top: 12px; font-size: 13px; line-height: 1.6; color: #111827; text-align: left; }
                .letter-page .let-footer-org { font-weight: 700; }
            </style>
            <div class="page-top-border"></div>
            ${opts.isReprint ? '<div class="watermark-reprint">ฉบับสำเนา (COPY)</div>' : ''}
            <div class="content-wrapper">
                ${COMPANY_HEADER}
                <div class="let-meta-bar">
                    <div class="let-docno"><strong>ที่</strong>&nbsp;&nbsp;${escapeHTML(d.docNo || '-')}</div>
                    <div class="let-office-addr">
                        <div>${escapeHTML(d.companyName || 'บริษัท คิทเช่น โค้ด จำกัด')}</div>
                        <div>347/11 หมู่ 3 ตำบลท่าโพธิ์</div>
                        <div>อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</div>
                    </div>
                </div>
                <div class="let-date-row">${escapeHTML(thaiDateSaraban(d.docDate) || '-')}</div>
                <div class="let-head-block">
                    <div class="let-head-row">
                        <span class="let-head-label">เรื่อง</span><span class="let-head-val">${escapeHTML(subject)}</span>
                    </div>
                    <div class="let-head-row">
                        <span class="let-head-label">เรียน</span><span class="let-head-val">${escapeHTML(recipient)}</span>
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

    window.KCLetter = { render, TYPES, GROUPS, buildDefaultDraft, buildInviteRef, isReplyType, formatBaht, thaiBahtText, thaiDateLong, thaiDateSaraban, escapeHTML };
})();
