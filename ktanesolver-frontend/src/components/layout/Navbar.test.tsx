import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

const mockStore = { currentBomb: null, currentModule: null, clearModule: vi.fn() };

vi.mock('../../store/useRoundStore', () => ({
  useRoundStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

describe('Navbar theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
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

  it('clicking the toggle adds dark class to <html>', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable dark mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
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

  it('shows "Enable light mode" label when dark mode is already active', () => {
    localStorage.setItem('ktane-theme', 'dark');
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('button', { name: 'Enable light mode' })
    ).toBeInTheDocument();
  });

  it('clicking toggle removes dark class when already in dark mode', () => {
    localStorage.setItem('ktane-theme', 'dark');
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable light mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
