import { StoreState, useStore } from "@/app/store/useStore";
import { colors } from "@/app/theme/colors";
import { CommunityPost } from "@/app/types";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
    const user = useStore((s: StoreState) => s.user);
    const deletePost = useStore((s: StoreState) => s.deletePost);
    const updatePost = useStore((s: StoreState) => s.updatePost);
    const likePost = useStore((s: StoreState) => s.likePost);
    const unlikePost = useStore((s: StoreState) => s.unlikePost);
    const likedPosts = useStore((s: StoreState) => s.likedPosts);
    
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(posts.name || "");
    const [editDescription, setEditDescription] = useState(posts.description || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    
    const hero = posts?.imageURL;
    const avatarURL = posts?.authorAvatarUrl;
    const authorName = posts.authorName;
    const handle = `@${(posts.authorName || "cook").replace(/\s+/g, "_")}`;
    const title = posts.name?.length > 0 ? posts.name : "Shared a tasty dish";
    const subtitle = posts.description ? `${posts.description}` : "";
    const time = timeAgo(posts.createdAt);
    const likes = posts.likeCount ?? 0;
    
    // Check if this post belongs to the current user
    const isOwnPost = user?.id === posts.authorId;
    
    // Check if user has liked this post
    const isLiked = likedPosts.some((p) => p.id === posts.id);

    const handleDelete = () => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (user?.id) {
                                await deletePost(user.id, posts.id);
                                Alert.alert("Success", "Post deleted successfully");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete post. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = () => {
        setShowOptionsMenu(false);
        setEditName(posts.name || "");
        setEditDescription(posts.description || "");
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Recipe name cannot be empty");
            return;
        }

        setIsUpdating(true);
        try {
            if (user?.id) {
                await updatePost(user.id, posts.id, {
                    name: editName.trim(),
                    description: editDescription.trim(),
                });
                setShowEditModal(false);
                Alert.alert("Success", "Post updated successfully");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update post. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

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
                unlikePost(posts.id).catch(err => {
                    console.error("Like sync failed:", err);
                });
            } else {
                likePost(posts.id).catch(err => {
                    console.error("Like sync failed:", err);
                });
            }
        } finally {
            // Release lock immediately for instant feedback
            setTimeout(() => setIsLiking(false), 100);
        }
    };

    return (
        <>
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
                                {isOwnPost && (
                                    <TouchableOpacity 
                                        onPress={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowOptionsMenu(true);
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="ellipsis-horizontal" size={18} color={colors.neutral600} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.title}>{title}</Text>
                            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={16} color={colors.neutral600} />
                                    <Text style={styles.metaTxt}>{time}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.metaItem} 
                                    onPress={handleLikeToggle}
                                    disabled={isLiking}
                                >
                                    <Ionicons 
                                        name={isLiked ? "heart" : "heart-outline"} 
                                        size={16} 
                                        color={isLiked ? colors.danger : colors.neutral600} 
                                    />
                                    <Text style={[styles.metaTxt, isLiked && { color: colors.danger }]}>{likes}</Text>
                                </TouchableOpacity>
                                <View style={styles.metaItem}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.neutral600} />
                                    <Text style={styles.metaTxt}>0</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>

            {/* Options Menu Modal */}
            <Modal
                visible={showOptionsMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptionsMenu(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowOptionsMenu(false)}
                >
                    <View style={styles.optionsMenu}>
                        <TouchableOpacity style={styles.optionItem} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
                            <Text style={styles.optionText}>Edit Post</Text>
                        </TouchableOpacity>
                        <View style={styles.optionDivider} />
                        <TouchableOpacity 
                            style={styles.optionItem} 
                            onPress={() => {
                                setShowOptionsMenu(false);
                                setTimeout(handleDelete, 300);
                            }}
                        >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                            <Text style={[styles.optionText, { color: colors.danger }]}>Delete Post</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.editModalContainer}>
                    <View style={styles.editHeader}>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.editTitle}>Edit Post</Text>
                        <TouchableOpacity onPress={handleSaveEdit} disabled={isUpdating}>
                            {isUpdating ? (
                                <ActivityIndicator size="small" color={colors.accent} />
                            ) : (
                                <Text style={styles.saveText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.editContent}>
                        <Image source={{ uri: hero }} style={styles.editImage} />
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Recipe Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter recipe name"
                                placeholderTextColor={colors.neutral400}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                placeholder="Describe your recipe"
                                placeholderTextColor={colors.neutral400}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
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
    // Options Menu Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    optionsMenu: {
        backgroundColor: colors.white,
        borderRadius: 16,
        width: "80%",
        maxWidth: 320,
        overflow: "hidden",
        elevation: 8,
        shadowColor: colors.black,
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    optionText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    optionDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.neutral200,
    },
    // Edit Modal Styles
    editModalContainer: {
        flex: 1,
        backgroundColor: colors.neutral50,
    },
    editHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.neutral200,
    },
    editTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.neutral600,
    },
    saveText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.accent,
    },
    editContent: {
        padding: 20,
    },
    editImage: {
        width: "100%",
        height: 200,
        borderRadius: 16,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.neutral200,
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
});
