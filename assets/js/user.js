import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
        import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
        import { getFirestore, collection, doc, setDoc, getDocs, query, limit, limitToLast, startAfter, endBefore, orderBy, deleteDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyC6H2iwP7VKaFX5rOzOGJDFBY6ayR1mpTc",
            authDomain: "kitten-code.firebaseapp.com",
            databaseURL: "https://kitten-code-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "kitten-code",
            storageBucket: "kitten-code.firebasestorage.app",
            messagingSenderId: "309423062731",
            appId: "1:309423062731:web:19a94778a32f87a8f3654e"
        };

        // Main App
        const app = initializeApp(firebaseConfig);
        const db  = getFirestore(app);
        const auth = getAuth(app);    // Primary auth — restores session from IndexedDB

        // Secondary app for admin creating users without losing their session
        const secondaryApp  = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        const PAGE_LIMIT = 10;
        let firstVisibleDoc = null;
        let lastVisibleDoc = null;
        let currentPage = 1;

        let userModalInstance;
        let deleteModalInstance;
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
            await loadUsersData(query(collection(db, "users"), orderBy("created_at", "desc"), endBefore(firstVisibleDoc), limitToLast(PAGE_LIMIT)));
        };

        window.loadNextPage = async () => {
            if (!lastVisibleDoc) return;
            currentPage++;
            await loadUsersData(query(collection(db, "users"), orderBy("created_at", "desc"), startAfter(lastVisibleDoc), limit(PAGE_LIMIT)));
        };

        async function loadUsers(reset = false) {
            if (reset) {
                currentPage = 1;
                firstVisibleDoc = null;
                lastVisibleDoc = null;
            }
            await loadUsersData(query(collection(db, "users"), orderBy("created_at", "desc"), limit(PAGE_LIMIT)));
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
            <td>${user.username || 'N/A'}</td>
            <td class="fw-bold">${fullName}</td>
            <td>${user.email}</td>
            <td>${user.position || '-'}</td>
            <td>${roleBadge}</td>
            <td class="text-end pe-4">
              <button class="btn btn-sm btn-light me-1" onclick="prepareUpdateModal('${userJson}')"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="promptDelete('${user.uid}', '${(fullName !== '<i>N/A</i>' ? fullName : user.username).replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
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
