import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, PantryItem, Recipe, CommunityPost, Notification } from "../types";
import {
    loginWithEmail,
    logout as fbLogout,
    signupWithEmail,
    subscribeToAuth,
    deleteAccount as fbDeleteAccount,
    sendPasswordReset,
    updateUserProfileInFirestore,
} from "../api/auth";
import { generateRecipeFromPantry } from "../api/mockApi";
import { generateRecipeWithGemini } from "../api/geminiRecipeApi";
import { router } from "expo-router";
import { create, StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { postCommunityPost, getCommunityPosts } from "../api/post-api";

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
    addBatchPantryItems: (items: PantryItem[]) => void;
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
    postCommunity: (uid: string, post: CommunityPost) => void;
    generateRecipeMock: (pantry: PantryItem[], options?: any) => Promise<Recipe>;
    generateRecipeWithAI: (
        pantry: PantryItem[],
        options?: {
            categoryId?: string[];
            goal?: string;
            servings?: number;
            cookingTimeMax?: number;
        }
    ) => Promise<Recipe>;
    setHasOnboarded: () => void;
    updateUserProfile: (updates: Partial<User>) => Promise<void>;
    // notification actions
    markNotificationAsRead: (id: string) => void;
    markAllNotificationsAsRead: () => void;
    clearAllNotifications: () => void;
    addNotification: (notification: Notification) => void;
}

export interface UtilFunctions {
    loading: boolean;
    error: string | null;
    clearError: () => void;
    setError: (msg: string) => void;
    setLoading: (isLoading: boolean) => void;
}

let unsubscribeAuth: (() => void) | null = null;

export const useUtilFunctions = create<UtilFunctions>()((set) => ({
    loading: false,
    error: null,
    clearError: () => set({ error: null }),
    setError: (msg: string) => set({ error: msg }),
    setLoading: (isLoading: boolean) => set({ loading: isLoading }),
}));

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
            // Preserve existing avatarUrl if present (from persisted store)
            const currentUser = get().user;
            const mergedUser = currentUser?.avatarUrl ? { ...u, avatarUrl: currentUser.avatarUrl } : u;
            set({ user: mergedUser });
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
    resetPassword: async (email: string) => {
        await sendPasswordReset(email);
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
            if (u) {
                const currentUser = get().user;
                const mergedUser = currentUser ? { ...u, avatarUrl: u.avatarUrl, bio: u.bio } : u;
                set({ user: mergedUser });
            } else set({ user: null });
        });
    },
    addPantryItem: (item: PantryItem) => set({ pantryItems: [...get().pantryItems, item] }),
    addBatchPantryItems: (items: PantryItem[]) => set({ pantryItems: [...get().pantryItems, ...items] }),
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
    postCommunity: async (uid: string, post: CommunityPost) => {
        const saved = await postCommunityPost(uid, post);
        set({ communityPosts: [saved, ...get().communityPosts] });
        return saved;
    },
    generateRecipeMock: async (pantry: PantryItem[], options?: any) => {
        return generateRecipeFromPantry(pantry, options);
    },
    generateRecipeWithAI: async (
        pantry: PantryItem[],
        options?: {
            categoryId?: string[];
            goal?: string;
            servings?: number;
            cookingTimeMax?: number;
        }
    ) => {
        try {
            const recipe = await generateRecipeWithGemini(pantry, options);
            // Automatically save to myRecipes
            get().saveMyRecipe(recipe);
            return recipe;
        } catch (error) {
            console.error("Failed to generate recipe with AI:", error);
            throw error;
        }
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
    updateUserProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
            // Handle undefined values (field deletion) by removing them from the merged object
            const updatedUser = { ...currentUser };
            Object.entries(updates).forEach(([key, value]) => {
                if (value === undefined) {
                    delete (updatedUser as any)[key];
                } else {
                    (updatedUser as any)[key] = value;
                }
            });

            // Update local state immediately for instant UI feedback
            set({ user: updatedUser });

            // Persist to Firestore in the background
            try {
                await updateUserProfileInFirestore(currentUser.id, updates);
            } catch (error) {
                console.error("Failed to update user profile in Firestore:", error);
            }
        }
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
