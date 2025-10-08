// Zustand global store with persistence for pantry & favorites.
// TODO (Firebase Auth): Replace demo user logic inside setUser with real Firebase auth state observer.
// TODO (Backend): Replace in-memory community posts with remote sync.

import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, PantryItem, Recipe, CommunityPost } from "../types";
import { generateRecipeFromPantry, getCommunityPosts, postCommunityPost } from "../api/mockApi";

export interface StoreState {
    user: User | null;
    pantryItems: PantryItem[];
    favorites: Recipe[];
    communityPosts: CommunityPost[];
    hasOnboarded?: boolean;
    // actions
    setUser: (u: User) => void;
    clearUser: () => void;
    addPantryItem: (item: PantryItem) => void;
    updatePantryItem: (id: string, patch: Partial<PantryItem>) => void;
    removePantryItem: (id: string) => void;
    clearPantry: () => void;
    saveFavorite: (recipe: Recipe) => void;
    removeFavorite: (id: string) => void;
    loadPosts: () => Promise<void>;
    postCommunity: (p: Omit<CommunityPost, "id" | "createdAt" | "likeCount">) => Promise<CommunityPost>;
    generateRecipeMock: (pantry: PantryItem[], options?: any) => Promise<Recipe>;
    setHasOnboarded: () => void;
}

const storeCreator: StateCreator<StoreState> = (set: (fn: any) => void, get: () => StoreState) => ({
    user: null,
    pantryItems: [],
    favorites: [],
    communityPosts: [],
    hasOnboarded: false,
    setUser: (u: User) => set({ user: u }),
    clearUser: () => set({ user: null }),
    addPantryItem: (item: PantryItem) => set({ pantryItems: [...get().pantryItems, item] }),
    updatePantryItem: (id: string, patch: Partial<PantryItem>) =>
        set({ pantryItems: get().pantryItems.map((p: PantryItem) => (p.id === id ? { ...p, ...patch } : p)) }),
    removePantryItem: (id: string) => set({ pantryItems: get().pantryItems.filter((p: PantryItem) => p.id !== id) }),
    clearPantry: () => set({ pantryItems: [] }),
    saveFavorite: (recipe: Recipe) => {
        const exists = get().favorites.some((r: Recipe) => r.id === recipe.id);
        if (!exists) set({ favorites: [...get().favorites, recipe] });
    },
    removeFavorite: (id: string) => set({ favorites: get().favorites.filter((r: Recipe) => r.id !== id) }),
    loadPosts: async () => {
        const posts = await getCommunityPosts();
        set({ communityPosts: posts });
    },
    postCommunity: async (p: Omit<CommunityPost, "id" | "createdAt" | "likeCount">) => {
        const saved = await postCommunityPost(p);
        set({ communityPosts: [saved, ...get().communityPosts] });
        return saved;
    },
    generateRecipeMock: async (pantry: PantryItem[], options?: any) => {
        return generateRecipeFromPantry(pantry, options);
    },
    setHasOnboarded: () => set({ hasOnboarded: true }),
});

export const useStore = create<StoreState>()(
    persist(storeCreator, {
        name: "crumbs-store",
        version: 1,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state: StoreState) => ({
            pantryItems: state.pantryItems,
            favorites: state.favorites,
            user: state.user,
            hasOnboarded: state.hasOnboarded,
        }),
    })
);
