import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Modal, Animated, Easing, FlatList, InputAccessoryView, Keyboard, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Image } from "react-native"
import Thumbnail from "../common/Thumbnail"
import ShowImage from "../common/ShowImage"
import * as ImagePicker from 'expo-image-picker';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import useGlobal from "../core/global"
import { useTheme } from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import { ADDRESS } from "../core/api";
import { faTimes, faFile, faPaperPlane, faImage } from "@fortawesome/free-solid-svg-icons";

function MessageHeader({ friend }) {
	const user = useGlobal(state => state.user);
	const userStatuses = useGlobal(state => state.userStatuses);
	const status = userStatuses[friend.username];
	console.log('Status of', friend.username, status);
	console.log('UserStatuses:', userStatuses);
	const theme = useTheme();
	return (
		<View style={{
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 8,

		}}>
			<View style={{
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.2,
				shadowRadius: 2,
				elevation: 2,
			}}>
				<Thumbnail url={friend.thumbnail} size={36} />
			</View>
			<View style={{ marginLeft: 12 }}>
				<Text style={{
					color: theme.colors.title,
					fontSize: 18,
					fontWeight: '700',
					letterSpacing: 0.3,
				}}>
					{friend.name}
				</Text>
				<Text
					style={{
						color: theme.colors.text,
						fontSize: 12,
						fontWeight: '500',
						marginTop: 1,
					}}
				>
					{friend?.is_online
						? "Online"
						: friend?.last_online
							? `Last seen ${new Date(friend.last_online).toLocaleString()}`
							: "Offline"}
				</Text>
			</View>
		</View>
	)
}

function MessageBubbleMe({ text, file, onFilePress, isSending }) {
	const theme = useTheme();
	const openFile = () => {
		if (!file) return;
		onFilePress(file);
	};

	return (
		<View style={{ flexDirection: 'row', padding: 8, paddingRight: 16 }}>
			<View style={{ flex: 1 }} />
			<View style={{
				backgroundColor: theme.colors.primary,
				borderRadius: 20,
				borderBottomRightRadius: 4,
				maxWidth: '80%',
				paddingHorizontal: 16,
				paddingVertical: 12,
				marginLeft: 40,
				shadowColor: theme.colors.primary,
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.3,
				shadowRadius: 8,
				elevation: 5,
			}}>
				{file ? (
					<TouchableOpacity onPress={openFile} activeOpacity={0.8}>
						{isSending ? (
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={{ color: 'white', fontSize: 16, opacity: 0.8 }}>Sending</Text>
								<View style={{
									width: 4,
									height: 4,
									borderRadius: 2,
									backgroundColor: 'white',
									marginLeft: 8,
									opacity: 0.6,
								}} />
							</View>
						) : file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') ? (
							<View style={{
								borderRadius: 12,
								overflow: 'hidden',
							}}>
								<ShowImage url={file} size={200} />
							</View>
						) : (
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<FontAwesomeIcon icon={faFile} size={16} color="white" />
								<Text style={{ color: 'white', fontSize: 16, marginLeft: 8 }}>Document</Text>
							</View>
						)}
					</TouchableOpacity>
				) : (
					<Text style={{
						color: 'white',
						fontSize: 16,
						lineHeight: 20,
						fontWeight: '500',
					}}>
						{text}
					</Text>
				)}
				{isSending && (
					<View style={{
						position: 'absolute',
						bottom: -2,
						right: 8,
						width: 6,
						height: 6,
						borderRadius: 3,
						backgroundColor: 'rgba(255, 255, 255, 0.7)',
					}} />
				)}
			</View>
		</View>
	);
}

function MessageTypingAnimation({ offset }) {
	const y = useRef(new Animated.Value(0)).current

	useEffect(() => {
		const total = 1000
		const bump = 200

		const animation = Animated.loop(
			Animated.sequence([
				Animated.delay(bump * offset),
				Animated.timing(y, {
					toValue: 1,
					duration: bump,
					easing: Easing.linear,
					useNativeDriver: true
				}),
				Animated.timing(y, {
					toValue: 0,
					duration: bump,
					easing: Easing.linear,
					useNativeDriver: true
				}),
				Animated.delay(total - bump * 2 - bump * offset),
			])
		)
		animation.start()
		return () => {
			animation.stop()
		}
	}, [])

	const translateY = y.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -8]
	})

	return (
		<Animated.View style={{
			width: 8,
			height: 8,
			marginHorizontal: 1.5,
			borderRadius: 4,
			backgroundColor: '#999',
			transform: [{ translateY }]
		}} />
	)
}

