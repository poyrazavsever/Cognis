import { type PropsWithChildren, type RefObject, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Image, Modal, Platform, Pressable, StyleSheet, Text, View, findNodeHandle } from 'react-native';
import { type Href, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { ListRow } from '@/components/ui/list-row';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, shadow, spacing } from '@/theme/tokens';
import { shellRouteTitle, shouldShowShellBack, type ShellRole } from './shell-policy';
import { finishPerformanceMeasure, markPerformanceStart } from '@/lib/performance/metrics';

export type { ShellRole } from './shell-policy';
type NavItem = { description?: string; href: string; icon: AppIconName; label: string; match: (pathname: string) => boolean };
type ShellContextValue = { inShell: true; openOthers: (returnFocusRef: RefObject<View | null>) => void; role: ShellRole };
const ShellContext = createContext<ShellContextValue | null>(null);

const ownerPrimary: readonly NavItem[] = [
  { href: '/(owner)', icon: { ios: 'house.fill', android: 'home' }, label: 'Ana Sayfa', match: (path) => path === '/' },
  { href: '/(owner)/clients', icon: { ios: 'person.2.fill', android: 'group' }, label: 'Müşteriler', match: (path) => path.startsWith('/clients') },
  { href: '/(owner)/projects', icon: { ios: 'folder.fill', android: 'folder' }, label: 'Projeler', match: (path) => path.startsWith('/projects') },
  { href: '/(owner)/tasks', icon: { ios: 'checkmark.circle.fill', android: 'task_alt' }, label: 'Görevler', match: (path) => path.startsWith('/tasks') },
];

const portalPrimary: readonly NavItem[] = [
  { href: '/(portal)', icon: { ios: 'house.fill', android: 'home' }, label: 'Ana Sayfa', match: (path) => path === '/' },
  { href: '/(portal)/projects', icon: { ios: 'folder.fill', android: 'folder' }, label: 'Projeler', match: (path) => path.startsWith('/projects') },
  { href: '/(portal)/tasks', icon: { ios: 'checkmark.circle.fill', android: 'task_alt' }, label: 'Görevler', match: (path) => path.startsWith('/tasks') },
  { href: '/(portal)/revisions', icon: { ios: 'arrow.triangle.2.circlepath', android: 'published_with_changes' }, label: 'Revizyonlar', match: (path) => path.startsWith('/revisions') },
];

const ownerOthers: readonly NavItem[] = [
  { description: 'Ay ve agenda görünümü', href: '/(owner)/calendar', icon: { ios: 'calendar', android: 'calendar_month' }, label: 'Takvim', match: (path) => path.startsWith('/calendar') },
  { description: 'Gelir, gider ve nakit akışı', href: '/(owner)/finance', icon: { ios: 'chart.line.uptrend.xyaxis', android: 'account_balance_wallet' }, label: 'Finans', match: (path) => path.startsWith('/finance') },
  { description: 'Performans ve iş özetleri', href: '/(owner)/analytics', icon: { ios: 'chart.bar.fill', android: 'analytics' }, label: 'Analizler', match: (path) => path.startsWith('/analytics') },
  { description: 'Mood ve kişisel notlar', href: '/(owner)/journal', icon: { ios: 'book.closed.fill', android: 'menu_book' }, label: 'Günlük', match: (path) => path.startsWith('/journal') },
  { description: 'Sohbet ve proje risk analizi', href: '/(owner)/chat', icon: { ios: 'sparkles', android: 'auto_awesome' }, label: 'AI Asistan', match: (path) => path.startsWith('/chat') },
  { description: 'Hesap, workspace ve içerik', href: '/(owner)/settings', icon: { ios: 'gearshape.fill', android: 'settings' }, label: 'Ayarlar', match: (path) => path.startsWith('/settings') || path.startsWith('/locales') || path.startsWith('/files') },
];

const portalOthers: readonly NavItem[] = [
  { description: 'Profil, görünüm, dil ve güvenlik', href: '/(portal)/settings', icon: { ios: 'person.crop.circle.fill', android: 'manage_accounts' }, label: 'Hesap ve Ayarlar', match: (path) => path.startsWith('/settings') },
];

