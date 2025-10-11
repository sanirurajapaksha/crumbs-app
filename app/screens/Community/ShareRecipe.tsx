import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { useRouter } from "expo-router";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { CommunityPost } from "@/app/types";

export default function ShareRecipe() {
    const postCommunity = useStore((s: StoreState) => s.postCommunity);
    const user = useStore((s: StoreState) => s.user);
    const [tags, setTags] = useState("");
    const [mealName, setMealName] = useState("");
    const [description, setDescription] = useState("");
    const router = useRouter();

    const submit = async () => {
        if (!mealName.trim() || !description.trim()) return;

        const newPost: CommunityPost = {
            id: Math.random().toString(36).substring(2, 15),
            authorId: user?.id as string,
            imageURL: "", // to be implemented
            name: mealName.trim(),
            description: description.trim(),
            tags: tags.split(/[,\s]+/).filter(Boolean),
            createdAt: new Date().toISOString(),
            likeCount: 0,
            comments: [],
        };

        if (postCommunity(user?.id as string, newPost) != null) {
            Alert.alert("Success", "Your meal has been shared!", [{ text: "OK", onPress: () => router.back() }]);
        } else {
            Alert.alert("Error", "There was an issue sharing your meal. Please try again later.", [{ text: "OK" }]);
        }
    };

    const isSubmitDisabled = !mealName.trim() || !description.trim();

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Share Your Meal</Text>
                <View style={styles.headerSpace} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Meal Photo Placeholder */}
                <View style={styles.photoSection}>
                    <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera-outline" size={48} color={colors.neutral500} />
                        <Text style={styles.photoPlaceholderText}>Add a photo of your meal</Text>
                        <Text style={styles.photoSubtext}>Coming soon!</Text>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Meal Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What did you make?"
                            placeholderTextColor={colors.neutral500}
                            value={mealName}
                            onChangeText={setMealName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Tell us about your meal... How did it taste? Any cooking tips?"
                            placeholderTextColor={colors.neutral500}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tags</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Add tags (e.g., spicy, vegetarian, comfort food)"
                            placeholderTextColor={colors.neutral500}
                            value={tags}
                            onChangeText={setTags}
                        />
                        <Text style={styles.helperText}>Separate tags with commas or spaces</Text>
                    </View>
                </View>

                {/* Tips Section */}
                <View style={styles.tipsSection}>
                    <Text style={styles.tipsTitle}>💡 Sharing Tips</Text>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipText}>• Describe the flavors and textures</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipText}>• Share any cooking techniques you used</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipText}>• Mention if you made any modifications</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
                    onPress={submit}
                    disabled={isSubmitDisabled}
                >
                    <Text style={[styles.submitButtonText, isSubmitDisabled && styles.submitButtonTextDisabled]}>Share Your Meal</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.neutral200,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    headerSpace: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    photoSection: {
        marginVertical: 20,
    },
    photoPlaceholder: {
        height: 200,
        backgroundColor: colors.neutral50,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.neutral200,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    photoPlaceholderText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.neutral600,
        marginTop: 8,
    },
    photoSubtext: {
        fontSize: 14,
        color: colors.neutral500,
        marginTop: 4,
    },
    formSection: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.neutral300,
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: colors.textPrimary,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    helperText: {
        fontSize: 12,
        color: colors.neutral600,
        marginTop: 6,
    },
    tipsSection: {
        backgroundColor: colors.neutral50,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 12,
    },
    tipItem: {
        marginBottom: 6,
    },
    tipText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: colors.white,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.neutral200,
    },
    submitButton: {
        backgroundColor: colors.accent,
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: colors.neutral300,
    },
    submitButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "700",
    },
    submitButtonTextDisabled: {
        color: colors.neutral600,
    },
});
