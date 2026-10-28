import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST() {
  const reference = getAdminFirestore().collection("participations").doc();
  await reference.set({ score: 0, screenshotVerified: false, redeemed: false, createdAt: new Date() });
  return NextResponse.json({ participationId: reference.id });
}
