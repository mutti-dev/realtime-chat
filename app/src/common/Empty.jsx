import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function Empty({ icon = "alert-circle-outline", message, centered = true }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: centered ? "center" : "flex-start",
        alignItems: "center",
        paddingVertical: 120,
      }}
    >
      <Ionicons
        name={icon}
        size={90}
        color="#d0d0d0"
        style={{
          marginBottom: 16,
        }}
      />
      <Text
        style={{
          color: "#c3c3c3",
          fontSize: 16,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export default Empty;
