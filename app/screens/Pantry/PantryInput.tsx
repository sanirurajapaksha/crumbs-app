import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { PantryItem } from "../../types";
import { useRouter } from "expo-router"; // kept for async navigation after generation

const quickAdds = ["Quinoa", "Chickpeas", "Spinach", "Tomato", "Onion"];

export default function PantryInput() {
    const addPantryItem = useStore((s: StoreState) => s.addPantryItem);
    const pantryItems = useStore((s: StoreState) => s.pantryItems);
    const generateRecipeMock = useStore((s: StoreState) => s.generateRecipeMock);
    const [text, setText] = useState("");
    const [localItems, setLocalItems] = useState<PantryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const addItem = (name: string) => {
        const item: PantryItem = { id: `${Date.now()}-${Math.random()}`, name, quantity: "1" };
        setLocalItems((prev) => [...prev, item]);
    };
    const commitItems = () => {
        localItems.forEach(addPantryItem);
        setLocalItems([]);
    };

    const handleGenerate = async () => {
        commitItems();
        setLoading(true);
        try {
            const recipe = await generateRecipeMock(pantryItems.concat(localItems));
            // Using imperative navigation because recipe id is only known after async call
            router.push({ pathname: "./RecipeDetail", params: { id: recipe.id } });
        } finally {
            setLoading(false);
        }
    };

    const mockCamera = () => {
        // TODO (Vision): Replace with camera -> OCR / detection
        ["Carrot", "Pepper"].forEach(addItem);
    };
    const mockVoice = () => {
        // TODO (Voice/Gemini): speech to pantry items
        ["Garlic", "Lemon"].forEach(addItem);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pantry Input</Text>
            <View style={styles.row}>
                <TextInput
                    placeholder="Add item"
                    value={text}
                    onChangeText={setText}
                    style={styles.input}
                    onSubmitEditing={() => {
                        if (text) {
                            addItem(text);
                            setText("");
                        }
                    }}
                />
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                        if (text) {
                            addItem(text);
                            setText("");
                        }
                    }}
                >
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.quickRow}>
                {quickAdds.map((q) => (
                    <TouchableOpacity key={q} style={styles.quick} onPress={() => addItem(q)}>
                        <Text style={styles.quickTxt}>{q}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.actionsRow}>
                <TouchableOpacity onPress={mockCamera} style={styles.tool}>
                    <Text style={styles.toolTxt}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={mockVoice} style={styles.tool}>
                    <Text style={styles.toolTxt}>🎤</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={localItems}
                keyExtractor={(i) => i.id}
                horizontal
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => (
                    <View style={styles.chip}>
                        <Text style={styles.chipTxt}>{item.name}</Text>
                    </View>
                )}
            />
            <TouchableOpacity disabled={loading} onPress={handleGenerate} style={styles.generateBtn}>
                <Text style={styles.generateTxt}>{loading ? "Generating..." : "Generate Recipe"}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    row: { flexDirection: "row", marginBottom: 12 },
    input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginRight: 8 },
    addBtn: { backgroundColor: "#222", paddingHorizontal: 16, justifyContent: "center", borderRadius: 8 },
    addBtnText: { color: "#fff", fontWeight: "600" },
    quickRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
    quick: { backgroundColor: "#eee", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, margin: 4 },
    quickTxt: { fontSize: 12 },
    actionsRow: { flexDirection: "row", marginVertical: 8, gap: 12 },
    tool: { backgroundColor: "#ddd", padding: 10, borderRadius: 8 },
    toolTxt: { fontSize: 18 },
    chip: { backgroundColor: "#222", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginHorizontal: 4 },
    chipTxt: { color: "#fff", fontSize: 12 },
    generateBtn: { marginTop: "auto", backgroundColor: "#0a7", padding: 16, borderRadius: 10 },
    generateTxt: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
