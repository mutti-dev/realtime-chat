import { useEffect, useRef, useState } from "react"
import {
  Modal, Animated, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Image, Dimensions, PanResponder,
  Alert
} from "react-native"

import {
  faTimes, faFile, faPaperPlane, faImage, faMicrophone,
  faVideo,
  faPlay,
  faFileText,
} from "@fortawesome/free-solid-svg-icons";
import useGlobal from "../core/global";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { useTheme } from "react-native-paper";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
const { width: screenWidth } = Dimensions.get('window');



function MessageInput({
  message,
  setMessage,
  onSend,
  onFileSend,
  theme
}) {
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const uploadFile = useGlobal(state => state.uploadFile)

  // Voice recording refs
  const recording = useRef(null);
  const recordingTimer = useRef(null);
  const microphoneScale = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording.current) {
        recording.current.stopAndUnloadAsync();
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  // Request audio permissions
  const requestAudioPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Audio recording permission is required to send voice messages.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to get audio permissions:', error);
      return false;
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Animate microphone
      Animated.loop(
        Animated.sequence([
          Animated.timing(microphoneScale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(microphoneScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Slide animation
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop and send voice recording
  const stopAndSendRecording = async () => {
    try {
      if (!recording.current) return;

      setIsRecording(false);
      clearInterval(recordingTimer.current);

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();

      if (uri && recordingDuration >= 1) {
        const voiceMessage = {
          name: `voice_${Date.now()}.m4a`,
          type: 'voice',
          uri,
          duration: recordingDuration,
          fileType: 'audio/m4a',
        };
        onFileSend(voiceMessage);
      }

      // Reset animations
      microphoneScale.setValue(1);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      recording.current = null;
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  // Cancel recording
  const cancelRecording = async () => {
    try {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      setIsRecording(false);
      setRecordingDuration(0);
      clearInterval(recordingTimer.current);

      // Reset animations
      microphoneScale.setValue(1);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  // Pan responder for voice recording
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      startRecording();
    },

    onPanResponderMove: (evt, gestureState) => {
      // Cancel if moved too far up
      if (gestureState.dy < -50) {
        cancelRecording();
      }
    },

    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy < -50) {
        // Already cancelled
        return;
      }
      stopAndSendRecording();
    },
  });

  // File selection functions
  const selectImage = async () => {
    setShowAttachmentModal(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Media library access is required to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      await processImageFile(result.assets[0]);
    }
  };



  const selectVideo = async () => {
    setShowAttachmentModal(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Media library access is required to select videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await processVideoFile(result.assets[0])
      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split('/').pop();
      setSelectedFile({
        name: fileName,
        type: 'video',
        uri: asset.uri,
        fileType: asset.type || 'video/mp4',
      });
      setShowPreview(true);
    }
  };

  const selectDocument = async () => {
    setShowAttachmentModal(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      // DocumentPicker returns { type: 'success'|'cancel', name, uri, size, mimeType }
      if (result.type === 'success') {
        await processDocumentFile(result);
        setSelectedFile({
          name: result.name,
          type: 'document',
          uri: result.uri,
          fileType: result.mimeType || 'application/octet-stream',
          size: result.size,
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Document selection error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const processImageFile = async (asset) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width || 1024, 1024) } }],
        {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      const fileName = asset.fileName || asset.uri.split('/').pop();
      setSelectedFile({
        name: fileName,
        type: 'image',
        uri: manipResult.uri,
        data: manipResult.base64,
        fileType: 'image/jpeg',
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Image processing error:', error);
      const fileName = asset.fileName || asset.uri.split('/').pop();
      setSelectedFile({
        name: fileName,
        type: 'image',
        uri: asset.uri,
        fileType: asset.type || 'image',
      });
      setShowPreview(true);
    }
  };



  const processVideoFile = async (asset) => {
    try {
      const fileName = asset.fileName || asset.uri.split('/').pop();
      setSelectedFile({
        name: fileName,
        type: 'video',
        uri: asset.uri,          // 👈 sirf URI bhejo
        fileType: 'video/mp4',
      });
      setShowPreview(true);
    } catch (err) {
      console.error('Video processing error:', err);
    }
  };

  const processDocumentFile = async (doc) => {
    try {
      setSelectedFile({
        name: doc.name,
        type: 'document',
        uri: doc.uri,            // 👈 sirf URI bhejo
        fileType: doc.mimeType || 'application/octet-stream',
        size: doc.size,
      });
      setShowPreview(true);
    } catch (err) {
      console.error('Document processing error:', err);
    }
  };


  const sendFile = () => {
    if (selectedFile) {
      onFileSend(selectedFile);
      setSelectedFile(null);
      setShowPreview(false);
    }
  };

  const cancelFileSelection = () => {
    setSelectedFile(null);
    setShowPreview(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSend = message.trim().length > 0;
  const showVoiceButton = !canSend && !isRecording;

  return (
    <>
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      }}>

        {/* Attachment Button */}
        <TouchableOpacity
          onPress={() => setShowAttachmentModal(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${theme.colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <FontAwesomeIcon icon={faFile} size={18} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Text Input */}
        <View style={{
          flex: 1,
          backgroundColor: theme.colors.searchBar,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: 20,
          minHeight: 48,
          justifyContent: 'center',
        }}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.placeholder}
            value={message}
            onChangeText={setMessage}
            style={{
              fontSize: 16,
              color: theme.colors.text,
              lineHeight: 20,
              paddingVertical: 0,
            }}
            multiline={true}
            maxLength={1000}
          />
        </View>

        {/* Send/Voice Button */}
        {showVoiceButton ? (
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              transform: [{ scale: microphoneScale }],
              marginLeft: 12,
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <FontAwesomeIcon
                icon={faMicrophone}
                size={16}
                color="white"
              />
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity
            onPress={onSend}
            disabled={!canSend}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: canSend ? theme.colors.button : theme.colors.placeholder,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 12,
              shadowColor: canSend ? theme.colors.button : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: canSend ? 3 : 0,
            }}
          >
            <FontAwesomeIcon
              icon={faPaperPlane}
              size={16}
              color="white"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <Animated.View style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: 12,
            bottom: 12,
            backgroundColor: theme.colors.level3,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: slideAnimation,
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.colors.tertiary,
              marginRight: 8,
            }} />
            <Text style={{
              color: theme.colors.text,
              fontSize: 16,
              fontWeight: '500',
            }}>
              Recording {formatDuration(recordingDuration)}
            </Text>
            <Text style={{
              color: theme.colors.placeholder,
              fontSize: 14,
              marginLeft: 16,
            }}>
              Release to send, slide up to cancel
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Attachment Modal */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: theme.colors.secondary,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 34,
          }}>
            <View style={{
              alignItems: 'center',
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}>
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: theme.colors.border,
                borderRadius: 2,
              }} />
              <Text style={{
                color: theme.colors.text,
                fontSize: 18,
                fontWeight: '600',
                marginTop: 16,
              }}>
                Select Attachment
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              {[
                { icon: faImage, label: 'Photo', onPress: selectImage, color: '#FF6B6B' },
                { icon: faVideo, label: 'Video', onPress: selectVideo, color: '#4ECDC4' },
                { icon: faFileText, label: 'Document', onPress: selectDocument, color: '#45B7D1' },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: `${item.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <FontAwesomeIcon icon={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={{
                    color: theme.colors.text,
                    fontSize: 16,
                    fontWeight: '500',
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowAttachmentModal(false)}
              style={{
                marginTop: 16,
                marginHorizontal: 20,
                paddingVertical: 12,
                alignItems: 'center',
                backgroundColor: theme.colors.level3,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: theme.colors.text, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={cancelFileSelection}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: screenWidth - 40,
            maxHeight: '80%',
            backgroundColor: theme.colors.secondary,
            borderRadius: 16,
            padding: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                color: theme.colors.text,
                fontSize: 18,
                fontWeight: '600',
              }}>
                Preview
              </Text>
              <TouchableOpacity onPress={cancelFileSelection}>
                <FontAwesomeIcon icon={faTimes} size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={{ alignItems: 'center' }}>
                {selectedFile.type === 'image' ? (
                  <Image
                    source={{ uri: selectedFile.uri }}
                    style={{
                      width: screenWidth - 80,
                      height: 200,
                      borderRadius: 12,
                      marginBottom: 16,
                    }}
                    resizeMode="cover"
                  />
                ) : selectedFile.type === 'video' ? (
                  <View style={{
                    width: screenWidth - 80,
                    height: 200,
                    backgroundColor: theme.colors.level3,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <FontAwesomeIcon icon={faPlay} size={40} color={theme.colors.text} />
                  </View>
                ) : (
                  <View style={{
                    width: screenWidth - 80,
                    height: 120,
                    backgroundColor: theme.colors.level3,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <FontAwesomeIcon icon={faFileText} size={40} color={theme.colors.text} />
                  </View>
                )}

                <Text style={{
                  color: theme.colors.text,
                  fontSize: 16,
                  textAlign: 'center',
                  marginBottom: 20,
                }}>
                  {selectedFile.name}
                </Text>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  width: '100%',
                }}>
                  <TouchableOpacity
                    onPress={cancelFileSelection}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      marginRight: 10,
                      backgroundColor: theme.colors.level3,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: theme.colors.text, fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={sendFile}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      marginLeft: 10,
                      backgroundColor: theme.colors.primary,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

export default MessageInput;


