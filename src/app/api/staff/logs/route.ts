import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snapshot = await getAdminFirestore().collection("prizeLogs").orderBy("createdAt", "desc").limit(50).get();
  return NextResponse.json(snapshot.docs.map((document) => ({ id: document.id, ...document.data(), createdAt: document.data().createdAt?.toDate?.().toISOString() ?? new Date().toISOString() })));
}
