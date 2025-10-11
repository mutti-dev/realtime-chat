import React, { useCallback } from "react";
import {
    SafeAreaView,
    View,
    Text,
    Switch,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
    faShield,
    faQuestionCircle,
    faChevronRight,
    faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import useGlobal from "../store";

// --------------------------------------------
//   Sub-components
// --------------------------------------------

function ProfileOptions() {
    const navigation = useNavigation();
    const theme = useTheme();

    const options = [
        { icon: faShield, label: "Privacy", action: () => { } },
        { icon: faQuestionCircle, label: "Help & Support", action: () => { } },
    ];

    return (
        <View style={{ marginHorizontal: 20, marginTop: 30, marginBottom: 20 }}>
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.colors.title,
                    marginBottom: 16,
                    marginLeft: 8,
                }}
            >
                Account
            </Text>

            {options.map((option) => (
                <TouchableOpacity
                    key={option.label}
                    onPress={option.action}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.colors.level3,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                    activeOpacity={0.7}
                >
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.primary + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={option.icon}
                            size={18}
                            color={theme.colors.primary}
                        />
                    </View>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: theme.colors.text,
                            flex: 1,
                        }}
                    >
                        {option.label}
                    </Text>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        size={14}
                        color={theme.colors.primary}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

function ProfileLogout() {
    const logout = useGlobal((state) => state.logout);
    const theme = useTheme();

    return (
        <View style={{ paddingHorizontal: 20, marginTop: 10, marginBottom: 40 }}>
            <TouchableOpacity
                onPress={logout}
                style={{
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: theme.colors.error,
                    backgroundColor: theme.colors.level3,
                }}
                activeOpacity={0.8}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <FontAwesomeIcon
                        icon={faRightFromBracket}
                        size={20}
                        color={theme.colors.error}
                        style={{ marginRight: 12 }}
                    />
                    <Text
                        style={{
                            fontWeight: "700",
                            color: theme.colors.error,
                            fontSize: 16,
                            letterSpacing: 0.5,
                        }}
                    >
                        Sign Out
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

// --------------------------------------------
//   Main Screen
// --------------------------------------------
function SettingsScreen() {
    const theme = useTheme();
    const styles = getStyles(theme);

    const themeMode = useGlobal((state) => state.themeMode);
    const notificationsEnabled = useGlobal(
        (state) => state.notificationsEnabled
    );
    const updateUser = useGlobal((state) => state.updateUser);
    const user = useGlobal((state) => state.user);

 
    const onToggleTheme = useCallback(() => {
        const newTheme = themeMode === "dark" ? "light" : "dark";
        updateUser({ theme: newTheme });
    }, [themeMode]);


    const onToggleNotifications = useCallback(() => {
        updateUser({ notifications_enabled: !notificationsEnabled });
    }, [notificationsEnabled]);

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.background]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingTop: 40,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: theme.colors.level3,
                            borderRadius: 16,
                            marginHorizontal: 20,
                            marginBottom: 30,
                            padding: 8,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}
                    >
                        {/* Theme Switch */}
                        <View
                            style={[
                                styles.row,
                                { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                            ]}
                        >
                            <Text style={styles.label}>Dark Mode</Text>
                            <Switch
                                value={themeMode === "dark"}
                                onValueChange={onToggleTheme}
                                thumbColor={
                                    themeMode === "dark" ? theme.colors.primary : "#f4f3f4"
                                }
                                trackColor={{
                                    false: "#ccc",
                                    true: theme.colors.primary + "80",
                                }}
                            />
                        </View>

                        {/* Notification Switch */}
                        <View style={styles.row}>
                            <Text style={styles.label}>Notifications</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={onToggleNotifications}
                                thumbColor={
                                    notificationsEnabled
                                        ? theme.colors.primary
                                        : "#f4f3f4"
                                }
                                trackColor={{
                                    false: "#ccc",
                                    true: theme.colors.primary + "80",
                                }}
                            />
                        </View>
                    </View>

                    <ProfileOptions />
                    <ProfileLogout />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}


function getStyles(theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        safeArea: {
            flex: 1,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.title,
            marginBottom: 20,
            marginTop: 10,
            marginHorizontal: 20,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 16,
        },
        label: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.colors.text,
        },
    });
}

export default SettingsScreen;