import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET() {
  const snapshot = await getAdminFirestore().doc("prize/config").get();
  const prize = snapshot.data();
  return NextResponse.json({ currentStock: prize?.currentStock ?? 0, isAccepting: prize?.isAccepting ?? false });
}
