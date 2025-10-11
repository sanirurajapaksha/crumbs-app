# 🚀 Quick Integration - Add AI Recipe Button to Your App

This guide shows the **fastest way** to add AI recipe generation to your existing pantry screen.

---

## ⚡ 5-Minute Integration

### Step 1: Get Google API Key (2 minutes)

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 2: Add to .env (30 seconds)

Open `d:\UEE\version 5\crumbs-app\.env` and add:

```env
EXPO_PUBLIC_GOOGLE_API_KEY=paste_your_key_here
```

### Step 3: Restart Expo (30 seconds)

```powershell
# Stop current server (Ctrl+C in terminal)
npm start
```

### Step 4: Add Button to Pantry Screen (2 minutes)

Edit `app/(tabs)/pantry.tsx` or wherever your pantry view is:

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { useRouter } from 'expo-router';

export default function PantryTab() {
    const router = useRouter();
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleQuickGenerate = async () => {
        if (pantryItems.length === 0) {
            Alert.alert('No Ingredients', 'Please add ingredients to your pantry first');
            return;
        }

        setIsGenerating(true);
        try {
            console.log('🍳 Generating recipe from', pantryItems.length, 'ingredients...');
            
            const recipe = await generateRecipeWithAI(pantryItems, {
                servings: 2,
            });
            
            console.log('✅ Recipe generated:', recipe.title);
            
            // Navigate to recipe detail
            router.push({
                pathname: '/screens/Recipe/RecipeDetail',
                params: { recipeId: recipe.id }
            });
        } catch (error) {
            console.error('❌ Generation failed:', error);
            Alert.alert(
                'Generation Failed', 
                error instanceof Error ? error.message : 'Please try again'
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Your existing pantry UI here */}
            
            {/* Add this button somewhere visible */}
            <TouchableOpacity
                style={[styles.aiButton, isGenerating && styles.aiButtonDisabled]}
                onPress={handleQuickGenerate}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.aiButtonText}>  Generating...</Text>
                    </View>
                ) : (
                    <Text style={styles.aiButtonText}>🤖 Generate Recipe with AI</Text>
                )}
            </TouchableOpacity>
            
            {isGenerating && (
                <Text style={styles.hint}>This may take 10-15 seconds...</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    aiButton: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    aiButtonDisabled: {
        backgroundColor: '#999',
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hint: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
});
```

---

## 🎯 That's It!

Now when users:
1. Add ingredients to pantry
2. Tap "Generate Recipe with AI"
3. Wait 10-15 seconds
4. Get a personalized recipe with nutrition info and image!

---

## 🎨 Advanced Options (Optional)

### Option 1: Add Health Goal Selection

```typescript
import { useState } from 'react';

const [selectedGoal, setSelectedGoal] = useState<string>();

const goals = [
    { id: 'lose_weight', label: '🏃 Lose Weight' },
    { id: 'build_muscle', label: '💪 Build Muscle' },
    { id: 'heart_health', label: '❤️ Heart Health' },
];

// In your UI:
{goals.map(goal => (
    <TouchableOpacity
        key={goal.id}
        style={[
            styles.goalButton,
            selectedGoal === goal.id && styles.goalButtonActive
        ]}
        onPress={() => setSelectedGoal(goal.id)}
    >
        <Text>{goal.label}</Text>
    </TouchableOpacity>
))}

// When generating:
const recipe = await generateRecipeWithAI(pantryItems, {
    goal: selectedGoal,
    servings: 2,
});
```

### Option 2: Add Dietary Filters

```typescript
const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);

const toggleFilter = (filter: string) => {
    setDietaryFilters(prev =>
        prev.includes(filter)
            ? prev.filter(f => f !== filter)
            : [...prev, filter]
    );
};

// In your UI:
{['vegan', 'gluten_free', 'low_cost'].map(filter => (
    <TouchableOpacity
        key={filter}
        style={[
            styles.filterChip,
            dietaryFilters.includes(filter) && styles.filterChipActive
        ]}
        onPress={() => toggleFilter(filter)}
    >
        <Text>{filter.replace('_', ' ')}</Text>
    </TouchableOpacity>
))}

