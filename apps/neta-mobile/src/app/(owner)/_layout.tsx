import { Redirect, Tabs } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { AppBottomBar, AppShell } from '@/components/navigation/app-shell';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

export default function OwnerLayout() {
  const session = useSession();
  const { reduceMotion } = useTheme();

  if (session.status === 'loading') {
    return <LoadingScreen label="Oturum doğrulanıyor" />;
  }

  if (session.status !== 'authenticated' || session.role !== 'freelancer') {
    return <Redirect href="/" />;
  }

  return (
    <AppShell role="owner">
      <Tabs tabBar={() => <AppBottomBar role="owner" />} screenOptions={{ animation: reduceMotion ? 'none' : 'fade', headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
        <Tabs.Screen name="clients" options={{ title: 'Müşteriler' }} />
        <Tabs.Screen name="clients/[id]" options={{ href: null }} />
        <Tabs.Screen name="projects" options={{ title: 'Projeler' }} />
        <Tabs.Screen name="projects/[id]" options={{ href: null }} />
        <Tabs.Screen name="tasks" options={{ title: 'Görevler' }} />
        <Tabs.Screen name="tasks/[id]" options={{ href: null }} />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="finance" options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="journal" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="files" options={{ href: null }} />
        <Tabs.Screen name="locales" options={{ href: null }} />
      </Tabs>
    </AppShell>
  );
}
