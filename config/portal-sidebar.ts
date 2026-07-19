import {
  FolderKanban,
  Sparkles,
  CheckSquare2,
  type LucideIcon,
} from "lucide-react";

export type PortalSidebarNavItem = {
  title: string;
  titleKey?: string;
  href?: string;
  icon?: LucideIcon;
  items?: PortalSidebarNavItem[];
};

export type PortalSidebarNavGroup = {
  title: string;
  titleKey?: string;
  items: PortalSidebarNavItem[];
};

export const portalSidebarData: PortalSidebarNavGroup[] = [
  {
    title: "GENEL BAKIŞ",
    titleKey: "navigation.groups.overview",
    items: [
      { title: "Dashboard", titleKey: "navigation.items.dashboard", href: "/portal", icon: Sparkles },
    ],
  },
  {
    title: "SÜREÇLER",
    titleKey: "navigation.groups.processes",
    items: [
      { title: "Projeleriniz", titleKey: "navigation.items.portalProjects", href: "/portal/projects", icon: FolderKanban },
      { title: "Yapılan Görevler", titleKey: "navigation.items.portalTasks", href: "/portal/tasks", icon: CheckSquare2 },
      { title: "Revizyon Talepleri", titleKey: "navigation.items.portalRevisions", href: "/portal/revisions", icon: Sparkles },
    ],
  }
];

export function localizePortalSidebarData(t: (key: string) => string): PortalSidebarNavGroup[] {
  return portalSidebarData.map((group) => ({
    ...group,
    title: group.titleKey ? t(group.titleKey) : group.title,
    items: group.items.map((item) => ({
      ...item,
      title: item.titleKey ? t(item.titleKey) : item.title,
    })),
  }));
}
