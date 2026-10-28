import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (serviceAccountFile) {
    const serviceAccount = JSON.parse(readFileSync(resolve(process.cwd(), serviceAccountFile), "utf8"));
    return getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
  }
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin SDKの環境変数が設定されていません。");
  }
  return getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export async function createStaffCustomToken() {
  const app = getAdminApp();
  const uid = "staff-operator";
  const auth = getAuth(app);
  try {
    await auth.getUser(uid);
  } catch (error) {
    const errorCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (errorCode === "auth/user-not-found" || (error instanceof Error && error.message.includes("no user record"))) {
      await auth.createUser({ uid, disabled: false });
    } else {
      throw error;
    }
  }
  await auth.setCustomUserClaims(uid, { staff: true });
  return auth.createCustomToken(uid, { staff: true });
}
