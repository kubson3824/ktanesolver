import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useTheme, STORAGE_KEY } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to "manual" when no stored preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('manual');
  });

  it('reads "manual-dark" from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'manual-dark');
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
    localStorage.setItem(STORAGE_KEY, 'manual-dark');
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('manual');
    expect(document.documentElement.getAttribute('data-theme')).toBe('manual');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('manual');
  });

  it('isDark is true when theme is manual-dark', () => {
    localStorage.setItem(STORAGE_KEY, 'manual-dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('isDark is false when theme is manual', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('falls back to "manual" when localStorage contains an unknown value', () => {
    localStorage.setItem(STORAGE_KEY, 'corrupted-value');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('manual');
  });
});
