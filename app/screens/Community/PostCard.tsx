import { colors } from "@/app/theme/colors";
import { CommunityPost } from "@/app/types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

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

export default function PostCard(posts: CommunityPost) {
    const hero = posts?.imageURL;
    const avatarURL = posts?.authorAvatarUrl;
    const authorName = posts.authorName;
    const handle = `@${(posts.authorName || "cook").replace(/\s+/g, "_")}`;
    const title = posts.name?.length > 0 ? posts.name : "Shared a tasty dish";
    const subtitle = posts.description ? `${posts.description}` : "";
    const time = timeAgo(posts.createdAt);
    const likes = posts.likeCount ?? 0;
    return (
        <Link href={{ pathname: "/screens/Community/PostPage", params: { id: posts.id } } as any} asChild>
            <TouchableOpacity activeOpacity={0.5}>
                <View style={styles.card}>
                    <Image source={{ uri: hero }} style={styles.hero} />
                    <View style={styles.cardBody}>
                        <View style={styles.authorRow}>
                            <View style={styles.avatar}>
                                <Image source={{ uri: avatarURL }} style={{ width: 32, height: 32, borderRadius: 16 }} />
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
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
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
