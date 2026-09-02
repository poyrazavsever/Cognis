export type FormRouteName = 'client' | 'client-activity' | 'invitation' | 'project' | 'task';

export function detailHref(resource: 'clients' | 'projects' | 'tasks', id: string): string {
  return `/${resource}/${encodeURIComponent(id)}`;
}

export function formHref(name: FormRouteName, params: Record<string, string | null | undefined> = {}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const suffix = query.toString();
  return `/${name}${suffix ? `?${suffix}` : ''}`;
}
