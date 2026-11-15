// Legacy records were HTML-escaped before being saved; decode them once so
// render-time escapeHTML does not double-encode (e.g. "&amp;amp;").
const decodeLegacyEntities = (val) => {
    if (typeof val === 'string') {
        return val.replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]));
    }
    if (Array.isArray(val)) return val.map(decodeLegacyEntities);
    if (val && typeof val === 'object' && val.constructor === Object) {
        const out = {};
        for (const k in val) out[k] = decodeLegacyEntities(val[k]);
        return out;
    }
    return val;
};

const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
};

const formatMoney = (n) => {
    const num = Number(n) || 0;
    return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatQty = (n) => {
    const num = Number(n) || 0;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

function getThaiDate(dateString) {
    if (!dateString) return '-';
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d)) return dateString;
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function ArabicNumberToText(Number) {
    Number = Math.round(Number * 100) / 100;
    if (isNaN(Number)) return "ข้อมูลจำนวนเงินไม่ถูกต้อง";
    if (Number === 0) return "ศูนย์บาทถ้วน";
    const NumberValues = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า","สิบ"];
    const DigitValues = ["","สิบ","ร้อย","พัน","หมื่น","แสน","ล้าน"];
    const Parts = Number.toString().split('.');
    const intPart = Parts[0];
    const decPart = Parts[1] ? Parts[1].padEnd(2, '0').substring(0, 2) : '00';
    const length = intPart.length;
    let text = '';
    for (let i = 0; i < length; i++) {
        const digit = parseInt(intPart.charAt(i));
        const pos = length - i - 1;
        if (digit !== 0) {
            if (pos % 6 === 1 && digit === 1) text += '';
            else if (pos % 6 === 1 && digit === 2) text += 'ยี่';
            else if (pos % 6 === 0 && digit === 1 && length > 1 && intPart.charAt(length - 2) !== '0') text += 'เอ็ด';
            else text += NumberValues[digit];
            text += DigitValues[pos % 6];
            if (pos >= 6 && pos % 6 === 0) text += DigitValues[6];
        } else if (pos > 0 && pos % 6 === 0 && length > 6) {
            text += DigitValues[6];
        }
    }
    text += 'บาท';
    if (decPart === '00') {
        text += 'ถ้วน';
    } else {
        const tens = parseInt(decPart[0]);
        const units = parseInt(decPart[1]);
        let satang = '';
        if (tens > 0) satang += (tens === 1 ? '' : tens === 2 ? 'ยี่' : NumberValues[tens]) + 'สิบ';
        if (units > 0) satang += (units === 1 && tens > 0 ? 'เอ็ด' : NumberValues[units]);
        text += satang + 'สตางค์';
    }
    return text;
}

// ─── Page templates ──────────────────────────────────────────────────────────

function createPageDOM_quotation(sv) {
    const page = document.createElement('div');
    page.className = 'a4-page';
    page.innerHTML = `
        <div class="page-top-border"></div>
        <div class="content-wrapper">
            <div class="header-section flex-between align-start" style="margin-bottom:15px;">
                <div class="logo-area">
                    <img src="../assets/img/LOGO-KittenCode.png" class="company-logo" alt="Kitten Code Logo" onerror="this.style.display='none'">
                </div>
                <div class="company-details">
                    <h1 class="company-name">บริษัท คิทเท่น โค้ด จำกัด</h1><p class="company-name-en">KITTEN CODE Co.,Ltd</p>
                    <p class="company-address">ที่อยู่: 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</p>
                    <p class="company-contact">โทร : <span>+66 8 0885 0555</span> &nbsp;&nbsp; อีเมล : <span>kittencode.co.ltd@gmail.com</span></p>
                    <p class="company-tax-id">เลขประจำตัวผู้เสียภาษีอากร : <span>0655569001411</span></p>
                </div>
            </div>
            <h2 class="doc-title" style="text-align:center;margin-bottom:20px;font-size:18px;">ใบเสนอราคา (Quotation)</h2>
            <div class="doc-info-section flex-between align-start" style="margin-bottom:20px;font-size:13px;align-items:flex-start;">
                <div class="info-group" style="width:54%;">
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ชื่อลูกค้า :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.custName)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ที่อยู่ :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.custAddr)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">โทร :</span><span style="flex:1;">${escapeHTML(sv.custTel)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">เลขผู้เสียภาษี :</span><span style="flex:1;">${escapeHTML(sv.custTax)}</span></div>
                    <div style="margin-top:15px;">
                        <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ชื่องาน :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.projName)}</span></div>
                        <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ผู้ติดต่อ :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.projContact)}</span></div>
                        <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">เบอร์โทร :</span><span style="flex:1;">${escapeHTML(sv.projTel)}</span></div>
                    </div>
                </div>
                <div class="info-group" style="width:42%;margin-top:-5px;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เลขที่ใบเสนอราคา :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docNo)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">วันที่ :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docDate)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เงื่อนไขชำระเงิน :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docTerms)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เครดิต :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docCredit)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">หน้า :</td><td class="page-number-display" style="padding:0 0 6px 0;white-space:nowrap;"></td></tr>
                    </table>
                </div>
            </div>
            <table class="quote-table" style="width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:0;">
                <colgroup>
                    <col style="width:7%;">
                    <col style="width:49%;">
                    <col style="width:12%;">
                    <col style="width:15%;">
                    <col style="width:17%;">
                </colgroup>
                <thead><tr>
                    <th style="width:7%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">ลำดับ</th>
                    <th style="width:49%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">รายละเอียดสินค้า / บริการ</th>
                    <th style="width:12%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">จำนวน</th>
                    <th style="width:15%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">ราคา/หน่วย</th>
                    <th style="width:17%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">จำนวนเงิน</th>
                </tr></thead>
                <tbody class="table-body"></tbody>
                <tbody class="tfoot-placeholder summary-table"></tbody>
            </table>
            <div class="note-placeholder"></div>
            <div class="signatures-placeholder" style="margin-top:auto;"></div>
        </div>`;
    return page;
}

function createPageDOM_invoice(sv) {
    const page = document.createElement('div');
    page.className = 'a4-page';
    page.innerHTML = `
        <div class="page-top-border"></div>
        <div class="content-wrapper">
            <div class="header-section flex-between align-start" style="margin-bottom:15px;">
                <div class="logo-area">
                    <img src="../assets/img/LOGO-KittenCode.png" class="company-logo" alt="Kitten Code Logo" onerror="this.style.display='none'">
                </div>
                <div class="company-details">
                    <h1 class="company-name">บริษัท คิทเท่น โค้ด จำกัด</h1><p class="company-name-en">KITTEN CODE Co.,Ltd</p>
                    <p class="company-address">ที่อยู่: 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</p>
                    <p class="company-contact">โทร : <span>+66 8 0885 0555</span> &nbsp;&nbsp; อีเมล : <span>kittencode.co.ltd@gmail.com</span></p>
                    <p class="company-tax-id">เลขประจำตัวผู้เสียภาษีอากร : <span>0655569001411</span></p>
                </div>
            </div>
            <h2 class="doc-title" style="text-align:center;margin-bottom:20px;font-size:18px;">ใบแจ้งหนี้ (Invoice)</h2>
            <div class="doc-info-section flex-between align-start" style="margin-bottom:20px;font-size:13px;align-items:flex-start;">
                <div class="info-group" style="width:54%;">
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ชื่อลูกค้า :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.custName)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ที่อยู่ :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.custAddr)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">โทร :</span><span style="flex:1;">${escapeHTML(sv.custTel)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">เลขผู้เสียภาษี :</span><span style="flex:1;">${escapeHTML(sv.custTax)}</span></div>
                </div>
                <div class="info-group" style="width:42%;margin-top:-5px;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เลขที่ใบแจ้งหนี้ :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docNo)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">วันที่ :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docDate)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">วันครบกำหนด :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docDueDate)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เงื่อนไขชำระเงิน :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docTerms)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เอกสารอ้างอิง :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docRef)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">หน้า :</td><td class="page-number-display" style="padding:0 0 6px 0;white-space:nowrap;"></td></tr>
                    </table>
                </div>
            </div>
            <table class="quote-table" style="width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:0;">
                <colgroup>
                    <col style="width:7%;">
                    <col style="width:49%;">
                    <col style="width:12%;">
                    <col style="width:15%;">
                    <col style="width:17%;">
                </colgroup>
                <thead><tr>
                    <th style="width:7%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">ลำดับ</th>
                    <th style="width:49%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">รายละเอียดสินค้า / บริการ</th>
                    <th style="width:12%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">จำนวน</th>
                    <th style="width:15%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">ราคา/หน่วย</th>
                    <th style="width:17%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">จำนวนเงิน</th>
                </tr></thead>
                <tbody class="table-body"></tbody>
                <tbody class="tfoot-placeholder summary-table"></tbody>
            </table>
            <div class="note-placeholder"></div>
            <div class="signatures-placeholder" style="margin-top:auto;"></div>
        </div>`;
    return page;
}

function createPageDOM_receipt(sv) {
    const page = document.createElement('div');
    page.className = 'a4-page';
    page.innerHTML = `
        <div class="page-top-border"></div>
        <div class="content-wrapper">
            <div class="header-section flex-between align-start" style="margin-bottom:15px;">
                <div class="logo-area">
                    <img src="../assets/img/LOGO-KittenCode.png" class="company-logo" alt="Kitten Code Logo" onerror="this.style.display='none'">
                </div>
                <div class="company-details">
                    <h1 class="company-name">บริษัท คิทเท่น โค้ด จำกัด</h1><p class="company-name-en">KITTEN CODE Co.,Ltd</p>
                    <p class="company-address">ที่อยู่: 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</p>
                    <p class="company-contact">โทร : <span>+66 8 0885 0555</span> &nbsp;&nbsp; อีเมล : <span>kittencode.co.ltd@gmail.com</span></p>
                    <p class="company-tax-id">เลขประจำตัวผู้เสียภาษีอากร : <span>0655569001411</span></p>
                </div>
            </div>
            <h2 class="doc-title" style="text-align:center;margin-bottom:20px;font-size:18px;">ใบเสร็จรับเงิน (Receipt)</h2>
            <div class="doc-info-section flex-between align-start" style="margin-bottom:20px;font-size:13px;align-items:flex-start;">
                <div class="info-group" style="width:54%;">
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ชื่อลูกค้า :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.custName)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ที่อยู่ :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.custAddr)}</span></div>
                    <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">เลขผู้เสียภาษี :</span><span style="flex:1;">${escapeHTML(sv.custTax)}</span></div>
                    <div style="margin-top:15px;">
                        <div class="info-row" style="display:flex;margin-bottom:5px;"><span style="min-width:110px;font-weight:bold;">ชื่อโปรเจ็ค :</span><span style="flex:1;white-space:pre-wrap;">${escapeHTML(sv.projName)}</span></div>
                    </div>
                </div>
                <div class="info-group" style="width:42%;margin-top:-5px;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เลขที่ใบเสร็จ :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docNo)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">วันที่ :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docDate)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">ชำระโดย :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docPayment)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">พนักงานขาย :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docSalesman)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เลขที่ใบแจ้งหนี้ :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docInvoice)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">เอกสารอ้างอิง :</td><td style="padding:0 0 6px 0;white-space:nowrap;">${escapeHTML(sv.docRef)}</td></tr>
                        <tr><td style="font-weight:bold;padding:0 4px 6px 0;">หน้า :</td><td class="page-number-display" style="padding:0 0 6px 0;white-space:nowrap;"></td></tr>
                    </table>
                </div>
            </div>
            <table class="quote-table" style="width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:0;">
                <colgroup>
                    <col style="width:7%;">
                    <col style="width:49%;">
                    <col style="width:12%;">
                    <col style="width:15%;">
                    <col style="width:17%;">
                </colgroup>
                <thead><tr>
                    <th style="width:7%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">ลำดับ</th>
                    <th style="width:49%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">รายละเอียดสินค้า / บริการ</th>
                    <th style="width:12%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">จำนวน</th>
                    <th style="width:15%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">ราคา/หน่วย</th>
                    <th style="width:17%;border:1px solid #cbd5e1;padding:7px 8px;text-align:center;background:#f1f5f9;color:#0f172a;">จำนวนเงิน</th>
                </tr></thead>
                <tbody class="table-body"></tbody>
                <tbody class="tfoot-placeholder summary-table"></tbody>
            </table>
            <div class="note-placeholder"></div>
            <div class="signatures-placeholder" style="margin-top:auto;"></div>
        </div>`;
    return page;
}

// ─── Signatures HTML per type ─────────────────────────────────────────────────

function signaturesHTML_quotation(sv) {
    return `<div class="signatures" style="display:flex;justify-content:space-around;margin-top:40px;text-align:center;font-size:13px;">
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>สั่งซื้อโดย / ผู้เจรจา</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signBuyer)}</div></div>
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>จัดทำโดย</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signPrep)}</div></div>
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>อนุมัติโดย</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signAppr)}</div></div>
    </div>`;
}

function signaturesHTML_invoice(sv) {
    return `<div class="signatures" style="display:flex;justify-content:space-around;margin-top:40px;text-align:center;font-size:13px;">
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>ผู้รับใบแจ้งหนี้ / Bill Receiver Signature</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signReceiver)}</div></div>
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>ผู้มีอำนาจลงนาม / Authorized Signature</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signAuth)}</div></div>
    </div>`;
}

function signaturesHTML_receipt(sv) {
    return `<div class="signatures" style="display:flex;justify-content:space-around;margin-top:40px;text-align:center;font-size:13px;">
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>ผู้รับเงิน / Receiver</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signReceiver)}</div></div>
        <div class="sig-box"><div style="border-bottom:1px dashed #666;width:150px;margin:0 auto 10px;"></div><div>ผู้มีอำนาจลงนาม / Authorized Signature</div><div style="margin-top:5px;white-space:pre-wrap;">${escapeHTML(sv.signAuth)}</div></div>
    </div>`;
}

// ─── Main render ─────────────────────────────────────────────────────────────

function buildViewer() {
    const raw = localStorage.getItem('kc_view_doc');
    if (!raw) {
        document.getElementById('preview-panel').innerHTML =
            '<div style="padding:60px;text-align:center;color:#888;">ไม่พบข้อมูลเอกสาร กรุณาเลือกเอกสารจาก Document Record</div>';
        return;
    }

    let viewDoc;
    try {
        viewDoc = JSON.parse(raw);
    } catch (e) {
        console.error('Invalid kc_view_doc', e);
        return;
    }

    const type = viewDoc.type;
    const d = decodeLegacyEntities(viewDoc.data);

    const colMap = {
        quotation: 'quotations',
        invoice: 'invoices',
        receipt: 'receipts',
        voucher: 'vouchers',
        certificate: 'certificates',
        letter: 'letters'
    };
    const hashMap = {
        quotation: '#quotation',
        invoice: '#invoice',
        receipt: '#receipt',
        voucher: '#voucher',
        certificate: '#certificate',
        letter: '#letter'
    };
    const editBtn = document.getElementById('btn-edit-doc');
    if (editBtn && colMap[type]) {
        editBtn.style.display = 'inline-flex';
        window.editCurrentDoc = function () {
            localStorage.setItem('kc_edit_doc', JSON.stringify({ col: colMap[type], data: d }));
            if (window.parent !== window && window.parent.location.pathname.endsWith('back-office.html')) {
                window.parent.location.hash = hashMap[type];
            } else {
                window.location.href = `${type}.html`;
            }
        };
    }

    // Update header badge
    const badge = document.getElementById('doc-type-badge');
    const docNum = document.getElementById('doc-number');
    const labels = {
        quotation: 'ใบเสนอราคา',
        invoice: 'ใบแจ้งหนี้',
        receipt: 'ใบเสร็จรับเงิน',
        voucher: (window.KCVoucher && window.KCVoucher.TYPES[d.voucherType]?.title) || 'ใบสำคัญจ่าย / เบิกจ่าย',
        certificate: (window.KCCertificate && window.KCCertificate.TYPES[d.certType]?.short) || (d.certType === 'internship' ? 'หนังสือรับรองการฝึกงาน' : 'หนังสือรับรองการทำงาน'),
        letter: (window.KCLetter && window.KCLetter.TYPES[d.letterType]?.title) || 'หนังสือติดต่อภายนอก'
    };
    if (badge) badge.textContent = labels[type] || type;
    if (docNum) docNum.textContent = d.docNo || '';

    const container = document.getElementById('preview-panel');
    container.innerHTML = '';

    if (type === 'certificate' && window.KCCertificate) {
        container.appendChild(window.KCCertificate.render(d));
        return;
    }
    if (type === 'voucher' && window.KCVoucher) {
        container.appendChild(window.KCVoucher.render(d));
        return;
    }
    if (type === 'letter' && window.KCLetter) {
        container.appendChild(window.KCLetter.render(d));
        return;
    }

    const items = (d.items || []).map((item, i) => ({
        id: i,
        desc: item.desc || '',
        qty: item.qty || 0,
        price: item.price || 0
    }));

    const discount = d.discountAmount || 0;
    const vatRate = d.vatRate || 0;
    const note = d.note || '';

    // Build stateVars per type
    let sv, createPage, sigFn;

    if (type === 'quotation') {
        sv = {
            docNo: d.docNo || '-', docDate: getThaiDate(d.docDate), docTerms: d.docTerms || '-',
            docCredit: d.docCredit || '-', custName: d.custName || '-', custAddr: d.custAddr || '-',
            custTel: d.custTel || '-', custTax: d.custTax || '-', projName: d.projName || '-',
            projContact: d.projContact || '-', projTel: d.projTel || '-',
            signBuyer: d.signBuyer || '', signPrep: d.signPrep || '', signAppr: d.signAppr || ''
        };
        createPage = createPageDOM_quotation;
        sigFn = signaturesHTML_quotation;
    } else if (type === 'invoice') {
        sv = {
            docNo: d.docNo || '-', docDate: getThaiDate(d.docDate),
            docDueDate: getThaiDate(d.docDueDate) || '-', docTerms: d.docTerms || '-',
            docRef: d.docRef || '-', custName: d.custName || '-', custAddr: d.custAddr || '-',
            custTel: d.custTel || '-', custTax: d.custTax || '-',
            signReceiver: d.signReceiver || '', signAuth: d.signAuth || ''
        };
        createPage = createPageDOM_invoice;
        sigFn = signaturesHTML_invoice;
    } else {
        sv = {
            docNo: d.docNo || '-', docDate: getThaiDate(d.docDate), docPayment: d.docPayment || '-',
            docSalesman: d.docSalesman || '-', docInvoice: d.docInvoice || '-', docRef: d.docRef || '-',
            projName: d.projName || '-', custName: d.custName || '-', custTax: d.custTax || '-',
            custAddr: d.custAddr || '-', signReceiver: d.signReceiver || '', signAuth: d.signAuth || ''
        };
        createPage = createPageDOM_receipt;
        sigFn = signaturesHTML_receipt;
    }

    const pages = [];
    let currentPage = createPage(sv);
    container.appendChild(currentPage);
    pages.push(currentPage);

    let tbody = currentPage.querySelector('.table-body');
    let wrapper = currentPage.querySelector('.content-wrapper');
    let subtotal = 0;

    items.forEach((item, index) => {
        const amount = item.qty * item.price;
        subtotal += amount;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-no" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;vertical-align:top;">${index + 1}</td>
            <td class="col-desc" style="border:1px solid #cbd5e1;padding:6px 8px;white-space:pre-wrap;vertical-align:top;">${escapeHTML(item.desc)}</td>
            <td class="col-qty" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;vertical-align:top;">${formatQty(item.qty)}</td>
            <td class="col-price" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;vertical-align:top;">${formatMoney(item.price)}</td>
            <td class="col-amount" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;vertical-align:top;">${formatMoney(amount)}</td>`;
        tbody.appendChild(tr);

        if (wrapper.scrollHeight > wrapper.clientHeight && tbody.children.length > 1) {
            tr.remove();
            currentPage = createPage(sv);
            container.appendChild(currentPage);
            pages.push(currentPage);
            tbody = currentPage.querySelector('.table-body');
            wrapper = currentPage.querySelector('.content-wrapper');
            tbody.appendChild(tr);
        }
    });

    const afterDiscount = subtotal - discount;
    const vatAmount = afterDiscount * (vatRate / 100);
    const grandTotal = afterDiscount + vatAmount;
    const isDiscounted = discount > 0;
    const isVatAdded = vatRate > 0;
    const summaryRows = 2 + (isDiscounted ? 1 : 0) + (isVatAdded ? 1 : 0);

    const noteHTML = note ? `<div style="text-align:left;padding:10px 0 0 0;font-size:13px;"><strong>หมายเหตุ : </strong><span style="white-space:pre-wrap;">${escapeHTML(note)}</span></div>` : '';

    const summaryHTML = `
        <tr>
            <td colspan="2" rowspan="${summaryRows}" class="text-amount-cell" style="border:1px solid #cbd5e1;padding:10px 12px;text-align:center;vertical-align:middle;background:#f8fafc;">
                <div style="background:#f1f5f9;padding:7px 10px;border-radius:4px;width:100%;font-weight:700;color:#0f172a;">
                    ตัวอักษร : (${ArabicNumberToText(grandTotal)})
                </div>
            </td>
            <td colspan="2" class="summary-label" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;background:#f8fafc;font-weight:600;">รวมเป็นเงิน</td>
            <td class="summary-amount" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;">${formatMoney(subtotal)}</td>
        </tr>
        ${isDiscounted ? `<tr><td colspan="2" class="summary-label" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;background:#f8fafc;font-weight:600;">ส่วนลด</td><td class="summary-amount" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;">-${formatMoney(discount)}</td></tr>` : ''}
        ${isVatAdded ? `<tr><td colspan="2" class="summary-label" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;background:#f8fafc;font-weight:600;">ภาษีมูลค่าเพิ่ม ${vatRate}%</td><td class="summary-amount" style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;">${formatMoney(vatAmount)}</td></tr>` : ''}
        <tr>
            <td colspan="2" class="summary-label" style="border:1px solid #cbd5e1;padding:7px 8px;text-align:right;background:#fff7ed;color:#c2410c;font-weight:700;">รวมราคาทั้งสิ้น</td>
            <td class="summary-amount" style="border:1px solid #cbd5e1;padding:7px 8px;text-align:right;background:#fff7ed;color:#c2410c;font-weight:700;">${formatMoney(grandTotal)}</td>
        </tr>`;

    currentPage.querySelector('.note-placeholder').innerHTML = noteHTML;
    currentPage.querySelector('.tfoot-placeholder').innerHTML = summaryHTML;
    currentPage.querySelector('.signatures-placeholder').innerHTML = sigFn(sv);

    if (wrapper.scrollHeight > wrapper.clientHeight) {
        currentPage.querySelector('.note-placeholder').innerHTML = '';
        currentPage.querySelector('.tfoot-placeholder').innerHTML = '';
        currentPage.querySelector('.signatures-placeholder').innerHTML = '';
        currentPage = createPage(sv);
        container.appendChild(currentPage);
        pages.push(currentPage);
        currentPage.querySelector('.note-placeholder').innerHTML = noteHTML;
        currentPage.querySelector('.tfoot-placeholder').innerHTML = summaryHTML;
        currentPage.querySelector('.signatures-placeholder').innerHTML = sigFn(sv);
    }

    const totalPages = pages.length;
    pages.forEach((page, idx) => {
        page.querySelectorAll('.page-number-display').forEach(el => {
            el.innerText = `${idx + 1} / ${totalPages}`;
        });
    });
}

document.addEventListener('DOMContentLoaded', buildViewer);
