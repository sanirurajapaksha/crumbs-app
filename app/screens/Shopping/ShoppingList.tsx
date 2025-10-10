import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../../store/useStore";

export default function ShoppingList() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s) => s.favorites);
    const recipe = favorites.find((r) => r.id === id);
    const [checked, setChecked] = useState<Record<string, boolean>>({});

    const missing = useMemo(() => {
        if (!recipe) return [];
        // naive grouping by first letter (placeholder) TODO: replace with categorization
        return recipe.ingredients.map((i) => ({ ...i, group: i.name[0].toUpperCase() }));
    }, [recipe]);

    const toggle = (n: string) => setChecked((c) => ({ ...c, [n]: !c[n] }));

    if (!recipe)
        return (
            <View style={styles.center}>
                <Text>No recipe found</Text>
            </View>
        );
    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={missing}
                keyExtractor={(i) => i.name}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => toggle(item.name)}>
                        <View style={[styles.box, checked[item.name] && styles.boxChecked]}>
                            {checked[item.name] && (
                                <MaterialIcons name="check" size={16} color="#fff" />
                            )}
                        </View>
                        <Text style={styles.ing}>
                            {item.name} {item.qty && <Text style={styles.qty}>{item.qty}</Text>}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    box: { 
        width: 24, 
        height: 24, 
        borderWidth: 1, 
        borderColor: "#444", 
        marginRight: 12, 
        justifyContent: "center", 
        alignItems: "center",
        borderRadius: 4,
    },
    boxChecked: { backgroundColor: "#0a7", borderColor: "#0a7" },
    ing: { fontSize: 14, flex: 1 },
    qty: { fontSize: 12, color: "#555" },
});
