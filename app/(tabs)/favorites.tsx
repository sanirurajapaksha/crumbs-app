import React from "react";
import { View, FlatList, StyleSheet, Text } from "react-native";
import { useStore, StoreState } from "../store/useStore";
import { RecipeCard } from "../components/RecipeCard";
import { Link } from "expo-router";

export default function FavoritesScreen() {
    const favorites = useStore((s: StoreState) => s.favorites);
    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={favorites}
                keyExtractor={(r) => r.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={styles.empty}>No favorites yet.</Text>}
                renderItem={({ item }) => (
                    <Link href={{ pathname: "/screens/Recipe/RecipeDetail", params: { id: item.id } } as any} asChild>
                        <View>
                            <RecipeCard
                                recipe={item}
                                onPress={() => {
                                    /* handled by Link */
                                }}
                                isFavorite
                            />
                        </View>
                    </Link>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    empty: { textAlign: "center", marginTop: 40, color: "#666" },
});
