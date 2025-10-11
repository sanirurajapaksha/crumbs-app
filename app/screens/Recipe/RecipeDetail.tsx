import { MaterialIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { MacroStrip } from "../../components/MacroStrip";
import { ModalSheet } from "../../components/ModalSheet";
import { StoreState, useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { Recipe } from "../../types";

export default function RecipeDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const saveFavorite = useStore((s: StoreState) => s.saveFavorite);
    const removeFavorite = useStore((s: StoreState) => s.removeFavorite);
    const pantry = useStore((s: StoreState) => s.pantryItems);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [showBoost, setShowBoost] = useState(false);
    const [showSwap, setShowSwap] = useState(false);
    const [showRegen, setShowRegen] = useState(false);

    useEffect(() => {
        // Check in favorites first, then myRecipes
        let found = favorites.find((r: Recipe) => r.id === id);
        if (!found) {
            found = myRecipes.find((r: Recipe) => r.id === id);
        }
        if (found) {
            setRecipe(found);
        } else {
            // fallback sample
            setRecipe({ 
                id: "mock-recipe-1", 
                title: "Recipe Not Found", 
                ingredients: [], 
                steps: [], 
                alternatives: [] 
            });
        }
    }, [id, favorites, myRecipes]);

    if (!recipe)
        return (
            <View style={styles.center}>
                <Text>Loading...</Text>
            </View>
        );
    const isFav = favorites.some((r: Recipe) => r.id === recipe.id);

    const limitedSteps = recipe.steps.slice(0, 2);

    const applyBoost = () => {
        setRecipe((r) => (r ? { ...r, protein_g: (r.protein_g || 20) + 8 } : r));
        setShowBoost(false);
    };
    const applySwap = () => {
        setRecipe((r) => (r ? { ...r, ingredients: r.ingredients.map((i) => (i.name === "Chickpeas" ? { ...i, name: "Black Beans" } : i)) } : r));
        setShowSwap(false);
    };
    const applyRegen = (id: string) => {
        setRecipe((r) => (r ? { ...r, title: id === "alt-1" ? "Tofu Power Bowl" : "Lentil Quick Bowl" } : r));
        setShowRegen(false);
    };

    const toggleFavorite = () => {
        if (isFav) {
            removeFavorite(recipe.id);
        } else {
            saveFavorite(recipe);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FFF5F0" }}>
            {/* Header with Back Button */}
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFavorite} style={styles.bookmarkBtn}>
                    <MaterialIcons 
                        name={isFav ? "bookmark" : "bookmark-border"} 
                        size={24} 
                        color={isFav ? colors.accent : colors.textPrimary} 
                    />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {recipe.heroImage && <Image source={{ uri: recipe.heroImage }} style={styles.hero} />}
                
                <View style={styles.contentCard}>
                    <Text style={styles.title}>{recipe.title}</Text>
                    
                    {/* Nutrition Section */}
                    <View style={styles.nutritionSection}>
                        <Text style={styles.nutritionLabel}>Nutrition</Text>
                        <View style={styles.nutritionBadge}>
                            <Text style={styles.nutritionBadgeText}>Estimated</Text>
                        </View>
                    </View>
                    
                    <MacroStrip recipe={recipe} />
                    
                    {recipe.allergyList && recipe.allergyList.length > 0 && (
                        <View style={styles.allergyCard}>
                            <MaterialIcons name="warning" size={20} color={colors.accent} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.allergyTitle}>Allergy Warning</Text>
                                <Text style={styles.allergyText}>Contains {recipe.allergyList.join(", ")}.</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
            
            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={styles.cookBtn}
                    onPress={() => {
                        if (recipe.steps && recipe.steps.length > 0) {
                            router.push({
                                pathname: "/screens/Recipe/StepsOverview",
                                params: { id: recipe.id }
                            });
                        } else {
                            Alert.alert("No Steps", "This recipe doesn't have cooking steps yet.");
                        }
                    }}
                >
                    <Text style={styles.cookTxt}>Start Cooking</Text>
                </TouchableOpacity>
            </View>

            <ModalSheet visible={showBoost} onClose={() => setShowBoost(false)} title="Protein Boost">
                <Text>Try adding Tofu +8g protein.</Text>
                <TouchableOpacity style={styles.sheetBtn} onPress={applyBoost}>
                    <Text>Apply</Text>
                </TouchableOpacity>
            </ModalSheet>
            <ModalSheet visible={showSwap} onClose={() => setShowSwap(false)} title="Swap Ingredient">
                <Text>Swap Chickpeas with Black Beans (similar protein)</Text>
                <TouchableOpacity style={styles.sheetBtn} onPress={applySwap}>
                    <Text>Swap</Text>
                </TouchableOpacity>
            </ModalSheet>
            <ModalSheet visible={showRegen} onClose={() => setShowRegen(false)} title="Alternatives">
                {recipe.alternatives?.map((a) => (
                    <TouchableOpacity key={a.id} style={styles.sheetBtn} onPress={() => applyRegen(a.id)}>
                        <Text>{a.title}</Text>
                    </TouchableOpacity>
                ))}
            </ModalSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    topHeader: {
        position: "absolute",
        top: 40,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bookmarkBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    hero: { 
        width: "100%", 
        height: 300, 
        backgroundColor: "#eee",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    contentCard: {
        backgroundColor: "#fff",
        marginTop: -24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        minHeight: 400,
    },
    title: { 
        fontSize: 24, 
        fontWeight: "700", 
        color: colors.textPrimary,
        marginBottom: 16,
    },
    nutritionSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    nutritionLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    nutritionBadge: {
        backgroundColor: "#FFE5DC",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    nutritionBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.accent,
    },
    allergyCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF5F0",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FFE5DC",
        marginTop: 16,
    },
    allergyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    allergyText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    headerRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 4 },
    badges: { fontSize: 12, color: "#555", paddingHorizontal: 16, marginBottom: 8 },
    allergy: { color: "#c00", fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
    section: { fontSize: 16, fontWeight: "600", marginTop: 16, paddingHorizontal: 16 },
    item: { fontSize: 14, paddingHorizontal: 16, marginTop: 6 },
    link: { color: "#0a7", fontSize: 13, marginHorizontal: 16, marginTop: 4 },
    actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 16 },
    actionBtn: { backgroundColor: "#222", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
    actionTxt: { color: "#fff", fontSize: 12 },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: "#FFF5F0",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    cookBtn: { 
        backgroundColor: colors.accent, 
        paddingVertical: 18, 
        borderRadius: 28,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cookTxt: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 18 },
    sheetBtn: { backgroundColor: "#eee", padding: 12, borderRadius: 8, marginTop: 12 },
});
