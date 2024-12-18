import React, { useEffect, useState } from 'react'
import {
  SafeAreaView, StatusBar, Text,
} from 'react-native'

import './src/core/fontawesome'

import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import SplashScreen from './src/screens/Splash'
import SignInScreen from './src/screens/SignIn'
import SignUpScreen from './src/screens/SignUp'
import HomeScreen from './src/screens/Home'
import SearchScreen from './src/screens/Search'
import MessagesScreen from './src/screens/Message'


import useGlobal from './src/core/global'

import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { useColorScheme } from "react-native";
import { LightScheme } from "./src/theme/LightScheme";
import { DarkScheme } from "./src/theme/DarkScheme";
import { PaperProvider } from "react-native-paper";
import AIChatScreen from './src/screens/AIChat';


const LightTheme = {
    ...MD3LightTheme,
    colors: LightScheme,
  };
  
  const DarkTheme = {
    ...MD3DarkTheme,
    colors: DarkScheme,
  };



const Stack = createNativeStackNavigator()


function App() {
	const colorScheme = useColorScheme();
    console.log("Color scheme detected:", colorScheme);
    const theme = colorScheme === "dark" ? DarkTheme : LightTheme;
    // const theme = DarkTheme;
	const initialized = useGlobal(state => state.initialized)
	const authenticated = useGlobal(state => state.authenticated)

	const init = useGlobal(state => state.init)

	useEffect(() => {
		init()
	}, [])

	return (
		<NavigationContainer theme={theme}>
			<StatusBar barStyle='transparent' />
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
						<Stack.Screen name="Search" component={SearchScreen} />
						<Stack.Screen name="Messages" component={MessagesScreen} />
						<Stack.Screen name="AiChat" component={AIChatScreen} />
					</>
				)}
    	</Stack.Navigator>
		</NavigationContainer>
	)
}


export default App
