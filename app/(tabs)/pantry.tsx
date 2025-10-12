import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
        <TouchableOpacity style={styles.itemCard} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <PantryItemImage item={item} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.itemMetaRow}>
                    <Text style={styles.itemQuantity}>{item.quantity || "1 unit"}</Text>
                    <View style={styles.statusChip}>
                        <View style={[styles.statusDot, { backgroundColor: expiryInfo.color }]} />
                        <Text style={styles.statusLabel}>{expiryInfo.status}</Text>
                    </View>
                </View>
                {expiryInfo.daysLeft && <Text style={styles.daysLeftText}>{expiryInfo.daysLeft}</Text>}
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>
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
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterView, setFilterView] = useState<"all" | "expiring">("all");

    // Filter and categorize items
    const filteredItems = useMemo(() => {
        let filtered = items;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Expiring filter
        if (filterView === "expiring") {
            filtered = filtered.filter((item) => {
                if (!item.expiryDate) return false;
                const expiry = new Date(item.expiryDate);
                const today = new Date();
                const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return diffDays <= 3 && diffDays >= 0;
            });
        }

        return filtered;
    }, [items, searchQuery, filterView]);

    const categorizedItems = useMemo(() => categorizeItems(filteredItems), [filteredItems]);

    // Count stats
    const totalItems = items.length;
    const expiringCount = useMemo(() => {
        return items.filter((item) => {
            if (!item.expiryDate) return false;
            const expiry = new Date(item.expiryDate);
            const today = new Date();
            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 3 && diffDays >= 0;
        }).length;
    }, [items]);

    const handleEditItem = (item: PantryItem) => {
        setEditingItem(item);
        setEditModalVisible(true);
    };

    const handleSaveEditedItem = async (updatedItem: PantryItem) => {
        try {
            await updatePantryItem(updatedItem.id, updatedItem);
            setEditModalVisible(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error updating pantry item:", error);
            // You might want to show an alert here
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await removePantryItem(itemId);
            setEditModalVisible(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error deleting pantry item:", error);
            // You might want to show an alert here
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>My Pantry</Text>
                        <Text style={styles.headerSubtitle}>{totalItems} items in stock</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <Link href={"/screens/Pantry/CameraScreen" as any} asChild>
                            <TouchableOpacity style={styles.iconButton}>
                                <MaterialIcons name="camera-alt" size={24} color={colors.accent} />
                            </TouchableOpacity>
                        </Link>
                        <Link href={"/screens/Pantry/PantryInput" as any} asChild>
                            <TouchableOpacity style={styles.addButtonNew}>
                                <MaterialIcons name="add" size={24} color={colors.white} />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search ingredients..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                            <MaterialIcons name="close" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterChip, filterView === "all" && styles.filterChipActive]}
                        onPress={() => setFilterView("all")}
                    >
                        <Text style={[styles.filterChipText, filterView === "all" && styles.filterChipTextActive]}>All Items</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, filterView === "expiring" && styles.filterChipActive]}
                        onPress={() => setFilterView("expiring")}
                    >
                        <View style={[styles.filterChipDot, filterView === "expiring" && styles.filterChipDotActive]} />
                        <Text style={[styles.filterChipText, filterView === "expiring" && styles.filterChipTextActive]}>Expiring soon</Text>
                        {expiringCount > 0 && (
                            <View style={[styles.badge, filterView === "expiring" && styles.badgeActive]}>
                                <Text style={[styles.badgeText, filterView === "expiring" && styles.badgeTextActive]}>{expiringCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
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
                        <View style={styles.emptyIconContainer}>
                            <MaterialIcons name="kitchen" size={64} color={colors.neutral400} />
                        </View>
                        <Text style={styles.emptyStateText}>Your pantry is empty</Text>
                        <Text style={styles.emptyStateSubtext}>Start adding ingredients to track your stock</Text>
                        <Link href={"/screens/Pantry/PantryInput" as any} asChild>
                            <TouchableOpacity style={styles.emptyStateButton}>
                                <MaterialIcons name="add" size={20} color={colors.white} />
                                <Text style={styles.emptyStateButtonText}>Add Your First Item</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                )}

                {/* No results state */}
                {items.length > 0 && filteredItems.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="search-off" size={64} color={colors.neutral400} />
                        <Text style={styles.emptyStateText}>No items found</Text>
                        <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
                    </View>
                )}

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
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
        backgroundColor: colors.surfaceMuted,
    },
    header: {
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 24,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.neutral200,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: "700",
        color: colors.textPrimary,
        letterSpacing: -0.4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 6,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    addButtonNew: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 22,
        elevation: 6,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginTop: 24,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    clearButton: {
        padding: 4,
    },
    filterContainer: {
        flexDirection: "row",
        gap: 10,
        marginTop: 18,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    filterChipActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    filterChipTextActive: {
        color: colors.white,
    },
    filterChipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textMuted,
    },
    filterChipDotActive: {
        backgroundColor: colors.white,
    },
    badge: {
        marginLeft: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: colors.secondarySubtle,
    },
    badgeActive: {
        backgroundColor: colors.surface,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.secondary,
    },
    badgeTextActive: {
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: colors.surfaceMuted,
    },
    categorySection: {
        marginTop: 32,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.textSecondary,
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.7,
        shadowRadius: 24,
        elevation: 3,
    },
    itemImage: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.neutral100,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
    },
    itemName: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 6,
    },
    itemMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemQuantity: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    statusChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: colors.secondarySubtle,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.secondary,
    },
    daysLeftText: {
        marginTop: 6,
        fontSize: 12,
        color: colors.textMuted,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 110,
        height: 110,
        borderRadius: 26,
        backgroundColor: colors.secondarySubtle,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyStateText: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateSubtext: {
        fontSize: 15,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyStateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 4,
    },
    emptyStateButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.white,
    },
    imageContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.neutral100,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
    },
    imageLoader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.neutral100,
        borderRadius: 16,
        zIndex: 2,
    },
    imageFallback: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.neutral200,
        justifyContent: "center",
        alignItems: "center",
    },
    imageFallbackText: {
        fontSize: 9,
        color: colors.textMuted,
        textAlign: "center",
        fontWeight: "600",
        marginTop: 2,
    },
});
