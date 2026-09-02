"use client";

import {
  Brain,
  Languages,
  Palette,
  Settings2,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "poyraz-ui/atoms";

export type SettingsNavigationLabels = {
  ai: string;
  appearance: string;
  general: string;
  language: string;
  languages: string;
  profile: string;
  security: string;
};

const items = [
  { key: "general", href: "/settings/general", icon: Settings2 },
  { key: "appearance", href: "/settings/appearance", icon: Palette },
  { key: "profile", href: "/settings/profile", icon: User },
  { key: "security", href: "/settings/security", icon: Shield },
  { key: "ai", href: "/settings/ai", icon: Brain },
  { key: "language", href: "/settings/language", icon: Languages },
  { key: "languages", href: "/settings/languages", icon: Languages },
] as const;

export function SettingsNavigation({ labels }: { labels: SettingsNavigationLabels }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={labels.general}
      className="tiny-scrollbar flex w-full shrink-0 gap-2 overflow-x-auto pb-2 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:w-60 md:self-start md:flex-col md:overflow-y-auto md:pb-0"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Button
            key={item.href}
            asChild
            effect="shine"
            variant={active ? "default" : "secondary"}
            className="h-auto shrink-0 justify-start gap-3 px-4 py-3 text-left"
          >
            <Link href={item.href} aria-current={active ? "page" : undefined}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {labels[item.key]}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
