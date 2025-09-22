import React, { useEffect, useState } from "react";


import "./src/core/fontawesome";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./src/screens/Splash";
import SignInScreen from "./src/screens/SignIn";
import SignUpScreen from "./src/screens/SignUp";
import HomeScreen from "./src/screens/Home";
import SearchScreen from "./src/screens/Search";
import MessagesScreen from "./src/screens/Message";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

  // Read themeMode from global store (null = follow system)
  const themeMode = useGlobal((state) => state.themeMode);
  const user = useGlobal((state) => state.user);

  // Decide theme: explicit user choice overrides system
  const theme = themeMode
    ? themeMode === "dark"
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
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme}>
          <StatusBar
            barStyle="light-content"
            translucent={true}
          />
          <Stack.Navigator>
            {!initialized ? (
              <>
                <Stack.Screen name="Splash" component={SplashScreen} />
              </>
            ) : !authenticated ? (
              <>
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen
                  name="Search"
                  component={SearchScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Messages" component={MessagesScreen} />
                <Stack.Screen
                  name="FriendProfile"
                  component={FriendProfile}
                  options={{ headerShown: false }}
                />

                <Stack.Screen name="Notifications" component={RequestsScreen} />
                <Stack.Screen name="AiChat" component={AIChatScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
