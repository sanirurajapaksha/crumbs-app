/**
 * Gemini Recipe Generation API
 * Integrated directly into the React Native app without a separate FastAPI backend
 */

import { PantryItem, Recipe } from '../types';
import { AIProcessingError, ErrorType } from '../utils/errorHandling';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY environment variable is not set. Recipe generation will fail.');
}

// ============================================================================
// Type Definitions (matching FastAPI backend structure)
// ============================================================================

export enum DietaryCategory {
    VEGAN = 'Vegan',
    VEGETARIAN = 'Vegetarian',
    GLUTEN_FREE = 'Gluten-Free',
    DAIRY_FREE = 'Dairy-Free',
    LOW_CARB = 'Low-Carb',
    KETO = 'Keto',
    PALEO = 'Paleo',
    LOW_COST = 'Low-Cost',
}

export enum HealthGoal {
    LOSE_WEIGHT = 'Lose Weight',
    GAIN_WEIGHT = 'Gain Weight',
    BUILD_MUSCLE = 'Build Muscle',
    CONTROL_BLOOD_SUGAR = 'Control Blood Sugar',
    CONTROL_CHOLESTEROL = 'Control Cholesterol',
    HEART_HEALTH = 'Heart Health',
    GENERAL_WELLNESS = 'General Wellness',
}

export interface IngredientInput {
    name: string;
    quantity?: number | string;
}

export interface RecipeRequest {
    ingredients: IngredientInput[];
    dietary_categories?: DietaryCategory[];
    health_goal?: HealthGoal;
    servings?: number;
    cooking_time_max?: number;
}

export interface NutritionalInfo {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sodium_mg?: number;
}

export interface RecipeIngredient {
    name: string;
    amount: string;
}

export interface RecipeInstruction {
    step_number: number;
    instruction: string;
    duration_minutes?: number;
}

export interface GeminiRecipeResponse {
    recipe_name: string;
    cuisine_type?: string;
    description: string;
    prep_time_minutes: number;
    cook_time_minutes: number;
    total_time_minutes: number;
    servings: number;
    difficulty_level: string;
    ingredients: RecipeIngredient[];
    instructions: RecipeInstruction[];
    nutritional_info: NutritionalInfo;
    tags: string[];
    dietary_info: string[];
    health_benefits?: string[];
    cooking_tips?: string[];
    hero_image_url?: string;
}

// ============================================================================
// Field Mapping Constants (for mobile app integration)
// ============================================================================

export const CATEGORY_ID_TO_API: Record<string, DietaryCategory> = {
    'vegan': DietaryCategory.VEGAN,
    'vegetarian': DietaryCategory.VEGETARIAN,
    'gluten_free': DietaryCategory.GLUTEN_FREE,
    'dairy_free': DietaryCategory.DAIRY_FREE,
    'low_carb': DietaryCategory.LOW_CARB,
    'keto': DietaryCategory.KETO,
    'paleo': DietaryCategory.PALEO,
    'low_cost': DietaryCategory.LOW_COST,
};

export const GOAL_ID_TO_API: Record<string, HealthGoal> = {
    'lose_weight': HealthGoal.LOSE_WEIGHT,
    'gain_weight': HealthGoal.GAIN_WEIGHT,
    'build_muscle': HealthGoal.BUILD_MUSCLE,
    'blood_sugar': HealthGoal.CONTROL_BLOOD_SUGAR,
    'cholesterol': HealthGoal.CONTROL_CHOLESTEROL,
    'heart_health': HealthGoal.HEART_HEALTH,
    'general': HealthGoal.GENERAL_WELLNESS,
};

// ============================================================================
// Transformation Utilities
// ============================================================================

/**
 * Convert pantry items to ingredient inputs for API
 */
export function pantryItemsToIngredients(items: PantryItem[]): IngredientInput[] {
    return items.map(item => ({
        name: item.name,
        quantity: item.quantity || undefined,
    }));
}

/**
 * Transform mobile app request to Gemini API format
 */
export function transformToApiFormat(inputs: {
    ingredientsInput: PantryItem[];
    categoryId?: string[];
    goal?: string;
    servings?: number;
    cookingTimeMax?: number;
}): RecipeRequest {
    return {
        ingredients: pantryItemsToIngredients(inputs.ingredientsInput),
        dietary_categories: inputs.categoryId?.map(id => CATEGORY_ID_TO_API[id]).filter(Boolean) || [],
        health_goal: inputs.goal ? GOAL_ID_TO_API[inputs.goal] : undefined,
        servings: inputs.servings || 2,
        cooking_time_max: inputs.cookingTimeMax,
    };
}

