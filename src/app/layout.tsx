import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { DEFAULT_LOCALE, getLocaleDirection, isLocale } from "@/lib/i18n";
import { PWARegister } from "@/components/sira/PWARegister";
import { SessionProvider } from "@/components/sira/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIRA — ሥራ | Autonomous Ethiopian Overseas Recruitment",
  description:
    "Autonomous Ethiopian Overseas Recruitment. SIRA automates passport OCR, Kanban pipeline, LMIS and Saudi portal workflows — from passport to placement in seconds.",
  keywords: "Ethiopian recruitment, SIRA, LMIS, Musaned, passport OCR, domestic worker placement",
  applicationName: "SIRA",
  authors: [{ name: "SIRA Platform" }],
  metadataBase: new URL("https://sira-platform.com"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg?v=3", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.png?v=3",
  },
  openGraph: {
    title: "SIRA — ሥራ",
    description: "Autonomous Ethiopian Overseas Recruitment.",
    type: "website",
    siteName: "SIRA",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIRA — ሥራ",
    description: "Autonomous Ethiopian Overseas Recruitment.",
  },
};

export const viewport: Viewport = {
  themeColor: "#5e6ad2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={getLocaleDirection(locale)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = window.localStorage.getItem('SIRA_THEME');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.className = theme;
                  } else {
                    document.documentElement.className = 'dark';
                  }
                } catch(e) {
                  document.documentElement.className = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-body antialiased bg-canvas text-ink`}
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        <SessionProvider>
          <PWARegister />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
