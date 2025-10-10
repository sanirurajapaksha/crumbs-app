import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useStore, StoreState } from "@/app/store/useStore";
import type { NotificationType } from "@/app/types";

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case "recipe":
            return "restaurant-outline";
        case "community":
            return "people-outline";
        case "like":
            return "heart-outline";
        case "system":
            return "alert-circle-outline";
        default:
            return "notifications-outline";
    }
};

const getNotificationColor = (type: NotificationType) => {
    switch (type) {
        case "recipe":
            return colors.accent;
        case "community":
            return "#4A90E2";
        case "like":
            return "#E91E63";
        case "system":
            return "#FFA726";
        default:
            return colors.neutral500;
    }
};

export default function NotificationsScreen() {
    const notifications = useStore((s: StoreState) => s.notifications);
    const markNotificationAsRead = useStore((s: StoreState) => s.markNotificationAsRead);
    const markAllNotificationsAsRead = useStore((s: StoreState) => s.markAllNotificationsAsRead);
    const clearAllNotifications = useStore((s: StoreState) => s.clearAllNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <Text style={styles.unreadText}>{unreadCount} unread</Text>
                        )}
                    </View>
                </View>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={markAllNotificationsAsRead}>
                        <Text style={styles.markAllRead}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="notifications-off-outline"
                            size={64}
                            color={colors.neutral400}
                        />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptySubtitle}>
                            You're all caught up! We'll notify you when something new happens.
                        </Text>
                    </View>
                ) : (
                    <>
                        {notifications.map((notification) => (
                            <TouchableOpacity
                                key={notification.id}
                                style={[
                                    styles.notificationItem,
                                    !notification.read && styles.unreadItem,
                                ]}
                                onPress={() => markNotificationAsRead(notification.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.notificationContent}>
                                    <View
                                        style={[
                                            styles.iconCircle,
                                            {
                                                backgroundColor: `${getNotificationColor(
                                                    notification.type
                                                )}20`,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getNotificationIcon(notification.type)}
                                            size={20}
                                            color={getNotificationColor(notification.type)}
                                        />
                                    </View>

                                    <View style={styles.textContainer}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.notificationTitle}>
                                                {notification.title}
                                            </Text>
                                            {!notification.read && (
                                                <View style={styles.unreadDot} />
                                            )}
                                        </View>
                                        <Text style={styles.notificationMessage} numberOfLines={2}>
                                            {notification.message}
                                        </Text>
                                        <Text style={styles.notificationTime}>
                                            {notification.time}
                                        </Text>
                                    </View>

                                    {notification.image && (
                                        <Image
                                            source={{ uri: notification.image }}
                                            style={styles.notificationImage}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}

                        {notifications.length > 0 && (
                            <TouchableOpacity style={styles.clearButton} onPress={clearAllNotifications}>
                                <Text style={styles.clearButtonText}>Clear All Notifications</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    unreadText: {
        fontSize: 12,
        color: colors.accent,
        fontWeight: "600",
        marginTop: 2,
    },
    markAllRead: {
        fontSize: 14,
        color: colors.accent,
        fontWeight: "600",
    },
    notificationItem: {
        backgroundColor: colors.white,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.neutral200,
    },
    unreadItem: {
        backgroundColor: "#FFF9F5",
    },
    notificationContent: {
        flexDirection: "row",
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent,
    },
    notificationMessage: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: colors.neutral600,
    },
    notificationImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: colors.neutral200,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    clearButton: {
        marginHorizontal: 16,
        marginVertical: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.danger,
        alignItems: "center",
    },
    clearButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.danger,
    },
});
