"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/app-icon";
import {
  LOCALES,
  type Locale,
  getAlternateLocaleHref,
  localeLabels,
} from "@/lib/i18n";

type LanguageDropdownProps = {
  locale: Locale;
  pathname: string;
  label: string;
  scrolled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  placement?: "top" | "bottom";
  align?: "start" | "end";
  menuWidthClassName?: string;
  onSelect?: () => void;
};

export function LanguageDropdown({
  locale,
  pathname,
  label,
  scrolled = true,
  fullWidth = false,
  compact = false,
  placement = "bottom",
  align = "end",
  menuWidthClassName = "w-48",
  onSelect,
}: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentLocale = localeLabels[locale];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const buttonTone = scrolled
    ? "border-border bg-background text-foreground hover:bg-accent"
    : "border-white/35 bg-white/10 text-white hover:bg-white/20";
  const menuPlacement =
    placement === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const menuAlignment = fullWidth
    ? "left-0 w-full"
    : align === "start"
      ? `left-0 ${menuWidthClassName}`
      : `right-0 ${menuWidthClassName}`;

  return (
    <div ref={menuRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center border text-sm font-semibold transition-colors ${
          compact
            ? "h-10 w-full justify-center rounded-sm px-2"
            : `h-11 gap-2 rounded-2xl px-2.5 ${
                fullWidth ? "w-full justify-between" : "justify-center"
              }`
        } ${buttonTone}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Image
            src={currentLocale.flag}
            alt=""
            width={24}
            height={16}
            className="h-4 w-6 rounded-[3px] object-cover"
          />
          {!compact ? (
            <span className={fullWidth ? "" : "hidden sm:inline"}>
              {currentLocale.short}
            </span>
          ) : null}
        </span>
        {!compact ? (
          <Icon
            icon="mdi:chevron-down"
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        ) : null}
      </button>

      <div
        role="menu"
        className={`absolute z-[60] overflow-hidden rounded-2xl border border-border bg-background p-1.5 text-foreground shadow-[0_18px_50px_rgba(16,24,40,0.16)] transition-all duration-200 ${menuAlignment} ${menuPlacement} ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {LOCALES.map((item) => {
          const details = localeLabels[item];
          const active = item === locale;

          return (
            <Link
              key={item}
              href={getAlternateLocaleHref(pathname, item)}
              role="menuitem"
              aria-current={active ? "true" : undefined}
              onClick={() => {
                setOpen(false);
                onSelect?.();
              }}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary/8 text-primary"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <Image
                src={details.flag}
                alt=""
                width={24}
                height={16}
                className="h-4 w-6 rounded-[3px] object-cover"
              />
              <span className="min-w-0 flex-1">{details.native}</span>
              <span className="text-xs text-muted-foreground">
                {details.short}
              </span>
              {active ? <Icon icon="mdi:check" className="h-4 w-4" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
