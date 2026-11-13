import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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

// ─── Firestore (client) ──────────────────────────────────────────────
//
// Used by Live Send for signalling only: SDP offers/answers and ICE
// candidates. Firestore rules deny everything else, so this handle
// cannot read transfers, users or payments from the browser.

let firestore: Firestore | null = null;

export function getClientDb(): Firestore {
  if (!firestore) firestore = getFirestore(app);
  return firestore;
}

// ─── Anonymous auth ──────────────────────────────────────────────────

/**
 * Make sure this browser has *some* Firebase identity.
 *
 * Live Send needs a uid on both ends so Firestore rules can restrict a
 * room's signalling documents to its two participants. A recipient
 * should not have to create an account to receive a file, and a free
 * sender should not have to either — anonymous auth gives both a real,
 * stable uid without a sign-up.
 *
 * Returns the existing user untouched when one is already signed in, so
 * calling this never downgrades a signed-in sender to anonymous.
 */
export async function ensureSignedIn(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export function isAnonymous(): boolean {
  return auth.currentUser?.isAnonymous ?? false;
}

// ─── App Check (optional) ────────────────────────────────────────────

/**
 * Initialise App Check when a reCAPTCHA site key is configured.
 *
 * No key means no App Check, and the app runs exactly as before — the
 * server treats a missing token as soft-failure unless
 * FIREBASE_APPCHECK_ENFORCE is on. This keeps the feature deployable
 * before the Firebase console side is set up.
 */
let appCheckInstance: import("firebase/app-check").AppCheck | null = null;
let appCheckStarted = false;

export async function ensureAppCheck(): Promise<void> {
  if (appCheckStarted) return;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (!siteKey || typeof window === "undefined") return;
  appCheckStarted = true;
  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
    appCheckInstance = initializeAppCheck(app as FirebaseApp, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Never let attestation setup break the page it is protecting.
  }
}

/**
 * Headers for an authenticated Live Send API call: the ID token plus an
 * App Check token when available.
 */
export async function liveAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = await getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY) {
    try {
      await ensureAppCheck();
      if (appCheckInstance) {
        const { getToken } = await import("firebase/app-check");
        const result = await getToken(appCheckInstance, false);
        if (result?.token) headers["X-Firebase-AppCheck"] = result.token;
      }
    } catch {
      // Soft-fail: the server decides whether a missing token blocks.
    }
  }
  return headers;
}

export { auth };
export type { User };
