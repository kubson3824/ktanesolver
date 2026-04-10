import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from './useTheme';

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
    localStorage.setItem('ktane-theme', 'manual-dark');
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
    expect(localStorage.getItem('ktane-theme')).toBe('manual-dark');
  });

  it('toggleTheme switches from "manual-dark" back to "manual"', () => {
    localStorage.setItem('ktane-theme', 'manual-dark');
    const { result } = renderHook(() => useTheme());

    act(() => { result.current.toggleTheme(); });

    expect(result.current.theme).toBe('manual');
    expect(document.documentElement.getAttribute('data-theme')).toBe('manual');
    expect(localStorage.getItem('ktane-theme')).toBe('manual');
  });
});
