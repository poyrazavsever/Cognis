import { Redirect, Tabs } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { AppBottomBar, AppShell } from '@/components/navigation/app-shell';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

export default function PortalLayout() {
  const session = useSession();
  const { reduceMotion } = useTheme();

  if (session.status === 'loading') {
    return <LoadingScreen label="Oturum doğrulanıyor" />;
  }

  if (session.status !== 'authenticated' || session.role !== 'client') {
    return <Redirect href="/" />;
  }

  return <AppShell role="portal"><Tabs tabBar={() => <AppBottomBar role="portal" />} screenOptions={{ animation: reduceMotion ? 'none' : 'fade', headerShown: false }}>
    <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
    <Tabs.Screen name="projects" options={{ title: 'Projeler' }} />
    <Tabs.Screen name="tasks" options={{ title: 'Görevler' }} />
    <Tabs.Screen name="revisions" options={{ title: 'Revizyonlar' }} />
    <Tabs.Screen name="settings" options={{ href: null }} />
  </Tabs></AppShell>;
}
