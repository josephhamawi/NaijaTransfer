import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let _app: App | null = null;
let _firestore: Firestore | null = null;
let _storage: Storage | null = null;

export function ensureInitialized(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  let sa: ServiceAccount | null = null;

  // Method 1: FIREBASE_SERVICE_ACCOUNT env var (JSON string)
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    try { sa = JSON.parse(saJson) as ServiceAccount; } catch { /* fall through */ }
  }

  // Method 2: GOOGLE_APPLICATION_CREDENTIALS file (Firebase Admin auto-discovers this)
  if (!sa && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const fs = require("fs");
      const content = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8");
      sa = JSON.parse(content) as ServiceAccount;
    } catch { /* fall through */ }
  }

  // Method 3: Individual env vars
  if (!sa) {
    sa = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "naijatransfer",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };
  }

  if (sa.clientEmail) {
    _app = initializeApp({
      credential: cert(sa),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "naijatransfer.firebasestorage.app",
    });
  } else {
    _app = initializeApp({ projectId: "naijatransfer" });
  }
  return _app;
}

// Lazy getters — only initialize when actually called at runtime
export function getDb(): Firestore {
  if (!_firestore) {
    ensureInitialized();
    _firestore = getFirestore();
  }
  return _firestore;
}

export function getStorageBucket(): Storage {
  if (!_storage) {
    ensureInitialized();
    _storage = getStorage();
  }
  return _storage;
}

// Helper to get collection references
export function collection(name: string) {
  return getDb().collection(name);
}
