// src/firebase/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCH4hJJAxKQK7YySPuCNvh1lrP6RZP6Q9s",
  authDomain: "veritas-4175d.firebaseapp.com",
  projectId: "veritas-4175d",
  storageBucket: "veritas-4175d.firebasestorage.app",
  messagingSenderId: "5305827017",
  appId: "1:5305827017:web:7c798f4123a9c00061d718",
  measurementId: "G-MW2NQ1K51H"
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