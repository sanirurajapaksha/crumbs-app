import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HomePagePostCard from "../screens/Community/HomePagePostCard";
import { StoreState, useStore, useUtilFunctions, UtilFunctions } from "../store/useStore";
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

export default function HomeScreen() {
    const user = useStore((s: StoreState) => s.user);
    const posts = useStore((s: StoreState) => s.communityPosts);
    const loadPosts = useStore((s: StoreState) => s.loadPosts);
    const loading = useUtilFunctions((state: UtilFunctions) => state.loading);
    const setLoading = useUtilFunctions((state: UtilFunctions) => state.setLoading);

    useEffect(() => {
        setLoading(true);
        loadPosts().finally(() => setLoading(false));
    }, []); // eslint-disable-line

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const handleRecipePress = (recipe: Recipe) => {
        // Navigate to recipe detail
        router.push(`/screens/Recipe/RecipeDetail?id=${recipe.id}`);
    };

    const handleGenerateRecipe = () => {
        // Navigate to generate tab
        router.push("/favorites");
    };

    return (
        <View style={styles.wrapper}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Top bar */}
                <View style={styles.topBar}>
                    <View style={styles.brandMark}>
                        <View style={styles.brandIcon}>
                            <MaterialIcons name="restaurant-menu" size={16} color={colors.accent} />
                        </View>
                        <Text style={styles.brandText}>crumbs</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/screens/Settings/SettingsScreen")}>
                        <MaterialIcons name="person-outline" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Greeting */}
                <View style={styles.greetingCard}>
                    <Text style={styles.greetingLabel}>Welcome back</Text>
                    <Text style={styles.greetingTitle}>
                        {getGreeting()}, {user?.name || "Alex"}.
                    </Text>
                    <Text style={styles.greetingSubtitle}>Here is what other cooks are making tonight.</Text>
                </View>

                {/* Recents Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recently cooked</Text>
                        <TouchableOpacity onPress={() => router.push("/screens/Recipe/RecipeGeneratorScreen")}>
                            <Text style={styles.sectionLink}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
                        {mockRecentRecipes.map((recipe) => (
                            <TouchableOpacity
                                key={recipe.id}
                                style={styles.recipeCard}
                                onPress={() => handleRecipePress(recipe)}
                                activeOpacity={0.85}
                            >
                                <Image source={{ uri: recipe.heroImage }} style={styles.recipeImage} />
                                <View style={styles.recipeShade} />
                                <View style={styles.recipeFooter}>
                                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                    <View style={styles.recipeMeta}>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons name="schedule" size={14} color={colors.white} />
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

                {/* Community Posts Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Community spotlight</Text>
                        <TouchableOpacity onPress={() => router.push("/community")}>
                            <Text style={styles.sectionLink}>Explore</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.communityPanel}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communityRow}>
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.accent} style={styles.loadingState} />
                            ) : posts.length > 0 ? (
                                posts.map((post) => <HomePagePostCard key={post.id} {...post} />)
                            ) : (
                                <Text style={styles.emptyCopy}>No posts yet. Share your first creation!</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Floating Generate Recipe Button */}
            <TouchableOpacity style={styles.floatingButton} activeOpacity={0.85} onPress={handleGenerateRecipe}>
                <MaterialIcons name="auto-awesome" size={20} color={colors.white} />
                <Text style={styles.floatingText}>Generate recipe</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: colors.surfaceMuted,
    },
    container: {
        flex: 1,
        backgroundColor: colors.surfaceMuted,
    },
    content: {
        paddingBottom: 40,
    },
    topBar: {
        paddingHorizontal: 20,
        paddingTop: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    brandMark: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    brandIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accentSubtle,
        alignItems: "center",
        justifyContent: "center",
    },
    brandText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textPrimary,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondarySubtle,
        alignItems: "center",
        justifyContent: "center",
    },
    greetingCard: {
        marginTop: 24,
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 24,
        backgroundColor: colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 32,
        elevation: 6,
    },
    greetingLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
    },
    greetingTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    greetingSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    section: {
        marginTop: 32,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    sectionLink: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.secondary,
    },
    cardRow: {
        paddingLeft: 20,
        paddingRight: 12,
        gap: 16,
    },
    recipeCard: {
        width: CARD_WIDTH,
        height: 240,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: colors.secondarySubtle,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 8,
    },
    recipeImage: {
        width: "100%",
        height: "100%",
    },
    recipeShade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(16,24,40,0.2)",
    },
    recipeFooter: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
        borderRadius: 18,
        padding: 14,
        backgroundColor: "rgba(16,24,40,0.72)",
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.white,
        marginBottom: 10,
    },
    recipeMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.white,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.14)",
    },
    tagText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.white,
    },
    communityPanel: {
        marginHorizontal: 20,
        borderRadius: 24,
        backgroundColor: colors.surface,
        paddingVertical: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 4,
    },
    communityRow: {
        paddingHorizontal: 16,
        gap: 16,
    },
    loadingState: {
        paddingHorizontal: 16,
    },
    emptyCopy: {
        color: colors.textMuted,
        fontSize: 14,
    },
    floatingButton: {
        position: "absolute",
        bottom: 28,
        right: 20,
        paddingHorizontal: 26,
        paddingVertical: 18,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.accent,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 10,
    },
    floatingText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.white,
        letterSpacing: 0.2,
        textTransform: "capitalize",
    },
});
