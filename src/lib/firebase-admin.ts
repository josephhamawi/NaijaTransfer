import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let _app: App | null = null;
let _firestore: Firestore | null = null;
let _storage: Storage | null = null;

function ensureInitialized(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  let sa: ServiceAccount;

  if (saJson) {
    try {
      sa = JSON.parse(saJson) as ServiceAccount;
    } catch {
      sa = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "naijatransfer",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      };
    }
  } else {
    sa = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "naijatransfer",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };
  }

  if (sa.clientEmail) {
    _app = initializeApp({
      credential: cert(sa),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "naijatransfer.firebasestorage.app",
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
