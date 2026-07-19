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
  title: string;
  titleKey: string;
  href?: string;
  icon?: LucideIcon;
  items?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  title: string;
  titleKey: string;
  items: SidebarNavItem[];
};

export const sidebarData: SidebarNavGroup[] = [
  {
    title: "GENEL BAKIŞ",
    titleKey: "navigation.groups.overview",
    items: [
      { title: "Dashboard", titleKey: "navigation.items.dashboard", href: "/", icon: Sparkles },
      { title: "Takvim", titleKey: "navigation.items.calendar", href: "/calendar", icon: Calendar },
      { title: "Analizler", titleKey: "navigation.items.analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "OPERASYON",
    titleKey: "navigation.groups.operations",
    items: [
      { title: "Müşteriler", titleKey: "navigation.items.clients", href: "/clients", icon: Building2 },
      { title: "Projeler", titleKey: "navigation.items.projects", href: "/projects", icon: FolderKanban },
      { title: "Görevler", titleKey: "navigation.items.tasks", href: "/tasks", icon: CheckSquare2 },
      { title: "Finans", titleKey: "navigation.items.finance", href: "/finance", icon: Wallet },
    ],
  },
  {
    title: "KİŞİSEL",
    titleKey: "navigation.groups.personal",
    items: [{ title: "Günlük", titleKey: "navigation.items.journal", href: "/journal", icon: BookOpenText }],
  },
  {
    title: "AI ASİSTAN",
    titleKey: "navigation.groups.ai",
    items: [{ title: "Sohbet", titleKey: "navigation.items.chat", href: "/chat", icon: MessageCircleHeart }],
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
