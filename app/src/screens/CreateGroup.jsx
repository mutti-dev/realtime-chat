import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import useGlobal from "../store"

export default function CreateGroup({ navigation }) {
  const groupCreate = useGlobal((state) => state.groupCreate);
  const groupListFetch = useGlobal((state) => state.groupListFetch);

  const [name, setName] = useState("");
  const [members, setMembers] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    const membersArray = members
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    try {
      await groupCreate(name.trim(), membersArray);
      Alert.alert("Success", "Group created successfully!");
      setName("");
      setMembers("");
      // refresh and navigate back
      groupListFetch && groupListFetch();
      navigation.navigate("GroupList");
    } catch (err) {
      console.error("Group create failed:", err);
      Alert.alert("Error", "Failed to create group");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create New Group</Text>

      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Football Friends"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Add Members (usernames, comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="ali, usman, hassan"
        value={members}
        onChangeText={setMembers}
      />

      <Button title="Create Group" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
});
