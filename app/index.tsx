import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useStore, StoreState } from "./store/useStore";
import { Redirect } from "expo-router";

// Decides where to send the user on app launch.
export default function Index() {
    const user = useStore((s: StoreState) => s.user);
    const hasOnboarded = useStore((s: StoreState) => s.hasOnboarded);

    // While store hydrates (user undefined would require extra flag; here null means no user)
    if (user === undefined) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    if (!hasOnboarded) {
        return <Redirect href={"/screens/Onboarding/Slide1" as any} />;
    }
    if (!user) {
        return <Redirect href={"/screens/Auth/LoginScreen" as any} />;
    }
    return <Redirect href={"/(tabs)" as any} />;
}
