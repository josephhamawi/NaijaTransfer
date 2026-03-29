import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getServiceAccount(): ServiceAccount {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) {
    try { return JSON.parse(sa) as ServiceAccount; } catch { /* fall through */ }
  }
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "naijatransfer",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
}

// Initialize Firebase Admin (singleton, safe at build time)
try {
  if (getApps().length === 0) {
    const sa = getServiceAccount();
    if (sa.clientEmail) {
      initializeApp({
        credential: cert(sa),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "naijatransfer.firebasestorage.app",
      });
    } else {
      initializeApp({ projectId: "naijatransfer" });
    }
  }
} catch {
  // Build time — no credentials available, that's OK
}

export const firestore = getFirestore();
export const storage = getStorage();

export const collections = {
  users: firestore.collection("users"),
  transfers: firestore.collection("transfers"),
  fileRequests: firestore.collection("fileRequests"),
  payments: firestore.collection("payments"),
  apiKeys: firestore.collection("apiKeys"),
  wallpapers: firestore.collection("wallpapers"),
  webhookEvents: firestore.collection("webhookEvents"),
} as const;
