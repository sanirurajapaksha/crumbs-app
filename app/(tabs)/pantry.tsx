import { Link } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StoreState, useStore } from "../store/useStore";
import { colors } from "../theme/colors";
import { PantryItem } from "../types";

// Helper function to categorize pantry items
const categorizeItems = (items: PantryItem[]) => {
    const categories = {
        vegetables: [] as PantryItem[],
        fruits: [] as PantryItem[],
        "dairy & eggs": [] as PantryItem[],
        other: [] as PantryItem[],
    };

    items.forEach(item => {
        const category = item.category?.toLowerCase() || "other";
        if (category.includes("vegetable") || category === "vegetables") {
            categories.vegetables.push(item);
        } else if (category.includes("fruit") || category === "fruits") {
            categories.fruits.push(item);
        } else if (category.includes("dairy") || category.includes("egg") || category === "dairy & eggs") {
            categories["dairy & eggs"].push(item);
        } else {
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
        return { status: "Expiring", color: "#F59E0B", daysLeft: `${diffDays} day${diffDays === 1 ? '' : 's'} left` };
    } else {
        return { status: "Fresh", color: colors.success, daysLeft: `${diffDays} days left` };
    }
};

// Helper function to get item image placeholder
const getItemImage = (itemName: string) => {
    // You can replace these with actual images later
    const itemImages: { [key: string]: any } = {
        broccoli: require("../../assets/images/react-logo.png"),
        carrots: require("../../assets/images/react-logo.png"),
        spinach: require("../../assets/images/react-logo.png"),
        apples: require("../../assets/images/react-logo.png"),
        bananas: require("../../assets/images/react-logo.png"),
        blueberries: require("../../assets/images/react-logo.png"),
        eggs: require("../../assets/images/react-logo.png"),
        milk: require("../../assets/images/react-logo.png"),
    };
    
    return itemImages[itemName.toLowerCase()] || require("../../assets/images/react-logo.png");
};

interface PantryItemCardProps {
    item: PantryItem;
}

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item }) => {
    const expiryInfo = getExpiryStatus(item.expiryDate);
    
    return (
        <View style={styles.itemCard}>
            <Image source={getItemImage(item.name)} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>{item.quantity || "1 unit"}</Text>
            </View>
            <View style={styles.itemStatus}>
                <Text style={[styles.statusText, { color: expiryInfo.color }]}>
                    {expiryInfo.status}
                </Text>
                {expiryInfo.daysLeft && (
                    <Text style={styles.daysLeftText}>{expiryInfo.daysLeft}</Text>
                )}
            </View>
        </View>
    );
};

interface CategorySectionProps {
    title: string;
    items: PantryItem[];
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, items }) => {
    if (items.length === 0) return null;
    
    return (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{title}</Text>
            {items.map((item) => (
                <PantryItemCard key={item.id} item={item} />
            ))}
        </View>
    );
};

export default function PantryTab() {
    const items = useStore((s: StoreState) => s.pantryItems);
    const categorizedItems = categorizeItems(items);
    
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Pantry</Text>
                <Link href={"/screens/Pantry/PantryInput" as any} asChild>
                    <TouchableOpacity style={styles.addButton}>
                        <Text style={styles.addButtonText}>Add Item</Text>
                        <View style={styles.addIcon}>
                            <Text style={styles.addIconText}>+</Text>
                        </View>
                    </TouchableOpacity>
                </Link>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <CategorySection 
                    title="Vegetables" 
                    items={categorizedItems.vegetables} 
                />
                <CategorySection 
                    title="Fruits" 
                    items={categorizedItems.fruits} 
                />
                <CategorySection 
                    title="Dairy & Eggs" 
                    items={categorizedItems["dairy & eggs"]} 
                />
                {categorizedItems.other.length > 0 && (
                    <CategorySection 
                        title="Other" 
                        items={categorizedItems.other} 
                    />
                )}
                
                {/* Empty state */}
                {items.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Your pantry is empty</Text>
                        <Text style={styles.emptyStateSubtext}>Add items to get started</Text>
                    </View>
                )}
            </ScrollView>
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
        paddingHorizontal: 18,
        paddingVertical: 20,
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
});
