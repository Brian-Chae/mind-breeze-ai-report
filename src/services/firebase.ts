// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDU-Y0bZ9A8FPiBodrDv8EgwohlScaIcmU",
  authDomain: "mind-breeze-ai-report-47942.firebaseapp.com",
  projectId: "mind-breeze-ai-report-47942",
  storageBucket: "mind-breeze-ai-report-47942.firebasestorage.app",
  messagingSenderId: "359507939260",
  appId: "1:359507939260:web:cbe24c7e32276888f9e5b9",
  measurementId: "G-L646H5222B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app; 