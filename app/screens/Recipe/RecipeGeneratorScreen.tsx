import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import RecipeGenerationLoader from "../../components/RecipeGenerationLoader";
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
    const displayPantryItems = pantryItems.slice(0, 8);

    return (
        <View style={styles.container}>
            {/* Custom Header with Gradient Background */}
            <View style={styles.headerGradient}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>What to Cook?</Text>
                        <Text style={styles.headerSubtitle}>Let AI create your perfect recipe</Text>
                    </View>
                    <TouchableOpacity style={styles.infoButton}>
                        <MaterialIcons name="info-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Pantry Status Card */}
                <View style={styles.pantryStatusCard}>
                    <View style={styles.pantryStatusLeft}>
                        <View style={styles.pantryIconContainer}>
                            <MaterialIcons name="kitchen" size={28} color={colors.accent} />
                        </View>
                        <View>
                            <Text style={styles.pantryStatusTitle}>Your Pantry</Text>
                            <Text style={styles.pantryStatusCount}>
                                {pantryItems.length} ingredient{pantryItems.length !== 1 ? 's' : ''} ready
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.managePantryButton}
                        onPress={() => router.push("/(tabs)/pantry")}
                    >
                        <Text style={styles.managePantryText}>Manage</Text>
                        <MaterialIcons name="chevron-right" size={18} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                {/* Pantry Items Preview */}
                {pantryItems.length > 0 ? (
                    <View style={styles.pantryPreviewSection}>
                        <View style={styles.pantryGrid}>
                            {displayPantryItems.map((item) => (
                                <View key={item.id} style={styles.pantryGridItem}>
                                    {item.imageUrl ? (
                                        <Image source={{ uri: item.imageUrl }} style={styles.pantryGridImage} />
                                    ) : (
                                        <View style={[styles.pantryGridImage, styles.pantryGridImagePlaceholder]}>
                                            <Text style={styles.pantryGridEmoji}>🥘</Text>
                                        </View>
                                    )}
                                    <Text style={styles.pantryGridName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyPantrySection}>
                        <View style={styles.emptyPantryCard}>
                            <View style={styles.emptyIconCircle}>
                                <MaterialIcons name="shopping-basket" size={40} color={colors.accent} />
                            </View>
                            <Text style={styles.emptyPantryTitle}>Start Adding Ingredients</Text>
                            <Text style={styles.emptyPantryText}>
                                Add items to your pantry to generate personalized recipes
                            </Text>
                        </View>
                    </View>
                )}

                {/* Quick Add Methods */}
                <View style={styles.quickAddSection}>
                    <Text style={styles.sectionLabel}>ADD INGREDIENTS</Text>
                    <View style={styles.quickAddGrid}>
                        <TouchableOpacity 
                            style={styles.quickAddCard} 
                            onPress={() => navigateToPantry("camera")}
                        >
                            <View style={[styles.quickAddIcon, { backgroundColor: '#FFE8E0' }]}>
                                <MaterialIcons name="photo-camera" size={32} color={colors.accent} />
                            </View>
                            <Text style={styles.quickAddTitle}>Snap Photo</Text>
                            <Text style={styles.quickAddDesc}>Take a picture</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.quickAddCard} 
                            onPress={() => navigateToPantry("voice")}
                        >
                            <View style={[styles.quickAddIcon, { backgroundColor: '#E8F5FF' }]}>
                                <MaterialIcons name="mic" size={32} color="#4A90E2" />
                            </View>
                            <Text style={styles.quickAddTitle}>Voice Input</Text>
                            <Text style={styles.quickAddDesc}>Speak to add</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.quickAddCard} 
                            onPress={() => navigateToPantry("manual")}
                        >
                            <View style={[styles.quickAddIcon, { backgroundColor: '#F0E8FF' }]}>
                                <MaterialIcons name="edit" size={32} color="#8B5CF6" />
                            </View>
                            <Text style={styles.quickAddTitle}>Type In</Text>
                            <Text style={styles.quickAddDesc}>Manual entry</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Customization Section */}
                <View style={styles.customizationSection}>
                    <Text style={styles.sectionLabel}>CUSTOMIZE YOUR RECIPE</Text>
                    
                    {/* Dietary Preferences - Compact Pills */}
                    <View style={styles.customizationCard}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="restaurant" size={20} color={colors.textPrimary} />
                            <Text style={styles.cardTitle}>Dietary Preferences</Text>
                        </View>
                        <View style={styles.pillsContainer}>
                            {DIETARY_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.pill, selectedDietary.includes(option.id) && styles.pillSelected]}
                                    onPress={() => toggleDietary(option.id)}
                                >
                                    <Text style={styles.pillEmoji}>{option.icon}</Text>
                                    <Text style={[styles.pillText, selectedDietary.includes(option.id) && styles.pillTextSelected]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Health Goals - Radio Style */}
                    <View style={styles.customizationCard}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="favorite" size={20} color={colors.textPrimary} />
                            <Text style={styles.cardTitle}>Health Goal</Text>
                        </View>
                        <View style={styles.radioContainer}>
                            {HEALTH_GOALS.map((goal) => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[styles.radioOption, selectedGoal === goal.id && styles.radioOptionSelected]}
                                    onPress={() => selectGoal(goal.id)}
                                >
                                    <View style={[styles.radioCircle, selectedGoal === goal.id && styles.radioCircleSelected]}>
                                        {selectedGoal === goal.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioEmoji}>{goal.icon}</Text>
                                    <Text style={[styles.radioText, selectedGoal === goal.id && styles.radioTextSelected]}>
                                        {goal.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Preferences - Modern Cards */}
                    <View style={styles.preferencesCard}>
                        <View style={styles.preferenceRow}>
                            <View style={styles.preferenceBox}>
                                <Text style={styles.preferenceTitle}>Servings</Text>
                                <View style={styles.preferenceControl}>
                                    <TouchableOpacity
                                        style={styles.controlButton}
                                        onPress={() => setServings(Math.max(1, servings - 1))}
                                    >
                                        <MaterialIcons name="remove-circle-outline" size={28} color={colors.accent} />
                                    </TouchableOpacity>
                                    <View style={styles.valueDisplay}>
                                        <Text style={styles.valueNumber}>{servings}</Text>
                                        <Text style={styles.valueLabel}>people</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.controlButton}
                                        onPress={() => setServings(Math.min(12, servings + 1))}
                                    >
                                        <MaterialIcons name="add-circle-outline" size={28} color={colors.accent} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.preferenceBox}>
                                <Text style={styles.preferenceTitle}>Max Time</Text>
                                <View style={styles.preferenceControl}>
                                    <TouchableOpacity
                                        style={styles.controlButton}
                                        onPress={() => setMaxTime(Math.max(15, maxTime - 15))}
                                    >
                                        <MaterialIcons name="remove-circle-outline" size={28} color={colors.accent} />
                                    </TouchableOpacity>
                                    <View style={styles.valueDisplay}>
                                        <Text style={styles.valueNumber}>{maxTime}</Text>
                                        <Text style={styles.valueLabel}>minutes</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.controlButton}
                                        onPress={() => setMaxTime(Math.min(180, maxTime + 15))}
                                    >
                                        <MaterialIcons name="add-circle-outline" size={28} color={colors.accent} />
                                    </TouchableOpacity>
                                </View>
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
                    style={styles.generateButton}
                    onPress={handleGenerateRecipe}
                    disabled={isGenerating}
                >
                    <MaterialIcons name="auto-awesome" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.generateButtonText}>Generate AI Recipe</Text>
                </TouchableOpacity>
            </View>

            {/* Loading Modal */}
            <RecipeGenerationLoader visible={isGenerating} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    // Header with Gradient
    headerGradient: {
        backgroundColor: colors.accent,
        paddingTop: 48,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    infoButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTextContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#fff",
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(255,255,255,0.9)",
        marginTop: 4,
    },
    // Pantry Status Card
    pantryStatusCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 20,
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    pantryStatusLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    pantryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#FFE8E0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    pantryStatusTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    pantryStatusCount: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textMuted,
        marginTop: 2,
    },
    managePantryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF5F0",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    managePantryText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.accent,
        marginRight: 4,
    },
    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    // Pantry Preview Grid
    pantryPreviewSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    pantryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    pantryGridItem: {
        width: (width - 64) / 4,
        alignItems: "center",
    },
    pantryGridImage: {
        width: (width - 64) / 4,
        height: (width - 64) / 4,
        borderRadius: 16,
        marginBottom: 6,
    },
    pantryGridImagePlaceholder: {
        backgroundColor: "#F8F8F8",
        alignItems: "center",
        justifyContent: "center",
    },
    pantryGridEmoji: {
        fontSize: 24,
    },
    pantryGridName: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    // Empty Pantry
    emptyPantrySection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    emptyPantryCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FFE8E0",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyPantryTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    emptyPantryText: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
    // Quick Add Section
    quickAddSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textMuted,
        letterSpacing: 1,
        marginBottom: 16,
    },
    quickAddGrid: {
        flexDirection: "row",
        gap: 12,
    },
    quickAddCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    quickAddIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    quickAddTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    quickAddDesc: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: "500",
    },
    // Customization Section
    customizationSection: {
        paddingHorizontal: 20,
        marginTop: 32,
    },
    customizationCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textPrimary,
        marginLeft: 10,
    },
    // Pills (Dietary)
    pillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#E5E5E5",
    },
    pillSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    pillEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    pillText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    pillTextSelected: {
        color: "#fff",
    },
    // Radio Options (Goals)
    radioContainer: {
        gap: 10,
    },
    radioOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        padding: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#E5E5E5",
    },
    radioOptionSelected: {
        backgroundColor: "#FFF5F0",
        borderColor: colors.accent,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#C4C4C4",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioCircleSelected: {
        borderColor: colors.accent,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.accent,
    },
    radioEmoji: {
        fontSize: 22,
        marginRight: 12,
    },
    radioText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    radioTextSelected: {
        color: colors.accent,
        fontWeight: "700",
    },
    // Preferences Card
    preferencesCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    preferenceRow: {
        flexDirection: "row",
        gap: 16,
    },
    preferenceBox: {
        flex: 1,
        alignItems: "center",
    },
    preferenceTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 16,
    },
    preferenceControl: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    controlButton: {
        padding: 4,
    },
    valueDisplay: {
        alignItems: "center",
    },
    valueNumber: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.accent,
    },
    valueLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.textMuted,
        marginTop: 2,
    },
    // Generate Button
    generateButtonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: "#F5F7FA",
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    generateButton: {
        flexDirection: "row",
        backgroundColor: colors.accent,
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#fff",
        letterSpacing: 0.5,
    },
});
