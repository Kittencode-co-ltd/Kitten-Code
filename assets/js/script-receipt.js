const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
};

let state = {
    items: [{ id: generateId(), desc: "", qty: 1, price: 0, discount: 0 }]
};

// --- Draft Recovery System ---
const showDraftToast = () => {
    if(document.getElementById('kcToast')) return;
    const toast = document.createElement('div');
    toast.id = 'kcToast';
    toast.className = 'kc-toast-container';
    toast.innerHTML = `
        <i class="bi bi-check-circle kc-toast-icon"></i>
        <div class="kc-toast-content">
            <span class="kc-toast-title">Draft Restored</span>
            <span class="kc-toast-message">Your unsaved form data has been recovered.</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

function saveDraft() {
    const draft = { state: state, inputs: {} };
    document.querySelectorAll('.form-panel input, .form-panel textarea, .form-panel select').forEach(el => {
        if(el.id) draft.inputs[el.id] = el.value;
    });
    localStorage.setItem('draft_receipt_data', JSON.stringify(draft));
}

function restoreDraft() {
    const saved = localStorage.getItem('draft_receipt_data');
    if (saved) {
        try {
            const draft = JSON.parse(saved);
            state = draft.state;
            Object.keys(draft.inputs).forEach(id => {
                const el = document.getElementById(id);
                if(el) el.value = escapeHTML(draft.inputs[id]);
            });
            showDraftToast();
        } catch(e) { console.error("Could not restore draft", e); }
    }
}

window.clearDraft = function() {
    localStorage.removeItem('draft_receipt_data');
    location.reload();
};
// ------------------------------

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
        el.addEventListener('change', () => buildPreview());
    });

    restoreDraft();
    renderItemsForm();

    // Initial build
    document.fonts.ready.then(() => {
        buildPreview();
    });
    setTimeout(() => buildPreview(), 500);
});

function updatePreview() { buildPreview(); }

// Generate unique ID
function generateId() { return Date.now() + Math.floor(Math.random() * 100); }

function addItemLine() {
    state.items.push({ id: generateId(), desc: "", qty: 1, price: 0, discount: 0 });
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
                    <div class="form-group">
                        <label>ส่วนลด</label>
                        <input type="number" step="0.01" value="${item.discount || 0}" oninput="handleItemChange(${item.id}, 'discount', this.value)">
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
    return Number(qty).toLocaleString('en-US', { maximumFractionDigits: 0 }); // Int for mostly qty
}

function getInputValue(id) {
    const el = document.getElementById(`in-${id}`);
    return el ? el.value : '';
}

function getThaiDate(dateString) {
    if (!dateString) return '';
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d)) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${months[d.getMonth()]}/${d.getFullYear() + 543}`;
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

// Checkbox helper to set check based on condition
function renderCheckbox(checked) {
    return checked ? 
        '<i class="fa-solid fa-square-check" style="color: #333; margin-right: 4px; font-size: 14px;"></i>' : 
        '<i class="fa-regular fa-square" style="color: #333; margin-right: 4px; font-size: 14px;"></i>';
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

            <h2 class="doc-title" style="text-align: center; margin-bottom: 20px; font-size: 18px;">ใบเสร็จรับเงิน (Receipt)</h2>

            <!-- Flex Row for Details -->
            <div class="doc-info-section flex-between align-start" style="margin-bottom: 20px; font-size: 13px; align-items: flex-start;">
                <div class="info-group" style="width: 54%;">
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ชื่อลูกค้า :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.custName)}</span></div>
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ที่อยู่ :</span> <span class="info-value line-break" style="flex: 1;">${escapeHTML(sv.custAddr)}</span></div>
                    <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 160px; font-weight: bold;">เลขประจำตัวผู้เสียภาษีอากร :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.custTax)}</span></div>
                    
                    <div class="customer-project-section" style="margin-top: 15px;">
                        <div class="info-row" style="display: flex; margin-bottom: 5px;"><span class="info-label" style="min-width: 90px; font-weight: bold;">ชื่อโปรเจ็ค :</span> <span class="info-value" style="flex: 1;">${escapeHTML(sv.projName)}</span></div>
                    </div>
                </div>
                
                <div class="info-group right-align" style="width: 42%; margin-top: -5px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <colgroup><col style="width: 50%;"><col style="width: 50%;"></colgroup>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">เลขที่ใบเสร็จ :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docNo)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">วันที่ :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docDate)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">ชำระโดย :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docPayment)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">พนักงานขาย :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docSalesman)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">ใบวางบิล :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docInvoice)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">เอกสารอ้างอิง :</td><td style="padding: 0 0 6px 0; white-space: nowrap;">${escapeHTML(sv.docRef)}</td></tr>
                        <tr><td style="font-weight: bold; padding: 0 4px 6px 0; vertical-align: top;">หน้า :</td><td class="page-number-display" style="padding: 0 0 6px 0; white-space: nowrap;"></td></tr>
                    </table>
                </div>
            </div>

            <!-- Main Table -->
            <table class="quote-table" style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                <thead>
                    <tr>
                        <th class="col-no" style="width: 6%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">ลำดับ</th>
                        <th class="col-desc" style="width: 40%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">รายละเอียดสินค้า / บริการ</th>
                        <th class="col-qty" style="width: 9%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">จำนวน</th>
                        <th class="col-price" style="width: 15%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">ราคา/หน่วย</th>
                        <th class="col-discount" style="width: 13%; border: 1px solid #ddd; padding: 10px; text-align: center; background: #f8f9fa;">ส่วนลด</th>
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
    saveDraft();
    const container = document.getElementById('preview-panel');
    if (!container) return;

    // Remember scroll position to snap back
    const scrollPos = container.scrollTop;
    container.innerHTML = '';

    const stateVars = {
        docNo: getInputValue('doc-no') || '-',
        docDate: getThaiDate(getInputValue('doc-date')),
        docPayment: getInputValue('doc-payment') || '-',
        docSalesman: getInputValue('doc-salesman') || '-',
        docInvoice: getInputValue('doc-invoice') || '-',
        docRef: getInputValue('doc-ref') || '-',
        projName: getInputValue('proj-name') || '-',
        custName: getInputValue('cust-name') || '-',
        custTax: getInputValue('cust-tax') || '-',
        custAddr: getInputValue('cust-addr') || '-',
        paymentDetail: getInputValue('payment-detail') || '',
        signReceiver: getInputValue('sign-receiver') || '',
        signAuth: getInputValue('sign-auth') || ''
    };

    let pages = [];
    let currentPage = createPageDOM(stateVars);
    container.appendChild(currentPage);
    pages.push(currentPage);

    let tbody = currentPage.querySelector('.table-body');
    let wrapper = currentPage.querySelector('.content-wrapper');

    let subtotalAmount = 0;

    // Add Items iteratively
    state.items.forEach((item, index) => {
        const lineTotal = (item.qty * item.price) - item.discount;
        subtotalAmount += lineTotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-no" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top;">${index + 1}</td>
            <td class="col-desc" style="border: 1px solid #ddd; padding: 8px; white-space: pre-wrap; vertical-align: top;">${escapeHTML(item.desc)}</td>
            <td class="col-qty" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: top;">${formatQty(item.qty)}</td>
            <td class="col-price" style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top;">${formatMoney(item.price)}</td>
            <td class="col-discount" style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top;">${formatMoney(item.discount)}</td>
            <td class="col-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right; vertical-align: top;">${formatMoney(lineTotal)}</td>
        `;
        tbody.appendChild(tr);

        // Measure using absolute pixel threshold for A4
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

    // Calculate Totals
    const specialDiscount = Number(getInputValue('special-discount')) || 0;
    const afterDiscount = subtotalAmount - specialDiscount;
    const vatRate = Number(getInputValue('doc-vat')) || 0;
    const vatAmount = afterDiscount * (vatRate / 100);
    const grandTotal = afterDiscount + vatAmount;
    const isVatAdded = vatRate > 0;
    const hasSpecialDisc = specialDiscount > 0;

    let totalRowsCount = 2; // Subtotal + Grand Total
    if (hasSpecialDisc) totalRowsCount += 2;
    if (isVatAdded) totalRowsCount += 1;

    // Checkbox boolean checks
    const chkCash = renderCheckbox(stateVars.docPayment === 'เงินสด');
    const chkTrans = renderCheckbox(stateVars.docPayment === 'โอนเงิน');
    const chkCheque = renderCheckbox(stateVars.docPayment === 'เช็คธนาคาร');
    const chkOther = renderCheckbox(stateVars.docPayment === 'อื่นๆ');

    const paymentDetailsHtml = `
        <div style="text-align: left; margin-bottom: 10px; font-size: 11px;">
            <div style="font-weight: bold; margin-bottom: 5px;">การชำระเงิน (Conditions of Payments)</div>
            <div style="display: flex; gap: 10px; margin-bottom: 5px; flex-wrap: wrap;">
                <span style="white-space: nowrap;">${chkCash} เงินสด</span>
                <span style="white-space: nowrap;">${chkTrans} โอนเงิน</span>
                <span style="white-space: nowrap;">${chkCheque} เช็คธนาคาร</span>
                <span style="white-space: nowrap;">${chkOther} อื่นๆ</span>
            </div>
            <div><span style="font-weight: bold;">รายละเอียด (Payment Detail):</span><br>${escapeHTML(stateVars.paymentDetail).replace(/\\n/g, '<br>')}</div>
        </div>
    `;

    const summaryHTML = `
            <table class="quote-table no-top-margin summary-table" style="width: 100%; border-collapse: collapse; border-top: none; margin-top: -1px;">
                <tbody>
                    <tr>
                        <td colspan="4" rowspan="${totalRowsCount}" class="text-amount-cell" style="width: 56%; border: 1px solid #ddd; padding: 15px; text-align: center; vertical-align: top; background: #fafafa;">
                            ${paymentDetailsHtml}
                            <div style="margin-top: 15px; background: #eee; padding: 8px; display: inline-block; border-radius: 4px; width: 100%;">
                                <strong>ตัวอักษร : </strong><span>${ArabicNumberToText(grandTotal)}</span>
                            </div>
                        </td>
                        <td class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 27%;">รวมเป็นเงิน</td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 17%;">${formatMoney(subtotalAmount)}</td>
                    </tr>
                    ${hasSpecialDisc ? `
                    <tr>
                        <td class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;">หักส่วนลดพิเศษ</td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatMoney(specialDiscount)}</td>
                    </tr>
                    <tr>
                        <td class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;">ยอดรวมหลังหักส่วนลด</td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatMoney(afterDiscount)}</td>
                    </tr>
                    ` : ''}
                    ${isVatAdded ? `
                    <tr>
                        <td class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;">ภาษีมูลค่าเพิ่ม ${vatRate}%</td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatMoney(vatAmount)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td class="summary-label" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>จำนวนเงินรวมทั้งสิ้น</strong></td>
                        <td class="summary-amount" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>${formatMoney(grandTotal)}</strong></td>
                    </tr>
                </tbody>
        </table>
    `;

    const signaturesHTML = `
            <div class="signatures" style="display: flex; justify-content: space-around; margin-top: 40px; text-align: center; font-size: 13px;">
            <div class="sig-box">
                <div class="sig-line" style="border-bottom: 1px dashed #666; width: 150px; margin: 0 auto 10px auto;"></div>
                <div class="sig-role" style="font-weight: bold;">ผู้รับเงิน / Bill Receiver Signature</div>
                <div class="sig-name" style="margin-top: 5px; font-size: 11px;">วันที่ / Date ...../...../.....</div>
                <div class="sig-name" style="margin-top: 5px;">${escapeHTML(stateVars.signReceiver)}</div>
            </div>
            <div class="sig-box" style="display: flex; align-items: center; justify-content: center;">
                <div style="border: 2px dashed #ccc; padding: 10px 20px; color: #aaa; font-weight: bold; font-size: 14px; transform: rotate(-5deg); border-radius: 4px;">
                    STAMP
                </div>
            </div>
            <div class="sig-box">
                <div class="sig-line" style="border-bottom: 1px dashed #666; width: 150px; margin: 0 auto 10px auto;"></div>
                <div class="sig-role" style="font-weight: bold;">ผู้มีอำนาจลงนาม / Authorized Signature</div>
                <div class="sig-name" style="margin-top: 5px; font-size: 11px;">วันที่ / Date ...../...../.....</div>
                <div class="sig-name" style="margin-top: 5px;">${escapeHTML(stateVars.signAuth)}</div>
            </div>
        </div>
    `;

    currentPage.querySelector('.tfoot-placeholder').innerHTML = summaryHTML;
    currentPage.querySelector('.signatures-placeholder').innerHTML = signaturesHTML;

    // Check layout spill again after injecting footer
    if (wrapper.scrollHeight > wrapper.clientHeight) {
        // Doesn't fit! Move footer to new page.
        currentPage.querySelector('.tfoot-placeholder').innerHTML = '';
        currentPage.querySelector('.signatures-placeholder').innerHTML = '';

        currentPage = createPageDOM(stateVars);
        container.appendChild(currentPage);
        pages.push(currentPage);

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
