import React from "react";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
    const scheme = useColorScheme();
    const iconColor = scheme === "dark" ? "#fff" : "#000";
    const activeColor = "#FF6B35";
    
    return (
        <Tabs 
            screenOptions={{ 
                headerShown: false, 
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: scheme === "dark" ? "#888" : "#999",
            }}
        >
            <Tabs.Screen 
                name="index" 
                options={{ 
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="pantry" 
                options={{ 
                    title: "Pantry",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="community" 
                options={{ 
                    title: "Generate",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="sparkles-outline" size={size} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="favorites" 
                options={{ 
                    title: "Community",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="profile" 
                options={{ 
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }} 
            />
            {/* <Tabs.Screen 
                name="settings" 
                options={{ 
                    href: null, // Hide from tabs
                }} 
            /> */}
        </Tabs>
    );
}
