// Run: (needs Java + `npm i -D firebase-tools @firebase/rules-unit-testing`)
//   npx firebase emulators:exec --only firestore --project demo-kitten "node scripts/firestore-rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, getDocs, collection, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-kitten',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 }
});
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ok   ', name); } catch (e) { fail++; console.log('  FAIL ', name, '\n       ', String(e.message).split('\n')[0]); } };

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/admin'), { uid: 'admin', email: 'a@x.co', username: 'boss', role: 'admin' });
  await setDoc(doc(db, 'users/staff'), { uid: 'staff', email: 's@x.co', username: 'somchai', role: 'user' });
  await setDoc(doc(db, 'users/staff2'), { uid: 'staff2', email: 's2@x.co', username: 'mali', role: 'user' });
  await setDoc(doc(db, 'fin_transactions/paid1'), { date: '2026-01-01', catCode: 'X', desc: 'x', amount: 10, payment_status: 2 });
  await setDoc(doc(db, 'fin_transactions/pend1'), { date: '2026-01-01', catCode: 'X', desc: 'x', amount: 10, payment_status: 1 });
  await setDoc(doc(db, 'announcements/a1'), { title: 'hi' });
  await setDoc(doc(db, 'contracts/c1'), { docNo: 'CT-1' });
  await setDoc(doc(db, 'attendance/staff_2026-01-01'), { uid: 'staff', date: '2026-01-01', checkIn: '09:00', checkOut: '' });
  await setDoc(doc(db, 'leave_requests/l1'), { uid: 'staff2', status: 'pending', type: 'sick', days: 1, startDate: 'a', endDate: 'a' });
  await setDoc(doc(db, 'equipment/free'), { name: 'gimbal', status: 'available', holderUid: '' });
  await setDoc(doc(db, 'equipment/taken'), { name: 'mic', status: 'borrowed', holderUid: 'staff2', holderName: 'x' });
  await setDoc(doc(db, 'quotations/q1'), { docNo: 'QT-1', status: 'Pending' });
});

const admin = env.authenticatedContext('admin').firestore();
const staff = env.authenticatedContext('staff').firestore();
const staff2 = env.authenticatedContext('staff2').firestore();
const stray = env.authenticatedContext('stray').firestore();
const anon = env.unauthenticatedContext().firestore();

console.log('Stray sign-up (Auth account without an admin-created profile)');
await t('cannot read announcements', () => assertFails(getDoc(doc(stray, 'announcements/a1'))));
await t('cannot read transactions', () => assertFails(getDocs(collection(stray, 'fin_transactions'))));
await t('cannot self-create admin profile', () => assertFails(setDoc(doc(stray, 'users/stray'), { uid: 'stray', email: 'z@x.co', username: 'z', role: 'admin' })));
await t('cannot self-create user profile', () => assertFails(setDoc(doc(stray, 'users/stray'), { uid: 'stray', email: 'z@x.co', username: 'z', role: 'user' })));
await t('cannot write attendance', () => assertFails(setDoc(doc(stray, 'attendance/stray_2026-01-02'), { uid: 'stray', date: '2026-01-02', checkIn: '09:00', createdAt: serverTimestamp() })));
await t('anonymous cannot read anything', () => assertFails(getDoc(doc(anon, 'announcements/a1'))));

console.log('Users');
await t('admin can create a profile', () => assertSucceeds(setDoc(doc(admin, 'users/new1'), { uid: 'new1', email: 'n@x.co', username: 'n1', role: 'user' })));
await t('staff cannot create a profile', () => assertFails(setDoc(doc(staff, 'users/new2'), { uid: 'new2', email: 'n@x.co', username: 'n2', role: 'user' })));
await t('staff can read own profile', () => assertSucceeds(getDoc(doc(staff, 'users/staff'))));
await t("staff cannot read someone else's profile", () => assertFails(getDoc(doc(staff, 'users/staff2'))));
await t('staff cannot promote self', () => assertFails(updateDoc(doc(staff, 'users/staff'), { role: 'admin' })));
await t('staff can edit own phone', () => assertSucceeds(updateDoc(doc(staff, 'users/staff'), { phone: '081' })));

