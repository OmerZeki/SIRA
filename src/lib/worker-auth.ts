import crypto from "crypto";

/**
 * Shared authentication helpers for the SIRA worker / software-robot API.
 *
 * Two mechanisms are supported, both backed by WORKER_WEBHOOK_SECRET:
 *  - A static bearer secret header (`x-sira-worker-secret`) used by the
 *    pull-based robot to claim and fetch jobs. This is the same header the
 *    automation trigger forwards through QStash.
 *  - An HMAC-SHA256 body signature (`x-sira-worker-signature`) used when the
 *    robot reports results back (see /api/workers/webhook).
 */

function getSecret(): string {
  const secret = process.env.WORKER_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("WORKER_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Verify the static worker secret header on an incoming request.
 * Accepts either `x-sira-worker-secret` or a `Bearer <secret>` Authorization header.
 */
export function verifyWorkerSecret(req: Request): boolean {
  const secret = getSecret();
  const headerSecret = req.headers.get("x-sira-worker-secret");
  if (headerSecret && safeEqual(headerSecret, secret)) {
    return true;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return safeEqual(authHeader.slice("Bearer ".length).trim(), secret);
  }

  return false;
}

/**
 * Verify an HMAC-SHA256 signature computed over the raw request body.
 * The signature may optionally be prefixed with `sha256=`.
 */
export function verifyWorkerSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", getSecret()).update(rawBody).digest("hex");
  const normalized = signature.replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/i.test(normalized)) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(normalized, "hex"));
}
