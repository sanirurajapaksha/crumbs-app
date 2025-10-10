import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { changePassword, sendPasswordReset } from "../../api/auth";
import { useStore, StoreState } from "../../store/useStore";

export default function ChangePasswordScreen() {
    const user = useStore((s: StoreState) => s.user);
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);

    // Password validation
    const validatePassword = (password: string): { valid: boolean; message: string } => {
        if (password.length < 8) {
            return { valid: false, message: "Password must be at least 8 characters long" };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: "Password must contain at least one uppercase letter" };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: "Password must contain at least one lowercase letter" };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: "Password must contain at least one number" };
        }
        return { valid: true, message: "Password is strong" };
    };

    const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
        if (password.length < 8) return "weak";
        
        let strength = 0;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength <= 2) return "weak";
        if (strength === 3) return "medium";
        return "strong";
    };

    const getPasswordStrengthColor = (strength: "weak" | "medium" | "strong") => {
        switch (strength) {
            case "weak": return colors.danger;
            case "medium": return "#FFA726";
            case "strong": return "#4CAF50";
        }
    };

    const handleForgotPassword = async () => {
        if (!user?.email) {
            Alert.alert("Error", "No email address found for your account");
            return;
        }

        Alert.alert(
            "Reset Password",
            `A password reset link will be sent to ${user.email}. Continue?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send Link",
                    onPress: async () => {
                        try {
                            await sendPasswordReset(user.email);
                            Alert.alert(
                                "Email Sent",
                                "A password reset link has been sent to your email. Please check your inbox.",
                                [
                                    {
                                        text: "OK",
                                        onPress: () => {
                                            router.back();
                                        }
                                    }
                                ]
                            );
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to send password reset email");
                        }
                    }
                }
            ]
        );
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New password and confirmation do not match");
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert("Error", "New password must be different from current password");
            return;
        }

        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            Alert.alert("Weak Password", validation.message);
            return;
        }

        setLoading(true);

        try {
            // Call Firebase to change password
            await changePassword(currentPassword, newPassword);

            Alert.alert(
                "Success",
                "Your password has been changed successfully. Please use your new password for future logins.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // Clear form
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            router.back();
                        }
                    }
                ]
            );
        } catch (error: any) {
            // Error messages are already mapped in auth.ts
            Alert.alert("Error", error.message || "Failed to change password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color={colors.accent} />
                    <Text style={styles.infoText}>
                        Your password must be at least 8 characters long and contain uppercase, lowercase letters, and numbers.
                    </Text>
                </View>

                {/* Current Password */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showCurrentPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            <Ionicons
                                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color={colors.neutral600}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                            <Ionicons
                                name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color={colors.neutral600}
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && passwordStrength && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBar}>
                                <View
                                    style={[
                                        styles.strengthFill,
                                        {
                                            width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%",
                                            backgroundColor: getPasswordStrengthColor(passwordStrength),
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.strengthText, { color: getPasswordStrengthColor(passwordStrength) }]}>
                                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)} password
                            </Text>
                        </View>
                    )}
                </View>

                {/* Confirm New Password */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color={colors.neutral600}
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Match Indicator */}
                    {confirmPassword.length > 0 && (
                        <View style={styles.matchContainer}>
                            <Ionicons
                                name={newPassword === confirmPassword ? "checkmark-circle" : "close-circle"}
                                size={16}
                                color={newPassword === confirmPassword ? "#4CAF50" : colors.danger}
                            />
                            <Text style={[
                                styles.matchText,
                                { color: newPassword === confirmPassword ? "#4CAF50" : colors.danger }
                            ]}>
                                {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <View style={styles.requirementItem}>
                        <Ionicons 
                            name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={newPassword.length >= 8 ? "#4CAF50" : colors.neutral500} 
                        />
                        <Text style={styles.requirementText}>At least 8 characters</Text>
                    </View>
                    <View style={styles.requirementItem}>
                        <Ionicons 
                            name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={/[A-Z]/.test(newPassword) ? "#4CAF50" : colors.neutral500} 
                        />
                        <Text style={styles.requirementText}>One uppercase letter</Text>
                    </View>
                    <View style={styles.requirementItem}>
                        <Ionicons 
                            name={/[a-z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={/[a-z]/.test(newPassword) ? "#4CAF50" : colors.neutral500} 
                        />
                        <Text style={styles.requirementText}>One lowercase letter</Text>
                    </View>
                    <View style={styles.requirementItem}>
                        <Ionicons 
                            name={/[0-9]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={/[0-9]/.test(newPassword) ? "#4CAF50" : colors.neutral500} 
                        />
                        <Text style={styles.requirementText}>One number</Text>
                    </View>
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                    style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={styles.changeButtonText}>Changing Password...</Text>
                    ) : (
                        <>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.white} />
                            <Text style={styles.changeButtonText}>Change Password</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Forgot Password Link */}
                <TouchableOpacity 
                    style={styles.forgotPasswordButton}
                    onPress={handleForgotPassword}
                >
                    <Text style={styles.forgotPasswordText}>Forgot your current password?</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    scrollContent: {
        padding: 16,
    },
    infoCard: {
        flexDirection: "row",
        backgroundColor: colors.accentSubtle,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    passwordInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.neutral300,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    eyeButton: {
        padding: 12,
    },
    strengthContainer: {
        marginTop: 8,
    },
    strengthBar: {
        height: 4,
        backgroundColor: colors.neutral200,
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 6,
    },
    strengthFill: {
        height: "100%",
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: "600",
    },
    matchContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
    },
    matchText: {
        fontSize: 12,
        fontWeight: "600",
    },
    requirementsContainer: {
        backgroundColor: colors.neutral100,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 12,
    },
    requirementItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    changeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    changeButtonDisabled: {
        opacity: 0.6,
    },
    changeButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    forgotPasswordButton: {
        alignItems: "center",
        paddingVertical: 12,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: colors.accent,
        fontWeight: "600",
    },
});
