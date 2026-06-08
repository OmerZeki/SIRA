import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, slot } = await req.json();
    if (!url || !slot) {
      return NextResponse.json({ error: "URL and slot are required" }, { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "REMOVE_BG_API_KEY is not configured." }, { status: 503 });
    }

    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      throw new Error("Could not fetch original image");
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const formData = new FormData();
    formData.append("image_file", new Blob([new Uint8Array(imageBuffer)]), "passport_photo.jpg");
    formData.append("size", "auto");

    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      throw new Error(`Remove.bg API error: ${removeBgResponse.status}`);
    }

    const processedBuffer = Buffer.from(await removeBgResponse.arrayBuffer());
    const storagePath = `${session.user.agencyId}/uploads/${slot}_nobg_${Date.now()}.png`;
    const processedUrl = await uploadFile(processedBuffer, storagePath, "image/png");

    return NextResponse.json({ url: processedUrl });
  } catch (error: any) {
    console.error("Remove BG error:", error);
    return NextResponse.json({ error: error.message || "Background removal failed" }, { status: 500 });
  }
}
