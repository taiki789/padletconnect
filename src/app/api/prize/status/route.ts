import { connection, NextRequest, NextResponse } from "next/server";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(_request: NextRequest) {
  await connection();
  try {
    const app = getAdminApp();

    if (app.options.projectId === "placeholder-build") {
      return NextResponse.json({
        currentStock: 0,
        isAccepting: false,
        stock3: 0,
        stock2: 0,
        stock1: 0,
      });
    }

    const db = getAdminFirestore();
    const snapshot = await db.doc("prize/config").get();
    const prize = snapshot.data();

    return NextResponse.json({
      currentStock: prize?.currentStock ?? 0,
      isAccepting: prize?.isAccepting ?? false,
      stock3: prize?.stock3 ?? 0,
      stock2: prize?.stock2 ?? 0,
      stock1: prize?.stock1 ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch prize config:", error);
    return NextResponse.json(
      {
        currentStock: 0,
        isAccepting: false,
        stock3: 0,
        stock2: 0,
        stock1: 0,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
