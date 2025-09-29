// components/FilePreview.js
import React from "react";
import { View, Text, Image } from "react-native";
import { Video } from "expo-av";

import utils from "../core/utils";

export default function FilePreview({ file }) {
  const type = utils.getFileType(file);
  // console.log("FilePreview detected type:", file);

  if (type === "image") {
    return (
      <Image
        source={{ uri: file }}
        style={{ width: 200, height: 200, borderRadius: 8 }}
        resizeMode="cover"
      />
    );
  }

  if (type === "video") {
    return (
      <Video
        source={{ uri: utils.resolvePreviewUri(file)  || file }}
        style={{ width: 200, height: 200 }}
        useNativeControls
        resizeMode="contain"
      />
    );
  }

  if (type === "audio") {
    return (
      <View style={{ padding: 10, backgroundColor: "#eee", borderRadius: 8 }}>
        <Text>🎵 Audio File</Text>
        {/* You can integrate expo-av Audio API here */}
      </View>
    );
  }

  if (type === "document") {
    return (
      <View style={{ padding: 10, backgroundColor: "#ddd", borderRadius: 8 }}>
        <Text>📄 Document File</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 10, backgroundColor: "#f8d7da", borderRadius: 8 }}>
      <Text>❓ Unknown File</Text>
    </View>
  );
}
