import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Switch,
    TextInput,
    Modal,
} from "react-native";
import { useStore, StoreState } from "../../store/useStore";
import { colors } from "@/app/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type SettingItemProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
};

const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
}) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.6 : 1}
    >
        <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={20} color={colors.accent} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <View style={styles.settingRight}>
            {rightElement}
            {showChevron && onPress && (
                <Ionicons name="chevron-forward" size={20} color={colors.neutral500} />
            )}
        </View>
    </TouchableOpacity>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen() {
    const user = useStore((s: StoreState) => s.user);
    const signOut = useStore((s: StoreState) => s.signOut);
    const clearPantry = useStore((s: StoreState) => s.clearPantry);
    const authLoading = useStore((s: StoreState) => s.authLoading);

    // Local state for toggles (in real app, these would be persisted in store)
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [biometricAuth, setBiometricAuth] = useState(false);

    // Modal states
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editName, setEditName] = useState(user?.name || "");
    const [editBio, setEditBio] = useState(user?.bio || "");

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (e: any) {
                            Alert.alert("Logout failed", e?.message || String(e));
                        }
                    },
                },
            ]
        );
    };

    const handleClearPantry = () => {
        Alert.alert(
            "Clear Pantry",
            "Are you sure you want to remove all items from your pantry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                        clearPantry();
                        Alert.alert("Success", "Your pantry has been cleared");
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Info", "Account deletion feature coming soon");
                    },
                },
            ]
        );
    };

    const handleSaveProfile = () => {
        // In real app, would update user in store/Firebase
        Alert.alert("Success", "Profile updated successfully");
        setShowEditProfile(false);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <SectionHeader title="ACCOUNT" />
                <View style={styles.section}>
                    <SettingItem
                        icon="person-outline"
                        title="Edit Profile"
                        subtitle={user?.email || "Update your profile information"}
                        onPress={() => setShowEditProfile(true)}
                    />
                    <SettingItem
                        icon="key-outline"
                        title="Change Password"
                        onPress={() => router.push("/screens/Settings/ChangePasswordScreen")}
                    />
                </View>

                {/* Preferences Section */}
                <SectionHeader title="PREFERENCES" />
                <View style={styles.section}>
                    <SettingItem
                        icon="restaurant-outline"
                        title="Dietary Preferences"
                        subtitle="Vegetarian, Vegan, Gluten-Free"
                        onPress={() => Alert.alert("Info", "Dietary preferences feature coming soon")}
                    />
                    <SettingItem
                        icon="nutrition-outline"
                        title="Nutrition Goals"
                        subtitle="Set your daily calorie and macro goals"
                        onPress={() => Alert.alert("Info", "Nutrition goals feature coming soon")}
                    />
                    <SettingItem
                        icon="basket-outline"
                        title="Clear Pantry"
                        subtitle="Remove all items from your pantry"
                        onPress={handleClearPantry}
                    />
                </View>

                {/* Notifications Section */}
                <SectionHeader title="NOTIFICATIONS" />
                <View style={styles.section}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        subtitle="Get notified about new recipes and updates"
                        rightElement={
                            <Switch
                                value={pushNotifications}
                                onValueChange={setPushNotifications}
                                trackColor={{ false: colors.neutral300, true: colors.accent }}
                                thumbColor={colors.white}
                            />
                        }
                        showChevron={false}
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Email Notifications"
                        subtitle="Receive weekly recipe recommendations"
                        rightElement={
                            <Switch
                                value={emailNotifications}
                                onValueChange={setEmailNotifications}
                                trackColor={{ false: colors.neutral300, true: colors.accent }}
                                thumbColor={colors.white}
                            />
                        }
                        showChevron={false}
                    />
                </View>

                {/* Security Section */}
                <SectionHeader title="SECURITY & PRIVACY" />
                <View style={styles.section}>
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        subtitle="Enable dark theme"
                        rightElement={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: colors.neutral300, true: colors.accent }}
                                thumbColor={colors.white}
                            />
                        }
                        showChevron={false}
                    />
                    <SettingItem
                        icon="finger-print-outline"
                        title="Biometric Authentication"
                        subtitle="Use fingerprint or face ID to login"
                        rightElement={
                            <Switch
                                value={biometricAuth}
                                onValueChange={setBiometricAuth}
                                trackColor={{ false: colors.neutral300, true: colors.accent }}
                                thumbColor={colors.white}
                            />
                        }
                        showChevron={false}
                    />
                    <SettingItem
                        icon="shield-outline"
                        title="Privacy Policy"
                        onPress={() => Alert.alert("Info", "Privacy policy feature coming soon")}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        onPress={() => Alert.alert("Info", "Terms of service feature coming soon")}
                    />
                </View>

                {/* Support Section */}
                <SectionHeader title="SUPPORT" />
                <View style={styles.section}>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help Center"
                        onPress={() => Alert.alert("Info", "Help center feature coming soon")}
                    />
                    <SettingItem
                        icon="chatbubble-outline"
                        title="Contact Support"
                        subtitle="Get help from our team"
                        onPress={() => Alert.alert("Info", "Contact support feature coming soon")}
                    />
                    <SettingItem
                        icon="star-outline"
                        title="Rate the App"
                        onPress={() => Alert.alert("Info", "Rate app feature coming soon")}
                    />
                    <SettingItem
                        icon="share-social-outline"
                        title="Share with Friends"
                        onPress={() => Alert.alert("Info", "Share feature coming soon")}
                    />
                </View>

                {/* About Section */}
                <SectionHeader title="ABOUT" />
                <View style={styles.section}>
                    <SettingItem
                        icon="information-circle-outline"
                        title="Version"
                        subtitle="1.0.0"
                        showChevron={false}
                    />
                    <SettingItem
                        icon="code-slash-outline"
                        title="Licenses"
                        onPress={() => Alert.alert("Info", "Open source licenses feature coming soon")}
                    />
                </View>

                {/* Danger Zone */}
                <SectionHeader title="DANGER ZONE" />
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={authLoading}>
                        <Ionicons name="log-out-outline" size={20} color={colors.white} />
                        <Text style={styles.logoutText}>
                            {authLoading ? "Logging out..." : "Logout"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <Ionicons name="trash-outline" size={20} color={colors.white} />
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditProfile}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditProfile(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.neutral500}
                        />

                        <Text style={styles.inputLabel}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editBio}
                            onChangeText={setEditBio}
                            placeholder="Tell us about yourself"
                            placeholderTextColor={colors.neutral500}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral50,
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
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.neutral600,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
        letterSpacing: 0.5,
    },
    section: {
        backgroundColor: colors.white,
        marginBottom: 1,
    },
    settingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.neutral200,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accentSubtle,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: colors.neutral600,
    },
    settingRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 8,
        gap: 8,
    },
    logoutText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.danger,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 16,
        gap: 8,
    },
    deleteText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: colors.neutral100,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    saveButton: {
        backgroundColor: colors.accent,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 24,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "600",
    },
});
