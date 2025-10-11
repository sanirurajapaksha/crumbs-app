import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "../../theme/colors";

export default function RecipeCompletionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const saveFavorite = useStore((s: StoreState) => s.saveFavorite);

    // Find the recipe
    let recipe = favorites.find((r) => r.id === id);
    if (!recipe) {
        recipe = myRecipes.find((r) => r.id === id);
    }

    const handleSaveToFavorites = () => {
        if (recipe) {
            saveFavorite(recipe);
        }
    };

    const handleShareWithCommunity = () => {
        // Navigate to share screen
        router.push({
            pathname: "/screens/Community/ShareRecipe",
            params: { recipeId: id }
        });
    };

    return (
        <View style={styles.container}>
            {/* Success Icon */}
            <View style={styles.successIcon}>
                <View style={styles.checkmarkCircle}>
                    <MaterialIcons name="check" size={80} color="#4CAF50" />
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>All Steps Complete!</Text>
            <Text style={styles.subtitle}>Enjoy your meal! 🎉</Text>

            {/* Recipe Image (if available) */}
            {recipe?.heroImage && (
                <Image source={{ uri: recipe.heroImage }} style={styles.recipeImage} />
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons name="star-border" size={24} color={colors.accent} />
                    <Text style={styles.actionButtonText}>Rate Recipe</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleSaveToFavorites}>
                    <MaterialIcons name="bookmark-border" size={24} color={colors.accent} />
                    <Text style={styles.actionButtonText}>Save to Favorites</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShareWithCommunity}>
                    <MaterialIcons name="share" size={24} color={colors.accent} />
                    <Text style={styles.actionButtonText}>Share with Community</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push({
                        pathname: "/screens/Recipe/RecipeDetail",
                        params: { id: id }
                    })}
                >
                    <Text style={styles.backButtonText}>View Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.homeButton}
                    onPress={() => router.replace("/(tabs)")}
                >
                    <Text style={styles.homeButtonText}>Go Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF5F0",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    successIcon: {
        marginBottom: 32,
    },
    checkmarkCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "#E8F5E9",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 18,
        color: colors.textSecondary,
        marginBottom: 32,
        textAlign: "center",
    },
    recipeImage: {
        width: 200,
        height: 200,
        borderRadius: 16,
        marginBottom: 32,
    },
    actionsContainer: {
        width: "100%",
        gap: 16,
        marginBottom: 32,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.accent,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.accent,
    },
    bottomButtons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    backButton: {
        flex: 1,
        backgroundColor: "#FFE5DC",
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.accent,
    },
    homeButton: {
        flex: 1,
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
});
