import { connection, NextRequest, NextResponse } from "next/server";
import { getAdminApp, getAdminFirestore } from "@/lib/firebase-admin";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET(_request: NextRequest) {
  await connection();
  try {
    const app = getAdminApp();

    if (app.options.projectId === "placeholder-build") {
      return NextResponse.json(
        {
          currentStock: 0,
          isAccepting: false,
          stock3: 0,
          stock2: 0,
          stock1: 0,
          mission2Reached: 0,
          mission2Completed: 0,
          dropoffRate: 0,
          isSimpleMission2: false,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const db = getAdminFirestore();
    const snapshot = await db.doc("prize/config").get();
    const prize = snapshot.data();

    const mission2Reached = Number(prize?.mission2Reached ?? 0);
    const mission2Completed = Number(prize?.mission2Completed ?? 0);
    const dropoffCount = Math.max(0, mission2Reached - mission2Completed);
    const dropoffRate =
      mission2Reached > 0
        ? Math.round((dropoffCount / mission2Reached) * 100)
        : 0;
    const isSimpleMission2 = mission2Reached > 0 && dropoffRate >= 40;

    return NextResponse.json(
      {
        currentStock: prize?.currentStock ?? 0,
        isAccepting: prize?.isAccepting ?? false,
        stock3: prize?.stock3 ?? 0,
        stock2: prize?.stock2 ?? 0,
        stock1: prize?.stock1 ?? 0,
        mission2Reached,
        mission2Completed,
        dropoffRate,
        isSimpleMission2,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Failed to fetch prize config:", error);
    return NextResponse.json(
      {
        currentStock: 0,
        isAccepting: false,
        stock3: 0,
        stock2: 0,
        stock1: 0,
        mission2Reached: 0,
        mission2Completed: 0,
        dropoffRate: 0,
        isSimpleMission2: false,
        error: "Internal Server Error",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
