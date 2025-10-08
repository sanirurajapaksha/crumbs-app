import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { useStore, StoreState } from "../../store/useStore";
import { MacroStrip } from "../../components/MacroStrip";
import { ModalSheet } from "../../components/ModalSheet";
import { Recipe } from "../../types";

export default function RecipeDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const saveFavorite = useStore((s: StoreState) => s.saveFavorite);
    const removeFavorite = useStore((s: StoreState) => s.removeFavorite);
    const pantry = useStore((s: StoreState) => s.pantryItems);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [showBoost, setShowBoost] = useState(false);
    const [showSwap, setShowSwap] = useState(false);
    const [showRegen, setShowRegen] = useState(false);

    useEffect(() => {
        // For demo we reconstruct from favorites or use mock fallback if needed
        const found = favorites.find((r: Recipe) => r.id === id);
        if (found) setRecipe(found);
        else {
            // fallback sample: could store last generated recipe globally if desired
            setRecipe({ id: "mock-recipe-1", title: "Protein Packed Veggie Bowl", ingredients: [], steps: [], alternatives: [] });
        }
    }, [id, favorites]);

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
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {recipe.heroImage && <Image source={{ uri: recipe.heroImage }} style={styles.hero} />}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{recipe.title}</Text>
                    <TouchableOpacity onPress={toggleFavorite}>
                        <Text style={{ fontSize: 24 }}>{isFav ? "★" : "☆"}</Text>
                    </TouchableOpacity>
                </View>
                <MacroStrip recipe={recipe} />
                <Text style={styles.badges}>
                    Estimated • {recipe.timingTag || "<20min>"} • Pantry Match {pantry.length}%
                </Text>
                {recipe.allergyList && recipe.allergyList.length > 0 && (
                    <Text style={styles.allergy}>Allergens: {recipe.allergyList.join(", ")}</Text>
                )}
                <Text style={styles.section}>Ingredients</Text>
                {recipe.ingredients.map((i) => (
                    <Text key={i.name} style={styles.item}>
                        • {i.qty || ""} {i.name}
                    </Text>
                ))}
                <Text style={styles.section}>Steps</Text>
                {(recipe.steps.length > 0 ? limitedSteps : [{ stepNumber: 1, text: "Add steps later" }]).map((s) => (
                    <Text key={s.stepNumber} style={styles.item}>
                        {s.stepNumber}. {s.text}
                    </Text>
                ))}
                {recipe.steps.length > 2 && (
                    <Link href={{ pathname: "/screens/Recipe/StepsOverview", params: { id: recipe.id } } as any} asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Show all steps</Text>
                        </TouchableOpacity>
                    </Link>
                )}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowBoost(true)}>
                        <Text style={styles.actionTxt}>Boost Protein</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSwap(true)}>
                        <Text style={styles.actionTxt}>Swap Ingredient</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRegen(true)}>
                        <Text style={styles.actionTxt}>Regenerate</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <View style={styles.bottomBar}>
                <Link href={{ pathname: "/screens/Recipe/StepsOverview", params: { id: recipe.id } } as any} asChild>
                    <TouchableOpacity style={styles.cookBtn}>
                        <Text style={styles.cookTxt}>Start Cooking</Text>
                    </TouchableOpacity>
                </Link>
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
    hero: { width: "100%", height: 200, backgroundColor: "#eee" },
    title: { fontSize: 20, fontWeight: "700", flex: 1, paddingRight: 12 },
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
        padding: 12,
        backgroundColor: "#fff",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: "#ddd",
    },
    cookBtn: { backgroundColor: "#0a7", padding: 16, borderRadius: 10 },
    cookTxt: { color: "#fff", textAlign: "center", fontWeight: "700" },
    sheetBtn: { backgroundColor: "#eee", padding: 12, borderRadius: 8, marginTop: 12 },
});
