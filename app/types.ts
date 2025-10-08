// Global app domain types
// TODO: Consider splitting into smaller files if this grows.

export interface User {
    id: string;
    name: string;
    email: string;
    dietaryPreferences?: string[];
    createdAt?: string;
}
export interface PantryItem {
    id: string;
    userId?: string;
    name: string;
    category?: string;
    quantity?: string;
    expiryDate?: string | null;
    addedAt?: string;
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
}

export type GenerateOptions = { boostProtein?: boolean; timeConstraintMin?: number };
