import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import {
  type BrandColorInput,
  type ColorMode,
  createThemeTokens,
  type ResolvedColorMode,
  type ThemeColors,
  type ThemeTokens,
} from '@/theme/tokens';

const COLOR_MODE_KEY = 'neta.preferences.color-mode';

type ThemeContextValue = {
  colorMode: ColorMode;
  colors: ThemeColors;
  setBrandColors: (colors: BrandColorInput) => void;
  resolvedColorMode: ResolvedColorMode;
  reduceMotion: boolean;
  setColorMode: (mode: ColorMode) => void;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isColorMode(value: string | null): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme();
  const [colorMode, setColorModeState] = useState<ColorMode>('system');
  const [brandColors, setBrandColors] = useState<BrandColorInput>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(COLOR_MODE_KEY).then((storedMode) => {
      if (isColorMode(storedMode)) {
        setColorModeState(storedMode);
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    void AsyncStorage.setItem(COLOR_MODE_KEY, mode);
  }, []);

  const resolvedColorMode: ResolvedColorMode =
    colorMode === 'system' ? (systemMode === 'dark' ? 'dark' : 'light') : colorMode;

  const tokens = useMemo(
    () => createThemeTokens(resolvedColorMode, brandColors),
    [brandColors, resolvedColorMode],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorMode,
      colors: tokens.colors,
      reduceMotion,
      resolvedColorMode,
      setBrandColors,
      setColorMode,
      tokens,
    }),
    [colorMode, reduceMotion, resolvedColorMode, setBrandColors, setColorMode, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return value;
}
