export type ShellRole = 'owner' | 'portal';
export type ShellSection = 'home' | 'clients' | 'projects' | 'tasks' | 'revisions' | 'others';

export function shellSection(role: ShellRole, pathname: string): ShellSection {
  if (pathname.startsWith('/clients') && role === 'owner') return 'clients';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/tasks')) return 'tasks';
  if (pathname.startsWith('/revisions') && role === 'portal') return 'revisions';
  if (pathname === '/') return 'home';
  return 'others';
}

export function shouldShowShellBack(pathname: string): boolean {
  return pathname.split('/').filter(Boolean).length > 1;
}

export function shellRouteTitle(pathname: string, role: ShellRole): string {
  if (pathname.startsWith('/clients/')) return 'Müşteri Detayı';
  if (pathname.startsWith('/clients')) return 'Müşteriler';
  if (pathname.startsWith('/projects/')) return 'Proje Detayı';
  if (pathname.startsWith('/projects')) return 'Projeler';
  if (pathname.startsWith('/tasks/')) return 'Görev Detayı';
  if (pathname.startsWith('/tasks')) return 'Görevler';
  if (pathname.startsWith('/revisions')) return 'Revizyonlar';
  if (pathname.startsWith('/calendar')) return 'Takvim';
  if (pathname.startsWith('/finance')) return 'Finans';
  if (pathname.startsWith('/analytics')) return 'Analizler';
  if (pathname.startsWith('/journal')) return 'Günlük';
  if (pathname.startsWith('/chat')) return 'AI Asistan';
  if (pathname.startsWith('/settings') || pathname.startsWith('/files') || pathname.startsWith('/locales')) return 'Ayarlar';
  return role === 'owner' ? 'Ana Sayfa' : 'Portal';
}
