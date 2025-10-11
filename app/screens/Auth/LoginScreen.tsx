import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import { Link, router } from "expo-router";
import { colors } from "../../theme/colors";
import { useStore, StoreState } from "@/app/store/useStore";
import { Ionicons } from "@expo/vector-icons";

// TODO: Generate typed routes (npx expo-router generate) then remove `as any` casts across Link hrefs.
export default function LoginScreen() {
    const login = useStore((s: StoreState) => s.login);
    const resetPassword = useStore((s: StoreState) => s.resetPassword);
    const authLoading = useStore((s: StoreState) => s.authLoading);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        if (!email.trim()) return Alert.alert("Email required", "Please enter your email.");
        if (password.length < 6) return Alert.alert("Password too short", "Minimum 6 characters.");
        login(email, password).catch((e: any) => {
            const msg = e?.message || "Login failed";
            Alert.alert("Login failed", msg);
        });
    };

    return (
        <View style={styles.screen}>
            <View style={styles.contentWrapper}>
                <View style={styles.content}>
                    <Text style={styles.brand}>Crumbs</Text>
                    <Text style={styles.welcome}>Welcome Back!</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.neutral500}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            placeholderTextColor={colors.neutral500}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        {password.length > 0 && (
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={22}
                                    color={colors.neutral500}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push("/screens/Auth/ForgotPasswordScreen" as any)}
                    >
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, authLoading && { opacity: 0.7 }]} onPress={handleLogin} disabled={!!authLoading}>
                        <Text style={styles.primaryTxt}>{authLoading ? "Loading" : "Log In"}</Text>
                    </TouchableOpacity>
                    <View style={styles.inlineRow}>
                        <Text style={styles.inlineText}>Don&apos;t have an account? </Text>
                        <Link href={"/screens/Auth/SignupScreen" as any} asChild>
                            <TouchableOpacity>
                                <Text style={styles.inlineLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                    <View style={styles.dividerRow}>
                        <View style={styles.divLine} />
                        <Text style={styles.dividerLabel}>OR</Text>
                        <View style={styles.divLine} />
                    </View>
                    <TouchableOpacity style={styles.socialBtn} onPress={() => alert("TODO: Google Sign-In")}>
                        <View style={styles.socialInner}>
                            <Image source={require("../../../assets/images/google.png")} style={styles.socialIcon} />
                            <Text style={styles.socialText}>Continue with Google</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn} onPress={() => alert("TODO: Apple Sign-In")}>
                        <View style={styles.socialInner}>
                            <Image source={require("../../../assets/images/apple.png")} style={styles.socialIcon} />
                            <Text style={styles.socialText}>Continue with Apple</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.white },
    contentWrapper: { flex: 1, justifyContent: "center" },
    content: { paddingHorizontal: 24, paddingBottom: 48 },
    brand: { fontSize: 40, fontWeight: "700", textAlign: "center", marginBottom: 8 },
    welcome: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 24 },
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
    demoLink: { textAlign: "center", fontSize: 12, color: colors.success, fontWeight: "500" },
    forgotLink: { alignSelf: "flex-end", marginBottom: 8, color: colors.accent, fontSize: 12, fontWeight: "600" },
});
