import { create } from "zustand";
import { type ModuleCatalogItem } from "../types";
import { api } from "../lib/api";

type CatalogStoreState = {
    catalog: ModuleCatalogItem[];
    loaded: boolean;
};

type CatalogStoreActions = {
    fetchCatalog: () => Promise<void>;
};

export const useCatalogStore = create<CatalogStoreState & CatalogStoreActions>()((set) => ({
    catalog: [],
    loaded: false,
    fetchCatalog: async () => {
        const { data } = await api.get<ModuleCatalogItem[]>("/modules");
        set({ catalog: data, loaded: true });
    },
}));
