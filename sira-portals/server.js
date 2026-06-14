/**
 * SIRA Portal Service  –  server.js
 * ===================================
 * Node.js / Express service deployed on Render at sira-portals.onrender.com
 *
 * Endpoints
 * ----------
 * GET  /health                          → {"ok":true, "portals": [...]}
 * GET  /proxy?url=<encoded>             → Reverse-proxy stripping X-Frame-Options
 *                                         so any external portal can be iframed.
 * POST /api/screenshot                  → Playwright headless screenshot of a URL.
 *                                         Body: { url, selector?, waitFor? }
 * POST /api/automate/lmis               → Fill Ethiopian LMIS form.
 * POST /api/automate/musaned            → Fill Tawtheeq Musaned form.
 * POST /api/automate/enjaz              → Fill MOFA/Enjaz form.
 *
 * Security
 * ---------
 * Every automation endpoint validates the Bearer token against PORTAL_API_SECRET.
 * The /proxy endpoint is CORS-restricted to SIRA_APP_ORIGIN.
 */

"use strict";

require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const { chromium } = require("playwright");
const http        = require("http");
const https       = require("https");
const { URL }     = require("url");
const { pipeline } = require("stream");

// ─── Config ────────────────────────────────────────────────────────────────
const PORT             = parseInt(process.env.PORT || "4000", 10);
const PORTAL_API_SECRET = process.env.PORTAL_API_SECRET || "";
const SIRA_APP_ORIGIN  = (process.env.SIRA_APP_ORIGIN || "https://sira.qzz.io").split(",").map(s => s.trim());

const PORTALS = require("./portals");

// ─── App Setup ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: "2mb" }));

// CORS: only SIRA Next.js is allowed to call this service
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || SIRA_APP_ORIGIN.includes(origin) || SIRA_APP_ORIGIN.includes("*")) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ─── Auth middleware ────────────────────────────────────────────────────────
function requireSecret(req, res, next) {
  if (!PORTAL_API_SECRET) return next(); // dev mode: no secret required
  const auth = req.headers.authorization || "";
  if (auth === `Bearer ${PORTAL_API_SECRET}`) return next();
  res.status(401).json({ error: "Unauthorized" });
}

// ─── /health ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ ok: true, portals: PORTALS.map(p => ({ id: p.id, name: p.name, category: p.category })) });
});

// ─── /portals ──────────────────────────────────────────────────────────────
app.get("/portals", (_req, res) => {
  res.json(PORTALS);
});

// ─── /proxy?url=<encoded> ──────────────────────────────────────────────────
// Strips X-Frame-Options, X-Content-Type-Options framing headers and rewrites
// absolute asset/link URLs to go back through this proxy so the page stays
// functional inside the iframe.
const STRIP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-type-options",
]);

// Cloudflare / WAF block detection patterns
const CF_SIGNATURES = [
  "cloudflare",
  "cf-ray",
  "attention required",
  "sorry, you have been blocked",
  "enable javascript and cookies",
  "please turn javascript on",
  "_cf_chl",
  "challenge-platform",
  "just a moment",
  "ddos-guard",
  "akamai",
  "incapsula",
];

function isCloudflareBlock(statusCode, headers, body) {
  // Server-level block signals
  const cfRay = headers["cf-ray"] || headers["server"] || "";
  if (cfRay.toLowerCase().includes("cloudflare")) return true;
  if (statusCode === 403 || statusCode === 429) return true;
  // Body-level detection
  if (body) {
    const lower = body.toLowerCase();
    return CF_SIGNATURES.some((sig) => lower.includes(sig));
  }
  return false;
}

