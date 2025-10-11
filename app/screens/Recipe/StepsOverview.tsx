import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "../../theme/colors";

export default function StepsOverview() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const favorites = useStore((s: StoreState) => s.favorites);
    const myRecipes = useStore((s: StoreState) => s.myRecipes);
    
    // Check both favorites and myRecipes
    let recipe = favorites.find((r) => r.id === id);
    if (!recipe) {
        recipe = myRecipes.find((r) => r.id === id);
    }
    
    if (!recipe) {
        return (
            <View style={styles.center}>
                <Text>No recipe found</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{recipe.title} - Steps</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={recipe.steps}
                keyExtractor={(s) => String(s.stepNumber)}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <Link 
                        href={{ 
                            pathname: "/screens/Recipe/StepDetail", 
                            params: { id: recipe.id, step: item.stepNumber } 
                        } as any} 
                        asChild
                    >
                        <TouchableOpacity style={styles.stepCard}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{item.stepNumber}</Text>
                            </View>
                            <Text style={styles.stepText}>{item.text}</Text>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </Link>
                )}
            />

            {/* Start Cooking Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => {
                        if (recipe.steps && recipe.steps.length > 0) {
                            router.push({
                                pathname: "/screens/Recipe/StepDetail",
                                params: { id: recipe.id, step: recipe.steps[0].stepNumber }
                            });
                        }
                    }}
                >
                    <Text style={styles.startButtonText}>Start Cooking</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#FFF5F0",
    },
    container: {
        flex: 1,
        backgroundColor: "#FFF5F0",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: "#FFF5F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        flex: 1,
        textAlign: "center",
        paddingHorizontal: 12,
        marginTop: 2,
    },
    listContainer: { 
        padding: 16,
        paddingBottom: 100,
    },
    stepCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    stepNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFE5DC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    stepNumberText: { 
        fontWeight: "700",
        fontSize: 18,
        color: colors.accent,
    },
    stepText: { 
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        lineHeight: 22,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "#FFF5F0",
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    startButton: {
        backgroundColor: colors.accent,
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
});