console.log('Money');
await t('staff files pending transaction', () => assertSucceeds(setDoc(doc(staff, 'fin_transactions/n1'), { date: '2026-01-02', catCode: 'X', desc: 'taxi', amount: 50, payment_status: 1 })));
await t('staff cannot file a paid transaction', () => assertFails(setDoc(doc(staff, 'fin_transactions/n2'), { date: '2026-01-02', catCode: 'X', desc: 'taxi', amount: 50, payment_status: 2 })));
await t('admin can file a paid transaction', () => assertSucceeds(setDoc(doc(admin, 'fin_transactions/n3'), { date: '2026-01-02', catCode: 'X', desc: 'taxi', amount: 50, payment_status: 2 })));
await t('staff edits own pending row', () => assertSucceeds(updateDoc(doc(staff, 'fin_transactions/pend1'), { desc: 'edited', amount: 11, payment_status: 1 })));
await t('staff cannot approve a pending row', () => assertFails(updateDoc(doc(staff, 'fin_transactions/pend1'), { payment_status: 2 })));
await t('staff cannot edit a paid row', () => assertFails(updateDoc(doc(staff, 'fin_transactions/paid1'), { amount: 99, payment_status: 2 })));
await t('admin approves a pending row', () => assertSucceeds(updateDoc(doc(admin, 'fin_transactions/pend1'), { payment_status: 2 })));
await t('staff creates quotation Pending', () => assertSucceeds(setDoc(doc(staff, 'quotations/q2'), { docNo: 'QT-2', status: 'Pending' })));
await t('staff cannot create quotation Approved', () => assertFails(setDoc(doc(staff, 'quotations/q3'), { docNo: 'QT-3', status: 'Approved' })));
await t('staff cannot approve a quotation', () => assertFails(updateDoc(doc(staff, 'quotations/q1'), { status: 'Approved' })));
await t('staff can edit quotation without touching status', () => assertSucceeds(updateDoc(doc(staff, 'quotations/q1'), { custName: 'ACME' })));
await t('admin approves a quotation', () => assertSucceeds(updateDoc(doc(admin, 'quotations/q1'), { status: 'Approved' })));
await t('staff cannot create voucher Paid', () => assertFails(setDoc(doc(staff, 'vouchers/v1'), { docNo: 'PV-1', status: 'Paid' })));
await t('staff creates voucher Pending', () => assertSucceeds(setDoc(doc(staff, 'vouchers/v2'), { docNo: 'PV-2', status: 'Pending' })));

console.log('Contracts (admin only)');
await t('staff cannot read contracts', () => assertFails(getDoc(doc(staff, 'contracts/c1'))));
await t('staff cannot write contracts', () => assertFails(setDoc(doc(staff, 'contracts/c2'), { docNo: 'x' })));
await t('admin can read contracts', () => assertSucceeds(getDoc(doc(admin, 'contracts/c1'))));
await t('admin can write contracts', () => assertSucceeds(setDoc(doc(admin, 'contracts/c3'), { docNo: 'CT-3' })));

console.log('Attendance');
await t('staff checks in as self (server time)', () => assertSucceeds(setDoc(doc(staff, 'attendance/staff_2026-01-02'), { uid: 'staff', name: 's', date: '2026-01-02', checkIn: '09:00', checkOut: '', createdAt: serverTimestamp() })));
await t('staff cannot check in for someone else', () => assertFails(setDoc(doc(staff, 'attendance/staff2_2026-01-02'), { uid: 'staff2', date: '2026-01-02', checkIn: '09:00', createdAt: serverTimestamp() })));
await t('staff cannot backdate createdAt', () => assertFails(setDoc(doc(staff, 'attendance/staff_2026-01-03'), { uid: 'staff', date: '2026-01-03', checkIn: '09:00', createdAt: new Date('2020-01-01') })));
await t('staff sets own check-out', () => assertSucceeds(updateDoc(doc(staff, 'attendance/staff_2026-01-01'), { checkOut: '18:00', updatedAt: serverTimestamp() })));
await t('staff cannot rewrite check-in', () => assertFails(updateDoc(doc(staff, 'attendance/staff_2026-01-01'), { checkIn: '08:00' })));

console.log('Leave');
await t('staff files own pending leave', () => assertSucceeds(setDoc(doc(staff, 'leave_requests/l2'), { uid: 'staff', name: 's', type: 'vacation', startDate: '2026-02-01', endDate: '2026-02-02', days: 2, status: 'pending', reason: '' })));
await t('staff cannot file already-approved leave', () => assertFails(setDoc(doc(staff, 'leave_requests/l3'), { uid: 'staff', type: 'vacation', startDate: 'a', endDate: 'a', days: 2, status: 'approved' })));
await t('staff cannot file 999 days', () => assertFails(setDoc(doc(staff, 'leave_requests/l4'), { uid: 'staff', type: 'vacation', startDate: 'a', endDate: 'a', days: 999, status: 'pending' })));
await t("staff cannot read someone else's leave", () => assertFails(getDoc(doc(staff, 'leave_requests/l1'))));
await t('admin approves leave', () => assertSucceeds(updateDoc(doc(admin, 'leave_requests/l1'), { status: 'approved' })));

console.log('Equipment');
await t('staff borrows a free item as self', () => assertSucceeds(updateDoc(doc(staff, 'equipment/free'), { status: 'borrowed', holderUid: 'staff', holderName: 's', borrowedAt: '2026-01-02', dueDate: '2026-01-03' })));
await t('staff cannot borrow in someone elses name', () => assertFails(updateDoc(doc(staff, 'equipment/free'), { status: 'borrowed', holderUid: 'staff2', holderName: 'x' })));
await t('staff cannot return what someone else holds', () => assertFails(updateDoc(doc(staff, 'equipment/taken'), { status: 'available', holderUid: '', holderName: '' })));
await t('staff cannot take an item that is already borrowed', () => assertFails(updateDoc(doc(staff, 'equipment/taken'), { status: 'borrowed', holderUid: 'staff', holderName: 's' })));
await t('holder returns their own item', () => assertSucceeds(updateDoc(doc(staff, 'equipment/free'), { status: 'available', holderUid: '', holderName: '', borrowedAt: '', dueDate: '' })));
await t('staff cannot mark repair', () => assertFails(updateDoc(doc(staff, 'equipment/free'), { status: 'repair' })));
await t('admin can take back anything', () => assertSucceeds(updateDoc(doc(admin, 'equipment/taken'), { status: 'available', holderUid: '', holderName: '' })));

