import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encrypt";
import { buildPortalCredentialsResponse, readPortalCredentialRecord } from "@/lib/portal-credentials";
import { portalVaultDefinitions } from "@/lib/portal-vault";

function buildCreds(
  agency: any,
  field: string,
  data: Record<string, any>,
  usernameKey: string,
  passwordKey: string
) {
  const existing = readPortalCredentialRecord((agency as any)?.[field]);
  return {
    username: data[usernameKey] !== undefined ? data[usernameKey] : existing.username,
    password: data[passwordKey] ? data[passwordKey] : existing.password,
  };
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
      select: {
        lmisCredentials: true,
        musanedSroCredentials: true,
        easyEnjazCredentials: true,
        mofaCredentials: true,
        wafidCredentials: true,
        tasheerCredentials: true,
      },
    });

    return NextResponse.json(buildPortalCredentialsResponse(agency));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
      select: {
        lmisCredentials: true,
        musanedSroCredentials: true,
        easyEnjazCredentials: true,
        mofaCredentials: true,
        wafidCredentials: true,
        tasheerCredentials: true,
      },
    });

    const updateData = Object.fromEntries(
      portalVaultDefinitions.map((definition) => {
        const creds = buildCreds(
          agency,
          definition.agencyField,
          data,
          `${definition.formKey}Username`,
          `${definition.formKey}Password`
        );

        return [definition.agencyField, encrypt(JSON.stringify(creds))];
      })
    );

    await prisma.agency.update({
      where: { id: session.user.agencyId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
