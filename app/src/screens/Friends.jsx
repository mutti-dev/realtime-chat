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
import Thumbnail from "../common/Thumbnail";
import utils from "../core/utils";
import { LinearGradient } from "expo-linear-gradient";
import useGlobal from "../core/global";

function FriendRow({ navigation, item }) {
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<TouchableOpacity
			onPress={() => {
				navigation.navigate("Messages", item);
			}}
			activeOpacity={0.8}
		>
			<View style={styles.friendRow}>
				<View style={styles.thumbnailShadow}>
					<Thumbnail url={item.friend.thumbnail} size={64} />
				</View>

				<View style={styles.friendInfo}>
					<Text style={styles.friendName}>{item.friend.name}</Text>
					<Text style={styles.friendPreview}>{item.preview}</Text>
					<Text style={styles.friendTime}>{utils.formatTime(item.updated)}</Text>
				</View>

				<View style={styles.statusDot} />
			</View>
		</TouchableOpacity>
	);
}

function FriendsScreen({ navigation }) {
	const friendList = useGlobal((state) => state.friendList);
	const [searchQuery, setSearchQuery] = useState("");
	const theme = useTheme();
	const styles = getStyles(theme);

	// Filter friends based on search query
	const filteredFriends = friendList
		? friendList.filter((friend) =>
			friend.friend.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: [];

	if (friendList === null) {
		return (
			<LinearGradient
				colors={[theme.colors.primary, theme.colors.background]}
				style={{ flex: 1 }}
			>
				<SafeAreaView style={{ flex: 1 }}>
					<View style={styles.loaderContainer}>
						<ActivityIndicator size="large" color={theme.colors.text} />
						<Text style={styles.loaderText}>Loading conversations...</Text>
					</View>
				</SafeAreaView>
			</LinearGradient>
		);
	}

	if (filteredFriends.length === 0 && searchQuery) {
		return (
			<LinearGradient
				colors={[theme.colors.background, theme.colors.background]}
				style={{ flex: 1 }}
			>
				<SafeAreaView style={{ flex: 1 }}>
					

					<View style={styles.searchContainer}>
						<TextInput
							style={styles.searchInput}
							placeholder="Search conversations..."
							value={searchQuery}
							placeholderTextColor={theme.colors.placeholder}
							onChangeText={setSearchQuery}
						/>
					</View>

					<View style={styles.emptySearchContainer}>
						<Text style={styles.emptyTitle}>No messages found</Text>
						<Text style={styles.emptySubtitle}>
							Try adjusting your search terms
						</Text>
					</View>
				</SafeAreaView>
			</LinearGradient>
		);
	}

	return (
		<LinearGradient
			colors={[theme.colors.background, theme.colors.background]}
			style={{ flex: 1 }}
		>
			<SafeAreaView style={{ flex: 1 }}>


				<View style={styles.searchContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search conversations..."
						placeholderTextColor={theme.colors.placeholder}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
				<View style={styles.header}>
					{/* <Text style={styles.headerTitle}>Messages</Text> */}
					<Text style={styles.headerSubtitle}>
						{filteredFriends.length} conversation
						{filteredFriends.length === 1 ? "" : "s"}
					</Text>
				</View>

				<View style={{ flex: 1, paddingTop: 8 }}>
					<FlatList
						data={filteredFriends}
						renderItem={({ item }) => (
							<FriendRow navigation={navigation} item={item} />
						)}
						keyExtractor={(item) => item.id}
						ListEmptyComponent={
							<View style={styles.emptyList}>
								<Text style={styles.emptyTitle}>No conversations yet</Text>
								<Text style={styles.emptySubtitle}>
									Start connecting with friends to see your messages here
								</Text>
							</View>
						}
						contentContainerStyle={{
							paddingBottom: 120,
							flexGrow: 1,
						}}
						showsVerticalScrollIndicator={false}
					/>
				</View>

				{/* AI Chat Floating Button */}
				{/* <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => {
            navigation.navigate("AiChat", {
              item: filteredFriends.length > 0 ? filteredFriends[0] : null,
            });
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FF6B9D", "#C44569"]}
            style={styles.floatingButtonGradient}
          >
            <Text style={styles.floatingButtonText}>AI</Text>
          </LinearGradient>
        </TouchableOpacity> */}
			</SafeAreaView>
		</LinearGradient>
	);
}

function getStyles(theme) {
	return StyleSheet.create({
		header: {
			paddingHorizontal: 16,
			paddingTop: 8,
			paddingBottom: 16,
		},
		headerTitle: {
			fontSize: 28,
			fontWeight: "800",
			color: theme.colors.title,
			marginBottom: 4,
			letterSpacing: 0.5,
		},
		headerSubtitle: {
			fontSize: 16,
			color: theme.colors.placeholder,
			fontWeight: "500",
		},
		searchContainer: {
			paddingHorizontal: 16,
			paddingBottom: 16,
		},
		searchInput: {
			backgroundColor: theme.colors.SearchBar,
			paddingHorizontal: 20,
			paddingVertical: 16,
			borderRadius: 25,
			fontSize: 16,
			color: theme.colors.text,
			borderWidth: 1,
			borderColor: theme.colors.secondary,
		},
		loaderContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		loaderText: {
			color: theme.colors.text,
			marginTop: 16,
			fontSize: 16,
			opacity: 0.8,
		},
		emptySearchContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		emptyTitle: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "600",
			marginBottom: 8,
		},
		emptySubtitle: {
			color: theme.colors.placeholder,
			fontSize: 14,
			textAlign: "center",
			paddingHorizontal: 40,
		},
		emptyList: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			paddingTop: 100,
		},
		friendRow: {
			backgroundColor: theme.colors.background,
			marginHorizontal: 10,
			marginVertical: 6,
			borderRadius: 16,
			padding: 16,
			flexDirection: "row",
			alignItems: "center",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 3,
			borderBottomWidth: 0.5,
			borderBottomColor: theme.colors.secondary,
		},
		thumbnailShadow: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 4,
			elevation: 3,
		},
		friendInfo: {
			flex: 1,
			paddingHorizontal: 16,
			paddingRight: 12,
		},
		friendName: {
			fontWeight: "700",
			color: theme.colors.title,
			fontSize: 17,
			marginBottom: 4,
			letterSpacing: 0.2,
		},
		friendPreview: {
			color: theme.colors.text,
			fontSize: 14,
			lineHeight: 18,
			marginBottom: 2,
		},
		friendTime: {
			color: theme.colors.tertiary,
			fontSize: 12,
			fontWeight: "500",
		},
		statusDot: {
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: theme.colors.button,
			opacity: 0.8,
		},
		floatingButton: {
			position: "absolute",
			bottom: 30,
			right: 20,
			width: 64,
			height: 64,
			borderRadius: 32,
			shadowColor: "#FF6B9D",
			shadowOffset: { width: 0, height: 6 },
			shadowOpacity: 0.4,
			shadowRadius: 12,
			elevation: 8,
		},
		floatingButtonGradient: {
			flex: 1,
			borderRadius: 32,
			alignItems: "center",
			justifyContent: "center",
		},
		floatingButtonText: {
			color: theme.colors.text,
			fontSize: 18,
			fontWeight: "700",
			letterSpacing: 0.5,
		},
	});
}

export default FriendsScreen;
