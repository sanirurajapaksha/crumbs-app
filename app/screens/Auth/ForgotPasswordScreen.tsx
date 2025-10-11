import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { colors } from "../../theme/colors";
import { useStore, StoreState } from "@/app/store/useStore";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
    const resetPassword = useStore((s: StoreState) => s.resetPassword);
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email.trim()) {
            return Alert.alert("Email required", "Please enter your email address.");
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return Alert.alert("Invalid email", "Please enter a valid email address.");
        }

        setIsLoading(true);
        try {
            await resetPassword?.(email.trim());
            Alert.alert(
                "Reset email sent!",
                "Check your inbox for password reset instructions.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (e: any) {
            Alert.alert("Reset failed", e?.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.screen}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.contentWrapper}>
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={64} color={colors.accent} />
                    </View>

                    {/* Title & Description */}
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.description}>
                        Don't worry! Enter your email address and we'll send you instructions to reset your password.
                    </Text>

                    {/* Email Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.neutral500}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        autoFocus
                    />

                    {/* Send Button */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        <Text style={styles.primaryTxt}>{isLoading ? "Sending..." : "Send Reset Link"}</Text>
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity style={styles.backToLogin} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={16} color={colors.accent} style={styles.backIcon} />
                        <Text style={styles.backToLoginText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.white,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    contentWrapper: {
        flex: 1,
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
        color: colors.textPrimary,
    },
    description: {
        fontSize: 14,
        textAlign: "center",
        color: colors.neutral600,
        marginBottom: 32,
        lineHeight: 20,
        paddingHorizontal: 12,
    },
    input: {
        backgroundColor: colors.neutral50,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
        fontSize: 14,
        marginBottom: 20,
    },
    primaryBtn: {
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 28,
        alignItems: "center",
        marginBottom: 20,
    },
    primaryTxt: {
        color: colors.white,
        fontWeight: "600",
        fontSize: 15,
    },
    backToLogin: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    backIcon: {
        marginRight: 6,
    },
    backToLoginText: {
        fontSize: 14,
        color: colors.accent,
        fontWeight: "600",
    },
});
