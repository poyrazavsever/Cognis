import {
  FolderKanban,
  Sparkles,
  CheckSquare2,
  type LucideIcon,
} from "lucide-react";

export type PortalSidebarNavItem = {
  title: string;
  href?: string;
  icon?: LucideIcon;
  items?: PortalSidebarNavItem[];
};

export type PortalSidebarNavGroup = {
  title: string;
  items: PortalSidebarNavItem[];
};

export const portalSidebarData: PortalSidebarNavGroup[] = [
  {
    title: "GENEL BAKIŞ",
    items: [
      { title: "Dashboard", href: "/portal", icon: Sparkles },
    ],
  },
  {
    title: "SÜREÇLER",
    items: [
      { title: "Projeleriniz", href: "/portal/projects", icon: FolderKanban },
      { title: "Yapılan Görevler", href: "/portal/tasks", icon: CheckSquare2 },
      { title: "Revizyon Talepleri", href: "/portal/revisions", icon: Sparkles },
    ],
  }
];
