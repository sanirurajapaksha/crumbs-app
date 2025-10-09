import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, PantryItem, Recipe, CommunityPost } from "../types";
import { loginWithEmail, logout as fbLogout, signupWithEmail, subscribeToAuth } from "../api/auth";
import { generateRecipeFromPantry, getCommunityPosts, postCommunityPost } from "../api/mockApi";
import { router } from "expo-router";

export interface StoreState {
    user: User | null;
    authLoading?: boolean;
    pantryItems: PantryItem[];
    favorites: Recipe[];
    communityPosts: CommunityPost[];
    hasOnboarded?: boolean;
    // actions
    setUser: (u: User) => void;
    clearUser: () => void;
    // auth actions (centralized access point)
    login: (email: string, password: string) => Promise<User>;
    signup: (name: string, email: string, password: string) => Promise<User>;
    signOut: () => Promise<void>;
    startAuthListener: () => void;
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

let unsubscribeAuth: (() => void) | null = null;

const storeCreator: StateCreator<StoreState> = (set: (fn: any) => void, get: () => StoreState) => ({
    user: null,
    pantryItems: [],
    favorites: [],
    communityPosts: [],
    hasOnboarded: false,
    authLoading: false,
    setUser: (u: User) => set({ user: u }),
    clearUser: () => set({ user: null }),
    login: async (email: string, password: string) => {
        set({ authLoading: true });
        try {
            const u = await loginWithEmail({ email, password });
            set({ user: u });
            if (u) router.replace("/(tabs)");
            return u;
        } finally {
            set({ authLoading: false });
        }
    },
    signup: async (name: string, email: string, password: string) => {
        set({ authLoading: true });
        try {
            const u = await signupWithEmail({ name, email, password });
            set({ user: u });
            if (u) router.replace("/(tabs)");
            return u;
        } finally {
            set({ authLoading: false });
        }
    },
    signOut: async () => {
        set({ authLoading: true });
        try {
            await fbLogout();
            set({ user: null });
        } finally {
            set({ authLoading: false });
            // redirect to login
            router.replace("/screens/Auth/LoginScreen");
        }
    },
    startAuthListener: () => {
        if (unsubscribeAuth) return; // idempotent
        unsubscribeAuth = subscribeToAuth((u) => {
            if (u) set({ user: u });
            else set({ user: null });
        });
    },
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
