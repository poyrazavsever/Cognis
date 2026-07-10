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
  href?: string;
  icon?: LucideIcon;
  items?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  title: string;
  items: SidebarNavItem[];
};

export const sidebarData: SidebarNavGroup[] = [
  {
    title: "GENEL BAKIŞ",
    items: [
      { title: "Dashboard", href: "/", icon: Sparkles },
      { title: "Takvim", href: "/calendar", icon: Calendar },
      { title: "Analizler", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "OPERASYON",
    items: [
      { title: "Müşteriler", href: "/clients", icon: Building2 },
      { title: "Projeler", href: "/projects", icon: FolderKanban },
      { title: "Görevler", href: "/tasks", icon: CheckSquare2 },
      { title: "Finans", href: "/finance", icon: Wallet },
    ],
  },
  {
    title: "KİŞİSEL",
    items: [{ title: "Günlük", href: "/journal", icon: BookOpenText }],
  },
  {
    title: "AI ASİSTAN",
    items: [{ title: "Sohbet", href: "/chat", icon: MessageCircleHeart }],
  },
];
