import { useLayoutEffect, useState } from "react"
import { 
	Keyboard,
	KeyboardAvoidingView,
	SafeAreaView, 
	Text, 
	TextInput,
	TouchableOpacity, 
	TouchableWithoutFeedback, 
	View 
} from "react-native"
import Title from "../common/Title"
import Input from "../common/Input"
import Button from "../common/Button"
import api from "../core/api"
import utils from "../core/utils"
import useGlobal from "../core/global"
import { useTheme } from "react-native-paper"
import CustomLoader from "../common/CustomLoader"



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
			<KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View 
						style={{ 
							flex: 1, 
							justifyContent: 'center',
							paddingHorizontal: 20
						}}
					>
						<Title text='Chat' color={theme.colors.text} />
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
						/>

						<Text style={{ textAlign: 'center', marginTop: 40 }}>
							Don't have an account? <Text 
								style={{ color: 'blue' }}
								onPress={() => navigation.navigate('SignUp')}
							>
								Sign Up
							</Text>
						</Text>

					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

export default SignInScreen