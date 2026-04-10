// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6H2iwP7VKaFX5rOzOGJDFBY6ayR1mpTc",
  authDomain: "kitten-code.firebaseapp.com",
  projectId: "kitten-code",
  storageBucket: "kitten-code.firebasestorage.app",
  messagingSenderId: "309423062731",
  appId: "1:309423062731:web:19a94778a32f87a8f3654e",
  measurementId: "G-E8PT06SNB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);