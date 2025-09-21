import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { useLayoutEffect, useState, useEffect } from "react"
import { View, Text, Image, TouchableOpacity, ScrollView, Animated, Alert } from "react-native"
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import useGlobal from "../core/global"
import utils from "../core/utils"
import Thumbnail from "../common/Thumbnail"
import { useTheme } from "react-native-paper";
import CustomLoader from "../common/CustomLoader"
import { LinearGradient } from 'expo-linear-gradient';
import Input from "../common/Input";
import Button from "../common/Button"; // assume you have a simple Button component, otherwise TouchableOpacity below


function ProfileImage() {
	const theme = useTheme();
	const uploadThumbnail = useGlobal(state => state.uploadThumbnail)
	const user = useGlobal(state => state.user)

	return (
		<TouchableOpacity
			style={{
				marginBottom: 24,
				shadowColor: theme.colors.text,
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.3,
				shadowRadius: 16,
				elevation: 12,
			}}
			onPress={async () => {
				const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (status !== 'granted') {
					alert('Permission to access media library is required!');
					return;
				}

				const result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.All,
					allowsEditing: true,
					quality: 1,
					base64: false, // avoid huge base64 from picker
				});

				if (result.canceled) return;

				if (result.assets && result.assets.length > 0) {
					const asset = result.assets[0];
					try {
						// Resize/compress client-side to reduce payload & memory pressure
						const manipResult = await ImageManipulator.manipulateAsync(
							asset.uri,
							[{ resize: { width: Math.min(asset.width || 1024, 1024) } }],
							{ compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
						);

						const uploadFile = {
							name: asset.fileName || asset.uri.split('/').pop(),
							type: 'image/jpeg',
							base64: manipResult.base64 || null,
							uri: manipResult.uri,
						};
						uploadThumbnail && uploadThumbnail(uploadFile);
					} catch (err) {
						// fallback: send original small payload if base64 unavailable
						const uploadFile = {
							name: asset.fileName || asset.uri.split('/').pop(),
							type: asset.type || 'image',
							base64: null,
							uri: asset.uri,
						};
						uploadThumbnail && uploadThumbnail(uploadFile);
					}
				}
			}}
			activeOpacity={0.8}
		>
			<View style={{
				borderRadius: 90,
				borderWidth: 4,
				borderColor: 'rgba(255, 255, 255, 0.3)',
				padding: 4,
			}}>
				<Thumbnail
					url={user.thumbnail}
					size={160}
				/>
			</View>

			<View style={{
				position: 'absolute',
				bottom: 8,
				right: 8,
				width: 44,
				height: 44,
				borderRadius: 22,
				alignItems: 'center',
				justifyContent: 'center',
				borderWidth: 3,
				borderColor: 'white',
				shadowColor: '#667eea',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.3,
				shadowRadius: 8,
				elevation: 6,
			}}>
				<LinearGradient
					colors={['#667eea', '#764ba2']}
					style={{
						width: 44,
						height: 44,
						borderRadius: 22,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<FontAwesomeIcon
						icon='pencil'
						size={16}
						color="white"
					/>
				</LinearGradient>
			</View>
		</TouchableOpacity>
	)
}

function ProfileStats() {

	const user = useGlobal(state => state.user)
	const theme = useTheme();
	const friendList = useGlobal((state) => state.friendList);

	return (
		<View style={{
			flexDirection: 'row',
			backgroundColor: theme.colors.level3,
			borderRadius: 20,
			padding: 20,
			marginHorizontal: 100,
			marginBottom: 32,
			borderWidth: 1,
			borderColor: theme.colors.border,
		}}>
			<View style={{ flex: 1, alignItems: 'center' }}>
				<Text style={{
					fontSize: 24,
					fontWeight: '800',
					color: theme.colors.title,
					marginBottom: 4,
				}}>
					{friendList?.length || "loading..."}
				</Text>
				<Text style={{
					fontSize: 14,
					fontWeight: '500',
					color: theme.colors.text,
				}}>
					Total Chats
				</Text>
			</View>


		</View>
	)
}



function ProfileScreen() {
	const theme = useTheme();
	const user = useGlobal(state => state.user);
	const updateUser = useGlobal(state => state.updateUser);

	// keep local editable fields in sync with global user
	const [name, setName] = useState(user?.name || '');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);

	// sync when user changes in store (e.g. after uploadThumbnail)
	useEffect(() => {
		setName(user?.name || '');
	}, [user?.name]);

	const onSave = async () => {
		// Validate
		if (password && password.length < 6) {
			Alert.alert('Validation', 'Password must be at least 6 characters');
			return;
		}
		if (password && password !== confirmPassword) {
			Alert.alert('Validation', 'Passwords do not match');
			return;
		}

		// Build payload - split name into first_name/last_name
		const payload = {};
		const newName = (name || '').trim();
		if (newName !== (user?.name || '').trim()) {
			const parts = newName.split(' ', 2);
			payload.first_name = parts[0] || '';
			payload.last_name = parts[1] || '';
		}
		if (password) {
			payload.password = password;
		}

		if (Object.keys(payload).length === 0) {
			Alert.alert('No changes', 'Nothing to update');
			return;
		}

		setLoading(true);
		try {
			const updated = await updateUser(payload);
			setPassword('');
			setConfirmPassword('');
			Alert.alert('Saved', 'Profile updated successfully');
		} catch (err) {
			console.log('update error', err);
			Alert.alert('Error', 'Failed to update profile');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<LinearGradient
				colors={[theme.colors.background, theme.colors.background]}
				style={{ flex: 1 }}
			>
				<View style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center'
				}}>
					<CustomLoader />
				</View>
			</LinearGradient>
		)
	}

	return (
		<LinearGradient
			colors={[theme.colors.background, theme.colors.background]}
			style={{ flex: 1 }}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingTop: 40,
					paddingBottom: 120,
				}}
			>
				<View style={{
					alignItems: 'center',
					paddingTop: 20,
				}}>
					<ProfileImage />

					<View style={{ alignItems: 'center', marginBottom: 32 }}>
						<Text style={{
							textAlign: 'center',
							color: theme.colors.title,
							fontSize: 28,
							fontWeight: '800',
							marginBottom: 8,
							letterSpacing: 0.5,
						}}>
							{user.name}
						</Text>
						<Text style={{
							textAlign: 'center',
							color: theme.colors.placeholder,
							fontSize: 16,
							fontWeight: '500',
							letterSpacing: 0.3,
						}}>
							@{user.username}
						</Text>

					</View>


				</View>

				<ProfileStats />

				<View style={{ marginHorizontal: 20, marginTop: 8 }}>
					<Input
						title='Name'
						value={name}
						setValue={setName}
					/>
					<Input
						title='New Password'
						value={password}
						setValue={setPassword}
						secureTextEntry={true}
					/>
					<Input
						title='Confirm Password'
						value={confirmPassword}
						setValue={setConfirmPassword}
						secureTextEntry={true}
					/>

					<TouchableOpacity
						onPress={onSave}
						style={{
							marginTop: 16,
							backgroundColor: '#667eea',
							paddingVertical: 14,
							borderRadius: 12,
							alignItems: 'center',
						}}
						activeOpacity={0.8}
					>
						<Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>
					</TouchableOpacity>
				</View>

			</ScrollView>
		</LinearGradient>
	)
}

export default ProfileScreen