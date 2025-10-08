import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { useStore, StoreState } from "../../store/useStore";

export default function StepsOverview() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const recipe = favorites.find((r) => r.id === id);
    if (!recipe)
        return (
            <View style={styles.center}>
                <Text>No recipe found</Text>
            </View>
        );
    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={recipe.steps}
                keyExtractor={(s) => String(s.stepNumber)}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <Link href={{ pathname: "/screens/Recipe/StepDetail", params: { id: recipe.id, step: item.stepNumber } } as any} asChild>
                        <TouchableOpacity style={styles.item}>
                            <Text style={styles.num}>{item.stepNumber}.</Text>
                            <Text style={styles.text}>{item.text}</Text>
                        </TouchableOpacity>
                    </Link>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    item: {
        flexDirection: "row",
        marginBottom: 12,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#ddd",
    },
    num: { fontWeight: "700", marginRight: 8 },
    text: { flex: 1 },
});
