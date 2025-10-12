import { getAllComments, postComment } from "@/app/api/post-api";
import { Chip } from "@/app/components/Chip";
import { StoreState, UtilFunctions, useStore, useUtilFunctions } from "@/app/store/useStore";
import { colors } from "@/app/theme/colors";
import type { CommunityPost } from "@/app/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CommentSection from "./CommentSection";

export default function PostPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const posts = useStore((s: StoreState) => s.communityPosts);
    const user = useStore((s: StoreState) => s.user);
    const deletePost = useStore((s: StoreState) => s.deletePost);
    const likePost = useStore((s: StoreState) => s.likePost);
    const unlikePost = useStore((s: StoreState) => s.unlikePost);
    const likedPosts = useStore((s: StoreState) => s.likedPosts);
    const post: CommunityPost | undefined = useMemo(() => posts.find((p) => p.id === id), [id, posts]);
    const hero = post?.imageURL;
    const title = post?.name;
    const author = post?.authorName;
    const avatarURL = post?.authorAvatarUrl;
    const when = timeAgo(post?.createdAt);
    const desc = post?.description;
    const tags = post?.tags || [];

    const setLoading = useUtilFunctions((s: UtilFunctions) => s.setLoading);
    const loading = useUtilFunctions((s: UtilFunctions) => s.loading);

    const [comment, setComment] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [isLiking, setIsLiking] = useState(false);

    // Check if current user is the post author
    const isOwnPost = user?.id === post?.authorId;
    
    // Check if user has liked this post
    const isLiked = likedPosts.some((p) => p.id === id);

    useEffect(() => {
        const loadComments = async () => {
            if (post?.id) {
                setLoading(true);
                try {
                    const fetchedComments = await getAllComments(post.id);
                    console.log("Fetched comments:", fetchedComments);
                    // Transform the comment data to match CommentSection component expectations
                    const transformedComments = fetchedComments.map((comment) => ({
                        id: comment.id,
                        name: comment.authorName,
                        text: comment.text,
                        when: timeAgo(comment.createdAt),
                        avatarUrl: comment.avatarUrl,
                    }));
                    console.log("Transformed comments:", transformedComments);
                    setComments(transformedComments);
                } catch (error) {
                    console.error("Failed to load comments:", error);
                    setComments([]);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadComments();
    }, [post?.id, setLoading]);

    const handleCommentSubmit = async (id: string, comment: string, avatarURLParam: string) => {
        if (!comment.trim()) return;
        setLoading(true);
        try {
            await postComment(id, comment, user?.name || "Unknown", avatarURLParam);
            console.log("Comment posted successfully");
            setComment("");
            // Reload comments after posting
            const updatedComments = await getAllComments(id);
            console.log("Updated comments after posting:", updatedComments);
            const transformedComments = updatedComments.map((comment) => ({
                id: comment.id,
                name: comment.authorName,
                text: comment.text,
                when: timeAgo(comment.createdAt),
                avatarUrl: comment.avatarUrl,
            }));
            setComments(transformedComments);
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setLoading(false);
            Keyboard.dismiss();
        }
    };

    const handleEditPost = () => {
        router.push(`/screens/Community/EditPost?id=${id}` as any);
    };

    const handleDeletePost = () => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (!user?.id || !id) return;
                        setLoading(true);
                        try {
                            await deletePost(user.id, id);
                            Alert.alert("Success", "Post deleted successfully", [
                                { text: "OK", onPress: () => router.back() }
                            ]);
                        } catch (error) {
                            console.error("Failed to delete post:", error);
                            Alert.alert("Error", "Failed to delete post. Please try again.");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const showPostOptions = () => {
        Alert.alert(
            "Post Options",
            "What would you like to do?",
            [
                { text: "Edit Post", onPress: handleEditPost },
                { text: "Delete Post", onPress: handleDeletePost, style: "destructive" },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const handleLikeToggle = async () => {
        if (!user) {
            Alert.alert("Login Required", "Please login to like posts");
            return;
        }

        if (!id) return;
        if (isLiking) return;

        setIsLiking(true);
        try {
            // Fire and forget - optimistic update handles UI
            if (isLiked) {
                unlikePost(id).catch(err => {
                    console.error("Like sync failed:", err);
                });
            } else {
                likePost(id).catch(err => {
                    console.error("Like sync failed:", err);
                });
            }
        } finally {
            // Release lock immediately for instant feedback
            setTimeout(() => setIsLiking(false), 100);
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ position: "relative" }}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                {isOwnPost && (
                    <TouchableOpacity onPress={showPostOptions} style={styles.optionsBtn}>
                        <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                )}
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
                            <Image source={{ uri: avatarURL }} style={{ width: 32, height: 32, borderRadius: 16 }} />
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
                    
                    {/* Like/Unlike Button */}
                    <TouchableOpacity 
                        style={styles.likeButton} 
                        onPress={handleLikeToggle}
                        disabled={isLiking}
                    >
                        <Ionicons 
                            name={isLiked ? "heart" : "heart-outline"} 
                            size={24} 
                            color={isLiked ? colors.danger : colors.neutral600} 
                        />
                        <Text style={[styles.likeText, isLiked && { color: colors.danger }]}>
                            {isLiked ? "Liked" : "Like"} ({post?.likeCount || 0})
                        </Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.commentsHeader}>Comments</Text>
                    <View style={styles.commentsContainer}>
                        {comments && comments.length > 0 ? (
                            comments.map((commentItem: any, index: number) => <CommentSection key={commentItem.id || index} {...commentItem} />)
                        ) : loading ? (
                            <ActivityIndicator size="large" style={{ marginTop: 40 }} color={colors.accentAlt} />
                        ) : (
                            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.inputBar}>
                    <View style={styles.inputAvatar}>
                        <Image source={{ uri: user?.avatarUrl }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        placeholderTextColor={colors.neutral600}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.postBtn}
                        onPress={() => handleCommentSubmit(post?.id || "", comment, user?.avatarUrl || "")}
                        disabled={loading || !comment.trim()}
                    >
                        <Text style={styles.postBtnTxt}>{loading ? <ActivityIndicator size="small" color={colors.white} /> : "Post"}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    optionsBtn: { position: "absolute", right: 8, top: 60, backgroundColor: colors.white, borderRadius: 16, padding: 6, zIndex: 10 },
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
    likeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.neutral50,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    likeText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    commentsHeader: { fontSize: 18, fontWeight: "800", marginVertical: 8, color: colors.textPrimary },
    noCommentsText: {
        textAlign: "center",
        marginTop: 40,
        color: colors.neutral600,
        fontSize: 14,
        fontStyle: "italic",
    },
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
