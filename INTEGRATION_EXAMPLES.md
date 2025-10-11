# 🎯 Simple Integration Examples

## Example 1: Add "Generate Recipe" Button to Main Screen

Add this to your `app/(tabs)/index.tsx`:

```typescript
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { router } from 'expo-router';
import { Alert, ActivityIndicator } from 'react-native';

// Add to your component
function RecipeHomeScreen() {
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleQuickGenerate = async () => {
        if (pantryItems.length === 0) {
            Alert.alert(
                'No Ingredients', 
                'Add ingredients to your pantry first',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Pantry', onPress: () => router.push('/(tabs)/pantry') }
                ]
            );
            return;
        }

        setIsGenerating(true);
        try {
            const recipe = await generateRecipeWithAI(pantryItems, {
                servings: 2,
            });
            
            router.push({
                pathname: '/screens/Recipe/RecipeDetail',
                params: { recipeId: recipe.id }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate recipe. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <ScrollView>
            {/* Your existing content */}
            
            {/* Add this hero section */}
            <View style={styles.aiHeroSection}>
                <View style={styles.aiHeroContent}>
                    <Text style={styles.aiHeroEmoji}>🤖</Text>
                    <Text style={styles.aiHeroTitle}>AI Recipe Generator</Text>
                    <Text style={styles.aiHeroSubtitle}>
                        Generate personalized recipes from your pantry ingredients
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.aiHeroButton, isGenerating && styles.aiHeroButtonDisabled]}
                        onPress={handleQuickGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.aiHeroButtonText}>  Generating...</Text>
                            </View>
                        ) : (
                            <Text style={styles.aiHeroButtonText}>
                                ✨ Generate Recipe
                            </Text>
                        )}
                    </TouchableOpacity>
                    
                    {pantryItems.length > 0 && (
                        <Text style={styles.aiHeroPantryInfo}>
                            Using {pantryItems.length} ingredients from your pantry
                        </Text>
                    )}
                </View>
            </View>
            
            {/* Your existing recipe lists */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    aiHeroSection: {
        margin: 16,
        marginTop: 8,
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    aiHeroContent: {
        padding: 24,
        alignItems: 'center',
    },
    aiHeroEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    aiHeroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    aiHeroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    aiHeroButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    aiHeroButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    aiHeroButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#667eea',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiHeroPantryInfo: {
        marginTop: 12,
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontStyle: 'italic',
    },
});
```

---

## Example 2: Add FAB (Floating Action Button) to Pantry

Add this to your `app/(tabs)/pantry.tsx`:

```typescript
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { router } from 'expo-router';
import { Alert, ActivityIndicator } from 'react-native';

function PantryScreen() {
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (pantryItems.length === 0) {
            Alert.alert('No Ingredients', 'Add ingredients to your pantry first');
            return;
        }

        setIsGenerating(true);
        try {
            const recipe = await generateRecipeWithAI(pantryItems);
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
        <View style={{ flex: 1 }}>
            {/* Your existing pantry UI */}
            
            {/* Floating Action Button */}
            {pantryItems.length > 0 && (
                <TouchableOpacity
                    style={[styles.fab, isGenerating && styles.fabDisabled]}
                    onPress={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.fabText}>🤖</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabDisabled: {
        backgroundColor: '#999',
    },
    fabText: {
        fontSize: 28,
    },
});
```

---

## Example 3: Navigation Menu Item

Add to your navigation drawer or menu:

```typescript
const menuItems = [
    {
        icon: '🏠',
        title: 'Home',
        onPress: () => router.push('/(tabs)/'),
    },
    {
        icon: '🍳',
        title: 'My Pantry',
        onPress: () => router.push('/(tabs)/pantry'),
    },
    {
        icon: '🤖',
        title: 'AI Recipe Generator',
        badge: 'NEW',
        onPress: () => router.push('/screens/Recipe/AIRecipeGeneratorScreen'),
    },
    {
        icon: '❤️',
        title: 'Favorites',
        onPress: () => router.push('/(tabs)/favorites'),
    },
];
```

---

## Example 4: Context Menu on Recipe Card

Add "Regenerate with AI" option to recipe cards:

```typescript
import { useActionSheet } from '@expo/react-native-action-sheet';

function RecipeCard({ recipe }) {
    const { showActionSheetWithOptions } = useActionSheet();
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    const pantryItems = useStore(state => state.pantryItems);

    const showOptions = () => {
        const options = [
            'View Recipe',
            'Add to Favorites',
            '🤖 Generate Similar Recipe',
            'Cancel'
        ];
        const cancelButtonIndex = 3;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
            },
            async (selectedIndex) => {
                switch (selectedIndex) {
                    case 0:
                        router.push(`/screens/Recipe/RecipeDetail?recipeId=${recipe.id}`);
                        break;
                    case 1:
                        // Add to favorites
                        break;
                    case 2:
                        // Generate similar with AI
                        const newRecipe = await generateRecipeWithAI(pantryItems, {
                            servings: recipe.servings,
                        });
                        router.push(`/screens/Recipe/RecipeDetail?recipeId=${newRecipe.id}`);
                        break;
                }
            }
        );
    };

    return (
        <TouchableOpacity onLongPress={showOptions}>
            {/* Recipe card content */}
        </TouchableOpacity>
    );
}
```

