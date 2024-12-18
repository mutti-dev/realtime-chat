import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Modal, Animated, Easing, FlatList, InputAccessoryView, Keyboard, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Image } from "react-native"
import Thumbnail from "../common/Thumbnail"
import ShowImage from "../common/ShowImage"
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import useGlobal from "../core/global"
import { useTheme } from "react-native-paper";
import FileViewer from 'react-native-file-viewer';
import { ADDRESS } from "../core/api";
import { faTimes } from "@fortawesome/free-solid-svg-icons";





function MessageHeader({ friend }) {
	const theme = useTheme();
	return (
		<View
			style={{
				flex: 1,
				flexDirection: 'row',
				alignItems: 'center'
			}}
		>
			<Thumbnail
				url={friend.thumbnail}
				size={30}
			/>
			<Text
				style={{
					color: theme.colors.text,
					marginLeft: 10,
					fontSize: 18,
					fontWeight: 'bold'
				}}
			>
				{friend.name}
			</Text>
		</View>
	)
}




function MessageBubbleMe({ text, file, onFilePress, isSending }) {
	const openFile = () => {
		if (!file) return;
		onFilePress(file);
	};

	return (
		<View style={{ flexDirection: 'row', padding: 4, paddingRight: 12 }}>
			<View style={{ flex: 1 }} />
			<View
				style={{
					backgroundColor: '#303040',
					borderRadius: 21,
					maxWidth: '75%',
					paddingHorizontal: 16,
					paddingVertical: 12,
					justifyContent: 'center',
					marginRight: 8,
					minHeight: 42,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.2,
					shadowRadius: 4,
					elevation: 5,
				}}
			>
				{file ? (
					<TouchableOpacity onPress={openFile}>
						{isSending ? (
							<Text style={{ color: 'white', fontSize: 16 }}>Sending...</Text>
						) : file.endsWith('.jpg') || file.endsWith('.png') ? (
							<ShowImage url={file} size={150} />
						) : (
							<Text style={{ color: 'white', fontSize: 16 }}>Open File</Text>
						)}
					</TouchableOpacity>
				) : (
					<Text style={{ color: 'white', fontSize: 16, lineHeight: 18 }}>
						{text}
					</Text>
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
		<Animated.View
			style={{
				width: 8,
				height: 8,
				marginHorizontal: 1.5,
				borderRadius: 4,
				backgroundColor: '#606060',
				transform: [{ translateY }]
			}}
		/>
	)
}






function MessageBubbleFriend({ text = '', friend, typing = false, file }) {
	const openFile = () => {
		if (!file) return;
		FileViewer.open(file)
			.then(() => console.log('File opened successfully'))
			.catch(err => console.error('Failed to open file:', err));
	};

	return (
		<View style={{ flexDirection: 'row', padding: 4, paddingLeft: 16 }}>
			<Thumbnail url={friend.thumbnail} size={42} />
			<View
				style={{
					backgroundColor: '#d0d2db',
					borderRadius: 21,
					maxWidth: '75%',
					paddingHorizontal: 16,
					paddingVertical: 12,
					justifyContent: 'center',
					marginLeft: 8,
					minHeight: 42,
				}}
			>
				{typing ? (
					<View style={{ flexDirection: 'row' }}>
						<MessageTypingAnimation offset={0} />
						<MessageTypingAnimation offset={1} />
						<MessageTypingAnimation offset={2} />
					</View>
				) : file ? (
					<TouchableOpacity>
						{file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') ? (
							// <Image
							//     source={{ uri: 'http://' + ADDRESS + file }}
							//     style={{ width: 150, height: 150, borderRadius: 10 }}
							// />
							<ShowImage url={file} size={150} />
						) : (
							<Text style={{ color: '#202020', fontSize: 16 }}>Open File</Text>
						)}
					</TouchableOpacity>
				) : (
					<Text style={{ color: '#202020', fontSize: 16 }}>{text}</Text>
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
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
				}}
			>
				<View
					style={{
						backgroundColor: 'black',
						padding: 20,
						borderRadius: 10,
						alignItems: 'center',
					}}
				>

					{mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.png') ? (
						<Image
							source={{ uri: 'http://' + ADDRESS + mediaUrl }}
							style={{
								width: 300,
								height: 300,
								borderRadius: 10,
							}}
						/>
					) : mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov') ? (
						<Video
							source={{ uri: mediaUrl }}
							style={{
								width: 300,
								height: 300,
								borderRadius: 10,
							}}
							resizeMode="contain"
						/>
					) : null}
				</View>
				<TouchableOpacity
					style={{
						position: 'absolute',
						top: 10,
						right: 10,

						borderRadius: 20,
						padding: 8,
						zIndex: 1000,
					}}
					onPress={onClose}
				>

					<FontAwesomeIcon icon={faTimes} size={34} color="#808080" />

				</TouchableOpacity>
			</View>
		</Modal>
	);
};




