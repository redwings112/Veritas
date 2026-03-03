import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { Zap, Shield, Database, LayoutGrid, ChevronDown, Activity, AlertTriangle } from 'lucide-react';

// Use the ENV variables directly or via your config file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const Veritas = () => {
  const [builds, setBuilds] = useState([]);
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('Veritas-Demo-Alpha'); 
  const [isHealing, setIsHealing] = useState(false);
  const [envError, setEnvError] = useState(false);

  // 1. Initialize Firebase with ENV Check
  useEffect(() => {
    // Basic validation to check if .env variables are leaking in correctly
    if (!firebaseConfig.apiKey) {
      console.error("❌ [CRITICAL]: .env variables not found. Ensure they start with VITE_");
      setEnvError(true);
      setLoading(false);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      setDb(getFirestore(app));
    } catch (err) {
      console.error("Firebase Init Failed:", err);
    }
  }, []);

  // 2. Real-time Subscription
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const DEEP_PATH = "artifacts/veritas-dashboard/public/data/veritas_builds/veritas_builds/veritas_builds";
    const veritasRef = collection(db, DEEP_PATH);

    const q = query(
      veritasRef, 
      where("appId", "==", selectedProject),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toMillis ? doc.data().timestamp.toMillis() : Date.now()
      }));
      setBuilds(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Subscription Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, selectedProject]);

  // 3. Autonomous Healing Logic
  useEffect(() => {
    if (builds.length > 0 && builds[0].status === 'FAIL' && !isHealing) {
      setIsHealing(true);
      setTimeout(() => setIsHealing(false), 5000);
    }
  }, [builds, isHealing]);

  const currentActive = useMemo(() => builds.find(b => b.status === 'ACTIVE' || b.status === 'HEARTBEAT'), [builds]);
  const projects = ["Veritas-Demo-Alpha", "aden-alpha-service", "sentinel-core"];

  // Render Env Error State
  if (envError) return (
    <div className="loading-screen text-red-500">
      <AlertTriangle size={48} className="mb-4" />
      <h2 className="glitch-text">ENV_UPLINK_FAILURE</h2>
      <p className="mt-2">Check your .env file for VITE_ prefixes.</p>
    </div>
  );

  if (loading) return (
    <div className="loading-screen">
      <Activity className="animate-spin text-neon-cyan" />
      <p>SYNCHRONIZING_VERITAS_GRID...</p>
    </div>
  );

  return (
    <div className="app-container">
      {isHealing && (
        <div className="healing-overlay">
          <Shield className="animate-pulse text-neon-cyan" size={48} />
          <h2 className="glitch-text">SENTINEL_RECOVERY_ACTIVE</h2>
          <p>Restoring stability to {selectedProject}...</p>
        </div>
      )}

      <header className="header">
        <div className="logo-section">
          <Zap className="text-neon-magenta" />
          <h1>VERITAS_MISSION_CONTROL</h1>
        </div>

        <div className="project-selector-wrapper">
          <LayoutGrid size={16} className="text-dim" />
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="project-dropdown"
          >
            {projects.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
          <ChevronDown size={14} className="text-dim" />
        </div>
      </header>

      <main className="dashboard-grid">
        <div className="status-card">
          <div className="card-header">
            <Database size={18} />
            <h3>ACTIVE_SECTOR: {selectedProject}</h3>
          </div>
          {currentActive ? (
            <div className="active-info">
              <span className="label">ACTIVE_SESSION</span>
              <span className="value text-neon-cyan">{currentActive.buildId}</span>
              <span className="label">UPLINK_STATUS</span>
              <span className="value text-green-400">NOMINAL</span>
            </div>
          ) : (
            <div className="status-fail text-red-500">OFFLINE // NO_DATA_DETECTED</div>
          )}
          
          <div className={`connection-status ${db ? 'text-green-500' : 'text-red-500'}`}>
             {db ? '● UPLINK_ESTABLISHED' : '○ SEARCHING_FOR_SIGNAL...'}
          </div>
        </div>

        <section className="ledger-section">
          <h3>BUILD_LEDGER</h3>
          <div className="table-container">
            <table className="veritas-table">
              <thead>
                <tr>
                  <th>BUILD_ID</th>
                  <th>STATUS</th>
                  <th>TIMESTAMP</th>
                  <th>LOGS</th>
                </tr>
              </thead>
              <tbody>
                {builds.length > 0 ? builds.map(build => (
                  <tr key={build.id}>
                    <td className="mono">{build.buildId}</td>
                    <td>
                      <span className={`badge badge-${build.status?.toLowerCase()}`}>
                        {build.status}
                      </span>
                    </td>
                    <td className="text-dim">
                      {new Date(build.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="text-xs italic text-dim">{build.notes || '---'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-4">No data available for this sector.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="footer">
        PROTOCOL: v2.6 // SECTOR: {selectedProject} // STATUS: {db ? 'ENCRYPTED' : 'UPLINKED'}
      </footer>
    </div>
  );
};

export default Veritas;