/**
 * Convert Gemini recipe response to app's Recipe type
 */
export function convertGeminiResponseToRecipe(geminiRecipe: GeminiRecipeResponse): Recipe {
    return {
        id: `gemini-${Date.now()}`,
        title: geminiRecipe.recipe_name,
        heroImage: geminiRecipe.hero_image_url || undefined,
        cookTimeMin: geminiRecipe.total_time_minutes,
        servings: geminiRecipe.servings,
        calories_kcal: geminiRecipe.nutritional_info.calories_kcal,
        protein_g: geminiRecipe.nutritional_info.protein_g,
        carbs_g: geminiRecipe.nutritional_info.carbs_g,
        fat_g: geminiRecipe.nutritional_info.fat_g,
        isVerified: true,
        timingTag: `${geminiRecipe.total_time_minutes} min`,
        allergyList: geminiRecipe.tags || [],
        ingredients: geminiRecipe.ingredients.map(ing => ({
            name: ing.name,
            qty: ing.amount,
        })),
        steps: geminiRecipe.instructions.map(inst => ({
            stepNumber: inst.step_number,
            text: inst.instruction,
        })),
        proTips: geminiRecipe.cooking_tips || [],
    };
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build the recipe prompt for Gemini with health-goal specific constraints
 */
function buildRecipePrompt(request: RecipeRequest): string {
    const ingredientsList = request.ingredients
        .map(ing => `- ${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`)
        .join('\n');

    const dietaryText = request.dietary_categories && request.dietary_categories.length > 0
        ? `\n\nDIETARY REQUIREMENTS: ${request.dietary_categories.join(', ')}`
        : '';

    let healthGoalConstraints = '';
    if (request.health_goal) {
        switch (request.health_goal) {
            case HealthGoal.LOSE_WEIGHT:
                healthGoalConstraints = `
HEALTH GOAL: Weight Loss
- Target: 300-500 calories per serving
- Focus: LOW CALORIE, high fiber, lean proteins
- Avoid: heavy sauces, deep-frying, excessive oils
- Cooking methods: grilling, baking, steaming, air-frying`;
                break;
            case HealthGoal.BUILD_MUSCLE:
                healthGoalConstraints = `
HEALTH GOAL: Muscle Building
- Target: 30-40g protein per serving
- Focus: HIGH PROTEIN, complex carbs, healthy fats
- Include: lean meats, eggs, legumes, whole grains
- Cooking methods: grilling, baking, stir-frying`;
                break;
            case HealthGoal.CONTROL_BLOOD_SUGAR:
                healthGoalConstraints = `
HEALTH GOAL: Blood Sugar Control
- Focus: LOW GLYCEMIC INDEX foods, high fiber
- Avoid: refined sugars, white flour, excessive carbs
- Include: whole grains, lean proteins, non-starchy vegetables
- Balance: protein + fiber in every meal`;
                break;
            case HealthGoal.CONTROL_CHOLESTEROL:
                healthGoalConstraints = `
HEALTH GOAL: Cholesterol Control
- Focus: LOW SATURATED FAT, high omega-3s
- Avoid: butter, cream, fatty meats, processed foods
- Include: oats, nuts, fatty fish, olive oil, vegetables
- Cooking methods: steaming, grilling, baking`;
                break;
            case HealthGoal.BUILD_MUSCLE:
                healthGoalConstraints = `
HEALTH GOAL: Muscle Building
- Target: 30-40g protein per serving
- Focus: HIGH PROTEIN sources, complex carbs
- Include: lean meats, eggs, legumes, whole grains`;
                break;
            case HealthGoal.HEART_HEALTH:
                healthGoalConstraints = `
HEALTH GOAL: Heart Health
- Focus: LOW SODIUM, omega-3 fatty acids, fiber
- Include: whole grains, leafy greens, berries, nuts, fatty fish
- Avoid: excessive salt, trans fats, processed foods`;
                break;
            default:
                healthGoalConstraints = `
HEALTH GOAL: General Wellness
- Focus: Balanced nutrition, variety of nutrients
- Include: diverse vegetables, lean proteins, whole grains`;
        }
    }

    const timingConstraint = request.cooking_time_max
        ? `\n\nTIME CONSTRAINT: Recipe must be completable in ${request.cooking_time_max} minutes or less (prep + cooking).`
        : '';

    return `You are a professional chef and nutritionist. Create a detailed, healthy recipe using the following ingredients.

AVAILABLE INGREDIENTS:
${ingredientsList}
${dietaryText}
${healthGoalConstraints}
${timingConstraint}

SERVINGS: ${request.servings || 2}

Generate a complete recipe with accurate nutritional information. Return ONLY valid JSON (no markdown, no code fences) in this EXACT structure:

{
  "recipe_name": "Appetizing Recipe Name",
  "cuisine_type": "Italian/Asian/Mexican/etc",
  "description": "Brief description of the dish and its flavors",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "total_time_minutes": 45,
  "servings": ${request.servings || 2},
  "difficulty_level": "Easy/Medium/Hard",
  "ingredients": [
    {"name": "ingredient 1", "amount": "2 cups"},
    {"name": "ingredient 2", "amount": "1 tbsp"}
  ],
  "instructions": [
    {"step_number": 1, "instruction": "Detailed instruction text", "duration_minutes": 5},
    {"step_number": 2, "instruction": "Next step", "duration_minutes": 10}
  ],
  "nutritional_info": {
    "calories_kcal": 350,
    "protein_g": 25,
    "carbs_g": 40,
    "fat_g": 12,
    "fiber_g": 8,
    "sodium_mg": 450
  },
  "tags": ["quick", "healthy", "family-friendly"],
  "dietary_info": ["gluten-free", "dairy-free"],
  "health_benefits": ["High in protein", "Good source of fiber"],
  "cooking_tips": ["Tip 1", "Tip 2"]
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown formatting, no code fences.`;
}

// ============================================================================
// Gemini API Integration
// ============================================================================

/**
 * Call Google Gemini API to generate recipe
 */
async function callGeminiAPI(prompt: string): Promise<string> {
    if (!GOOGLE_API_KEY) {
        throw new AIProcessingError(
            ErrorType.API,
            'Google API key not configured',
            'Please add EXPO_PUBLIC_GOOGLE_API_KEY to your .env file'
        );
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new AIProcessingError(
                ErrorType.API,
                `Gemini API error: ${response.status}`,
                JSON.stringify(errorData)
            );
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new AIProcessingError(
                ErrorType.PROCESSING,
                'No response from Gemini',
                'API returned empty candidates array'
            );
        }

        const content = data.candidates[0].content.parts[0].text;
        return content;
    } catch (error) {
        if (error instanceof AIProcessingError) {
            throw error;
        }
        throw new AIProcessingError(
            ErrorType.API,
            'Failed to call Gemini API',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

/**
 * Parse Gemini's JSON response (handling markdown code fences if present)
 */
function parseGeminiResponse(responseText: string): GeminiRecipeResponse {
    try {
        // Remove markdown code fences if present
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        const parsed = JSON.parse(cleanedText);
        return parsed as GeminiRecipeResponse;
    } catch (error) {
        throw new AIProcessingError(
            ErrorType.PARSING,
            'Failed to parse recipe JSON',
            `Invalid JSON from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

// ============================================================================
// Image Generation (Pollinations.AI)
// ============================================================================

/**
 * Generate hero image using Pollinations.AI (free, no API key required)
 */
export async function generateRecipeImage(recipeName: string): Promise<string | null> {
    try {
        const prompt = encodeURIComponent(
            `Professional food photography of ${recipeName}, high resolution, appetizing, natural lighting, restaurant quality, delicious`
        );
        
        // Pollinations.AI URL-based API (returns image directly)
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=768&nologo=true&seed=${Date.now()}`;
        
        // Test if the image is accessible
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
            return imageUrl;
        }
        
        console.warn('Pollinations.AI image generation failed, using placeholder');
        return null;
    } catch (error) {
        console.error('Error generating recipe image:', error);
        return null;
    }
}

// ============================================================================
// Main Recipe Generation Function
// ============================================================================

/**
 * Generate a recipe from pantry items using Google Gemini AI
 * This is the main function to call from your app
 */
export async function generateRecipeWithGemini(
    pantryItems: PantryItem[],
    options?: {
        categoryId?: string[];
        goal?: string;
        servings?: number;
        cookingTimeMax?: number;
    }
): Promise<Recipe> {
    try {
        // Validate inputs
        if (!pantryItems || pantryItems.length === 0) {
            throw new AIProcessingError(
                ErrorType.VALIDATION,
                'No ingredients provided',
                'Please add at least one ingredient to your pantry'
            );
        }

        // Transform to API format
        const request = transformToApiFormat({
            ingredientsInput: pantryItems,
            categoryId: options?.categoryId,
            goal: options?.goal,
            servings: options?.servings,
            cookingTimeMax: options?.cookingTimeMax,
        });

        // Build prompt
        const prompt = buildRecipePrompt(request);

        // Call Gemini API
        console.log('🧠 Calling Gemini API for recipe generation...');
        const responseText = await callGeminiAPI(prompt);

        // Parse response
        const geminiRecipe = parseGeminiResponse(responseText);

        // Generate hero image
        console.log('🎨 Generating recipe image...');
        const heroImageUrl = await generateRecipeImage(geminiRecipe.recipe_name);
        if (heroImageUrl) {
            geminiRecipe.hero_image_url = heroImageUrl;
        }

        // Convert to app's Recipe type
        const recipe = convertGeminiResponseToRecipe(geminiRecipe);

        console.log('✅ Recipe generated successfully:', recipe.title);
        return recipe;
    } catch (error) {
        console.error('❌ Recipe generation failed:', error);
        
        if (error instanceof AIProcessingError) {
            throw error;
        }
        
        throw new AIProcessingError(
            ErrorType.UNKNOWN,
            'Failed to generate recipe',
            error instanceof Error ? error.message : 'Unknown error occurred'
        );
    }
}

// ============================================================================
// Helper Functions for Validation
// ============================================================================

/**
 * Get all available dietary categories
 */
export function getDietaryCategories(): { id: string; label: string; value: DietaryCategory }[] {
    return [
        { id: 'vegan', label: 'Vegan', value: DietaryCategory.VEGAN },
        { id: 'vegetarian', label: 'Vegetarian', value: DietaryCategory.VEGETARIAN },
        { id: 'gluten_free', label: 'Gluten Free', value: DietaryCategory.GLUTEN_FREE },
        { id: 'dairy_free', label: 'Dairy Free', value: DietaryCategory.DAIRY_FREE },
        { id: 'low_carb', label: 'Low Carb', value: DietaryCategory.LOW_CARB },
        { id: 'keto', label: 'Keto', value: DietaryCategory.KETO },
        { id: 'paleo', label: 'Paleo', value: DietaryCategory.PALEO },
        { id: 'low_cost', label: 'Low Cost', value: DietaryCategory.LOW_COST },
    ];
}

/**
 * Get all available health goals
 */
export function getHealthGoals(): { id: string; label: string; value: HealthGoal }[] {
    return [
        { id: 'lose_weight', label: 'Lose Weight', value: HealthGoal.LOSE_WEIGHT },
        { id: 'gain_weight', label: 'Gain Weight', value: HealthGoal.GAIN_WEIGHT },
        { id: 'build_muscle', label: 'Build Muscle', value: HealthGoal.BUILD_MUSCLE },
        { id: 'blood_sugar', label: 'Control Blood Sugar', value: HealthGoal.CONTROL_BLOOD_SUGAR },
        { id: 'cholesterol', label: 'Control Cholesterol', value: HealthGoal.CONTROL_CHOLESTEROL },
        { id: 'heart_health', label: 'Heart Health', value: HealthGoal.HEART_HEALTH },
        { id: 'general', label: 'General Wellness', value: HealthGoal.GENERAL_WELLNESS },
    ];
}

/**
 * Validate recipe generation inputs
 */
export function validateRecipeInputs(inputs: {
    ingredientsInput: PantryItem[];
    categoryId?: string[];
    goal?: string;
    servings?: number;
}): string[] {
    const errors: string[] = [];

    // Check ingredients
    if (!inputs.ingredientsInput || inputs.ingredientsInput.length === 0) {
        errors.push('Please add at least one ingredient');
    }

    // Validate ingredient names
    inputs.ingredientsInput?.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
            errors.push(`Ingredient ${index + 1} has no name`);
        }
    });

    // Validate servings
    if (inputs.servings !== undefined && (inputs.servings < 1 || inputs.servings > 10)) {
        errors.push('Servings must be between 1 and 10');
    }

    return errors;
}
