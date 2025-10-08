import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useStore, StoreState } from "../store/useStore";
import { Link } from "expo-router";

export default function CommunityScreen() {
    const posts = useStore((s: StoreState) => s.communityPosts);
    const loadPosts = useStore((s: StoreState) => s.loadPosts);
    useEffect(() => {
        loadPosts();
    }, []); // eslint-disable-line
    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(p) => p.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                renderItem={({ item }) => (
                    <View style={styles.post}>
                        <Text style={styles.text}>{item.text}</Text>
                        {item.tags && <Text style={styles.tags}>{item.tags.map((t: string) => `#${t}`).join(" ")}</Text>}
                    </View>
                )}
            />
            <Link href={"/screens/Community/ShareRecipe" as any} asChild>
                <TouchableOpacity style={styles.fab}>
                    <Text style={{ color: "#fff", fontSize: 24 }}>＋</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    post: { backgroundColor: "#fff", padding: 12, marginBottom: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: "#ddd" },
    text: { fontSize: 14 },
    tags: { fontSize: 11, color: "#0a7", marginTop: 4 },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 40,
        backgroundColor: "#222",
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
    },
});
