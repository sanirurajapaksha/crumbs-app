import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, StyleSheet, View, Image, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore, StoreState } from "@/app/store/useStore";
import type { CommunityPost } from "@/app/types";
import { generateFoodImage } from "@/app/utils/imageUtils";
import { Chip } from "@/app/components/Chip";
import CommentSection from "./CommentSection";

export default function PostPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const posts = useStore((s: StoreState) => s.communityPosts);
    const post: CommunityPost | undefined = useMemo(() => posts.find((p) => p.id === id), [id, posts]);

    const hero = post?.imageURL || generateFoodImage("Soup", { width: 1200, height: 800 });
    const title = post?.text;
    const author = post?.authorId || "Sophia Carter";
    const when = timeAgo(post?.createdAt);
    const desc =
        "This hearty spicy soup is packed with flavor and spice, perfect for a chilly evening. It's easy to make and can be customized with your favorite vegetables and spices.";
    const tags = post?.tags || ["Soup", "Lentils", "Spicy"];

    const [comment, setComment] = useState("");

    return (
        <View style={styles.container}>
            <View style={{ position: "relative" }}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Image source={{ uri: hero }} style={styles.hero} />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView style={styles.sheet} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarTxt}>{author.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.authorName}>{author}</Text>
                            <Text style={styles.when}>{when}</Text>
                        </View>
                    </View>
                    <Text style={styles.desc}>{desc}</Text>
                    <View style={styles.tagsRow}>
                        {tags.map((t) => (
                            <Chip key={t} label={t} />
                        ))}
                    </View>
                    <Text style={styles.commentsHeader}>Comments</Text>
                    <View style={styles.commentsContainer}>
                        {post?.comments?.length === 0 ? (
                            <Text style={{ textAlign: "center", marginTop: 40, color: colors.neutral600 }}>No Comments yet.</Text>
                        ) : (
                            post?.comments?.map((c) => <CommentSection key={c.id} {...c} />)
                        )}
                    </View>
                </ScrollView>

                <View style={styles.inputBar}>
                    <View style={styles.inputAvatar}>
                        <Text style={styles.inputAvatarTxt}>Y</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        placeholderTextColor={colors.neutral600}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                    />
                    <TouchableOpacity style={styles.postBtn} onPress={() => setComment("")}>
                        <Text style={styles.postBtnTxt}>Post</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

function timeAgo(iso?: string) {
    if (!iso) return "3 days ago";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)));
    return days === 1 ? "1 day ago" : `${days} days ago`;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    keyboardAvoidingView: { flex: 1 },
    hero: { width: "100%", height: 240 },
    sheet: {
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginTop: -16,
        padding: 16,
    },
    scrollContent: { paddingBottom: 20 },
    commentsContainer: { paddingBottom: 100 },
    backBtn: { position: "absolute", left: 8, top: 60, backgroundColor: colors.white, borderRadius: 16, padding: 6, zIndex: 10 },
    title: { fontSize: 24, fontWeight: "800", marginBottom: 8, color: colors.textPrimary },
    authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.neutral200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarTxt: { color: colors.neutral800, fontWeight: "700" },
    authorName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
    when: { fontSize: 12, color: colors.neutral600 },
    desc: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    tagsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
    commentsHeader: { fontSize: 18, fontWeight: "800", marginVertical: 8, color: colors.textPrimary },
    commentAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.neutral200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    commentAvatarTxt: { color: colors.neutral800, fontWeight: "700" },
    commentName: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginRight: 8 },
    commentWhen: { fontSize: 11, color: colors.neutral600 },
    commentText: { fontSize: 13, color: colors.textSecondary },
    inputBar: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: colors.white,
        borderTopWidth: StyleSheet.hairlineWidth,
        marginBottom: 20,
        borderColor: colors.neutral200,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    inputAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.neutral200,
        alignItems: "center",
        justifyContent: "center",
    },
    inputAvatarTxt: { color: colors.neutral800, fontWeight: "700", fontSize: 12 },
    input: {
        flex: 1,
        backgroundColor: colors.neutral50,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 13,
        maxHeight: 100,
    },
    postBtn: { backgroundColor: colors.accent, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
    postBtnTxt: { color: colors.white, fontWeight: "700" },
});
