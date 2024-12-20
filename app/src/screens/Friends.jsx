import React, { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Image
} from "react-native";
import { useTheme } from "react-native-paper";
import Cell from "../common/Cell";
import Empty from "../common/Empty";
import Thumbnail from "../common/Thumbnail";
import utils from "../core/utils";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSearch, faRobot, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import LinearGradient from "react-native-linear-gradient";
import LottieView from 'lottie-react-native';
import useGlobal from "../core/global";

function FriendRow({ navigation, item }) {
	const theme = useTheme();
	return (

		<LinearGradient
			colors={[theme.colors.primary, theme.colors.primary]}
			style={{
				flex: 1,

			}}
		>

			<TouchableOpacity
				onPress={() => {
					navigation.navigate("Messages", item);
				}}
			>
				<Cell>
					<Thumbnail url={item.friend.thumbnail} size={76} />
					<View style={{ flex: 1, paddingHorizontal: 16 }}>
						<Text
							style={{
								fontWeight: "bold",
								color: theme.colors.text,
								marginBottom: 4,
							}}
						>
							{item.friend.name}
						</Text>
						<Text style={{ color: theme.colors.text }}>
							{item.preview}{" "}
							<Text style={{ color: theme.colors.text, fontSize: 13 }}>
								{utils.formatTime(item.updated)}
							</Text>
						</Text>
					</View>
				</Cell>
			</TouchableOpacity>
		</LinearGradient>
	);
}

function FriendsScreen({ navigation, item }) {
	const friendList = useGlobal((state) => state.friendList);
	const [searchQuery, setSearchQuery] = useState("");
	const theme = useTheme();

	// Filter friends based on search query
	const filteredFriends = friendList
		? friendList.filter((friend) =>
			friend.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: [];

	if (friendList === null) {
		return <ActivityIndicator style={{ flex: 1 }} />;
	}

	if (filteredFriends.length === 0 && searchQuery) {

		return (
			<SafeAreaView style={{ flex: 1 }}>
				<LinearGradient
					colors={["#1A434E", "#1A434E"]}
					style={{
						flex: 1,

					}}
				>
					<View style={styles.searchContainer}>
						<TextInput
							style={styles.searchInput}
							placeholder="Search your friend..."
							value={searchQuery}
							placeholderTextColor={theme.colors.placeholder}
							onChangeText={setSearchQuery}
						/>
						{/* <TouchableOpacity
						style={styles.searchButton}
						onPress={() => {}}
					>
						<FontAwesomeIcon icon={faArrowRight} size={24} color="#fff" />
					</TouchableOpacity> */}
					</View>
					<Empty icon="search" message="No messages found" />
				</LinearGradient>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<LinearGradient
				colors={[theme.colors.background, theme.colors.background]}
				style={{
					flex: 1,
				}}
			>
				<View style={styles.searchContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search your friend..."
						placeholderTextColor={theme.colors.placeholder}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
					{/* <TouchableOpacity
					style={styles.searchButton}
					onPress={() => {}}
				>
					<FontAwesomeIcon icon={faArrowRight} size={24} color="#fff" />
				</TouchableOpacity> */}
				</View>

				{/* List of Friends */}
				<FlatList
					data={filteredFriends}
					renderItem={({ item }) => (
						<FriendRow navigation={navigation} item={item} />
					)}
					keyExtractor={(item) => item.id}
					ListEmptyComponent={<Empty icon="inbox" message="No friends to display" />}
				/>

				{/* Floating Buttons */}
				<View style={styles.floatingButtonContainer}>
					<TouchableOpacity
						style={styles.smallButton}
						onPress={() => {
							navigation.navigate("AiChat", {
								item: filteredFriends.length > 0 ? filteredFriends[0] : null, // or pass a specific friend if desired
							});
						}}
					>
						{/* <FontAwesomeIcon icon={faRobot} size={50} color="#00008B" /> */}
						{/* <Image
							source={require('../assets/icon.png')}
							style={{
								width: 100,
								height: 80,

							}}

						/> */}

						<LottieView
							source={require('../assets/iconn.json')} // Update to your Lottie JSON path
							autoPlay
							loop
							style={styles.lottie}
						/>
					</TouchableOpacity>
				</View>

			</LinearGradient>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	floatingButtonContainer: {
		position: "absolute",
		bottom: 100,
		right: 20,
		alignItems: "center",
	},
	smallButton: {
		width: 70,
		height: 70,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "grey",
		// opacity:0.2,
	},
	searchInput: {
		flex: 1,
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 18,
	},
	searchButton: {
		padding: 8,
		backgroundColor: "#6200ee",
		borderRadius: 5,
		marginLeft: 10,
	},
	lottie: {
		width: 250, // Adjust to match your design
		height: 150,
	},
});

export default FriendsScreen;