---

## Example 5: Smart Suggestions

Show AI generate button when pantry has many items:

```typescript
function SmartSuggestion() {
    const pantryItems = useStore(state => state.pantryItems);
    const [showSuggestion, setShowSuggestion] = useState(false);

    useEffect(() => {
        // Show suggestion if user has 5+ items and hasn't generated in 24h
        if (pantryItems.length >= 5) {
            setShowSuggestion(true);
        }
    }, [pantryItems.length]);

    if (!showSuggestion) return null;

    return (
        <View style={styles.suggestionBanner}>
            <MaterialIcons name="lightbulb-outline" size={24} color="#FFA000" />
            <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>
                    You have {pantryItems.length} ingredients!
                </Text>
                <Text style={styles.suggestionText}>
                    Generate a personalized recipe with AI
                </Text>
            </View>
            <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => router.push('/screens/Recipe/AIRecipeGeneratorScreen')}
            >
                <Text style={styles.suggestionButtonText}>Try Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSuggestion(false)}>
                <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
        </View>
    );
}
```

---

## Example 6: Recipe Presets

Quick generate buttons with presets:

```typescript
function QuickRecipePresets() {
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    const [generating, setGenerating] = useState<string | null>(null);

    const presets = [
        {
            id: 'quick',
            emoji: '⚡',
            title: 'Quick Meal',
            subtitle: '30 min or less',
            options: { cookingTimeMax: 30 },
        },
        {
            id: 'healthy',
            emoji: '🥗',
            title: 'Healthy',
            subtitle: 'Low calorie',
            options: { goal: 'lose_weight' },
        },
        {
            id: 'protein',
            emoji: '💪',
            title: 'High Protein',
            subtitle: 'Build muscle',
            options: { goal: 'build_muscle' },
        },
        {
            id: 'vegan',
            emoji: '🌱',
            title: 'Vegan',
            subtitle: 'Plant-based',
            options: { categoryId: ['vegan'] },
        },
    ];

    const handlePreset = async (preset: typeof presets[0]) => {
        setGenerating(preset.id);
        try {
            const recipe = await generateRecipeWithAI(pantryItems, preset.options);
            router.push({
                pathname: '/screens/Recipe/RecipeDetail',
                params: { recipeId: recipe.id }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate recipe');
        } finally {
            setGenerating(null);
        }
    };

    return (
        <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>Quick Generate</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {presets.map(preset => (
                    <TouchableOpacity
                        key={preset.id}
                        style={styles.presetCard}
                        onPress={() => handlePreset(preset)}
                        disabled={generating !== null}
                    >
                        <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                        <Text style={styles.presetTitle}>{preset.title}</Text>
                        <Text style={styles.presetSubtitle}>{preset.subtitle}</Text>
                        {generating === preset.id && (
                            <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 8 }} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    presetsContainer: {
        marginVertical: 16,
    },
    presetsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    presetCard: {
        width: 120,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginLeft: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    presetEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    presetTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    presetSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});
```

---

## Example 7: Empty State with AI Suggestion

Show in pantry when empty:

```typescript
function PantryEmptyState() {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={styles.emptyTitle}>Your Pantry is Empty</Text>
            <Text style={styles.emptySubtitle}>
                Add ingredients to generate personalized AI recipes
            </Text>
            
            <View style={styles.emptyActions}>
                <TouchableOpacity
                    style={styles.emptyActionPrimary}
                    onPress={() => router.push('/screens/Pantry/PantryInput')}
                >
                    <Text style={styles.emptyActionPrimaryText}>Add Ingredients</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.emptyActionSecondary}
                    onPress={() => router.push('/screens/Recipe/AIRecipeGeneratorScreen')}
                >
                    <Text style={styles.emptyActionSecondaryText}>Learn About AI Recipes</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.emptyFeatures}>
                <View style={styles.emptyFeature}>
                    <Text style={styles.emptyFeatureIcon}>✨</Text>
                    <Text style={styles.emptyFeatureText}>AI-generated recipes</Text>
                </View>
                <View style={styles.emptyFeature}>
                    <Text style={styles.emptyFeatureIcon}>🎯</Text>
                    <Text style={styles.emptyFeatureText}>Personalized nutrition</Text>
                </View>
                <View style={styles.emptyFeature}>
                    <Text style={styles.emptyFeatureIcon}>📸</Text>
                    <Text style={styles.emptyFeatureText}>Beautiful food photos</Text>
                </View>
            </View>
        </View>
    );
}
```

---

## Pick Your Favorite! 🎨

Choose the integration style that fits your app best:

1. **Hero Section** - Featured prominently on home
2. **FAB** - Quick access from pantry
3. **Menu Item** - Full-featured generator screen
4. **Context Menu** - Generate similar recipes
5. **Smart Suggestions** - Show when appropriate
6. **Presets** - Quick one-tap generation
7. **Empty State** - Encourage first use

All examples use the same core function:
```typescript
await generateRecipeWithAI(pantryItems, options)
```

Mix and match as needed! 🚀
