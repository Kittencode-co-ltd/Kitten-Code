const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
};

let state = {
    items: [{ id: generateId(), desc: "", qty: 1, price: 0 }],
    discount: 0,
    note: ""
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const dateInput = document.getElementById('in-doc-date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Bind all inputs to buildPreview
    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach(el => {
        el.addEventListener('input', () => buildPreview());
    });

    renderItemsForm();

    // Initial build
    document.fonts.ready.then(() => {
        buildPreview();
    });
    setTimeout(() => buildPreview(), 500);
});

// Update functions are now just buildPreview
function updatePreview() { buildPreview(); }
function updatePreviewFromItems() { buildPreview(); }

// Generate unique ID
function generateId() { return Date.now() + Math.floor(Math.random() * 100); }

function addItemLine() {
    state.items.push({ id: generateId(), desc: "", qty: 1, price: 0 });
    renderItemsForm();
    buildPreview();
}

function removeItem(id) {
    state.items = state.items.filter(item => item.id !== id);
    renderItemsForm();
    buildPreview();
}

function handleItemChange(id, field, value) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        item[field] = field === 'desc' ? value : Number(value);
        buildPreview();
    }
}

function renderItemsForm() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    state.items.forEach((item, index) => {
        const itemHtml = `
            <div class="item-entry">
                <button type="button" class="btn btn-danger btn-sm remove-btn" onclick="removeItem(${item.id})" title="ลบรายการ">
                    <i class="fas fa-times"></i>
                </button>
                <div class="form-group full-width" style="margin-bottom: 8px;">
                    <label>รายการที่ ${index + 1} - รายละเอียดสินค้า</label>
                    <textarea oninput="handleItemChange(${item.id}, 'desc', this.value)">${escapeHTML(item.desc)}</textarea>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>จำนวน</label>
                        <input type="number" step="1" value="${item.qty}" oninput="handleItemChange(${item.id}, 'qty', this.value)">
                    </div>
                    <div class="form-group">
                        <label>ราคา/หน่วย</label>
                        <input type="number" step="0.01" value="${item.price}" oninput="handleItemChange(${item.id}, 'price', this.value)">
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function formatMoney(amount) {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(qty) {
    return Number(qty).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function getInputValue(id) {
    const el = document.getElementById(`in-${id}`);
    return el ? el.value : '';
}

function getThaiDate(dateString) {
    if (!dateString) return '';
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    // Manually parse YYYY-MM-DD to avoid timezone shifting timezone offsets for midnight UTC
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d)) return '';
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function ArabicNumberToText(Number) {
    var Number = Math.round(Number * 100) / 100;
    var NumberStr = Number.toString();
    var BahtText = "";
    var SatangText = "";
    var NumberValues = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
    var DigitValues = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

    if (isNaN(Number)) return "ข้อมูลจำนวนเงินไม่ถูกต้อง";
    if (Number == 0) return "ศูนย์บาทถ้วน";

    var Parts = NumberStr.split('.');
    var IntegerPart = Parts[0];
    var FractionalPart = Parts.length > 1 ? Parts[1] : "";

    if (FractionalPart.length == 1) FractionalPart += "0";
    else if (FractionalPart.length > 2) FractionalPart = FractionalPart.substring(0, 2);

    BahtText = ProcessPart(IntegerPart, NumberValues, DigitValues);
    if (BahtText != "") BahtText += "บาท";

    if (FractionalPart != "" && FractionalPart != "00") {
        SatangText = ProcessPart(FractionalPart, NumberValues, DigitValues);
        if (SatangText != "") SatangText += "สตางค์";
    } else {
        SatangText += "ถ้วน";
    }

    return BahtText + SatangText;
}

function ProcessPart(str, NumberValues, DigitValues) {
    var text = "";
    var length = str.length;
    for (var i = 0; i < length; i++) {
        var digit = parseInt(str.charAt(i));
        var pos = length - i - 1;

        if (digit != 0) {
            if (pos % 6 == 1 && digit == 1) { text += ""; }
            else if (pos % 6 == 1 && digit == 2) { text += "ยี่"; }
            else if (pos % 6 == 0 && digit == 1 && length > 1 && str.charAt(length - 2) != '0') { text += "เอ็ด"; }
            else { text += NumberValues[digit]; }
            text += DigitValues[pos % 6];
            if (pos >= 6 && pos % 6 == 0) text += DigitValues[6];
        } else if (pos > 0 && pos % 6 == 0 && length > 6) {
            text += DigitValues[6];
        }
    }
    return text;
}

function createPageDOM(sv) {
    const page = document.createElement('div');
    page.className = 'a4-page';

    page.innerHTML = `
        <div class="page-top-border"></div>
        <div class="content-wrapper">
            <!-- Header -->
            <div class="header-section flex-between align-start" style="margin-bottom: 15px;">
                <div class="logo-area">
                    <img src="LOGO-KittenCode + QR +Bar.png" class="company-logo" alt="Kitten Code Logo" onerror="this.style.display='none'">
                </div>
                <div class="company-details">
                    <h1 class="company-name">Kitten Code</h1>
                    <p class="company-address">ที่อยู่: 347/11 หมู่ 3 ตำบลท่าโพธิ์ อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000</p>
                    <p class="company-contact">
                        โทร : <span>+66 8 0885 0555</span> &nbsp;&nbsp; 
                        อีเมล : <span>kittencode.co.ltd@gmail.com</span>
                    </p>
                </div>
            </div>

            <h2 class="doc-title" style="text-align: center; margin-bottom: 20px; font-size: 18px;">ใบเสนอราคา (Quotation)</h2>

            <!-- Flex Row for Details -->
            <div class="doc-info-section flex-between align-start" style="margin-bottom: 20px; font-size: 13px; align-items: flex-start;">
                <div class="info-group" style="width: 54%;">
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ชื่อลูกค้า :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.custName)}</span></div>
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ที่อยู่ :</span> <span class="info-value line-break" style="flex: 1;">${escapeHTML(sv.custAddr)}</span></div>
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">โทร :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.custTel)}</span></div>
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 160px; font-weight: bold;">เลขประจำตัวผู้เสียภาษีอากร :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.custTax)}</span></div>
                    
                    <div class="customer-project-section" style="margin-top: 15px;">
                        <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ชื่องาน :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.projName)}</span></div>
                        <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ผู้ติดต่อ :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.projContact)}</span></div>
                        <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">เบอร์โทร :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.projTel)}</span></div>
                    </div>
                </div>
                
                <div class="info-group right-align" style="width: 42%; margin-top: -5px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <colgroup><col style="width: 50%;"><col style="width: 50%;"></colgroup>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">เลขที่ใบเสนอราคา :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docNo)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">วันที่ :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docDate)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">เงื่อนไขชำระเงิน :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docTerms)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">เครดิต :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docCredit)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">หน้า :</td><td class="page-number-display" style="padding: 0 0 6px 0; white-space: nowrap;"></td></tr>
                    </table>
                </div>
            </div>

            <!-- Main Table -->
            <table class="quote-table" style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                <thead>
                    <tr>
                        <th class="col-no" style="width: 6%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">ลำดับ</th>
                        <th class="col-desc" style="width: 50%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">รายละเอียดสินค้า / บริการ</th>
                        <th class="col-qty" style="width: 12%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">จำนวน</th>
                        <th class="col-price" style="width: 15%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">ราคา/หน่วย</th>
                        <th class="col-amount" style="width: 17%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody class="table-body">
                </tbody>
            </table>
            
            <div class="tfoot-placeholder"></div>
            <div class="signatures-placeholder" style="margin-top: auto;"></div>
        </div>
    `;
    return page;
}

function buildPreview() {
    const container = document.getElementById('preview-panel');
    if (!container) return;

    // Remember scroll position to snap back
    const scrollPos = container.scrollTop;

    container.innerHTML = '';

    const stateVars = {
        docNo: getInputValue('doc-no') || '-',
        docDate: getThaiDate(getInputValue('doc-date')),
        docTerms: getInputValue('doc-terms') || '-',
        docCredit: getInputValue('doc-credit') || '-',
        custName: getInputValue('cust-name') || '-',
        custAddr: getInputValue('cust-addr') || '-',
        custTel: getInputValue('cust-tel') || '-',
        custTax: getInputValue('cust-tax') || '-',
        projName: getInputValue('proj-name') || '-',
        projContact: getInputValue('proj-contact') || '-',
        projTel: getInputValue('proj-tel') || '-',
        signBuyer: getInputValue('sign-buyer') || '',
        signPrep: getInputValue('sign-prep') || '',
        signAppr: getInputValue('sign-appr') || ''
    };

    let pages = [];
    let currentPage = createPageDOM(stateVars);
    container.appendChild(currentPage);
    pages.push(currentPage);

    let tbody = currentPage.querySelector('.table-body');
    let wrapper = currentPage.querySelector('.content-wrapper');

    let subtotal = 0;

    // Add Items iteratively to measure height
    state.items.forEach((item, index) => {
        const amount = item.qty * item.price;
        subtotal += amount;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-no" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top;">${index + 1}</td>
            <td class="col-desc" style="border: 1px solid #ddd; padding: 8px; white-space: pre-wrap; vertical-align: top;">${escapeHTML(item.desc)}</td>
            <td class="col-qty" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top;">${formatQty(item.qty)}</td>
            <td class="col-price" style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top;">${formatMoney(item.price)}</td>
            <td class="col-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top;">${formatMoney(amount)}</td>
        `;
        tbody.appendChild(tr);

        console.log(`Item ${index}: scrollHeight = ${wrapper.scrollHeight} `);

        // Measure using absolute pixel threshold for A4 (1122px at 96DPI)
        if (wrapper.scrollHeight > wrapper.clientHeight && tbody.children.length > 1) {
            tr.remove(); // Remove from this page

            // Start a new page
            currentPage = createPageDOM(stateVars);
            container.appendChild(currentPage);
            pages.push(currentPage);

            tbody = currentPage.querySelector('.table-body');
            wrapper = currentPage.querySelector('.content-wrapper');
            tbody.appendChild(tr); // Add to new page
        }
    });

    const vatRate = Number(getInputValue('doc-vat')) || 0;
    const discountAmount = state.discount || 0;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = afterDiscount * (vatRate / 100);
    const grandTotal = afterDiscount + vatAmount;
    const noteText = state.note || '';
    const isVatAdded = vatRate > 0;
    const isDiscounted = discountAmount > 0;
    // Count rows for rowspan: รวมเงิน + ส่วนลด(optional) + vat(optional) + รวมทั้งสิ้น = 2~4
    const summaryRows = 2 + (isDiscounted ? 1 : 0) + (isVatAdded ? 1 : 0);

    const summaryHTML = `
            <table class="quote-table no-top-margin summary-table" style="width: 100%; border-collapse: collapse; border-top: none; margin-top: -1px;">
                <tbody>
                    <tr>
                        <td colspan="2" rowspan="${summaryRows}" class="text-amount-cell" style="width: 56%; border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; background: #fafafa;">
                            ${noteText ? `<div style="text-align:left; margin-bottom: 8px;"><strong>หมายเหตุ : </strong><span style="white-space: pre-wrap;">${escapeHTML(noteText)}</span></div>` : ''}
                            <strong>ตัวอักษร : </strong><span>${ArabicNumberToText(grandTotal)}</span>
                        </td>
                        <td colspan="2" class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 27%;">รวมเงิน</td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 17%;">${formatMoney(subtotal)}</td>
                    </tr>
                    ${isDiscounted ? `
                    <tr>
                        <td colspan="2" class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;">ส่วนลด</td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;">-${formatMoney(discountAmount)}</td>
                    </tr>
                    ` : ''}
                    ${isVatAdded ? `
                <tr>
                    <td colspan="2" class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;">ภาษีมูลค่าเพิ่ม ${vatRate}%</td>
                    <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatMoney(vatAmount)}</td>
                </tr>
                ` : ''}
                    <tr>
                        <td colspan="2" class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>รวมราคาทั้งสิ้น</strong></td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>${formatMoney(grandTotal)}</strong></td>
                    </tr>
                </tbody>
        </table>
            `;

    const signaturesHTML = `
            <div class="signatures" style="display: flex; justify-content: space-around; margin-top: 40px; text-align: center; font-size: 13px;">
            <div class="sig-box">
                <div class="sig-line" style="border-bottom: 1px dashed #666; width: 150px; margin: 0 auto 10px auto;"></div>
                <div class="sig-role">สั่งซื้อโดย / ผู้เจรจา</div>
                <div class="sig-name" style="margin-top: 5px;">${escapeHTML(stateVars.signBuyer)}</div>
            </div>
            <div class="sig-box">
                <div class="sig-line" style="border-bottom: 1px dashed #666; width: 150px; margin: 0 auto 10px auto;"></div>
                <div class="sig-role">จัดทำโดย</div>
                <div class="sig-name" style="margin-top: 5px;">${escapeHTML(stateVars.signPrep)}</div>
            </div>
            <div class="sig-box">
                <div class="sig-line" style="border-bottom: 1px dashed #666; width: 150px; margin: 0 auto 10px auto;"></div>
                <div class="sig-role">อนุมัติโดย</div>
                <div class="sig-name" style="margin-top: 5px;">${escapeHTML(stateVars.signAppr)}</div>
            </div>
        </div>
            `;

    currentPage.querySelector('.tfoot-placeholder').innerHTML = summaryHTML;
    currentPage.querySelector('.signatures-placeholder').innerHTML = signaturesHTML;

    if (wrapper.scrollHeight > wrapper.clientHeight) {
        // Doesn't fit in the current page!
        currentPage.querySelector('.tfoot-placeholder').innerHTML = '';
        currentPage.querySelector('.signatures-placeholder').innerHTML = '';

        currentPage = createPageDOM(stateVars);
        container.appendChild(currentPage);
        pages.push(currentPage);

        // Remove the negative margin on a new isolated page so it doesn't overlap header
        currentPage.querySelector('.tfoot-placeholder').innerHTML = summaryHTML.replace('margin-top: -1px;', 'margin-top: 0;');
        currentPage.querySelector('.signatures-placeholder').innerHTML = signaturesHTML;
    }

    // Update Page Numbers
    const totalPages = pages.length;
    pages.forEach((page, idx) => {
        const pageNumEls = page.querySelectorAll('.page-number-display');
        pageNumEls.forEach(el => el.innerText = `${idx + 1} / ${totalPages}`);
    });

    container.scrollTop = scrollPos;
}