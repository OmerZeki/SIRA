import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Registration code is required." }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    // Find the registration code
    const registrationCode = await prisma.registrationCode.findUnique({
      where: { code: trimmedCode },
    });

    if (!registrationCode) {
      return NextResponse.json({ valid: false, error: "Invalid registration code." });
    }

    if (!registrationCode.isActive) {
      return NextResponse.json({ valid: false, error: "This registration code is no longer active." });
    }

    if (registrationCode.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "This registration code has expired." });
    }

    if (registrationCode.usedAt) {
      return NextResponse.json({ valid: false, error: "This registration code has already been used." });
    }

    return NextResponse.json({ valid: true, id: registrationCode.id });
  } catch (error: any) {
    console.error("Validate code error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
