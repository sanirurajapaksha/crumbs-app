/**
 * Example Recipe Generator Screen with Gemini AI Integration
 * This demonstrates how to use the Gemini recipe generation in your app
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { getDietaryCategories, getHealthGoals, validateRecipeInputs } from '../../api/geminiRecipeApi';
import { Recipe } from '../../types';

export default function AIRecipeGeneratorScreen() {
    const router = useRouter();
    const pantryItems = useStore(state => state.pantryItems);
    const generateRecipeWithAI = useStore(state => state.generateRecipeWithAI);
    
    // State for user selections
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<string | undefined>(undefined);
    const [servings, setServings] = useState<number>(2);
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Get dropdown options
    const dietaryCategories = getDietaryCategories();
    const healthGoals = getHealthGoals();
    
    // Toggle dietary category selection
    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };
    
    // Handle recipe generation
    const handleGenerateRecipe = async () => {
        // Validate inputs
        const errors = validateRecipeInputs({
            ingredientsInput: pantryItems,
            categoryId: selectedCategories,
            goal: selectedGoal,
            servings,
        });
        
        if (errors.length > 0) {
            Alert.alert('Validation Error', errors.join('\n'));
            return;
        }
        
        setIsGenerating(true);
        
        try {
            console.log('🍳 Generating recipe with options:', {
                ingredients: pantryItems.length,
                categories: selectedCategories,
                goal: selectedGoal,
                servings,
                timeLimit,
            });
            
            const recipe = await generateRecipeWithAI(pantryItems, {
                categoryId: selectedCategories,
                goal: selectedGoal,
                servings,
                cookingTimeMax: timeLimit,
            });
            
            console.log('✅ Recipe generated:', recipe.title);
            
            // Navigate to recipe detail screen
            router.push({
                pathname: '/screens/Recipe/RecipeDetail',
                params: { recipeId: recipe.id }
            });
        } catch (error) {
            console.error('❌ Recipe generation failed:', error);
            Alert.alert(
                'Generation Failed',
                error instanceof Error ? error.message : 'Failed to generate recipe. Please try again.'
            );
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🤖 AI Recipe Generator</Text>
                <Text style={styles.subtitle}>
                    Generate personalized recipes from your pantry using AI
                </Text>
            </View>
            
            {/* Pantry Items Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Pantry</Text>
                <View style={styles.pantryContainer}>
                    {pantryItems.length > 0 ? (
                        <>
                            <Text style={styles.pantryCount}>
                                {pantryItems.length} ingredients available
                            </Text>
                            <View style={styles.ingredientsList}>
                                {pantryItems.slice(0, 5).map((item, index) => (
                                    <Text key={item.id} style={styles.ingredientChip}>
                                        {item.name}
                                        {index < pantryItems.length - 1 && pantryItems.length > 5 ? ', ' : ''}
                                    </Text>
                                ))}
                                {pantryItems.length > 5 && (
                                    <Text style={styles.moreText}>
                                        +{pantryItems.length - 5} more
                                    </Text>
                                )}
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                No pantry items yet. Add ingredients to get started!
                            </Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => router.push('/(tabs)/pantry')}
                            >
                                <Text style={styles.addButtonText}>Add Ingredients</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
            
            {/* Dietary Categories */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dietary Preferences (Optional)</Text>
                <View style={styles.chipsContainer}>
                    {dietaryCategories.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.chip,
                                selectedCategories.includes(category.id) && styles.chipSelected
                            ]}
                            onPress={() => toggleCategory(category.id)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    selectedCategories.includes(category.id) && styles.chipTextSelected
                                ]}
                            >
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            {/* Health Goal */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Health Goal (Optional)</Text>
                <View style={styles.goalContainer}>
                    {healthGoals.map(goal => (
                        <TouchableOpacity
                            key={goal.id}
                            style={[
                                styles.goalButton,
                                selectedGoal === goal.id && styles.goalButtonSelected
                            ]}
                            onPress={() => setSelectedGoal(selectedGoal === goal.id ? undefined : goal.id)}
                        >
                            <Text
                                style={[
                                    styles.goalButtonText,
                                    selectedGoal === goal.id && styles.goalButtonTextSelected
                                ]}
                            >
                                {goal.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            {/* Servings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Servings</Text>
                <View style={styles.servingsContainer}>
                    {[1, 2, 3, 4, 6, 8].map(num => (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.servingButton,
                                servings === num && styles.servingButtonSelected
                            ]}
                            onPress={() => setServings(num)}
                        >
                            <Text
                                style={[
                                    styles.servingButtonText,
                                    servings === num && styles.servingButtonTextSelected
                                ]}
                            >
                                {num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            {/* Time Limit */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Time Limit (Optional)</Text>
                <View style={styles.timeContainer}>
                    {[15, 30, 45, 60].map(mins => (
                        <TouchableOpacity
                            key={mins}
                            style={[
                                styles.timeButton,
                                timeLimit === mins && styles.timeButtonSelected
                            ]}
                            onPress={() => setTimeLimit(timeLimit === mins ? undefined : mins)}
                        >
                            <Text
                                style={[
                                    styles.timeButtonText,
                                    timeLimit === mins && styles.timeButtonTextSelected
                                ]}
                            >
                                {mins} min
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            {/* Generate Button */}
            <View style={styles.generateContainer}>
                <TouchableOpacity
                    style={[
                        styles.generateButton,
                        (pantryItems.length === 0 || isGenerating) && styles.generateButtonDisabled
                    ]}
                    onPress={handleGenerateRecipe}
                    disabled={pantryItems.length === 0 || isGenerating}
                >
                    {isGenerating ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.generateButtonText}>  Generating Recipe...</Text>
                        </View>
                    ) : (
                        <Text style={styles.generateButtonText}>
                            ✨ Generate Recipe with AI
                        </Text>
                    )}
                </TouchableOpacity>
                
                {isGenerating && (
                    <Text style={styles.generatingText}>
                        This may take 10-15 seconds...
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    pantryContainer: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    pantryCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 8,
    },
    ingredientsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    ingredientChip: {
        fontSize: 14,
        color: '#666',
    },
    moreText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 12,
    },
    addButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    chipSelected: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    goalContainer: {
        gap: 8,
    },
    goalButton: {
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    goalButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    goalButtonText: {
        fontSize: 14,
        color: '#666',
    },
    goalButtonTextSelected: {
        color: '#2196F3',
        fontWeight: '600',
    },
    servingsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    servingButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    servingButtonSelected: {
        backgroundColor: '#FF9800',
    },
    servingButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    servingButtonTextSelected: {
        color: '#fff',
    },
    timeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    timeButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    timeButtonSelected: {
        backgroundColor: '#9C27B0',
    },
    timeButtonText: {
        fontSize: 14,
        color: '#666',
    },
    timeButtonTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    generateContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    generateButton: {
        padding: 16,
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    generateButtonDisabled: {
        backgroundColor: '#ccc',
        elevation: 0,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    generatingText: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
});
