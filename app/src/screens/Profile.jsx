import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { useLayoutEffect, useState } from "react"
import { View, Text, Image, TouchableOpacity, ScrollView, Animated } from "react-native"
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
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
					mediaTypes: ImagePicker.MediaType.Images,
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

	return (
		<View style={{
			flexDirection: 'row',
			backgroundColor: theme.colors.level3,
			borderRadius: 20,
			padding: 20,
			marginHorizontal: 32,
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
					42
				</Text>
				<Text style={{
					fontSize: 14,
					fontWeight: '500',
					color: theme.colors.text,
				}}>
					Friends
				</Text>
			</View>
			<View style={{
				width: 1,
				backgroundColor: theme.colors.level3,
				marginHorizontal: 16,
			}} />
			<View style={{ flex: 1, alignItems: 'center' }}>
				<Text style={{
					fontSize: 24,
					fontWeight: '800',
					color: theme.colors.title,
					marginBottom: 4,
				}}>
					128
				</Text>
				<Text style={{
					fontSize: 14,
					fontWeight: '500',
					color: theme.colors.text,
				}}>
					Messages
				</Text>
			</View>
		</View>
	)
}

function ProfileOptions() {

	const navigation = useNavigation();
	const theme = useTheme();
	const options = [
		{ icon: 'cog', label: 'Settings', action: () => { } },
		{ icon: 'bell', label: 'Notifications', action: () => { navigation.navigate("Notifications") } },
		{ icon: 'shield', label: 'Privacy', action: () => { } },
		{ icon: 'question-circle', label: 'Help & Support', action: () => { } },
	];

	// hook gives access to navigation

	return (
		<View style={{
			marginHorizontal: 32,
			marginBottom: 32,
		}}>
			{options.map((option, index) => (
				<TouchableOpacity
					key={option.label}
					onPress={option.action}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: theme.colors.level3,
						borderRadius: 16,
						padding: 16,
						marginBottom: 12,
						borderWidth: 1,
						borderColor: theme.colors.border,
					}}
					activeOpacity={0.7}
				>
					<View style={{
						width: 40,
						height: 40,
						borderRadius: 20,
						// backgroundColor: theme.colors.background,
						alignItems: 'center',
						justifyContent: 'center',
						marginRight: 16,
					}}>
						<FontAwesomeIcon
							icon={option.icon}
							size={18}
							color={theme.colors.title}
						/>
					</View>
					<Text style={{
						fontSize: 16,
						fontWeight: '600',
						color: theme.colors.text,
						flex: 1,
					}}>
						{option.label}
					</Text>
					<FontAwesomeIcon
						icon='chevron-right'
						size={14}
						color={theme.colors.primary}
					/>
				</TouchableOpacity>
			))}
		</View>
	)
}

function ProfileLogout() {
	const logout = useGlobal(state => state.logout)
	const theme = useTheme();

	return (
		<View style={{ paddingHorizontal: 32 }}>
			<TouchableOpacity
				onPress={logout}
				style={{
					height: 56,
					borderRadius: 28,
					alignItems: 'center',
					justifyContent: 'center',
					marginBottom: 20,
					borderWidth: 2,
					borderColor: theme.colors.border,
					backgroundColor: theme.colors.level3,
				}}
				activeOpacity={0.8}
			>
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
				}}>
					<FontAwesomeIcon
						icon='right-from-bracket'
						size={20}
						color={theme.colors.text}
						style={{ marginRight: 12 }}
					/>
					<Text style={{
						fontWeight: '700',
						color: theme.colors.text,
						fontSize: 16,
						letterSpacing: 0.5,
					}}>
						Sign Out
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	)
}

function ProfileScreen() {
	const theme = useTheme();
	const user = useGlobal(state => state.user);

	const [loading, setLoading] = useState(false);

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
						{/* <View style={{
							backgroundColor: 'rgba(255, 255, 255, 0.15)',
							paddingHorizontal: 16,
							paddingVertical: 8,
							borderRadius: 20,
							marginTop: 16,
							borderWidth: 1,
							borderColor: 'rgba(255, 255, 255, 0.2)',
						}}>

							<Text
								style={{
									color: theme.colors.text,
									fontSize: 14,
									fontWeight: '600',
								}}
							>
								{user?.is_online
									? "🟢 Online"
									: user?.last_online
										? `Last seen ${new Date(user.last_online).toLocaleString()}`
										: "Offline"}
							</Text>
						</View> */}
					</View>
				</View>

				<ProfileStats />
				{/* <ProfileOptions /> */}
				{/* <ProfileLogout /> */}
			</ScrollView>
		</LinearGradient>
	)
}

export default ProfileScreen