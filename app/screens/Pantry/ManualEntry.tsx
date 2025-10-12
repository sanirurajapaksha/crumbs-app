import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { EditIngredientModal } from "../../components/EditIngredientModal";
import { VoiceInputButton } from "../../components/VoiceInputButton";
import { StoreState, useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { PantryItem } from "../../types";
import { generateFoodImage } from "../../utils/imageUtils";
import {
    createIngredientItem,
    handleDeleteIngredient,
    handleEditIngredient,
    handleSaveEditedIngredient,
    handleVoiceTranscript,
    quickAddItems
} from "../../utils/ingredientUtils";

export default function ManualEntry() {
    const router = useRouter();
    const addBatchPantryItems = useStore((s: StoreState) => s.addBatchPantryItems);
    const [ingredients, setIngredients] = useState<PantryItem[]>([]);
    const [newIngredient, setNewIngredient] = useState("");
    const [isCategorizingIngredient, setIsCategorizingIngredient] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<PantryItem | null>(null);

    const handleAddIngredient = async (name: string) => {
        if (name.trim()) {
            console.log(`[ManualEntry] Adding ingredient: "${name.trim()}"`);
            setIsCategorizingIngredient(true);
            try {
                const newItem = await createIngredientItem(name.trim(), true);
                setIngredients((prev) => [...prev, newItem]);
                setNewIngredient("");
            } catch (error) {
                console.error("[ManualEntry] Error creating ingredient:", error);
                Alert.alert("Error", "Failed to add ingredient. Please try again.");
            } finally {
                setIsCategorizingIngredient(false);
            }
        }
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

    const handleAddToPantry = async () => {
        try {
            // Convert ingredients to pantry items
            const pantryItems = ingredients.map((ingredient) => ({
                id: `pantry-${ingredient.id}`,
                name: ingredient.name,
                quantity: ingredient.quantity,
                category: ingredient.category,
                addedAt: new Date().toISOString(),
                imageUrl: generateFoodImage(ingredient.name, { width: 200, height: 200 }),
            }));

            // Add all items at once
            await addBatchPantryItems(pantryItems);
            Alert.alert("Success!", `Added ${ingredients.length} items to your pantry.`, [{ text: "OK", onPress: () => router.back() }]);
        } catch (error) {
            console.error("[ManualEntry] Error adding to pantry:", error);
            Alert.alert("Error", "Failed to add items to pantry. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manual Ingredient Add</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* My Ingredients Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Ingredients</Text>
                    {ingredients.map((ingredient) => (
                        <View key={ingredient.id} style={styles.ingredientItem}>
                            <View style={styles.ingredientInfo}>
                                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                <View style={styles.ingredientMeta}>
                                    {ingredient.quantity && <Text style={styles.ingredientQuantity}>{ingredient.quantity}</Text>}
                                    {ingredient.category && <Text style={styles.ingredientCategory}>• {ingredient.category}</Text>}
                                </View>
                            </View>
                            <View style={styles.ingredientActions}>
                                <TouchableOpacity onPress={() => handleEditIngredientWrapper(ingredient.id)} style={styles.actionButton}>
                                    <MaterialIcons name="edit" size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteIngredientWrapper(ingredient.id)} style={styles.actionButton}>
                                    <MaterialIcons name="delete" size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
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
                                disabled={isCategorizingIngredient}
                            >
                                <Text style={styles.quickAddText}>{item.name}</Text>
                                <Text style={styles.quickAddPlus}>+</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Add New Ingredient */}
                <View style={styles.section}>
                    <View style={styles.addNewContainer}>
                        <TextInput
                            style={[styles.addNewInput, isCategorizingIngredient && styles.inputDisabled]}
                            placeholder="Add new ingredient..."
                            value={newIngredient}
                            onChangeText={setNewIngredient}
                            onSubmitEditing={() => handleAddIngredient(newIngredient)}
                            editable={!isCategorizingIngredient}
                        />
                        <VoiceInputButton
                            onTranscript={(text) => handleVoiceTranscript(text, ingredients, handleAddIngredient)}
                            disabled={isCategorizingIngredient}
                            color={colors.accent}
                        />
                        <TouchableOpacity
                            style={[styles.addNewButton, isCategorizingIngredient && styles.buttonDisabled]}
                            onPress={() => handleAddIngredient(newIngredient)}
                            disabled={isCategorizingIngredient}
                        >
                            {isCategorizingIngredient ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Text style={styles.addNewButtonText}>+</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {isCategorizingIngredient && <Text style={styles.categorizingText}>Categorizing ingredient with AI...</Text>}
                </View>
            </ScrollView>

            {/* Add to Pantry Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.addToPantryButton} onPress={handleAddToPantry}>
                    <Text style={styles.addToPantryText}>Add To Pantry</Text>
                </TouchableOpacity>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonText: {
        fontSize: 20,
        color: colors.textPrimary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 12,
    },
    ingredientItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: colors.neutral50,
        borderRadius: 12,
        marginBottom: 8,
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: "500",
        color: colors.textPrimary,
        marginBottom: 2,
    },
    ingredientQuantity: {
        fontSize: 14,
        color: colors.textMuted,
    },
    ingredientMeta: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
    ingredientCategory: {
        fontSize: 12,
        color: colors.accent,
        fontWeight: "500",
        marginLeft: 4,
    },
    ingredientActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    quickAddContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    quickAddChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    quickAddText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "500",
    },
    quickAddPlus: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "bold",
    },
    addNewContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    addNewInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
    },
    addNewButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    addNewButtonText: {
        color: colors.white,
        fontSize: 20,
        fontWeight: "bold",
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
    },
    addToPantryButton: {
        backgroundColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    addToPantryText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    inputDisabled: {
        backgroundColor: colors.neutral100,
        color: colors.textMuted,
    },
    buttonDisabled: {
        backgroundColor: colors.textMuted,
    },
    categorizingText: {
        textAlign: "center",
        marginTop: 8,
        fontSize: 14,
        color: colors.textMuted,
        fontStyle: "italic",
    },
});
