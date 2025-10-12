import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from "react-native";
import { Link } from "expo-router";
import { colors } from "../../theme/colors";
import { useStore, StoreState } from "@/app/store/useStore";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
    const signup = useStore((s: StoreState) => s.signup);
    const authLoading = useStore((s: StoreState) => s.authLoading);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSignup = () => {
        if (!name.trim()) return Alert.alert("Name required", "Please enter your full name.");
        if (!email.trim()) return Alert.alert("Email required", "Please enter your email.");
        if (password.length < 6) return Alert.alert("Password too short", "Minimum 6 characters.");
        if (password !== confirm) return Alert.alert("Passwords do not match", "Check your confirmation password.");
        signup(name.trim(), email.trim(), password).catch((e: any) => Alert.alert("Signup failed", e?.message || String(e)));
    };

    return (
        <View style={styles.screen}>
            <View style={styles.contentWrapper}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require("../../../assets/images/crumbs-logo-tagline.png")} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.heading}>Join Crumbs!</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor={colors.neutral500}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.neutral500}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="next"
                        />
                        {password.length > 0 && (
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.neutral500} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm Password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showConfirm}
                            value={confirm}
                            onChangeText={setConfirm}
                            returnKeyType="done"
                            onSubmitEditing={handleSignup}
                        />
                        {confirm.length > 0 && (
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={22} color={colors.neutral500} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.primaryBtn, authLoading && { opacity: 0.7 }]}
                        onPress={handleSignup}
                        activeOpacity={0.85}
                        disabled={!!authLoading}
                    >
                        <Text style={styles.primaryTxt}>{authLoading ? "Loading" : "Sign Up"}</Text>
                    </TouchableOpacity>
                    <View style={styles.inlineRow}>
                        <Text style={styles.inlineText}>Already have an account? </Text>
                        <Link href={"/screens/Auth/LoginScreen" as any} replace asChild>
                            <TouchableOpacity>
                                <Text style={styles.inlineLink}>Log In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                    <View style={{ height: 32 }} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.white },
    contentWrapper: { flex: 1, justifyContent: "center" },
    content: { paddingHorizontal: 24, paddingBottom: 48 },
    logoContainer: {
        alignItems: "center",
        marginBottom: 16,
    },
    logo: {
        width: 280,
        height: 130,
    },
    heading: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 24,
        color: colors.textPrimary,
    },
    input: {
        backgroundColor: colors.neutral50,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
        fontSize: 14,
        marginBottom: 14,
    },
    passwordContainer: {
        position: "relative",
        marginBottom: 14,
    },
    passwordInput: {
        backgroundColor: colors.neutral50,
        paddingHorizontal: 18,
        paddingVertical: 14,
        paddingRight: 50,
        borderRadius: 24,
        fontSize: 14,
    },
    eyeIcon: {
        position: "absolute",
        right: 18,
        top: "40%",
        transform: [{ translateY: -11 }],
        padding: 4,
    },
    primaryBtn: {
        backgroundColor: colors.accent,
        paddingVertical: 16,
        borderRadius: 28,
        alignItems: "center",
        marginTop: 4,
    },
    primaryTxt: { color: colors.white, fontWeight: "600", fontSize: 15 },
    inlineRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14 },
    inlineText: { fontSize: 12, color: colors.neutral800 },
    inlineLink: { fontSize: 12, color: colors.accent, fontWeight: "600" },
    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 28 },
    divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.neutral200 },
    dividerLabel: { marginHorizontal: 12, fontSize: 12, color: colors.neutral600 },
    socialBtn: {
        backgroundColor: colors.neutral50,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 26,
        marginBottom: 14,
        alignItems: "center",
    },
    socialInner: { flexDirection: "row", alignItems: "center" },
    socialIcon: { width: 22, height: 22, resizeMode: "contain", marginRight: 12 },
    socialText: { fontSize: 13, fontWeight: "500", color: colors.textPrimary },
});
