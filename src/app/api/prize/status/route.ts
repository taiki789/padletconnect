import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "画像ファイルが送信されていません。" },
        { status: 400 }
      );
    }

    // 画像のバッファデータ取得（保存はせず、判定処理などがある場合はここで使用）
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- ここにAI検証や画像チェックロジックがあれば挟む ---
    // 保存は行わず、チェック成功とみなしてレスポンスを返す
    console.log(`Received file: ${file.name}, size: ${buffer.length} bytes`);

    return NextResponse.json({
      success: true,
      message: "投稿が確認できました！",
    });
  } catch (error) {
    console.error("Screenshot upload error:", error);
    return NextResponse.json(
      { success: false, message: "画像の処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
