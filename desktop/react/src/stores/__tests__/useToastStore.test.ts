import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore } from '../useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty toast list', () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('adds a toast notification with default type', () => {
    const id = useToastStore.getState().addToast('File saved successfully');
    const toasts = useToastStore.getState().toasts;

    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].message).toBe('File saved successfully');
    expect(toasts[0].type).toBe('info');
  });

  it('adds a toast with custom type and removes it explicitly', () => {
    const id = useToastStore.getState().addToast('An error occurred', 'error');
    expect(useToastStore.getState().toasts[0].type).toBe('error');

    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  it('auto-dismisses toast after 3 seconds', () => {
    useToastStore.getState().addToast('Auto dismiss toast');
    expect(useToastStore.getState().toasts.length).toBe(1);

    vi.advanceTimersByTime(3000);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  it('clears all toasts at once', () => {
    useToastStore.getState().addToast('Toast 1');
    useToastStore.getState().addToast('Toast 2');
    expect(useToastStore.getState().toasts.length).toBe(2);

    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
