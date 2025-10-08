import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { useRouter } from "expo-router"; // using imperative back after submit

export default function ShareRecipe() {
    const postCommunity = useStore((s: StoreState) => s.postCommunity);
    const user = useStore((s: StoreState) => s.user);
    const [text, setText] = useState("");
    const [tags, setTags] = useState("");
    const router = useRouter();

    const pickImageMock = () => {
        /* TODO: integrate image picker */
    };
    const submit = async () => {
        await postCommunity({ authorId: user?.id || "anon", text, tags: tags.split(/[,\s]+/).filter(Boolean) }); // Fix for tags mapping
        router.back();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Share Recipe</Text>
            <TextInput style={styles.input} placeholder="Say something..." value={text} onChangeText={setText} />
            <TextInput style={styles.input} placeholder="tags (comma or space)" value={tags} onChangeText={setTags} />
            <View style={styles.row}>
                <TouchableOpacity style={styles.action} onPress={pickImageMock}>
                    <Text>+ Image</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={submit}>
                <Text style={styles.buttonText}>Post</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 12 },
    row: { flexDirection: "row", gap: 12 },
    action: { backgroundColor: "#eee", padding: 12, borderRadius: 8 },
    button: { backgroundColor: "#222", padding: 16, borderRadius: 10, marginTop: "auto" },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
