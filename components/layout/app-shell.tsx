"use client";

import { signOut } from "@/app/login/actions";
import { ColorModeSync } from "@/components/theme/color-mode-sync";
import type { ColorMode } from "@/lib/color-mode";
import {
  Button,
  Card,
  CardContent,
  Typography,
} from "poyraz-ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "poyraz-ui/molecules";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarPanel,
  SidebarProvider,
  SidebarTrigger,
  SidebarUserProfile,
  useSidebar,
} from "poyraz-ui/organisms";
import { ChevronUp, LogOut, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

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
  colorMode?: ColorMode;
};

export function AppShell({
  branding,
  children,
  homeHref,
  navGroups,
  settingsHref,
  user,
  progress,
  colorMode,
}: AppShellProps) {
  const pathname = usePathname();
  const sidebarProps = { branding, homeHref, navGroups, pathname, progress, settingsHref, user };

  return (
    <TooltipProvider>
      {colorMode ? <ColorModeSync colorMode={colorMode} /> : null}
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
    <SidebarProvider variant="default">
      <SidebarPanel className="sticky top-0 hidden h-screen shrink-0 self-stretch lg:flex">
        <SidebarComposition {...props} />
      </SidebarPanel>
    </SidebarProvider>
  );
}

function MobileSidebar(props: SidebarCompositionProps) {
  return (
    <SidebarProvider variant="floating">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link
          href={props.homeHref}
          className="flex min-w-0 max-w-40 items-center"
          aria-label={`${props.branding.applicationName} ana sayfa`}
        >
          <WorkspaceLogo branding={props.branding} compact />
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
      <SidebarHeader className="justify-center px-4 py-3">
        <Link
          href={homeHref}
          className="flex min-h-12 w-full items-center justify-center"
          aria-label={`${branding.applicationName} ana sayfa`}
        >
          <WorkspaceLogo branding={branding} />
        </Link>
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

function WorkspaceLogo({
  branding,
  compact = false,
}: {
  branding: AppShellBranding;
  compact?: boolean;
}) {
  const lightLogoUrl = branding.lightLogoUrl ?? branding.darkLogoUrl ?? "/logo/blackLogoLong.png";
  const darkLogoUrl = branding.darkLogoUrl ?? branding.lightLogoUrl ?? "/logo/lightLogoLong.png";
  const imageClassName = compact
    ? "max-h-8 w-auto max-w-full object-contain"
    : "max-h-12 w-auto max-w-full object-contain";

  return (
    <span className="flex h-full w-full items-center justify-center overflow-hidden">
      <Image
        src={lightLogoUrl}
        alt={`${branding.applicationName} logosu`}
        width={180}
        height={56}
        unoptimized
        className={`${imageClassName} dark:hidden`}
      />
      <Image
        src={darkLogoUrl}
        alt={`${branding.applicationName} logosu`}
        width={180}
        height={56}
        unoptimized
        className={`hidden ${imageClassName} dark:block`}
      />
    </span>
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
  const router = useRouter();
  const [isSigningOut, startSignOutTransition] = useTransition();

  function handleSignOut() {
    startSignOutTransition(async () => {
      try {
        const result = await signOut();
        router.replace(result.redirectTo);
        router.refresh();
      } catch {
        toast.error("Çıkış yapılamadı. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button effect="shine"
          type="button"
          variant="secondary"
          aria-label={`${user.displayName} için hesap menüsünü aç`}
          className="group h-auto min-h-10 w-full justify-start p-1.5 text-left"
        >
          <SidebarUserProfile
            className="min-w-0 flex-1"
            name={user.displayName}
            role={user.email}
            avatarUrl={user.avatarUrl ?? undefined}
            initials={user.shortName}
          />
          <ChevronUp
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        collisionPadding={12}
        surface="solid"
        radius="md"
        itemRadius="sm"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
      >
        <DropdownMenuLabel className="space-y-0.5 px-2.5 py-2">
          <span className="block truncate text-sm font-semibold text-foreground">
            {user.displayName}
          </span>
          <span className="block truncate font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref} className="gap-2">
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Ayarlar</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          disabled={isSigningOut}
          className="text-destructive focus:text-destructive data-[highlighted]:text-destructive"
        >
          <Button
            effect="shine"
            type="button"
            variant="secondary"
            size="sm"
            loading={isSigningOut}
            aria-busy={isSigningOut}
            onClick={handleSignOut}
            className="w-full justify-start gap-2 text-left text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isSigningOut ? "Çıkış yapılıyor" : "Çıkış yap"}</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
