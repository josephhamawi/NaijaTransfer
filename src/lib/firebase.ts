import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Auth functions ---

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserToBackend(result.user);
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToBackend(result.user);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await syncUserToBackend(result.user);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// Sync Firebase user to our PostgreSQL database
async function syncUserToBackend(user: User) {
  try {
    const token = await user.getIdToken();
    await fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        image: user.photoURL,
      }),
    });
  } catch (error) {
    console.error("Failed to sync user:", error);
  }
}

export { auth };
export type { User };