function MessageBubble({ index, message, friend }) {
	const [showTyping, setShowTyping] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [mediaUrl, setMediaUrl] = useState('');
	const [isSending, setIsSending] = useState(false)

	const messagesTyping = useGlobal(state => state.messagesTyping);


	const openFile = (file) => {
		if (!file) return;
		setMediaUrl(file);  // Set the file URL
		setModalVisible(true);  // Show modal
	};

	useEffect(() => {
		if (message.status === 'sending') {
			setIsSending(true);  // Mark as sending when status is 'sending'
		} else {
			setIsSending(false);  // Reset when not sending
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
		return <MessageBubbleFriend friend={friend} typing={true} />;
	}

	return message.is_me ? (
		<>
			<MessageBubbleMe
				text={message.text}
				file={message.file}
				isSending={isSending}  // Pass sending status
				onFilePress={openFile}
			/>
			<ImageVideoModal
				visible={modalVisible}
				mediaUrl={mediaUrl}
				onClose={() => setModalVisible(false)}
			/>
		</>
	) : (
		<MessageBubbleFriend text={message.text} friend={friend} file={message.file} />
	);
}




function MessageInput({ message, setMessage, onSend, onFileSend }) {
	const theme = useTheme();

	const selectFile = () => {
		launchImageLibrary(
			{
				mediaType: 'mixed', // Allow images, videos, and documents
				includeBase64: true, // Include Base64 encoding
			},
			(response) => {
				if (response.didCancel || response.errorCode) {
					console.error('File selection canceled or failed');
					return;
				}
				if (response.assets && response.assets.length > 0) {
					const file = {
						name: response.assets[0].fileName,
						type: response.assets[0].type,
						data: response.assets[0].base64,
						uri: response.assets[0].uri, // Include URI for display
					};
					onFileSend(file);
				}
			}
		);
	};

	return (
		<View
			style={{
				paddingHorizontal: 16,
				paddingBottom: 10,
				backgroundColor: theme.colors.text,
				flexDirection: 'row',
				alignItems: 'center',
				borderTopWidth: 1,
				borderTopColor: '#e0e0e0',
				shadowColor: "#000",
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: 0.1,
				shadowRadius: 5,
				elevation: 5,
			}}
		>
			{/* File Attachment Button */}
			<TouchableOpacity onPress={selectFile}>
				<FontAwesomeIcon
					icon="file"
					size={22}
					color={theme.colors.primary}
					style={{
						marginHorizontal: 12,
						borderRadius: 20,
						padding: 8,
						backgroundColor: theme.colors.text,
						elevation: 2,
					}}
				/>
			</TouchableOpacity>


			<TextInput
				placeholder="Type a message..."
				placeholderTextColor="#909090"
				color="white"
				value={message}
				onChangeText={setMessage}
				style={{
					flex: 1,
					paddingHorizontal: 18,
					borderWidth: 1,
					borderRadius: 25,
					borderColor: '#d0d0d0',
					backgroundColor: 'black',
					height: 50,
					fontSize: 16,
					fontFamily: 'Roboto',
					paddingVertical: 0,
				}}
			/>

			{/* Send Message Button */}
			<TouchableOpacity onPress={onSend}>
				<FontAwesomeIcon
					icon="paper-plane"
					size={22}
					color={theme.colors.primary}
					style={{
						marginHorizontal: 12,
						borderRadius: 20,
						padding: 8,
						backgroundColor: theme.colors.text,
						elevation: 2,
					}}
				/>
			</TouchableOpacity>
		</View>
	);
}






function MessagesScreen({ navigation, route }) {
	const [message, setMessage] = useState('')

	const messagesList = useGlobal(state => state.messagesList)
	console.log("Mutti", messageList);
	const messagesNext = useGlobal(state => state.messagesNext)

	const messageList = useGlobal(state => state.messageList)
	const messageSend = useGlobal(state => state.messageSend)
	const messageType = useGlobal(state => state.messageType)

	const connectionId = route.params.id
	const friend = route.params.friend

	// Update the header 
	useLayoutEffect(() => {
		navigation.setOptions({
			headerTitle: () => (
				<MessageHeader friend={friend} />
			)
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
		<SafeAreaView style={{ flex: 1 }}>

			<View
				style={{
					flex: 1,
					marginBottom: Platform.OS === 'ios' ? 60 : 0
				}}
			>
				<FlatList
					automaticallyAdjustKeyboardInsets={true}
					contentContainerStyle={{
						paddingTop: 30
					}}
					data={messagesList.filter(item => item.id !== -1)}  // Excluding the empty message
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
				/>

			</View>


			{Platform.OS === 'ios' ? (
				<InputAccessoryView>
					<MessageInput
						message={message}
						setMessage={onType}
						onSend={onSend}
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
	)
}




// ----------------------------------------------------------

export default MessagesScreen