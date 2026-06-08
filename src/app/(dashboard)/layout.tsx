"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  UploadCloud,
  Download,
  Settings,
  ShieldCheck,
  LogOut,
  Cpu,
  Sliders,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { ThemeToggle } from "@/components/sira/ThemeToggle";
import { getDictionary, stripLocaleFromPath, withLocale } from "@/lib/i18n";

interface SidebarLink {
  href: string;
  labelKey: keyof ReturnType<typeof getDictionary>["nav"];
  icon: React.ComponentType<any>;
}

const mainLinks: SidebarLink[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/candidates", labelKey: "candidates", icon: Users },
  { href: "/candidates/kanban", labelKey: "kanban", icon: KanbanSquare },
  { href: "/import", labelKey: "import", icon: UploadCloud },
  { href: "/export", labelKey: "export", icon: Download },
  { href: "/automation", labelKey: "automation", icon: Cpu },
];

const settingsLinks: SidebarLink[] = [
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/settings/custom-fields", labelKey: "customFields", icon: Sliders },
  { href: "/settings/credentials", labelKey: "credentials", icon: ShieldCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const { data: session } = useSession();
  const [agencyName, setAgencyName] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch agency profile from the session or profile
  useEffect(() => {
    async function loadAgencyProfile() {
      try {
        const res = await fetch("/api/agency/profile");
        if (res.ok) {
          const data = await res.json();
          setAgencyName(data.name || "");
          setLogoUrl(data.logoUrl || null);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (session?.user) {
      loadAgencyProfile();
    }
  }, [session]);

  const isActive = (href: string) => {
    const normalizedPathname = stripLocaleFromPath(pathname ?? "/");
    if (href === "/dashboard") return normalizedPathname === href;
    return normalizedPathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-[#5e6ad2]/10 text-primary border-l-2 border-primary"
        : "text-ink-subtle hover:text-ink hover:bg-surface-2"
    }`;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-14 border-b border-hairline bg-canvas sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-ink-subtle hover:text-ink p-1"
            aria-label={t.nav.navigation}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href={withLocale("/dashboard", locale)} className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 flex items-center justify-center font-bold text-[#828fff] text-lg font-display">
              ሥ
            </span>
            <span className="font-bold text-sm tracking-widest text-ink font-display">SIRA</span>
            <span className="text-[10px] font-semibold bg-surface-2 border border-hairline text-ink-tertiary px-1.5 py-0.5 rounded uppercase">
              {t.brand.pro}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden border border-hairline bg-surface-2 flex-shrink-0 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={agencyName || "Agency"}
                  className="max-w-[90%] max-h-[90%] object-contain"
                />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-surface-3 border border-hairline flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="hidden md:inline text-xs text-ink-muted font-medium max-w-[160px] truncate" title={agencyName}>
              {agencyName || t.nav.admin}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: withLocale("/login", locale) })}
            className="p-1.5 rounded-md hover:bg-surface-2 border border-hairline text-ink-tertiary hover:text-error transition"
            title={t.nav.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <aside className="hidden lg:flex w-60 border-r border-hairline flex-col justify-between p-4 bg-canvas h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
          <div className="space-y-6">
            <NavigationGroup title={t.nav.mainMenu} links={mainLinks} locale={locale} linkClass={linkClass} labels={t.nav} />
            <NavigationGroup title={t.nav.administration} links={settingsLinks} locale={locale} linkClass={linkClass} labels={t.nav} />
          </div>

          <div className="pt-4 border-t border-hairline text-center">
            <span className="text-[10px] text-ink-tertiary font-mono">{t.brand.ready}</span>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 lg:hidden flex">
            <div className="fixed inset-0 bg-[#000000]/60" onClick={() => setMobileOpen(false)} />

            <aside className="relative flex flex-col w-64 bg-surface-1 border-r border-hairline p-4 h-full z-40 justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-hairline">
                  <span className="font-bold text-sm tracking-widest">{t.nav.navigation}</span>
                  <button onClick={() => setMobileOpen(false)} className="text-ink-tertiary hover:text-ink">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <NavigationGroup
                  title={t.nav.mainMenu}
                  links={mainLinks}
                  locale={locale}
                  linkClass={linkClass}
                  labels={t.nav}
                  onClick={() => setMobileOpen(false)}
                />
                <NavigationGroup
                  title={t.nav.administration}
                  links={settingsLinks}
                  locale={locale}
                  linkClass={linkClass}
                  labels={t.nav}
                  onClick={() => setMobileOpen(false)}
                />
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-canvas overflow-x-hidden min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavigationGroup({
  title,
  links,
  locale,
  linkClass,
  labels,
  onClick,
}: {
  title: string;
  links: SidebarLink[];
  locale: Parameters<typeof withLocale>[1];
  linkClass: (href: string) => string;
  labels: ReturnType<typeof getDictionary>["nav"];
  onClick?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold tracking-wider text-ink-tertiary uppercase px-3">
        {title}
      </span>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={withLocale(link.href, locale)}
            className={linkClass(link.href)}
            onClick={onClick}
          >
            <link.icon className="w-4 h-4" />
            {labels[link.labelKey]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
