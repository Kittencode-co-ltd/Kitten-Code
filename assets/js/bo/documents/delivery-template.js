/**
 * Delivery note (ใบส่งของ) A4 renderer. Shared by the editor preview (delivery.html) and the document viewer.
 * Classic script: window.KCDelivery.render(data, container) appends one or more .a4-page elements to `container`.
 * data: { issuer, docNo, docDate(ISO), docRef, custName, custAddr, custTel, shipTo, items:[{desc,qty,unit}], note,
 *         signReceiver, signSender, signAuth }
 */
(function () {
    'use strict';
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const qty = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thDate = (s) => { const p = String(s || '').split('-'); if (p.length !== 3) return '-'; const d = new Date(p[0], p[1] - 1, p[2]); return isNaN(d) ? '-' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`; };
    const th = 'border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;';
    const td = 'border:1px solid #cbd5e1;padding:6px 8px;vertical-align:top;';
    const row = (l, v, pre) => `<div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">${l}</span><span style="flex:1;${pre ? 'white-space:pre-wrap;' : ''}">${esc(v || '-')}</span></div>`;
    const rrow = (l, v) => `<tr><td style="font-weight:bold;padding:0 4px 6px 0;vertical-align:top;">${l}</td><td style="padding:0 0 6px 0;white-space:nowrap;">${esc(v || '-')}</td></tr>`;

    function pageEl(d) {
        const p = document.createElement('div');
        p.className = 'a4-page';
        p.innerHTML = `
        <div class="page-top-border"></div>
        <div class="content-wrapper">
            <div class="header-section flex-between align-start" style="margin-bottom:15px;">
                <div class="logo-area"><img src="../assets/img/LOGO-KittenCode.png" class="company-logo" alt="Kitten Code Logo" onerror="this.style.display='none'"></div>
                <div class="company-details">${window.KCIssuers.detailsHtml(d.issuer)}</div>
            </div>
            <h2 class="doc-title" style="text-align:center;margin-bottom:20px;font-size:18px;">ใบส่งของ (Delivery Note)</h2>
            <div class="doc-info-section flex-between align-start" style="margin-bottom:20px;font-size:13px;align-items:flex-start;">
                <div class="info-group" style="width:54%;">
                    ${row('ชื่อลูกค้า :', d.custName, 1)}${row('ที่อยู่ :', d.custAddr, 1)}${row('โทร :', d.custTel)}${row('สถานที่ส่งของ :', d.shipTo, 1)}
                </div>
                <div class="info-group right-align" style="width:42%;margin-top:-5px;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup>
                        ${rrow('เลขที่ใบส่งของ :', d.docNo)}${rrow('วันที่ส่ง :', thDate(d.docDate))}${rrow('อ้างอิงเอกสาร :', d.docRef)}
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">หน้า :</td><td class="page-number-display" style="padding:0 0 6px 0;white-space:nowrap;"></td></tr>
                    </table>
                </div>
            </div>
            <table class="quote-table" style="width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:0;">
                <colgroup><col style="width:8%;"><col style="width:64%;"><col style="width:14%;"><col style="width:14%;"></colgroup>
                <thead><tr><th style="${th}">ลำดับ</th><th style="${th}">รายการสินค้า / บริการที่ส่งมอบ</th><th style="${th}">จำนวน</th><th style="${th}">หน่วย</th></tr></thead>
                <tbody class="table-body"></tbody>
            </table>
            <div class="note-placeholder"></div>
            <div class="signatures-placeholder" style="margin-top:auto;"></div>
        </div>`;
        return p;
    }

    function footer(d) {
        const sig = (role, name, withDate) => `<div class="sig-box" style="flex:1;"><div class="sig-line" style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px auto;"></div>
            <div class="sig-role">${role}</div><div class="sig-name" style="margin-top:5px;white-space:pre-wrap;min-height:1.2em;">${esc(name)}</div>
            ${withDate ? '<div style="margin-top:4px;color:#475569;">วันที่ ____ / ____ / ________</div>' : ''}</div>`;
        return {
            note: d.note ? `<div style="text-align:left;padding:10px 0 0 0;font-size:13px;"><strong>หมายเหตุ : </strong><span style="white-space:pre-wrap;">${esc(d.note)}</span></div>` : '',
            sigs: `<div style="margin-top:22px;font-size:12px;color:#334155;">ผู้รับได้ตรวจรับสินค้า/บริการตามรายการข้างต้นไว้ครบถ้วน ถูกต้อง และอยู่ในสภาพเรียบร้อยแล้ว</div>
            <div class="signatures" style="display:flex;justify-content:space-around;margin-top:34px;text-align:center;font-size:13px;">
                ${sig('ผู้รับของ', d.signReceiver, 1)}${sig('ผู้ส่งของ', d.signSender, 1)}${sig('ผู้มีอำนาจลงนาม', d.signAuth, 0)}
            </div>`
        };
    }

    function render(d, container) {
        d = { ...d, issuer: d.issuer || 'company' };
        const pages = [];
        let cur = pageEl(d); container.appendChild(cur); pages.push(cur);
        let tbody = cur.querySelector('.table-body'), wrap = cur.querySelector('.content-wrapper');
        (d.items && d.items.length ? d.items : [{ desc: '', qty: 0, unit: '' }]).forEach((it, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="${td}text-align:center;">${i + 1}</td><td style="${td}white-space:pre-wrap;">${esc(it.desc)}</td><td style="${td}text-align:center;">${qty(it.qty)}</td><td style="${td}text-align:center;">${esc(it.unit)}</td>`;
            tbody.appendChild(tr);
            if (wrap.scrollHeight > wrap.clientHeight && tbody.children.length > 1) {
                tr.remove(); cur = pageEl(d); container.appendChild(cur); pages.push(cur);
                tbody = cur.querySelector('.table-body'); wrap = cur.querySelector('.content-wrapper'); tbody.appendChild(tr);
            }
        });
        const f = footer(d);
        const put = (pg) => { pg.querySelector('.note-placeholder').innerHTML = f.note; pg.querySelector('.signatures-placeholder').innerHTML = f.sigs; };
        put(cur);
        if (wrap.scrollHeight > wrap.clientHeight) {
            cur.querySelector('.note-placeholder').innerHTML = ''; cur.querySelector('.signatures-placeholder').innerHTML = '';
            cur = pageEl(d); container.appendChild(cur); pages.push(cur); put(cur);
        }
        pages.forEach((pg, i) => pg.querySelectorAll('.page-number-display').forEach((el) => { el.textContent = `${i + 1} / ${pages.length}`; }));
        return pages;
    }
    window.KCDelivery = { render };
})();
