        import { app, auth, db, onAuthStateChanged, createUserWithEmailAndPassword, signOut, collection, doc, setDoc, addDoc, getDocs, query, limit, limitToLast, startAfter, endBefore, orderBy, deleteDoc, serverTimestamp, updateDoc } from './firebase-config.js';
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
        import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
        
        // Load secrets securely injected at build-time by GitHub Actions
        const __ENV__ = (typeof window !== 'undefined' && window.__ENV__) || {};
        const firebaseConfig = {
            apiKey:            __ENV__.FIREBASE_API_KEY            || 'AIzaSyC6H2iwP7VKaFX5rOzOGJDFBY6ayR1mpTc',
            authDomain:        __ENV__.FIREBASE_AUTH_DOMAIN        || 'kitten-code.firebaseapp.com',
            projectId:         __ENV__.FIREBASE_PROJECT_ID         || 'kitten-code',
            storageBucket:     __ENV__.FIREBASE_STORAGE_BUCKET     || 'kitten-code.firebasestorage.app',
            messagingSenderId: __ENV__.FIREBASE_MESSAGING_SENDER_ID|| '309423062731',
            appId:             __ENV__.FIREBASE_APP_ID             || '1:309423062731:web:19a94778a32f87a8f3654e'
        };

        const escapeHTML = (str) => {
            if (!str) return '';
            return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match]));
        };

        const showDraftToast = () => {
            if(document.getElementById('kcToast')) return;
            const toast = document.createElement('div');
            toast.id = 'kcToast';
            toast.style.cssText = "position:fixed;bottom:-100px;right:30px;background:rgba(15,23,42,0.85);backdrop-filter:blur(12px);border-left:4px solid #00b09b;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);color:#fff;padding:16px 20px;display:flex;align-items:center;gap:12px;z-index:9999;transition:bottom 0.4s;opacity:0;";
            toast.innerHTML = `
                <i class="bi bi-check-circle" style="font-size:1.25rem;color:#00b09b;"></i>
                <div style="display:flex;flex-direction:column;">
                    <span style="font-weight:600;font-size:0.95rem;">Draft Restored</span>
                    <span style="font-size:0.8rem;color:#cbd5e1;">Your unsaved form data has been recovered.</span>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.bottom = '30px'; toast.style.opacity = '1'; }, 100);
            setTimeout(() => {
                toast.style.bottom = '-100px'; toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        };

        let _userDraftRestored = false;
        function saveDraftUser() {
            if (document.getElementById('docId')?.value) return; // Only autosave during Create
            const draft = {
                username: document.getElementById('mUsername')?.value || '',
                email: document.getElementById('mEmail')?.value || '',
                role: document.getElementById('mRole')?.value || 'user',
                position: document.getElementById('mPosition')?.value || '',
                firstName: document.getElementById('mFirstName')?.value || '',
                lastName: document.getElementById('mLastName')?.value || '',
                birthDate: document.getElementById('mBirthDate')?.value || '',
                phone: document.getElementById('mPhone')?.value || '',
                bankAccountName: document.getElementById('mBankAccountName')?.value || '',
                bankName: document.getElementById('mBankName')?.value || '',
                bankAccountNumber: document.getElementById('mBankAccountNumber')?.value || ''
            };
            localStorage.setItem('draft_user_data', JSON.stringify(draft));
        }

        function restoreDraftUser() {
            if (_userDraftRestored || document.getElementById('docId').value) return;
            const saved = localStorage.getItem('draft_user_data');
            if (saved) {
                try {
                    const draft = JSON.parse(saved);
                    const bind = (id, val) => { if(val && document.getElementById(id)) document.getElementById(id).value = escapeHTML(val); };
                    bind('mUsername', draft.username);
                    bind('mEmail', draft.email);
                    bind('mRole', draft.role);
                    bind('mPosition', draft.position);
                    bind('mFirstName', draft.firstName);
                    bind('mLastName', draft.lastName);
                    bind('mBirthDate', draft.birthDate);
                    bind('mPhone', draft.phone);
                    bind('mBankAccountName', draft.bankAccountName);
                    bind('mBankName', draft.bankName);
                    bind('mBankAccountNumber', draft.bankAccountNumber);
                    showDraftToast();
                } catch(e) {}
            }
            _userDraftRestored = true;
        }

        // Secondary app for admin creating users without losing primary session
        const secondaryApp  = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        const PAGE_LIMIT = 10;
        let firstVisibleDoc = null;
        let lastVisibleDoc = null;
        let currentPage = 1;

        let userModalInstance;
        let deleteModalInstance;
        let payrollModalInstance;
        let userToDeleteId = null;

        // Globals for inline onclick triggers
        window.prepareCreateModal = () => {
            document.getElementById('userForm').reset();
            document.getElementById('docId').value = '';
            document.getElementById('userModalLabel').innerText = 'Add New User';
            document.getElementById('passwordGroup').style.display = 'block';
            document.getElementById('mPassword').required = true;
            document.getElementById('mEmail').disabled = false;
            document.getElementById('modalAlert').classList.add('d-none');
            _userDraftRestored = false;
            restoreDraftUser();
        };

        window.prepareUpdateModal = (userJson) => {
            const user = JSON.parse(decodeURIComponent(userJson));
            document.getElementById('userForm').reset();
            document.getElementById('userModalLabel').innerText = 'Edit User Details';
            document.getElementById('modalAlert').classList.add('d-none');

            // Password not updatable here, Email is disabled to prevent Auth mismatches
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('mPassword').required = false;
            document.getElementById('mEmail').disabled = true;

            // Populate core
            document.getElementById('docId').value = user.uid;
            document.getElementById('mUsername').value = user.username || '';
            document.getElementById('mEmail').value = user.email || '';
            document.getElementById('mRole').value = user.role || 'user';
            document.getElementById('mPosition').value = user.position || '';

            // Populate profile
            document.getElementById('mFirstName').value = user.firstName || '';
            document.getElementById('mLastName').value = user.lastName || '';
            document.getElementById('mBirthDate').value = user.birthDate || '';
            document.getElementById('mPhone').value = user.phone || '';

            // Populate finance
            document.getElementById('mBankAccountName').value = user.bankAccountName || '';
            document.getElementById('mBankName').value = user.bankName || '';
            document.getElementById('mBankAccountNumber').value = user.bankAccountNumber || '';

            userModalInstance.show();
        };
        
        window.preparePayrollModal = (userJson) => {
            const user = JSON.parse(decodeURIComponent(userJson));
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
            
            document.getElementById('payrollForm').reset();
            document.getElementById('pUid').value = user.uid;
            document.getElementById('pFullName').value = fullName;
            document.getElementById('pDate').value = new Date().toISOString().split('T')[0];
            
            payrollModalInstance.show();
        };

        window.confirmPayroll = async (e) => {
            e.preventDefault();
            if(!auth.currentUser) {
                alert("Security Error: You must be authenticated to perform this action.");
                return;
            }

            const btn = document.getElementById('btnConfirmPayroll');
            const targetUserName = document.getElementById('pFullName').value;
            const projectRef = document.getElementById('pProjectRef').value;
            const amountInput = document.getElementById('pAmount').value;
            const selectedDate = document.getElementById('pDate').value;
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            try {
                const payrollDoc = {
                    date: selectedDate,
                    catCode: "EXP-17", // Salary Category Code
                    desc: `จ่ายเงินเดือน/ค่าจ้าง: ${targetUserName} (งาน: ${projectRef})`,
                    amount: parseFloat(amountInput),
                    contact: targetUserName,
                    ref: "PAYROLL-" + Date.now(),
                    payment_status: 2, // 2 = Paid
                    paid_date: selectedDate,
                    created_at: serverTimestamp()
                };

                await addDoc(collection(db, "fin_transactions"), payrollDoc);
                
                payrollModalInstance.hide();
            } catch (err) {
                console.error("Payroll Error:", err);
                alert("Failed to record payroll: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm Payment';
            }
        };

        function showToast(title, message) {
            // Check if element exists, if not create basic wrapper
            let toast = document.getElementById('payrollToast');
            if(!toast) {
                toast = document.createElement('div');
                toast.id = 'payrollToast';
                toast.className = 'kc-toast-container';
                document.body.appendChild(toast);
            }
            
            toast.innerHTML = `
                <i class="bi bi-check-circle kc-toast-icon"></i>
                <div class="kc-toast-content">
                    <span class="kc-toast-title">${title}</span>
                    <span class="kc-toast-message">${message}</span>
                </div>
            `;
            
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }

        window.promptDelete = (uid, fullName) => {
            userToDeleteId = uid;
            document.getElementById('delUserName').innerText = fullName;
            deleteModalInstance.show();
        };

        window.deleteUser = async () => {
            if (!userToDeleteId) return;
            const btn = document.getElementById('btnConfirmDelete');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

            try {
                await deleteDoc(doc(db, "users", userToDeleteId));
                deleteModalInstance.hide();
                loadUsers(true); // reload current view
            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("Failed to delete user: " + e.message);
            } finally {
                userToDeleteId = null;
                btn.disabled = false;
                btn.innerHTML = 'Delete';
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            userModalInstance = new bootstrap.Modal(document.getElementById('userModal'));
            deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteModal'));
            payrollModalInstance = new bootstrap.Modal(document.getElementById('payrollModal'));

            ['mUsername', 'mEmail', 'mRole', 'mPosition', 'mFirstName', 'mLastName', 'mBirthDate', 'mPhone', 'mBankAccountName', 'mBankName', 'mBankAccountNumber'].forEach(id => {
                const el = document.getElementById(id);
                if(el) {
                    el.addEventListener('input', saveDraftUser);
                    el.addEventListener('change', saveDraftUser);
                }
            });

            // ── Auth guard: wait for Firebase to restore session from IndexedDB ──
            // Without this, loadUsers() fires before auth.currentUser is set,
            // causing Firestore to reject with "Missing or insufficient permissions".
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    loadUsers();
                } else {
                    const tbody = document.getElementById('userTableBody');
                    if (tbody) {
                        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">
                          <i class="bi bi-shield-lock-fill me-2"></i>
                          <strong>Session not found.</strong> Please sign in via the Back Office.
                        </td></tr>`;
                    }
                }
            });

            // Form submission for create / update
            document.getElementById('userForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const docId = document.getElementById('docId').value;
                const btnSave = document.getElementById('btnSaveUser');
                const alertBox = document.getElementById('modalAlert');

                const username = document.getElementById('mUsername').value.trim();
                const email = document.getElementById('mEmail').value.trim();
                const role = document.getElementById('mRole').value;
                const position = document.getElementById('mPosition').value.trim();
                const firstName = document.getElementById('mFirstName').value.trim();
                const lastName = document.getElementById('mLastName').value.trim();
                const birthDate = document.getElementById('mBirthDate').value;
                const phone = document.getElementById('mPhone').value.trim();
                const bankAccountName = document.getElementById('mBankAccountName').value.trim();
                const bankName = document.getElementById('mBankName').value.trim();
                const bankAccountNumber = document.getElementById('mBankAccountNumber').value.trim();

                btnSave.disabled = true;
                btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
                alertBox.classList.add('d-none');

                try {
                    if (!docId) { // Create
                        const password = document.getElementById('mPassword').value;
                        // Create Firebase Auth user on secondary app
                        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                        const uid = userCredential.user.uid;
                        await signOut(secondaryAuth); // Sign out of secondary to prevent session leaks

                        const userData = {
                            uid, username, email, role, position,
                            firstName, lastName, birthDate, phone,
                            bankAccountName, bankName, bankAccountNumber,
                            created_at: serverTimestamp(),
                            updated_at: serverTimestamp()
                        };

                        await setDoc(doc(db, "users", uid), userData);
                        localStorage.removeItem('draft_user_data');
                        loadUsers(true);

                    } else { // Update
                        const updateData = {
                            username, role, position,
                            firstName, lastName, birthDate, phone,
                            bankAccountName, bankName, bankAccountNumber,
                            updated_at: serverTimestamp()
                        };

                        await updateDoc(doc(db, "users", docId), updateData);
                        loadUsers(true);
                    }
                    userModalInstance.hide();
                } catch (error) {
                    console.error("Error saving user:", error);
                    alertBox.innerText = error.message;
                    alertBox.classList.remove('d-none');
                } finally {
                    btnSave.disabled = false;
                    btnSave.innerHTML = 'Save User';
                }

            });
        });

        // Pagination Methods
        window.loadPrevPage = async () => {
            if (currentPage <= 1 || !firstVisibleDoc) return;
            currentPage--;
            await loadUsersData(query(collection(db, "users"), orderBy("username", "asc"), endBefore(firstVisibleDoc), limitToLast(PAGE_LIMIT)));
        };

        window.loadNextPage = async () => {
            if (!lastVisibleDoc) return;
            currentPage++;
            await loadUsersData(query(collection(db, "users"), orderBy("username", "asc"), startAfter(lastVisibleDoc), limit(PAGE_LIMIT)));
        };

        async function loadUsers(reset = false) {
            if (reset) {
                currentPage = 1;
                firstVisibleDoc = null;
                lastVisibleDoc = null;
            }
            await loadUsersData(query(collection(db, "users"), orderBy("username", "asc"), limit(PAGE_LIMIT)));
        }

        async function loadUsersData(q) {
            const tbody = document.getElementById('userTableBody');
            const btnPrev = document.getElementById('btnPrev');
            const btnNext = document.getElementById('btnNext');

            try {
                const querySnapshot = await getDocs(q);

                tbody.innerHTML = '';

                if (querySnapshot.empty) {
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No users found.</td></tr>`;
                    firstVisibleDoc = null;
                    lastVisibleDoc = null;
                    btnPrev.disabled = true;
                    btnNext.disabled = true;
                    setPaginationInfo(0);
                    return;
                }

                firstVisibleDoc = querySnapshot.docs[0];
                lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

                // Enable/Disable next btn. Since we limit to 10, if we got 10 there might be more. We assume yes, unless we query +1 ahead.
                // For simplicity:
                btnNext.disabled = querySnapshot.docs.length < PAGE_LIMIT;
                btnPrev.disabled = currentPage === 1;

                let indexOffset = (currentPage - 1) * PAGE_LIMIT;
                querySnapshot.forEach((docSnap, index) => {
                    const user = docSnap.data();
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '<i>N/A</i>';
                    const rNumber = indexOffset + index + 1;

                    let roleBadge = user.role === 'admin' ? '<span class="badge bg-danger">Admin</span>' : '<span class="badge bg-secondary">User</span>';

                    // Encode JSON safely for inline onclick attribute
                    const userJson = encodeURIComponent(JSON.stringify(user));

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
            <td>${escapeHTML(user.username) || 'N/A'}</td>
            <td class="fw-bold">${escapeHTML(fullName)}</td>
            <td>${escapeHTML(user.email)}</td>
            <td>${escapeHTML(user.position) || '-'}</td>
            <td>${roleBadge}</td>
            <td class="text-end pe-4">
              <button class="btn btn-sm btn-outline-success me-1" onclick="preparePayrollModal('${userJson}')" title="Payroll (EXP-17)"><i class="bi bi-currency-dollar"></i></button>
              <button class="btn btn-sm btn-light me-1" onclick="prepareUpdateModal('${userJson}')"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="promptDelete('${user.uid}', '${escapeHTML(fullName !== '<i>N/A</i>' ? fullName : user.username).replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
            </td>
          `;
                    tbody.appendChild(tr);
                });

                setPaginationInfo(querySnapshot.docs.length);

            } catch (e) {
                console.error("Fetch DB error", e);
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle-fill"></i> Failed to fetch data: ${e.message}</td></tr>`;
            }
        }

        function setPaginationInfo(count) {
            if (count === 0) {
                document.getElementById('paginationInfo').innerText = `Showing 0 records`;
            } else {
                const start = ((currentPage - 1) * PAGE_LIMIT) + 1;
                const end = start + count - 1;
                document.getElementById('paginationInfo').innerText = `Showing ${start}-${end} records (Page ${currentPage})`;
            }
        }