// When generating:
const recipe = await generateRecipeWithAI(pantryItems, {
    categoryId: dietaryFilters,
    servings: 2,
});
```

### Option 3: Add Quick Presets

```typescript
const presets = [
    { label: '🏃 Quick & Healthy', options: { cookingTimeMax: 30, goal: 'lose_weight' } },
    { label: '💪 High Protein', options: { goal: 'build_muscle' } },
    { label: '🌱 Vegan', options: { categoryId: ['vegan'] } },
];

{presets.map((preset, index) => (
    <TouchableOpacity
        key={index}
        style={styles.presetButton}
        onPress={() => generateRecipeWithAI(pantryItems, preset.options)}
    >
        <Text>{preset.label}</Text>
    </TouchableOpacity>
))}
```

---

## 🧪 Test It

1. **Add test ingredients:**
   ```
   - Chicken
   - Rice
   - Vegetables
   ```

2. **Tap "Generate Recipe with AI"**

3. **Check console for logs:**
   ```
   🍳 Generating recipe from 3 ingredients...
   🧠 Calling Gemini API for recipe generation...
   🎨 Generating recipe image...
   ✅ Recipe generated successfully: Chicken Fried Rice
   ```

4. **Recipe should navigate to detail view with:**
   - Recipe name
   - Hero image (from Pollinations.AI)
   - Ingredients list
   - Step-by-step instructions
   - Nutrition information

---

## 📊 What Happens Behind the Scenes

```
User taps button
    ↓
Check pantry has items
    ↓
Call generateRecipeWithAI()
    ↓
Transform items to API format
    ↓
Build custom prompt with health goals
    ↓
Call Google Gemini API (10s)
    ↓
Parse JSON response
    ↓
Generate hero image (2s)
    ↓
Convert to Recipe object
    ↓
Auto-save to myRecipes
    ↓
Return recipe & navigate
```

---

## 🎛️ Customization Quick Reference

### Change Servings
```typescript
const recipe = await generateRecipeWithAI(pantryItems, {
    servings: 4, // Change this
});
```

### Add Time Limit
```typescript
const recipe = await generateRecipeWithAI(pantryItems, {
    cookingTimeMax: 45, // Maximum 45 minutes
});
```

### Multiple Options
```typescript
const recipe = await generateRecipeWithAI(pantryItems, {
    categoryId: ['vegan', 'gluten_free'],
    goal: 'heart_health',
    servings: 2,
    cookingTimeMax: 30,
});
```

---

## 🐛 Common Issues

### "API key not configured"
**Fix:** Add `EXPO_PUBLIC_GOOGLE_API_KEY` to `.env` and restart Expo

### "No ingredients provided"
**Fix:** Add items to pantry before generating

### "Failed to generate recipe"
**Fix:** Check console for detailed error. Verify API key and internet connection.

### Button not responding
**Fix:** Check `isGenerating` state. Button disables during generation.

---

## 📱 Where to Place the Button

### Option A: Bottom of Pantry List
```typescript
<FlatList
    data={pantryItems}
    renderItem={...}
    ListFooterComponent={
        <TouchableOpacity style={styles.aiButton} onPress={handleQuickGenerate}>
            <Text>🤖 Generate Recipe</Text>
        </TouchableOpacity>
    }
/>
```

### Option B: Floating Action Button
```typescript
<View style={styles.container}>
    {/* Your pantry list */}
    
    <TouchableOpacity style={styles.fab} onPress={handleQuickGenerate}>
        <Text style={styles.fabText}>🤖</Text>
    </TouchableOpacity>
</View>

// In styles:
fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
}
```

### Option C: Header Button
```typescript
<View>
    <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <TouchableOpacity onPress={handleQuickGenerate}>
            <Text style={styles.headerButton}>🤖 Generate</Text>
        </TouchableOpacity>
    </View>
    {/* Pantry list */}
</View>
```

---

## 🎉 Next Steps

1. **✅ Basic integration** - Just the generate button (what we just did)
2. **🎨 Add filters** - Health goals, dietary restrictions (optional)
3. **📊 Show progress** - Loading animation, progress text
4. **💾 Save favorites** - Let users save generated recipes
5. **🔄 Regenerate** - "Generate another" button
6. **📱 Share** - Share generated recipes to community

---

## 📚 Full Documentation

For complete details, see:
- `AI_RECIPE_INTEGRATION.md` - Full integration guide
- `app/screens/Recipe/AIRecipeGeneratorScreen.tsx` - Complete UI example
- `app/api/test-gemini-recipe.ts` - Test suite

---

**Your app now has AI recipe generation! 🎊**
