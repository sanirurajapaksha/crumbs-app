import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useStore } from "../../store/useStore";

export default function PantryManage() {
    const items = useStore((s) => s.pantryItems);
    const remove = useStore((s) => s.removePantryItem);
    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Manage Pantry</Text>
            <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
                        <Text>{item.name}</Text>
                        <TouchableOpacity onPress={() => remove(item.id)}>
                            <Text style={{ color: "#c00" }}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}
