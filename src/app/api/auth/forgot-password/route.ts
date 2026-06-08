import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
    }

    // Delete any existing unused tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email, usedAt: null, expiresAt: { gte: new Date() } },
    });

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail({
        to: email,
        subject: "SIRA — Password Reset Request",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f1011; border-radius: 12px; border: 1px solid #23252a;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 28px;">ሥ</span>
              <h1 style="color: #f7f8f8; font-size: 20px; font-weight: 600; margin: 8px 0 4px;">SIRA Password Reset</h1>
            </div>
            <p style="color: #d0d6e0; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              You requested a password reset for your SIRA agency account. Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #5e6ad2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            <p style="color: #8a8f98; font-size: 12px; line-height: 1.4; margin-bottom: 8px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #62666d; font-size: 11px; line-height: 1.4;">
              Or copy this link into your browser:<br/>
              <a href="${resetUrl}" style="color: #5e6ad2;">${resetUrl}</a>
            </p>
          </div>
        `,
        text: `Reset your SIRA password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Still return success to not reveal if email exists
    }

    return NextResponse.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
