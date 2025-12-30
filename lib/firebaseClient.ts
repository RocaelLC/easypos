import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// --- internals ---
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseAppClient(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client called on server");
  }
  if (_app) return _app;

  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function getAuthClient(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Auth client called on server");
  }
  if (_auth) return _auth;

  const app = getFirebaseAppClient();
  _auth = getAuth(app);
  return _auth;
}

/**
 * ✅ Compatibilidad: muchos archivos hacen `import { auth } from "@/lib/firebaseClient"`
 * Este proxy evita que truene en build/SSR, pero SOLO funciona en cliente.
 */
export const auth = new Proxy(
  {},
  {
    get(_target, prop) {
      const a = getAuthClient();
      // @ts-ignore
      return a[prop];
    },
  }
) as Auth;
