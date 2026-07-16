"use client";

import { signOut } from "@/app/login/actions";
import {
  Card,
  CardContent,
  Typography,
} from "poyraz-ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "poyraz-ui/molecules";
import {
  SidebarBranding,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarPanel,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarUserProfile,
  useSidebar,
} from "poyraz-ui/organisms";
import { ChevronUp, LogOut, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppShellNavItem = {
  title: string;
  href?: string;
  icon?: LucideIcon;
};

export type AppShellNavGroup = {
  title: string;
  items: AppShellNavItem[];
};

export type AppShellBranding = {
  applicationName: string;
  organizationName: string | null;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
};

type ShellUser = {
  email: string;
  displayName: string;
  shortName: string;
  avatarUrl: string | null;
};

type AppShellProps = {
  branding: AppShellBranding;
  children: React.ReactNode;
  homeHref: string;
  navGroups: AppShellNavGroup[];
  settingsHref: string;
  user: ShellUser;
  progress?: number;
};

export function AppShell({
  branding,
  children,
  homeHref,
  navGroups,
  settingsHref,
  user,
  progress,
}: AppShellProps) {
  const pathname = usePathname();
  const sidebarProps = { branding, homeHref, navGroups, pathname, progress, settingsHref, user };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-focus-ring"
        >
          Ana içeriğe geç
        </a>

        <div className="flex min-h-screen">
          <DesktopSidebar {...sidebarProps} />

          <div className="flex min-w-0 flex-1 flex-col">
            <MobileSidebar {...sidebarProps} />
            <main id="main-content" className="min-w-0 flex-1 p-4 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

type SidebarCompositionProps = {
  branding: AppShellBranding;
  homeHref: string;
  navGroups: AppShellNavGroup[];
  pathname: string;
  progress?: number;
  settingsHref: string;
  user: ShellUser;
};

function DesktopSidebar(props: SidebarCompositionProps) {
  return (
    <SidebarProvider variant="collapsible">
      <SidebarPanel className="sticky top-0 hidden h-screen shrink-0 self-stretch lg:flex">
        <SidebarComposition {...props} />
        <SidebarRail aria-label="Kenar çubuğunu daralt veya genişlet" />
      </SidebarPanel>
    </SidebarProvider>
  );
}

function MobileSidebar(props: SidebarCompositionProps) {
  return (
    <SidebarProvider variant="floating">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href={props.homeHref} className="min-w-0">
          <MobileBrand branding={props.branding} />
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger action="mobile" aria-label="Ana menüyü aç veya kapat" />
          </TooltipTrigger>
          <TooltipContent>Menü</TooltipContent>
        </Tooltip>
      </header>

      <SidebarPanel className="h-dvh max-w-[82vw] lg:hidden">
        <SidebarComposition {...props} />
      </SidebarPanel>
    </SidebarProvider>
  );
}

function SidebarComposition({
  branding,
  homeHref,
  navGroups,
  pathname,
  progress,
  settingsHref,
  user,
}: SidebarCompositionProps) {
  return (
    <>
      <SidebarHeader>
        <Link href={homeHref} className="min-w-0 flex-1" aria-label={`${branding.applicationName} ana sayfa`}>
          <SidebarBranding
            logo={<BrandMark branding={branding} />}
            title={branding.applicationName}
            subtitle={branding.organizationName ?? "Freelancer portalı"}
          />
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger
              className="hidden lg:inline-flex"
              aria-label="Kenar çubuğunu daralt veya genişlet"
            />
          </TooltipTrigger>
          <TooltipContent>Kenar çubuğunu daralt</TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent scrollMode="fade">
        <SidebarNavigation
          homeHref={homeHref}
          navGroups={navGroups}
          pathname={pathname}
        />
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-3">
        {typeof progress === "number" ? <ProgressSummary progress={progress} /> : null}
        <AccountMenu user={user} settingsHref={settingsHref} />
      </SidebarFooter>
    </>
  );
}

function SidebarNavigation({
  homeHref,
  navGroups,
  pathname,
}: Pick<SidebarCompositionProps, "homeHref" | "navGroups" | "pathname">) {
  const { setMobileOpen, variant } = useSidebar();

  return navGroups.map((group) => (
    <SidebarGroup key={group.title}>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          const active =
            item.href === homeHref
              ? pathname === homeHref
              : item.href
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : false;
          const Icon = item.icon;

          return (
            <SidebarMenuItem
              key={item.href || item.title}
              href={item.href || "#"}
              active={active}
              icon={Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : undefined}
              onClick={() => {
                if (variant === "floating") setMobileOpen(false);
              }}
            >
              {item.title}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  ));
}

function BrandMark({ branding }: { branding: AppShellBranding }) {
  const logoUrl = branding.lightLogoUrl ?? branding.darkLogoUrl;

  if (!logoUrl) {
    return (
      <span className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
        {branding.applicationName.slice(0, 1).toLocaleUpperCase("tr-TR")}
      </span>
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center">
      <Image
        src={logoUrl}
        alt=""
        width={32}
        height={32}
        unoptimized
        className={branding.darkLogoUrl ? "h-full w-full object-contain dark:hidden" : "h-full w-full object-contain"}
      />
      {branding.darkLogoUrl ? (
        <Image
          src={branding.darkLogoUrl}
          alt=""
          width={32}
          height={32}
          unoptimized
          className="hidden h-full w-full object-contain dark:block"
        />
      ) : null}
    </span>
  );
}

function MobileBrand({ branding }: { branding: AppShellBranding }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-muted">
        <BrandMark branding={branding} />
      </span>
      <Typography component="span" variant="small" className="truncate font-semibold">
        {branding.applicationName}
      </Typography>
    </div>
  );
}

function ProgressSummary({ progress }: { progress: number }) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Card variant="soft" className="w-full overflow-hidden border-primary/10 shadow-none">
      <CardContent className="space-y-3 p-3">
        <Typography variant="small" className="font-semibold">
          Proje ilerlemesi
        </Typography>
        <div className="space-y-1.5">
          <Typography variant="caption" className="font-medium text-primary">
            %{normalizedProgress} tamamlandı
          </Typography>
          <div
            role="progressbar"
            aria-label="Proje ilerlemesi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={normalizedProgress}
            className="h-2 w-full overflow-hidden rounded-full bg-primary-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountMenu({ user, settingsHref }: { user: ShellUser; settingsHref: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Hesap menüsünü aç"
          className="flex w-full items-center gap-2 rounded-sm p-1 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <SidebarUserProfile
            className="min-w-0 flex-1"
            name={user.displayName}
            role={user.email}
            avatarUrl={user.avatarUrl ?? undefined}
            initials={user.shortName}
          />
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="min-w-52">
        <DropdownMenuItem asChild media={<Settings className="h-4 w-4" aria-hidden="true" />}>
          <Link href={settingsHref}>Ayarlar</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem
            asChild
            media={<LogOut className="h-4 w-4" aria-hidden="true" />}
            className="text-destructive"
          >
            <button type="submit" className="w-full">
              Çıkış yap
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