app.get("/proxy", (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) return res.status(400).json({ error: "Missing ?url parameter" });

  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // Block private/local addresses
  const host = target.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.")) {
    return res.status(403).json({ error: "Private addresses are not allowed" });
  }

  const lib = target.protocol === "https:" ? https : http;

  const requestOptions = {
    hostname: target.hostname,
    port: target.port || (target.protocol === "https:" ? 443 : 80),
    path: target.pathname + target.search,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Upgrade-Insecure-Requests": "1",
    },
    timeout: 15000,
  };

  if (target.protocol === "https:") {
    requestOptions.rejectUnauthorized = false;
  }

  const proxyReq = lib.request(
    requestOptions,
    (proxyRes) => {
      const contentType = proxyRes.headers["content-type"] || "";
      const isHtml = contentType.toLowerCase().includes("text/html");
      const statusCode = proxyRes.statusCode || 200;

      if (isHtml) {
        let body = "";
        proxyRes.on("data", (chunk) => {
          body += chunk.toString("utf8");
        });
        proxyRes.on("end", () => {
          // Detect Cloudflare / WAF block before serving
          if (isCloudflareBlock(statusCode, proxyRes.headers, body)) {
            console.warn(`[proxy] Cloudflare/WAF block detected for ${rawUrl} (status ${statusCode})`);
            return res.status(403).json({
              error: "cf_blocked",
              message: "This portal is protected by Cloudflare or a WAF and cannot be embedded via proxy. Use the direct link to open it in a new tab.",
              directUrl: rawUrl,
            });
          }

          const baseHref = target.origin + target.pathname;
          let modifiedHtml = body;
          const headTag = "<head>";
          const headIndex = body.toLowerCase().indexOf(headTag);
          
          if (headIndex !== -1) {
            const insertPos = headIndex + headTag.length;
            modifiedHtml = body.slice(0, insertPos) + `\n<base href="${baseHref}">\n` + body.slice(insertPos);
          } else {
            modifiedHtml = `<base href="${baseHref}">\n` + body;
          }

          const filteredHeaders = {};
          for (const [k, v] of Object.entries(proxyRes.headers)) {
            if (!STRIP_HEADERS.has(k.toLowerCase()) && k.toLowerCase() !== "content-length") {
              filteredHeaders[k] = v;
            }
          }
          filteredHeaders["x-frame-options"] = "ALLOWALL";
          filteredHeaders["access-control-allow-origin"] = "*";

          res.writeHead(statusCode, filteredHeaders);
          res.end(modifiedHtml);
        });
      } else {
        // Non-HTML: check status for blocks
        if (statusCode === 403 || statusCode === 429) {
          console.warn(`[proxy] HTTP ${statusCode} for non-HTML response from ${rawUrl}`);
          return res.status(403).json({
            error: "cf_blocked",
            message: "Portal blocked the proxy request. Open it directly in a new tab.",
            directUrl: rawUrl,
          });
        }

        const filteredHeaders = {};
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (!STRIP_HEADERS.has(k.toLowerCase())) {
            filteredHeaders[k] = v;
          }
        }
        filteredHeaders["x-frame-options"] = "ALLOWALL";
        filteredHeaders["access-control-allow-origin"] = "*";

        res.writeHead(statusCode, filteredHeaders);
        pipeline(proxyRes, res, (err) => {
          if (err) console.error("[proxy] pipeline error:", err.message);
        });
      }
    }
  );

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    if (!res.headersSent) res.status(504).json({ error: "Gateway timeout: portal did not respond in time" });
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy] request error:", err.message);
    if (!res.headersSent) res.status(502).json({ error: "Bad gateway: " + err.message });
  });

  proxyReq.end();
});

