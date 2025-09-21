import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { useEffect, useState } from "react"
import {
	FlatList,
	SafeAreaView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Animated,
	Dimensions
} from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import Icon from "react-native-vector-icons/FontAwesome";
import { useTheme } from "react-native-paper"
import Thumbnail from "../common/Thumbnail"
import useGlobal from "../core/global"
import { useNavigation } from "@react-navigation/native"
import BackButton from "../common/BackButton";



const { width } = Dimensions.get('window')

function SearchButton({ user }) {
	const [scale] = useState(new Animated.Value(1))

	const handlePressIn = () => {
		Animated.spring(scale, {
			toValue: 0.96,
			useNativeDriver: true,
		}).start()
	}

	const handlePressOut = () => {
		Animated.spring(scale, {
			toValue: 1,
			useNativeDriver: true,
		}).start()
	}

	// Connected state with premium styling
	if (user.status === 'connected') {
		return (
			<View
				style={{
					backgroundColor: '#10B981',
					paddingHorizontal: 16,
					paddingVertical: 8,
					borderRadius: 20,
					flexDirection: 'row',
					alignItems: 'center',
					shadowColor: '#10B981',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 8,
					elevation: 6,
				}}
			>
				<FontAwesomeIcon
					icon='circle-check'
					size={16}
					color='white'
					style={{ marginRight: 6 }}
				/>
				<Text
					style={{
						color: 'white',
						fontWeight: '600',
						fontSize: 14
					}}
				>
					Connected
				</Text>
			</View>
		)
	}

	const requestConnect = useGlobal(state => state.requestConnect)

	const data = {}

	switch (user.status) {
		case 'no-connection':
			data.text = 'Connect'
			data.disabled = false
			data.onPress = () => requestConnect(user.username)
			data.bgColor = '#6366F1'
			data.shadowColor = '#6366F1'
			break
		case 'pending-them':
			data.text = 'Pending'
			data.disabled = true
			data.onPress = () => { }
			data.bgColor = '#9CA3AF'
			data.shadowColor = '#9CA3AF'
			break
		case 'pending-me':
			data.text = 'Accept'
			data.disabled = false
			data.onPress = () => { }
			data.bgColor = '#F59E0B'
			data.shadowColor = '#F59E0B'
			break
		default:
			data.text = 'Connect'
			data.disabled = false
			data.onPress = () => { }
			data.bgColor = '#6366F1'
			data.shadowColor = '#6366F1'
			break
	}

	return (
		<Animated.View style={{ transform: [{ scale }] }}>
			<TouchableOpacity
				style={{
					backgroundColor: data.bgColor,
					paddingHorizontal: 20,
					paddingVertical: 10,
					borderRadius: 24,
					alignItems: 'center',
					justifyContent: 'center',
					shadowColor: data.disabled ? 'transparent' : data.shadowColor,
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 8,
					elevation: data.disabled ? 0 : 6,
					opacity: data.disabled ? 0.6 : 1,
				}}
				disabled={data.disabled}
				onPress={data.onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				activeOpacity={0.8}
			>
				<Text
					style={{
						color: 'white',
						fontWeight: '600',
						fontSize: 14
					}}
				>
					{data.text}
				</Text>
			</TouchableOpacity>
		</Animated.View>
	)
}

function SearchRow({ user, index }) {
	const [fadeAnim] = useState(new Animated.Value(0))
	const [slideAnim] = useState(new Animated.Value(30))

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				delay: index * 100,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 400,
				delay: index * 100,
				useNativeDriver: true,
			}),
		]).start()
	}, [])

	return (
		<Animated.View
			style={{
				opacity: fadeAnim,
				transform: [{ translateX: slideAnim }],
			}}
		>
			<View
				style={{
					backgroundColor: 'white',
					marginHorizontal: 16,
					marginVertical: 6,
					padding: 16,
					borderRadius: 16,
					flexDirection: 'row',
					alignItems: 'center',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 3,
				}}
			>
				<View
					style={{
						borderRadius: 42,
						padding: 2,
						backgroundColor: '#F3F4F6'
					}}
				>
					<Thumbnail
						url={user.thumbnail}
						size={64}
					/>
				</View>

				<View
					style={{
						flex: 1,
						paddingHorizontal: 16
					}}
				>
					<Text
						style={{
							fontWeight: '700',
							color: '#1F2937',
							fontSize: 16,
							marginBottom: 4
						}}
					>
						{user.name}
					</Text>
					<Text
						style={{
							color: '#6B7280',
							fontSize: 14,
							fontWeight: '500'
						}}
					>
						@{user.username}
					</Text>
				</View>

				<SearchButton user={user} />
			</View>
		</Animated.View>
	)
}

