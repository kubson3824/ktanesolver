import { create } from "zustand";
import { type ModuleCatalogItem } from "../types";
import { api, withErrorWrapping } from "../lib/api";

type CatalogStoreState = {
    catalog: ModuleCatalogItem[];
    loaded: boolean;
    loading: boolean;
    error?: string;
};

type CatalogStoreActions = {
    fetchCatalog: () => Promise<void>;
};

export const useCatalogStore = create<CatalogStoreState & CatalogStoreActions>()((set) => ({
    catalog: [],
    loaded: false,
    loading: false,
    error: undefined,
    fetchCatalog: async () => {
        set({ loading: true, error: undefined });
        try {
            const data = await withErrorWrapping(async () => {
                const response = await api.get<ModuleCatalogItem[]>("/api/modules");
                return response.data;
            });
            set({ catalog: data, loaded: true, loading: false, error: undefined });
        } catch (err) {
            console.error("Failed to load module catalog:", err);
            set({
                catalog: [],
                loaded: false,
                loading: false,
                error: err instanceof Error ? err.message : "Failed to load module catalog",
            });
        }
    },
}));
