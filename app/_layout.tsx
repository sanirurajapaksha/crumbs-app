import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAsyncSeed } from "./hooks/useAsyncSeed";
import { StoreState, useStore } from "./store/useStore";

export default function RootLayout() {
    useAsyncSeed();
    const user = useStore((s: StoreState) => s.user);
    const startAuthListener = useStore((s: StoreState) => s.startAuthListener);

    useEffect(() => {
        startAuthListener();
    }, [startAuthListener]);
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
            <Stack.Screen name="screens/Auth/LoginScreen" options={{ gestureEnabled: false }} />
            <Stack.Screen name="screens/Auth/SignupScreen" />
            <Stack.Screen name="screens/Onboarding/Slide1" />
            <Stack.Screen name="screens/Onboarding/Slide2" />
            <Stack.Screen name="screens/Onboarding/Slide3" />
            {/* Feature Flows */}
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="screens/Pantry/PantryInput" />
            <Stack.Screen name="screens/Pantry/CameraScreen" />
            <Stack.Screen name="screens/Pantry/ManualEntry" />
            <Stack.Screen name="screens/Pantry/PantryManage" />
            <Stack.Screen name="screens/Recipe/RecipeDetail" />
            <Stack.Screen name="screens/Recipe/StepsOverview" />
            <Stack.Screen name="screens/Recipe/StepDetail" />
            <Stack.Screen name="screens/Shopping/ShoppingList" />
            <Stack.Screen name="screens/Community/ShareRecipe" />
            <Stack.Screen name="screens/Community/PostPage" />
            <Stack.Screen name="screens/Settings/DeleteAccountScreen" />
        </Stack>
    );
}