function SearchScreen() {
	const [query, setQuery] = useState('')
	const [inputFocused, setInputFocused] = useState(false)
	const navigation = useNavigation()
	const theme = useTheme();

	const searchList = useGlobal(state => state.searchList)
	const searchUsers = useGlobal(state => state.searchUsers)

	useEffect(() => {
		searchUsers(query)
	}, [query])

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			
			<LinearGradient
				colors={[theme.colors.background, theme.colors.primary]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{
					padding: 20,
					paddingBottom: 24,
				}}
			>
				<BackButton color={theme.colors.text} size={24} style={{ marginLeft: 10 }}/>
				<Text
					style={{
						fontSize: 28,
						fontWeight: '800',
						color: 'white',
						marginBottom: 16,
						textAlign: 'center'
					}}
				>
					Find Friends
				</Text>


				<View
					style={{
						backgroundColor: 'white',
						borderRadius: 24,
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 20,
						height: 56,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.1,
						shadowRadius: 12,
						elevation: 8,
						borderWidth: inputFocused ? 2 : 0,
						borderColor: inputFocused ? '#6366F1' : 'transparent',
					}}
				>
					<FontAwesomeIcon
						icon='magnifying-glass'
						size={20}
						color={inputFocused ? theme.colors.primary : '#9CA3AF'}
						style={{ marginRight: 12 }}
					/>
					<TextInput
						style={{
							flex: 1,
							fontSize: 16,
							color: '#1F2937',
							fontWeight: '500'
						}}
						value={query}
						onChangeText={setQuery}
						onFocus={() => setInputFocused(true)}
						onBlur={() => setInputFocused(false)}
						placeholder='Search for friends...'
						placeholderTextColor='#9CA3AF'
					/>
					{query.length > 0 && (
						<TouchableOpacity
							onPress={() => setQuery('')}
							style={{
								backgroundColor: theme.colors.background,
								borderRadius: 12,
								padding: 6
							}}
						>
							<FontAwesomeIcon
								icon='xmark'
								size={14}
								color='#6B7280'
							/>
						</TouchableOpacity>
					)}
				</View>
			</LinearGradient>

			{/* Results Section */}
			<View style={{ flex: 1, paddingTop: 16 }}>
				{searchList === null ? (
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
						<View
							style={{
								backgroundColor: '#EEF2FF',
								borderRadius: 32,
								padding: 24,
								marginBottom: 24
							}}
						>
							<FontAwesomeIcon
								icon='magnifying-glass'
								size={48}
								color='#6366F1'
							/>
						</View>
						<Text
							style={{
								fontSize: 20,
								fontWeight: '700',
								color: '#1F2937',
								marginBottom: 8,
								textAlign: 'center'
							}}
						>
							Discover People
						</Text>
						<Text
							style={{
								fontSize: 16,
								color: '#6B7280',
								textAlign: 'center',
								lineHeight: 24
							}}
						>
							Start typing to search for friends and connect with new people
						</Text>
					</View>
				) : searchList.length === 0 ? (
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
						<View
							style={{
								backgroundColor: '#FEF3C7',
								borderRadius: 32,
								padding: 24,
								marginBottom: 24
							}}
						>
							<FontAwesomeIcon
								icon='face-frown'
								size={48}
								color='#F59E0B'
							/>
						</View>
						<Text
							style={{
								fontSize: 20,
								fontWeight: '700',
								color: '#1F2937',
								marginBottom: 8,
								textAlign: 'center'
							}}
						>
							No Results Found
						</Text>
						<Text
							style={{
								fontSize: 16,
								color: '#6B7280',
								textAlign: 'center',
								lineHeight: 24
							}}
						>
							No users found for "{query}". Try a different search term.
						</Text>
					</View>
				) : (
					<FlatList
						data={searchList}
						renderItem={({ item, index }) => (
							<SearchRow user={item} index={index} />
						)}
						keyExtractor={item => item.username}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							paddingBottom: 20
						}}
					/>
				)}
			</View>
		</SafeAreaView>
	)
}

export default SearchScreen