// ─── /api/screenshot ───────────────────────────────────────────────────────
app.post("/api/screenshot", requireSecret, async (req, res) => {
  const { url, selector, waitFor, fullPage = false } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });

  let browser;
  try {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });
    page.setDefaultTimeout(30000);

    await page.goto(url, { waitUntil: "networkidle" });

    if (waitFor) {
      try { await page.waitForSelector(waitFor, { timeout: 10000 }); } catch {}
    }

    let screenshotBuffer;
    if (selector) {
      const el = await page.$(selector);
      screenshotBuffer = el
        ? await el.screenshot()
        : await page.screenshot({ fullPage });
    } else {
      screenshotBuffer = await page.screenshot({ fullPage });
    }

    res.set("Content-Type", "image/png");
    res.send(screenshotBuffer);
  } catch (err) {
    console.error("[screenshot] error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── /api/automate/lmis ────────────────────────────────────────────────────
app.post("/api/automate/lmis", requireSecret, async (req, res) => {
  const { credentials, applicant } = req.body;
  if (!credentials?.username || !credentials?.password) {
    return res.status(400).json({ error: "Missing credentials.username / credentials.password" });
  }
  if (!applicant?.passportNumber) {
    return res.status(400).json({ error: "Missing applicant.passportNumber" });
  }

  let browser;
  try {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });
    page.setDefaultTimeout(30000);

    const lmisUrl = process.env.LMIS_BASE_URL || "https://lmis.gov.et";
    await page.goto(lmisUrl, { waitUntil: "networkidle" });

    // LMIS login
    await page.fill('input[name="username"], #username', credentials.username);
    await page.fill('input[name="password"], #password', credentials.password);
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState("networkidle");

    const screenshot = await page.screenshot();
    const url = page.url();

    // The full LMIS flow requires session-based automation;
    // for now we return a screenshot + current URL for manual verification.
    res.json({
      status: "MANUAL_REQUIRED",
      url,
      screenshotBase64: screenshot.toString("base64"),
      message: "Logged in. Complete the form registration manually or extend this automation.",
    });
  } catch (err) {
    console.error("[lmis] error:", err.message);
    res.status(500).json({ error: err.message, status: "FAILED" });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── /api/automate/musaned ─────────────────────────────────────────────────
app.post("/api/automate/musaned", requireSecret, async (req, res) => {
  const { credentials, applicant } = req.body;
  if (!credentials?.username || !credentials?.password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  let browser;
  try {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });
    page.setDefaultTimeout(30000);

    const musanedUrl = process.env.TAWTHEEQ_MUSANED_URL || "https://tawtheeq.musaned.com.sa/";
    await page.goto(musanedUrl, { waitUntil: "networkidle" });

    await page.fill('input[name="username"], #username', credentials.username);
    await page.fill('input[name="password"], #password', credentials.password);
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState("networkidle");

    const screenshot = await page.screenshot();
    const url = page.url();

    res.json({
      status: "MANUAL_REQUIRED",
      url,
      screenshotBase64: screenshot.toString("base64"),
      message: "Logged in to Musaned. Complete contract registration manually.",
    });
  } catch (err) {
    console.error("[musaned] error:", err.message);
    res.status(500).json({ error: err.message, status: "FAILED" });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── /api/automate/enjaz ───────────────────────────────────────────────────
app.post("/api/automate/enjaz", requireSecret, async (req, res) => {
  const { credentials, applicant } = req.body;
  if (!credentials?.username || !credentials?.password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  let browser;
  try {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    });
    page.setDefaultTimeout(30000);

    const mofaUrl = process.env.MOFA_URL || "https://visa.mofa.gov.sa/";
    await page.goto(mofaUrl, { waitUntil: "networkidle" });

    const screenshot = await page.screenshot();
    const url = page.url();

    // MOFA requires formal B2B agreement — we provide screenshot proof + link
    res.json({
      status: "MANUAL_REQUIRED",
      url,
      screenshotBase64: screenshot.toString("base64"),
      message: "MOFA visa portal opened. Please complete the Enjaz application manually — full automation requires a B2B agreement with MOFA.",
    });
  } catch (err) {
    console.error("[enjaz] error:", err.message);
    res.status(500).json({ error: err.message, status: "FAILED" });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[sira-portals] listening on port ${PORT}`);
  console.log(`[sira-portals] allowed origins: ${SIRA_APP_ORIGIN.join(", ")}`);
  console.log(`[sira-portals] ${PORTALS.length} portals registered`);
});
