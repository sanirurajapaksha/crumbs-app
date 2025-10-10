import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Recipe } from "../types";

export const RecipeCard: React.FC<{ recipe: Recipe; onPress?: () => void; isFavorite?: boolean }> = ({ recipe, onPress, isFavorite }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.card}>
            {recipe.heroImage && <Image source={{ uri: recipe.heroImage }} style={styles.image} />}
            <View style={styles.body}>
                <Text style={styles.title}>{recipe.title}</Text>
                <Text style={styles.meta}>
                    {recipe.cookTimeMin ? `${recipe.cookTimeMin} min • ` : ""}
                    {recipe.protein_g ? `${recipe.protein_g}g P` : ""}
                </Text>
                {isFavorite && (
                    <View style={styles.badge}>
                        <MaterialIcons name="star" size={11} color="#0a7" />
                        <Text style={styles.badgeText}>Favorite</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        overflow: "hidden",
        marginVertical: 8,
        elevation: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#ddd",
    },
    image: { width: "100%", height: 140, backgroundColor: "#eee" },
    body: { padding: 12 },
    title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
    meta: { fontSize: 12, color: "#555" },
    badge: { 
        marginTop: 6, 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 2 
    },
    badgeText: { 
        fontSize: 11, 
        color: "#0a7" 
    },
});

export default RecipeCard;
