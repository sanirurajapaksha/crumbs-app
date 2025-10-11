import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/app/theme/colors";
import { Comment } from "@/app/types";

export default function CommentSection(comments: Comment) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{comments.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={styles.name}>{comments.name}</Text>
                        <Text style={styles.when}>{comments.when}</Text>
                    </View>
                    <Text style={styles.text}>{comments.text}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { padding: 12, borderColor: colors.neutral200 },
    row: { flexDirection: "row", marginVertical: 3 },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.neutral200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    avatarTxt: { fontSize: 12, fontWeight: "700", color: colors.neutral800 },
    name: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginRight: 8 },
    when: { fontSize: 11, color: colors.neutral600 },
    text: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10, gap: 12 },
    ctrlBtn: { padding: 6, borderRadius: 8, backgroundColor: colors.neutral100 },
    disabled: { opacity: 0.6 },
    counter: { fontSize: 12, color: colors.neutral700 },
});
