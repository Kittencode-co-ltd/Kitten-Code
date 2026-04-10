import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, onSnapshot, query, limit, limitToLast, startAfter, endBefore, orderBy, deleteDoc, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// Initialize Firebase only once
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { 
    app, 
    auth, 
    db, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    collection, 
    doc, 
    setDoc, 
    addDoc,
    getDocs, 
    onSnapshot,
    query, 
    limit, 
    limitToLast, 
    startAfter, 
    endBefore, 
    orderBy, 
    deleteDoc, 
    serverTimestamp, 
    updateDoc, 
    where 
};
