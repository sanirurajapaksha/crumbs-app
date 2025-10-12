import { Alert } from "react-native";
import { categorizeIngredient } from "../api/groqApi";
import { PantryItem } from "../types";
import { generateFoodImage } from "./imageUtils";
import { processFoodIngredients } from "./speechUtils";

/**
 * Common quick add items used across pantry screens
 */
export const quickAddItems = [
    { name: "Salt", color: "#FF6B35" },
    { name: "Pepper", color: "#8B5A3C" },
    { name: "Olive Oil", color: "#D4A574" },
    { name: "Butter", color: "#F4C430" },
    { name: "Garlic", color: "#E8E8E8" },
];

/**
 * Creates a new ingredient item with AI categorization
 */
export const createIngredientItem = async (name: string, showCategoryAlert: boolean = false): Promise<PantryItem> => {
    try {
        // Get AI-generated category
        const category = await categorizeIngredient(name.trim());
        
        const newItem: PantryItem = {
            id: `${Date.now()}-${Math.random()}`,
            name: name.trim(),
            quantity: "1",
            category: category,
        };

        // Show success message with category if requested
        if (showCategoryAlert) {
            Alert.alert(
                "Ingredient Added", 
                `"${name.trim()}" has been categorized as "${category}" by AI.`, 
                [{ text: "OK" }], 
                { cancelable: true }
            );
        }

        return newItem;
    } catch (error) {
        console.error("[ingredientUtils] Error categorizing ingredient:", error);
        
        // Fallback to default category if AI fails
        const newItem: PantryItem = {
            id: `${Date.now()}-${Math.random()}`,
            name: name.trim(),
            quantity: "1",
            category: "other",
        };

        if (showCategoryAlert) {
            Alert.alert(
                "Ingredient Added", 
                `"${name.trim()}" has been added with default category (AI categorization failed).`, 
                [{ text: "OK" }]
            );
        }

        return newItem;
    }
};

/**
 * Adds a new ingredient to the ingredients list
 */
export const addIngredient = async (
    name: string, 
    ingredients: PantryItem[], 
    setIngredients: (updater: (prev: PantryItem[]) => PantryItem[]) => void,
    showCategoryAlert: boolean = false
): Promise<void> => {
    if (name.trim()) {
        const newItem = await createIngredientItem(name, showCategoryAlert);
        setIngredients((prev) => [...prev, newItem]);
    }
};

/**
 * Handles voice input transcript processing for ingredients
 */
export const handleVoiceTranscript = (
    text: string, 
    ingredients: PantryItem[], 
    addIngredientFn: (name: string) => Promise<void>
): void => {
    // Process transcript to extract only food ingredients and remove duplicates
    const foodIngredients = processFoodIngredients(text);

    // Get existing ingredient names for duplicate checking
    const existingNames = ingredients.map((item) => item.name.toLowerCase());

    // Filter out duplicates
    const newIngredients = foodIngredients.filter((name) => !existingNames.includes(name.toLowerCase()));

    if (newIngredients.length === 0) {
        Alert.alert(
            "No New Ingredients", 
            "All mentioned items are already in your list or were filtered out.", 
            [{ text: "OK" }]
        );
        return;
    }

    // Add each unique food ingredient
    newIngredients.forEach((ing) => addIngredientFn(ing));

    if (newIngredients.length > 0) {
        Alert.alert(
            "Voice Input", 
            `Added ${newIngredients.length} food ingredient(s): ${newIngredients.join(", ")}`, 
            [{ text: "OK" }]
        );
    }
};

/**
 * Handles editing an ingredient by finding it and opening the edit modal
 */
export const handleEditIngredient = (
    id: string, 
    ingredients: PantryItem[], 
    setEditingIngredient: (ingredient: PantryItem | null) => void,
    setEditModalVisible: (visible: boolean) => void
): void => {
    const ingredient = ingredients.find((item) => item.id === id);
    if (ingredient) {
        setEditingIngredient(ingredient);
        setEditModalVisible(true);
    }
};

/**
 * Saves the edited ingredient to the ingredients list
 */
export const handleSaveEditedIngredient = (
    updatedIngredient: PantryItem,
    setIngredients: (updater: (prev: PantryItem[]) => PantryItem[]) => void,
    setEditModalVisible: (visible: boolean) => void,
    setEditingIngredient: (ingredient: PantryItem | null) => void
): void => {
    setIngredients((prev) => prev.map((item) => (item.id === updatedIngredient.id ? updatedIngredient : item)));
    setEditModalVisible(false);
    setEditingIngredient(null);
};

/**
 * Handles deleting an ingredient with confirmation
 */
export const handleDeleteIngredient = (
    id: string, 
    setIngredients: (updater: (prev: PantryItem[]) => PantryItem[]) => void
): void => {
    Alert.alert(
        "Delete Ingredient", 
        "Are you sure you want to remove this ingredient?", 
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    setIngredients((prev) => prev.filter((item) => item.id !== id));
                },
            },
        ]
    );
};

/**
 * Handles adding ingredients to pantry with batch operation
 */
export const handleAddToPantry = async (
    ingredients: PantryItem[],
    addBatchPantryItems: (items: any[]) => Promise<void>,
    onSuccess?: () => void
): Promise<void> => {
    if (ingredients.length === 0) {
        Alert.alert("No Items", "Please add some ingredients first.");
        return;
    }

    try {
        // Add ingredients directly to pantry with additional metadata
        const pantryItems = ingredients.map((ingredient) => ({
            ...ingredient,
            id: `pantry-${ingredient.id}`,
            addedAt: new Date().toISOString(),
            imageUrl: generateFoodImage(ingredient.name, { width: 200, height: 200 }),
        }));
        await addBatchPantryItems(pantryItems);
        
        Alert.alert(
            "Success!", 
            `Added ${ingredients.length} items to your pantry.`, 
            [{ text: "OK", onPress: onSuccess }]
        );
    } catch (error) {
        console.error("[ingredientUtils] Error adding to pantry:", error);
        Alert.alert("Error", "Failed to add items to pantry. Please try again.");
    }
};