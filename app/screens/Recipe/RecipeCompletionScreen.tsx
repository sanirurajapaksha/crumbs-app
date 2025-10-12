import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "../../theme/colors";

export default function RecipeCompletionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const saveFavorite = useStore((s: StoreState) => s.saveFavorite);

    const [rating, setRating] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const fadeAnim = new Animated.Value(0);

    // Find the recipe
    let recipe = favorites.find((r) => r.id === id);
    if (!recipe) {
        recipe = myRecipes.find((r) => r.id === id);
    }

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleSaveToFavorites = () => {
        if (recipe) {
            saveFavorite(recipe);
            setIsSaved(true);
        }
    };

    const handleRating = (stars: number) => {
        setRating(stars);
    };

    const handleShareWithCommunity = () => {
        router.push({
            pathname: "/screens/Community/ShareRecipe",
            params: { recipeId: id }
        });
    };


    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Minimalist Success Icon */}
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="check" size={32} color="#fff" />
                    </View>
                    <Text style={styles.title}>Well Done!</Text>
                    <Text style={styles.subtitle}>Recipe completed successfully</Text>
                </Animated.View>

                {/* Recipe Image - Full Width */}
                {recipe?.heroImage && (
                    <View style={styles.imageContainer}>
                        <Image 
                            source={{ uri: recipe.heroImage }} 
                            style={styles.recipeImage}
                            resizeMode="cover"
                        />
                    </View>
                )}

                {/* Recipe Name */}
                {recipe && (
                    <View style={styles.recipeInfo}>
                        <Text style={styles.recipeName}>{recipe.title}</Text>
                    </View>
                )}

                {/* Star Rating - Minimal */}
                <View style={styles.ratingContainer}>
                    <Text style={styles.ratingLabel}>Rate your experience</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleRating(star)}
                                style={styles.starButton}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={star <= rating ? "star" : "star-border"}
                                    size={32}
                                    color={star <= rating ? colors.accent : "#E0E0E0"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quick Actions - Icon Grid */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity 
                        style={styles.actionItem}
                        onPress={handleSaveToFavorites}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons 
                            name={isSaved ? "bookmark" : "bookmark-border"} 
                            size={24} 
                            color={isSaved ? colors.accent : colors.textSecondary} 
                        />
                        <Text style={[styles.actionLabel, isSaved && styles.actionLabelActive]}>
                            {isSaved ? "Saved" : "Save"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionItem}
                        onPress={handleShareWithCommunity}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="share" size={24} color={colors.textSecondary} />
                        <Text style={styles.actionLabel}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionItem}
                        onPress={() => router.push({
                            pathname: "/screens/Recipe/RecipeDetail",
                            params: { id: id }
                        })}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="description" size={24} color={colors.textSecondary} />
                        <Text style={styles.actionLabel}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionItem}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="replay" size={24} color={colors.textSecondary} />
                        <Text style={styles.actionLabel}>Repeat</Text>
                    </TouchableOpacity>
                </View>

                {/* Primary CTA */}
                <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => router.replace("/(tabs)")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Back to Home</Text>
                </TouchableOpacity>

                {/* Secondary Link */}
                <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => router.push("/(tabs)")}
                    activeOpacity={0.7}
                >
                    <Text style={styles.secondaryButtonText}>Explore More Recipes</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        fontWeight: "400",
        color: colors.textSecondary,
        textAlign: "center",
    },
    imageContainer: {
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 16,
        overflow: "hidden",
    },
    recipeImage: {
        width: "100%",
        height: 240,
    },
    recipeInfo: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    recipeName: {
        fontSize: 20,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    ratingContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
        alignItems: "center",
    },
    ratingLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textSecondary,
        marginBottom: 16,
    },
    starsRow: {
        flexDirection: "row",
        gap: 12,
    },
    starButton: {
        padding: 4,
    },
    actionsGrid: {
        flexDirection: "row",
        paddingHorizontal: 24,
        marginBottom: 32,
        justifyContent: "space-around",
    },
    actionItem: {
        alignItems: "center",
        gap: 8,
        padding: 12,
        minWidth: 70,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textSecondary,
    },
    actionLabelActive: {
        color: colors.accent,
        fontWeight: "600",
    },
    primaryButton: {
        marginHorizontal: 24,
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    secondaryButton: {
        marginHorizontal: 24,
        paddingVertical: 16,
        alignItems: "center",
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: "500",
        color: colors.textSecondary,
    },
});
