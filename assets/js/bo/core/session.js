// Shared helpers for back-office pages: signed-in user, escaping, dates, toast.
import { db, auth, onAuthStateChanged, doc, getDoc } from './firebase-config.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const thDate = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export function displayName(u, email) {
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return full || u.username || (email || '').split('@')[0] || 'ไม่ระบุชื่อ';
}

/** Resolves with { uid, name, isAdmin } or redirects to login. */
export function requireUser() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) { window.location.replace('login.html'); return; }
            let u = {};
            try { const s = await getDoc(doc(db, 'users', user.uid)); u = s.exists() ? s.data() : {}; } catch (e) { console.warn(e); }
            resolve({ uid: user.uid, name: displayName(u, user.email), isAdmin: u.role === 'admin' });
        });
    });
}

let toastTimer;
export function toast(msg, ok = true) {
    let t = document.getElementById('kc-toast');
    if (!t) { t = document.createElement('div'); t.id = 'kc-toast'; t.className = 'kc-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.toggle('error', !ok);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

export const openModal = (id) => document.getElementById(id).classList.add('open');
export const closeModal = (id) => document.getElementById(id).classList.remove('open');