export function AppShell({ children, role }: PropsWithChildren<{ role: ShellRole }>) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const returnFocusRef = useRef<RefObject<View | null> | null>(null);
  const openOthers = (ref: RefObject<View | null>) => { returnFocusRef.current = ref; setSheetOpen(true); };
  const closeOthers = () => {
    setSheetOpen(false);
    requestAnimationFrame(() => {
      const target = returnFocusRef.current?.current ?? null;
      const node = findNodeHandle(target);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    });
  };
  const value = useMemo<ShellContextValue>(() => ({ inShell: true, openOthers, role }), [role]);
  return (
    <ShellContext.Provider value={value}>
      <View style={styles.shell}>
        <AppTopBar role={role} />
        <View style={styles.content}>{children}</View>
      </View>
      <OthersSheet onClose={closeOthers} open={sheetOpen} role={role} />
    </ShellContext.Provider>
  );
}

export function useAppShell(): ShellContextValue | null {
  return useContext(ShellContext);
}

export function AppBottomBar({ role }: { role: ShellRole }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const shell = useAppShell();
  const moreRef = useRef<View>(null);
  const items = role === 'owner' ? ownerPrimary : portalPrimary;
  const otherItems = role === 'owner' ? ownerOthers : portalOthers;
  const othersActive = otherItems.some((item) => item.match(pathname));
  useEffect(() => { finishPerformanceMeasure('tab-switch'); }, [pathname]);
  return (
    <View accessibilityLabel="Ana navigasyon" accessibilityRole="tablist" style={[styles.bottomBarWrap, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.sm) }, shadow.navigation]}>
      <View style={styles.bottomBar}>
        {items.map((item) => <BottomItem active={item.match(pathname)} item={item} key={item.label} onPress={() => { markPerformanceStart('tab-switch'); router.navigate(item.href as Href); }} />)}
        <Pressable accessibilityLabel="Diğer" accessibilityRole="tab" accessibilityState={{ selected: othersActive }} onPress={() => shell?.openOthers(moreRef)} ref={moreRef} style={({ pressed }) => [styles.bottomItem, pressed && { backgroundColor: colors.surfacePressed }]}>
          <View style={[styles.bottomIcon, othersActive && { backgroundColor: colors.primary }]}><AppIcon color={othersActive ? colors.primaryForeground : colors.textSubtle} name={{ ios: 'ellipsis', android: 'more_horiz' }} size={23} /></View>
          <Text numberOfLines={1} style={[styles.bottomLabel, { color: othersActive ? colors.primary : colors.textSubtle }]}>Diğer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BottomItem({ active, item, onPress }: { active: boolean; item: NavItem; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityLabel={item.label} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.bottomItem, pressed && { backgroundColor: colors.surfacePressed }]}><View style={[styles.bottomIcon, active && { backgroundColor: colors.primary }]}><AppIcon color={active ? colors.primaryForeground : colors.textSubtle} name={item.icon} size={22} /></View><Text numberOfLines={1} style={[styles.bottomLabel, { color: active ? colors.primary : colors.textSubtle }]}>{item.label}</Text></Pressable>;
}

