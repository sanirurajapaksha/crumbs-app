import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useStore, StoreState } from "../store/useStore";

export default function PantryTab() {
    const items = useStore((s: StoreState) => s.pantryItems);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pantry ({items.length})</Text>
            <Link href={"/screens/Pantry/PantryInput" as any} asChild>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Open Pantry Input</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
    button: { backgroundColor: "#222", padding: 14, borderRadius: 8, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "600" },
});
