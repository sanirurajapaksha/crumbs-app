import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "../../theme/colors";

const { width } = Dimensions.get("window");

export default function RecipeCompletionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const saveFavorite = useStore((s: StoreState) => s.saveFavorite);

    const [rating, setRating] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const scaleAnim = new Animated.Value(0);
    const fadeAnim = new Animated.Value(0);

    // Find the recipe
    let recipe = favorites.find((r) => r.id === id);
    if (!recipe) {
        recipe = myRecipes.find((r) => r.id === id);
    }

    useEffect(() => {
        // Celebration animation
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
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

    const shareOptions = [
        { id: 'community', icon: 'groups', label: 'Share to Community', color: '#FF6B6B', onPress: handleShareWithCommunity },
        { id: 'whatsapp', icon: 'chat', label: 'WhatsApp', color: '#25D366' },
        { id: 'instagram', icon: 'camera-alt', label: 'Instagram', color: '#E4405F' },
        { id: 'facebook', icon: 'facebook', label: 'Facebook', color: '#1877F2' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Animated Success Section */}
            <Animated.View 
                style={[
                    styles.celebrationSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }
                ]}
            >
                <View style={styles.confettiContainer}>
                    <Text style={styles.confetti}>🎉</Text>
                    <Text style={styles.confetti}>🎊</Text>
                    <Text style={styles.confetti}>✨</Text>
                </View>
                
                <View style={styles.successBadge}>
                    <View style={styles.checkmarkCircle}>
                        <MaterialIcons name="restaurant-menu" size={60} color="#fff" />
                    </View>
                </View>

                <Text style={styles.title}>Congratulations!</Text>
                <Text style={styles.subtitle}>You've completed {recipe?.title || 'this recipe'}</Text>
                <Text style={styles.emoji}>😋 �️ ✨</Text>
            </Animated.View>

            {/* Recipe Preview Card */}
            {recipe && (
                <View style={styles.recipePreviewCard}>
                    {recipe.heroImage && (
                        <Image source={{ uri: recipe.heroImage }} style={styles.recipeImage} />
                    )}
                    <View style={styles.recipeInfo}>
                        <Text style={styles.recipeName}>{recipe.title}</Text>
                        <View style={styles.recipeStats}>
                            <View style={styles.statItem}>
                                <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
                                <Text style={styles.statText}>{(recipe as any).cookTime || 30} min</Text>
                            </View>
                            <View style={styles.statItem}>
                                <MaterialIcons name="local-fire-department" size={16} color={colors.textMuted} />
                                <Text style={styles.statText}>{(recipe as any).calories || 450} cal</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Rating Section */}
            <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>How was it?</Text>
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => handleRating(star)}
                            style={styles.starButton}
                        >
                            <MaterialIcons
                                name={star <= rating ? "star" : "star-border"}
                                size={40}
                                color={star <= rating ? "#FFD700" : "#E0E0E0"}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                {rating > 0 && (
                    <Text style={styles.ratingText}>
                        {rating === 5 ? "Amazing! 🤩" : rating >= 4 ? "Great! 😊" : rating >= 3 ? "Good! 👍" : "Thanks for feedback!"}
                    </Text>
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity 
                        style={[styles.quickActionCard, isSaved && styles.quickActionCardActive]}
                        onPress={handleSaveToFavorites}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#FFE8E0' }]}>
                            <MaterialIcons 
                                name={isSaved ? "bookmark" : "bookmark-border"} 
                                size={28} 
                                color={colors.accent} 
                            />
                        </View>
                        <Text style={styles.quickActionText}>Save</Text>
                        {isSaved && <MaterialIcons name="check-circle" size={16} color="#4CAF50" />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.quickActionCard}
                        onPress={() => router.push({
                            pathname: "/screens/Recipe/RecipeDetail",
                            params: { id: id }
                        })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5FF' }]}>
                            <MaterialIcons name="visibility" size={28} color="#4A90E2" />
                        </View>
                        <Text style={styles.quickActionText}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionCard}>
                        <View style={[styles.quickActionIcon, { backgroundColor: '#F0E8FF' }]}>
                            <MaterialIcons name="replay" size={28} color="#8B5CF6" />
                        </View>
                        <Text style={styles.quickActionText}>Cook Again</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Share Section */}
            <View style={styles.shareSection}>
                <Text style={styles.sectionTitle}>Share Your Creation</Text>
                <Text style={styles.shareSubtitle}>Let others know about this amazing recipe!</Text>
                
                <View style={styles.shareOptionsGrid}>
                    {shareOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.shareOptionCard}
                            onPress={option.onPress}
                        >
                            <View style={[styles.shareIcon, { backgroundColor: option.color }]}>
                                <MaterialIcons name={option.icon as any} size={24} color="#fff" />
                            </View>
                            <Text style={styles.shareOptionText}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomSection}>
                <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => router.replace("/(tabs)")}
                >
                    <MaterialIcons name="home" size={24} color="#fff" />
                    <Text style={styles.primaryButtonText}>Back to Home</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={() => router.push("/(tabs)")}
                >
                    <Text style={styles.secondaryButtonText}>Discover More Recipes</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={colors.accent} />
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    celebrationSection: {
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    confettiContainer: {
        position: "absolute",
        top: 20,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 40,
    },
    confetti: {
        fontSize: 40,
    },
    successBadge: {
        marginBottom: 24,
    },
    checkmarkCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        marginBottom: 8,
        textAlign: "center",
        lineHeight: 24,
    },
    emoji: {
        fontSize: 24,
        marginTop: 8,
    },
    recipePreviewCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        margin: 20,
        marginTop: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    recipeImage: {
        width: "100%",
        height: 200,
    },
    recipeInfo: {
        padding: 20,
    },
    recipeName: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 12,
    },
    recipeStats: {
        flexDirection: "row",
        gap: 20,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statText: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: "600",
    },
    ratingSection: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginTop: 8,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.accent,
        marginTop: 8,
    },
    quickActionsSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    quickActionsGrid: {
        flexDirection: "row",
        gap: 12,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        alignItems: "center",
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: "transparent",
    },
    quickActionCardActive: {
        borderColor: "#4CAF50",
        backgroundColor: "#F1F8F4",
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    shareSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    shareSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 16,
        textAlign: "left",
    },
    shareOptionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    shareOptionCard: {
        width: (width - 64) / 2,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    shareIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    shareOptionText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    bottomSection: {
        paddingHorizontal: 20,
        marginTop: 32,
        gap: 12,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        backgroundColor: colors.accent,
        borderRadius: 20,
        gap: 10,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        backgroundColor: "#fff",
        borderRadius: 20,
        gap: 8,
        borderWidth: 2,
        borderColor: colors.accent,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.accent,
    },
});
