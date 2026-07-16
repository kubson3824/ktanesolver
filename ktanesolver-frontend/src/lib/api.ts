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
    const result = await fn();
    if (result && typeof result === "object" && "reason" in result && typeof result.reason === "string") {
      throw new Error(result.reason);
    }
    return result;
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

export const solveModule = async <TInput, TResponse>(
  roundId: string,
  bombId: string,
  moduleId: string,
  input: TInput,
): Promise<TResponse> =>
  withErrorWrapping(async () => {
    const response = await api.post<TResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input },
    );
    return response.data;
  });
