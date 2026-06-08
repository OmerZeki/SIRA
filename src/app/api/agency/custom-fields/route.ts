import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FieldType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const defs = await prisma.customFieldDefinition.findMany({
      where: { agencyId: session.user.agencyId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const responseData = defs.map((def) => ({
      id: def.id,
      fieldKey: def.fieldKey,
      name: def.fieldKey, // alias for CustomFieldsPage
      label: def.label,
      fieldType: def.fieldType,
      type: def.fieldType === FieldType.DROPDOWN ? "select" : def.fieldType.toLowerCase(), // alias for CustomFieldsPage
      options: def.options,
      isRequired: def.isRequired,
    }));

    return NextResponse.json(responseData);
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

    const fields = await req.json();

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Config must be an array of field definitions." }, { status: 400 });
    }

    // Run in transaction: delete existing definitions and insert new ones
    const result = await prisma.$transaction(async (tx) => {
      await tx.customFieldDefinition.deleteMany({
        where: { agencyId: session.user.agencyId },
      });

      const created = [];
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        let dbType: FieldType = FieldType.TEXT;
        if (f.type === "number") dbType = FieldType.NUMBER;
        if (f.type === "select") dbType = FieldType.DROPDOWN;

        const record = await tx.customFieldDefinition.create({
          data: {
            agencyId: session.user.agencyId,
            fieldKey: f.name || `custom_${Date.now()}_${i}`,
            label: f.label,
            fieldType: dbType,
            options: f.options || [],
            sortOrder: i,
            isActive: true,
          },
        });
        created.push(record);
      }
      return created;
    });

    // Map back to response aliases
    const responseData = result.map((def) => ({
      id: def.id,
      fieldKey: def.fieldKey,
      name: def.fieldKey,
      label: def.label,
      fieldType: def.fieldType,
      type: def.fieldType === FieldType.DROPDOWN ? "select" : def.fieldType.toLowerCase(),
      options: def.options,
      isRequired: def.isRequired,
    }));

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Custom fields update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
