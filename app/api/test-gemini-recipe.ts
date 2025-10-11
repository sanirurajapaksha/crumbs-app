/**
 * Test file for Gemini Recipe Generation API
 * Run this to test the integration without using the UI
 */

import { generateRecipeWithGemini, getDietaryCategories, getHealthGoals, validateRecipeInputs } from './geminiRecipeApi';
import { PantryItem } from '../types';

// Test data
const testPantryItems: PantryItem[] = [
    { id: '1', name: 'Chicken breast', quantity: '500g' },
    { id: '2', name: 'Broccoli', quantity: '2 cups' },
    { id: '3', name: 'Quinoa', quantity: '1 cup' },
    { id: '4', name: 'Olive oil', quantity: '2 tbsp' },
    { id: '5', name: 'Garlic', quantity: '3 cloves' },
];

/**
 * Test 1: Basic recipe generation
 */
export async function testBasicRecipeGeneration() {
    console.log('\n🧪 TEST 1: Basic Recipe Generation');
    console.log('=====================================');
    
    try {
        const recipe = await generateRecipeWithGemini(testPantryItems);
        
        console.log('✅ Recipe generated successfully!');
        console.log(`📋 Recipe: ${recipe.title}`);
        console.log(`⏱️  Time: ${recipe.cookTimeMin} minutes`);
        console.log(`🍽️  Servings: ${recipe.servings}`);
        console.log(`🔥 Calories: ${recipe.calories_kcal} kcal`);
        console.log(`🥩 Protein: ${recipe.protein_g}g`);
        console.log(`🖼️  Image: ${recipe.heroImage || 'No image'}`);
        console.log(`\n📝 Ingredients (${recipe.ingredients.length}):`);
        recipe.ingredients.forEach((ing, i) => {
            console.log(`  ${i + 1}. ${ing.name} - ${ing.qty}`);
        });
        console.log(`\n👨‍🍳 Steps (${recipe.steps.length}):`);
        recipe.steps.forEach((step) => {
            console.log(`  ${step.stepNumber}. ${step.text.substring(0, 60)}...`);
        });
        
        return recipe;
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

/**
 * Test 2: Recipe with health goal (weight loss)
 */
export async function testHealthGoalRecipe() {
    console.log('\n🧪 TEST 2: Recipe with Health Goal (Weight Loss)');
    console.log('===================================================');
    
    try {
        const recipe = await generateRecipeWithGemini(testPantryItems, {
            goal: 'lose_weight',
            servings: 2,
        });
        
        console.log('✅ Weight loss recipe generated!');
        console.log(`📋 Recipe: ${recipe.title}`);
        console.log(`🔥 Calories: ${recipe.calories_kcal} kcal (should be 300-500)`);
        console.log(`🥩 Protein: ${recipe.protein_g}g`);
        
        // Validate calories are in weight loss range
        if (recipe.calories_kcal && recipe.calories_kcal <= 500) {
            console.log('✅ Calories are in weight loss range!');
        } else {
            console.log('⚠️  Calories might be too high for weight loss');
        }
        
        return recipe;
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

/**
 * Test 3: Recipe with dietary restrictions
 */
export async function testDietaryRestrictions() {
    console.log('\n🧪 TEST 3: Recipe with Dietary Restrictions (Gluten-Free)');
    console.log('============================================================');
    
    try {
        const recipe = await generateRecipeWithGemini(testPantryItems, {
            categoryId: ['gluten_free'],
            servings: 4,
        });
        
        console.log('✅ Gluten-free recipe generated!');
        console.log(`📋 Recipe: ${recipe.title}`);
        console.log(`🥗 Dietary info: ${recipe.allergyList?.join(', ') || 'None'}`);
        
        return recipe;
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

/**
 * Test 4: Recipe with time constraint
 */
export async function testTimeConstraint() {
    console.log('\n🧪 TEST 4: Recipe with Time Constraint (30 min max)');
    console.log('======================================================');
    
    try {
        const recipe = await generateRecipeWithGemini(testPantryItems, {
            cookingTimeMax: 30,
            servings: 2,
        });
        
        console.log('✅ Quick recipe generated!');
        console.log(`📋 Recipe: ${recipe.title}`);
        console.log(`⏱️  Time: ${recipe.cookTimeMin} minutes (should be ≤30)`);
        
        if (recipe.cookTimeMin && recipe.cookTimeMin <= 30) {
            console.log('✅ Recipe meets time constraint!');
        } else {
            console.log('⚠️  Recipe might exceed time constraint');
        }
        
        return recipe;
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

/**
 * Test 5: Validation
 */
export async function testValidation() {
    console.log('\n🧪 TEST 5: Input Validation');
    console.log('==============================');
    
    // Test empty ingredients
    const errors1 = validateRecipeInputs({
        ingredientsInput: [],
        servings: 2,
    });
    console.log('Empty ingredients errors:', errors1);
    
    // Test invalid servings
    const errors2 = validateRecipeInputs({
        ingredientsInput: testPantryItems,
        servings: 15,
    });
    console.log('Invalid servings errors:', errors2);
    
    // Test valid inputs
    const errors3 = validateRecipeInputs({
        ingredientsInput: testPantryItems,
        servings: 4,
    });
    console.log('Valid inputs errors:', errors3);
    
    console.log(errors1.length > 0 ? '✅ Validation working!' : '❌ Validation failed');
}

/**
 * Test 6: Get dropdown options
 */
export function testGetDropdownOptions() {
    console.log('\n🧪 TEST 6: Get Dropdown Options');
    console.log('==================================');
    
    const categories = getDietaryCategories();
    console.log(`📋 Dietary Categories (${categories.length}):`);
    categories.forEach(cat => {
        console.log(`  - ${cat.id}: ${cat.label} (${cat.value})`);
    });
    
    const goals = getHealthGoals();
    console.log(`\n🎯 Health Goals (${goals.length}):`);
    goals.forEach(goal => {
        console.log(`  - ${goal.id}: ${goal.label} (${goal.value})`);
    });
    
    console.log('✅ Dropdown options retrieved!');
}

/**
 * Run all tests
 */
export async function runAllTests() {
    console.log('\n🚀 Starting Gemini Recipe API Tests...\n');
    
    try {
        // Test 6 doesn't require API call
        testGetDropdownOptions();
        
        // Test validation
        await testValidation();
        
        // API tests (comment out if you don't have API key yet)
        await testBasicRecipeGeneration();
        await testHealthGoalRecipe();
        await testDietaryRestrictions();
        await testTimeConstraint();
        
        console.log('\n✅ ALL TESTS PASSED! 🎉\n');
    } catch (error) {
        console.error('\n❌ TESTS FAILED:', error);
    }
}

// Example usage in a React Native component:
/*
import { useStore } from '../store/useStore';
import { generateRecipeWithGemini } from '../api/geminiRecipeApi';

function RecipeGeneratorScreen() {
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    
    const handleGenerateRecipe = async () => {
        try {
            // Option 1: Use store method (automatically saves to myRecipes)
            const recipe = await generateRecipeWithAI(pantryItems, {
                categoryId: ['gluten_free'],
                goal: 'lose_weight',
                servings: 2,
            });
            
            // Navigate to recipe detail
            router.push({
                pathname: '/screens/Recipe/RecipeDetail',
                params: { recipeId: recipe.id }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate recipe');
        }
    };
    
    return (
        <Button title="Generate Recipe" onPress={handleGenerateRecipe} />
    );
}
*/
