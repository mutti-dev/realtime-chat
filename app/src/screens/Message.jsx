// MessagesScreen.js
import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import {
	Animated,
	Easing,
	FlatList,
	InputAccessoryView,
	Platform,
	SafeAreaView,
	Text,
	TouchableOpacity,
	View,
	StyleSheet,
} from "react-native";
import { useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Thumbnail from "../common/Thumbnail";
import FilePreview from "../component/FilePreview";
import MessageInput from "../component/MessageInput";
import useGlobal from "../core/global";
import utils from "../core/utils";
import MediaViewer from "../component/MediaViewer";

// ---------------- HEADER ----------------
function MessageHeader({ friend }) {
	const theme = useTheme();
	const styles = getStyles(theme);
	const navigation = useNavigation();

	return (
		<View style={styles.headerRow}>
			<TouchableOpacity
				onPress={() => navigation.navigate("FriendProfile", { details: friend })}
				activeOpacity={0.7}
			>
				<Thumbnail url={friend.thumbnail_url} size={40} />

			</TouchableOpacity>
			<View style={{ marginLeft: 12, flexShrink: 1 }}>
				<Text style={styles.friendName} numberOfLines={1}>
					{friend.name}
				</Text>
				<Text style={styles.friendStatus} numberOfLines={1}>
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

// ---------------- BUBBLE ME ----------------
const MessageBubbleMe = React.memo(({ text, file, onFilePress, isSending }) => {
	const theme = useTheme();
	const user = useGlobal(state => state.user)
	const styles = getStyles(theme);
	const openFile = useCallback(() => {
		if (!file) return;
		if (typeof onFilePress === "function") return onFilePress(file);
	}, [file, onFilePress]);

	return (
		<View style={styles.rowRight}>


			{file ? (
				<TouchableOpacity onPress={openFile} activeOpacity={0.8}>
					{isSending ? (
						<Text style={styles.sendingText}>Sending…</Text>
					) : (
						<FilePreview file={file} />
					)}
				</TouchableOpacity>
			) : (
				<View style={styles.bubbleMe}>
					<Text style={styles.textMe}>{text}</Text>
				</View>
			)}
			<View style={styles.thumbnailWrap}>
				<Thumbnail url={user.thumbnail_url} size={36} />
			</View>
		</View>
	);

});

// ---------------- BUBBLE FRIEND ----------------
const MessageBubbleFriend = React.memo(({ text = "", friend, typing = false, file, onFilePress }) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const [modalVisible, setModalVisible] = useState(false);
	const [mediaUrl, setMediaUrl] = useState(null);

	const handleFileOpen = useCallback(() => {
		if (!file) return;
		// if parent provided a handler, prefer that (it will open global viewer)
		if (typeof onFilePress === "function") return onFilePress(file);
		// otherwise open local viewer
		setMediaUrl(file || null);
		setModalVisible(true);
	}, [file, onFilePress]);

	return (
		<View style={styles.rowLeft}>
			<View style={styles.thumbnailWrap}>
				<Thumbnail url={friend.thumbnail_url} size={36} />
			</View>

			<View style={styles.bubbleFriend}>
				{typing ? (
					<TypingDots />
				) : file ? (
					<TouchableOpacity onPress={handleFileOpen} activeOpacity={0.8}>
						<FilePreview file={file} />
					</TouchableOpacity>
				) : (
					<Text style={styles.textFriend}>{text}</Text>
				)}

				<MediaViewer visible={modalVisible} media={mediaUrl || null} onClose={() => setModalVisible(false)} />
			</View>
		</View>
	);
});

// ---------------- TYPING DOTS ----------------
const TypingDots = () => (


	<View style={{ flexDirection: "row", paddingVertical: 4 }}>
		{[0, 1, 2].map(i => (
			<TypingDot key={i} offset={i} />
		))}
	</View>
);

const TypingDot = ({ offset }) => {
	const theme = useTheme();
	const styles = getStyles(theme);
	const y = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const bump = 200;
		const total = 1000;
		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(bump * offset),
				Animated.timing(y, { toValue: 1, duration: bump, easing: Easing.linear, useNativeDriver: true }),
				Animated.timing(y, { toValue: 0, duration: bump, easing: Easing.linear, useNativeDriver: true }),
				Animated.delay(total - bump * 2 - bump * offset),
			])
		);
		anim.start();
		return () => anim.stop();
	}, [offset, y]);

	const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
	return <Animated.View style={[styles.dot, { transform: [{ translateY }] }]} />;
};

