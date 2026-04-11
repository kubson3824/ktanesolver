import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useTheme, useThemeStore, STORAGE_KEY } from './useTheme';

// Reset Zustand store and localStorage between tests to avoid state leakage.
function resetTheme() {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  useThemeStore.setState({ theme: 'light', isDark: false });
}

describe('useTheme', () => {
  beforeEach(() => {
    resetTheme();
  });

  afterEach(() => {
    resetTheme();
  });

  it('defaults to "light" when no stored preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('reads "dark" from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    useThemeStore.setState({ theme: 'dark', isDark: true });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('adds dark class to documentElement when theme is dark', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    useThemeStore.setState({ theme: 'dark', isDark: true });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not add dark class to documentElement when theme is light', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme switches from "light" to "dark"', () => {
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('toggleTheme switches from "dark" back to "light"', () => {
    // Set both localStorage AND store so useEffect doesn't override the store.
    localStorage.setItem(STORAGE_KEY, 'dark');
    useThemeStore.setState({ theme: 'dark', isDark: true });
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('isDark is true when theme is dark', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    useThemeStore.setState({ theme: 'dark', isDark: true });
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('isDark is false when theme is light', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('falls back to "light" when localStorage contains an unknown value', () => {
    // store is already reset to 'light' in beforeEach; corrupted localStorage
    // will be treated as 'light' by the useEffect on mount.
    localStorage.setItem(STORAGE_KEY, 'corrupted-value');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });
});
