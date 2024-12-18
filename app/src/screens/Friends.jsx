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
} from "react-native";
import { useTheme } from "react-native-paper";
import Cell from "../common/Cell";
import Empty from "../common/Empty";
import Thumbnail from "../common/Thumbnail";
import utils from "../core/utils";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSearch, faRobot, faArrowRight } from "@fortawesome/free-solid-svg-icons";

import useGlobal from "../core/global";

function FriendRow({ navigation, item }) {
	const theme = useTheme();
	return (
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
				<View style={styles.searchContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search your friend..."
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
				<Empty icon="search" message="No messages found" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			{/* Search Bar */}
			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search your friend..."
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
					<FontAwesomeIcon icon={faRobot} size={50} color="#00008B" />
				</TouchableOpacity>
			</View>
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
		backgroundColor: "#C0C0C0",
		alignItems: "center",
		justifyContent: "center",
		elevation: 5,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#ccc",
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
});

export default FriendsScreen;