// ---------------- MESSAGE BUBBLE WRAPPER ----------------
function MessageBubble({ index, message, friend, globalOpenFile }) {

	// NOTE: we intentionally keep local modal only for friend->open when parent didn't provide a handler.
	const [modalVisible, setModalVisible] = useState(false);
	const [mediaUrl, setMediaUrl] = useState(null);
	const [isSending, setIsSending] = useState(false);
	const messagesTyping = useGlobal(state => state.messagesTyping);

	console.log("✨Rendering MessageBubble for message:", message);

	// openFile used by wrapper; accepts a file-like param
	const openFile = useCallback(
		(f) => {
			if (!f) return;
			// if parent provided a globalOpenFile function, use it to show single global viewer
			if (typeof globalOpenFile === "function") return globalOpenFile(f);
			// otherwise use local modal
			const normalized = typeof f === "string" ? f : f?.presigned_file_url || f?.file_url || f?.uri || f?.url || f;
			setMediaUrl(normalized || null);
			setModalVisible(true);
		},
		[globalOpenFile]
	);

	useEffect(() => {
		setIsSending(message.status === "sending");
	}, [message.status]);

	// typing indicator logic (keeps previous behavior but safe)
	const showTyping = index === 0 && !!messagesTyping && new Date() - new Date(messagesTyping) < 10000;
	if (showTyping) {
		return <MessageBubbleFriend friend={friend} typing={true} onFilePress={openFile} />;
	}

	const fileForMessage = message?.presigned_file_url || message?.file_url || message?.file || null;

	return message.is_me ? (
		<>
			<MessageBubbleMe text={message.text} file={fileForMessage} isSending={isSending} onFilePress={openFile} />
			<MediaViewer visible={modalVisible} media={mediaUrl || null} onClose={() => setModalVisible(false)} />
		</>
	) : (
		<MessageBubbleFriend text={message.text} friend={friend} file={fileForMessage} onFilePress={openFile} />
	);
}

