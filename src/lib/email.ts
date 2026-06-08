import nodemailer from "nodemailer";

// Lazy-init transport — reads env at first usage
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP credentials missing. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in your environment variables."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/2525
    auth: { user, pass },
    from: from || user,
  });
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

/**
 * Send an email via the configured SMTP relay.
 */
export async function sendEmail(options: SendEmailOptions) {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
  return info;
}

/**
 * Convenience: Send an agency notification about an automation job status.
 */
export async function sendAutomationNotification(
  agencyEmail: string,
  candidateName: string,
  platform: "LMIS" | "Musaned",
  status: "completed" | "failed",
  detail?: string
) {
  const subject = `SIRA Automation — ${platform} ${status.toUpperCase()} for ${candidateName}`;
  const html = `<p>Hello,</p>
<p>The ${platform} automation for <strong>${candidateName}</strong> has <strong>${status}</strong>.</p>
${detail ? `<p>Detail: ${detail}</p>` : ""}
<p>You can view the candidate in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/candidates">SIRA dashboard</a>.</p>`;

  return sendEmail({
    to: agencyEmail,
    subject,
    html,
    text: `Automation ${status} for ${candidateName} on ${platform}. ${detail || ""}`,
  });
}
