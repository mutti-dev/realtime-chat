import React from "react";
import {Text, View, StyleSheet, ActivityIndicator } from "react-native";

const CustomLoader = ({ message = "Loading..." }) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#6200EE" />
      <Text style={styles.loaderText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ffffff",
  },
});

export default CustomLoader;
