// src/firebase/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore (Required for Veritas Ledger)
const db = getFirestore(app);

// 3. Conditional Analytics (Prevents crash in Node/CLI environment)
let analytics = null;

// Only initialize analytics if we are in a browser environment
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Silently fail analytics if unsupported (common in private browsing/Node)
  });
}

export { app, db, analytics };
