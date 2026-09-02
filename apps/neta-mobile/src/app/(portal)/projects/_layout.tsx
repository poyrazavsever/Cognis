import { Stack } from 'expo-router';

export default function PortalProjectsLayout() {
  return <Stack screenOptions={{ headerBackTitle: 'Projeler', headerShown: true }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="[id]" options={{ title: 'Proje detayı' }} /></Stack>;
}
