import { connection, NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  await connection();
  try {
    if (!await isAdminAuthenticated(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const snapshot = await getAdminFirestore().collection("prizeLogs").orderBy("createdAt", "desc").limit(50).get();
    return NextResponse.json(
      snapshot.docs.map((document) => {
        const data = document.data() ?? {};
        return {
          id: document.id,
          ...data,
          createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        };
      })
    );
  } catch (error) {
    console.error("GET /api/staff/logs error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
