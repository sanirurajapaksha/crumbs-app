import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, PantryItem, Recipe, CommunityPost, Notification } from "../types";
import { loginWithEmail, logout as fbLogout, signupWithEmail, subscribeToAuth, deleteAccount as fbDeleteAccount, sendPasswordReset } from "../api/auth";
import { generateRecipeFromPantry, getCommunityPosts, postCommunityPost } from "../api/mockApi";
import { router } from "expo-router";

export interface StoreState {
    user: User | null;
    authLoading?: boolean;
    pantryItems: PantryItem[];
    favorites: Recipe[];
    myRecipes: Recipe[];
    likedPosts: CommunityPost[];
    communityPosts: CommunityPost[];
    notifications: Notification[];
    hasOnboarded?: boolean;
    // actions
    setUser: (u: User) => void;
    clearUser: () => void;
    // auth actions (centralized access point)
    login: (email: string, password: string) => Promise<User>;
    signup: (name: string, email: string, password: string) => Promise<User>;
    signOut: () => Promise<void>;
    deleteAccount: (password: string) => Promise<void>;
    resetPassword?: (email: string) => Promise<void>;
    startAuthListener: () => void;
    addPantryItem: (item: PantryItem) => void;
    updatePantryItem: (id: string, patch: Partial<PantryItem>) => void;
    removePantryItem: (id: string) => void;
    clearPantry: () => void;
    saveFavorite: (recipe: Recipe) => void;
    removeFavorite: (id: string) => void;
    saveMyRecipe: (recipe: Recipe) => void;
    removeMyRecipe: (id: string) => void;
    likePost: (post: CommunityPost) => void;
    unlikePost: (id: string) => void;
    loadPosts: () => Promise<void>;
    postCommunity: (p: Omit<CommunityPost, "id" | "createdAt" | "likeCount">) => Promise<CommunityPost>;
    generateRecipeMock: (pantry: PantryItem[], options?: any) => Promise<Recipe>;
    setHasOnboarded: () => void;
    // notification actions
    markNotificationAsRead: (id: string) => void;
    markAllNotificationsAsRead: () => void;
    clearAllNotifications: () => void;
    addNotification: (notification: Notification) => void;
}

let unsubscribeAuth: (() => void) | null = null;

const storeCreator: StateCreator<StoreState> = (set: (fn: any) => void, get: () => StoreState) => ({
    user: null,
    pantryItems: [],
    favorites: [],
    myRecipes: [],
    likedPosts: [],
    communityPosts: [],
    notifications: [],
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
    deleteAccount: async (password: string) => {
        set({ authLoading: true });
        try {
            await fbDeleteAccount(password);
            // Clear all user data from store
            set({ 
                user: null,
                pantryItems: [],
                favorites: [],
                myRecipes: [],
                likedPosts: [],
                notifications: [],
            });
            // Redirect to login
            router.replace("/screens/Auth/LoginScreen");
        } finally {
            set({ authLoading: false });
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
    saveMyRecipe: (recipe: Recipe) => {
        const exists = get().myRecipes.some((r: Recipe) => r.id === recipe.id);
        if (!exists) set({ myRecipes: [...get().myRecipes, recipe] });
    },
    removeMyRecipe: (id: string) => set({ myRecipes: get().myRecipes.filter((r: Recipe) => r.id !== id) }),
    likePost: (post: CommunityPost) => {
        const exists = get().likedPosts.some((p: CommunityPost) => p.id === post.id);
        if (!exists) set({ likedPosts: [...get().likedPosts, post] });
    },
    unlikePost: (id: string) => set({ likedPosts: get().likedPosts.filter((p: CommunityPost) => p.id !== id) }),
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
    // Notification actions
    markNotificationAsRead: (id: string) => {
        set({
            notifications: get().notifications.map((n: Notification) => (n.id === id ? { ...n, read: true } : n)),
        });
    },
    markAllNotificationsAsRead: () => {
        set({
            notifications: get().notifications.map((n: Notification) => ({ ...n, read: true })),
        });
    },
    clearAllNotifications: () => {
        set({ notifications: [] });
    },
    addNotification: (notification: Notification) => {
        set({ notifications: [notification, ...get().notifications] });
    },
});

export const useStore = create<StoreState>()(
    persist(storeCreator, {
        name: "crumbs-store",
        version: 1,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state: StoreState) => ({
            pantryItems: state.pantryItems,
            favorites: state.favorites,
            myRecipes: state.myRecipes,
            likedPosts: state.likedPosts,
            notifications: state.notifications,
            user: state.user,
            hasOnboarded: state.hasOnboarded,
        }),
    })
);
