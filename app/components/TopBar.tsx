import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface TopBarProps {
    title?: string;
    rightLabel?: string;
    onRightPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title = "Crumbs", rightLabel, onRightPress }) => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.side}>
                <Text style={styles.sideText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onRightPress} style={styles.side}>
                <Text style={[styles.sideText, { opacity: rightLabel ? 1 : 0 }]}>{rightLabel || "•"}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#fff",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: "#ddd",
    },
    title: { flex: 1, textAlign: "center", fontWeight: "600", fontSize: 16 },
    side: { width: 48 },
    sideText: { fontSize: 14 },
});

export default TopBar;
