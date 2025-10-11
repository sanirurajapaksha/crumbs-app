# 🤖 Gemini AI Recipe Generation - Integration Guide

## 📋 Overview

This guide explains how the Google Gemini AI recipe generation has been integrated directly into your React Native app, eliminating the need for a separate FastAPI backend.

---

## 🎯 What Was Integrated

### Core Components

1. **`app/api/geminiRecipeApi.ts`** - Main API service
   - Google Gemini 2.0-flash integration
   - Pollinations.AI image generation
   - Field mapping utilities
   - Validation helpers

2. **`app/store/useStore.ts`** - Updated with new method
   - `generateRecipeWithAI()` - Generate and auto-save recipes

3. **Example Screens**
   - `app/screens/Recipe/AIRecipeGeneratorScreen.tsx` - Full UI example
   - `app/api/test-gemini-recipe.ts` - Test suite

---

## 🚀 Quick Start

### 1. Get Your Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key (free tier available)
3. Copy the key

### 2. Add to Environment

Edit `.env`:
```env
EXPO_PUBLIC_GOOGLE_API_KEY=your_actual_api_key_here
```

### 3. Restart Expo

```powershell
# Stop the current server (Ctrl+C)
npm start
```

---

## 📱 Usage in Your App

### Option 1: Use the Store Method (Recommended)

```typescript
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

function MyRecipeScreen() {
    const router = useRouter();
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGenerateRecipe = async () => {
        setIsGenerating(true);
        
        try {
            const recipe = await generateRecipeWithAI(pantryItems, {
                categoryId: ['gluten_free', 'low_cost'],
                goal: 'lose_weight',
                servings: 2,
                cookingTimeMax: 30,
            });
            
            // Recipe is automatically saved to myRecipes!
            router.push({
                pathname: '/screens/Recipe/RecipeDetail',
                params: { recipeId: recipe.id }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate recipe');
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <Button 
            title={isGenerating ? "Generating..." : "Generate Recipe"}
            onPress={handleGenerateRecipe}
            disabled={isGenerating}
        />
    );
}
```

### Option 2: Direct API Call

```typescript
import { generateRecipeWithGemini } from '../api/geminiRecipeApi';
import { PantryItem } from '../types';

async function generateCustomRecipe(items: PantryItem[]) {
    try {
        const recipe = await generateRecipeWithGemini(items, {
            categoryId: ['vegan'],
            goal: 'build_muscle',
            servings: 4,
        });
        
        console.log('Recipe:', recipe);
        return recipe;
    } catch (error) {
        console.error('Generation failed:', error);
    }
}
```

---

## 🎨 Field Mapping Reference

### Dietary Categories

Use these IDs in your UI:

```typescript
const CATEGORY_OPTIONS = [
    { id: 'vegan', label: 'Vegan' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'gluten_free', label: 'Gluten Free' },
    { id: 'dairy_free', label: 'Dairy Free' },
    { id: 'low_carb', label: 'Low Carb' },
    { id: 'keto', label: 'Keto' },
    { id: 'paleo', label: 'Paleo' },
    { id: 'low_cost', label: 'Low Cost' },
];
```

### Health Goals

```typescript
const GOAL_OPTIONS = [
    { id: 'lose_weight', label: 'Lose Weight' },
    { id: 'gain_weight', label: 'Gain Weight' },
    { id: 'build_muscle', label: 'Build Muscle' },
    { id: 'blood_sugar', label: 'Control Blood Sugar' },
    { id: 'cholesterol', label: 'Control Cholesterol' },
    { id: 'heart_health', label: 'Heart Health' },
    { id: 'general', label: 'General Wellness' },
];
```

**Or use the helper functions:**

```typescript
import { getDietaryCategories, getHealthGoals } from '../api/geminiRecipeApi';

const categories = getDietaryCategories(); // Returns array with id, label, value
const goals = getHealthGoals(); // Returns array with id, label, value
```

---

## 🔍 Request Options

```typescript
interface RecipeOptions {
    categoryId?: string[];      // Dietary restrictions
    goal?: string;              // Health goal
    servings?: number;          // Number of servings (1-10)
    cookingTimeMax?: number;    // Max total time in minutes
}
```

### Examples

```typescript
// Quick healthy meal
await generateRecipeWithAI(pantryItems, {
    goal: 'lose_weight',
    servings: 2,
    cookingTimeMax: 30
});

// Family dinner with restrictions
await generateRecipeWithAI(pantryItems, {
    categoryId: ['gluten_free', 'dairy_free'],
    servings: 4
});

// Muscle building meal
await generateRecipeWithAI(pantryItems, {
    goal: 'build_muscle',
    servings: 1
});
```

