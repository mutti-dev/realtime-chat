import { useEffect, useLayoutEffect } from "react";
import {
	Animated,
	SafeAreaView,
	StatusBar,
	Text,
	View,
	Image
} from "react-native";
import LinearGradient from "react-native-linear-gradient"; // Install this library if not already installed
import Title from "../common/Title";

function SplashScreen({ navigation }) {
	// Hide the header
	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: false,
		});
	}, []);

	// Animation values
	const translateY = new Animated.Value(0);
	const rotate = new Animated.Value(0);
	const scale = new Animated.Value(1);
	const duration = 800;

	// Create looping animation
	useEffect(() => {
		Animated.loop(
			Animated.parallel([
				Animated.sequence([
					Animated.timing(translateY, {
						toValue: -20,
						duration: duration,
						useNativeDriver: true,
					}),
					Animated.timing(translateY, {
						toValue: 0,
						duration: duration,
						useNativeDriver: true,
					}),
				]),
				Animated.sequence([
					Animated.timing(scale, {
						toValue: 1.2,
						duration: duration / 2,
						useNativeDriver: true,
					}),
					Animated.timing(scale, {
						toValue: 1,
						duration: duration / 2,
						useNativeDriver: true,
					}),
				]),
				Animated.timing(rotate, {
					toValue: 1,
					duration: duration * 2,
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);

	const rotateInterpolate = rotate.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "360deg"],
	});

	return (
		<LinearGradient
			colors={["#09203F", "#537895"]}
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<StatusBar barStyle="light-content" />

			{/* Animated Icon */}
			<Animated.View
				style={{
					transform: [
						{ translateY },
						{ rotate: rotateInterpolate },
						{ scale },
					],
				}}
			>
				<Image
					source={require("../assets/icon.png")}
					style={{
						width: 150,
						height: 100,
						borderRadius: 40,
						// backgroundColor: "#fff",
						padding: 10,
					}}
				/>
			</Animated.View>

			{/* App Title */}
			<Title text="Chat App" color="white" />
			<Text style={{

				textAlign: 'center',
				fontSize: 15,
				fontFamily: 'LeckerliOne-Regular',
				marginTop: 50
			}}>Please Wait.....</Text>
		</LinearGradient>
	);
}

export default SplashScreen;
