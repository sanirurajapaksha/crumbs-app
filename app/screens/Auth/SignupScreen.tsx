import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from "react-native";
import { Link } from "expo-router";
import { colors } from "../../theme/colors";
import { useStore, StoreState } from "@/app/store/useStore";

// TODO: Replace stubs with real Firebase Auth integration
export default function SignupScreen() {
    const setUser = useStore((s: StoreState) => s.setUser);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const handleSignup = () => {
        if (!name.trim()) return Alert.alert("Name required", "Please enter your full name.");
        if (!email.trim()) return Alert.alert("Email required", "Please enter your email.");
        if (password.length < 6) return Alert.alert("Password too short", "Minimum 6 characters.");
        if (password !== confirm) return Alert.alert("Passwords do not match", "Check your confirmation password.");
        // Stub implementation
        Alert.alert("Signup Stub", `Creating user for ${email}`);
        // remove this later
        setUser({ id: "new-user", name: name, email: email, createdAt: new Date().toISOString() });
    };

    return (
        <View style={styles.screen}>
            <View style={styles.contentWrapper}>
                <View style={styles.content}>
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
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.neutral500}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={colors.neutral500}
                        secureTextEntry
                        value={confirm}
                        onChangeText={setConfirm}
                        returnKeyType="done"
                        onSubmitEditing={handleSignup}
                    />
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} activeOpacity={0.85}>
                        <Text style={styles.primaryTxt}>Sign Up</Text>
                    </TouchableOpacity>
                    <View style={styles.inlineRow}>
                        <Text style={styles.inlineText}>Already have an account? </Text>
                        <Link href={"/screens/Auth/LoginScreen" as any} replace asChild>
                            <TouchableOpacity>
                                <Text style={styles.inlineLink}>Log In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                    <View style={styles.dividerRow}>
                        <View style={styles.divLine} />
                        <Text style={styles.dividerLabel}>OR</Text>
                        <View style={styles.divLine} />
                    </View>
                    <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("TODO", "Google Sign-Up stub")}>
                        <View style={styles.socialInner}>
                            <Image source={require("../../../assets/images/google.png")} style={styles.socialIcon} />
                            <Text style={styles.socialText}>Continue with Google</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("TODO", "Apple Sign-Up stub")}>
                        <View style={styles.socialInner}>
                            <Image source={require("../../../assets/images/apple.png")} style={styles.socialIcon} />
                            <Text style={styles.socialText}>Continue with Apple</Text>
                        </View>
                    </TouchableOpacity>
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
    heading: { fontSize: 35, fontWeight: "700", textAlign: "center", marginBottom: 24, color: colors.textPrimary },
    input: {
        backgroundColor: colors.neutral50,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
        fontSize: 14,
        marginBottom: 14,
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
