import React from 'react';
import { useEffect, useLayoutEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import RequestsScreen from "./Requests";
import FriendsScreen from "./Friends";
import ProfileScreen from "./Profile";
import useGlobal from "../core/global";
import Thumbnail from "../common/Thumbnail";
import { useTheme } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation }) {
    const theme = useTheme();

    return (
        <View>
            <LinearGradient
                colors={[theme.colors.background, theme.colors.card]} // Gradient using background and card colors
                style={styles.tabBarContainer}
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

                        const icon = {
                            Requests: 'bell',
                            Friends: 'inbox',
                            Profile: 'user',
                        }[route.name];

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                style={[styles.tabButton, isFocused && styles.tabButtonFocused]}
                            >
                                <FontAwesomeIcon
                                    icon={icon}
                                    size={isFocused ? 30 : 24}
                                    color={isFocused ? theme.colors.primary : theme.colors.text} // Updated color
                                    style={isFocused ? styles.focusedIcon : styles.defaultIcon}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>
        </View>
    );
}

function HomeScreen({ navigation }) {
    const theme = useTheme();
    const socketConnect = useGlobal(state => state.socketConnect);
    const socketClose = useGlobal(state => state.socketClose);
    const user = useGlobal(state => state.user);

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

    function onSearch() {
        navigation.navigate('Search');
    }

    function onRequests() {
        navigation.navigate('Requests'); // Navigates to RequestsScreen
    }

    function onProfile() {
        navigation.navigate('Profile'); // Navigates to ProfileScreen
    }

    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={({ route }) => ({
                headerLeft: () => (
                    <View style={{ marginLeft: 16 }}>
                        <TouchableOpacity onPress={onProfile}>
                            <Thumbnail
                                url={user.thumbnail}
                                size={36}
                            />
                        </TouchableOpacity>
                    </View>
                ),
                headerRight: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                        <TouchableOpacity onPress={onRequests}>
                            <FontAwesomeIcon
                                style={{ marginRight: 16 }}
                                icon='bell' // Notification bell icon
                                size={26}
                                color={theme.colors.primary} // Updated color
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSearch}>
                            <FontAwesomeIcon
                                icon='magnifying-glass'
                                size={26}
                                color={theme.colors.primary} // Updated color
                            />
                        </TouchableOpacity>
                    </View>
                ),
                tabBarStyle: { display: 'none' },
            })}
        >
            <Tab.Screen name="Friends" component={FriendsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.41,
        shadowRadius: 9.11,
        elevation: 14,
        paddingHorizontal: 20,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        flex: 1,
    },
    tabButton: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    tabButtonFocused: {
        transform: [{ scale: 1.1 }],
    },
    focusedIcon: {
        shadowColor: '#FFA726', // Highlighted icon shadow color (button color)
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    defaultIcon: {
        opacity: 0.7,
    },
});

export default HomeScreen;
