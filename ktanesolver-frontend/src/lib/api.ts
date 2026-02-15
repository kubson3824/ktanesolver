import axios from "axios";

export const DEBUG_MODULE_SYNC = import.meta.env.VITE_DEBUG_MODULE_SYNC === "true";

export const debugModuleSync = (...args: unknown[]) => {
  if (!DEBUG_MODULE_SYNC) return;
  console.debug("[module-sync]", ...args);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export const withErrorWrapping = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail =
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message;
      throw new Error(detail);
    }
    throw error;
  }
};
