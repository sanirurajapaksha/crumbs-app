import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { useStore, StoreState, useUtilFunctions, UtilFunctions } from "../store/useStore";
import { Link, router } from "expo-router";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import PostCard from "../screens/Community/PostCard";

export default function CommunityScreen() {
    const posts = useStore((s: StoreState) => s.communityPosts);
    const setLoading = useUtilFunctions((state: UtilFunctions) => state.setLoading);
    const loading = useUtilFunctions((state: UtilFunctions) => state.loading);
    // Loading the posts when needed and populate the zustand store
    const loadPosts = useStore((s: StoreState) => s.loadPosts);
    useEffect(() => {
        setLoading(true);
        loadPosts().finally(() => setLoading(false));
    }, []); // eslint-disable-line

    return (
        <View style={styles.container}>
            {/* Enhanced Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Community</Text>
                        <Text style={styles.headerSubtitle}>Share your culinary adventures</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => router.push("/screens/Notifications/NotificationsScreen")} style={styles.headerButton}>
                            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.contentWrapper}>
                {/* Posts Section */}
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.accent} />
                            <Text style={styles.loadingText}>Loading delicious posts...</Text>
                        </View>
                    ) : posts.length > 0 ? (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Latest Posts</Text>
                            </View>
                            {posts.map((post) => (
                                <PostCard key={post.id} {...post} />
                            ))}
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="restaurant-outline" size={48} color={colors.neutral400} />
                            </View>
                            <Text style={styles.emptyTitle}>No posts yet</Text>
                            <Text style={styles.emptySubtitle}>Be the first to share your amazing recipe!</Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Enhanced FAB */}
            <Link href={"/screens/Community/ShareRecipe" as any} asChild>
                <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                    <View style={styles.fabInner}>
                        <Ionicons name="add" color={colors.white} size={28} />
                    </View>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral50,
    },

    // Enhanced Header Styles
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: colors.white,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: colors.black,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.neutral600,
        marginTop: 2,
        fontWeight: "500",
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.neutral100,
        alignItems: "center",
        justifyContent: "center",
    },

    // Content Wrapper
    contentWrapper: {
        flex: 1,
    },

    // Scroll View
    scrollView: {
        flex: 1,
        paddingTop: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },

    // Section Header
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.accent,
    },

    // Loading State
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.neutral600,
        fontWeight: "500",
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.neutral100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.neutral600,
        textAlign: "center",
        lineHeight: 22,
    },

    // Enhanced FAB
    fab: {
        position: "absolute",
        right: 20,
        bottom: 40,
        elevation: 8,
        shadowColor: colors.black,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    fabInner: {
        backgroundColor: colors.accent,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },

    // Legacy styles (keeping for compatibility)
    card: {
        backgroundColor: colors.white,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    hero: { width: "100%", height: 180 },
    cardBody: { padding: 12 },
    authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.neutral200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    avatarTxt: { fontSize: 12, fontWeight: "700", color: colors.neutral700 },
    authorName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
    handle: { fontSize: 11, color: colors.neutral600 },
    title: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
    subtitle: { fontSize: 12, color: colors.neutral700, marginBottom: 10 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaTxt: { fontSize: 12, color: colors.neutral600 },
});
