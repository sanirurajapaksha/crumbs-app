import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { EditIngredientModal } from "../../components/EditIngredientModal";
import { StoreState, useStore } from "../../store/useStore";
import { colors } from "../../theme/colors";
import { PantryItem } from "../../types";

interface IngredientItem {
    id: string;
    name: string;
    quantity?: string;
    category?: string;
}

const quickAddItems = [
    { name: "Salt", color: "#FF6B35" },
    { name: "Pepper", color: "#FF6B35" },
    { name: "Olive Oil", color: "#FF6B35" },
    { name: "Butter", color: "#FF6B35" },
    { name: "Garlic", color: "#FF6B35" },
];

export default function PantryInput() {
    const router = useRouter();
    const addPantryItem = useStore((s: StoreState) => s.addPantryItem);
    const pantryItems = useStore((s: StoreState) => s.pantryItems);
    const generateRecipeMock = useStore((s: StoreState) => s.generateRecipeMock);
    const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
    const [newIngredient, setNewIngredient] = useState("");
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<IngredientItem | null>(null);

    const handleAddIngredient = (name: string) => {
        if (name.trim()) {
            const newItem: IngredientItem = {
                id: `${Date.now()}-${Math.random()}`,
                name: name.trim(),
                quantity: "1",
                category: "other"
            };
            setIngredients(prev => [...prev, newItem]);
            setNewIngredient("");
        }
    };

    const handleEditIngredient = (id: string) => {
        const ingredient = ingredients.find(item => item.id === id);
        if (ingredient) {
            setEditingIngredient(ingredient);
            setEditModalVisible(true);
        }
    };

    const handleSaveEditedIngredient = (updatedIngredient: IngredientItem) => {
        setIngredients(prev => 
            prev.map(item => 
                item.id === updatedIngredient.id ? updatedIngredient : item
            )
        );
        setEditModalVisible(false);
        setEditingIngredient(null);
    };

    const handleDeleteIngredient = (id: string) => {
        Alert.alert(
            "Delete Ingredient",
            "Are you sure you want to remove this ingredient?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => {
                        setIngredients(prev => prev.filter(item => item.id !== id));
                    }
                }
            ]
        );
    };

    const openCamera = () => {
        // Navigate to camera screen
        router.push("./CameraScreen");
    };

    const mockVoice = () => {
        // TODO (Voice/Gemini): speech to pantry items
        ["Garlic", "Lemon"].forEach(handleAddIngredient);
    };

    const handleAddToPantry = () => {
        if (ingredients.length === 0) {
            Alert.alert("No Items", "Please add some ingredients first.");
            return;
        }

        // Convert ingredients to pantry items and add them
        ingredients.forEach(ingredient => {
            const pantryItem: PantryItem = {
                id: `pantry-${ingredient.id}`,
                name: ingredient.name,
                quantity: ingredient.quantity,
                category: ingredient.category,
                addedAt: new Date().toISOString(),
            };
            addPantryItem(pantryItem);
        });

        Alert.alert(
            "Success!",
            `Added ${ingredients.length} items to your pantry.`,
            [{ text: "OK", onPress: () => setIngredients([]) }]
        );
    };

    const handleGenerateRecipe = async () => {
        if (ingredients.length === 0 && pantryItems.length === 0) {
            Alert.alert("No Items", "Please add some ingredients to generate a recipe.");
            return;
        }

        // Add current ingredients to pantry first
        if (ingredients.length > 0) {
            ingredients.forEach(ingredient => {
                const pantryItem: PantryItem = {
                    id: `pantry-${ingredient.id}`,
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    category: ingredient.category,
                    addedAt: new Date().toISOString(),
                };
                addPantryItem(pantryItem);
            });
        }

        setLoading(true);
        try {
            const recipe = await generateRecipeMock(pantryItems.concat(
                ingredients.map(ing => ({
                    id: ing.id,
                    name: ing.name,
                    quantity: ing.quantity,
                    category: ing.category
                }))
            ));
            // Using imperative navigation because recipe id is only known after async call
            router.push({ pathname: "./RecipeDetail", params: { id: recipe.id } });
            setIngredients([]); // Clear ingredients after generating recipe
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Ingredients</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Input Methods Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Input Methods</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={openCamera} style={styles.tool}>
                            <Ionicons name="camera" size={24} color={colors.textSecondary} />
                            <Text style={styles.toolLabel}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={mockVoice} style={styles.tool}>
                            <Ionicons name="mic" size={24} color={colors.textSecondary} />
                            <Text style={styles.toolLabel}>Voice</Text>
                        </TouchableOpacity>
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
                                <Text style={styles.quickAddText}>{item.name}</Text>
                                <Ionicons name="add" size={14} color={colors.white} />
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
                        <TouchableOpacity 
                            style={styles.addNewButton}
                            onPress={() => handleAddIngredient(newIngredient)}
                        >
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
                                    {ingredient.quantity && (
                                        <Text style={styles.ingredientQuantity}>{ingredient.quantity}</Text>
                                    )}
                                </View>
                                <View style={styles.ingredientActions}>
                                    <TouchableOpacity 
                                        onPress={() => handleEditIngredient(ingredient.id)}
                                        style={styles.actionButton}
                                    >
                                        <MaterialIcons name="edit" size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteIngredient(ingredient.id)}
                                        style={styles.actionButton}
                                    >
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
                        style={styles.addToPantryButton}
                        onPress={handleAddToPantry}
                    >
                        <Text style={styles.addToPantryText}>Add To Pantry</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    disabled={loading}
                    style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                    onPress={handleGenerateRecipe}
                >
                    <Text style={styles.generateButtonText}>
                        {loading ? "Generating..." : "Generate Recipe"}
                    </Text>
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
                onSave={handleSaveEditedIngredient}
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
    actionsRow: { 
        flexDirection: "row", 
        gap: 16,
        marginBottom: 8,
    },
    tool: { 
        backgroundColor: colors.neutral200, 
        padding: 12, 
        borderRadius: 12,
        alignItems: "center",
        flex: 1,
        gap: 4,
    },
    toolLabel: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: "500",
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
    footer: {
        padding: 16,
        paddingBottom: 32,
        gap: 12,
    },
    addToPantryButton: {
        backgroundColor: colors.success,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    addToPantryText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    generateButton: {
        backgroundColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
});
