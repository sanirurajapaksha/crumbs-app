import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";

export const BottomToolbar: React.FC<{ primaryLabel: string; onPrimary: () => void; secondaryLabel?: string; onSecondary?: () => void }> = ({
    primaryLabel,
    onPrimary,
    secondaryLabel,
    onSecondary,
}) => {
    return (
        <View style={styles.bar}>
            {secondaryLabel && (
                <TouchableOpacity style={styles.secondary} onPress={onSecondary}>
                    <Text style={styles.secondaryText}>{secondaryLabel}</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.primary} onPress={onPrimary}>
                <Text style={styles.primaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bar: { flexDirection: "row", padding: 12, gap: 12, backgroundColor: "#fff", borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#ddd" },
    primary: { flex: 1, backgroundColor: "#222", padding: 14, borderRadius: 8, alignItems: "center" },
    primaryText: { color: "#fff", fontWeight: "600" },
    secondary: { padding: 14, borderRadius: 8, backgroundColor: "#eee" },
    secondaryText: { color: "#222" },
});

export default BottomToolbar;
