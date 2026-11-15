// ============================================================
//  voucher-template.js — shared A4 renderer for Corporate
//  Procurement, Expense Claim & Payment Voucher Documents:
//   - pr  : ใบขอซื้อ / ใบขอจ้าง (Purchase / Service Requisition)
//   - po  : ใบสั่งซื้อ / ใบสั่งจ้าง (Purchase Order / Work Order)
//   - exp : ใบขอเบิกค่าใช้จ่าย (Expense Reimbursement Claim)
//   - pv  : ใบสำคัญจ่าย (Payment Voucher & Receipt Substitute)
//
//  Exposes window.KCVoucher = { render, TYPES, calcTotals, ... }.
//  All values are raw text; HTML escaping happens here at render time.
// ============================================================
(function () {
    'use strict';

    const TYPES = {
        pr: {
            prefix: 'PR',
            title: 'ใบขอซื้อ / ใบขอจ้าง',
            titleEn: 'Purchase / Service Requisition (PR)',
            short: 'ใบขอซื้อ/จ้าง',
            noLabel: 'เลขที่ใบขอซื้อ/จ้าง',
            dateLabel: 'วันที่ขอ'
        },
        po: {
            prefix: 'PO',
            title: 'ใบสั่งซื้อ / ใบสั่งจ้าง',
            titleEn: 'Purchase Order / Work Order (PO)',
            short: 'ใบสั่งซื้อ/จ้าง',
            noLabel: 'เลขที่ใบสั่งซื้อ/จ้าง',
            dateLabel: 'วันที่สั่งซื้อ/จ้าง'
        },
        exp: {
            prefix: 'EXP',
            title: 'ใบขอเบิกค่าใช้จ่าย',
            titleEn: 'Expense Reimbursement Claim',
            short: 'ใบขอเบิกเงิน',
            noLabel: 'เลขที่ใบขอเบิก',
            dateLabel: 'วันที่ขอเบิก'
        },
        pv: {
            prefix: 'PV',
            title: 'ใบสำคัญจ่าย',
            titleEn: 'Payment Voucher (PV)',
            short: 'ใบสำคัญจ่าย',
            noLabel: 'เลขที่ใบสำคัญจ่าย',
            dateLabel: 'วันที่จ่ายเงิน'
        }
    };

    const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    const escapeHTML = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>'"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
    };

    function thaiDateShort(dateString) {
        if (!dateString || typeof dateString !== 'string') return '-';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(d)) return dateString;
        return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
    }

    function formatMoney(n) {
        return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatQty(n) {
        const num = Number(n) || 0;
        return Number.isInteger(num) ? String(num) : num.toFixed(2);
    }

    function bahtText(amount) {
        const n = Math.round(Math.abs(Number(amount) || 0) * 100) / 100;
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

    function round2(n) {
        return Math.round((Number(n) || 0) * 100) / 100;
    }

    function calcTotals(d) {
        const items = Array.isArray(d.items) ? d.items : [];
        const subtotal = round2(items.reduce((sum, it) => sum + ((Number(it.qty) || 0) * (Number(it.price) || 0)), 0));
        const discount = round2(Math.max(0, Number(d.discountAmount) || 0));
        const afterDiscount = round2(Math.max(0, subtotal - discount));
        const vatRate = Math.max(0, Number(d.vatRate) || 0);
        const whtRate = Math.max(0, Number(d.whtRate) || 0);
        const vatAmount = round2(afterDiscount * (vatRate / 100));
        const totalWithVat = round2(afterDiscount + vatAmount);
        const whtAmount = round2(afterDiscount * (whtRate / 100));
        const netPayable = round2(totalWithVat - whtAmount);
        return {
            subtotal,
            discount,
            afterDiscount,
            vatRate,
            vatAmount,
            totalWithVat,
            whtRate,
            whtAmount,
            netPayable
        };
    }

    const COMPANY_HEADER = `
        <div class="header-section flex-between align-start" style="margin-bottom: 12px;">
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

    function buildInfoSection(d, typeKey, tInfo) {
        const leftRows = [];
        const rightRows = [
            [tInfo.noLabel, d.docNo || '-'],
            [tInfo.dateLabel, thaiDateShort(d.docDate)]
        ];

        if (typeKey === 'pr') {
            leftRows.push(['ผู้ขอซื้อ / ขอจ้าง', d.requesterName || '-']);
            if (d.department) leftRows.push(['ฝ่าย / แผนก', d.department]);
            if (d.projName) leftRows.push(['โครงการ / งาน', d.projName]);
            if (d.purpose) leftRows.push(['เหตุผลความจำเป็น', d.purpose]);
            if (d.vendorName) leftRows.push(['ผู้ขาย/ผู้รับจ้างที่เสนอ', d.vendorName]);
            if (d.vendorTel) leftRows.push(['เบอร์โทรผู้ขาย', d.vendorTel]);
            if (d.neededDate) rightRows.push(['วันที่ต้องการใช้งาน', thaiDateShort(d.neededDate)]);
            if (d.refNo) rightRows.push(['อ้างอิงใบเสนอราคา', d.refNo]);
        } else if (typeKey === 'po') {
            leftRows.push(['ผู้ขาย / ผู้รับจ้าง', d.vendorName || '-']);
            if (d.vendorAddr) leftRows.push(['ที่อยู่', d.vendorAddr]);
            if (d.vendorTel) leftRows.push(['โทรศัพท์', d.vendorTel]);
            if (d.vendorTax) leftRows.push(['เลขประจำตัวผู้เสียภาษี', d.vendorTax]);
            if (d.projName) leftRows.push(['โครงการ / งาน', d.projName]);
            if (d.payTerms) rightRows.push(['เงื่อนไขชำระเงิน', d.payTerms]);
            if (d.neededDate) rightRows.push(['กำหนดส่งมอบ', thaiDateShort(d.neededDate)]);
            if (d.refNo) rightRows.push(['อ้างอิงใบขอซื้อ/QT', d.refNo]);
        } else if (typeKey === 'exp') {
            leftRows.push(['ผู้ขอเบิก', d.requesterName || '-']);
            if (d.department) leftRows.push(['ตำแหน่ง / แผนก', d.department]);
            if (d.claimType) leftRows.push(['ประเภทการเบิก', d.claimType]);
            if (d.projName) leftRows.push(['โครงการ / ลูกค้า', d.projName]);
            if (d.purpose) leftRows.push(['วัตถุประสงค์', d.purpose]);
            if (d.payMethod) rightRows.push(['วิธีรับเงิน', d.payMethod]);
            if (d.bankName || d.bankAccount) {
                rightRows.push(['บัญชีรับโอน', [d.bankName, d.bankAccount, d.bankOwner].filter(Boolean).join(' · ')]);
            }
            if (d.refNo) rightRows.push(['เอกสารแนบ', d.refNo]);
        } else {
            // pv
            leftRows.push(['จ่ายให้แก่ (Payee)', d.vendorName || d.requesterName || '-']);
            if (d.vendorTax) leftRows.push(['เลขผู้เสียภาษี/บัตร ปชช.', d.vendorTax]);
            if (d.vendorAddr) leftRows.push(['ที่อยู่', d.vendorAddr]);
            if (d.vendorTel) leftRows.push(['โทรศัพท์', d.vendorTel]);
            if (d.projName) leftRows.push(['โครงการ / หมวด', d.projName]);
            if (d.payMethod) rightRows.push(['ชำระโดย', d.payMethod]);
            if (d.bankName || d.bankAccount) {
                rightRows.push(['ธนาคาร / บัญชี', [d.bankName, d.bankAccount, d.bankOwner].filter(Boolean).join(' · ')]);
            }
            if (d.refNo) rightRows.push(['อ้างอิง PO/INV/ใบเสร็จ', d.refNo]);
        }

        const renderLeft = leftRows.map(([k, v]) => `
            <div style="display:flex; margin-bottom:4px; line-height:1.45;">
                <span style="min-width:130px; font-weight:600; color:#333;">${escapeHTML(k)} :</span>
                <span style="flex:1; white-space:pre-wrap;">${escapeHTML(v)}</span>
            </div>`).join('');

        const renderRight = rightRows.map(([k, v]) => `
            <tr>
                <td style="font-weight:600; padding:0 6px 5px 0; color:#333; white-space:nowrap; vertical-align:top;">${escapeHTML(k)} :</td>
                <td style="padding:0 0 5px 0;">${escapeHTML(v)}</td>
            </tr>`).join('');

        return `
            <div class="doc-info-section flex-between align-start" style="margin-bottom:14px; font-size:13px; gap:16px;">
                <div style="width:56%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px;">
                    ${renderLeft}
                </div>
                <div style="width:42%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        ${renderRight}
                    </table>
                </div>
            </div>`;
    }

    function buildSignatures(d, typeKey) {
        let boxes = [];
        if (typeKey === 'pr') {
            boxes = [
                ['ผู้ขอซื้อ / ขอจ้าง', d.signRequester || d.requesterName || ''],
                ['ผู้ตรวจสอบ', d.signReviewer || ''],
                ['ผู้อนุมัติ', d.signApprover || '']
            ];
        } else if (typeKey === 'po') {
            boxes = [
                ['ผู้รับใบสั่งซื้อ / สั่งจ้าง', d.signPayee || d.vendorName || ''],
                ['ผู้จัดทำ / สั่งซื้อ', d.signRequester || d.requesterName || ''],
                ['ผู้มีอำนาจอนุมัติ', d.signApprover || '']
            ];
        } else if (typeKey === 'exp') {
            boxes = [
                ['ผู้ขอเบิก', d.signRequester || d.requesterName || ''],
                ['ผู้ตรวจสอบ', d.signReviewer || ''],
                ['ผู้อนุมัติ', d.signApprover || ''],
                ['ผู้จ่ายเงิน', d.signPayer || '']
            ];
        } else {
            boxes = [
                ['ผู้จัดทำ', d.signRequester || ''],
                ['ผู้ตรวจสอบ', d.signReviewer || ''],
                ['ผู้อนุมัติ', d.signApprover || ''],
                ['ผู้รับเงิน', d.signPayee || d.vendorName || '']
            ];
        }

        return `
            <div class="signatures" style="display:grid; grid-template-columns:repeat(${boxes.length}, 1fr); gap:12px; margin-top:28px; text-align:center; font-size:12.5px;">
                ${boxes.map(([role, name]) => `
                    <div class="sig-box" style="padding:8px 4px;">
                        <div style="height:42px; border-bottom:1px dashed #64748b; width:85%; margin:0 auto 8px;"></div>
                        <div style="font-weight:600; color:#1e293b;">${escapeHTML(role)}</div>
                        <div style="margin-top:3px; color:#334155; min-height:18px;">${name ? `(${escapeHTML(name)})` : '(................................................)'}</div>
                        <div style="margin-top:3px; color:#64748b; font-size:11.5px;">วันที่ ........../........../..........</div>
                    </div>
                `).join('')}
            </div>`;
    }

    function render(d, opts = {}) {
        d = d || {};
        const typeKey = TYPES[d.voucherType] ? d.voucherType : 'pv';
        const tInfo = TYPES[typeKey];
        const totals = calcTotals(d);
        const items = Array.isArray(d.items) && d.items.length
            ? d.items
            : [{ desc: '-', qty: 1, unit: 'รายการ', price: 0 }];

        const rowsHtml = items.map((it, idx) => {
            const qty = Number(it.qty) || 0;
            const price = Number(it.price) || 0;
            const lineTotal = qty * price;
            return `
                <tr>
                    <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:center;">${idx + 1}</td>
                    <td style="border:1px solid #cbd5e1; padding:7px 10px; white-space:pre-wrap;">${escapeHTML(it.desc || '-')}</td>
                    <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:center;">${formatQty(qty)}${it.unit ? ' ' + escapeHTML(it.unit) : ''}</td>
                    <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:right;">${formatMoney(price)}</td>
                    <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:right;">${formatMoney(lineTotal)}</td>
                </tr>`;
        }).join('');

        const extraRows = [];
        if (totals.discount > 0) {
            extraRows.push(`<tr><td colspan="2" style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right;">ส่วนลด</td><td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right;">-${formatMoney(totals.discount)}</td></tr>`);
        }
        if (totals.vatRate > 0) {
            extraRows.push(`<tr><td colspan="2" style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right;">ภาษีมูลค่าเพิ่ม (VAT ${totals.vatRate}%)</td><td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right;">${formatMoney(totals.vatAmount)}</td></tr>`);
        }
        if (totals.whtRate > 0) {
            extraRows.push(`<tr><td colspan="2" style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right; color:#b91c1c;">หักภาษี ณ ที่จ่าย (WHT ${totals.whtRate}%)</td><td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right; color:#b91c1c;">-${formatMoney(totals.whtAmount)}</td></tr>`);
        }

        const summaryRowCount = 2 + extraRows.length;
        const netLabel = totals.whtRate > 0 ? 'ยอดจ่ายสุทธิ (Net Payable)' : 'รวมจำนวนเงินทั้งสิ้น';

        const certifyHtml = (typeKey === 'pv' && d.certifyNoReceipt)
            ? `<div style="margin-top:10px; padding:8px 12px; border:1px dashed #94a3b8; border-radius:6px; background:#fffbeb; font-size:12px; line-height:1.55; color:#334155;">
                <strong>คำรับรองแทนใบเสร็จรับเงิน :</strong> ข้าพเจ้าขอรับรองว่า รายจ่ายข้างต้นนี้ไม่อาจเรียกใบเสร็จรับเงินจากผู้รับได้ และข้าพเจ้าได้จ่ายไปในงานของบริษัท คิทเช่น โค้ด จำกัด โดยแท้
               </div>`
            : '';

        const noteHtml = d.note
            ? `<div style="margin-top:8px; font-size:12.5px; line-height:1.5;"><strong>หมายเหตุ / เอกสารแนบ :</strong> <span style="white-space:pre-wrap;">${escapeHTML(d.note)}</span></div>`
            : '';

        const page = document.createElement('div');
        page.className = 'a4-page voucher-page';
        page.innerHTML = `
            <div class="page-top-border"></div>
            ${opts.isReprint ? '<div class="watermark-reprint">ฉบับสำเนา (COPY)</div>' : ''}
            <div class="content-wrapper">
                ${COMPANY_HEADER}
                <div style="text-align:center; margin: 6px 0 14px;">
                    <h2 class="doc-title" style="margin:0; font-size:19px; font-weight:700;">${tInfo.title}</h2>
                    <div style="font-size:12px; color:#64748b;">${tInfo.titleEn}</div>
                </div>
                ${buildInfoSection(d, typeKey, tInfo)}
                <table class="quote-table" style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr>
                            <th style="width:7%; border:1px solid #cbd5e1; padding:8px; text-align:center; background:#f1f5f9;">ลำดับ</th>
                            <th style="width:48%; border:1px solid #cbd5e1; padding:8px; text-align:center; background:#f1f5f9;">รายละเอียดรายการ</th>
                            <th style="width:13%; border:1px solid #cbd5e1; padding:8px; text-align:center; background:#f1f5f9;">จำนวน</th>
                            <th style="width:15%; border:1px solid #cbd5e1; padding:8px; text-align:center; background:#f1f5f9;">ราคา/หน่วย</th>
                            <th style="width:17%; border:1px solid #cbd5e1; padding:8px; text-align:center; background:#f1f5f9;">จำนวนเงิน</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        <tr>
                            <td colspan="2" rowspan="${summaryRowCount}" style="border:1px solid #cbd5e1; padding:10px 12px; vertical-align:middle; background:#f8fafc;">
                                <div style="font-size:12.5px;"><strong>ตัวอักษร :</strong> (${escapeHTML(bahtText(totals.netPayable))})</div>
                            </td>
                            <td colspan="2" style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right;">รวมเป็นเงิน</td>
                            <td style="border:1px solid #cbd5e1; padding:6px 8px; text-align:right;">${formatMoney(totals.subtotal)}</td>
                        </tr>
                        ${extraRows.join('')}
                        <tr>
                            <td colspan="2" style="border:1px solid #cbd5e1; padding:7px 8px; text-align:right; background:#f1f5f9;"><strong>${netLabel}</strong></td>
                            <td style="border:1px solid #cbd5e1; padding:7px 8px; text-align:right; background:#f1f5f9;"><strong>${formatMoney(totals.netPayable)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                ${noteHtml}
                ${certifyHtml}
                <div style="margin-top:auto;">
                    ${buildSignatures(d, typeKey)}
                </div>
            </div>`;
        return page;
    }

    window.KCVoucher = { render, TYPES, calcTotals, thaiDateShort, formatMoney, bahtText, escapeHTML };
})();
