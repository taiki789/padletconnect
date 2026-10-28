import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. JSON文字列が丸ごと環境変数にある場合
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  // 2. 個別の環境変数で設定されている場合
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin SDKの環境変数が設定されていません。");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
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