function MessageBubbleFriend({ text = '', friend, typing = false, file, onFilePress }) {
	const openFile = () => {
		if (!file) return;
		onFilePress(file);
	};

	return (
		<View style={{ flexDirection: 'row', padding: 8, paddingLeft: 16 }}>
			<View style={{
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 2,
				elevation: 2,
			}}>
				<Thumbnail url={friend.thumbnail} size={36} />
			</View>
			<View style={{
				backgroundColor: 'rgba(255, 255, 255, 0.95)',
				borderRadius: 20,
				borderBottomLeftRadius: 4,
				maxWidth: '80%',
				paddingHorizontal: 16,
				paddingVertical: 12,
				marginLeft: 8,
				marginRight: 40,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
				elevation: 3,
			}}>
				{typing ? (
					<View style={{ flexDirection: 'row', paddingVertical: 4 }}>
						<MessageTypingAnimation offset={0} />
						<MessageTypingAnimation offset={1} />
						<MessageTypingAnimation offset={2} />
					</View>
				) : file ? (
					<TouchableOpacity onPress={openFile} activeOpacity={0.8}>
						{file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') ? (
							<View style={{
								borderRadius: 12,
								overflow: 'hidden',
							}}>
								<ShowImage url={file} size={200} />
							</View>
						) : (
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<FontAwesomeIcon icon={faFile} size={16} color="#666" />
								<Text style={{ color: '#333', fontSize: 16, marginLeft: 8 }}>Document</Text>
							</View>
						)}
					</TouchableOpacity>
				) : (
					<Text style={{
						color: '#333',
						fontSize: 16,
						lineHeight: 20,
						fontWeight: '500',
					}}>
						{text}
					</Text>
				)}
			</View>
		</View>
	);
}

const ImageVideoModal = ({ visible, mediaUrl, onClose }) => {
	return (
		<Modal
			transparent={true}
			visible={visible}
			animationType="fade"
			onRequestClose={onClose}
		>
			<View style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: 'rgba(0, 0, 0, 0.9)',
			}}>
				<TouchableOpacity
					style={{
						position: 'absolute',
						top: 60,
						right: 20,
						width: 44,
						height: 44,
						borderRadius: 22,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
					}}
					onPress={onClose}
				>
					<FontAwesomeIcon icon={faTimes} size={24} color="white" />
				</TouchableOpacity>

				<View style={{
					backgroundColor: 'transparent',
					borderRadius: 16,
					overflow: 'hidden',
					maxWidth: '90%',
					maxHeight: '80%',
				}}>
					{mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.jpeg') ? (
						<Image
							source={{ uri: 'http://' + ADDRESS + mediaUrl }}
							style={{
								width: 350,
								height: 350,
								borderRadius: 16,
							}}
							resizeMode="cover"
						/>
					) : mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov') ? (
						<Video
							source={{ uri: mediaUrl }}
							style={{
								width: 350,
								height: 350,
								borderRadius: 16,
							}}
							resizeMode="contain"
						/>
					) : null}
				</View>
			</View>
		</Modal>
	);
};

function MessageBubble({ index, message, friend }) {
	const [showTyping, setShowTyping] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [mediaUrl, setMediaUrl] = useState('');
	const [isSending, setIsSending] = useState(false)
	const theme = useTheme();

	const messagesTyping = useGlobal(state => state.messagesTyping);

	const openFile = (file) => {
		if (!file) return;
		setMediaUrl(file);
		setModalVisible(true);
	};

	useEffect(() => {
		if (message.status === 'sending') {
			setIsSending(true);
		} else {
			setIsSending(false);
		}
	}, [message.status]);

	useEffect(() => {
		if (index !== 0) return;
		if (messagesTyping === null) {
			setShowTyping(false);
			return;
		}
		setShowTyping(true);
		const check = setInterval(() => {
			const now = new Date();
			const ms = now - messagesTyping;
			if (ms > 10000) {
				setShowTyping(false);
			}
		}, 1000);
		return () => clearInterval(check);
	}, [messagesTyping]);

	if (index === 0 && showTyping) {
		return <MessageBubbleFriend friend={friend} typing={true} onFilePress={openFile} />;
	}

	return message.is_me ? (
		<>
			<MessageBubbleMe
				text={message.text}
				file={message.file}
				isSending={isSending}
				onFilePress={openFile}
			/>
			<ImageVideoModal
				visible={modalVisible}
				mediaUrl={mediaUrl}
				onClose={() => setModalVisible(false)}
			/>
		</>
	) : (
		<MessageBubbleFriend text={message.text} friend={friend} file={message.file} onFilePress={openFile} />
	);
}

