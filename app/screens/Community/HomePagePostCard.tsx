import { StoreState, useStore } from "@/app/store/useStore";
import { colors } from "@/app/theme/colors";
import { CommunityPost } from "@/app/types";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

export default function HomePagePostCard(posts: CommunityPost) {
    const user = useStore((s: StoreState) => s.user);
    const likePost = useStore((s: StoreState) => s.likePost);
    const unlikePost = useStore((s: StoreState) => s.unlikePost);
    const likedPosts = useStore((s: StoreState) => s.likedPosts);
    const [isLiking, setIsLiking] = useState(false);

    const getCommentCount = (comments: any[]) => {
        let count = 0;
        comments.forEach((comment) => {
            if (comment) count++;
        });
        return count;
    };

    const hero = posts?.imageURL;
    const avatarURL = posts?.authorAvatarUrl;
    const authorName = posts.authorName;
    const title = posts.name?.length > 0 ? posts.name : "Shared a tasty dish";
    const subtitle = posts.description ? `${posts.description.substring(0, 80)}${posts.description.length > 80 ? "..." : ""}` : "";
    const time = timeAgo(posts.createdAt);
    const likes = posts.likeCount ?? 0;
    const comments = getCommentCount(posts.comments || []);
    const tags = posts.tags?.slice(0, 2) || [];

    // Check if user has liked this post
    const isLiked = likedPosts.some((p) => p.id === posts.id);

    const handleLikeToggle = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            Alert.alert("Login Required", "Please login to like posts");
            return;
        }

        if (isLiking) return;

        setIsLiking(true);
        try {
            // Fire and forget - optimistic update handles UI
            if (isLiked) {
                unlikePost(posts.id).catch((err) => {
                    console.error("Like sync failed:", err);
                });
            } else {
                likePost(posts.id).catch((err) => {
                    console.error("Like sync failed:", err);
                });
            }
        } finally {
            // Release lock immediately for instant feedback
            setTimeout(() => setIsLiking(false), 100);
        }
    };

    return (
        <Link href={{ pathname: "/screens/Community/PostPage", params: { id: posts.id } } as any} asChild>
            <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer}>
                <View style={styles.card}>
                    {/* Hero Image with Overlay */}
                    <View style={styles.heroContainer}>
                        <Image source={{ uri: hero }} style={styles.hero} />
                        <View style={styles.heroOverlay} />

                        {/* Floating Author Info */}
                        <View style={styles.floatingAuthor}>
                            <View style={styles.authorAvatar}>
                                <Image source={{ uri: avatarURL }} style={styles.avatarImage} />
                            </View>
                            <View style={styles.authorInfo}>
                                <Text style={styles.floatingAuthorName}>{authorName}</Text>
                                <Text style={styles.floatingTime}>{time}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Card Content */}
                    <View style={styles.cardContent}>
                        <View style={styles.titleSection}>
                            <Text style={styles.title} numberOfLines={2}>
                                {title}
                            </Text>
                            {subtitle ? (
                                <Text style={styles.subtitle} numberOfLines={2}>
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>

                        {/* Tags Section */}
                        {tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                {tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="heart" size={14} color={colors.accent} />
                                </View>
                                <Text style={styles.statText}>{likes}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="chatbubble-ellipses" size={14} color={colors.neutral500} />
                                </View>
                                <Text style={styles.statText}>{comments}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="bookmark-outline" size={14} color={colors.neutral500} />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginRight: 16,
        marginVertical: 8,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 20,
        width: 280,
        overflow: "hidden",
        elevation: 8,
        shadowColor: colors.black,
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        borderWidth: 2,
        borderColor: colors.neutral100,
    },
    heroContainer: {
        position: "relative",
        height: 200,
    },
    hero: {
        width: "100%",
        height: "100%",
        backgroundColor: colors.neutral100,
    },
    heroOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    floatingAuthor: {
        position: "absolute",
        top: 16,
        left: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.95)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backdropFilter: "blur(10px)",
    },
    authorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.neutral200,
        marginRight: 8,
        overflow: "hidden",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    authorInfo: {
        flex: 1,
    },
    floatingAuthorName: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textPrimary,
        lineHeight: 14,
    },
    floatingTime: {
        fontSize: 10,
        color: colors.neutral600,
        lineHeight: 12,
    },
    cardContent: {
        padding: 16,
    },
    titleSection: {
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.textPrimary,
        lineHeight: 22,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 16,
        gap: 6,
    },
    tag: {
        backgroundColor: colors.accent + "15", // 15% opacity
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.accent + "30", // 30% opacity
    },
    tagText: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.accent,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.neutral200,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.neutral50,
        alignItems: "center",
        justifyContent: "center",
    },
    statText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    // Legacy styles (keeping for compatibility)
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
