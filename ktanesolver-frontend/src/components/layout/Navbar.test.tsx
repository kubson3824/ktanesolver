import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

vi.mock('../../store/useRoundStore', () => ({
  useRoundStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ currentBomb: null, currentModule: null, clearModule: vi.fn() }),
}));

describe('Navbar theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders a theme toggle button', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('button', { name: 'Enable dark mode' })
    ).toBeInTheDocument();
  });

  it('clicking the toggle sets data-theme to manual-dark', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable dark mode' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('manual-dark');
  });

  it('button label flips to "Enable light mode" after activating dark mode', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable dark mode' }));
    expect(
      screen.getByRole('button', { name: 'Enable light mode' })
    ).toBeInTheDocument();
  });
});
