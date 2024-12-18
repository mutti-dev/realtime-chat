import React from 'react';
import { useEffect, useLayoutEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View, Image, StyleSheet, Dimensions } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

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

    return (
        <View style={styles.tabBarContainer}>
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
                                color={isFocused ? theme.colors.primary : '#EEEEEE'}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
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
                            color="#EEEEEE"
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
        left: 20,
        right: 20,
        height: 70,
        backgroundColor: '#463E3F',
        borderRadius: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
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
});

export default HomeScreen;
