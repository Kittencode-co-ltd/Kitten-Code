import { db, collection, getDocs, doc, deleteDoc, getDoc } from './firebase-config.js';

let allDocs = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    window.switchTab = switchTab;
    window.deleteDocument = deleteDocument;
    window.printDocument = printDocument;
});

async function loadDocuments() {
    allDocs = [];
    const tbody = document.getElementById('doc-tbody');
    if (!tbody) return;

    try {
        const collections = ['quotations', 'invoices', 'receipts'];
        
        for (const colName of collections) {
            const querySnapshot = await getDocs(collection(db, colName));
            querySnapshot.forEach(snapshotDoc => {
                let data = snapshotDoc.data();
                data.id = snapshotDoc.id;
                data.collectionName = colName;
                allDocs.push(data);
            });
        }
        
        // Sort by date descending, fallback to createdAt timestamp
        allDocs.sort((a, b) => {
            const dateA = new Date(a.docDate || (a.createdAt ? a.createdAt.toDate() : 0));
            const dateB = new Date(b.docDate || (b.createdAt ? b.createdAt.toDate() : 0));
            return dateB - dateA;
        });
        
        renderDocuments();
    } catch (error) {
        console.error("Error loading documents:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f43f5e;">Failed to load data. Please make sure you have the correct permissions.</td></tr>`;
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tabs .tab').forEach(btn => btn.classList.remove('active'));
    // Find the button that was clicked and add active class
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    currentFilter = tabId;
    renderDocuments();
}

function renderDocuments() {
    const tbody = document.getElementById('doc-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Filter documents
    const filtered = currentFilter === 'all' 
        ? allDocs 
        : allDocs.filter(d => d.collectionName === currentFilter);
        
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">
            <div class="empty-state">No documents found.</div>
        </td></tr>`;
        return;
    }
    
    filtered.forEach(d => {
        let typeLabel = '';
        let typeBadgeClass = 'badge '; // Base badge class
        
        if (d.collectionName === 'quotations') {
            typeLabel = 'Quotation';
            typeBadgeClass += 'badge-quote'; 
        } else if (d.collectionName === 'invoices') {
            typeLabel = 'Invoice';
            typeBadgeClass += 'badge-invoice'; 
        } else if (d.collectionName === 'receipts') {
            typeLabel = 'Receipt';
            typeBadgeClass += 'badge-receipt';
        }
        
        // Provide visual indicator for status
        let statusClass = 'badge ';
        const status = d.status || 'Pending';
        if (status.toLowerCase() === 'paid') statusClass += 'badge-paid';
        else if (status.toLowerCase() === 'pending') statusClass += 'badge-pending';
        else statusClass += 'badge-rejected';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHTML(d.docDate || '-')}</td>
            <td><strong>${escapeHTML(d.docNo || '-')}</strong></td>
            <td style="text-align:center;"><span class="${typeBadgeClass}">${escapeHTML(typeLabel)}</span></td>
            <td>${escapeHTML(d.custName || '-')}</td>
            <td style="text-align:right;"><strong>฿${formatMoney(d.amountTotal || 0)}</strong></td>
            <td style="text-align:center;"><span class="${statusClass}">${escapeHTML(status)}</span></td>
            <td style="text-align:center;">
                <button class="action-btn" style="padding: 4px 8px; font-size: 11px;" onclick="printDocument('${d.collectionName}', '${d.id}')" title="Print/View">
                    <i class="fas fa-print"></i>
                </button>
                <button class="action-btn" style="padding: 4px 8px; font-size: 11px; background: rgba(244, 63, 94, 0.1); color: #f43f5e; border-color: rgba(244, 63, 94, 0.3);" onclick="deleteDocument('${d.collectionName}', '${d.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.printDocument = async function(colName, id) {
    try {
        const docRef = doc(db, colName, id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
            alert("ไม่พบเอกสารนี้ในระบบ (Document not found)");
            return;
        }
        const data = snapshot.data();
        
        let targetPage = '';
        let storageKey = '';
        
        if (colName === 'quotations') {
            targetPage = 'quotaion.html';
            storageKey = 'draft_quotation_data';
        } else if (colName === 'invoices') {
            targetPage = 'invoice.html';
            storageKey = 'draft_invoice_data';
        } else if (colName === 'receipts') {
            targetPage = 'receipt.html';
            storageKey = 'draft_receipt_data';
        }
        
        // Un-escape HTML to populate inputs correctly
        const unescapeHTML = (str) => {
            if (!str) return '';
            return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        };

        const draft = {
            state: {
                items: (data.items || []).map((item, index) => ({
                    id: Date.now() + index,
                    desc: unescapeHTML(item.desc),
                    qty: item.qty,
                    price: item.price
                })),
                discount: data.discountAmount || 0,
                note: unescapeHTML(data.note || '')
            },
            inputs: {
                'in-doc-no': data.docNo || '',
                'in-doc-date': data.docDate || '',
                'in-doc-terms': data.docTerms || '',
                'in-doc-credit': data.docCredit || '',
                'in-doc-vat': data.vatRate || 0,
                'in-doc-discount': data.discountAmount || 0,
                'in-cust-name': unescapeHTML(data.custName || ''),
                'in-cust-addr': unescapeHTML(data.custAddr || ''),
                'in-cust-tel': unescapeHTML(data.custTel || ''),
                'in-cust-tax': unescapeHTML(data.custTax || ''),
                'in-proj-name': unescapeHTML(data.projName || ''),
                'in-proj-contact': unescapeHTML(data.projContact || ''),
                'in-proj-tel': unescapeHTML(data.projTel || ''),
                'in-note': unescapeHTML(data.note || ''),
                'in-sign-buyer': unescapeHTML(data.signBuyer || ''),
                'in-sign-prep': unescapeHTML(data.signPrep || ''),
                'in-sign-appr': unescapeHTML(data.signAppr || '')
            },
            isReprint: true
        };
        
        localStorage.setItem(storageKey, JSON.stringify(draft));
        window.location.href = targetPage;
        
    } catch (e) {
        console.error("Error loading document for reprint:", e);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร (Error loading document)");
    }
}

window.deleteDocument = async function(colName, id) {
    if (confirm('ยืนยันลบเอกสารนี้หรือไม่? (Are you sure you want to delete this document?)')) {
        try {
            await deleteDoc(doc(db, colName, id));
            // Reload the list entirely or just remove locally. Removing locally is faster.
            allDocs = allDocs.filter(d => d.id !== id || d.collectionName !== colName);
            renderDocuments();
        } catch (e) {
            console.error("Error deleting document:", e);
            alert('Error deleting document: ' + (e.message || "Unknown error"));
        }
    }
};

const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
};

function formatMoney(amount) {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
