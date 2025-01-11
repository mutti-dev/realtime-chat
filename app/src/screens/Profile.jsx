import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { useLayoutEffect, useState } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native"
import { launchImageLibrary } from 'react-native-image-picker'
import useGlobal from "../core/global"
import utils from "../core/utils"
import Thumbnail from "../common/Thumbnail"
import { useTheme, Switch } from "react-native-paper";
import CustomLoader from "../common/CustomLoader"
import LinearGradient from "react-native-linear-gradient";





export const ToggleButton = ({ value, onValueChange, label = "Theme" }) => {
	const { colors } = useTheme();

	return (
		<View style={{
			backgroundColor: colors.background,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingVertical: 10,
			paddingHorizontal: 15,
			borderRadius: 8,
			elevation: 2,
			margin: 10,
		}}>
			<Text style={{
				color: colors.text,
				fontSize: 18,
				fontWeight: '600',
			}}>
				{label}
			</Text>
			<Switch
				value={value}
				onValueChange={onValueChange}
				color={colors.primary} // Primary color of your theme
			/>
		</View>
	);
};



function ProfileImage() {
	const theme = useTheme();
	const uploadThumbnail = useGlobal(state => state.uploadThumbnail)
	const user = useGlobal(state => state.user)

	return (
		<TouchableOpacity
			style={{ marginBottom: 20 }}
			onPress={() => {
				launchImageLibrary({ includeBase64: true }, (response) => {
					//utils.log('launchImageLibrary', response)
					if (response.didCancel) return
					const file = response.assets[0]
					uploadThumbnail(file)
				})
			}}
		>
			<Thumbnail
				url={user.thumbnail}
				size={180}
			/>
			<View
				style={{
					position: 'absolute',
					bottom: 0,
					right: 0,
					backgroundColor: theme.colors.background,
					width: 40,
					height: 40,
					borderRadius: 20,
					alignItems: 'center',
					justifyContent: 'center',
					borderWidth: 3,
					borderColor: 'white'
				}}
			>
				<FontAwesomeIcon
					icon='pencil'
					size={15}
					color={theme.colors.text}
				/>
			</View>
		</TouchableOpacity>
	)
}


function ProfileLogout() {
	const theme = useTheme();
	const logout = useGlobal(state => state.logout)

	return (

		<TouchableOpacity
			onPress={logout}
			style={{
				flexDirection: 'row',
				height: 52,
				borderRadius: 26,
				alignItems: 'center',
				justifyContent: 'center',
				paddingHorizontal: 26,
				backgroundColor: theme.colors.button,
				marginTop: 40
			}}
		>
			<FontAwesomeIcon
				icon='right-from-bracket'
				size={20}
				color="black"
				style={{ marginRight: 12 }}
			/>
			<Text
				style={{
					fontWeight: 'bold',
					color: "black"
				}}
			>
				Logout
			</Text>
		</TouchableOpacity>

	)
}



function ProfileScreen() {
	
	const [loading, setLoading] = useState(false);
	const [isDarkTheme, setIsDarkTheme] = useState(false);
	const theme = useTheme();
	const user = useGlobal(state => state.user);
	const themePreference = useGlobal(state => state.theme); // Get the current theme
	const setTheme = useGlobal(state => state.setTheme); // Function to update the theme globally


	return (
		<LinearGradient
			colors={[theme.colors.background, theme.colors.background]}
			style={{
				flex: 1,

			}}
		>

			<ToggleButton
				value={themePreference === "dark"}
				onValueChange={(isLight) => setTheme(isLight ? "light" : "dark")}
				label="Dark Mode"
			/>
			<View
				style={{
					flex: 1,
					alignItems: 'center',
					paddingTop: 100
				}}
			>

				<ProfileImage />

				<Text
					style={{
						textAlign: 'center',
						color: theme.colors.text,
						fontSize: 20,
						fontWeight: 'bold',
						marginBottom: 6
					}}
				>
					{user.name}
				</Text>
				<Text
					style={{
						textAlign: 'center',
						color: theme.colors.text,
						fontSize: 14
					}}
				>
					@{user.username}
				</Text>

				<ProfileLogout />



			</View>
		</LinearGradient>
	)
}

export default ProfileScreen