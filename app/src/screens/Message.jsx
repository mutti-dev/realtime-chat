import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
	Modal, Animated, Easing, FlatList, InputAccessoryView, Platform, SafeAreaView, Text, TouchableOpacity, View, Image,
} from "react-native"
import Thumbnail from "../common/Thumbnail"
import ShowImage from "../common/ShowImage"

import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import useGlobal from "../core/global"
import { useTheme } from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import { ADDRESS } from "../core/api";
import {
	faTimes, faFile
} from "@fortawesome/free-solid-svg-icons";
import utils from "../core/utils"
import { useNavigation } from '@react-navigation/native';
import MessageInput from "../component/MessageInput";
import FilePreview from "../component/FilePreview"
import { Video } from 'expo-av'; // add Video import

function MessageHeader({ friend }) {
	const userStatuses = useGlobal(state => state.userStatuses);
	const theme = useTheme();
	const navigation = useNavigation();

	return (


		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				paddingHorizontal: 0,
				paddingVertical: 8,
			}}
		>

			<TouchableOpacity
				onPress={() => navigation.navigate("FriendProfile", { details: friend })}
				activeOpacity={0.7}
			>
				<View
					style={{
						shadowColor: "#000",
						shadowOffset: { width: 0, height: 1 },
						shadowOpacity: 0.2,
						shadowRadius: 2,
						elevation: 2,
					}}
				>
					<Thumbnail url={friend.thumbnail} size={40} />
				</View>
			</TouchableOpacity>

			{/* Name + Status */}
			<View style={{ marginLeft: 12, flexShrink: 1 }}>
				<Text
					style={{
						color: theme.colors.title,
						fontSize: 18,
						fontWeight: "700",
						letterSpacing: 0.3,
					}}
					numberOfLines={1}
				>
					{friend.name}
				</Text>

				<Text
					style={{
						color: theme.colors.text,
						fontSize: 13,
						fontWeight: "500",
						marginTop: 2,
					}}
					numberOfLines={1}
				>
					{friend?.is_online
						? "Online"
						: friend?.last_online
							? `Last seen ${utils.formatTime(friend.last_online)}`
							: "Offline"}
				</Text>
			</View>
		</View>

	);
}



function MessageBubbleMe({ text, file, onFilePress, isSending }) {
	const theme = useTheme();
	const openFile = () => { if (!file) return; onFilePress(file); };




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
						) : <FilePreview file={file} />}
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
  const [modalVisible, setModalVisible] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  const openFile = () => {
    if (!file) return;
    setMediaUrl(file);   // 👈 file ko mediaUrl me set karo
    setModalVisible(true);
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
            <FilePreview file={file} />
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

        {/* 👇 Yaha modal add karo */}
        <ImageVideoModal
          visible={modalVisible}
          mediaUrl={mediaUrl}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </View>
  );
}


