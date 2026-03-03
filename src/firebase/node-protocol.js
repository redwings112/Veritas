import { initializeApp } from "firebase/app";
import 'dotenv/config';
// Now you can use process.env.VITE_FIREBASE_API_KEY
import { 
  getFirestore, 
  collection, 
  addDoc, 
  Timestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { firebaseConfig } from "./firebase-config.js";

// Initialize the Uplink
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// THE EXACT DEEP PATH BASE
const BASE_PATH = "artifacts/veritas-dashboard/public/data/veritas_builds/veritas_builds/veritas_builds";

/**
 * Logs a failure to the Veritas Ledger
 * @param {string} buildId - The unique ID for the current session
 * @param {string} errorLog - The raw error message from the terminal
 * @param {string} targetAppId - The specific project ID (e.g., 'aden-alpha')
 */
export async function reportFailure(buildId, errorLog, targetAppId = "default-app") {
  try {
    const buildsRef = collection(db, BASE_PATH);
    const docRef = await addDoc(buildsRef, {
      buildId: buildId,
      appId: targetAppId, // Now tracking which project sent the error
      status: "FAIL",
      timestamp: Timestamp.now(),
      notes: `SENTINEL_ERROR: ${errorLog.slice(0, 200)}`,
      sourceCommit: "DEV_HOTFIX_REQUIRED",
      deployedBy: "SENTINEL_CLI"
    });
    console.log(`✅ [LEDGER_SYNC]: Incident logged for ${targetAppId} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error("❌ [LEDGER_SYNC_ERROR]:", error.message);
    return null;
  }
}

/**
 * Sends a 'still alive' signal to the dashboard
 */
export async function sendHeartbeat(buildId, targetAppId) {
  try {
    const buildsRef = collection(db, BASE_PATH);
    await addDoc(buildsRef, {
      buildId: buildId,
      appId: targetAppId,
      status: "HEARTBEAT",
      timestamp: Timestamp.now(),
      notes: "SENTINEL_UPLINK_STABLE"
    });
  } catch (e) {
    // Silent fail for heartbeats to avoid terminal noise
  }
}

/**
 * Retrieves the most recent stable build for a specific project
 */
export async function getLatestStable(targetAppId = "default-app") {
  try {
    const buildsRef = collection(db, BASE_PATH);
    const q = query(
      buildsRef, 
      where("status", "==", "DEPRECATED"),
      where("appId", "==", targetAppId), // Filter by project
      orderBy("timestamp", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("❌ [STABLE_FETCH_ERROR]:", error.message);
    return null;
  }
}