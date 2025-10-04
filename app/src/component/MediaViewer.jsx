// component/MediaViewer.js
import React, { useMemo } from "react";
import { Modal, View, TouchableOpacity, Text, Image, StyleSheet } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Video } from "expo-av";
import utils from "../core/utils";




const MediaViewer = ({ visible, media, onClose }) => {
  const { uri, type } = useMemo(() => utils.normalizeMedia(media), [media]);

  // Render nothing if modal not visible or we don't have a uri
  if (!visible || !uri) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close viewer"
        >
          <FontAwesomeIcon icon={faTimes} size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.mediaContainer}>
          {type === "image" ? (
            <Image source={{ uri }} style={styles.media} resizeMode="contain" />
          ) : type === "video" ? (
            <Video source={{ uri }} style={styles.media} useNativeControls resizeMode="contain" />
          ) : type === "audio" ? (
            <Text style={styles.text}>🎵 Audio Playback</Text>
          ) : (
            <Text style={styles.text}>📄 Document</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MediaViewer;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  mediaContainer: {
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: "90%",
    maxHeight: "80%",
  },
  media: {
    width: 350,
    height: 350,
    borderRadius: 16,
  },
  text: {
    color: "white",
    padding: 12,
  },
});
