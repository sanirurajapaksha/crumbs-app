import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
    const scheme = useColorScheme();
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: scheme === "dark" ? "#fff" : "#000" }}>
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="pantry" options={{ title: "Pantry" }} />
            <Tabs.Screen name="community" options={{ title: "Community" }} />
            <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
            <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
    );
}
