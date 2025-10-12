import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RecipeGenerationLoader from "../../components/RecipeGenerationLoader";
import { StoreState, useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";

// Dietary categories
const DIETARY_OPTIONS = [
    { id: "vegan", label: "Vegan", icon: "🌱" },
    { id: "vegetarian", label: "Vegetarian", icon: "🥗" },
    { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
    { id: "dairy-free", label: "Dairy-Free", icon: "🥛" },
    { id: "low-carb", label: "Low-Carb", icon: "🥩" },
    { id: "keto", label: "Keto", icon: "🥑" },
    { id: "paleo", label: "Paleo", icon: "🍖" },
    { id: "low-cost", label: "Low-Cost", icon: "💰" },
];

// Health goals
const HEALTH_GOALS = [
    { id: "weight-loss", label: "Weight Loss", icon: "⚖️" },
    { id: "muscle-gain", label: "Muscle Gain", icon: "💪" },
    { id: "balanced", label: "Balanced", icon: "🎯" },
    { id: "energy", label: "Energy Boost", icon: "⚡" },
    { id: "heart-health", label: "Heart Health", icon: "❤️" },
];

export default function RecipeGeneratorScreen() {
    const pantryItems = useStore((s: StoreState) => s.pantryItems);
    const generateRecipeWithAI = useStore((s: StoreState) => s.generateRecipeWithAI);
    const removePantryItem = useStore((s: StoreState) => s.removePantryItem);

    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<string>("");
    const [servings, setServings] = useState<number>(2);
    const [maxTime, setMaxTime] = useState<number>(45);
    const [isGenerating, setIsGenerating] = useState(false);

    const toggleDietary = (id: string) => {
        setSelectedDietary((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
    };

    const selectGoal = (id: string) => {
        setSelectedGoal((prev) => (prev === id ? "" : id));
    };

    const handleGenerateRecipe = async () => {
        if (pantryItems.length === 0) {
            Alert.alert("No Pantry Items", "Please add items to your pantry first.");
            return;
        }

        setIsGenerating(true);
        try {
            const recipe = await generateRecipeWithAI(pantryItems, {
                categoryId: selectedDietary,
                goal: selectedGoal,
                servings: servings,
                cookingTimeMax: maxTime,
            });

            // Navigate to the generated recipe detail
            router.push({
                pathname: "/screens/Recipe/RecipeDetail",
                params: { id: recipe.id },
            });
        } catch (error: any) {
            Alert.alert("Generation Failed", error.message || "Failed to generate recipe. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const navigateToPantry = (mode: "camera" | "voice" | "manual") => {
        router.push({
            pathname: "/screens/Pantry/PantryInput",
            params: { mode },
        });
    };

    const uniquePantryItems = useMemo(() => {
        const map = new Map<string, (typeof pantryItems)[number]>();
        pantryItems.forEach((item) => {
            const key = (item.name || item.id).toLowerCase();
            if (!map.has(key)) {
                map.set(key, item);
            }
        });
        return Array.from(map.values());
    }, [pantryItems]);

    const displayPantryItems = uniquePantryItems.slice(0, 12);
    const extraCount = pantryItems.length - displayPantryItems.length;
    const hasMoreItems = extraCount > 0;

    const handleRemoveIngredient = (itemId: string, itemName: string) => {
        Alert.alert("Remove ingredient", `Remove ${itemName} from your pantry?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                    try {
                        await removePantryItem(itemId);
                    } catch {
                        Alert.alert("Something went wrong", "Please try removing that ingredient again.");
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerEyebrow}>AI recipe generator</Text>
                    <Text style={styles.headerTitle}>Turn ingredients into dinner.</Text>
                    <Text style={styles.headerSubtitle}>Choose your preferences and let Crumbs suggest something fresh.</Text>
                </View>

                <View style={styles.pantryCard}>
                    <View style={styles.pantryInfo}>
                        <View style={styles.pantryIcon}>
                            <MaterialIcons name="kitchen" size={24} color={colors.accent} />
                        </View>
                        <View>
                            <Text style={styles.pantryTitle}>Your pantry</Text>
                            <Text style={styles.pantryCount}>
                                {pantryItems.length} ingredient{pantryItems.length === 1 ? "" : "s"} ready
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.manageButton} onPress={() => router.push("/(tabs)/pantry")}>
                        <Text style={styles.manageText}>Manage</Text>
                        <MaterialIcons name="chevron-right" size={18} color={colors.secondary} />
                    </TouchableOpacity>
                </View>

                {pantryItems.length > 0 ? (
                    <View style={styles.ingredientSection}>
                        <Text style={styles.sectionLabel}>In the mix</Text>
                        <View style={styles.chipWrap}>
                            {displayPantryItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.ingredientChip}
                                    activeOpacity={0.85}
                                    onLongPress={() => handleRemoveIngredient(item.id, item.name)}
                                >
                                    {item.imageUrl ? (
                                        <Image source={{ uri: item.imageUrl }} style={styles.chipImage} />
                                    ) : (
                                        <View style={styles.chipFallback}>
                                            <Text style={styles.chipInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.chipText} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {hasMoreItems && <Text style={styles.moreCount}>+{extraCount} more ingredients</Text>}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialIcons name="shopping-basket" size={36} color={colors.accent} />
                        </View>
                        <Text style={styles.emptyTitle}>Your pantry is empty</Text>
                        <Text style={styles.emptySubtitle}>Add a few staples to let the AI craft personalised recipes.</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={() => navigateToPantry("manual")}>
                            <Text style={styles.emptyButtonText}>Add ingredients</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputSection}>
                    <Text style={styles.sectionLabel}>Add more</Text>
                    <View style={styles.inputRow}>
                        <TouchableOpacity style={styles.inputMethod} onPress={() => navigateToPantry("camera")} activeOpacity={0.85}>
                            <View style={[styles.inputIcon, { backgroundColor: colors.accentSubtle }]}>
                                <MaterialIcons name="photo-camera" size={22} color={colors.accent} />
                            </View>
                            <Text style={styles.inputTitle}>Snap</Text>
                            <Text style={styles.inputHint}>Take a picture</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputMethod} onPress={() => navigateToPantry("voice")} activeOpacity={0.85}>
                            <View style={[styles.inputIcon, { backgroundColor: colors.secondarySubtle }]}>
                                <MaterialIcons name="mic" size={22} color={colors.secondary} />
                            </View>
                            <Text style={styles.inputTitle}>Speak</Text>
                            <Text style={styles.inputHint}>Voice to add</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inputMethod} onPress={() => navigateToPantry("manual")} activeOpacity={0.85}>
                            <View style={[styles.inputIcon, { backgroundColor: colors.neutral100 }]}>
                                <MaterialIcons name="edit" size={22} color={colors.textPrimary} />
                            </View>
                            <Text style={styles.inputTitle}>Type</Text>
                            <Text style={styles.inputHint}>Manual entry</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.customizationSection}>
                    <Text style={styles.sectionLabel}>Preferences</Text>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="restaurant" size={20} color={colors.secondary} />
                            <Text style={styles.cardTitle}>Dietary focus</Text>
                        </View>
                        <View style={styles.pillsContainer}>
                            {DIETARY_OPTIONS.map((option) => {
                                const selected = selectedDietary.includes(option.id);
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[styles.pill, selected && styles.pillSelected]}
                                        onPress={() => toggleDietary(option.id)}
                                    >
                                        <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                                            {option.icon} {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="favorite" size={20} color={colors.secondary} />
                            <Text style={styles.cardTitle}>Health goal</Text>
                        </View>
                        <View style={styles.radioContainer}>
                            {HEALTH_GOALS.map((goal) => {
                                const selected = selectedGoal === goal.id;
                                return (
                                    <TouchableOpacity
                                        key={goal.id}
                                        style={[styles.radioOption, selected && styles.radioOptionSelected]}
                                        onPress={() => selectGoal(goal.id)}
                                    >
                                        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                            {selected && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={styles.radioLabel}>
                                            {goal.icon} {goal.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceBlock}>
                            <Text style={styles.preferenceTitle}>Servings</Text>
                            <View style={styles.preferenceControls}>
                                <TouchableOpacity style={styles.controlButton} onPress={() => setServings(Math.max(1, servings - 1))}>
                                    <MaterialIcons name="remove" size={20} color={colors.secondary} />
                                </TouchableOpacity>
                                <View style={styles.valueGroup}>
                                    <Text style={styles.valueNumber}>{servings}</Text>
                                    <Text style={styles.valueLabel}>people</Text>
                                </View>
                                <TouchableOpacity style={styles.controlButton} onPress={() => setServings(Math.min(12, servings + 1))}>
                                    <MaterialIcons name="add" size={20} color={colors.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.preferenceBlock}>
                            <Text style={styles.preferenceTitle}>Max time</Text>
                            <View style={styles.preferenceControls}>
                                <TouchableOpacity style={styles.controlButton} onPress={() => setMaxTime(Math.max(15, maxTime - 15))}>
                                    <MaterialIcons name="remove" size={20} color={colors.secondary} />
                                </TouchableOpacity>
                                <View style={styles.valueGroup}>
                                    <Text style={styles.valueNumber}>{maxTime}</Text>
                                    <Text style={styles.valueLabel}>minutes</Text>
                                </View>
                                <TouchableOpacity style={styles.controlButton} onPress={() => setMaxTime(Math.min(180, maxTime + 15))}>
                                    <MaterialIcons name="add" size={20} color={colors.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.generateBar}>
                <TouchableOpacity style={styles.generateButton} onPress={handleGenerateRecipe} disabled={isGenerating} activeOpacity={0.85}>
                    <MaterialIcons name="auto-awesome" size={20} color={colors.white} />
                    <Text style={styles.generateButtonText}>Generate AI recipe</Text>
                </TouchableOpacity>
            </View>

            <RecipeGenerationLoader visible={isGenerating} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surfaceMuted,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: 140,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 48,
        gap: 12,
    },
    headerEyebrow: {
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: colors.textMuted,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.textPrimary,
        lineHeight: 34,
    },
    headerSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    pantryCard: {
        marginTop: 24,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 1,
        shadowRadius: 32,
        elevation: 6,
    },
    pantryInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    pantryIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.accentSubtle,
        alignItems: "center",
        justifyContent: "center",
    },
    pantryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    pantryCount: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
        fontWeight: "500",
    },
    manageButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.secondarySubtle,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    manageText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.secondary,
    },
    ingredientSection: {
        marginTop: 32,
        marginHorizontal: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textMuted,
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 16,
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    ingredientChip: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.neutral200,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 120,
    },
    chipImage: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 10,
        backgroundColor: colors.neutral100,
    },
    chipFallback: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 10,
        backgroundColor: colors.secondarySubtle,
        alignItems: "center",
        justifyContent: "center",
    },
    chipInitial: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.secondary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textPrimary,
        flexShrink: 1,
    },
    moreCount: {
        marginTop: 12,
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: "500",
    },
    emptyState: {
        marginHorizontal: 20,
        marginTop: 28,
        padding: 28,
        borderRadius: 24,
        backgroundColor: colors.surface,
        alignItems: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.accentSubtle,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    emptyButton: {
        marginTop: 20,
        backgroundColor: colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 18,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.white,
    },
    inputSection: {
        marginTop: 40,
        marginHorizontal: 20,
    },
    inputRow: {
        flexDirection: "row",
        gap: 12,
    },
    inputMethod: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        alignItems: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    inputIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    inputTitle: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    inputHint: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    customizationSection: {
        marginTop: 40,
        marginHorizontal: 20,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    pillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.neutral200,
        backgroundColor: colors.surface,
    },
    pillSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    pillText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    pillTextSelected: {
        color: colors.white,
    },
    radioContainer: {
        gap: 10,
    },
    radioOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.neutral200,
        padding: 14,
    },
    radioOptionSelected: {
        borderColor: colors.secondary,
        backgroundColor: colors.secondarySubtle,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.neutral300,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioOuterSelected: {
        borderColor: colors.secondary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.secondary,
    },
    radioLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    preferenceRow: {
        flexDirection: "row",
        gap: 16,
    },
    preferenceBlock: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    preferenceTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    preferenceControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondarySubtle,
        alignItems: "center",
        justifyContent: "center",
    },
    valueGroup: {
        alignItems: "center",
    },
    valueNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.secondary,
    },
    valueLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    generateBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.8,
        shadowRadius: 16,
        elevation: 12,
    },
    generateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: colors.accent,
        borderRadius: 20,
        paddingVertical: 18,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.white,
        letterSpacing: 0.2,
    },
});
