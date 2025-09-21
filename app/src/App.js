import React, { useEffect, useState } from "react";
import { SafeAreaView, StatusBar, Text } from "react-native";


import "./src/core/fontawesome";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./src/screens/Splash";
import SignInScreen from "./src/screens/SignIn";
import SignUpScreen from "./src/screens/SignUp";
import HomeScreen from "./src/screens/Home";
import SearchScreen from "./src/screens/Search";
import MessagesScreen from "./src/screens/Message";

import useGlobal from "./src/core/global";

import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { useColorScheme } from "react-native";
import { LightScheme } from "./src/theme/LightScheme";
import { DarkScheme } from "./src/theme/DarkScheme";
import { PaperProvider } from "react-native-paper";
import AIChatScreen from "./src/screens/AIChat";
import RequestsScreen from "./src/screens/Requests";
import FriendProfile from "./src/screens/FriendProfile";

const LightTheme = {
  ...MD3LightTheme,
  colors: LightScheme,
};

const DarkTheme = {
  ...MD3DarkTheme,
  colors: DarkScheme,
};

const Stack = createNativeStackNavigator();

function App() {
  const colorScheme = useColorScheme();
  const globalTheme = useGlobal((state) => state.themeMode); // <-- read from global
  // If user has explicitly set a theme, use it; otherwise fall back to system
  const theme = globalTheme
    ? globalTheme === "dark"
      ? DarkTheme
      : LightTheme
    : colorScheme === "dark"
    ? DarkTheme
    : LightTheme;

  const initialized = useGlobal((state) => state.initialized);
  const authenticated = useGlobal((state) => state.authenticated);

  const init = useGlobal((state) => state.init);

  useEffect(() => {
    init();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <NavigationContainer theme={theme}>
          <StatusBar
            barStyle={theme.dark ? "light-content" : "dark-content"}
            backgroundColor="transparent"
          />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!initialized ? (
              // Show splash screen while initializing
              <Stack.Screen name="Splash" component={SplashScreen} />
            ) : !authenticated ? (

              <>
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
              </>
            ) : (

              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="Messages" component={MessagesScreen} />
                <Stack.Screen name="AIChat" component={AIChatScreen} />
                <Stack.Screen name="Requests" component={RequestsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default App;
