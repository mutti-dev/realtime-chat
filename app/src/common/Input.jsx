import { View, Text, TextInput } from "react-native";
import { useTheme } from "react-native-paper";

function Input({ title, value, error, setValue, setError, secureTextEntry = false }) {
	const theme = useTheme();
	return (
		<View style={{ marginBottom: 16 }}>
			<Text
				style={{
					color: error ? theme.colors.error : theme.colors.text,
					marginBottom: 4,
					fontSize: 14,
					fontWeight: '600',
					paddingLeft: 8,
				}}
			>
				{error ? error : title}
			</Text>
			<TextInput
				editable
				autoCapitalize="none"
				autoComplete="off"
				placeholder={title}
				placeholderTextColor={theme.colors.placeholder}
				onChangeText={(text) => {
					setValue(text);
					if (error) {
						setError('');
					}
				}}
				secureTextEntry={secureTextEntry}
				style={{
					backgroundColor: theme.colors.background, // Set background color to light color in the scheme
					borderWidth: 1,
					borderColor: error ? theme.colors.error : theme.colors.secondary,
					borderRadius: 12,
					height: 48,
					paddingHorizontal: 16,
					fontSize: 16,
					shadowColor: error ? theme.colors.error : theme.colors.shadowColor, // Adjust shadow color to highlight errors
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 2,
					color: theme.colors.text, // Use the text color from the theme
				}}
				value={value}
			/>
		</View>
	);
}

export default Input;
