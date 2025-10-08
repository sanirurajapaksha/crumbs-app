import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <View style={styles.actions}>
                <Link href={"/screens/Pantry/PantryInput" as any} asChild>
                    <TouchableOpacity style={styles.card}>
                        <Text style={styles.cardTxt}>Add Pantry</Text>
                    </TouchableOpacity>
                </Link>
                <Link href={"/(tabs)/community" as any} asChild>
                    <TouchableOpacity style={styles.card}>
                        <Text style={styles.cardTxt}>Go to Community</Text>
                    </TouchableOpacity>
                </Link>
                <Link href={"/screens/Auth/DemoLogin" as any} asChild>
                    <TouchableOpacity style={styles.card}>
                        <Text style={styles.cardTxt}>Demo Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    card: { backgroundColor: "#222", padding: 16, borderRadius: 12, minWidth: "45%" },
    cardTxt: { color: "#fff", fontWeight: "600" },
});
