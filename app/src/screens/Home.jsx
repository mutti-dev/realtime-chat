import React from 'react';
import { useEffect, useLayoutEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { LinearGradient } from 'expo-linear-gradient';

import RequestsScreen from "./Requests";
import FriendsScreen from "./Friends";
import ProfileScreen from "./Profile";
import useGlobal from "../core/global";
import Thumbnail from "../common/Thumbnail";
import { useTheme } from "react-native-paper";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }) {
    const theme = useTheme();
    const styles = getStyles(theme);

    return (
        <View style={styles.tabBarWrapper}>
            <View style={styles.tabBarContainer}>
                <LinearGradient
                    colors={[styles.tabBarGradient.backgroundColor, styles.tabBarGradient.backgroundColor]}
                    style={styles.tabBarGradient}
                >
                    <View style={styles.tabBar}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const iconConfig = {
                                Requests: { icon: 'bell', label: 'Requests' },
                                Friends: { icon: 'comment', label: 'Messages' },
                                Profile: { icon: 'user', label: 'Profile' },
                            };

                            const config = iconConfig[route.name];

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    onPress={onPress}
                                    style={styles.tabButton}
                                    activeOpacity={0.7}
                                >
                                    {isFocused && (
                                        <View style={styles.activeIndicator}>
                                            <LinearGradient
                                                colors={['#667eea', '#764ba2']}
                                                style={styles.activeIndicatorGradient}
                                            />
                                        </View>
                                    )}

                                    <View style={[
                                        styles.iconContainer,
                                        isFocused && styles.iconContainerActive
                                    ]}>
                                        <FontAwesomeIcon
                                            icon={config.icon}
                                            size={isFocused ? 22 : 20}
                                            color={isFocused ? '#667eea' : '#999'}
                                        />
                                    </View>

                                    <Text style={[
                                        styles.tabLabel,
                                        isFocused && styles.tabLabelActive
                                    ]}>
                                        {config.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
}

function CustomHeader({ navigation, route }) {
    const theme = useTheme();
    const user = useGlobal(state => state.user);
    const styles = getStyles(theme);

    const getHeaderTitle = () => {
        switch (route.name) {
            case 'Friends':
                return 'Messages';
            case 'Requests':
                return 'Requests';
            case 'Profile':
                return 'Profile';
            default:
                return 'Messages';
        }
    };

    const onSearch = () => {
        navigation.navigate('Search');
    };

    return (
        <LinearGradient
            colors={[styles.headerContainer.backgroundColor, styles.headerContainer.backgroundColor]}
            style={styles.headerContainer}
        >
            <SafeAreaView>
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Thumbnail
                                url={user.thumbnail}
                                size={36}
                            />
                        </View>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>
                                {getHeaderTitle()}
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                Stay connected
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={onSearch}
                        style={styles.searchButton}
                        activeOpacity={0.7}
                    >
                        <FontAwesomeIcon
                            icon='magnifying-glass'
                            size={20}
                            color={theme.colors.title}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        style={styles.bellButton}
                        activeOpacity={0.7}
                    >
                        <FontAwesomeIcon
                            icon='bell'
                            size={20}
                            color={theme.colors.title}
                        />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

function HomeScreen({ navigation }) {
    const theme = useTheme();
    const socketConnect = useGlobal(state => state.socketConnect);
    const socketClose = useGlobal(state => state.socketClose);
    const user = useGlobal(state => state.user);
    const styles = getStyles(theme);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false
        });
    }, []);

    useEffect(() => {
        socketConnect();
        return () => {
            socketClose();
        };
    }, []);

    return (

        <SafeAreaView style={{ flex: 1 }}>
            <Tab.Navigator
                tabBar={props => <CustomTabBar {...props} />}
                screenOptions={({ route }) => ({
                    header: ({ navigation }) => (
                        <CustomHeader navigation={navigation} route={route} />
                    ),
                    tabBarStyle: { display: 'none' },
                })}
            >
                <Tab.Screen name="Friends" component={FriendsScreen} />
                {/* <Tab.Screen name="Requests" component={RequestsScreen} /> */}
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
        </SafeAreaView>
    );
}

function getStyles(theme) {
    return StyleSheet.create({
        // Loader Styles

        // Header Styles
        headerContainer: {
            backgroundColor: theme.colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 12,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        avatarContainer: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
        },
        headerTitleContainer: {
            marginLeft: 16,
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: theme.colors.title,
            letterSpacing: 0.3,
        },
        headerSubtitle: {
            fontSize: 13,
            color: theme.colors.text,
            fontWeight: '500',
            marginTop: 2,
        },
        searchButton: {
            width: 40,
            height: 40,
            backgroundColor: theme.colors.background,
            alignItems: 'center',
            justifyContent: 'center',
        },
        bellButton: {
            width: 40,
            height: 40,
            backgroundColor: theme.colors.background,
            alignItems: 'center',
            justifyContent: 'center',

        },

        // Tab Bar Styles
        tabBarWrapper: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
        },
        tabBarContainer: {
            marginHorizontal: 0,
            marginBottom: 0,
            borderRadius: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 15,
        },
        tabBarGradient: {
            backgroundColor: theme.colors.background,
            // borderRadius: 25,
            // borderWidth: 1,
            borderTopWidth: 1,
            borderTopColor: theme.colors.secondary,

        },
        tabBar: {
            flexDirection: 'row',
            paddingVertical: 2,
            paddingHorizontal: 8,
        },
        tabButton: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            position: 'relative',
        },
        activeIndicator: {
            position: 'absolute',
            top: 0,
            left: '25%',
            right: '25%',
            height: 3,
            borderRadius: 2,
            overflow: 'hidden',
        },
        activeIndicatorGradient: {
            flex: 1,
            borderRadius: 2,
        },
        iconContainer: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
            backgroundColor: 'transparent',
        },
        iconContainerActive: {
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            transform: [{ scale: 1.1 }],
        },
        tabLabel: {
            fontSize: 11,
            fontWeight: '600',
            color: '#999',
            letterSpacing: 0.2,
        },
        tabLabelActive: {
            color: '#667eea',
            fontWeight: '700',
        },
    });
}

export default HomeScreen;