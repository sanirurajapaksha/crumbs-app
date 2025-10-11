import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useStore, StoreState, useUtilFunctions, UtilFunctions } from "../store/useStore";
import { Link } from "expo-router";
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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community</Text>
            </View>
            <ScrollView contentContainerStyle={styles.listContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.accent} />
                ) : posts.length > 0 ? (
                    posts.map((post) => <PostCard key={post.id} {...post} />)
                ) : (
                    <Text style={{ textAlign: "center", marginTop: 40, color: colors.neutral600 }}>No posts yet.</Text>
                )}
            </ScrollView>
            <Link href={"/screens/Community/ShareRecipe" as any} asChild>
                <TouchableOpacity style={styles.fab}>
                    <Ionicons name="add" color={colors.white} size={26} />
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.neutral50 },
    listContent: { paddingHorizontal: 16, paddingBottom: 120, marginTop: 16 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },
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
    fab: {
        position: "absolute",
        right: 20,
        bottom: 40,
        backgroundColor: colors.accent,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: colors.black,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
});