---

## 📊 Response Structure

The API returns a `Recipe` object matching your app's type:

```typescript
interface Recipe {
    id: string;                    // Unique ID
    title: string;                 // Recipe name
    heroImage?: string;            // Generated image URL
    cookTimeMin?: number;          // Total time
    servings?: number;             // Number of servings
    calories_kcal?: number;        // Calories per serving
    protein_g?: number;            // Protein per serving
    carbs_g?: number;              // Carbs per serving
    fat_g?: number;                // Fat per serving
    isVerified?: boolean;          // Always true for AI recipes
    timingTag?: string;            // e.g., "45 min"
    allergyList?: string[];        // Tags/dietary info
    ingredients: Array<{           // Recipe ingredients
        name: string;
        qty?: string;
    }>;
    steps: Array<{                 // Instructions
        stepNumber: number;
        text: string;
    }>;
    proTips?: string[];            // Cooking tips
}
```

---

## ✅ Validation

Always validate inputs before generating:

```typescript
import { validateRecipeInputs } from '../api/geminiRecipeApi';

const errors = validateRecipeInputs({
    ingredientsInput: pantryItems,
    categoryId: selectedCategories,
    goal: selectedGoal,
    servings: servings,
});

if (errors.length > 0) {
    Alert.alert('Validation Error', errors.join('\n'));
    return;
}
```

---

## 🖼️ Image Generation

Images are automatically generated using Pollinations.AI (free, no API key needed).

**Features:**
- Professional food photography style
- 1024x768 resolution
- Natural lighting
- Unique seed per generation

**Fallback:**
- If image generation fails, recipe still returns successfully
- `heroImage` will be `undefined`
- Handle gracefully in UI with placeholder

```typescript
<Image 
    source={{ uri: recipe.heroImage || 'https://via.placeholder.com/400x300?text=Recipe' }}
    style={styles.heroImage}
/>
```

---

## 🎯 Health Goal Constraints

Each health goal applies specific nutritional targets:

### Lose Weight
- **Target:** 300-500 calories per serving
- **Focus:** Low calorie, high fiber, lean proteins
- **Methods:** Grilling, baking, steaming, air-frying

### Build Muscle
- **Target:** 30-40g protein per serving
- **Focus:** High protein, complex carbs, healthy fats
- **Include:** Lean meats, eggs, legumes, whole grains

### Control Blood Sugar
- **Focus:** Low glycemic index foods, high fiber
- **Avoid:** Refined sugars, white flour, excessive carbs
- **Balance:** Protein + fiber in every meal

### Control Cholesterol
- **Focus:** Low saturated fat, high omega-3s
- **Avoid:** Butter, cream, fatty meats
- **Include:** Oats, nuts, fatty fish, olive oil

### Heart Health
- **Focus:** Low sodium, omega-3s, fiber
- **Include:** Whole grains, leafy greens, berries, nuts

### General Wellness
- **Focus:** Balanced nutrition, variety of nutrients

---

## 🧪 Testing

### Run Test Suite

```typescript
import { runAllTests } from '../api/test-gemini-recipe';

// Run all tests
await runAllTests();

// Or run individual tests
import { 
    testBasicRecipeGeneration,
    testHealthGoalRecipe,
    testDietaryRestrictions,
    testTimeConstraint
} from '../api/test-gemini-recipe';

await testBasicRecipeGeneration();
```

### Test from UI

1. Navigate to the AI Recipe Generator screen
2. Add pantry items
3. Select options
4. Generate recipe
5. Check console for logs

---

## 🚨 Error Handling

The API uses custom error types:

```typescript
import { AIProcessingError, ErrorType } from '../utils/errorHandling';

try {
    const recipe = await generateRecipeWithGemini(pantryItems);
} catch (error) {
    if (error instanceof AIProcessingError) {
        switch (error.type) {
            case ErrorType.API:
                Alert.alert('API Error', 'Check your API key');
                break;
            case ErrorType.VALIDATION:
                Alert.alert('Validation Error', error.message);
                break;
            case ErrorType.PARSING:
                Alert.alert('Parsing Error', 'AI returned invalid data');
                break;
            default:
                Alert.alert('Error', error.message);
        }
    }
}
```

---

## ⚡ Performance Tips

### 1. Loading States

Always show loading indicators:

```typescript
const [isGenerating, setIsGenerating] = useState(false);

// Show loading
setIsGenerating(true);
const recipe = await generateRecipeWithAI(pantryItems, options);
setIsGenerating(false);
```

### 2. Debounce Generation

Prevent multiple simultaneous requests:

```typescript
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = async () => {
    if (isGenerating) return; // Prevent duplicate requests
    
    setIsGenerating(true);
    try {
        await generateRecipeWithAI(pantryItems, options);
    } finally {
        setIsGenerating(false);
    }
};
```

### 3. Cache Results

Store generated recipes:

```typescript
// Store automatically saves to myRecipes
const recipe = await generateRecipeWithAI(pantryItems, options);
// recipe is now in useStore.myRecipes
```

---

## 🔧 Customization

### Custom Prompts

Edit `buildRecipePrompt()` in `geminiRecipeApi.ts` to customize:

```typescript
// Add custom instructions
const customInstructions = `
ADDITIONAL REQUIREMENTS:
- Use Mediterranean cooking style
- Include fresh herbs
- Maximum 10 ingredients
`;

// Modify the prompt
const prompt = buildRecipePrompt(request) + customInstructions;
```

### Custom Image Generation

Replace Pollinations.AI with another service:

```typescript
// Edit generateRecipeImage() in geminiRecipeApi.ts
export async function generateRecipeImage(recipeName: string): Promise<string | null> {
    // Your custom image generation logic
    const customUrl = await yourImageService.generate(recipeName);
    return customUrl;
}
```

---

## 📚 Integration Examples

### 1. Add to Existing Tab

```typescript
// In app/(tabs)/index.tsx
import { useRouter } from 'expo-router';

function HomeScreen() {
    const router = useRouter();
    
    return (
        <Button
            title="🤖 AI Recipe Generator"
            onPress={() => router.push('/screens/Recipe/AIRecipeGeneratorScreen')}
        />
    );
}
```

### 2. Quick Generate Button

```typescript
// In pantry screen
import { useStore } from '../store/useStore';

function PantryScreen() {
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    
    const quickGenerate = async () => {
        const recipe = await generateRecipeWithAI(pantryItems);
        // Navigate to recipe
    };
    
    return (
        <Button title="⚡ Quick Generate" onPress={quickGenerate} />
    );
}
```

### 3. Context Menu Integration

```typescript
// Long-press menu on pantry items
const contextMenuActions = [
    {
        title: 'Generate Recipe with Selected',
        action: async () => {
            const recipe = await generateRecipeWithAI(selectedItems);
        }
    }
];
```

---

## 🐛 Troubleshooting

### API Key Issues

```
Error: Google API key not configured
```

**Solution:** Add `EXPO_PUBLIC_GOOGLE_API_KEY` to `.env` and restart

### Empty Response

```
Error: No response from Gemini
```

**Solution:** Check API quota/limits at Google AI Studio

### Parsing Errors

```
Error: Failed to parse recipe JSON
```

**Solution:** This is rare but can happen if Gemini returns malformed JSON. The code handles markdown fences automatically.

### Image Generation Fails

**Expected:** Images may occasionally fail to generate
**Behavior:** Recipe still returns successfully without image
**Solution:** No action needed, app handles this gracefully

---

## 📈 API Limits

### Google Gemini (Free Tier)
- **Requests:** 60 per minute
- **Tokens:** 1 million per month
- **Cost:** Free (with limits)

### Pollinations.AI
- **Requests:** Unlimited
- **Cost:** Free
- **No API key required**

---

## 🎓 Best Practices

1. **Always Validate Inputs**
   ```typescript
   const errors = validateRecipeInputs(inputs);
   if (errors.length > 0) return;
   ```

2. **Show Loading States**
   ```typescript
   <ActivityIndicator animating={isGenerating} />
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try { ... } catch (error) { Alert.alert(...) }
   ```

4. **Cache Generated Recipes**
   ```typescript
   // Store does this automatically
   await generateRecipeWithAI(pantryItems, options);
   ```

5. **Provide User Feedback**
   ```typescript
   <Text>Generating recipe... This may take 10-15 seconds</Text>
   ```

---

## 🎉 Complete Example

See `app/screens/Recipe/AIRecipeGeneratorScreen.tsx` for a full working example with:

- ✅ Pantry item display
- ✅ Dietary category checkboxes
- ✅ Health goal selection
- ✅ Servings picker
- ✅ Time limit options
- ✅ Validation
- ✅ Loading states
- ✅ Error handling
- ✅ Navigation to recipe detail

---

## 📞 Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Review the test suite for working examples
3. Ensure API key is valid and has quota remaining
4. Check network connectivity

---

## 🚀 Next Steps

1. **Get API Key** - Add to `.env`
2. **Test Integration** - Run test suite
3. **Add UI** - Use example screen or create custom
4. **Customize** - Adjust prompts/styling to your needs
5. **Deploy** - Ship to production!

---

**Happy Cooking! 🍳✨**