console.log('Announcements / usernames');
await t('staff reads announcements', () => assertSucceeds(getDoc(doc(staff, 'announcements/a1'))));
await t('staff cannot post announcements', () => assertFails(setDoc(doc(staff, 'announcements/a2'), { title: 'x' })));
await t('staff claims their own username', () => assertSucceeds(setDoc(doc(staff, 'usernames/somchai'), { uid: 'staff', email: 's@x.co' })));
await t('staff cannot claim the admin username', () => assertFails(setDoc(doc(staff, 'usernames/boss'), { uid: 'staff', email: 's@x.co' })));
await t('anyone can look a username up (login)', () => assertSucceeds(getDoc(doc(anon, 'usernames/somchai'))));
await t('nobody can list usernames', () => assertFails(getDocs(collection(anon, 'usernames'))));

console.log('IMS registers');
await t('staff reads a register', () => assertSucceeds(getDocs(collection(staff, 'ims_risks'))));
await t('staff cannot write a register', () => assertFails(setDoc(doc(staff, 'ims_risks/r1'), { title: 'x' })));
await t('admin writes a register', () => assertSucceeds(setDoc(doc(admin, 'ims_risks/r1'), { title: 'x', score: 9 })));
await t('admin writes RACI', () => assertSucceeds(setDoc(doc(admin, 'ims_raci/a1'), { activity: 'x' })));
await t('unknown ims_ collection is closed', () => assertFails(setDoc(doc(admin, 'ims_secret/x'), { a: 1 })));
await t('anon cannot read a register', () => assertFails(getDocs(collection(anon, 'ims_docs'))));
await t('staff acknowledges a policy as self', () => assertSucceeds(setDoc(doc(staff, 'ims_acks/p1_v1.0_staff'), { policyId: 'p1', version: '1.0', uid: 'staff', name: 's', createdAt: serverTimestamp() })));
await t('staff cannot acknowledge for someone else', () => assertFails(setDoc(doc(staff, 'ims_acks/p1_v1.0_staff2'), { policyId: 'p1', version: '1.0', uid: 'staff2', createdAt: serverTimestamp() })));
await t('staff cannot rewrite an acknowledgement', () => assertFails(updateDoc(doc(staff, 'ims_acks/p1_v1.0_staff'), { name: 'z' })));
await t('staff reads only own acknowledgements', () => assertSucceeds(getDocs(query(collection(staff, 'ims_acks'), where('uid', '==', 'staff')))));
await t('staff cannot list everyone\'s acknowledgements', () => assertFails(getDocs(collection(staff, 'ims_acks'))));
await t('admin lists all acknowledgements', () => assertSucceeds(getDocs(collection(admin, 'ims_acks'))));

console.log('Business cards');
const card = { uid: 'staff', published: true, name: 'ทดสอบ', position: 'dev', accent: 'blue', updatedAt: serverTimestamp() };
await t('staff creates own card', () => assertSucceeds(setDoc(doc(staff, 'cards/somchai'), card)));
await t('anyone opens a published card', () => assertSucceeds(getDoc(doc(anon, 'cards/somchai'))));
await t('nobody can list cards (anon)', () => assertFails(getDocs(collection(anon, 'cards'))));
await t('staff cannot list cards', () => assertFails(getDocs(collection(staff, 'cards'))));
await t('admin lists cards', () => assertSucceeds(getDocs(collection(admin, 'cards'))));
await t('unpublished card is private to owner', async () => { await assertSucceeds(updateDoc(doc(staff, 'cards/somchai'), { published: false })); await assertFails(getDoc(doc(anon, 'cards/somchai'))); await assertSucceeds(getDoc(doc(staff, 'cards/somchai'))); });
await t('staff cannot create a card for someone else', () => assertFails(setDoc(doc(staff, 'cards/other-one'), { ...card, uid: 'staff2' })));
await t('staff cannot take over a card', () => assertFails(updateDoc(doc(staff2, 'cards/somchai'), { name: 'x' })));
await t('bad link name is refused', () => assertFails(setDoc(doc(staff, 'cards/A'), card)));
await t('unknown field is refused', () => assertFails(setDoc(doc(staff, 'cards/extra-one'), { ...card, role: 'admin' })));
await t('oversized field is refused', () => assertFails(setDoc(doc(staff, 'cards/big-one'), { ...card, tagline: 'x'.repeat(300) })));
await t('anon cannot write a card', () => assertFails(setDoc(doc(anon, 'cards/anon-one'), card)));
await t('admin can unpublish anyone', () => assertSucceeds(updateDoc(doc(admin, 'cards/somchai'), { published: false })));

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