// ---------------- MAIN SCREEN ----------------
function MessagesScreen({ navigation, route }) {
	const theme = useTheme();
	const styles = getStyles(theme);
	const [message, setMessage] = useState("");
	const [globalViewer, setGlobalViewer] = useState({ visible: false, media: null });

	// global store hooks (kept names same as your store to avoid breaking)
	const sendFile = useGlobal(s => s.sendFile);
	const messages = useGlobal(s => s.messagesList);
	const messagesNext = useGlobal(s => s.messagesNext);
	const fetchMessages = useGlobal(s => s.messageList);
	const sendMessage = useGlobal(s => s.messageSend);
	const typeMessage = useGlobal(s => s.messageType);

	const connectionId = route.params.id;
	const friend = route.params.friend;

	useLayoutEffect(() => {
		navigation.setOptions({
			headerTitle: () => <MessageHeader friend={friend} />,
			headerStyle: { backgroundColor: theme.colors.level3 },
		});
	}, [navigation, friend, theme]);

	useEffect(() => {
		if (connectionId) fetchMessages(connectionId);
	}, [connectionId, fetchMessages]);

	const onSend = useCallback(() => {
		const cleaned = message.replace(/\s+/g, " ").trim();
		if (!cleaned) return;
		sendMessage(connectionId, cleaned);
		setMessage("");
	}, [message, connectionId, sendMessage]);

	const onFileSend = useCallback(
		async (file) => {
			if (!file) return;
			try {
				await sendFile({ file, connectionId });
			} catch (err) {
				console.log("file upload failed", err);
			}
			setMessage("");
		},
		[sendFile, connectionId]
	);

	const onType = useCallback(
		(value) => {
			setMessage(value);
			typeMessage(friend.username);
		},
		[friend.username, typeMessage]
	);

	// globalOpenFile: shows a single global viewer (so only one modal lives at top)
	const globalOpenFile = useCallback((f) => {
		if (!f) return;
		const normalized = typeof f === "string" ? f : f?.presigned_file_url || f?.file_url || f?.uri || f?.url || f;
		setGlobalViewer({ visible: true, media: normalized || null });
	}, []);

	const globalCloseViewer = useCallback(() => setGlobalViewer({ visible: false, media: null }), []);

	const renderItem = useCallback(
		({ item, index }) => <MessageBubble index={index} message={item} friend={friend} globalOpenFile={globalOpenFile} />,
		[friend, globalOpenFile]
	);

	return (
		<LinearGradient colors={[theme.colors.background, theme.colors.background]} style={{ flex: 1 }}>
			<SafeAreaView style={{ flex: 1 }}>
				<FlatList
					data={messages ? messages.filter(m => m.id !== -1) : []}
					keyExtractor={item => String(item.id)}
					renderItem={renderItem}
					inverted
					initialNumToRender={20}
					windowSize={5}
					removeClippedSubviews
					maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
					contentContainerStyle={{ paddingVertical: 20 }}
					onEndReachedThreshold={0.2}
					onEndReached={() => messagesNext && fetchMessages(connectionId, messagesNext)}
					showsVerticalScrollIndicator={false}
				/>

				{/* Global viewer (one modal for the whole screen) */}
				<MediaViewer visible={globalViewer.visible} media={globalViewer.media || null} onClose={globalCloseViewer} />

				{Platform.OS === "ios" ? (
					<InputAccessoryView>
						<MessageInput message={message} setMessage={onType} onSend={onSend} onFileSend={onFileSend} connectionId={connectionId} />
					</InputAccessoryView>
				) : (
					<MessageInput message={message} setMessage={onType} onSend={onSend} onFileSend={onFileSend} theme={theme} connectionId={connectionId} />
				)}
			</SafeAreaView>
		</LinearGradient>
	);
}





function getStyles(theme) {
	return StyleSheet.create({
		headerRow: {
			flexDirection: "row",
			alignItems: "center",
			paddingVertical: 8,
		},
		friendName: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "700",
			letterSpacing: 0.3,
		},
		friendStatus: {
			color: theme.colors.text,
			fontSize: 13,
			fontWeight: "500",
			marginTop: 2,
		},
		rowRight: {
			flexDirection: "row",
			padding: 8,
			paddingRight: 16,
			justifyContent: "flex-end",
		},
		rowLeft: {
			flexDirection: "row",
			padding: 8,
			paddingLeft: 16,
			alignItems: "flex-start",
		},
		thumbnailWrap: {
			marginRight: 8,
		},
		bubbleMe: {
			backgroundColor: theme.colors.primary,
			borderRadius: 20,
			borderBottomRightRadius: 4,
			maxWidth: "80%",
			paddingHorizontal: 16,
			paddingVertical: 12,
			marginLeft: 40,
			elevation: 5,
		},
		bubbleFriend: {
			backgroundColor: theme.colors.level3,
			borderRadius: 20,
			borderBottomLeftRadius: 4,
			maxWidth: "80%",
			paddingHorizontal: 16,
			paddingVertical: 12,
			marginLeft: 8,
			marginRight: 40,
			elevation: 3,
		},
		textMe: {
			color: "white",
			fontSize: 16,
			fontWeight: "500",
			lineHeight: 20,
		},
		textFriend: {
			color: theme.colors.text,
			fontSize: 16,
			fontWeight: "500",
			lineHeight: 20,
		},
		sendingText: {
			color: theme.colors.text,
			fontSize: 16,
			opacity: 0.8,
		},
		dot: {
			backgroundColor: theme.colors.primary,
			width: 8,
			height: 8,
			marginHorizontal: 1.5,
			borderRadius: 4,
			backgroundColor: "#999",
		},
	});
}


export default MessagesScreen;