function MessageInput({ message, setMessage, onSend, onFileSend }) {
	const theme = useTheme();

	const selectFile = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			alert('Permission to access media library is required!');
			return;
		}

		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: false,
			quality: 1,
			base64: true,
		});

		if (result.canceled) {
			return;
		}

		if (result.assets && result.assets.length > 0) {
			const asset = result.assets[0];
			const file = {
				name: asset.fileName || asset.uri.split('/').pop(),
				type: asset.type || 'image',
				data: asset.base64 || null,
				uri: asset.uri,
			};
			onFileSend(file);
		}
	};

	const canSend = message.trim().length > 0;

	return (
		<View style={{
			paddingHorizontal: 16,
			paddingVertical: 12,
			backgroundColor: theme.colors.background,
			flexDirection: 'row',
			alignItems: 'center',
			borderTopWidth: 1,
			borderTopColor: theme.colors.border,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: -4 },
			shadowOpacity: 0.1,
			shadowRadius: 12,
			elevation: 8,
		}}>
			<TouchableOpacity
				onPress={selectFile}
				style={{
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: 'rgba(0, 122, 255, 0.1)',
					alignItems: 'center',
					justifyContent: 'center',
					marginRight: 12,
				}}
			>
				<FontAwesomeIcon icon={faImage} size={18} color="#007AFF" />
			</TouchableOpacity>

			<View style={{
				flex: 1,
				backgroundColor: theme.colors.searchBar,
				borderRadius: 24,
				borderWidth: 1,
				borderColor: theme.colors.border,
				paddingHorizontal: 20,
				minHeight: 48,
				justifyContent: 'center',
			}}>
				<TextInput
					placeholder="Type a message..."
					placeholderTextColor={theme.colors.placeholder}
					value={message}
					onChangeText={setMessage}
					style={{
						fontSize: 16,
						color: theme.colors.background,
						lineHeight: 20,
						paddingVertical: 0,
					}}
					multiline={true}
					maxLength={1000}
				/>
			</View>

			<TouchableOpacity
				onPress={onSend}
				disabled={!canSend}
				style={{
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: canSend ? '#007AFF' : '#ccc',
					alignItems: 'center',
					justifyContent: 'center',
					marginLeft: 12,
					shadowColor: canSend ? '#007AFF' : 'transparent',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.3,
					shadowRadius: 4,
					elevation: canSend ? 3 : 0,
				}}
			>
				<FontAwesomeIcon
					icon={faPaperPlane}
					size={16}
					color="white"
					style={{ marginLeft: 2 }}
				/>
			</TouchableOpacity>
		</View>
	);
}

function MessagesScreen({ navigation, route }) {
	const theme = useTheme();
	const [message, setMessage] = useState('')

	const messagesList = useGlobal(state => state.messagesList)
	const messagesNext = useGlobal(state => state.messagesNext)
	const messageList = useGlobal(state => state.messageList)
	const messageSend = useGlobal(state => state.messageSend)
	const messageType = useGlobal(state => state.messageType)

	const connectionId = route.params.id
	const friend = route.params.friend

	useLayoutEffect(() => {
		navigation.setOptions({
			headerTitle: () => <MessageHeader friend={friend} />,
			headerStyle: {
				backgroundColor: theme.colors.background,
			},
			headerBackground: () => (
				<LinearGradient
					colors={[theme.colors.background, theme.colors.background]}
					style={{ flex: 1 }}
				/>
			),
		})
	}, [])

	useEffect(() => {
		messageList(connectionId)
	}, [])

	function onSend() {
		const cleaned = message.replace(/\s+/g, ' ').trim()
		if (cleaned.length === 0) return
		messageSend(connectionId, cleaned)
		setMessage('')
	}

	function onFileSend(file) {
		if (!file) return;
		messageSend(connectionId, { file });
		setMessage('')
	}

	function onType(value) {
		setMessage(value)
		messageType(friend.username)
	}

	return (
		<LinearGradient
			colors={[theme.colors.background, theme.colors.background]}
			style={{ flex: 1 }}
		>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={{
					flex: 1,
					marginBottom: Platform.OS === 'ios' ? 0 : 0
				}}>
					<FlatList
						automaticallyAdjustKeyboardInsets={true}
						contentContainerStyle={{
							paddingTop: 20,
							paddingBottom: 20,
						}}
						data={messagesList.filter(item => item.id !== -1)}
						inverted={true}
						keyExtractor={item => item.id}
						onEndReached={() => {
							if (messagesNext) {
								messageList(connectionId, messagesNext);
							}
						}}
						renderItem={({ item, index }) => (
							<MessageBubble index={index} message={item} friend={friend} />
						)}
						showsVerticalScrollIndicator={false}
					/>
				</View>

				{Platform.OS === 'ios' ? (
					<InputAccessoryView>
						<MessageInput
							message={message}
							setMessage={onType}
							onSend={onSend}
							onFileSend={onFileSend}
						/>
					</InputAccessoryView>
				) : (
					<MessageInput
						message={message}
						setMessage={onType}
						onSend={onSend}
						onFileSend={onFileSend}
					/>
				)}
			</SafeAreaView>
		</LinearGradient>
	)
}

export default MessagesScreen