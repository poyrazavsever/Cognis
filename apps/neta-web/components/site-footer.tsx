"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/app-icon";
import { type Locale, getDocsHref, getHomeHref, getSectionHref, siteCopy } from "@/lib/i18n";

const GITHUB_URL = "https://github.com/poyrazavsever/neta";
const MAKER_URL = "https://poyrazavsever.com";

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale];
  const homeHref = getHomeHref(locale);

  const navigateHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== homeHref) {
      return;
    }

    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.pushState(null, "", homeHref);
  };

  const navigateToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (window.location.pathname !== homeHref) {
      return;
    }

    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[#d8dde3] bg-[#f3f5f7] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <Link
              href={homeHref}
              onClick={navigateHome}
              aria-label={copy.nav.homeAria}
              className="inline-flex"
            >
              <Image
                src="/logo/blackLogoLong.png"
                alt="Neta"
                width={597}
                height={397}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#626a73]">
              {copy.footer.description}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {copy.footer.links.map((item) => (
              <a
                key={item.id}
                href={getSectionHref(locale, item.id)}
                onClick={(event) => navigateToSection(event, item.id)}
                className="text-sm font-medium text-[#434a52] transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href={getDocsHref(locale)}
              className="text-sm font-medium text-[#434a52] transition-colors hover:text-primary"
            >
              {copy.footer.docs}
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#bcc4cd] text-[#15181b] transition-colors hover:border-primary hover:text-primary"
              aria-label="GitHub"
              title="GitHub"
            >
              <Icon icon="mdi:github" className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#d8dde3] pt-5 text-xs text-[#626a73] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Neta.</span>
          <a
            href={MAKER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#15181b]"
          >
            {copy.footer.madeBy}
            <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
