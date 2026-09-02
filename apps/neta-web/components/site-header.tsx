"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/app-icon";
import { DemoAccessButton } from "@/components/demo-access-button";
import { LanguageDropdown } from "@/components/language-dropdown";
import {
  type Locale,
  getDocsHref,
  getHomeHref,
  getSectionHref,
  siteCopy,
} from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = siteCopy[locale];
  const homeHref = getHomeHref(locale);
  const docsHref = getDocsHref(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const updateHeader = () => {
      let current = "";
      for (const item of copy.nav.links) {
        if (item.id === "docs") {
          continue;
        }

        const section = document.getElementById(item.id);
        if (!section) {
          continue;
        }

        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.36 && rect.bottom > window.innerHeight * 0.36) {
          current = item.id;
          break;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    updateHeader();

    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, [copy.nav.links]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigateToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    if (pathname !== homeHref) {
      return;
    }

    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    window.history.pushState(null, "", getSectionHref(locale, id));
    setMobileMenuOpen(false);
  };

  const navigateHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== homeHref) {
      return;
    }

    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.pushState(null, "", homeHref);
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header site-header--light">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={homeHref}
          onClick={navigateHome}
          className="flex shrink-0 items-center"
          aria-label={copy.nav.homeAria}
        >
          <Image
            src="/logo/blackLogoLong.png"
            alt="Neta"
            width={597}
            height={397}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {copy.nav.links.map((item) => {
            const isDocs = item.id === "docs";
            const href = isDocs ? docsHref : getSectionHref(locale, item.id);
            const active = isDocs ? pathname.startsWith(docsHref) : activeSection === item.id;

            return (
              <Link
                key={item.id}
                href={href}
                onClick={isDocs ? undefined : (event) => navigateToSection(event, item.id)}
                className="site-header__link"
                data-active={active ? "true" : "false"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageDropdown
            locale={locale}
            pathname={pathname}
            label={copy.nav.language}
            scrolled
            compact
          />
          <div className="hidden sm:block">
            <DemoAccessButton
              locale={locale}
              className="site-header__demo"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="site-header__menu lg:hidden"
            aria-label={mobileMenuOpen ? copy.nav.closeMenu : copy.nav.openMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Icon
              icon={mobileMenuOpen ? "mdi:close" : "mdi:menu"}
              className="h-5 w-5"
            />
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`site-header__mobile ${mobileMenuOpen ? "site-header__mobile--open" : ""}`}
      >
        <nav className="mx-auto grid max-w-7xl px-4 py-4 sm:px-6">
          {copy.nav.links.map((item) => {
            const isDocs = item.id === "docs";
            const href = isDocs ? docsHref : getSectionHref(locale, item.id);
            return (
              <Link
                key={item.id}
                href={href}
                onClick={isDocs ? () => setMobileMenuOpen(false) : (event) => navigateToSection(event, item.id)}
                className="site-header__mobile-link"
              >
                {item.label}
                <Icon icon="mdi:arrow-right" className="h-4 w-4" />
              </Link>
            );
          })}
          <div className="mt-3 sm:hidden">
            <DemoAccessButton locale={locale} className="w-full rounded-lg" />
          </div>
        </nav>
      </div>
    </header>
  );
}
