import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parsePassportOcr } from "@/lib/ocr";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parsePassportOcr(buffer);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OCR route error:", error);
    return NextResponse.json({ error: error.message || "OCR processing failed" }, { status: 500 });
  }
}
