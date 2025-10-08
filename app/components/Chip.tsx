import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export const Chip: React.FC<{ label: string; onPress?: () => void; selected?: boolean }> = ({ label, onPress, selected }) => {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.sel]}>
            <Text style={[styles.text, selected && styles.selText]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#f0f0f0", margin: 4 },
    text: { fontSize: 12 },
    sel: { backgroundColor: "#222" },
    selText: { color: "#fff" },
});

export default Chip;
