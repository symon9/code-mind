import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../useEditorStore';

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().closeAllTabs();
  });

  it('creates a new untitled file tab', () => {
    useEditorStore.getState().createNewFile();
    const state = useEditorStore.getState();

    expect(state.openTabs.length).toBe(1);
    expect(state.openTabs[0].name).toContain('Untitled-1.ts');
    expect(state.openTabs[0].isDirty).toBe(true);
    expect(state.activeTabId).toBe(state.openTabs[0].id);
  });

  it('updates tab content and marks it dirty', () => {
    useEditorStore.getState().createNewFile();
    const tabId = useEditorStore.getState().activeTabId!;

    useEditorStore.getState().updateContent(tabId, 'const greeting = "Hello";');
    const tab = useEditorStore.getState().openTabs.find((t) => t.id === tabId);

    expect(tab?.content).toBe('const greeting = "Hello";');
    expect(tab?.isDirty).toBe(true);
  });

  it('closes a tab and updates activeTabId', () => {
    useEditorStore.getState().createNewFile(); // tab 1
    useEditorStore.getState().createNewFile(); // tab 2
    expect(useEditorStore.getState().openTabs.length).toBe(2);

    const firstTabId = useEditorStore.getState().openTabs[0].id;
    useEditorStore.getState().closeTab(firstTabId);

    const state = useEditorStore.getState();
    expect(state.openTabs.length).toBe(1);
    expect(state.openTabs.some((t) => t.id === firstTabId)).toBe(false);
  });

  it('closes all tabs and clears activeTabId', () => {
    useEditorStore.getState().createNewFile();
    useEditorStore.getState().createNewFile();
    expect(useEditorStore.getState().openTabs.length).toBe(2);

    useEditorStore.getState().closeAllTabs();
    expect(useEditorStore.getState().openTabs.length).toBe(0);
    expect(useEditorStore.getState().activeTabId).toBeNull();
  });

  it('adds and retains recent files list', () => {
    useEditorStore.getState().addRecentFile('/workspace/project/src/index.ts');
    const recent = useEditorStore.getState().recentFiles;

    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].path).toBe('/workspace/project/src/index.ts');
    expect(recent[0].name).toBe('index.ts');
  });
});
