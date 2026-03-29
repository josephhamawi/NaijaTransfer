import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getServiceAccount(): ServiceAccount {
  // In production, use FIREBASE_SERVICE_ACCOUNT env var (JSON string)
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (sa) return JSON.parse(sa) as ServiceAccount;

  // Fallback: individual env vars
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "naijatransfer",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  };
}

// Initialize Firebase Admin (singleton)
if (getApps().length === 0) {
  const sa = getServiceAccount();
  if (sa.clientEmail) {
    initializeApp({
      credential: cert(sa),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "naijatransfer.firebasestorage.app",
    });
  } else {
    // Dev mode without credentials — will fail on actual DB calls
    initializeApp({ projectId: "naijatransfer" });
  }
}

export const firestore = getFirestore();
export const storage = getStorage();

// Collection references
export const collections = {
  users: firestore.collection("users"),
  transfers: firestore.collection("transfers"),
  fileRequests: firestore.collection("fileRequests"),
  payments: firestore.collection("payments"),
  apiKeys: firestore.collection("apiKeys"),
  wallpapers: firestore.collection("wallpapers"),
  webhookEvents: firestore.collection("webhookEvents"),
} as const;
