import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "code-request") {
      // Handle registration code request
      const { name, email, phone, agencyName, notes } = body;

      if (!name || !email || !agencyName) {
        return NextResponse.json({ error: "Name, email, and agency name are required." }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpFrom = process.env.SMTP_FROM;

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return NextResponse.json(
          { error: "Email service is not configured. Please contact support directly." },
          { status: 503 }
        );
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPassword },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: smtpFrom || `"SIRA Registration" <${smtpUser}>`,
        to: smtpUser,
        replyTo: email,
        subject: `🔑 Registration Code Request from ${agencyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5e6ad2;">🔑 New Registration Code Request</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 120px;">Agency</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${agencyName}</td></tr>
              <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Contact Name</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${name}</td></tr>
              <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Phone</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${phone}</td></tr>` : ""}
              ${notes ? `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Notes</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${notes}</td></tr>` : ""}
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">
                To generate a registration code for this agency, visit the admin panel:
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/codes"
                 style="display: inline-block; padding: 10px 20px; background: #5e6ad2; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                ➜ Generate Registration Code
              </a>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              After generating the code, reply to this email or send it directly to the agency contact.
              The code will be valid for 1 year by default.
            </p>
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    }

    // Handle general contact form inquiry
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support directly." },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: smtpFrom || `"SIRA Contact Form" <${smtpUser}>`,
      to: smtpUser,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong></p>
             <p>${message.replace(/\n/g, "<br>")}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
  }
}
