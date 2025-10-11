import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { StoreState, useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { PantryItem } from "../../types";

const { width } = Dimensions.get("window");

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

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<string>("");
    const [servings, setServings] = useState<number>(2);
    const [maxTime, setMaxTime] = useState<number>(45);
    const [isGenerating, setIsGenerating] = useState(false);

    const toggleDietary = (id: string) => {
        setSelectedDietary((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        );
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
            Alert.alert(
                "Generation Failed",
                error.message || "Failed to generate recipe. Please try again."
            );
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

    // Get top pantry items for display
    const displayPantryItems = pantryItems.slice(0, 5);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>What's for Dinner?</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="What are we cooking?"
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Your Pantry Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Pantry</Text>
                        <TouchableOpacity onPress={() => router.push("/screens/Pantry/PantryManage")}>
                            <Text style={styles.viewAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pantryScroll}>
                        {displayPantryItems.map((item) => (
                            <View key={item.id} style={styles.pantryCard}>
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={styles.pantryImage} />
                                ) : (
                                    <View style={[styles.pantryImage, styles.pantryImagePlaceholder]}>
                                        <Text style={styles.pantryImageEmoji}>🥘</Text>
                                    </View>
                                )}
                                <Text style={styles.pantryItemName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                {item.quantity && (
                                    <Text style={styles.pantryItemQty}>{item.quantity}</Text>
                                )}
                            </View>
                        ))}
                        <TouchableOpacity
                            style={[styles.pantryCard, styles.addCard]}
                            onPress={() => router.push("/screens/Pantry/PantryInput")}
                        >
                            <View style={styles.addIconContainer}>
                                <MaterialIcons name="add" size={32} color={colors.accent} />
                            </View>
                            <Text style={styles.addText}>Add</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Input Methods */}
                <View style={styles.inputMethodsContainer}>
                    <TouchableOpacity style={styles.inputMethod} onPress={() => navigateToPantry("camera")}>
                        <View style={styles.inputMethodIcon}>
                            <MaterialIcons name="photo-camera" size={24} color={colors.accent} />
                        </View>
                        <Text style={styles.inputMethodText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inputMethod} onPress={() => navigateToPantry("voice")}>
                        <View style={styles.inputMethodIcon}>
                            <MaterialIcons name="mic" size={24} color={colors.accent} />
                        </View>
                        <Text style={styles.inputMethodText}>Voice</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inputMethod} onPress={() => navigateToPantry("manual")}>
                        <View style={styles.inputMethodIcon}>
                            <MaterialIcons name="edit" size={24} color={colors.accent} />
                        </View>
                        <Text style={styles.inputMethodText}>Manual</Text>
                    </TouchableOpacity>
                </View>

                {/* Dietary Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dietary Preferences</Text>
                    <View style={styles.chipsContainer}>
                        {DIETARY_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.chip, selectedDietary.includes(option.id) && styles.chipSelected]}
                                onPress={() => toggleDietary(option.id)}
                            >
                                <Text style={styles.chipEmoji}>{option.icon}</Text>
                                <Text
                                    style={[
                                        styles.chipText,
                                        selectedDietary.includes(option.id) && styles.chipTextSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* My Goal Dropdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Goal</Text>
                    <View style={styles.goalsContainer}>
                        {HEALTH_GOALS.map((goal) => (
                            <TouchableOpacity
                                key={goal.id}
                                style={[styles.goalOption, selectedGoal === goal.id && styles.goalOptionSelected]}
                                onPress={() => selectGoal(goal.id)}
                            >
                                <Text style={styles.goalEmoji}>{goal.icon}</Text>
                                <Text
                                    style={[
                                        styles.goalText,
                                        selectedGoal === goal.id && styles.goalTextSelected,
                                    ]}
                                >
                                    {goal.label}
                                </Text>
                                {selectedGoal === goal.id && (
                                    <MaterialIcons name="check-circle" size={20} color={colors.accent} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Additional Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.preferencesRow}>
                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>Servings</Text>
                            <View style={styles.counterContainer}>
                                <TouchableOpacity
                                    style={styles.counterButton}
                                    onPress={() => setServings(Math.max(1, servings - 1))}
                                >
                                    <MaterialIcons name="remove" size={20} color={colors.textPrimary} />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{servings}</Text>
                                <TouchableOpacity
                                    style={styles.counterButton}
                                    onPress={() => setServings(Math.min(12, servings + 1))}
                                >
                                    <MaterialIcons name="add" size={20} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.preferenceItem}>
                            <Text style={styles.preferenceLabel}>Max Time (min)</Text>
                            <View style={styles.counterContainer}>
                                <TouchableOpacity
                                    style={styles.counterButton}
                                    onPress={() => setMaxTime(Math.max(15, maxTime - 15))}
                                >
                                    <MaterialIcons name="remove" size={20} color={colors.textPrimary} />
                                </TouchableOpacity>
                                <Text style={styles.counterValue}>{maxTime}</Text>
                                <TouchableOpacity
                                    style={styles.counterButton}
                                    onPress={() => setMaxTime(Math.min(180, maxTime + 15))}
                                >
                                    <MaterialIcons name="add" size={20} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Spacer for button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Generate Button - Fixed at bottom */}
            <View style={styles.generateButtonContainer}>
                <TouchableOpacity
                    style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                    onPress={handleGenerateRecipe}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateButtonText}>Generating Recipe...</Text>
                        </>
                    ) : (
                        <Text style={styles.generateButtonText}>Generate Recipe</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF5F0",
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    viewAllText: {
        fontSize: 14,
        color: colors.accent,
        fontWeight: "600",
    },
    pantryScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    pantryCard: {
        width: 100,
        marginRight: 12,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    pantryImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    pantryImagePlaceholder: {
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
    },
    pantryImageEmoji: {
        fontSize: 30,
    },
    pantryItemName: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    pantryItemQty: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    addCard: {
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: colors.accent,
        backgroundColor: "transparent",
    },
    addIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#FFF5F0",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    addText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.accent,
    },
    inputMethodsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    inputMethod: {
        alignItems: "center",
    },
    inputMethodIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#FFE5DC",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    inputMethodText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    chipEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    chipText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    chipTextSelected: {
        color: "#fff",
    },
    goalsContainer: {
        gap: 12,
    },
    goalOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    goalOptionSelected: {
        backgroundColor: "#FFF5F0",
        borderColor: colors.accent,
        borderWidth: 2,
    },
    goalEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    goalText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    goalTextSelected: {
        color: colors.accent,
    },
    preferencesRow: {
        flexDirection: "row",
        gap: 12,
    },
    preferenceItem: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    preferenceLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 12,
    },
    counterContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    counterButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
    },
    counterValue: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    generateButtonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "#FFF5F0",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    generateButton: {
        flexDirection: "row",
        backgroundColor: colors.accent,
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    generateButtonDisabled: {
        opacity: 0.7,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
});
