import fs from "fs";
import path from "path";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. ファイルパスからの読み込み (FIREBASE_SERVICE_ACCOUNT_FILE)
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (serviceAccountFile) {
    try {
      const filePath = path.isAbsolute(serviceAccountFile)
        ? serviceAccountFile
        : path.resolve(/*turbopackIgnore: true*/ process.cwd(), serviceAccountFile);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const serviceAccount = JSON.parse(fileContent);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
        return adminApp;
      }
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT_FILE の読み込み/パースに失敗:", e);
    }
  }

  // 2. JSON文字列からの読み込み (FIREBASE_SERVICE_ACCOUNT_KEY)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      return adminApp;
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT_KEY の JSON パースに失敗:", e);
    }
  }

  // 3. 個別環境変数からの読み込み
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return adminApp;
  }

  // 4. ビルド時のプリレンダリングをパスするためのフォールバック
  try {
    return initializeApp({ projectId: "placeholder-build" });
  } catch {
    return getApps()[0];
  }
}

export function getAdminFirestore(): Firestore {
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
