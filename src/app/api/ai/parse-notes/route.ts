import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseAgentNotes } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notes } = await req.json();

    if (!notes || typeof notes !== "string") {
      return NextResponse.json({ error: "Notes text is required." }, { status: 400 });
    }

    if (notes.length > 5000) {
      return NextResponse.json({ error: "Notes exceed maximum length of 5000 characters." }, { status: 400 });
    }

    const result = await parseAgentNotes(notes);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI parse-notes error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse notes." }, { status: 500 });
  }
}
