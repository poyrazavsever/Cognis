import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useSession } from '@/providers/session-provider';

export default function PublicLayout() {
  const session = useSession();
  if (session.status === 'loading') return <LoadingScreen label="Neta hazırlanıyor" />;
  if (session.status === 'authenticated') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
