import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from "react-native";
import { useStore, StoreState } from "../store/useStore";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2; // 2 columns with padding

type TabType = "myRecipes" | "savedRecipes" | "likedPosts";

export default function Profile() {
    const user = useStore((s: StoreState) => s.user);
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    const likedPosts = useStore((s: StoreState) => s.likedPosts);
    const [activeTab, setActiveTab] = useState<TabType>("myRecipes");

    const getDisplayData = () => {
        switch (activeTab) {
            case "myRecipes":
                return myRecipes.map((r) => ({
                    id: r.id,
                    title: r.title,
                    image: r.heroImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                }));
            case "savedRecipes":
                return favorites.map((r) => ({
                    id: r.id,
                    title: r.title,
                    image: r.heroImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                }));
            case "likedPosts":
                return likedPosts.map((p) => ({
                    id: p.id,
                    title: p.text.substring(0, 50),
                    image: p.imageURL || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                }));
            default:
                return [];
        }
    };

    const displayData = getDisplayData();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/screens/Notifications/NotificationsScreen")}>
                        <Ionicons name="notifications-outline" size={24} color={colors.black} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/screens/Settings/SettingsScreen")}>
                        <Ionicons name="settings-outline" size={24} color={colors.black} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri: user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
                            }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
                    <Text style={styles.userBio}>{user?.bio || "Foodie & Recipe Creator"}</Text>
                    <Text style={styles.joinDate}>Joined {user?.joinYear || new Date(user?.createdAt || Date.now()).getFullYear()}</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === "myRecipes" && styles.activeTab]} onPress={() => setActiveTab("myRecipes")}>
                        <Text style={[styles.tabText, activeTab === "myRecipes" && styles.activeTabText]}>My Recipes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "savedRecipes" && styles.activeTab]}
                        onPress={() => setActiveTab("savedRecipes")}
                    >
                        <Text style={[styles.tabText, activeTab === "savedRecipes" && styles.activeTabText]}>Saved Recipes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === "likedPosts" && styles.activeTab]} onPress={() => setActiveTab("likedPosts")}>
                        <Text style={[styles.tabText, activeTab === "likedPosts" && styles.activeTabText]}>Liked Posts</Text>
                    </TouchableOpacity>
                </View>

                {/* Recipe Grid */}
                <View style={styles.gridContainer}>
                    {displayData.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.recipeCard}>
                            <Image source={{ uri: item.image }} style={styles.recipeImage} />
                            <Text style={styles.recipeTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {displayData.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No {activeTab.replace(/([A-Z])/g, " $1").toLowerCase()} yet</Text>
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
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.black,
    },
    headerIcons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    profileSection: {
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F5E6D3",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        overflow: "hidden",
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    userName: {
        fontSize: 24,
        fontWeight: "700",
        color: colors.black,
        marginBottom: 4,
    },
    userBio: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    joinDate: {
        fontSize: 14,
        color: colors.textMuted,
    },
    tabsContainer: {
        flexDirection: "row",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        paddingHorizontal: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: colors.accent,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.accent,
        fontWeight: "600",
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 16,
        gap: 16,
    },
    recipeCard: {
        width: CARD_SIZE,
        marginBottom: 8,
    },
    recipeImage: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderRadius: 12,
        backgroundColor: colors.neutral200,
        marginBottom: 8,
    },
    recipeTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.black,
        lineHeight: 18,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 12,
    },
});
