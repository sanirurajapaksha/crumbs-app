import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useStore, StoreState } from "../../store/useStore";

export default function Settings() {
    const user = useStore((s: StoreState) => s.user);
    const clearUser = useStore((s: StoreState) => s.clearUser);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.line}>Logged in as: {user?.email || "Guest"}</Text>
            <TouchableOpacity style={styles.btn} onPress={clearUser}>
                <Text style={styles.btnTxt}>Logout (clear user)</Text>
            </TouchableOpacity>
            {/* TODO: real Firebase signOut and account settings */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    line: { marginBottom: 16 },
    btn: { backgroundColor: "#222", padding: 14, borderRadius: 8, marginTop: 12 },
    btnTxt: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
