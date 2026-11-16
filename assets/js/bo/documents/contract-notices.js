// ============================================================
//  contract-notices.js — warning letter, breach notice, dismissal,
//  termination notice, and mutual termination agreement.
//  Registers more types into window.KCContract.TYPES (load after contract-templates.js).
//  General-purpose templates — have a lawyer review before relying on them.
// ============================================================
(function () {
    'use strict';
    const C = window.KCContract;
    if (!C) return;
    const { esc, thaiDate, fmt, bahtText, KITTEN } = C._k;
    const T = C.TYPES;

    // ---------- shared field sets for one-sided letters ----------
    const issuer = () => [
        { id: 'aName', label: 'ผู้ออกหนังสือ (บริษัท)', group: 'a', def: KITTEN.name, full: true },
        { id: 'aAddress', label: 'ที่อยู่ผู้ออกหนังสือ', group: 'a', type: 'textarea', def: KITTEN.address, full: true },
        { id: 'signerName', label: 'ชื่อผู้มีอำนาจลงนาม', group: 'a', def: '' },
        { id: 'signerPos', label: 'ตำแหน่ง', group: 'a', def: KITTEN.pos }
    ];
    const recipient = (nameLabel) => [
        { id: 'bName', label: nameLabel, group: 'b', def: '', full: true },
        { id: 'bAddress', label: 'ที่อยู่ผู้รับหนังสือ', group: 'b', type: 'textarea', def: '', full: true }
    ];
    const noticeDoc = () => [
        { id: 'signDate', label: 'วันที่ออกหนังสือ', group: 'doc', type: 'date', def: '__today' }
    ];
    const extra = () => ({ id: 'extra', label: 'ข้อความเพิ่มเติม (ถ้ามี — ต่อท้ายเนื้อหา)', group: 'extra', type: 'textarea', def: '', full: true });
    const multi = (h, id) => h.multi(id);
    const extraPara = (f) => (String(f.extra || '').trim() ? `<span class="ct-multi">${esc(f.extra)}</span>` : '');
    const base = { kind: 'notice', group: 'end', prefix: 'NT', roles: { a: 'ผู้ออกหนังสือ', b: 'ผู้รับหนังสือ' }, kittenSide: 'a', summaryAmount: () => 0 };

    // ============================================================
    // 1. หนังสือเตือน (พนักงาน)
    // ============================================================
    T.warning = Object.assign({}, base, {
        title: 'หนังสือเตือน', short: 'หนังสือเตือนพนักงาน', icon: 'fa-triangle-exclamation',
        desc: 'ตักเตือนพนักงานเป็นลายลักษณ์อักษรกรณีฝ่าฝืนระเบียบหรือบกพร่องต่อหน้าที่',
        law: 'พ.ร.บ.คุ้มครองแรงงาน พ.ศ. 2541 มาตรา 119 (หนังสือเตือนมีผลไม่เกิน 1 ปีนับแต่วันที่กระทำผิด)',
        fields: [
            ...noticeDoc(), ...issuer(), ...recipient('ชื่อพนักงาน'),
            { id: 'position', label: 'ตำแหน่ง / แผนก', group: 'terms', def: '' },
            { id: 'level', label: 'ระดับการเตือน', group: 'terms', type: 'select', def: 'ตักเตือนเป็นลายลักษณ์อักษรครั้งที่ 1', options: ['ตักเตือนเป็นลายลักษณ์อักษรครั้งที่ 1', 'ตักเตือนเป็นลายลักษณ์อักษรครั้งที่ 2', 'ตักเตือนครั้งสุดท้าย'] },
            { id: 'incidentDate', label: 'วันที่เกิดเหตุ', group: 'terms', type: 'date', def: '' },
            { id: 'facts', label: 'ข้อเท็จจริง / พฤติการณ์ที่ทำผิด (ระบุให้ชัดเจน)', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'rule', label: 'ระเบียบ / ข้อบังคับ / คำสั่งที่ฝ่าฝืน', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'expect', label: 'สิ่งที่ต้องปรับปรุง / แนวทางแก้ไข', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'consequence', label: 'ผลหากกระทำซ้ำ', group: 'terms', def: 'บริษัทจะพิจารณาลงโทษทางวินัยตามระเบียบ จนถึงขั้นเลิกจ้าง', full: true },
            extra()
        ],
        notice(f, h) {
            return {
                subject: `${esc(f.level)}`,
                to: `${h.v('bName', 12)}${f.position ? ' ตำแหน่ง ' + esc(f.position) : ''}`,
                paras: [
                    `ตามที่ปรากฏว่า เมื่อวันที่ ${h.date('incidentDate')} ท่านได้กระทำการดังต่อไปนี้`,
                    { html: `<div class="ct-box">${h.multi('facts')}</div>` },
                    `การกระทำดังกล่าวเป็นการฝ่าฝืนระเบียบ ข้อบังคับ หรือคำสั่งของบริษัท ได้แก่ ${h.multi('rule')}`,
                    `บริษัทจึงขอ${esc(f.level)} และให้ท่านปรับปรุงแก้ไขโดย ${h.multi('expect')}`,
                    `หนังสือเตือนฉบับนี้มีผลบังคับเป็นเวลา 1 ปี นับแต่วันที่ท่านกระทำผิดตามที่ระบุข้างต้น หากท่านกระทำผิดซ้ำในลักษณะเดียวกันภายในระยะเวลาดังกล่าว ${esc(f.consequence)}`,
                    extraPara(f)
                ],
                closing: 'จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด',
                ack: { title: 'การรับทราบ', text: 'ข้าพเจ้าได้รับและอ่านหนังสือเตือนฉบับนี้แล้ว รับทราบข้อเท็จจริงและแนวทางแก้ไขตามที่ระบุ (การลงนามเป็นการรับทราบ ไม่ใช่การยอมรับว่าตนกระทำผิด)' }
            };
        },
        warn(f) {
            const w = [];
            if (!String(f.facts || '').trim()) w.push('ยังไม่ได้ระบุข้อเท็จจริงที่ทำผิด — หนังสือเตือนต้องระบุพฤติการณ์ให้ชัดเจนตามมาตรา 119');
            if (!f.incidentDate) w.push('ยังไม่ได้ระบุวันที่เกิดเหตุ (ใช้นับอายุหนังสือเตือน 1 ปี)');
            return w;
        }
    });

    // ============================================================
    // 2. หนังสือแจ้งเตือนผิดสัญญา / ทวงถาม
    // ============================================================
    T.breach = Object.assign({}, base, {
        title: 'หนังสือแจ้งเตือนให้ปฏิบัติตามสัญญา', short: 'แจ้งเตือนผิดสัญญา / ทวงถาม', icon: 'fa-bell',
        desc: 'บอกกล่าวให้คู่สัญญาแก้ไขหรือชำระภายในกำหนด ก่อนใช้สิทธิบอกเลิกสัญญา',
        law: 'ป.พ.พ. มาตรา 387 (บอกกล่าวกำหนดเวลาพอสมควร) · มาตรา 224 (ดอกเบี้ยผิดนัด)',
        fields: [
            ...noticeDoc(), ...issuer(), ...recipient('ชื่อคู่สัญญา (ผู้รับหนังสือ)'),
            { id: 'contractName', label: 'สัญญา (ชื่อ / เรื่อง)', group: 'terms', def: '', full: true },
            { id: 'contractNo', label: 'เลขที่สัญญา', group: 'terms', def: '' },
            { id: 'contractDate', label: 'ลงวันที่', group: 'terms', type: 'date', def: '' },
            { id: 'issue', label: 'การผิดสัญญา / สิ่งที่ยังไม่ได้ปฏิบัติ', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'demand', label: 'สิ่งที่ขอให้ปฏิบัติ', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'amountDue', label: 'จำนวนเงินที่ค้างชำระ (บาท · ถ้ามี)', group: 'pay', type: 'number', def: '' },
            { id: 'interest', label: 'ดอกเบี้ยผิดนัด (% ต่อปี · 0 = ไม่เรียก)', group: 'pay', type: 'number', def: '15' },
            { id: 'days', label: 'ให้ปฏิบัติภายใน (วัน นับแต่ได้รับหนังสือ)', group: 'terms', type: 'number', def: '15' },
            { id: 'consequence', label: 'หากไม่ปฏิบัติ', group: 'terms', type: 'select', def: 'บริษัทขอสงวนสิทธิบอกเลิกสัญญาและเรียกค่าเสียหายตามกฎหมาย', options: ['บริษัทขอสงวนสิทธิบอกเลิกสัญญาและเรียกค่าเสียหายตามกฎหมาย', 'บริษัทขอสงวนสิทธิดำเนินคดีตามกฎหมายโดยไม่ต้องแจ้งเตือนอีก', 'บริษัทขอสงวนสิทธิระงับการให้บริการ/การส่งมอบจนกว่าจะปฏิบัติครบถ้วน'] },
            extra()
        ],
        summaryAmount: (f) => Number(f.amountDue) || 0,
        notice(f, h) {
            const amt = Number(f.amountDue) > 0;
            return {
                subject: 'บอกกล่าวให้ปฏิบัติตามสัญญา',
                to: h.v('bName', 12),
                ref: `สัญญา ${h.v('contractName', 10)} ${f.contractNo ? 'เลขที่ ' + esc(f.contractNo) : ''} ${f.contractDate ? 'ลงวันที่ ' + esc(thaiDate(f.contractDate)) : ''}`,
                paras: [
                    `ตามที่ท่านและบริษัทได้ทำสัญญาตามที่อ้างถึง ปรากฏว่าท่านยังไม่ได้ปฏิบัติตามสัญญา ดังนี้`,
                    { html: `<div class="ct-box">${h.multi('issue')}</div>` },
                    `บริษัทจึงขอบอกกล่าวให้ท่านปฏิบัติดังนี้: ${h.multi('demand')}${amt ? ` และชำระเงินที่ค้างจำนวน ${h.money('amountDue')}` : ''} ภายใน ${h.v('days', 2)} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้ ซึ่งเป็นระยะเวลาอันสมควรตามมาตรา 387 แห่งประมวลกฎหมายแพ่งและพาณิชย์`,
                    amt && Number(f.interest) > 0 ? `หากท่านชำระล่าช้า บริษัทมีสิทธิเรียกดอกเบี้ยผิดนัดในอัตราร้อยละ ${Number(f.interest)} ต่อปี นับแต่วันผิดนัดจนกว่าจะชำระเสร็จ` : '',
                    `หากท่านเพิกเฉยหรือไม่ปฏิบัติภายในกำหนดดังกล่าว ${esc(f.consequence)}`,
                    extraPara(f)
                ],
                closing: 'จึงเรียนมาเพื่อโปรดทราบและดำเนินการ'
            };
        },
        warn(f) {
            const w = [];
            if (!String(f.issue || '').trim()) w.push('ยังไม่ได้ระบุการผิดสัญญา');
            if (!String(f.demand || '').trim()) w.push('ยังไม่ได้ระบุสิ่งที่ขอให้ปฏิบัติ');
            if (Number(f.days) > 0 && Number(f.days) < 7) w.push('ระยะเวลาให้ปฏิบัติสั้นกว่า 7 วัน — ศาลอาจไม่ถือว่าเป็นระยะเวลาอันสมควร');
            return w;
        }
    });

    // ============================================================
    // 3. หนังสือเลิกจ้าง
    // ============================================================
    const REASONS = {
        probation: 'ไม่ผ่านการทดลองงาน',
        restructure: 'ปรับโครงสร้างองค์กร / เลิกตำแหน่งงาน',
        performance: 'ผลการปฏิบัติงานไม่เป็นไปตามเกณฑ์',
        misconduct: 'กระทำผิดตามมาตรา 119 (ไม่ต้องจ่ายค่าชดเชย)'
    };

    // ม.118: ค่าชดเชยตามอายุงาน (วัน = อัตราค่าจ้างวันสุดท้าย)
    function severanceDays(startIso, endIso) {
        if (!startIso || !endIso) return 0;
        const d = Math.floor((new Date(endIso) - new Date(startIso)) / 86400000) + 1;
        if (d < 120) return 0;
        const y = d / 365.25;
        if (y < 1) return 30;
        if (y < 3) return 90;
        if (y < 6) return 180;
        if (y < 10) return 240;
        if (y < 20) return 300;
        return 400;
    }
    const serviceText = (startIso, endIso) => {
        if (!startIso || !endIso) return '';
        const d = Math.floor((new Date(endIso) - new Date(startIso)) / 86400000) + 1;
        if (d <= 0) return '';
        const y = Math.floor(d / 365.25), m = Math.floor((d - y * 365.25) / 30.44);
        return `${y ? y + ' ปี ' : ''}${m ? m + ' เดือน' : (y ? '' : d + ' วัน')}`.trim();
    };

    function dismissalCalc(f) {
        const salary = Number(f.salary) || 0;
        const daily = salary / 30;
        const misconduct = f.reason === REASONS.misconduct;
        const sevDays = misconduct ? 0 : severanceDays(f.startDate, f.lastDay);
        const severance = Math.round(sevDays * daily * 100) / 100;
        const noticePay = !misconduct && f.noticeMode === 'จ่ายค่าบอกกล่าวล่วงหน้าแทน' ? salary : 0;
        const leavePay = Math.round((Number(f.leaveDays) || 0) * daily * 100) / 100;
        const other = Number(f.otherPay) || 0;
        return { salary, daily, sevDays, severance, noticePay, leavePay, other, total: severance + noticePay + leavePay + other, misconduct };
    }

    T.dismissal = Object.assign({}, base, {
        title: 'หนังสือเลิกจ้าง', short: 'หนังสือเลิกจ้าง', icon: 'fa-user-xmark',
        desc: 'แจ้งเลิกจ้างพนักงาน คำนวณค่าชดเชยตามอายุงานให้อัตโนมัติ',
        law: 'พ.ร.บ.คุ้มครองแรงงาน พ.ศ. 2541 มาตรา 17, 118, 119 · ป.พ.พ. มาตรา 582',
        fields: [
            ...noticeDoc(), ...issuer(), ...recipient('ชื่อพนักงาน'),
            { id: 'position', label: 'ตำแหน่ง', group: 'terms', def: '' },
            { id: 'startDate', label: 'วันที่เริ่มงาน', group: 'terms', type: 'date', def: '' },
            { id: 'lastDay', label: 'วันสุดท้ายของการจ้าง (วันที่เลิกจ้างมีผล)', group: 'terms', type: 'date', def: '' },
            { id: 'reason', label: 'เหตุผลการเลิกจ้าง', group: 'terms', type: 'select', def: REASONS.restructure, options: Object.values(REASONS) },
            { id: 'reasonText', label: 'รายละเอียดเหตุผล (ระบุให้ชัดเจน)', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'noticeMode', label: 'การบอกกล่าวล่วงหน้า', group: 'terms', type: 'select', def: 'แจ้งล่วงหน้าตามกำหนดแล้ว', options: ['แจ้งล่วงหน้าตามกำหนดแล้ว', 'จ่ายค่าบอกกล่าวล่วงหน้าแทน'] },
            { id: 'handover', label: 'การส่งมอบงาน / ทรัพย์สินบริษัท', group: 'terms', type: 'textarea', def: 'ส่งมอบงานที่ค้าง เอกสาร ข้อมูล บัญชีผู้ใช้ และอุปกรณ์ของบริษัทให้ครบถ้วนภายในวันสุดท้ายของการจ้าง', full: true },
            { id: 'salary', label: 'เงินเดือนสุดท้าย (บาท/เดือน)', group: 'pay', type: 'number', def: '' },
            { id: 'leaveDays', label: 'วันพักผ่อนประจำปีที่ยังไม่ได้ใช้ (วัน)', group: 'pay', type: 'number', def: '0' },
            { id: 'otherPay', label: 'เงินอื่น ๆ ที่ต้องจ่าย (บาท · ถ้ามี)', group: 'pay', type: 'number', def: '' },
            { id: 'payDate', label: 'กำหนดจ่ายเงินตามหนังสือนี้', group: 'pay', type: 'date', def: '' },
            extra()
        ],
        summaryAmount: (f) => dismissalCalc(f).total,
        notice(f, h) {
            const c = dismissalCalc(f);
            const svc = serviceText(f.startDate, f.lastDay);
            const rows = [];
            const row = (k, v) => rows.push(`<tr><td>${k}</td><td class="r">${fmt(v)}</td></tr>`);
            if (!c.misconduct) row(`ค่าชดเชยตามมาตรา 118 (${c.sevDays} วัน × ${fmt(c.daily)} บาท)`, c.severance);
            if (c.noticePay) row('ค่าบอกกล่าวล่วงหน้า (ตามมาตรา 17 — แทนการบอกกล่าว)', c.noticePay);
            if (c.leavePay) row(`ค่าพักผ่อนประจำปีที่ยังไม่ได้ใช้ (${Number(f.leaveDays)} วัน)`, c.leavePay);
            if (c.other) row('เงินอื่น ๆ', c.other);
            const table = rows.length ? `<table class="ct-table"><tbody>${rows.join('')}<tr class="t"><td>รวมเป็นเงินที่จ่ายตามหนังสือนี้</td><td class="r">${fmt(c.total)}</td></tr></tbody></table><p class="ct-note-s">(${bahtText(c.total)}) — ยังไม่รวมค่าจ้างค้างจ่ายถึงวันสุดท้ายของการจ้าง ซึ่งบริษัทจะจ่ายตามปกติ</p>` : '';
            return {
                subject: 'การเลิกจ้าง',
                to: `${h.v('bName', 12)}${f.position ? ' ตำแหน่ง ' + esc(f.position) : ''}`,
                paras: [
                    `บริษัทขอแจ้งว่า บริษัทมีความจำเป็นต้องเลิกจ้างท่าน โดยให้การจ้างสิ้นสุดลงตั้งแต่วันที่ ${h.date('lastDay')} เป็นต้นไป${svc ? ` (อายุงาน ${esc(svc)} นับจากวันที่ ${esc(thaiDate(f.startDate))})` : ''} ด้วยเหตุผลคือ ${esc(f.reason)}`,
                    String(f.reasonText || '').trim() ? { html: `<div class="ct-box">${h.multi('reasonText')}</div>` } : '',
                    c.misconduct
                        ? 'การเลิกจ้างนี้เป็นการเลิกจ้างด้วยเหตุตามมาตรา 119 แห่งพระราชบัญญัติคุ้มครองแรงงาน พ.ศ. 2541 ท่านจึงไม่มีสิทธิได้รับค่าชดเชยและค่าบอกกล่าวล่วงหน้า แต่บริษัทจะจ่ายค่าจ้างและเงินอื่นที่ท่านมีสิทธิได้รับตามกฎหมายจนถึงวันสุดท้ายของการจ้าง'
                        : 'บริษัทจะชำระเงินที่ท่านมีสิทธิได้รับตามกฎหมายคุ้มครองแรงงาน ดังนี้',
                    c.misconduct ? (c.leavePay || c.other ? { html: table } : '') : { html: table },
                    h.raw('payDate') ? `บริษัทจะชำระเงินดังกล่าวให้แก่ท่านภายในวันที่ ${h.date('payDate')}` : '',
                    `ขอให้ท่านดำเนินการส่งมอบงานและทรัพย์สินของบริษัท ดังนี้: ${h.multi('handover')}`,
                    'หน้าที่รักษาความลับทางการค้าและข้อมูลของบริษัทตามสัญญาจ้างยังคงมีผลบังคับต่อไปตามที่ตกลงกัน',
                    extraPara(f)
                ],
                closing: 'จึงเรียนมาเพื่อทราบ',
                ack: { title: 'การรับทราบ', text: 'ข้าพเจ้าได้รับหนังสือเลิกจ้างฉบับนี้แล้ว (การลงนามเป็นเพียงการรับทราบการได้รับหนังสือ)' }
            };
        },
        warn(f) {
            const w = [];
            const c = dismissalCalc(f);
            if (!f.startDate || !f.lastDay) w.push('ระบุวันที่เริ่มงานและวันสุดท้ายของการจ้าง เพื่อคำนวณค่าชดเชย');
            if (f.startDate && f.lastDay && f.lastDay < f.startDate) w.push('วันสุดท้ายของการจ้างอยู่ก่อนวันที่เริ่มงาน');
            if (!c.salary) w.push('ยังไม่ได้กรอกเงินเดือน — ระบบคำนวณค่าชดเชยไม่ได้');
            if (c.misconduct) w.push('เลิกจ้างตามมาตรา 119 ต้องมีเหตุตามที่กฎหมายกำหนด (เช่น ทุจริต ทำผิดอาญาโดยเจตนา จงใจทำให้นายจ้างเสียหาย ฝ่าฝืนระเบียบร้ายแรงโดยเคยได้รับหนังสือเตือนแล้ว ละทิ้งหน้าที่ 3 วันติดต่อกัน) และควรมีหลักฐานครบ — ปรึกษาทนายก่อนออกหนังสือ');
            if (!c.misconduct && !String(f.reasonText || '').trim()) w.push('ควรระบุรายละเอียดเหตุผลการเลิกจ้างให้ชัดเจน');
            return w;
        }
    });

    // ============================================================
    // 4. หนังสือบอกเลิกสัญญา (ฝ่ายเดียว)
    // ============================================================
    T.termination = Object.assign({}, base, {
        title: 'หนังสือบอกเลิกสัญญา', short: 'หนังสือบอกเลิกสัญญา (ฝ่ายเดียว)', icon: 'fa-file-circle-xmark',
        desc: 'บริษัทบอกเลิกสัญญากับคู่สัญญา เช่น ผู้รับจ้าง ลูกค้า หรือผู้ให้บริการ',
        law: 'ป.พ.พ. มาตรา 386–392 (การเลิกสัญญา) · มาตรา 387 (บอกกล่าวก่อนบอกเลิก)',
        fields: [
            ...noticeDoc(), ...issuer(), ...recipient('ชื่อคู่สัญญา (ผู้รับหนังสือ)'),
            { id: 'contractName', label: 'สัญญา (ชื่อ / เรื่อง)', group: 'terms', def: '', full: true },
            { id: 'contractNo', label: 'เลขที่สัญญา', group: 'terms', def: '' },
            { id: 'contractDate', label: 'ลงวันที่', group: 'terms', type: 'date', def: '' },
            { id: 'basis', label: 'เหตุที่บอกเลิก', group: 'terms', type: 'select', def: 'คู่สัญญาผิดสัญญาและไม่แก้ไขภายในกำหนดตามหนังสือบอกกล่าว', options: ['คู่สัญญาผิดสัญญาและไม่แก้ไขภายในกำหนดตามหนังสือบอกกล่าว', 'ใช้สิทธิบอกเลิกสัญญาโดยแจ้งล่วงหน้าตามที่กำหนดในสัญญา', 'อื่น ๆ (ระบุในรายละเอียด)'] },
            { id: 'detail', label: 'รายละเอียด / ข้อเท็จจริง', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'priorNotice', label: 'อ้างถึงหนังสือบอกกล่าวก่อนหน้า (เลขที่ / วันที่)', group: 'terms', def: '', full: true },
            { id: 'effectiveDate', label: 'การบอกเลิกมีผลตั้งแต่', group: 'terms', type: 'date', def: '' },
            { id: 'handover', label: 'สิ่งที่ขอให้ส่งมอบ / คืน', group: 'terms', type: 'textarea', def: 'ให้ส่งมอบงานที่ทำแล้ว เอกสาร ข้อมูล และทรัพย์สินของบริษัททั้งหมด', full: true },
            { id: 'settle', label: 'การชำระเงินหลังเลิกสัญญา', group: 'pay', type: 'select', def: 'บริษัทจะชำระค่าตอบแทนตามสัดส่วนงานที่ได้ดำเนินการแล้วจริง', options: ['บริษัทจะชำระค่าตอบแทนตามสัดส่วนงานที่ได้ดำเนินการแล้วจริง', 'ไม่มีเงินที่บริษัทต้องชำระเพิ่มเติม', 'ขอให้คู่สัญญาคืนเงินที่ได้รับชำระล่วงหน้า'] },
            { id: 'settleAmt', label: 'จำนวนเงิน (บาท · ถ้ามี)', group: 'pay', type: 'number', def: '' },
            extra()
        ],
        summaryAmount: (f) => Number(f.settleAmt) || 0,
        notice(f, h) {
            return {
                subject: 'บอกเลิกสัญญา',
                to: h.v('bName', 12),
                ref: `สัญญา ${h.v('contractName', 10)} ${f.contractNo ? 'เลขที่ ' + esc(f.contractNo) : ''} ${f.contractDate ? 'ลงวันที่ ' + esc(thaiDate(f.contractDate)) : ''}${f.priorNotice ? '<br>หนังสือบอกกล่าว ' + esc(f.priorNotice) : ''}`,
                paras: [
                    `ตามที่บริษัทและท่านได้ทำสัญญาตามที่อ้างถึง บริษัทขอแจ้งว่า บริษัทขอใช้สิทธิบอกเลิกสัญญาดังกล่าว เนื่องจาก ${esc(f.basis)}`,
                    String(f.detail || '').trim() ? { html: `<div class="ct-box">${h.multi('detail')}</div>` } : '',
                    `การบอกเลิกสัญญามีผลตั้งแต่วันที่ ${h.date('effectiveDate')} เป็นต้นไป`,
                    `เมื่อสัญญาเลิกกัน ขอให้ท่านดำเนินการดังนี้: ${h.multi('handover')}`,
                    `${esc(f.settle)}${Number(f.settleAmt) > 0 ? ` เป็นจำนวน ${h.money('settleAmt')}` : ''}`,
                    'ข้อกำหนดเรื่องการรักษาความลับและทรัพย์สินทางปัญญาตามสัญญายังคงมีผลบังคับต่อไปตามที่ระบุในสัญญา ทั้งนี้ บริษัทขอสงวนสิทธิเรียกร้องค่าเสียหายที่เกิดขึ้นจากการผิดสัญญา (ถ้ามี) ตามมาตรา 391 แห่งประมวลกฎหมายแพ่งและพาณิชย์',
                    extraPara(f)
                ],
                closing: 'จึงเรียนมาเพื่อทราบ',
                ack: { title: 'การรับหนังสือ', text: 'ข้าพเจ้าได้รับหนังสือบอกเลิกสัญญาฉบับนี้แล้ว' }
            };
        },
        warn(f) {
            const w = [];
            if (!String(f.contractName || '').trim()) w.push('ยังไม่ได้ระบุสัญญาที่บอกเลิก');
            if (!f.effectiveDate) w.push('ยังไม่ได้ระบุวันที่การบอกเลิกมีผล');
            if (String(f.basis || '').startsWith('คู่สัญญาผิดสัญญา') && !String(f.priorNotice || '').trim()) w.push('บอกเลิกเพราะผิดสัญญา ควรเคยส่งหนังสือแจ้งเตือนกำหนดเวลาให้แก้ไขก่อน (มาตรา 387) — ระบุหนังสือที่อ้างถึง หรือออก "แจ้งเตือนผิดสัญญา" ก่อน');
            return w;
        }
    });

    // ============================================================
    // 5. ข้อตกลงยกเลิกสัญญา (สองฝ่าย)
    // ============================================================
    T.mutual_end = {
        title: 'ข้อตกลงยกเลิกสัญญา', short: 'ข้อตกลงยกเลิกสัญญา (สองฝ่ายตกลง)', icon: 'fa-handshake-slash', group: 'end', prefix: 'CT',
        desc: 'คู่สัญญาตกลงยุติสัญญาร่วมกัน พร้อมสรุปการชำระเงินและส่งคืนทรัพย์สิน',
        law: 'ป.พ.พ. มาตรา 369 (หนี้ระงับ) · เสรีภาพในการทำสัญญา · มาตรา 850 (การประนีประนอมยอมความ)',
        roles: { a: 'ฝ่ายที่หนึ่ง', b: 'ฝ่ายที่สอง' }, kittenSide: 'a', otherLabel: 'คู่สัญญา',
        fields: [
            ...C._k.docFields(),
            ...C._k.party('a', 'a', true), ...C._k.party('b', 'b', false),
            { id: 'contractName', label: 'สัญญาที่ยกเลิก (ชื่อ / เรื่อง)', group: 'terms', def: '', full: true },
            { id: 'contractNo', label: 'เลขที่สัญญา', group: 'terms', def: '' },
            { id: 'contractDate', label: 'ลงวันที่', group: 'terms', type: 'date', def: '' },
            { id: 'endDate', label: 'สัญญาสิ้นสุดตั้งแต่วันที่', group: 'terms', type: 'date', def: '__today' },
            { id: 'reason', label: 'เหตุผลที่ตกลงยกเลิก (ไม่บังคับ)', group: 'terms', type: 'textarea', def: '', full: true },
            { id: 'returns', label: 'การส่งคืนทรัพย์สิน / เอกสาร / ข้อมูล', group: 'terms', type: 'textarea', def: 'ต่างฝ่ายต่างส่งคืนทรัพย์สิน เอกสาร และข้อมูลของอีกฝ่ายให้ครบถ้วนภายใน 7 วัน นับแต่วันที่สัญญาสิ้นสุด', full: true },
            { id: 'confYears', label: 'รักษาความลับต่อไปอีก (ปี)', group: 'terms', type: 'number', def: '2' },
            { id: 'court', label: 'ศาลที่มีเขตอำนาจ', group: 'terms', def: 'ศาลจังหวัดพิษณุโลก' },
            { id: 'payDir', label: 'การชำระเงินเมื่อยกเลิก', group: 'pay', type: 'select', def: 'ไม่มีการชำระเงินระหว่างกัน', options: ['ไม่มีการชำระเงินระหว่างกัน', 'ฝ่ายที่หนึ่งชำระให้ฝ่ายที่สอง', 'ฝ่ายที่สองชำระให้ฝ่ายที่หนึ่ง'] },
            { id: 'payAmt', label: 'จำนวนเงิน (บาท)', group: 'pay', type: 'number', def: '' },
            { id: 'payDate', label: 'กำหนดชำระภายในวันที่', group: 'pay', type: 'date', def: '' },
            C._k.extraField()
        ],
        summaryAmount: (f) => Number(f.payAmt) || 0,
        clauses(f, h) {
            const pays = f.payDir && f.payDir !== 'ไม่มีการชำระเงินระหว่างกัน';
            return [
                { t: 'ความเป็นมา', i: [
                    `คู่สัญญาได้ทำสัญญา “${h.v('contractName', 10)}” ${f.contractNo ? `เลขที่ ${esc(f.contractNo)} ` : ''}ลงวันที่ ${h.date('contractDate')} (“สัญญาเดิม”)`,
                    String(f.reason || '').trim() ? `บัดนี้ คู่สัญญามีความประสงค์ยกเลิกสัญญาเดิม เนื่องจาก ${h.multi('reason')}` : 'บัดนี้ คู่สัญญามีความประสงค์ยกเลิกสัญญาเดิมโดยความตกลงร่วมกัน'
                ].filter(Boolean) },
                { t: 'การยกเลิกสัญญา', i: [`คู่สัญญาตกลงยกเลิกสัญญาเดิม โดยให้สิ้นผลผูกพันตั้งแต่วันที่ ${h.date('endDate')} เป็นต้นไป และคู่สัญญาไม่มีหน้าที่ต้องปฏิบัติตามสัญญาเดิมต่อไป เว้นแต่ที่ระบุไว้ในข้อตกลงนี้`] },
                { t: 'การชำระเงินและการส่งคืน', i: [
                    pays ? `${esc(f.payDir)} เป็นจำนวนเงิน ${h.money('payAmt')} ภายในวันที่ ${h.date('payDate')} เป็นการชำระครบถ้วนทุกรายการตามสัญญาเดิม` : 'คู่สัญญารับรองว่าไม่มีเงินค่าตอบแทนหรือค่าใช้จ่ายค้างชำระต่อกันตามสัญญาเดิม',
                    h.multi('returns')
                ] },
                { t: 'การปลดเปลื้องภาระ', i: ['เมื่อได้ปฏิบัติตามข้อตกลงนี้ครบถ้วนแล้ว คู่สัญญาตกลงว่าต่างฝ่ายต่างไม่มีข้อเรียกร้อง ค่าเสียหาย หรือสิทธิใด ๆ ต่อกันอีกตามสัญญาเดิม เว้นแต่กรณีการละเมิดหน้าที่รักษาความลับหรือทรัพย์สินทางปัญญา'] },
                { t: 'ความลับและทรัพย์สินทางปัญญา', i: [`ข้อกำหนดเรื่องการรักษาความลับและทรัพย์สินทางปัญญาตามสัญญาเดิมยังคงมีผลต่อไปอีก ${h.n('confYears') || 2} ปี นับแต่วันที่สัญญาสิ้นสุด`] },
                C._k.disputeClause(h)
            ];
        },
        warn(f) {
            const w = [];
            if (!String(f.contractName || '').trim()) w.push('ยังไม่ได้ระบุสัญญาที่ยกเลิก');
            if (f.payDir && f.payDir !== 'ไม่มีการชำระเงินระหว่างกัน' && !Number(f.payAmt)) w.push('เลือกให้มีการชำระเงิน แต่ยังไม่ได้ใส่จำนวนเงิน');
            return w;
        }
    };


    // ============================================================
    // 6. ใบสำคัญรับเงินค่าคอมมิชชั่น (จ่ายให้ผู้แนะนำ / ตัวแทนขาย)
    // ============================================================
    const METHODS = ['โอนเงินเข้าบัญชี', 'เงินสด', 'เช็ค'];

    function commissionCalc(f) {
        const base = Number(f.baseAmount) || 0;
        const rate = Number(f.rate) || 0;
        const fixed = Number(f.fixedAmt) || 0;
        const gross = Math.round((fixed > 0 ? fixed : base * rate / 100) * 100) / 100;
        const wRate = Number(f.whtRate) || 0;
        const wht = Math.round(gross * wRate) / 100;
        const vRate = Number(f.vatRate) || 0;
        const vat = Math.round(gross * vRate) / 100;     // VAT is added on top; withholding is on the pre-VAT amount
        return { base, rate, fixed, gross, wRate, wht, vRate, vat, net: Math.round((gross + vat - wht) * 100) / 100 };
    }

    const INCOME_TYPES = [
        '1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)',
        '2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)',
        '3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)',
        '4. ดอกเบี้ย เงินปันผล ฯลฯ ตามมาตรา 40 (4)',
        '5. ค่าจ้างทำของ ค่าบริการ และเงินได้อื่น ตามมาตรา 40 (5)–(8)'
    ];

    T.commission = {
        title: 'ใบสำคัญรับเงินค่าคอมมิชชั่น', short: 'ใบรับเงินค่าคอมมิชชั่น', icon: 'fa-hand-holding-dollar',
        group: 'out', prefix: 'CM', roles: { a: 'ผู้จ่ายเงิน', b: 'ผู้รับเงิน' }, kittenSide: 'a', otherLabel: 'ผู้รับเงิน',
        desc: 'หลักฐานจ่ายค่าคอมมิชชั่น / ค่านายหน้า คำนวณภาษีหัก ณ ที่จ่ายและยอดโอนสุทธิให้',
        law: 'ประมวลรัษฎากร (ภาษีหัก ณ ที่จ่าย — ต้องออกหนังสือรับรองการหักภาษี 50 ทวิ) · ป.พ.พ. มาตรา 845–849 (นายหน้า)',
        fields: [
            { id: 'signDate', label: 'วันที่จ่ายเงิน', group: 'doc', type: 'date', def: '__today' },
            { id: 'aName', label: 'ผู้จ่ายเงิน (บริษัท)', group: 'a', def: KITTEN.name, full: true },
            { id: 'aId', label: 'เลขประจำตัวผู้เสียภาษี', group: 'a', def: KITTEN.id },
            { id: 'signerName', label: 'ผู้จ่ายเงิน (ลงนาม)', group: 'a', def: '' },
            { id: 'aAddress', label: 'ที่อยู่', group: 'a', type: 'textarea', def: KITTEN.address, full: true },
            { id: 'bName', label: 'ชื่อผู้รับเงิน', group: 'b', def: '', full: true },
            { id: 'bId', label: 'เลขประจำตัวประชาชน / เลขผู้เสียภาษี', group: 'b', def: '' },
            { id: 'bPhone', label: 'เบอร์โทร', group: 'b', def: '' },
            { id: 'bAddress', label: 'ที่อยู่ผู้รับเงิน', group: 'b', type: 'textarea', def: '', full: true },
            { id: 'refDoc', label: 'อ้างอิง (เลขที่ใบเสนอราคา / ใบแจ้งหนี้ / สัญญา)', group: 'terms', def: '', full: true },
            { id: 'customer', label: 'ลูกค้า / โครงการที่ได้ค่าคอมมิชชั่น', group: 'terms', def: '', full: true },
            { id: 'baseAmount', label: 'ยอดขายที่ใช้คำนวณ (บาท)', group: 'pay', type: 'number', def: '' },
            { id: 'rate', label: 'อัตราคอมมิชชั่น (%)', group: 'pay', type: 'number', def: '' },
            { id: 'fixedAmt', label: 'หรือระบุเป็นจำนวนเงินคงที่ (บาท · ถ้าใส่จะใช้ค่านี้แทน)', group: 'pay', type: 'number', def: '' },
            { id: 'payeeKind', label: 'ผู้รับเป็น', group: 'pay', type: 'select', def: 'บุคคลธรรมดา', options: ['บุคคลธรรมดา', 'นิติบุคคล (บริษัท/ห้างหุ้นส่วน)'] },
            { id: 'whtRate', label: 'หักภาษี ณ ที่จ่าย (% · ปกติ 3 · 0 = ไม่หัก)', group: 'pay', type: 'number', def: '3' },
            { id: 'vatRate', label: 'ภาษีมูลค่าเพิ่มของผู้รับ (% · 0 = ผู้รับไม่ได้จด VAT)', group: 'pay', type: 'number', def: '0' },
            { id: 'method', label: 'วิธีจ่าย', group: 'pay', type: 'select', def: METHODS[0], options: METHODS },
            { id: 'bankName', label: 'ธนาคาร', group: 'pay', def: '' },
            { id: 'bankHolder', label: 'ชื่อบัญชี', group: 'pay', def: '' },
            { id: 'bankNo', label: 'เลขที่บัญชี', group: 'pay', def: '' },
            { id: 'note', label: 'หมายเหตุ', group: 'extra', type: 'textarea', def: '', full: true }
        ],
        summaryAmount: (f) => commissionCalc(f).gross,
        convertTo: {
            type: 'wht50',
            label: 'ออกหนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ) จากใบนี้',
            map(f) {
                const c = commissionCalc(f);
                const juristic = String(f.payeeKind || '').startsWith('นิติบุคคล');
                return {
                    signDate: f.signDate, aName: f.aName, aId: f.aId, aAddress: f.aAddress, signerName: f.signerName,
                    bName: f.bName, bId: f.bId, bAddress: f.bAddress,
                    formType: juristic ? 'ภ.ง.ด.53' : 'ภ.ง.ด.3',
                    incomeType: INCOME_TYPES[1], incomeDesc: 'ค่าคอมมิชชั่น / ค่านายหน้า',
                    payDate: f.signDate, amount: c.gross, rate: c.wRate, taxPaid: c.wht
                };
            }
        },
        render(rec, f, h, K2) {
            const c = commissionCalc(f);
            const money = (n) => `${K2.fmt(n)}`;
            const row = (k, v, cls) => `<tr class="${cls || ''}"><td>${k}</td><td class="r">${v}</td></tr>`;
            const rows = [];
            if (c.fixed > 0) rows.push(row('ค่าคอมมิชชั่น (ตามจำนวนที่ตกลง)', money(c.gross)));
            else { rows.push(row('ยอดขายที่ใช้คำนวณ', money(c.base))); rows.push(row(`ค่าคอมมิชชั่น ${c.rate || '…'}%`, money(c.gross))); }
            if (c.vat > 0) rows.push(row(`บวก ภาษีมูลค่าเพิ่ม ${c.vRate}%`, '+ ' + money(c.vat)));
            if (c.wRate > 0) rows.push(row(`หัก ภาษีเงินได้ ณ ที่จ่าย ${c.wRate}% (คิดจากยอดก่อน VAT)`, '- ' + money(c.wht)));
            rows.push(row('ยอดโอน / จ่ายสุทธิ', money(c.net), 't'));
            const page = document.createElement('div');
            page.className = 'ct-paper ct-notice ct-receipt';
            page.innerHTML = `
                <div class="ct-head">${K2.brandHTML(rec.docNo)}
                    <h1 class="ct-title">ใบสำคัญรับเงินค่าคอมมิชชั่น</h1>
                    <p class="ct-place">Commission Payment Receipt</p>
                </div>
                <div class="ct-meta"><span>เลขที่ ${rec.docNo ? K2.esc(rec.docNo) : '..........'}</span><span>วันที่ ${h.date('signDate')}</span></div>
                <div class="ct-two">
                    <div class="ct-box"><b>ผู้รับเงิน</b><br>${h.v('bName', 12)}<br>เลขประจำตัวผู้เสียภาษี ${h.v('bId', 9)}<br>${h.v('bAddress', 14)}${f.bPhone ? '<br>โทร ' + K2.esc(f.bPhone) : ''}</div>
                    <div class="ct-box"><b>ผู้จ่ายเงิน</b><br>${h.v('aName', 12)}<br>เลขประจำตัวผู้เสียภาษี ${h.v('aId', 9)}<br>${h.v('aAddress', 14)}</div>
                </div>
                <p class="ct-line"><b>รายการ</b> ค่าคอมมิชชั่น/ค่านายหน้า จากงาน ${h.v('customer', 12)}${f.refDoc ? ' อ้างอิง ' + K2.esc(f.refDoc) : ''}</p>
                <table class="ct-table"><tbody>${rows.join('')}</tbody></table>
                <p class="ct-note-s">จำนวนเงินสุทธิ (ตัวอักษร): <b>${c.net > 0 ? K2.bahtText(c.net) : '……………………'}</b></p>
                <p class="ct-line"><b>วิธีจ่าย</b> ${K2.esc(f.method)}${f.method === METHODS[0] ? ` ธนาคาร ${h.v('bankName', 7)} ชื่อบัญชี ${h.v('bankHolder', 9)} เลขที่ ${h.v('bankNo', 9)}` : ''}</p>
                <p class="ct-para">ข้าพเจ้าผู้รับเงินขอรับรองว่าได้รับเงินค่าคอมมิชชั่นตามรายการข้างต้นครบถ้วนแล้ว ${c.wRate > 0 ? 'ผู้จ่ายเงินได้หักภาษีเงินได้ ณ ที่จ่ายและจะออกหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) ให้ตามกฎหมาย' : ''}</p>
                ${String(f.note || '').trim() ? `<p class="ct-line"><b>หมายเหตุ</b> <span class="ct-multi">${K2.esc(f.note)}</span></p>` : ''}
                <div class="ct-signs">
                    <div class="ct-sign"><div class="ct-sign-line">ลงชื่อ ................................................ ผู้รับเงิน</div><div class="ct-sign-name">( ${K2.esc(f.bName) || '................................................'} )</div><div class="ct-sign-sub">วันที่ ........../........../..........</div></div>
                    <div class="ct-sign"><div class="ct-sign-line">ลงชื่อ ................................................ ผู้จ่ายเงิน</div><div class="ct-sign-name">( ${K2.esc(f.signerName) || '................................................'} )</div><div class="ct-sign-sub">${K2.esc(f.aName || '')}</div></div>
                </div>`;
            return page;
        },
        warn(f) {
            const w = [];
            const c = commissionCalc(f);
            if (!c.gross) w.push('ยังไม่ได้ระบุยอดคอมมิชชั่น (กรอกยอดขายกับอัตรา % หรือจำนวนเงินคงที่)');
            if (!String(f.bId || '').trim()) w.push('ยังไม่ได้ใส่เลขประจำตัวผู้เสียภาษีของผู้รับ — จำเป็นสำหรับออกหนังสือหัก ณ ที่จ่าย');
            if (f.method === METHODS[0] && !String(f.bankNo || '').trim()) w.push('เลือกโอนเงิน แต่ยังไม่ได้ใส่เลขที่บัญชี');
            if (c.gross > 0 && c.wRate === 0) w.push('ไม่ได้หักภาษี ณ ที่จ่าย — ค่านายหน้า/ค่าคอมมิชชั่นปกติต้องหัก (มักใช้ 3%) ตรวจกับนักบัญชีว่าเข้าข้อยกเว้นหรือไม่');
            if (c.wRate > 0 && c.wRate !== 3) w.push(`อัตราหัก ${c.wRate}% ต่างจากที่ใช้กันทั่วไป (3%) — ยืนยันกับนักบัญชี`);
            if (String(f.payeeKind || '').startsWith('นิติบุคคล') && c.wRate > 0 && c.wRate !== 3) w.push('ผู้รับเป็นนิติบุคคล: ตรวจประเภทเงินได้และอัตราหักให้ตรงตาม ภ.ง.ด.53');
            if (c.gross > 0 && c.gross < 1000 && c.wRate > 0) w.push('ยอดจ่ายครั้งนี้ต่ำกว่า 1,000 บาท — บางกรณีไม่ต้องหักภาษี ตรวจกับนักบัญชี');
            return w;
        }
    };

    // ============================================================
    // 7. หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)
    // ============================================================
    const fmtTaxId = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.length === 13 ? `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}` : String(v || ''); };

    T.wht50 = {
        title: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย', short: 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)', icon: 'fa-file-invoice',
        group: 'out', prefix: 'WT', roles: { a: 'ผู้มีหน้าที่หักภาษี', b: 'ผู้ถูกหักภาษี' }, kittenSide: 'a', otherLabel: 'ผู้ถูกหักภาษี',
        desc: 'ออกให้ผู้รับเงินที่ถูกหักภาษี ณ ที่จ่าย ใช้เป็นหลักฐานเครดิตภาษี (ออกได้ทั้ง 2 ฉบับ)',
        law: 'ประมวลรัษฎากร มาตรา 50 ทวิ — ผู้หักต้องออกหนังสือรับรองให้ผู้ถูกหักทุกครั้ง · นำส่งภาษีด้วย ภ.ง.ด.3 / 53 ภายในวันที่ 7 ของเดือนถัดไป',
        fields: [
            { id: 'docSeq', label: 'เลขที่หนังสือ (เล่มที่/เลขที่)', group: 'doc', def: '' },
            { id: 'signDate', label: 'วันที่ออกหนังสือ', group: 'doc', type: 'date', def: '__today' },
            { id: 'copies', label: 'พิมพ์', group: 'doc', type: 'select', def: 'ทั้ง 2 ฉบับ', options: ['ทั้ง 2 ฉบับ', 'ฉบับที่ 1 (แนบแบบ)', 'ฉบับที่ 2 (เก็บไว้)'] },
            { id: 'aName', label: 'ผู้มีหน้าที่หักภาษี ณ ที่จ่าย', group: 'a', def: KITTEN.name, full: true },
            { id: 'aId', label: 'เลขประจำตัวผู้เสียภาษี (13 หลัก)', group: 'a', def: KITTEN.id },
            { id: 'signerName', label: 'ผู้จ่ายเงิน (ลงนาม)', group: 'a', def: '' },
            { id: 'aAddress', label: 'ที่อยู่', group: 'a', type: 'textarea', def: KITTEN.address, full: true },
            { id: 'bName', label: 'ผู้ถูกหักภาษี ณ ที่จ่าย', group: 'b', def: '', full: true },
            { id: 'bId', label: 'เลขประจำตัวผู้เสียภาษี (13 หลัก)', group: 'b', def: '' },
            { id: 'formType', label: 'ลำดับที่ในแบบ', group: 'b', type: 'select', def: 'ภ.ง.ด.3', options: ['ภ.ง.ด.1', 'ภ.ง.ด.3', 'ภ.ง.ด.53'] },
            { id: 'bAddress', label: 'ที่อยู่ผู้ถูกหักภาษี', group: 'b', type: 'textarea', def: '', full: true },
            { id: 'incomeType', label: 'ประเภทเงินได้พึงประเมินที่จ่าย', group: 'terms', type: 'select', def: INCOME_TYPES[1], options: INCOME_TYPES, full: true },
            { id: 'incomeDesc', label: 'รายละเอียด (เช่น ค่าคอมมิชชั่นงานเว็บ ABC)', group: 'terms', def: '', full: true },
            { id: 'payDate', label: 'วันที่จ่ายเงิน', group: 'terms', type: 'date', def: '__today' },
            { id: 'cond', label: 'ลักษณะการจ่าย', group: 'terms', type: 'select', def: '(1) หัก ณ ที่จ่าย', options: ['(1) หัก ณ ที่จ่าย', '(2) ออกให้ตลอดไป', '(3) ออกให้ครั้งเดียว', '(4) อื่น ๆ'] },
            { id: 'amount', label: 'จำนวนเงินที่จ่าย (บาท)', group: 'pay', type: 'number', def: '' },
            { id: 'rate', label: 'อัตราภาษีที่หัก (%)', group: 'pay', type: 'number', def: '3' },
            { id: 'taxPaid', label: 'ภาษีที่หักและนำส่ง (บาท · เว้นว่างให้คำนวณจากอัตรา)', group: 'pay', type: 'number', def: '' },
            { id: 'sso', label: 'เงินสมทบกองทุนประกันสังคม (บาท · ถ้ามี)', group: 'pay', type: 'number', def: '' },
            { id: 'pvf', label: 'กองทุนสำรองเลี้ยงชีพ (บาท · ถ้ามี)', group: 'pay', type: 'number', def: '' }
        ],
        summaryAmount: (f) => whtTax(f),
        render(rec, f, h, K2) {
            const amount = Number(f.amount) || 0;
            const tax = whtTax(f);
            const idx = Math.max(0, INCOME_TYPES.indexOf(f.incomeType));
            const copies = f.copies === 'ฉบับที่ 1 (แนบแบบ)' ? [1] : f.copies === 'ฉบับที่ 2 (เก็บไว้)' ? [2] : [1, 2];
            const conds = ['(1) หัก ณ ที่จ่าย', '(2) ออกให้ตลอดไป', '(3) ออกให้ครั้งเดียว', '(4) อื่น ๆ'];
            const box = (on) => on ? '☑' : '☐';
            const dt = K2.thaiDate(f.payDate);
            const wrap = document.createElement('div');
            wrap.className = 'ct-stack';
            copies.forEach((n) => {
                const page = document.createElement('div');
                page.className = 'ct-paper ct-wht';
                page.innerHTML = `
                    <div class="ct-wht-top"><span class="ct-wht-copy">${n === 1 ? 'ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ใช้แนบพร้อมกับแบบแสดงรายการภาษี)' : 'ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี เก็บไว้เป็นหลักฐาน)'}</span><span>เลขที่ ${f.docSeq ? K2.esc(f.docSeq) : '..........'}</span></div>
                    <h1 class="ct-title">หนังสือรับรองการหักภาษี ณ ที่จ่าย</h1>
                    <p class="ct-place">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</p>
                    <div class="ct-box"><b>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</b><br>ชื่อ ${h.v('aName', 14)} เลขประจำตัวผู้เสียภาษี ${K2.esc(fmtTaxId(f.aId)) || '................'}<br>ที่อยู่ ${h.v('aAddress', 20)}</div>
                    <div class="ct-box"><b>ผู้ถูกหักภาษี ณ ที่จ่าย</b> <span class="ct-wht-form">ลำดับที่ ........ ในแบบ ${K2.esc(f.formType)}</span><br>ชื่อ ${h.v('bName', 14)} เลขประจำตัวผู้เสียภาษี ${K2.esc(fmtTaxId(f.bId)) || '................'}<br>ที่อยู่ ${h.v('bAddress', 20)}</div>
                    <table class="ct-table ct-wht-table">
                        <thead><tr><td>ประเภทเงินได้พึงประเมินที่จ่าย</td><td class="c">วัน เดือน ปี ที่จ่าย</td><td class="c">จำนวนเงินที่จ่าย</td><td class="c">ภาษีที่หักและนำส่งไว้</td></tr></thead>
                        <tbody>
                            ${INCOME_TYPES.map((t, i) => i === idx
                                ? `<tr class="on"><td>${K2.esc(t)}${f.incomeDesc ? `<br><small>${K2.esc(f.incomeDesc)}</small>` : ''}</td><td class="c">${dt ? K2.esc(dt) : ''}</td><td class="r">${amount ? K2.fmt(amount) : ''}</td><td class="r">${tax ? K2.fmt(tax) : ''}</td></tr>`
                                : `<tr><td>${K2.esc(t)}</td><td></td><td></td><td></td></tr>`).join('')}
                            <tr class="t"><td colspan="2">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td><td class="r">${amount ? K2.fmt(amount) : ''}</td><td class="r">${tax ? K2.fmt(tax) : ''}</td></tr>
                        </tbody>
                    </table>
                    <p class="ct-note-s">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร): <b>${tax > 0 ? K2.bahtText(tax) : '……………………'}</b></p>
                    <p class="ct-line">เงินสมทบกองทุนประกันสังคม ${Number(f.sso) > 0 ? K2.fmt(Number(f.sso)) : '..........'} บาท &nbsp; กองทุนสำรองเลี้ยงชีพ ${Number(f.pvf) > 0 ? K2.fmt(Number(f.pvf)) : '..........'} บาท</p>
                    <p class="ct-line"><b>ผู้จ่ายเงิน</b> ${conds.map((c) => `${box(f.cond === c)} ${c}`).join(' &nbsp; ')}</p>
                    <p class="ct-note-s">คำเตือน: ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ ต้องรับโทษทางอาญาตามมาตรา 35 แห่งประมวลรัษฎากร</p>
                    <div class="ct-notice-sign"><p>ขอรับรองว่าข้อความข้างต้นถูกต้องตรงกับความจริงทุกประการ</p>
                        <div class="ct-sign-line">ลงชื่อ ................................................ ผู้จ่ายเงิน</div>
                        <div class="ct-sign-name">( ${K2.esc(f.signerName) || '................................................'} )</div>
                        <div class="ct-sign-sub">วันที่ ${h.date('signDate')}</div>
                        <div class="ct-sign-sub">(ประทับตรานิติบุคคล ถ้ามี)</div></div>`;
                wrap.appendChild(page);
            });
            return wrap;
        },
        warn(f) {
            const w = [];
            if (!(Number(f.amount) > 0)) w.push('ยังไม่ได้ระบุจำนวนเงินที่จ่าย');
            if (String(f.aId || '').replace(/\D/g, '').length !== 13) w.push('เลขประจำตัวผู้เสียภาษีของผู้หักไม่ครบ 13 หลัก');
            if (String(f.bId || '').replace(/\D/g, '').length !== 13) w.push('เลขประจำตัวผู้เสียภาษีของผู้ถูกหักไม่ครบ 13 หลัก — หนังสือรับรองที่เลขไม่ครบอาจใช้เครดิตภาษีไม่ได้');
            if (Number(f.taxPaid) > 0 && Number(f.amount) > 0 && Number(f.taxPaid) > Number(f.amount)) w.push('ภาษีที่หักมากกว่าจำนวนเงินที่จ่าย');
            return w;
        }
    };
    function whtTax(f) {
        const t = Number(f.taxPaid);
        if (t > 0) return Math.round(t * 100) / 100;
        return Math.round((Number(f.amount) || 0) * (Number(f.rate) || 0)) / 100;
    }

    // ---------- Wire the one-sided letters into warnings(): recipient name check uses bName ----------
})();
