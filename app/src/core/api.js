// import axios from 'axios'
// import { Platform } from 'react-native'

// export const ADDRESS = Platform.OS === 'ios'
//  	? 'localhost:8000'
// 	: 'https://equal-useful-buck.ngrok-free.app'

// // export const ADDRESS = Platform.OS === 'ios'
// //  	? 'localhost:8000'
// // 	: '192.168.0.103:8000'

// const api = axios.create({
// 	baseURL: 'http://' + ADDRESS,
// 	headers: {
// 		'Content-Type': 'application/json'
// 	}
// })

// export default api

import axios from "axios";
import { Platform } from "react-native";

// Set backend address depending on platform
export const ADDRESS = Platform.select({
  ios: "localhost:8000", // iOS simulator
  // android: "192.168.0.103:8000", // Android emulator
  // For physical devices, replace with ngrok URL or LAN IP
  android: "equal-useful-buck.ngrok-free.app",
});



// Create axios instance
const api = axios.create({
  baseURL:
    Platform.OS === "android" && !ADDRESS.startsWith("http")
      ? "https://" + ADDRESS
      : ADDRESS,

});

export default api;
