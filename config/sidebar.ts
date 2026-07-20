import {
  BarChart3,
  BookOpenText,
  Building2,
  Calendar,
  CheckSquare2,
  FolderKanban,
  MessageCircleHeart,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type SidebarNavItem = {
  title?: string;
  titleKey: string;
  href?: string;
  icon?: LucideIcon;
  items?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  title?: string;
  titleKey: string;
  items: SidebarNavItem[];
};

export const sidebarData: SidebarNavGroup[] = [
  {
    titleKey: "navigation.groups.overview",
    items: [
      { titleKey: "navigation.items.dashboard", href: "/", icon: Sparkles },
      { titleKey: "navigation.items.calendar", href: "/calendar", icon: Calendar },
      { titleKey: "navigation.items.analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    titleKey: "navigation.groups.operations",
    items: [
      { titleKey: "navigation.items.clients", href: "/clients", icon: Building2 },
      { titleKey: "navigation.items.projects", href: "/projects", icon: FolderKanban },
      { titleKey: "navigation.items.tasks", href: "/tasks", icon: CheckSquare2 },
      { titleKey: "navigation.items.finance", href: "/finance", icon: Wallet },
    ],
  },
  {
    titleKey: "navigation.groups.personal",
    items: [{ titleKey: "navigation.items.journal", href: "/journal", icon: BookOpenText }],
  },
  {
    titleKey: "navigation.groups.ai",
    items: [{ titleKey: "navigation.items.chat", href: "/chat", icon: MessageCircleHeart }],
  },
];

export function localizeSidebarData(t: (key: string) => string): SidebarNavGroup[] {
  return sidebarData.map((group) => ({
    ...group,
    title: t(group.titleKey),
    items: group.items.map((item) => ({
      ...item,
      title: t(item.titleKey),
    })),
  }));
}
