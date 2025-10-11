import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StoreState, useStore } from "../store/useStore";
import { colors } from "../theme/colors";
import { Recipe } from "../types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

// Mock recipe data for display
const mockRecentRecipes: Recipe[] = [
    {
        id: "1",
        title: "Creamy Tomato Pasta",
        heroImage: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
        cookTimeMin: 30,
        timingTag: "Vegetarian",
        calories_kcal: 450,
        protein_g: 12,
        ingredients: [],
        steps: [],
    },
    {
        id: "2",
        title: "Mediterranean Salad",
        heroImage: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
        cookTimeMin: 20,
        timingTag: "Vegetarian",
        calories_kcal: 320,
        protein_g: 8,
        ingredients: [],
        steps: [],
    },
];

const mockPopularRecipes: Recipe[] = [
    {
        id: "3",
        title: "Avocado Toast with a Twist",
        heroImage: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800",
        cookTimeMin: 10,
        calories_kcal: 280,
        protein_g: 9,
        ingredients: [],
        steps: [],
    },
    {
        id: "4",
        title: "One-Pan Lemon Chicken",
        heroImage: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800",
        cookTimeMin: 35,
        calories_kcal: 520,
        protein_g: 42,
        ingredients: [],
        steps: [],
    },
];

export default function HomeScreen() {
    const user = useStore((s: StoreState) => s.user);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const handleRecipePress = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        // Navigate to recipe detail
        router.push(`/screens/Recipe/RecipeDetail?id=${recipe.id}`);
    };

    const handleGenerateRecipe = () => {
        // Navigate to generate flow or trigger generation
        router.push("/screens/Pantry/PantryInput");
    };

    return (
        <View style={styles.wrapper}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>Crumbs</Text>
                </View>

                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greeting}>Good Morning, {user?.name || "Alex"}!</Text>
                    <Text style={styles.subGreeting}>Discover new recipes tailored just for you.</Text>
                </View>

                {/* Recents Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recents</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {mockRecentRecipes.map((recipe) => (
                            <TouchableOpacity key={recipe.id} style={styles.recipeCard} onPress={() => handleRecipePress(recipe)}>
                                <Image source={{ uri: recipe.heroImage }} style={styles.recipeImage} />
                                <View style={styles.recipeInfo}>
                                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                    <View style={styles.recipeMeta}>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
                                            <Text style={styles.metaText}>{recipe.cookTimeMin} min</Text>
                                        </View>
                                        {recipe.timingTag && (
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>{recipe.timingTag}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Popular Picks Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular Picks</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {mockPopularRecipes.map((recipe) => (
                            <TouchableOpacity key={recipe.id} style={styles.recipeCard} onPress={() => handleRecipePress(recipe)}>
                                <Image source={{ uri: recipe.heroImage }} style={styles.recipeImage} />
                                <View style={styles.recipeInfo}>
                                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                    <Text style={styles.recipeDescription}>
                                        {recipe.id === "3"
                                            ? "A simple, quick, and satisfying breakfast."
                                            : "Juicy chicken with lemon and veggies, all on one pan."}
                                    </Text>
                                    <View style={styles.recipeMeta}>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
                                            <Text style={styles.metaText}>{recipe.cookTimeMin} min</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="star" size={14} color={colors.textMuted} />
                                            <Text style={styles.metaText}>4.9 (124)</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Generate Recipe Button */}
            <TouchableOpacity style={styles.floatingButton} onPress={handleGenerateRecipe}>
                <MaterialIcons name="auto-awesome" size={22} color={colors.white} />
                <Text style={styles.floatingText}>Generate Recipe</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    logo: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.textPrimary,
        textAlign: "center",
    },
    greetingSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    subGreeting: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.textPrimary,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    horizontalScroll: {
        paddingLeft: 20,
    },
    recipeCard: {
        width: CARD_WIDTH,
        marginRight: 16,
        backgroundColor: colors.white,
        borderRadius: 16,
        overflow: "hidden",
        elevation: 2,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    recipeImage: {
        width: "100%",
        height: 200,
        backgroundColor: colors.neutral200,
    },
    recipeInfo: {
        padding: 16,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    recipeDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    recipeMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    tag: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        color: "#2E7D32",
        fontWeight: "600",
    },
    floatingButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 50,
        elevation: 8,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        gap: 10,
    },
    floatingText: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.white,
        letterSpacing: 0.5,
    },
});
