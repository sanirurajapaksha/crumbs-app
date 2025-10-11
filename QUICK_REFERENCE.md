# 🚀 Quick Reference Card - AI Recipe Generation

## ⚡ 30-Second Setup

```bash
# 1. Get API key from: https://makersuite.google.com/app/apikey
# 2. Add to .env:
EXPO_PUBLIC_GOOGLE_API_KEY=your_key_here
# 3. Restart:
npm start
```

---

## 📝 Basic Usage

```typescript
import { useStore } from '../store/useStore';

const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
const pantryItems = useStore(state => state.pantryItems);

// Generate recipe
const recipe = await generateRecipeWithAI(pantryItems);
```

---

## 🎯 With Options

```typescript
const recipe = await generateRecipeWithAI(pantryItems, {
    categoryId: ['vegan', 'gluten_free'],  // Dietary filters
    goal: 'lose_weight',                   // Health goal
    servings: 2,                           // Number of servings
    cookingTimeMax: 30,                    // Max minutes
});
```

---

## 🏷️ Available Options

### Dietary Categories
```typescript
'vegan' | 'vegetarian' | 'gluten_free' | 'dairy_free' | 
'low_carb' | 'keto' | 'paleo' | 'low_cost'
```

### Health Goals
```typescript
'lose_weight' | 'gain_weight' | 'build_muscle' | 
'blood_sugar' | 'cholesterol' | 'heart_health' | 'general'
```

---

## 🎨 Quick Integration Examples

### 1. Simple Button
```typescript
<Button 
    title="🤖 Generate Recipe"
    onPress={async () => {
        const recipe = await generateRecipeWithAI(pantryItems);
        router.push(`/recipe/${recipe.id}`);
    }}
/>
```

### 2. With Loading
```typescript
const [loading, setLoading] = useState(false);

<TouchableOpacity 
    onPress={async () => {
        setLoading(true);
        try {
            await generateRecipeWithAI(pantryItems);
        } finally {
            setLoading(false);
        }
    }}
>
    {loading ? <ActivityIndicator /> : <Text>Generate</Text>}
</TouchableOpacity>
```

### 3. With Error Handling
```typescript
try {
    const recipe = await generateRecipeWithAI(pantryItems, options);
    router.push(`/recipe/${recipe.id}`);
} catch (error) {
    Alert.alert('Error', 'Failed to generate recipe');
}
```

---

## 🧪 Test Commands

```typescript
// Quick test
import { testBasicRecipeGeneration } from '../api/test-gemini-recipe';
await testBasicRecipeGeneration();

// Full test suite
import { runAllTests } from '../api/test-gemini-recipe';
await runAllTests();
```

---

## 📊 Recipe Response

```typescript
{
    id: string;
    title: string;
    heroImage: string;          // AI-generated
    cookTimeMin: number;
    servings: number;
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    ingredients: [{ name, qty }];
    steps: [{ stepNumber, text }];
    proTips: string[];
}
```

---

## 🎯 Quick Presets

```typescript
// Quick meal (30 min)
await generateRecipeWithAI(pantryItems, { cookingTimeMax: 30 });

// Healthy (low calorie)
await generateRecipeWithAI(pantryItems, { goal: 'lose_weight' });

// High protein
await generateRecipeWithAI(pantryItems, { goal: 'build_muscle' });

// Vegan
await generateRecipeWithAI(pantryItems, { categoryId: ['vegan'] });
```

---

## 🛠️ Validation

```typescript
import { validateRecipeInputs } from '../api/geminiRecipeApi';

const errors = validateRecipeInputs({
    ingredientsInput: pantryItems,
    servings: 2,
});

if (errors.length > 0) {
    Alert.alert('Error', errors.join('\n'));
}
```

---

## 🔧 Helper Functions

```typescript
import { 
    getDietaryCategories,    // Get all category options
    getHealthGoals,          // Get all goal options
    validateRecipeInputs,    // Validate before generation
} from '../api/geminiRecipeApi';

const categories = getDietaryCategories();
// [{ id: 'vegan', label: 'Vegan', value: DietaryCategory.VEGAN }, ...]

const goals = getHealthGoals();
// [{ id: 'lose_weight', label: 'Lose Weight', value: HealthGoal.LOSE_WEIGHT }, ...]
```

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| "API key not configured" | Add to `.env` & restart |
| "No ingredients" | Add pantry items |
| Takes 10-15s | Normal, show loading |
| No image | Expected, still works |

---

## 📱 UI Placement Ideas

1. **Hero Section** - Featured on home
2. **FAB** - Floating button on pantry
3. **Menu Item** - Full generator screen
4. **Presets** - Quick buttons (⚡🥗💪🌱)
5. **Context Menu** - Long-press recipes
6. **Smart Banner** - When 5+ pantry items
7. **Empty State** - In empty pantry

---

## 📚 Documentation

- `AI_RECIPE_INTEGRATION.md` - Full guide
- `QUICK_AI_INTEGRATION.md` - 5-min start
- `INTEGRATION_EXAMPLES.md` - 7 examples
- `SETUP_CHECKLIST.md` - Step-by-step
- `README_AI_IMPLEMENTATION.md` - Summary

---

## ⏱️ Performance

- **Generation Time:** 10-15 seconds
- **Rate Limit:** 60 requests/minute (free)
- **Image Success:** ~90%
- **Cost:** Free

---

## 🎯 Health Goal Targets

| Goal | Target |
|------|--------|
| Lose Weight | 300-500 cal |
| Build Muscle | 30-40g protein |
| Blood Sugar | Low GI, high fiber |
| Cholesterol | Low sat fat |
| Heart Health | Low sodium |

---

## 💡 Pro Tips

1. **Always validate** inputs first
2. **Show loading** immediately
3. **Disable button** during generation
4. **Handle errors** gracefully
5. **Cache recipes** (done automatically)
6. **Test thoroughly** before launch

---

## 🚀 Example Flow

```typescript
function RecipeGenerator() {
    const [loading, setLoading] = useState(false);
    const pantryItems = useStore(s => s.pantryItems);
    const generateRecipeWithAI = useStore(s => s.generateRecipeWithAI);
    
    const handleGenerate = async () => {
        // 1. Validate
        if (pantryItems.length === 0) {
            Alert.alert('Error', 'Add ingredients first');
            return;
        }
        
        // 2. Generate
        setLoading(true);
        try {
            const recipe = await generateRecipeWithAI(pantryItems, {
                goal: 'lose_weight',
                servings: 2,
            });
            
            // 3. Navigate
            router.push(`/recipe/${recipe.id}`);
        } catch (error) {
            Alert.alert('Error', 'Generation failed');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <TouchableOpacity onPress={handleGenerate} disabled={loading}>
            <Text>{loading ? 'Generating...' : '🤖 Generate Recipe'}</Text>
        </TouchableOpacity>
    );
}
```

---

## 📞 Need Help?

1. Check console logs
2. Review documentation
3. Run test suite
4. Verify API key
5. Check internet

---

**Keep this card handy for quick reference!** 📋✨
