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
        <View >
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary]}
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
                                    color={isFocused ? "black": '#2E5077'}
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

    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={({ route }) => ({
                headerLeft: () => (
                    <View style={{ marginLeft: 16 }}>
                        <Thumbnail
                            url={user.thumbnail}
                            size={28}
                        />
                    </View>
                ),
                headerRight: () => (
                    <TouchableOpacity onPress={onSearch}>
                        <FontAwesomeIcon
                            style={{ marginRight: 16 }}
                            icon='magnifying-glass'
                            size={22}
                            color={theme.colors.primary}
                        />
                    </TouchableOpacity>
                ),
                tabBarStyle: { display: 'none' },
            })}
        >
            <Tab.Screen name="Friends" component={FriendsScreen} />
            <Tab.Screen name="Requests" component={RequestsScreen} />
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
        borderTopLeftRadius: 40, // Radius for the top-left corner
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
        shadowColor: '#F29F58',
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