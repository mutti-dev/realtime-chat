import { useLayoutEffect, useState, useEffect } from "react"
import {
	Keyboard,
	KeyboardAvoidingView,
	SafeAreaView,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
	Animated,
	Image
} from "react-native"
import Title from "../common/Title"
import Input from "../common/Input"
import Button from "../common/Button"
import api from "../core/api"
import useGlobal from "../core/global"
import { useTheme } from "react-native-paper"
import CustomLoader from "../common/CustomLoader"
import LinearGradient from "react-native-linear-gradient";

function SignInScreen({ navigation }) {
	const [loading, setLoading] = useState(false);
	const theme = useTheme();
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	const [usernameError, setUsernameError] = useState('')
	const [passwordError, setPasswordError] = useState('')

	const login = useGlobal(state => state.login)

	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: false
		})
	}, [])

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
						toValue: 2,
						duration: duration / 2,
						useNativeDriver: true,
					}),
				]),
				Animated.timing(rotate, {
					toValue: 0,
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

	function onSignIn() {
		console.log('onSignIn:', username, password);
		setLoading(true);

		// Check for missing username and password
		const failUsername = !username;
		const failPassword = !password;

		if (failUsername) {
			setUsernameError('Username not provided');
		}
		if (failPassword) {
			setPasswordError('Password not provided');
		}

		// Exit if there are errors
		if (failUsername || failPassword) {
			setLoading(false); // Ensure loading state is reset
			return;
		}

		// Make sign-in request
		api({
			method: 'POST',
			url: '/chat/signin/',
			data: {
				username,
				password,
			},
		})
			.then((response) => {
				console.log('Sign In Success:', response.data);

				const credentials = {
					username,
					password,
				};

				login(
					credentials,
					response.data.user,
					response.data.tokens
				);
			})
			.catch((error) => {
				if (error.response) {
					console.error('Response Error:', error.response.data);
					console.error('Status:', error.response.status);
					console.error('Headers:', error.response.headers);
				} else if (error.request) {
					console.error('Request Error:', error.request);
				} else {
					console.error('Error:', error.message);
				}
				console.error('Config:', error.config);
			})
			.finally(() => {
				setLoading(false); // Reset loading state
			});
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<LinearGradient
				colors={[theme.colors.background, theme.colors.card]} // Gradient background for light theme
				style={{
					flex: 1,
				}}
			>
				<KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View
							style={{
								flex: 1,
								justifyContent: 'center',
								paddingHorizontal: 20
							}}
						>
							<Title text='Sign In' color={theme.colors.text} />

							{loading && <CustomLoader message="Signing in, please wait..." />}

							<Input
								title='Username'
								value={username}
								error={usernameError}
								setValue={setUsername}
								setError={setUsernameError}
							/>

							<Input
								title='Password'
								value={password}
								error={passwordError}
								setValue={setPassword}
								setError={setPasswordError}
								secureTextEntry={true}
							/>

							<Button
								title='Sign In'
								onPress={onSignIn}
								style={{ backgroundColor: theme.colors.primary }} // Custom button color
							/>

							<Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.text }}>
								Don't have an account? 
								<Text
									style={{ color: theme.colors.primary }} // Sign Up link color
									onPress={() => navigation.navigate('SignUp')}
								>
									Sign Up
								</Text>
							</Text>

						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</LinearGradient>
		</SafeAreaView>
	)
}

export default SignInScreen
