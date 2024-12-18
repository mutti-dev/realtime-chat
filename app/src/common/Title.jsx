import { Text } from "react-native"
import { useTheme } from "react-native-paper"
import { Consumer } from "react-native-paper/lib/typescript/core/settings"


function Title({ text, color }) {
	const theme = useTheme()

	return (
		<Text 
			style={{
				color: theme.colors.text,
				textAlign: 'center',
				fontSize: 48,
				fontFamily: 'LeckerliOne-Regular',
				marginBottom: 30
			}}
		>
			{text}
		</Text>
	)
}

export default Title