import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { useLayoutEffect, useState } from "react"
import { View, Text, Image, TouchableOpacity } from "react-native"
import * as ImagePicker from 'expo-image-picker'
import useGlobal from "../core/global"
import utils from "../core/utils"
import Thumbnail from "../common/Thumbnail"
import { useTheme } from "react-native-paper";
import CustomLoader from "../common/CustomLoader"
import { LinearGradient } from 'expo-linear-gradient';




function ProfileImage() {
	const theme = useTheme();
	const uploadThumbnail = useGlobal(state => state.uploadThumbnail)
	const user = useGlobal(state => state.user)

	return (


		<TouchableOpacity
			style={{ marginBottom: 20 }}
			onPress={async () => {
				// Request permission
				const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (status !== 'granted') {
					alert('Permission to access media library is required!');
					return;
				}

				// Launch image picker
				const result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					quality: 1,
					base64: true, // optional: include base64 if uploadThumbnail needs it
				});

				if (result.canceled) return;

				if (result.assets && result.assets.length > 0) {
					const file = result.assets[0];
					// Construct a file object similar to the old picker
					const uploadFile = {
						name: file.fileName || file.uri.split('/').pop(),
						type: file.type || 'image',
						data: file.base64 || null,
						uri: file.uri,
					};
					uploadThumbnail(uploadFile);
				}
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
				backgroundColor: theme.colors.primary,
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
	const theme = useTheme();
	const user = useGlobal(state => state.user)
	const [loading, setLoading] = useState(false);

	return (
		<LinearGradient
			colors={[theme.colors.background, theme.colors.background]}
			style={{
				flex: 1,

			}}
		>
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