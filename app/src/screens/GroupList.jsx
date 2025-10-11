import React, { useEffect, useRef } from "react";
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import useGlobal from "../store"


export default function GroupList({ navigation }) {
  const groupList = useGlobal((state) => state.groupList || []);
  const groupListFetch = useGlobal((state) => state.groupListFetch);
  const groupSocketConnect = useGlobal((state) => state.groupSocketConnect);
  const groupSocket = useGlobal((state) => state.groupSocket);

  // Connect to group socket and fetch list
  const hasConnected = useRef(false);
  useEffect(() => {

  if (!hasConnected.current) {
    hasConnected.current = true;

    // ✅ connect only once
    if (!groupSocket || groupSocket.readyState !== 1) {
      groupSocketConnect && groupSocketConnect();
    }

    // ✅ fetch list only once after socket ready
    setTimeout(() => {
      groupListFetch && groupListFetch();
    }, 400);
  }

  // Cleanup: close socket on unmount if you want
  return () => {
    hasConnected.current = false;
  };
}, []); // 👈 empty deps, runs only once

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        navigation.navigate("GroupChat", {
          groupId: item.id,
          groupName: item.name,
        })
      }
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.members}>{(item.members_detail || []).join(", ")}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Groups</Text>
      <FlatList
        data={groupList}
        // ensure keys are unique even if item.id is duplicated or missing
        keyExtractor={(item, index) => `${String(item.id ?? "no-id")}-${index}`}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  item: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginVertical: 5,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  members: { fontSize: 12, color: "#666", marginTop: 4 },
});
