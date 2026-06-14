import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PORTAL_SERVICE_URL =
  process.env.PORTAL_SERVICE_URL || "https://sira-portals.onrender.com";
const PORTAL_API_SECRET = process.env.PORTAL_API_SECRET || "";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url, selector, waitFor, fullPage } = body;

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PORTAL_API_SECRET) {
      headers["Authorization"] = `Bearer ${PORTAL_API_SECRET}`;
    }

    const serviceRes = await fetch(`${PORTAL_SERVICE_URL}/api/screenshot`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url, selector, waitFor, fullPage }),
      // Playwright may take up to 30s; set a generous timeout
      signal: AbortSignal.timeout(35000),
    });

    if (!serviceRes.ok) {
      const text = await serviceRes.text();
      return NextResponse.json(
        { error: `Portal service error: ${serviceRes.status} — ${text}` },
        { status: 502 }
      );
    }

    // Stream the PNG back to the client
    const buffer = await serviceRes.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[/api/portals/screenshot] error:", err);
    return NextResponse.json(
      { error: err.message || "Screenshot failed" },
      { status: 500 }
    );
  }
}
