"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/app-icon";
import { LanguageDropdown } from "@/components/language-dropdown";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "poyraz-ui/organisms";
import type { DocPage } from "@/lib/docs";
import {
  type Locale,
  getDocsHref,
  getHomeHref,
  siteCopy,
} from "@/lib/i18n";

const DOC_ICONS = [
  "mdi:file-document-outline",
  "mdi:star-four-points-outline",
  "mdi:source-branch",
  "mdi:package-variant-closed",
  "mdi:server-network",
  "mdi:cloud-outline",
  "mdi:rocket-launch-outline",
  "mdi:application-cog-outline",
  "mdi:account-key-outline",
  "mdi:clipboard-pulse-outline",
  "mdi:variable",
  "mdi:lifebuoy",
  "mdi:shield-check-outline",
] as const;

function normalizePathname(pathname: string) {
  return pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname;
}

function DocsNavLinks({
  docs,
  locale,
}: {
  docs: DocPage[];
  locale: Locale;
}) {
  const pathname = normalizePathname(usePathname());
  const copy = siteCopy[locale].docs;

  return (
    <SidebarMenu>
      {docs.map((doc) => {
        const isActive = doc.href === pathname;
        const icon =
          DOC_ICONS[doc.meta.order - 1] ?? "mdi:file-document-outline";

        return (
          <SidebarMenuItem
            key={doc.href}
            href={doc.href}
            active={isActive}
            icon={<Icon icon={icon} className="h-4.5 w-4.5" />}
            badge={doc.meta.order === 1 ? copy.startBadge : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {doc.meta.title}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SidebarInner({
  docs,
  locale,
}: {
  docs: DocPage[];
  locale: Locale;
}) {
  const pathname = usePathname();
  const copy = siteCopy[locale].docs;

  return (
    <>
      <SidebarHeader className="px-4 py-5">
        <Link href={getDocsHref(locale)} aria-label={copy.sidebarAria}>
          <Image
            src="/logo/blackLogoLong.png"
            alt="Neta"
            width={148}
            height={48}
            priority
            className="h-11 w-auto object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <DocsNavLinks docs={docs} locale={locale} />
      </SidebarContent>

      <SidebarFooter className="grid grid-cols-4 gap-2 border-t border-border p-3">
        <Link
          href={getHomeHref(locale)}
          aria-label={copy.backHome}
          title={copy.backHome}
          className="inline-flex h-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon icon="mdi:arrow-left" className="h-4 w-4" />
        </Link>
        <LanguageDropdown
          locale={locale}
          pathname={pathname}
          label={siteCopy[locale].nav.language}
          compact
          placement="top"
          align="start"
          menuWidthClassName="w-44"
        />
        <a
          href="https://github.com/poyrazavsever/neta"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
          className="inline-flex h-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon icon="mdi:github" className="h-4 w-4" />
        </a>
        <a
          href="https://poyrazavsever.com/rss.xml"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="RSS"
          title="RSS"
          className="inline-flex h-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon icon="mdi:rss" className="h-4 w-4" />
        </a>
      </SidebarFooter>
    </>
  );
}

export function DocsSidebar({
  docs,
  locale,
}: {
  docs: DocPage[];
  locale: Locale;
}) {
  const copy = siteCopy[locale].docs;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted lg:hidden"
        aria-label={copy.openMenu}
        aria-expanded={mobileOpen}
      >
        <Icon icon="mdi:menu" className="h-5 w-5" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          variant="default"
          className="!w-72 border-r border-border bg-background shadow-xl"
        >
          <div className="flex h-14 items-center justify-end border-b border-border px-3">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-foreground transition-colors hover:bg-muted"
              aria-label={copy.closeMenu}
            >
              <Icon icon="mdi:close" className="h-5 w-5" />
            </button>
          </div>
          <SidebarInner docs={docs} locale={locale} />
        </Sidebar>
      </div>

      <Sidebar
        className="fixed inset-y-0 left-0 z-30 hidden !w-64 border-r border-border bg-background lg:flex"
        variant="default"
      >
        <SidebarInner docs={docs} locale={locale} />
      </Sidebar>
    </>
  );
}
