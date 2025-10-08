import { Stack } from "expo-router";
import React from "react";
import { useAsyncSeed } from "./hooks/useAsyncSeed";
import { useStore, StoreState } from "./store/useStore";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
    useAsyncSeed();
    const user = useStore((s: StoreState) => s.user);
    // Simple loading fallback (could track hydration if needed)
    if (user === undefined) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Auth & Onboarding */}
            <Stack.Screen name="screens/Auth/DemoLogin" />
            <Stack.Screen name="screens/Auth/LoginScreen" />
            <Stack.Screen name="screens/Auth/SignupScreen" />
            <Stack.Screen name="screens/Onboarding/Slide1" />
            <Stack.Screen name="screens/Onboarding/Slide2" />
            <Stack.Screen name="screens/Onboarding/Slide3" />
            {/* Feature Flows */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="screens/Pantry/PantryInput" />
            <Stack.Screen name="screens/Pantry/ManualEntry" />
            <Stack.Screen name="screens/Pantry/PantryManage" />
            <Stack.Screen name="screens/Recipe/RecipeDetail" />
            <Stack.Screen name="screens/Recipe/StepsOverview" />
            <Stack.Screen name="screens/Recipe/StepDetail" />
            <Stack.Screen name="screens/Shopping/ShoppingList" />
            <Stack.Screen name="screens/Community/ShareRecipe" />
            <Stack.Screen name="screens/Settings/Settings" />
        </Stack>
    );
}
