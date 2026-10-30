import { connection, NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET(request: NextRequest) {
  await connection();
  try {
    if (!await isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }
    const snapshot = await getAdminFirestore()
      .collection("prizeLogs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return NextResponse.json(
      snapshot.docs.map((document) => {
        const data = document.data() ?? {};
        return {
          id: document.id,
          ...data,
          createdAt:
            data.createdAt?.toDate?.().toISOString() ??
            new Date().toISOString(),
        };
      }),
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/staff/logs error:", error);
    return NextResponse.json([], { status: 200, headers: NO_STORE_HEADERS });
  }
}
