import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useStore, StoreState } from "../store/useStore";

export default function SettingsScreen() {
    const user = useStore((s: StoreState) => s.user);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <Text>User: {user ? user.email : "Not logged in"}</Text>
            {/* TODO: Add preferences, dietary tags, logout, real auth wiring */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
});
