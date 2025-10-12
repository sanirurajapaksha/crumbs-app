import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ActivityIndicator,
} from "react-native";
import { useStore, StoreState, useUtilFunctions, UtilFunctions } from "../../store/useStore";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { imagePostAPI } from "@/app/api/imagePostAPI";

export default function EditPost() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    
    const user = useStore((s: StoreState) => s.user);
    const userCommunityPosts = useStore((s: StoreState) => s.userCommunityPosts);
    const updatePost = useStore((s: StoreState) => s.updatePost);
    const setLoading = useUtilFunctions((state: UtilFunctions) => state.setLoading);
    const loading = useUtilFunctions((state: UtilFunctions) => state.loading);

    const post = userCommunityPosts.find((p) => p.id === id);

    const [tags, setTags] = useState("");
    const [mealName, setMealName] = useState("");
    const [description, setDescription] = useState("");
    const [imageURL, setImageURL] = useState("");
    const [imageChanged, setImageChanged] = useState(false);

    useEffect(() => {
        if (post) {
            setMealName(post.name || "");
            setDescription(post.description || "");
            setImageURL(post.imageURL || "");
            setTags(post.tags?.join(", ") || "");
        }
    }, [post]);

    const submit = async () => {
        if (!user?.id || !id) return;

        setLoading(true);

        try {
            let finalImageUrl = imageURL;

            // Only upload new image if it was changed
            if (imageChanged && imageURL && !imageURL.startsWith("http")) {
                const uploadedImageUrl = await imagePostAPI(imageURL);
                finalImageUrl = uploadedImageUrl.data.url;
            }

            if (!mealName.trim() || !description.trim()) {
                Alert.alert("Validation Error", "Please provide both a meal name and description.", [{ text: "OK" }]);
                setLoading(false);
                return;
            }

            if (!finalImageUrl) {
                Alert.alert("Validation Error", "Please add a photo of your meal.", [{ text: "OK" }]);
                setLoading(false);
                return;
            }

            const updates = {
                name: mealName.trim(),
                description: description.trim(),
                tags: tags.split(/[,\s]+/).filter(Boolean),
                imageURL: finalImageUrl,
            };

            await updatePost(user.id, id, updates);
            setLoading(false);
            Alert.alert("Success", "Your post has been updated!", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error) {
            setLoading(false);
            Alert.alert("Error", "There was an issue updating your post. Please try again later.", [{ text: "OK" }]);
        }
    };

    const pickImageFromCamera = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "You need to grant camera permission to take photos.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: "images" as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setImageURL(result.assets[0].uri);
            setImageChanged(true);
        }
    };

    const pickImageFromGallery = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "You need to grant gallery permission to choose photos.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images" as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setImageURL(result.assets[0].uri);
            setImageChanged(true);
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            "Change Photo",
            "Choose an option",
            [
                { text: "Take Photo", onPress: pickImageFromCamera },
                { text: "Choose from Gallery", onPress: pickImageFromGallery },
                { text: "Cancel", style: "cancel" },
            ],
            { cancelable: true }
        );
    };

    const isSubmitDisabled = !mealName.trim() || !description.trim() || loading;

    if (!post) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Post</Text>
                    <View style={styles.headerSpace} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Post not found</Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Post</Text>
                <View style={styles.headerSpace} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Meal Photo */}
                <TouchableOpacity style={styles.photoSection} onPress={showImagePickerOptions}>
                    {imageURL ? (
                        <View style={styles.photoPlaceholder}>
                            <Image source={{ uri: imageURL }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                            <View style={styles.changePhotoOverlay}>
                                <Ionicons name="camera-outline" size={32} color={colors.white} />
                                <Text style={styles.changePhotoText}>Change Photo</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera-outline" size={48} color={colors.neutral500} />
                            <Text style={styles.photoPlaceholderText}>Add a photo of your meal</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Post Caption *</Text>
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
                            placeholder="Tell us about your meal..."
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
                            placeholder="Add tags (e.g., spicy, vegetarian)"
                            placeholderTextColor={colors.neutral500}
                            value={tags}
                            onChangeText={setTags}
                        />
                        <Text style={styles.helperText}>Separate tags with commas or spaces</Text>
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
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <Text style={[styles.submitButtonText, isSubmitDisabled && styles.submitButtonTextDisabled]}>Update Post</Text>
                    )}
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
        position: "relative",
        overflow: "hidden",
    },
    changePhotoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.white,
        marginTop: 8,
    },
    photoPlaceholderText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.neutral600,
        marginTop: 8,
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
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});
