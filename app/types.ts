// Global app domain types
// TODO: Consider splitting into smaller files if this grows.

export interface Comment {
    id: string;
    name: string;
    when: string;
    text: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    dietaryPreferences?: string[];
    createdAt?: string;
    bio?: string;
    joinYear?: string;
    avatarUrl?: string;
}
export interface PantryItem {
    id: string;
    userId?: string;
    name: string;
    category?: string;
    quantity?: string;
    expiryDate?: string | null;
    addedAt?: string;
    imageUrl?: string;
}
export interface RecipeStep {
    stepNumber: number;
    text: string;
    image?: string;
}
export interface Recipe {
    id: string;
    title: string;
    heroImage?: string;
    cookTimeMin?: number;
    servings?: number;
    calories_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    isVerified?: boolean;
    timingTag?: string;
    allergyList?: string[];
    ingredients: { name: string; qty?: string }[];
    steps: RecipeStep[];
    proTips?: string[];
    alternatives?: { id: string; title: string; protein_g?: number; cookTimeMin?: number }[];
}
export interface CommunityPost {
    id: string;
    authorId: string;
    imageURL?: string;
    text: string;
    tags?: string[];
    createdAt?: string;
    likeCount?: number;
    comments?: Comment[];
}

export type NotificationType = "recipe" | "community" | "system" | "like";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    read: boolean;
    image?: string;
}

export type GenerateOptions = { boostProtein?: boolean; timeConstraintMin?: number };
