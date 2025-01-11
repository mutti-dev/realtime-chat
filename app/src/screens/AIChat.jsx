import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import {
    SafeAreaView,
    FlatList,
    TextInput,
    TouchableOpacity,
    Text,
    View,
    Platform,
    InputAccessoryView,
    Animated,
    Easing,
    
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import useGlobal from "../core/global";
import { useTheme } from "react-native-paper";
import Thumbnail from "../common/Thumbnail"
import { Image } from "react-native"







function MessageHeader() {
    const theme = useTheme();
    return (
        <View
            style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <Image
                source={{
                    uri: "https://img.freepik.com/free-vector/robot-face-concept-illustration_114360-8247.jpg?t=st=1734519011~exp=1734522611~hmac=8e8c6ccf7d7bc5fc19d997c1dbfd2de8637ae0534415ab0be42241c798abfd81&w=740",
                }}
                style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderColor: theme.colors.secondary,
                    // backgroundColor: theme.colors.secondary,
                    
                }}
            />
            <Text
                style={{
                    color: theme.colors.text,
					marginLeft: 10,
					fontSize: 20,
					fontWeight: 'bold'
                }}
            >
                Mutti GPT
            </Text>
        </View>
    );
}

// Typing animation component
function MessageTypingAnimation({ offset }) {
    const y = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const total = 1000;
        const bump = 200;

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
        );
        animation.start();
        return () => {
            animation.stop();
        };
    }, []);

    const translateY = y.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8]
    });

    return (
        <Animated.View
            style={{
                width: 8,
                height: 8,
                marginHorizontal: 1.5,
                borderRadius: 4,
                backgroundColor: '#d0d2db',
                transform: [{ translateY }]
            }}
        />
    );
}

// Chat bubble component
function AIChatBubble({ isUser, text }) {
    return (
        <View
            style={{
                flexDirection: isUser ? "row-reverse" : "row",
                marginVertical: 4,
                paddingHorizontal: 16,
            }}
        >
            <View
                style={{
                    maxWidth: "75%",
                    backgroundColor: isUser ? "#303040" : "#d0d2db",
                    borderRadius: 21,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 5,
                }}
            >
                <Text
                    style={{
                        color: isUser ? "white" : "#202020",
                        fontSize: 16,
                        lineHeight: 20,
                    }}
                >
                    {text}
                </Text>
            </View>
        </View>
    );
}

// Chat input component
function AIChatInput({ onSend }) {
    const [message, setMessage] = useState("");
    const theme = useTheme();

    const handleSend = () => {
        const cleanedMessage = message.trim();
        if (cleanedMessage.length === 0) return;
        onSend(cleanedMessage);
        setMessage("");
    };

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: "#e0e0e0",
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: theme.colors.text,
                backgroundColor: theme.colors.background,

            }}
        >
            <TextInput
                style={{
                    flex: 1,
                    paddingHorizontal: 16,
                    
                    height: 50,
                    borderWidth: 1,
                    borderRadius: 25,
                    borderColor: "#d0d0d0",
                   backgroundColor: theme.colors.background,
                    color: "white",
                    fontSize: 16,
                }}
                placeholder="Type a message..."
                placeholderTextColor="#909090"
                color={theme.colors.text}
                value={message}
                onChangeText={setMessage}
            />
            <TouchableOpacity
                onPress={handleSend}
                style={{
                    marginLeft: 12,
                    backgroundColor: theme.colors.background,
                    borderRadius: 25,
                    padding: 12,
                }}
            >
                <FontAwesomeIcon icon={faPaperPlane} size={22} color={theme.colors.text} />
            </TouchableOpacity>
        </View>
    );
}

// Main chat screen component
function AIChatScreen({ navigation }) {
    const theme = useTheme();
    const [messages, setMessages] = useState([]); // { isUser: boolean, text: string }
    const ollamaTyping = useGlobal((state) => state.ollamaTyping);
    const sendToOllama = useGlobal((state) => state.sendToOllama);
    const { ollamaResponse, messagesList } = useGlobal((state) => ({
        ollamaResponse: state.ollamaResponse,
        messagesList: state.messagesList, // assuming messagesList stores the previous messages
    }));

    const flatListRef = useRef();

    // Fetch previous messages when the screen loads
    // useEffect(() => {
    //     const connectionId = 'your_connection_id'; // Replace with actual connection ID
    //     useGlobal.getState().messageList(connectionId, 0); // Fetch the first batch of messages
    // }, []);

    // Update the messages when new messages come in
    useEffect(() => {
        if (messagesList) {
            // Prepend the previous messages to the state
            setMessages((prevMessages) => [...messagesList, ...prevMessages]);
        }
    }, [messagesList]);

    // Handle Ollama response and add it to the message list
    useEffect(() => {
        if (ollamaResponse) {
            setMessages((prevMessages) => [
                { isUser: false, text: ollamaResponse },
                ...prevMessages.filter((msg) => msg.text !== "AI Mutti is typing..."),
            ]);
        }
    }, [ollamaResponse]);

    // Handle typing indicator
    useEffect(() => {
        if (ollamaTyping) {
            setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.text === "AI Mutti is typing...")) {
                    return [{ isUser: false, text: "AI Mutti is typing..." }, ...prevMessages];
                }
                return prevMessages;
            });
        }
    }, [ollamaTyping]);

    // Scroll to the bottom of the list when messages change
    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0 });
        }
    }, [messages]);

    // Handle sending new messages
    const handleSend = (text) => {
        setMessages((prev) => [{ isUser: true, text }, ...prev]);
        sendToOllama(text);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <FlatList
                ref={flatListRef}
                contentContainerStyle={{ paddingVertical: 10 }}
                data={messages}
                inverted={true} // This makes the most recent message appear at the bottom
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => {
                    if (item.text === "AI Mutti is typing...") {
                        return (
                            <View style={{ flexDirection: "row", margin: 10 }}>
                                <MessageTypingAnimation offset={0} />
                                <MessageTypingAnimation offset={1} />
                                <MessageTypingAnimation offset={2} />
                            </View>
                        );
                    }
                    return <AIChatBubble isUser={item.isUser} text={item.text} />;
                }}
            />

            {Platform.OS === "ios" ? (
                <InputAccessoryView>
                    <AIChatInput onSend={handleSend} />
                </InputAccessoryView>
            ) : (
                <AIChatInput onSend={handleSend} />
            )}
        </SafeAreaView>
    );
}

export default AIChatScreen;