const ImageVideoModal = ({ visible, mediaUrl, onClose }) => {
	if (!mediaUrl) return null;
	// normalize to uri string
	let uri = null;
	if (typeof mediaUrl === 'string') {
		uri = mediaUrl;
	} else if (mediaUrl?.uri) {
		uri = mediaUrl.uri;
	} else if (mediaUrl?.file_url) {
		uri = mediaUrl.file_url;
	} else if (mediaUrl?.url) {
		uri = mediaUrl.url;
	} else {
		uri = String(mediaUrl);
	}
	// If relative path, prefix ADDRESS
	if (uri && !uri.match(/^[a-zA-Z]+:\/\//)) {
		uri = `http://${ADDRESS}${uri.startsWith('/') ? '' : '/'}${uri}`;
	}
	const source = { uri };
	// prefer explicit file_type/fileType fields on object, fallback to utils detection
	const type = (typeof mediaUrl === 'object' && (mediaUrl.file_type || mediaUrl.fileType)) || utils.getFileType(uri);

	return (
		<Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
				<TouchableOpacity style={{
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
				}} onPress={onClose}>
					<FontAwesomeIcon icon={faTimes} size={24} color="white" />
				</TouchableOpacity>

				<View style={{ backgroundColor: 'transparent', borderRadius: 16, overflow: 'hidden', maxWidth: '90%', maxHeight: '80%' }}>
					{type === 'image' ? (
						<Image source={source} style={{ width: 350, height: 350, borderRadius: 16 }} resizeMode="contain" />
					) : type === 'video' ? (
						<Video source={{ uri: source.uri }} style={{ width: 350, height: 350 }} useNativeControls resizeMode="contain" />
					) : type === 'audio' ? (
						<Text style={{ color: 'white' }}>🎵 Audio Playback</Text>
					) : (
						<Text style={{ color: 'white' }}>📄 Document</Text>
					)}
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
	// use message.file_url when server provided absolute url, fallback to message.file
	const fileForMessage = message?.file_url || message?.file || null;

	const messagesTyping = useGlobal(state => state.messagesTyping);

	const openFile = (file) => {
		if (!file) return;
		// normalize file shapes: could be string url or object { uri, file_url, url }
		if (typeof file === 'string') {
			setMediaUrl(file);
		} else if (file?.file_url) {
			setMediaUrl(file.file_url);
		} else if (file?.uri) {
			setMediaUrl(file.uri);
		} else if (file?.url) {
			setMediaUrl(file.url);
		} else {
			setMediaUrl(file);
		}
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
				setShowTyping(false)
			}
		}, 1000);
		return () => clearInterval(check);
	}, [messagesTyping]);

	if (index === 0 && showTyping) {
		return <MessageBubbleFriend friend={friend} typing={true} onFilePress={openFile} file={null} />;
	}

	return message.is_me ? (
		<>
			<MessageBubbleMe
				text={message.text}
				file={fileForMessage}
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
		<MessageBubbleFriend text={message.text} friend={friend} file={fileForMessage} onFilePress={openFile} />
	);
}




function MessagesScreen({ navigation, route }) {
	const theme = useTheme();
	const [message, setMessage] = useState('')
	const uploadFile = useGlobal(state => state.uploadFile) // use uploadFile for binary uploads

	const messagesList = useGlobal(state => state.messagesList)
	const messagesNext = useGlobal(state => state.messagesNext)
	const messageList = useGlobal(state => state.messageList)
	const messageSend = useGlobal(state => state.messageSend)
	const messageType = useGlobal(state => state.messageType)


	const connectionId = route.params.id
	const friend = route.params.friend

	// console.log("📂 messagesList:", messagesList);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerTitle: () => <MessageHeader friend={friend} />,
			headerStyle: {
				backgroundColor: theme.colors.level3,

			},
		})
	}, [navigation, friend, theme]);

	useEffect(() => {
		// load first page
		if (connectionId) messageList(connectionId);
	}, [connectionId, messageList]);

	function onSend() {
		const cleaned = message.replace(/\s+/g, ' ').trim()
		if (cleaned.length === 0) return
		messageSend(connectionId, cleaned)
		setMessage('')
	}

	async function onFileSend(file) {
		if (!file) return;
		// Use REST upload endpoint to send binary (server will persist and broadcast created message)
		try {
			// include connectionId so server can create/persist the message and broadcast to both users
			await uploadFile({ file, connectionId });
			// Clearing input/preview handled by MessageInput; server will broadcast created message via websocket.
		} catch (err) {
			console.log('file upload failed', err);
		}
		setMessage('');
	}

	function onType(value) {
		setMessage(value)
		messageType(friend.username)
	}

	return (
		<LinearGradient colors={[theme.colors.background, theme.colors.background]} style={{ flex: 1 }}>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={{ flex: 1, marginBottom: Platform.OS === 'ios' ? 0 : 0 }}>
					<FlatList
						automaticallyAdjustKeyboardInsets={true}
						contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
						data={messagesList ? messagesList.filter(item => item.id !== -1) : []}
						inverted={true}
						keyExtractor={item => String(item.id)} // ensure string key
						onEndReached={() => { if (messagesNext) { messageList(connectionId, messagesNext); } }}
						renderItem={({ item, index }) => (<MessageBubble index={index} message={item} friend={friend} />)}
						showsVerticalScrollIndicator={false}
					/>
				</View>

				{Platform.OS === 'ios' ? (
					<InputAccessoryView>
						<MessageInput message={message} setMessage={onType} onSend={onSend} onFileSend={onFileSend} />
					</InputAccessoryView>
				) : (
					<MessageInput message={message} setMessage={onType} onSend={onSend} onFileSend={onFileSend} theme={theme} />
				)}
			</SafeAreaView>
		</LinearGradient>
	)
}
export default MessagesScreen