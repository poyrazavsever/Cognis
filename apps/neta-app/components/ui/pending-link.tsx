"use client";

import { Loader2 } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type PendingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    children: ReactNode;
    pendingClassName?: string;
    showSpinner?: boolean;
    spinnerClassName?: string;
  };

export function PendingLink({
  children,
  className,
  href,
  onClick,
  pendingClassName = "opacity-70",
  showSpinner = false,
  spinnerClassName,
  target,
  ...props
}: PendingLinkProps) {
  const pathname = usePathname();
  const [pendingFromPath, setPendingFromPath] = useState<string | null>(null);
  const pending = pendingFromPath === pathname;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    const hrefValue = typeof href === "string" ? href : href.pathname?.toString() ?? "";
    const nextPath = hrefValue.split("?")[0].split("#")[0];

    if (nextPath && nextPath !== pathname) {
      setPendingFromPath(pathname);
    }
  }

  return (
    <Link
      {...props}
      href={href}
      target={target}
      onClick={handleClick}
      aria-busy={pending}
      data-pending={pending ? "" : undefined}
      className={cn(className, pending && pendingClassName)}
    >
      {children}
      {pending && showSpinner ? (
        <Loader2 className={cn("h-3.5 w-3.5 shrink-0 animate-spin", spinnerClassName)} />
      ) : null}
    </Link>
  );
}
