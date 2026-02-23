import { NextResponse } from "next/server";
import { extractText } from "unpdf";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json({ success: false, error: "Failed to parse PDF" }, { status: 500 });
  }
}