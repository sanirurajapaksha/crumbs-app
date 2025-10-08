import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Recipe } from "../types";

export const MacroStrip: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
    return (
        <View style={styles.row}>
            <Text style={styles.item}>Cal: {recipe.calories_kcal ?? "-"} (est.)</Text>
            <Text style={styles.item}>P: {recipe.protein_g ?? "-"}g</Text>
            <Text style={styles.item}>C: {recipe.carbs_g ?? "-"}g</Text>
            <Text style={styles.item}>F: {recipe.fat_g ?? "-"}g</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
    item: { fontSize: 12, color: "#333", marginRight: 12 },
});

export default MacroStrip;
