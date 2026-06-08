import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CODE_PREFIX = "SIRA-";
const CODE_LENGTH = 12; // Total characters after prefix

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,O,0,1 to avoid confusion
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[crypto.randomInt(chars.length)];
  }
  return `${CODE_PREFIX}${code}`;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only agency owners can manage registration codes." }, { status: 403 });
    }

    const url = new URL(req.url);
    const includeExpired = url.searchParams.get("includeExpired") === "true";

    const where: any = {};
    if (!includeExpired) {
      where.expiresAt = { gte: new Date() };
    }

    const codes = await prisma.registrationCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            email: true,
            licenseNumber: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(codes);
  } catch (error: any) {
    console.error("Error listing registration codes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only agency owners can manage registration codes." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const description = body.description || "";
    const validityDays = body.validityDays || 365; // 1 year by default

    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const registrationCode = await prisma.registrationCode.create({
      data: {
        code,
        description,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json(registrationCode, { status: 201 });
  } catch (error: any) {
    console.error("Error generating registration code:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
