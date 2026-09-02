import { Redirect, type Href } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useSession } from '@/providers/session-provider';
import { useOnboarding } from '@/providers/onboarding-provider';

export default function BootstrapRoute() {
  const session = useSession();
  const onboarding = useOnboarding();

  if (session.status === 'loading' || onboarding.loading) {
    return <LoadingScreen label="Neta hazırlanıyor" />;
  }

  if (session.status === 'authenticated') {
    return <Redirect href={session.role === 'freelancer' ? '/(owner)' : '/(portal)'} />;
  }

  return <Redirect href={(onboarding.completed ? '/login' : '/onboarding') as Href} />;
}
