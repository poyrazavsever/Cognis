import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contrastRatio,
  createThemeTokens,
  normalizeHex,
} from '@neta/design-tokens';

test('normalizes supported hex color input', () => {
  assert.equal(normalizeHex('ec2027'), '#EC2027');
  assert.equal(normalizeHex('#f00'), '#FF0000');
  assert.equal(normalizeHex('rgb(236, 32, 39)'), null);
});

test('keeps generated primary foreground readable', () => {
  const light = createThemeTokens('light', { primary: '#EC2027' }).colors;
  const dark = createThemeTokens('dark', { primary: '#FF525A' }).colors;

  assert.ok(contrastRatio(light.primary, light.primaryForeground) >= 4.5);
  assert.ok(contrastRatio(dark.primary, dark.primaryForeground) >= 4.5);
});

test('applies safe dynamic accent colors', () => {
  const colors = createThemeTokens('light', { accent: '#246BFE' }).colors;

  assert.equal(colors.accent, '#246BFE');
  assert.ok(contrastRatio(colors.accent, colors.accentForeground) >= 4.5);
});

test('keeps semantic surfaces distinct and readable in both themes', () => {
  for (const mode of ['light', 'dark'] as const) {
    const colors = createThemeTokens(mode).colors;
    assert.notEqual(colors.background, colors.surfaceElevated);
    assert.notEqual(colors.surfaceMuted, colors.surfacePressed);
    assert.ok(contrastRatio(colors.text, colors.background) >= 7);
    assert.ok(contrastRatio(colors.textMuted, colors.surfaceElevated) >= 4.5);
    assert.ok(contrastRatio(colors.primary, colors.primaryForeground) >= 4.5);
  }
});
