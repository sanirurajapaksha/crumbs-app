import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore, StoreState } from "../../store/useStore";
export default function StepDetail() {
    const { id, step } = useLocalSearchParams<{ id: string; step: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const recipe = favorites.find((r: any) => r.id === id);
    const router = useRouter();
    if (!recipe)
        return (
            <View style={styles.center}>
                <Text>No recipe</Text>
            </View>
        );
    const current = recipe.steps.find((s: any) => String(s.stepNumber) === step) || recipe.steps[0];
    const idx = recipe.steps.indexOf(current);
    const go = (n: number) => {
        const next = recipe.steps[idx + n];
        if (next) router.replace({ pathname: "./StepDetail", params: { id: recipe.id, step: next.stepNumber } });
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Step {current.stepNumber}</Text>
            <Text style={styles.body}>{current.text}</Text>
            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={() => go(-1)} disabled={idx === 0}>
                    <Text style={styles.btnTxt}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => go(0)}>
                    <Text style={styles.btnTxt}>Repeat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => go(1)} disabled={idx === recipe.steps.length - 1}>
                    <Text style={styles.btnTxt}>Next</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    container: { flex: 1, padding: 24 },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
    body: { fontSize: 16, lineHeight: 22, marginBottom: 24 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    btn: { flex: 1, backgroundColor: "#222", padding: 14, borderRadius: 8, marginHorizontal: 4 },
    btnTxt: { color: "#fff", textAlign: "center" },
});
