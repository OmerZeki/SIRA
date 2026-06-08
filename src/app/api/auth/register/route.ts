import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { agencyName, email, password, licenseNumber, registrationCode } = await req.json();

    if (!agencyName || !email || !password) {
      return NextResponse.json({ error: "Agency name, email, and password are required." }, { status: 400 });
    }

    // Validate registration code (non-optional)
    if (!registrationCode) {
      return NextResponse.json({ error: "Registration code is required." }, { status: 400 });
    }

    const trimmedCode = registrationCode.trim().toUpperCase();
    const codeRecord = await prisma.registrationCode.findUnique({
      where: { code: trimmedCode },
    });

    if (!codeRecord) {
      return NextResponse.json({ error: "Invalid registration code." }, { status: 400 });
    }

    if (!codeRecord.isActive) {
      return NextResponse.json({ error: "This registration code is no longer active." }, { status: 400 });
    }

    if (codeRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "This registration code has expired." }, { status: 400 });
    }

    if (codeRecord.usedAt) {
      return NextResponse.json({ error: "This registration code has already been used." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const agency = await prisma.agency.create({
      data: {
        name: agencyName,
        email,
        licenseNumber: licenseNumber || null,
        registrationCodeId: codeRecord.id,
        users: {
          create: {
            email,
            name: agencyName,
            passwordHash,
            role: "OWNER",
          },
        },
      },
    });

    // Mark the registration code as used
    await prisma.registrationCode.update({
      where: { id: codeRecord.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ success: true, agencyId: agency.id }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
