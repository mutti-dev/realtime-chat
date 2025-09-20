import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  StatusBar,
  Text,
  View,
  Image,
  Easing,
  StyleSheet,
  Dimensions
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Title from "../common/Title";

const { width, height } = Dimensions.get('window');

function SplashScreen({ navigation }) {
  // Hide the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  // Animation values
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  
  const duration = 1200;

  // Create animations
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Main floating animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -15,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotate, {
          toValue: 1,
          duration: duration * 3,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsating effect for the text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={["#0F2027", "#203A43", "#2C5364"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <Animated.View style={{ opacity: fadeIn }}>
        {/* Animated Icon with subtle shadow */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.animatedLogo,
              {
                transform: [
                  { translateY },
                  { rotate: rotateInterpolate },
                  { scale },
                ],
              },
            ]}
          >
            <Image
              source={require("../assets/chatapp_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Glow effect */}
          <View style={styles.glowEffect} />
        </View>

        {/* App Title with spacing */}
        <View style={styles.titleContainer}>
          <Title text="Chat App" color="white" style={styles.appTitle} />
          <Text style={styles.tagline}>Connect. Chat. Communicate.</Text>
        </View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />
            <Animated.View style={[styles.dot, { 
              transform: [{ scale: pulse }],
              animationDelay: '200ms'
            }]} />
            <Animated.View style={[styles.dot, { 
              transform: [{ scale: pulse }],
              animationDelay: '400ms'
            }]} />
          </View>
          
          <Animated.Text style={[styles.loadingText, { transform: [{ scale: pulse }] }]}>
            Loading your experience
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Footer with subtle branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure • Fast • Reliable</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  animatedLogo: {
    zIndex: 2,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 5,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;