import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function DeleteAccountScreen() {
    const user = useStore((s: StoreState) => s.user);
    const deleteAccount = useStore((s: StoreState) => s.deleteAccount);
    
    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isDeleteEnabled = password.trim().length > 0 && confirmText.toUpperCase() === "DELETE";

    const handleDeleteAccount = async () => {
        if (!isDeleteEnabled) {
            Alert.alert("Error", "Please enter your password and type DELETE to confirm");
            return;
        }

        setLoading(true);
        try {
            await deleteAccount(password);
            // No need to navigate - store handles it
        } catch (e: any) {
            Alert.alert(
                "Failed to Delete Account",
                e?.message || "Please check your password and try again. If you recently logged in, you may need to log out and log back in."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delete Account</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Warning Section */}
                <View style={styles.warningContainer}>
                    <View style={styles.warningIconContainer}>
                        <Ionicons name="warning" size={64} color={colors.danger} />
                    </View>
                    <Text style={styles.warningTitle}>Permanent Account Deletion</Text>
                    <Text style={styles.warningText}>
                        This action cannot be undone. Once you delete your account, you will lose access to:
                    </Text>
                </View>

                {/* Data Loss List */}
                <View style={styles.dataLossList}>
                    <DataLossItem icon="person-outline" text="Your profile and account information" />
                    <DataLossItem icon="restaurant-outline" text="All saved and generated recipes" />
                    <DataLossItem icon="basket-outline" text="Your entire pantry inventory" />
                    <DataLossItem icon="heart-outline" text="All favorited recipes" />
                    <DataLossItem icon="people-outline" text="Community posts and interactions" />
                    <DataLossItem icon="notifications-outline" text="Notification preferences and history" />
                </View>

                {/* User Info */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Account to be deleted:</Text>
                    <Text style={styles.infoValue}>{user?.email || "Unknown"}</Text>
                </View>

                {/* Confirmation Section */}
                <View style={styles.confirmationSection}>
                    <Text style={styles.sectionTitle}>Confirm Deletion</Text>
                    
                    <Text style={styles.inputLabel}>Enter your password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Your current password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon} 
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={22} 
                                color={colors.neutral500} 
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Type "DELETE" to confirm</Text>
                    <TextInput
                        style={[
                            styles.input,
                            confirmText.toUpperCase() === "DELETE" && styles.inputValid
                        ]}
                        value={confirmText}
                        onChangeText={setConfirmText}
                        placeholder="Type DELETE in capital letters"
                        placeholderTextColor={colors.neutral500}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        editable={!loading}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.cancelButton, loading && styles.buttonDisabled]}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.deleteButton,
                            (!isDeleteEnabled || loading) && styles.buttonDisabled
                        ]}
                        onPress={handleDeleteAccount}
                        disabled={!isDeleteEnabled || loading}
                    >
                        {loading ? (
                            <Text style={styles.deleteButtonText}>Deleting...</Text>
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={20} color={colors.white} />
                                <Text style={styles.deleteButtonText}>Delete My Account</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Component for data loss items
const DataLossItem: React.FC<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = ({ icon, text }) => (
    <View style={styles.dataLossItem}>
        <Ionicons name={icon} size={20} color={colors.danger} />
        <Text style={styles.dataLossText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral50,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    content: {
        padding: 20,
    },
    warningContainer: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 2,
        borderColor: colors.danger,
    },
    warningIconContainer: {
        marginBottom: 16,
    },
    warningTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.danger,
        marginBottom: 12,
        textAlign: "center",
    },
    warningText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },
    dataLossList: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    dataLossItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
    },
    dataLossText: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        lineHeight: 20,
    },
    infoBox: {
        backgroundColor: colors.neutral100,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.neutral600,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    confirmationSection: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: colors.neutral100,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 2,
        borderColor: colors.neutral200,
    },
    inputValid: {
        borderColor: colors.success,
        backgroundColor: `${colors.success}15`,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.neutral100,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.neutral200,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    eyeIcon: {
        paddingHorizontal: 12,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: colors.neutral200,
    },
    cancelButtonText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    deleteButton: {
        flex: 1,
        flexDirection: "row",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.danger,
    },
    deleteButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
