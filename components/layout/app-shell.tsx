"use client";

import { signOut } from "@/app/login/actions";
import { IconButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PendingLink } from "@/components/ui/pending-link";
import { cn } from "@/lib/utils";
import { ChevronUp, LogOut, Menu, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type AppShellNavItem = {
  title: string;
  href?: string;
  icon?: LucideIcon;
};

export type AppShellNavGroup = {
  title: string;
  items: AppShellNavItem[];
};

type ShellUser = {
  email: string;
  displayName: string;
  shortName: string;
  avatarUrl: string | null;
};

type AppShellProps = {
  children: React.ReactNode;
  homeHref: string;
  navGroups: AppShellNavGroup[];
  settingsHref: string;
  user: ShellUser;
  progress?: number;
};

export function AppShell({
  children,
  homeHref,
  navGroups,
  settingsHref,
  user,
  progress,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileSidebarState, setMobileSidebarState] = useState({
    open: false,
    pathname,
  });
  const isMobileSidebarOpen =
    mobileSidebarState.open && mobileSidebarState.pathname === pathname;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Ana içeriğe geç
      </a>
      <div className="flex min-h-screen">
        <AppSidebar
          homeHref={homeHref}
          navGroups={navGroups}
          pathname={pathname}
          progress={progress}
          settingsHref={settingsHref}
          user={user}
          className="sticky top-0 hidden h-screen shrink-0 self-stretch lg:flex"
        />

        {isMobileSidebarOpen ? (
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarState({ open: false, pathname })}
          />
        ) : null}

        <AppSidebar
          homeHref={homeHref}
          navGroups={navGroups}
          pathname={pathname}
          progress={progress}
          settingsHref={settingsHref}
          user={user}
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:hidden",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onNavigate={() => setMobileSidebarState({ open: false, pathname })}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
            <Link href={homeHref} className="flex items-center gap-2 font-semibold">
              <Image
                src="/logo/blackLogoLong.png"
                alt="Neta"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                style={{ width: "auto" }}
                priority
              />
            </Link>
            <IconButton
              label="Menüyü aç"
              variant="outline"
              onClick={() => setMobileSidebarState({ open: true, pathname })}
            >
              <Menu className="h-4 w-4" />
            </IconButton>
          </header>

          <main id="main-content" className="min-w-0 flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function AppSidebar({
  homeHref,
  navGroups,
  pathname,
  progress,
  settingsHref,
  user,
  onNavigate,
  className,
}: {
  homeHref: string;
  navGroups: AppShellNavGroup[];
  pathname: string;
  progress?: number;
  settingsHref: string;
  user: ShellUser;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex h-dvh w-[280px] max-w-[82vw] flex-col overflow-hidden border-r border-border bg-surface",
        className,
      )}
    >
      <div className="shrink-0 px-6 py-3">
        <Link href={homeHref} className="flex w-full items-center justify-center">
          <Image
            src="/logo/blackLogoLong.png"
            alt="Neta"
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
        </Link>
      </div>

      <div className="h-px bg-border" />

      <nav className="tiny-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {navGroups.map((group, groupIndex) => (
          <section key={group.title} className={cn(groupIndex > 0 && "mt-6")}>
            <h2 className="px-2 text-[11px] font-semibold uppercase leading-6 text-muted-foreground">
              {group.title}
            </h2>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === homeHref
                    ? pathname === homeHref
                    : item.href
                      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                      : false;
                const Icon = item.icon;

                return (
                  <li key={item.href || item.title}>
                    <PendingLink
                      href={item.href || "#"}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
                        "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive && "bg-primary/10 text-primary",
                      )}
                      showSpinner
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                      <span className="truncate">{item.title}</span>
                    </PendingLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="mt-auto flex shrink-0 flex-col gap-4 border-t border-border px-4 py-4">
        {typeof progress === "number" ? <ProgressSummary progress={progress} /> : null}
        <AccountMenu user={user} settingsHref={settingsHref} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}

function ProgressSummary({ progress }: { progress: number }) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Card className="overflow-hidden border-primary/10 bg-primary/5 shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="text-sm font-semibold text-foreground">Proje ilerlemesi</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-primary">%{normalizedProgress} tamamlandı</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountMenu({
  user,
  settingsHref,
  onNavigate,
}: {
  user: ShellUser;
  settingsHref: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((current) => !current)}
      >
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{user.displayName}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </div>
        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 z-[70] w-full rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <PendingLink
            href={settingsHref}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="flex h-9 items-center gap-2 rounded-sm px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            showSpinner
          >
            <Settings className="h-4 w-4" />
            Ayarlar
          </PendingLink>
          <div className="my-1 h-px bg-border" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex h-9 w-full items-center gap-2 rounded-sm px-3 text-left text-sm text-destructive hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" />
              Çıkış yap
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function UserAvatar({ user }: { user: ShellUser }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {user.shortName}
    </span>
  );
}
