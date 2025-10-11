import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EditIngredientModal } from "../components/EditIngredientModal";
import { StoreState, useStore } from "../store/useStore";
import { colors } from "../theme/colors";
import { PantryItem } from "../types";
import { getPantryItemImage } from "../utils/imageUtils";

// Helper function to categorize pantry items
const categorizeItems = (items: PantryItem[]) => {
    const categories = {
        vegetables: [] as PantryItem[],
        fruits: [] as PantryItem[],
        "dairy & eggs": [] as PantryItem[],
        "meat & poultry": [] as PantryItem[],
        seafood: [] as PantryItem[],
        "grains & cereals": [] as PantryItem[],
        "legumes & nuts": [] as PantryItem[],
        "spices & herbs": [] as PantryItem[],
        "oils & condiments": [] as PantryItem[],
        beverages: [] as PantryItem[],
        "baking & desserts": [] as PantryItem[],
        "frozen foods": [] as PantryItem[],
        "canned goods": [] as PantryItem[],
        other: [] as PantryItem[],
    };

    items.forEach((item) => {
        const category = item.category?.toLowerCase() || "other";

        // Match category to appropriate section
        if (category.includes("vegetable") || category === "vegetables") {
            categories.vegetables.push(item);
        } else if (category.includes("fruit") || category === "fruits") {
            categories.fruits.push(item);
        } else if (category.includes("dairy") || category.includes("egg") || category === "dairy & eggs") {
            categories["dairy & eggs"].push(item);
        } else if (category.includes("meat") || category.includes("poultry") || category === "meat & poultry") {
            categories["meat & poultry"].push(item);
        } else if (category.includes("seafood") || category === "seafood") {
            categories.seafood.push(item);
        } else if (category.includes("grain") || category.includes("cereal") || category === "grains & cereals") {
            categories["grains & cereals"].push(item);
        } else if (category.includes("legume") || category.includes("nut") || category === "legumes & nuts") {
            categories["legumes & nuts"].push(item);
        } else if (category.includes("spice") || category.includes("herb") || category === "spices & herbs") {
            categories["spices & herbs"].push(item);
        } else if (category.includes("oil") || category.includes("condiment") || category === "oils & condiments") {
            categories["oils & condiments"].push(item);
        } else if (category.includes("beverage") || category === "beverages") {
            categories.beverages.push(item);
        } else if (category.includes("baking") || category.includes("dessert") || category === "baking & desserts") {
            categories["baking & desserts"].push(item);
        } else if (category.includes("frozen") || category === "frozen foods") {
            categories["frozen foods"].push(item);
        } else if (category.includes("canned") || category === "canned goods") {
            categories["canned goods"].push(item);
        } else {
            // Only use "other" for truly uncategorizable items
            categories.other.push(item);
        }
    });

    return categories;
};

// Helper function to get expiry status
const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { status: "Fresh", color: colors.success, daysLeft: null };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: "Expired", color: "#EF4444", daysLeft: "Expired" };
    } else if (diffDays <= 2) {
        return { status: "Expiring", color: "#F59E0B", daysLeft: `${diffDays} day${diffDays === 1 ? "" : "s"} left` };
    } else {
        return { status: "Fresh", color: colors.success, daysLeft: `${diffDays} days left` };
    }
};

// Helper function to get item image from Pollinations.ai
const getItemImageSource = (item: PantryItem) => {
    const imageUrl = getPantryItemImage(item.name, item.imageUrl);
    return { uri: imageUrl };
};

// Enhanced image component with loading states and fallback
interface PantryItemImageProps {
    item: PantryItem;
    onImageError?: () => void;
}

const PantryItemImage: React.FC<PantryItemImageProps> = ({ item, onImageError }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleError = () => {
        setError(true);
        setLoading(false);
        onImageError?.();
    };

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleRetry = () => {
        if (retryCount < 2) {
            // Max 2 retries
            setError(false);
            setLoading(true);
            setRetryCount((prev) => prev + 1);
        }
    };

    const imageSource = getItemImageSource(item);

    return (
        <View style={styles.imageContainer}>
            {loading && (
                <View style={styles.imageLoader}>
                    <ActivityIndicator size="small" color={colors.accent} />
                </View>
            )}
            {error ? (
                <TouchableOpacity style={styles.imageFallback} onPress={handleRetry}>
                    <MaterialIcons name="restaurant" size={20} color={colors.textMuted} />
                    <Text style={styles.imageFallbackText}>Tap to retry</Text>
                </TouchableOpacity>
            ) : (
                <Image source={imageSource} style={styles.itemImage} onLoad={handleLoad} onError={handleError} onLoadStart={() => setLoading(true)} />
            )}
        </View>
    );
};

interface PantryItemCardProps {
    item: PantryItem;
    onEdit: (item: PantryItem) => void;
}

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item, onEdit }) => {
    const expiryInfo = getExpiryStatus(item.expiryDate);

    return (
        <View style={styles.itemCard}>
            <PantryItemImage item={item} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>{item.quantity || "1 unit"}</Text>
            </View>
            <View style={styles.itemStatus}>
                <Text style={[styles.statusText, { color: expiryInfo.color }]}>{expiryInfo.status}</Text>
                {expiryInfo.daysLeft && <Text style={styles.daysLeftText}>{expiryInfo.daysLeft}</Text>}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                <MaterialIcons name="edit" size={16} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );
};

