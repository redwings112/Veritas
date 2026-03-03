import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  getFirestore, updateDoc, onSnapshot, collection, 
  query, where, getDocs, orderBy 
} from "firebase/firestore";
import { 
  LogOut, CheckCircle, AlertTriangle, Clock, 
  Archive, XCircle, Zap 
} from "lucide-react";
import "./App.css";

// --- UPDATED ENV CONFIGURATION ---
const appId = import.meta.env.VITE_VERITAS_APP_ID || "default-app-id";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Path matching your CLI output
const DEEP_PATH = "artifacts/veritas-dashboard/public/data/veritas_builds/veritas_builds/veritas_builds";

const MOCK_BUILDS = [
  {
    id: "mock-1",
    buildId: "v2.1.0-gold-prod",
    timestamp: Date.now() - 86400000,
    status: "ACTIVE",
    sourceCommit: "5e0f1d9a2c"
  }
];

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE": return "status-active";
    case "HEARTBEAT": return "status-active";
    case "PENDING": return "status-pending";
    case "FAIL": return "status-fail";
    default: return "status-default";
  }
};

const getStatusIcon = (status) => {
  const size = 16;
  switch (status?.toUpperCase()) {
    case "ACTIVE": return <CheckCircle size={size} />;
    case "HEARTBEAT": return <Zap size={size} />;
    case "FAIL": return <XCircle size={size} />;
    default: return <Clock size={size} />;
  }
};

const App = () => {
  const [builds, setBuilds] = useState([]);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);

  // 1. Initialize Firebase from .env
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      console.warn("⚠️ [VERITAS]: No API Key found in .env");
      setBuilds(MOCK_BUILDS);
      setIsMockData(true);
      setLoading(false);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const auth = getAuth(app);

      setDb(firestore);

      signInAnonymously(auth).catch(err => console.error("Auth failed", err));
      
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setUserId(user ? user.uid : "temp-user");
      });

      return () => unsubscribeAuth();
    } catch (error) {
      console.error("Firebase Init error:", error);
      setIsMockData(true);
      setLoading(false);
    }
  }, []);

  // 2. Real-time Subscription with appId filtering
  useEffect(() => {
    if (!db || !userId) return;

    const veritasRef = collection(db, DEEP_PATH);
    const q = query(
      veritasRef, 
      where("appId", "==", appId),
      orderBy("timestamp", "desc")
    );

    const unsubscribeSnapshot = onSnapshot(q, 
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toMillis ? doc.data().timestamp.toMillis() : Date.now()
        }));
        setBuilds(fetched);
        setIsMockData(false);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setBuilds(MOCK_BUILDS);
        setIsMockData(true);
        setLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [db, userId]);

  const CurrentActiveBuild = builds.find((b) => b.status === "ACTIVE" || b.status === "HEARTBEAT");

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>SYNCING_GRID...</p></div>;

  return (
    <div className="app-container">
      <header className="header">
        <h1><Zap className="icon" /> VERITAS_MISSION_CONTROL</h1>
        <div className="user-info">
          UPLINK: <span className="user-id">{appId}</span>
        </div>
      </header>

      {isMockData && (
        <div className="warning">
          <AlertTriangle className="icon" /> MOCK_DATA_ACTIVE // CHECK_.ENV
        </div>
      )}

      <section className="current-build">
        <h2>Active Sector Status</h2>
        {CurrentActiveBuild ? (
          <div className="build-details">
            <p><strong>ID:</strong> {CurrentActiveBuild.buildId}</p>
            <p><strong>Status:</strong> {CurrentActiveBuild.status}</p>
            <p><strong>Last Pulse:</strong> {new Date(CurrentActiveBuild.timestamp).toLocaleString()}</p>
          </div>
        ) : (
          <p>NO ACTIVE BUILD DETECTED IN SECTOR.</p>
        )}
      </section>

      <section className="build-table">
        <h2>Build Ledger</h2>
        <table>
          <thead>
            <tr>
              <th>Build ID</th>
              <th>Status</th>
              <th>Time</th>
              <th>Logs</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build) => (
              <tr key={build.id}>
                <td className="mono">{build.buildId}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(build.status)}`}>
                    {getStatusIcon(build.status)} {build.status}
                  </span>
                </td>
                <td>{new Date(build.timestamp).toLocaleTimeString()}</td>
                <td className="text-dim italic">{build.notes || "---"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="footer">
        PROTOCOL: v2.6 // APP_ID: {appId} // STATUS: {isMockData ? 'OFFLINE' : 'LIVE'}
      </footer>
    </div>
  );
};

export default App;