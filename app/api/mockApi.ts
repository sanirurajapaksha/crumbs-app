// Mock API layer for demo flows.
// All functions simulate network latency and return deterministic placeholder data.
// TODO: Replace generateRecipeFromPantry with Gemini + Vision powered generation.
// TODO: Replace in-memory community post handling with real backend / Firebase Firestore.

import { CommunityPost, GenerateOptions, PantryItem, Recipe } from "../types";
import { generateFoodImage } from "../utils/imageUtils";

let communityPosts: CommunityPost[] = [];
let pantrySeed: PantryItem[] = [];

function delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

export async function generateRecipeFromPantry(pantryItems: PantryItem[], options?: GenerateOptions): Promise<Recipe> {
    // TODO (Gemini Integration): Send pantryItems + options to model + vision extraction
    await delay(800); // simulate latency
    const proteinBoost = options?.boostProtein ? 10 : 0;
    return {
        id: "mock-recipe-1",
        title: "Protein Packed Veggie Bowl",
        heroImage: "https://placehold.co/600x400?text=Recipe",
        cookTimeMin: 18,
        servings: 2,
        calories_kcal: 540,
        protein_g: 32 + proteinBoost,
        carbs_g: 45,
        fat_g: 18,
        timingTag: "<20min",
        allergyList: ["peanuts"],
        ingredients: [
            { name: "Quinoa", qty: "1 cup" },
            { name: "Chickpeas", qty: "1 can" },
            { name: "Spinach", qty: "2 cups" },
            { name: "Olive Oil", qty: "1 tbsp" },
            { name: "Lemon", qty: "1/2" },
        ],
        steps: [
            { stepNumber: 1, text: "Rinse quinoa and cook in pot (15 min)." },
            { stepNumber: 2, text: "Saute chickpeas + spices 5 min." },
            { stepNumber: 3, text: "Fold in spinach until wilted." },
            { stepNumber: 4, text: "Drizzle lemon & oil, serve warm." },
        ],
        proTips: ["Toast quinoa slightly for nuttier flavor"],
        alternatives: [
            { id: "alt-1", title: "Tofu Power Bowl", protein_g: 40, cookTimeMin: 20 },
            { id: "alt-2", title: "Lentil Quick Bowl", protein_g: 28, cookTimeMin: 15 },
        ],
    };
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
    await delay(200);
    return communityPosts.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function postCommunityPost(post: Omit<CommunityPost, "id" | "createdAt" | "likeCount"> & { id?: string }): Promise<CommunityPost> {
    await delay(150);
    const full: CommunityPost = {
        id: post.id || `post-${Date.now()}`,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        ...post,
    };
    communityPosts.unshift(full);
    return full;
}

export function seedMockData() {
    if (communityPosts.length === 0) {
        communityPosts = [
            {
                id: "seed-1",
                authorId: "demo-user",
                text: "Just made this quick quinoa bowl!",
                tags: ["quick", "high-protein"],
                createdAt: new Date().toISOString(),
                likeCount: 5,
            },
            {
                id: "seed-2",
                authorId: "demo-user2",
                text: "Love pantry cooking",
                tags: ["pantry"],
                createdAt: new Date(Date.now() - 3600_000).toISOString(),
                likeCount: 2,
            },
        ];
    }
    if (pantrySeed.length === 0) {
        const today = new Date();
        pantrySeed = [
                        // Vegetables
            { 
                id: "p1", 
                name: "Broccoli", 
                quantity: "3 heads", 
                category: "vegetables",
                expiryDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
                imageUrl: generateFoodImage("Broccoli", { width: 200, height: 200 })
            },
            { 
                id: "p2", 
                name: "Carrots", 
                quantity: "2 lbs", 
                category: "vegetables",
                expiryDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
                imageUrl: generateFoodImage("Carrots", { width: 200, height: 200 })
            },
            { 
                id: "p3", 
                name: "Spinach", 
                quantity: "1 lb", 
                category: "vegetables",
                expiryDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day (expiring)
                imageUrl: generateFoodImage("Spinach", { width: 200, height: 200 })
            },
            // Fruits
            { 
                id: "p4", 
                name: "Apples", 
                quantity: "6", 
                category: "fruits",
                expiryDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                imageUrl: generateFoodImage("Apples", { width: 200, height: 200 })
            },
            { 
                id: "p5", 
                name: "Bananas", 
                quantity: "1 bunch", 
                category: "fruits",
                expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // expired
                imageUrl: generateFoodImage("Bananas", { width: 200, height: 200 })
            },
            { 
                id: "p6", 
                name: "Blueberries", 
                quantity: "1 pint", 
                category: "fruits",
                expiryDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days
                imageUrl: generateFoodImage("Blueberries", { width: 200, height: 200 })
            },
            // Dairy & Eggs
            { 
                id: "p7", 
                name: "Eggs", 
                quantity: "1 dozen", 
                category: "dairy & eggs",
                expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
                imageUrl: generateFoodImage("Eggs", { width: 200, height: 200 })
            },
            { 
                id: "p8", 
                name: "Milk", 
                quantity: "1 gallon", 
                category: "dairy & eggs",
                expiryDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days (expiring)
                imageUrl: generateFoodImage("Milk", { width: 200, height: 200 })
            },
            // Fruits
            { 
                id: "p4", 
                name: "Apples", 
                quantity: "6", 
                category: "fruits",
                expiryDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            },
            { 
                id: "p5", 
                name: "Bananas", 
                quantity: "1 bunch", 
                category: "fruits",
                expiryDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // expired
            },
            { 
                id: "p6", 
                name: "Blueberries", 
                quantity: "1 pint", 
                category: "fruits",
                expiryDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days
            },
            // Dairy & Eggs
            { 
                id: "p7", 
                name: "Eggs", 
                quantity: "1 dozen", 
                category: "dairy & eggs",
                expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days
            },
            { 
                id: "p8", 
                name: "Milk", 
                quantity: "1 gallon", 
                category: "dairy & eggs",
                expiryDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days (expiring)
            },
        ];
    }
    return { pantry: pantrySeed, posts: communityPosts };
}

export function getSeedPantry() {
    return pantrySeed;
}
