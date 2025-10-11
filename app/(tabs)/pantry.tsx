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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MaterialIcons name="inventory-2" size={14} color={colors.textMuted} />
                    <Text style={styles.itemQuantity}>{item.quantity || "1 unit"}</Text>
                </View>
            </View>
            <View style={styles.itemStatus}>
                <View style={[styles.statusBadge, { backgroundColor: `${expiryInfo.color}15` }]}>
                    <Text style={[styles.statusText, { color: expiryInfo.color }]}>{expiryInfo.status}</Text>
                </View>
                {expiryInfo.daysLeft && expiryInfo.status !== "Expired" && <Text style={styles.daysLeftText}>{expiryInfo.daysLeft}</Text>}
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
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
            {/* Header with gradient background */}
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
                        <MaterialIcons
                            name="schedule"
                            size={16}
                            color={filterView === "expiring" ? colors.white : colors.accent}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.filterChipText, filterView === "expiring" && styles.filterChipTextActive]}>Expiring Soon</Text>
                        {expiringCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{expiringCount}</Text>
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
        backgroundColor: colors.white,
    },
    header: {
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        fontWeight: "500",
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${colors.accent}15`,
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonNew: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.neutral100,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 16,
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
        gap: 8,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: `${colors.accent}15`,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    filterChipActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.accent,
    },
    filterChipTextActive: {
        color: colors.white,
    },
    badge: {
        backgroundColor: colors.white,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
        minWidth: 20,
        alignItems: "center",
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.accent,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: colors.neutral50,
    },
    categorySection: {
        marginTop: 24,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 12,
        paddingLeft: 4,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    itemImage: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: colors.neutral100,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
    },
    itemName: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    itemQuantity: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: "500",
    },
    itemStatus: {
        alignItems: "flex-end",
        minWidth: 90,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    daysLeftText: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: "600",
        textAlign: "right",
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.neutral100,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.neutral100,
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
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    emptyStateButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.white,
    },
    // Image component styles
    imageContainer: {
        width: 64,
        height: 64,
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
        width: 64,
        height: 64,
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
