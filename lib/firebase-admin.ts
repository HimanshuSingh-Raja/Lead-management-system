import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
function adminApp() { if (getApps().length) return getApps()[0]; const projectId = process.env.FIREBASE_PROJECT_ID; const clientEmail = process.env.FIREBASE_CLIENT_EMAIL; const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"); if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin credentials are not configured."); return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }); }
export const adminDb = () => getFirestore(adminApp());
