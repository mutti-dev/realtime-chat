import { TouchableOpacity, Text } from "react-native"
import { useTheme } from "react-native-paper"



function Button({ title, onPress }) {
	const theme = useTheme()
	return (
		<TouchableOpacity
			style={{
				backgroundColor: theme.colors.tertiary,
				height: 52,
				borderRadius: 26,
				alignItems: 'center',
				justifyContent: 'center',
				marginTop: 20
			}}
			onPress={onPress}
		>
			<Text 
				style={{ 
					color: 'white',
					fontSize: 16,
					fontWeight: 'bold'
				}}
			>
				{title}
			</Text>
		</TouchableOpacity>
	)
}


export default Button