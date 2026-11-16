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

    // ---------- Wire the one-sided letters into warnings(): recipient name check uses bName ----------
})();
