import React, { useEffect, useState } from "react";
import { View, TextInput, Button, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import useGlobal from "../store"

export default function GroupChat({ route, navigation }) {
    const { groupId, groupName } = route.params || {};
    // safe selectors
    const groupMessages = useGlobal((state) => (state.groupMessages && state.groupMessages[groupId] ? state.groupMessages[groupId].messages : []));
    const groupMessageSend = useGlobal((state) => state.groupMessageSend);
    const fetchGroupMessages = useGlobal((state) => state.fetchGroupMessages);
    const groupCurrentId = useGlobal((state) => state.groupCurrentId);
    const joinGroup = useGlobal((state) => state.joinGroup);
    const groupSocketConnect = useGlobal((state) => state.groupSocketConnect);
    const groupListFetch = useGlobal((state) => state.groupListFetch);
    const groupSocket = useGlobal((state) => state.groupSocket);
    const currentUser = useGlobal((state) => state.user);

    const [messageText, setMessageText] = useState("");

    // Join group and fetch messages when screen mounts
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!groupSocket || groupSocket.readyState !== 1) {
                await groupSocketConnect?.();
            }

            // only first time
            if (mounted) {
                groupListFetch?.();
                joinGroup?.(groupId);
                fetchGroupMessages?.(groupId, 0);
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, [groupId]); // 👈 only runs when groupId changes


    const handleSend = () => {
        if (!messageText.trim()) return;
        groupMessageSend && groupMessageSend(groupId, messageText.trim());
        setMessageText("");
    };

    const renderItem = ({ item }) => {
        const isMy = currentUser && item.user && item.user.username === currentUser.username;
        return (
            <View style={[styles.messageContainer, isMy ? styles.myMessage : styles.otherMessage]}>
                <Text style={styles.username}>{item.user?.username || (isMy ? currentUser.username : "unknown")}</Text>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.time}>{item.created_at ? new Date(item.created_at).toLocaleTimeString() : ""}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
            keyboardVerticalOffset={90}
        >
            <Text style={styles.groupName}>{groupName}</Text>
            <FlatList
                data={groupMessages || []}
                keyExtractor={(item) => String(item.clientTempId || item.id || Math.random())}
                renderItem={renderItem}
                inverted
                contentContainerStyle={{ paddingVertical: 10 }}
                onEndReached={() => fetchGroupMessages && fetchGroupMessages(groupId, (groupMessages?.length || 0) / 15)}
                onEndReachedThreshold={0.5}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="Type a message..."
                />
                <Button title="Send" onPress={handleSend} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    groupName: { fontSize: 20, fontWeight: "bold", padding: 10, textAlign: "center" },
    inputContainer: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#ddd" },
    input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 15 },
    messageContainer: { padding: 10, marginVertical: 5, marginHorizontal: 10, borderRadius: 10 },
    myMessage: { backgroundColor: "#daf8cb", alignSelf: "flex-end" },
    otherMessage: { backgroundColor: "#fff", alignSelf: "flex-start" },
    username: { fontWeight: "bold", marginBottom: 2 },
    messageText: { fontSize: 16 },
    time: { fontSize: 10, color: "#555", marginTop: 2, alignSelf: "flex-end" },
});
