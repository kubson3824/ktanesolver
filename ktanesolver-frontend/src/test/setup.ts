import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

// Reset theme store before each test to prevent state leakage between test files.
// The store is a Zustand singleton that persists across tests in the same jsdom environment.
beforeEach(async () => {
  try {
    const { useThemeStore } = await import("../hooks/useTheme");
    useThemeStore.setState({ theme: "manual", isDark: false });
  } catch {
    // Module may not be loaded in all test contexts; ignore.
  }
});
