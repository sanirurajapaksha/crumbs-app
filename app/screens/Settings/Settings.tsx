import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "@/app/theme/colors";

export default function Settings() {
    const user = useStore((s: StoreState) => s.user);
    const signOut = useStore((s: StoreState) => s.signOut);
    const authLoading = useStore((s: StoreState) => s.authLoading);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.line}>Logged in as: {user?.email || "Guest"}</Text>
            <TouchableOpacity style={[styles.btn, authLoading && { opacity: 0.7 }]} onPress={signOut} disabled={!!authLoading}>
                <Text style={styles.btnTxt}>{authLoading ? "Loading" : "Logout"}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    line: { marginBottom: 16 },
    btn: { backgroundColor: colors.accent, padding: 14, borderRadius: 8, marginTop: 50 },
    btnTxt: { color: colors.black, textAlign: "center", fontWeight: "600" },
});
