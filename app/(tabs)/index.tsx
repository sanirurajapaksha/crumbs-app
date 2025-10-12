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

export default function HomeScreen() {
    const user = useStore((s: StoreState) => s.user);
    const posts = useStore((s: StoreState) => s.communityPosts);
    const loadPosts = useStore((s: StoreState) => s.loadPosts);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
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
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Image 
                        source={require("../../assets/images/crumbs-logo.png")} 
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greeting}>
                        {getGreeting()}, {user?.name || "Alex"}!
                    </Text>
                    <Text style={styles.subGreeting}>Discover new recipes tailored just for you.</Text>
                </View>

                {/* Recents Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recents</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {myRecipes.length > 0 ? (
                            myRecipes.slice(0, 5).map((recipe) => (
                                <TouchableOpacity key={recipe.id} style={styles.recipeCard} onPress={() => handleRecipePress(recipe)}>
                                    <Image 
                                        source={{ uri: recipe.heroImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800" }} 
                                        style={styles.recipeImage} 
                                    />
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
                            ))
                        ) : (
                            <View style={styles.emptyRecentsContainer}>
                                <MaterialIcons name="restaurant-menu" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyRecentsText}>No recipes yet</Text>
                                <Text style={styles.emptyRecentsSubtext}>Generate your first recipe to see it here!</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Community Posts Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Community Posts</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.accent} style={{ padding: 16 }} />
                        ) : posts.length > 0 ? (
                            posts.map((post) => <HomePagePostCard key={post.id} {...post} />)
                        ) : (
                            <Text style={{ color: colors.textMuted }}>No posts available</Text>
                        )}
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
        paddingTop: 40,
        paddingBottom: 8,
        alignItems: "center",
    },
    logo: {
        width: 250,
        height: 100,
    },
    greetingSection: {
        paddingHorizontal: 20,
        paddingVertical: 0,
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
    emptyRecentsContainer: {
        width: CARD_WIDTH,
        height: 200,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.neutral100,
        borderRadius: 16,
        paddingHorizontal: 20,
        marginRight: 16,
    },
    emptyRecentsText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textSecondary,
        marginTop: 12,
    },
    emptyRecentsSubtext: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        textAlign: "center",
    },
});
