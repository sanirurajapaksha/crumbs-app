import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { Link, useRouter } from "expo-router";

export default function DemoLogin() {
    const setUser = useStore((s: StoreState) => s.setUser);
    const router = useRouter();
    const handleDemo = () => {
        setUser({ id: "demo-user", name: "Demo User", email: "demo@example.com", createdAt: new Date().toISOString() });
        // Cast due to ungenerated typed routes
        (router as any).replace("/(tabs)");
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Demo Login</Text>
            <Text style={styles.subtitle}>Tap below to simulate auth. TODO: Replace with Firebase Auth.</Text>
            <TouchableOpacity style={styles.button} onPress={handleDemo}>
                <Text style={styles.buttonText}>Continue as Demo</Text>
            </TouchableOpacity>
            <Link href={"/screens/Auth/LoginScreen" as any} asChild>
                <TouchableOpacity>
                    <Text style={styles.link}>Go to Login</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
    subtitle: { color: "#555", marginBottom: 24 },
    button: { backgroundColor: "#222", padding: 16, borderRadius: 8, marginBottom: 12 },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
    link: { color: "#0a7", textAlign: "center", marginTop: 8 },
});
