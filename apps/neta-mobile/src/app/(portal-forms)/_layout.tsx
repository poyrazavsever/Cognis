import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '@/components/ui';
import { useSession } from '@/providers/session-provider';

export default function PortalFormsLayout() { const session = useSession(); if (session.status === 'loading') return <LoadingScreen label="Oturum doğrulanıyor" />; if (session.status !== 'authenticated' || session.role !== 'client') return <Redirect href="/" />; return <Stack screenOptions={{ headerShown: false }} />; }
