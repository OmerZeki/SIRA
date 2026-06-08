import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        session: null,
        message: "No session found"
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          role: session.user?.role,
          agencyId: session.user?.agencyId,
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
