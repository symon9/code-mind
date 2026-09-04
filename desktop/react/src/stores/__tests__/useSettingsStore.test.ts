import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('initializes with default settings', () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.fontSize).toBe(14);
    expect(state.fontFamily).toBe('JetBrains Mono');
    expect(state.wordWrap).toBe('on');
    expect(state.autoSave).toBe(true);
    expect(state.tabSize).toBe(2);
    expect(state.aiProvider).toBe('openai');
  });

  it('updates theme correctly', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');

    useSettingsStore.getState().setTheme('solarized');
    expect(useSettingsStore.getState().theme).toBe('solarized');
  });

  it('clamps font size between min and max bounds', () => {
    useSettingsStore.getState().setFontSize(8);
    expect(useSettingsStore.getState().fontSize).toBe(10); // Minimum clamp

    useSettingsStore.getState().setFontSize(30);
    expect(useSettingsStore.getState().fontSize).toBe(24); // Maximum clamp

    useSettingsStore.getState().setFontSize(16);
    expect(useSettingsStore.getState().fontSize).toBe(16);
  });

  it('updates partial settings and resets to defaults', () => {
    useSettingsStore.getState().updateSettings({
      tabSize: 4,
      fontFamily: 'Fira Code',
      autoSave: false,
    });

    let state = useSettingsStore.getState();
    expect(state.tabSize).toBe(4);
    expect(state.fontFamily).toBe('Fira Code');
    expect(state.autoSave).toBe(false);

    useSettingsStore.getState().resetToDefaults();
    state = useSettingsStore.getState();
    expect(state.tabSize).toBe(2);
    expect(state.fontFamily).toBe('JetBrains Mono');
    expect(state.autoSave).toBe(true);
  });
});
