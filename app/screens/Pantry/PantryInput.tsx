import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { DuplicateResolutionModal, ResolutionDecision } from "../../components/DuplicateResolutionModal";
import { EditIngredientModal } from "../../components/EditIngredientModal";
import { VoiceInputButton } from "../../components/VoiceInputButton";
import { StoreState, useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { PantryItem } from "../../types";
import { generateFoodImage } from "../../utils/imageUtils";
import {
    addIngredient,
    handleDeleteIngredient,
    handleEditIngredient,
    handleSaveEditedIngredient,
    handleVoiceTranscript,
    quickAddItems
} from "../../utils/ingredientUtils";
export default function PantryInput() {
    const router = useRouter();
    const addBatchPantryItems = useStore((s: StoreState) => s.addBatchPantryItems);
    const addBatchPantryItemsWithDuplicateCheck = useStore((s: StoreState) => s.addBatchPantryItemsWithDuplicateCheck);
    const mergePantryItems = useStore((s: StoreState) => s.mergePantryItems);
    const removePantryItem = useStore((s: StoreState) => s.removePantryItem);
    
    const [ingredients, setIngredients] = useState<PantryItem[]>([]);
    const [newIngredient, setNewIngredient] = useState("");
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<PantryItem | null>(null);
    const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
    const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
    const [unmatchedItems, setUnmatchedItems] = useState<PantryItem[]>([]);

    const handleAddIngredient = async (name: string) => {
        await addIngredient(name, ingredients, setIngredients);
        setNewIngredient("");
    };

    const handleEditIngredientWrapper = (id: string) => {
        handleEditIngredient(id, ingredients, setEditingIngredient, setEditModalVisible);
    };

    const handleSaveEditedIngredientWrapper = (updatedIngredient: PantryItem) => {
        handleSaveEditedIngredient(updatedIngredient, setIngredients, setEditModalVisible, setEditingIngredient);
    };

    const handleDeleteIngredientWrapper = (id: string) => {
        handleDeleteIngredient(id, setIngredients);
    };

    const openCamera = () => {
        // Navigate to camera screen
        router.push("./CameraScreen");
    };

    const handleVoiceTranscriptWrapper = (text: string) => {
        handleVoiceTranscript(text, ingredients, handleAddIngredient);
    };

    const handleAddToPantry = async () => {
        setLoading(true);
        try {
            // Prepare ingredients with metadata
            const pantryItems = ingredients.map((ingredient) => ({
                ...ingredient,
                id: `pantry-${ingredient.id}`,
                addedAt: new Date().toISOString(),
                imageUrl: generateFoodImage(ingredient.name, { width: 200, height: 200 }),
            }));

            // Check for duplicates using Gemini AI
            console.log('🔍 Checking for duplicates...');
            const duplicateResult = await addBatchPantryItemsWithDuplicateCheck(pantryItems);

            if (duplicateResult.hasDuplicates && duplicateResult.matches.length > 0) {
                // Show duplicate resolution modal
                setDuplicateMatches(duplicateResult.matches);
                setUnmatchedItems(duplicateResult.unmatchedNewItems);
                setDuplicateModalVisible(true);
            } else {
                // No duplicates, add all items directly
                await addBatchPantryItems(pantryItems);
                Alert.alert(
                    "Success!", 
                    `Added ${pantryItems.length} ${pantryItems.length === 1 ? 'item' : 'items'} to your pantry.`,
                    [
                        { text: "OK", onPress: () => setIngredients([]) },
                        { text: "Visit Pantry", onPress: () => router.push('../(tabs)/pantry') }
                    ]
                );
            }
        } catch (error) {
            console.error("[PantryInput] Error adding to pantry:", error);
            Alert.alert("Error", "Failed to add items to pantry. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicateResolution = async (resolutions: ResolutionDecision[]) => {
        setDuplicateModalVisible(false);
        setLoading(true);
        
        try {
            let mergedCount = 0;
            let addedCount = 0;
            let replacedCount = 0;

            // Process each resolution
            for (const resolution of resolutions) {
                const { match, action } = resolution;

                switch (action) {
                    case 'merge':
                        // Merge existing item with new item
                        await mergePantryItems(match.existingItem.id, match.newItem);
                        mergedCount++;
                        break;
                    
                    case 'replace':
                        // Remove existing and add new
                        await removePantryItem(match.existingItem.id);
                        await addBatchPantryItems([match.newItem]);
                        replacedCount++;
                        break;
                    
                    case 'separate':
                        // Add new item as separate
                        await addBatchPantryItems([match.newItem]);
                        addedCount++;
                        break;
                    
                    case 'skip':
                        // Do nothing
                        break;
                }
            }

            // Add unmatched items
            if (unmatchedItems.length > 0) {
                await addBatchPantryItems(unmatchedItems);
                addedCount += unmatchedItems.length;
            }

            // Build success message
            const messages = [];
            if (mergedCount > 0) messages.push(`${mergedCount} merged`);
            if (replacedCount > 0) messages.push(`${replacedCount} replaced`);
            if (addedCount > 0) messages.push(`${addedCount} added`);

            Alert.alert(
                "Success!", 
                `Items updated: ${messages.join(', ')}`,
                [
                    { text: "OK", onPress: () => setIngredients([]) },
                    { text: "Visit Pantry", onPress: () => router.push('../(tabs)/pantry') }
                ]
            );
        } catch (error) {
            console.error("[PantryInput] Error resolving duplicates:", error);
            Alert.alert("Error", "Failed to update pantry. Please try again.");
        } finally {
            setLoading(false);
            setDuplicateMatches([]);
            setUnmatchedItems([]);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Ingredients</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContentContainer}
            >
                {/* Input Methods Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Input Methods</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={openCamera} style={styles.tool}>
                            <Ionicons name="camera" size={32} color={colors.accent} />
                            <Text style={styles.toolLabel}>Camera</Text>
                        </TouchableOpacity>
                        <View style={styles.tool}>
                            <VoiceInputButton onTranscript={handleVoiceTranscriptWrapper} size={32} color={colors.accent} />
                            <Text style={styles.toolLabel}>Voice</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Add Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Add</Text>
                    <View style={styles.quickAddContainer}>
                        {quickAddItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.quickAddChip, { backgroundColor: item.color }]}
                                onPress={() => handleAddIngredient(item.name)}
                            >
                                <Text style={[styles.quickAddText, item.name === "Garlic" && { color: colors.textPrimary }]}>{item.name}</Text>
                                <Ionicons name="add" size={16} color={item.name === "Garlic" ? colors.textPrimary : colors.white} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Add New Ingredient */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manual Entry</Text>
                    <View style={styles.addNewContainer}>
                        <TextInput
                            style={styles.addNewInput}
                            placeholder="Add new ingredient..."
                            value={newIngredient}
                            onChangeText={setNewIngredient}
                            onSubmitEditing={() => handleAddIngredient(newIngredient)}
                        />
                        <VoiceInputButton
                            onTranscript={(text) => {
                                const items = text
                                    .split(/[,\s]+/)
                                    .map((w) => w.trim())
                                    .filter((w) => w.length > 0);
                                items.forEach((ing) => handleAddIngredient(ing));
                            }}
                            size={20}
                            color={colors.accent}
                        />
                        <TouchableOpacity style={styles.addNewButton} onPress={() => handleAddIngredient(newIngredient)}>
                            <Ionicons name="add" size={24} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Ingredients Section */}
                {ingredients.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Current Ingredients ({ingredients.length})</Text>
                        {ingredients.map((ingredient) => (
                            <View key={ingredient.id} style={styles.ingredientItem}>
                                <View style={styles.ingredientInfo}>
                                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                    {ingredient.quantity && <Text style={styles.ingredientQuantity}>{ingredient.quantity}</Text>}
                                </View>
                                <View style={styles.ingredientActions}>
                                    <TouchableOpacity onPress={() => handleEditIngredientWrapper(ingredient.id)} style={styles.actionButton}>
                                        <MaterialIcons name="edit" size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteIngredientWrapper(ingredient.id)} style={styles.actionButton}>
                                        <MaterialIcons name="delete" size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
                {ingredients.length > 0 && (
                    <TouchableOpacity 
                        style={[styles.addToPantryButton, loading && styles.buttonDisabled]} 
                        onPress={handleAddToPantry}
                        disabled={loading}
                    >
                        <Text style={styles.addToPantryText}>
                            {loading ? "Adding..." : "Add To Pantry"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Edit Ingredient Modal */}
            <EditIngredientModal
                visible={editModalVisible}
                ingredient={editingIngredient}
                onClose={() => {
                    setEditModalVisible(false);
                    setEditingIngredient(null);
                }}
                onSave={handleSaveEditedIngredientWrapper}
            />

            {/* Duplicate Resolution Modal */}
            <DuplicateResolutionModal
                visible={duplicateModalVisible}
                matches={duplicateMatches}
                onResolve={handleDuplicateResolution}
                onCancel={() => {
                    setDuplicateModalVisible(false);
                    setDuplicateMatches([]);
                    setUnmatchedItems([]);
                    setLoading(false);
                }}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral50,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 54,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        elevation: 2,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 22,
        backgroundColor: colors.neutral100,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    placeholder: {
        width: 44,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    scrollContentContainer: {
        paddingBottom: 100, // Extra padding for keyboard
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    actionsRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 8,
    },
    tool: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 12,
        minHeight: 100,
        elevation: 2,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    toolLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: "600",
        textAlign: "center",
    },
    ingredientItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    ingredientQuantity: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: "500",
    },
    ingredientActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        backgroundColor: colors.neutral100,
    },
    quickAddContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    quickAddChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        elevation: 1,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        minHeight: 44,
    },
    quickAddText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: "600",
    },
    addNewContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 4,
        elevation: 2,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    addNewInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: colors.textPrimary,
    },
    addNewButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        margin: 4,
        elevation: 2,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    footer: {
        padding: 20,
        paddingBottom: 36,
        gap: 16,
        backgroundColor: colors.white,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        elevation: 8,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    addToPantryButton: {
        backgroundColor: colors.success,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: "center",
        elevation: 3,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    addToPantryText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    buttonDisabled: {
        opacity: 0.6,
        elevation: 1,
    },
});
