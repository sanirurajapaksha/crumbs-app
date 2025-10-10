import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useStore, StoreState } from "../store/useStore";
import { Link } from "expo-router";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { generateFoodImage } from "@/app/utils/imageUtils";
import type { CommunityPost } from "@/app/types";

export default function CommunityScreen() {
    const posts = useStore((s: StoreState) => s.communityPosts);
    const loadPosts = useStore((s: StoreState) => s.loadPosts);
    useEffect(() => {
        loadPosts();
    }, []); // eslint-disable-line

    const renderItem = ({ item }: { item: CommunityPost }) => {
        const hero = item.imageURL || generateFoodImage("Recipe", { width: 800, height: 600 });
        const authorName = item.authorId || "Crumbs Cook";
        const handle = `@${(item.authorId || "cook").replace(/\s+/g, "_")}`;
        const title = item.text?.length > 0 ? item.text : "Shared a tasty dish";
        const subtitle = item.tags && item.tags.length > 0 ? `Pro Tip: ${item.tags.join(", ")}` : undefined;
        const time = timeAgo(item.createdAt);
        const likes = item.likeCount ?? 0;
        return (
            <View style={styles.card}>
                <Image source={{ uri: hero }} style={styles.hero} />
                <View style={styles.cardBody}>
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarTxt}>{authorName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.authorName}>{authorName}</Text>
                            <Text style={styles.handle}>{handle}</Text>
                        </View>
                        <Ionicons name="ellipsis-horizontal" size={18} color={colors.neutral600} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={16} color={colors.neutral600} />
                            <Text style={styles.metaTxt}>{time}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="heart-outline" size={16} color={colors.neutral600} />
                            <Text style={styles.metaTxt}>{likes}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.neutral600} />
                            <Text style={styles.metaTxt}>0</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(p) => p.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderItem}
                ListEmptyComponent={() => (
                    <View style={{ padding: 24 }}>
                        <Text style={{ color: colors.neutral600 }}>No posts yet. Be the first to share!</Text>
                    </View>
                )}
            />
            <Link href={"/screens/Community/ShareRecipe" as any} asChild>
                <TouchableOpacity style={styles.fab}>
                    <Ionicons name="add" color={colors.white} size={26} />
                </TouchableOpacity>
            </Link>
        </View>
    );
}

function timeAgo(iso?: string) {
    if (!iso) return "now";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.neutral50 },
    listContent: { padding: 16, paddingBottom: 120 },
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
