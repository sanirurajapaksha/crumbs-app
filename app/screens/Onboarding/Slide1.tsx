import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { colors } from "../../theme/colors";
import { Link } from "expo-router";

export default function Slide1() {
    return (
        <View style={styles.wrapper}>
            <View style={styles.illustration}>
                <Image 
                    source={require("../../../assets/images/onboarding-1.png")} 
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.card}>
                <Text style={styles.heading}>Waste Less, Taste More</Text>
                <Text style={styles.subtitle}>Generate delicious meals from the ingredients already in your kitchen.</Text>
                <View style={styles.dotsRow}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
                <Link href={"/screens/Onboarding/Slide2" as any} asChild>
                    <TouchableOpacity style={styles.nextBtn}>
                        <Text style={styles.nextTxt}>Next</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.white },
    illustration: {
        flex: 0.55,
        backgroundColor: colors.neutral300, // soft green-ish placeholder
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    card: {
        flex: 0.45,
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingHorizontal: 32,
        paddingTop: 32,
    },
    heading: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 16 },
    subtitle: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: "center", marginBottom: 28 },
    dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 32 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentSubtle },
    dotActive: { backgroundColor: colors.accentAlt },
    nextBtn: {
        backgroundColor: colors.accent,
        paddingVertical: 14,
        borderRadius: 12,
    },
    nextTxt: { color: colors.white, fontWeight: "600", textAlign: "center", fontSize: 16 },
});