function AppTopBar({ role }: { role: ShellRole }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const { colors } = useTheme();
  const shell = useAppShell();
  const avatarRef = useRef<View>(null);
  const title = shellRouteTitle(pathname, role);
  const isDetail = shouldShowShellBack(pathname);
  const initials = (session.user?.name ?? session.user?.email ?? 'N').split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join('');
  return (
    <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.topBarInner}>
        {isDetail ? <Pressable accessibilityLabel="Geri" accessibilityRole="button" hitSlop={6} onPress={() => router.back()} style={({ pressed }) => [styles.topAction, pressed && { backgroundColor: colors.surfacePressed }]}><AppIcon color={colors.text} name={{ ios: 'chevron.left', android: 'arrow_back' }} /></Pressable> : <Image accessibilityIgnoresInvertColors accessibilityLabel="Neta" source={require('../../../assets/logo/iconLogo.png')} style={styles.logo} />}
        <View style={styles.topCopy}><Text numberOfLines={1} style={[styles.workspace, { color: colors.textSubtle }]}>{session.instance?.workspaceName ?? 'Neta'}</Text><Text accessibilityRole="header" numberOfLines={1} style={[styles.topTitle, { color: colors.text }]}>{title}</Text></View>
        <Pressable accessibilityHint="Hesap ve diğer menüsünü açar" accessibilityLabel={`${session.user?.name ?? 'Hesap'} menüsü`} accessibilityRole="button" onPress={() => shell?.openOthers(avatarRef)} ref={avatarRef} style={({ pressed }) => [styles.avatar, { backgroundColor: colors.primary }, pressed && { backgroundColor: colors.primaryPressed }]}><Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials || 'N'}</Text></Pressable>
      </View>
    </View>
  );
}

function OthersSheet({ onClose, open, role }: { onClose: () => void; open: boolean; role: ShellRole }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, reduceMotion } = useTheme();
  const firstItemRef = useRef<View>(null);
  const items = role === 'owner' ? ownerOthers : portalOthers;
  const navigate = (href: string) => { onClose(); requestAnimationFrame(() => router.navigate(href as Href)); };
  const focusFirst = () => { const node = findNodeHandle(firstItemRef.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); };
  return (
    <Modal animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={onClose} onShow={focusFirst} presentationStyle="overFullScreen" transparent visible={open}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Diğer menüsünü kapat" accessibilityRole="button" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surfaceElevated, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <View style={styles.sheetHeading}><View><Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.text }]}>Diğer</Text><Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>{role === 'owner' ? 'Çalışma alanı araçları' : 'Hesabın ve tercihlerin'}</Text></View><Pressable accessibilityLabel="Kapat" accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.topAction, pressed && { backgroundColor: colors.surfacePressed }]}><AppIcon color={colors.text} name={{ ios: 'xmark', android: 'close' }} /></Pressable></View>
          <View style={styles.sheetList}>{items.map((item, index) => <View key={item.label} ref={index === 0 ? firstItemRef : undefined}><ListRow {...(item.description ? { description: item.description } : {})} icon={item.icon} onPress={() => navigate(item.href)} title={item.label} {...(item.match(pathname) ? { trailing: <View style={[styles.activeDot, { backgroundColor: colors.primary }]} /> } : {})} /></View>)}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  activeDot: { borderRadius: radius.pill, height: 9, width: 9 },
  avatar: { alignItems: 'center', borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { fontSize: 14, fontWeight: '900' },
  bottomBar: { alignSelf: 'center', flexDirection: 'row', maxWidth: 720, width: '100%' },
  bottomBarWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  bottomIcon: { alignItems: 'center', borderRadius: radius.pill, height: 30, justifyContent: 'center', minWidth: 44, paddingHorizontal: spacing.sm },
  bottomItem: { alignItems: 'center', borderRadius: radius.md, flex: 1, gap: 2, justifyContent: 'center', minHeight: 58, minWidth: 48, paddingHorizontal: 2 },
  bottomLabel: { fontSize: 10.5, fontWeight: '700' },
  content: { flex: 1 },
  handle: { alignSelf: 'center', borderRadius: radius.pill, height: 5, marginBottom: spacing.md, width: 42 },
  logo: { borderRadius: 12, height: 44, width: 44 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '84%', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sheetHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sheetList: { gap: spacing.xs },
  sheetSubtitle: { fontSize: 14, marginTop: spacing.xs },
  sheetTitle: { fontSize: 28, fontWeight: '900' },
  shell: { flex: 1 },
  topAction: { alignItems: 'center', borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  topBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: spacing.sm, paddingHorizontal: spacing.md },
  topBarInner: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: spacing.sm, maxWidth: 900, width: '100%' },
  topCopy: { flex: 1, justifyContent: 'center' },
  topTitle: { fontSize: Platform.OS === 'ios' ? 20 : 19, fontWeight: '900', letterSpacing: -0.35 },
  workspace: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
});
