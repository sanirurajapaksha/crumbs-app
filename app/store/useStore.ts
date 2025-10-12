import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { create, StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    deleteAccount as fbDeleteAccount,
    logout as fbLogout,
    loginWithEmail,
    sendPasswordReset,
    signupWithEmail,
    subscribeToAuth,
    updateUserProfileInFirestore,
} from "../api/auth";
import { checkForDuplicates, DuplicateCheckResult, mergePantryItems as mergeItems } from "../api/duplicateDetectionApi";
import { generateRecipeWithGemini } from "../api/geminiRecipeApi";
import { generateRecipeFromPantry } from "../api/mockApi";
import {
    addPantryItemToFirebase,
    clearUserPantryItems,
    deletePantryItemFromFirebase,
    loadUserPantryItems,
    subscribeToPantryItems,
    updatePantryItemInFirebase
} from "../api/pantryFirebaseApi";
import { deleteCommunityPost, likePost as fbLikePost, unlikePost as fbUnlikePost, getCommunityPosts, getUserCommunityPosts, getUserLikedPosts, postCommunityPost, updateCommunityPost } from "../api/post-api";
import { CommunityPost, Notification, PantryItem, Recipe, User } from "../types";

export interface StoreState {
    user: User | null;
    authLoading?: boolean;
    pantryItems: PantryItem[];
    favorites: Recipe[];
    myRecipes: Recipe[];
    likedPosts: CommunityPost[];
    communityPosts: CommunityPost[];
    userCommunityPosts: CommunityPost[];
    notifications: Notification[];
    hasOnboarded?: boolean;
    // Firebase subscriptions
    pantrySubscription?: (() => void) | null;
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
    loadPantryItems: () => Promise<void>;
    addPantryItem: (item: PantryItem) => Promise<void>;
    addBatchPantryItems: (items: PantryItem[]) => Promise<void>;
    addBatchPantryItemsWithDuplicateCheck: (items: PantryItem[]) => Promise<DuplicateCheckResult>;
    updatePantryItem: (id: string, patch: Partial<PantryItem>) => Promise<void>;
    removePantryItem: (id: string) => Promise<void>;
    clearPantry: () => Promise<void>;
    mergePantryItems: (existingId: string, newItem: PantryItem) => Promise<void>;
    saveFavorite: (recipe: Recipe) => void;
    removeFavorite: (id: string) => void;
    saveMyRecipe: (recipe: Recipe) => void;
    removeMyRecipe: (id: string) => void;
    likePost: (postId: string) => Promise<void>;
    unlikePost: (postId: string) => Promise<void>;
    loadLikedPosts: () => Promise<void>;
    loadPosts: () => Promise<void>;
    loadUserPosts: (uid: string) => Promise<void>;
    postCommunity: (uid: string, post: CommunityPost) => void;
    updatePost: (uid: string, postId: string, updates: Partial<CommunityPost>) => Promise<void>;
    deletePost: (uid: string, postId: string) => Promise<void>;
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
    userCommunityPosts: [],
    notifications: [],
    hasOnboarded: false,
    authLoading: false,
    pantrySubscription: null,
    setUser: (u: User) => {
        set({ user: u });
        // Start pantry subscription when user logs in
        if (u && !get().pantrySubscription) {
            const unsubscribe = subscribeToPantryItems(u.id, (items) => {
                set({ pantryItems: items });
            });
            set({ pantrySubscription: unsubscribe });
            // Load user's liked posts
            get().loadLikedPosts();
        }
    },
    clearUser: () => {
        // Clean up pantry subscription when user logs out
        const { pantrySubscription } = get();
        if (pantrySubscription) {
            pantrySubscription();
            set({ pantrySubscription: null });
        }
        set({ user: null, pantryItems: [] });
    },
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
            get().clearUser(); // Use clearUser to clean up subscriptions
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
            // Clear all user data from store and clean up subscriptions
            get().clearUser();
            set({
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
                get().setUser(mergedUser); // Use setUser to trigger pantry subscription
            } else {
                get().clearUser(); // Use clearUser to clean up subscriptions
            }
        });
    },
    loadPantryItems: async () => {
        const { user } = get();
        if (!user) return;
        try {
            const items = await loadUserPantryItems(user.id);
            set({ pantryItems: items });
        } catch (error) {
            console.error('Error loading pantry items:', error);
        }
    },
    addPantryItem: async (item: PantryItem) => {
        const { user } = get();
        if (!user) {
            // Fallback for offline mode
            set({ pantryItems: [...get().pantryItems, item] });
            return;
        }
        try {
            const { id, ...itemData } = item;
            await addPantryItemToFirebase(user.id, itemData);
            // Firebase subscription will update the local state
        } catch (error) {
            console.error('Error adding pantry item:', error);
            // Fallback: add locally if Firebase fails
            set({ pantryItems: [...get().pantryItems, item] });
        }
    },
    addBatchPantryItems: async (items: PantryItem[]) => {
        const { user } = get();
        if (!user) {
            // Fallback for offline mode
            set({ pantryItems: [...get().pantryItems, ...items] });
            return;
        }
        try {
            // Add items one by one to Firebase
            for (const item of items) {
                const { id, ...itemData } = item;
                await addPantryItemToFirebase(user.id, itemData);
            }
            // Firebase subscription will update the local state
        } catch (error) {
            console.error('Error adding batch pantry items:', error);
            // Fallback: add locally if Firebase fails
            set({ pantryItems: [...get().pantryItems, ...items] });
        }
    },
    addBatchPantryItemsWithDuplicateCheck: async (items: PantryItem[]) => {
        const { pantryItems } = get();
        
        try {
            // Check for duplicates using Gemini AI
            console.log('🔍 Checking for duplicates...');
            const duplicateResult = await checkForDuplicates(pantryItems, items);
            
            // Return the result so UI can handle it
            return duplicateResult;
        } catch (error) {
            console.error('Error checking for duplicates:', error);
            // On error, return all as unmatched (safe to add)
            return {
                hasDuplicates: false,
                matches: [],
                unmatchedNewItems: items
            };
        }
    },
    mergePantryItems: async (existingId: string, newItem: PantryItem) => {
        const { user, pantryItems } = get();
        
        const existingItem = pantryItems.find(item => item.id === existingId);
        if (!existingItem) {
            console.error('Existing item not found for merge');
            return;
        }

        // Merge the items
        const mergedItem = mergeItems(existingItem, newItem);
        
        if (!user) {
            // Fallback for offline mode
            set({ 
                pantryItems: pantryItems.map(item => 
                    item.id === existingId ? mergedItem : item
                )
            });
            return;
        }

        try {
            // Update in Firebase
            const { id, ...updates } = mergedItem;
            await updatePantryItemInFirebase(user.id, existingId, updates);
            // Firebase subscription will update the local state
        } catch (error) {
            console.error('Error merging pantry items:', error);
            // Fallback: update locally if Firebase fails
            set({ 
                pantryItems: pantryItems.map(item => 
                    item.id === existingId ? mergedItem : item
                )
            });
        }
    },
    updatePantryItem: async (id: string, patch: Partial<PantryItem>) => {
        const { user } = get();
        if (!user) {
            // Fallback for offline mode
            set({ pantryItems: get().pantryItems.map((p: PantryItem) => (p.id === id ? { ...p, ...patch } : p)) });
            return;
        }
        try {
            await updatePantryItemInFirebase(user.id, id, patch);
            // Firebase subscription will update the local state
        } catch (error) {
            console.error('Error updating pantry item:', error);
            // Fallback: update locally if Firebase fails
            set({ pantryItems: get().pantryItems.map((p: PantryItem) => (p.id === id ? { ...p, ...patch } : p)) });
        }
    },
    removePantryItem: async (id: string) => {
        const { user } = get();
        if (!user) {
            // Fallback for offline mode
            set({ pantryItems: get().pantryItems.filter((p: PantryItem) => p.id !== id) });
            return;
        }
        try {
            await deletePantryItemFromFirebase(user.id, id);
            // Firebase subscription will update the local state
        } catch (error) {
            console.error('Error removing pantry item:', error);
            // Fallback: remove locally if Firebase fails
            set({ pantryItems: get().pantryItems.filter((p: PantryItem) => p.id !== id) });
        }
    },
    clearPantry: async () => {
        const { user } = get();
        if (!user) {
            // Fallback for offline mode
            set({ pantryItems: [] });
            return;
        }
        try {
            await clearUserPantryItems(user.id);
            // Firebase subscription will update the local state
        } catch (error) {
            console.error('Error clearing pantry:', error);
            // Fallback: clear locally if Firebase fails
            set({ pantryItems: [] });
        }
    },
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
    likePost: async (postId: string) => {
        const { user, communityPosts } = get();
        if (!user) return;
        
        // OPTIMISTIC UPDATE: Update UI immediately
        const targetPost = communityPosts.find(p => p.id === postId);
        if (targetPost) {
            // Add to liked posts immediately
            const exists = get().likedPosts.some((p: CommunityPost) => p.id === postId);
            if (!exists) {
                set({ likedPosts: [...get().likedPosts, targetPost] });
            }
            
            // Increment like count immediately
            const updatedPosts = communityPosts.map((post) =>
                post.id === postId
                    ? { ...post, likeCount: (post.likeCount || 0) + 1 }
                    : post
            );
            set({ communityPosts: updatedPosts });
        }
        
        // Sync with Firebase in background
        try {
            await fbLikePost(user.id, postId);
        } catch (error) {
            console.error("Error liking post:", error);
            // ROLLBACK on error: revert optimistic update
            const revertedPosts = communityPosts.map((post) =>
                post.id === postId
                    ? { ...post, likeCount: Math.max((post.likeCount || 0), 0) }
                    : post
            );
            set({ 
                communityPosts: revertedPosts,
                likedPosts: get().likedPosts.filter((p: CommunityPost) => p.id !== postId)
            });
            throw error;
        }
    },
    unlikePost: async (postId: string) => {
        const { user, communityPosts } = get();
        if (!user) return;
        
        // OPTIMISTIC UPDATE: Update UI immediately
        const previousLikedPosts = get().likedPosts;
        const previousCount = communityPosts.find(p => p.id === postId)?.likeCount || 0;
        
        // Remove from liked posts immediately
        set({ likedPosts: get().likedPosts.filter((p: CommunityPost) => p.id !== postId) });
        
        // Decrement like count immediately
        const updatedPosts = communityPosts.map((post) =>
            post.id === postId
                ? { ...post, likeCount: Math.max((post.likeCount || 0) - 1, 0) }
                : post
        );
        set({ communityPosts: updatedPosts });
        
        // Sync with Firebase in background
        try {
            await fbUnlikePost(user.id, postId);
        } catch (error) {
            console.error("Error unliking post:", error);
            // ROLLBACK on error: revert optimistic update
            const revertedPosts = communityPosts.map((post) =>
                post.id === postId
                    ? { ...post, likeCount: previousCount }
                    : post
            );
            set({ 
                communityPosts: revertedPosts,
                likedPosts: previousLikedPosts
            });
            throw error;
        }
    },
    loadLikedPosts: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
            const likedPosts = await getUserLikedPosts(user.id);
            set({ likedPosts });
        } catch (error) {
            console.error("Error loading liked posts:", error);
        }
    },
    loadPosts: async () => {
        const posts = await getCommunityPosts();
        set({ communityPosts: posts });
    },
    loadUserPosts: async (uid: string) => {
        const posts = await getUserCommunityPosts(uid);
        set({ userCommunityPosts: posts });
    },
    postCommunity: async (uid: string, post: CommunityPost) => {
        const saved = await postCommunityPost(uid, post);
        set({ 
            communityPosts: [saved, ...get().communityPosts],
            userCommunityPosts: [saved, ...get().userCommunityPosts]
        });
        return saved;
    },
    updatePost: async (uid: string, postId: string, updates: Partial<CommunityPost>) => {
        try {
            await updateCommunityPost(uid, postId, updates);
            // Update local state
            set({ 
                communityPosts: get().communityPosts.map(post => 
                    post.id === postId ? { ...post, ...updates } : post
                )
            });
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    },
    deletePost: async (uid: string, postId: string) => {
        try {
            await deleteCommunityPost(uid, postId);
            // Update local state
            set({ 
                communityPosts: get().communityPosts.filter(post => post.id !== postId),
                userCommunityPosts: get().userCommunityPosts.filter(post => post.id !== postId)
            });
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
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
        version: 2, // Increment version due to pantry changes
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state: StoreState) => ({
            // pantryItems excluded - now managed through Firebase
            favorites: state.favorites,
            myRecipes: state.myRecipes,
            likedPosts: state.likedPosts,
            notifications: state.notifications,
            user: state.user,
            hasOnboarded: state.hasOnboarded,
        }),
    })
);
