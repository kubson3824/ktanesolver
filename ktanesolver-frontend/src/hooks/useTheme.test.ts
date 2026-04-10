import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useTheme, useThemeStore, STORAGE_KEY } from './useTheme';

// Reset Zustand store and localStorage between tests to avoid state leakage.
function resetTheme() {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  useThemeStore.setState({ theme: 'manual', isDark: false });
}

describe('useTheme', () => {
  beforeEach(() => {
    resetTheme();
  });

  afterEach(() => {
    resetTheme();
  });

  it('defaults to "manual" when no stored preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('manual');
  });

  it('reads "manual-dark" from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'manual-dark');
    useThemeStore.setState({ theme: 'manual-dark', isDark: true });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('manual-dark');
  });

  it('sets data-theme on documentElement to initial theme', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('manual');
  });

  it('toggleTheme switches from "manual" to "manual-dark"', () => {
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('manual-dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('manual-dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('manual-dark');
  });

  it('toggleTheme switches from "manual-dark" back to "manual"', () => {
    // Set both localStorage AND store so useEffect doesn't override the store.
    localStorage.setItem(STORAGE_KEY, 'manual-dark');
    useThemeStore.setState({ theme: 'manual-dark', isDark: true });
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('manual');
    expect(document.documentElement.getAttribute('data-theme')).toBe('manual');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('manual');
  });

  it('isDark is true when theme is manual-dark', () => {
    localStorage.setItem(STORAGE_KEY, 'manual-dark');
    useThemeStore.setState({ theme: 'manual-dark', isDark: true });
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('isDark is false when theme is manual', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('falls back to "manual" when localStorage contains an unknown value', () => {
    // store is already reset to 'manual' in beforeEach; corrupted localStorage
    // will be treated as 'manual' by the useEffect on mount.
    localStorage.setItem(STORAGE_KEY, 'corrupted-value');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('manual');
  });
});