interface CategorySectionProps {
    title: string;
    items: PantryItem[];
    onEditItem: (item: PantryItem) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, items, onEditItem }) => {
    if (items.length === 0) return null;

    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{title}</Text>
            {items.map((item) => (
                <PantryItemCard key={item.id} item={item} onEdit={onEditItem} />
            ))}
        </View>
    );
};

export default function PantryTab() {
    const items = useStore((s: StoreState) => s.pantryItems);
    const updatePantryItem = useStore((s: StoreState) => s.updatePantryItem);
    const removePantryItem = useStore((s: StoreState) => s.removePantryItem);
    const categorizedItems = categorizeItems(items);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

    const handleEditItem = (item: PantryItem) => {
        setEditingItem(item);
        setEditModalVisible(true);
    };

    const handleSaveEditedItem = (updatedItem: PantryItem) => {
        updatePantryItem(updatedItem.id, updatedItem);
        setEditModalVisible(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (itemId: string) => {
        removePantryItem(itemId);
        setEditModalVisible(false);
        setEditingItem(null);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Pantry</Text>
                <View style={styles.headerButtons}>
                    <Link href={"/screens/Pantry/CameraScreen" as any} asChild>
                        <TouchableOpacity style={styles.cameraButton}>
                            <MaterialIcons name="camera-alt" size={20} color={colors.white} />
                        </TouchableOpacity>
                    </Link>
                    <Link href={"/screens/Pantry/PantryInput" as any} asChild>
                        <TouchableOpacity style={styles.addButton}>
                            <Text style={styles.addButtonText}>Add Item</Text>
                            <View style={styles.addIcon}>
                                <Text style={styles.addIconText}>+</Text>
                            </View>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <CategorySection title="Vegetables" items={categorizedItems.vegetables} onEditItem={handleEditItem} />
                <CategorySection title="Fruits" items={categorizedItems.fruits} onEditItem={handleEditItem} />
                <CategorySection title="Dairy & Eggs" items={categorizedItems["dairy & eggs"]} onEditItem={handleEditItem} />
                <CategorySection title="Meat & Poultry" items={categorizedItems["meat & poultry"]} onEditItem={handleEditItem} />
                <CategorySection title="Seafood" items={categorizedItems.seafood} onEditItem={handleEditItem} />
                <CategorySection title="Grains & Cereals" items={categorizedItems["grains & cereals"]} onEditItem={handleEditItem} />
                <CategorySection title="Legumes & Nuts" items={categorizedItems["legumes & nuts"]} onEditItem={handleEditItem} />
                <CategorySection title="Spices & Herbs" items={categorizedItems["spices & herbs"]} onEditItem={handleEditItem} />
                <CategorySection title="Oils & Condiments" items={categorizedItems["oils & condiments"]} onEditItem={handleEditItem} />
                <CategorySection title="Beverages" items={categorizedItems.beverages} onEditItem={handleEditItem} />
                <CategorySection title="Baking & Desserts" items={categorizedItems["baking & desserts"]} onEditItem={handleEditItem} />
                <CategorySection title="Frozen Foods" items={categorizedItems["frozen foods"]} onEditItem={handleEditItem} />
                <CategorySection title="Canned Goods" items={categorizedItems["canned goods"]} onEditItem={handleEditItem} />
                <CategorySection title="Other" items={categorizedItems.other} onEditItem={handleEditItem} />

                {/* Empty state */}
                {items.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Your pantry is empty</Text>
                        <Text style={styles.emptyStateSubtext}>Add items to get started</Text>
                    </View>
                )}
            </ScrollView>

            {/* Edit Ingredient Modal */}
            <EditIngredientModal
                visible={editModalVisible}
                ingredient={editingItem}
                onClose={() => {
                    setEditModalVisible(false);
                    setEditingItem(null);
                }}
                onSave={handleSaveEditedItem}
                onDelete={handleDeleteItem}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral100,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: `${colors.neutral100}CC`, // 80% opacity
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: colors.textPrimary,
        fontFamily: "System",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cameraButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.accent,
    },
    addIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.accent}33`, // 20% opacity
        justifyContent: "center",
        alignItems: "center",
    },
    addIconText: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.accent,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    categorySection: {
        marginVertical: 16,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 16,
        fontFamily: "System",
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: 32,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    itemImage: {
        width: 56,
        height: 56,
        borderRadius: 32,
        backgroundColor: colors.neutral200,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
    },
    itemName: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 4,
        fontFamily: "System",
    },
    itemQuantity: {
        fontSize: 14,
        color: `${colors.textPrimary}99`, // 60% opacity
        fontFamily: "System",
    },
    itemStatus: {
        alignItems: "flex-end",
        minWidth: 80,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 2,
        fontFamily: "System",
    },
    daysLeftText: {
        fontSize: 12,
        color: `${colors.textPrimary}99`, // 60% opacity
        fontFamily: "System",
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.neutral200,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: colors.textMuted,
    },
    // Image component styles
    imageContainer: {
        width: 56,
        height: 56,
        borderRadius: 32,
        backgroundColor: colors.neutral200,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    imageLoader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.neutral200,
        borderRadius: 32,
        zIndex: 2,
    },
    imageFallback: {
        width: 56,
        height: 56,
        borderRadius: 32,
        backgroundColor: colors.neutral300,
        justifyContent: "center",
        alignItems: "center",
    },
    imageFallbackText: {
        fontSize: 8,
        color: colors.textMuted,
        textAlign: "center",
        fontWeight: "500",
        marginTop: 2,
    },
});
