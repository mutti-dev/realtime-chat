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
import useGlobal from "../core/global";

function FriendRow({ navigation, item }) {

	console.log("🎄Item", item);
	const theme = useTheme();
	const styles = getStyles(theme);

	return (
		<TouchableOpacity
			onPress={() => {
				navigation.navigate("Messages", item);
			}}
			activeOpacity={0.6}
			style={styles.friendRowContainer}
		>
			<View style={styles.friendRow}>
				<View style={styles.thumbnailContainer}>
					<Thumbnail url={item.friend.thumbnail_url} size={56} />
				</View>

				<View style={styles.friendInfo}>
					<Text style={styles.friendName}>{item.friend.name}</Text>
					<Text style={styles.friendPreview} numberOfLines={1}>
						{item.preview}
					</Text>
				</View>

				<View style={styles.timeContainer}>
					<Text style={styles.friendTime}>{utils.formatTime(item.updated)}</Text>
				</View>
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
			<SafeAreaView style={styles.container}>
				<View style={styles.loaderContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loaderText}>Loading conversations...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (filteredFriends.length === 0 && searchQuery) {
		return (
			<SafeAreaView style={styles.container}>
				

				<View style={styles.searchContainer}>
					<View style={styles.searchInputContainer}>
						<Text style={styles.searchIcon}>🔍</Text>
						<TextInput
							style={styles.searchInput}
							placeholder="Search"
							value={searchQuery}
							placeholderTextColor={theme.colors.placeholder}
							onChangeText={setSearchQuery}
						/>
					</View>
				</View>

				<View style={styles.emptySearchContainer}>
					<Text style={styles.emptyTitle}>No messages found</Text>
					<Text style={styles.emptySubtitle}>
						Try adjusting your search terms
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			

			<View style={styles.searchContainer}>
				<View style={styles.searchInputContainer}>
					<Text style={styles.searchIcon}>🔍</Text>
					<TextInput
						style={styles.searchInput}
						placeholder="Search"
						placeholderTextColor={theme.colors.placeholder}
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
			</View>

			<View style={styles.listContainer}>
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
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
				/>
			</View>

			{/* Floating Action Button */}
			<TouchableOpacity
				style={styles.floatingButton}
				onPress={() => {
					// Handle new chat action
					console.log("New chat pressed");
				}}
				activeOpacity={0.8}
			>
				<Text style={styles.floatingButtonText}>+</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
}

function getStyles(theme) {
	return StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingHorizontal: 20,
			paddingTop: 20,
			paddingBottom: 16,
		},
		headerTitle: {
			fontSize: 34,
			fontWeight: '700',
			color: '#000000',
			letterSpacing: -0.5,
		},
		searchContainer: {
			marginTop: 30,
			paddingHorizontal: 20,
			paddingBottom: 16,
		},
		searchInputContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.searchBar,
			borderRadius: 12,
			paddingHorizontal: 12,
			paddingVertical: 10,
		},
		searchIcon: {
			fontSize: 16,
			marginRight: 8,
			opacity: 0.6,
		},
		searchInput: {
			flex: 1,
			fontSize: 17,
			color: '#000000',
		},
		loaderContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
		loaderText: {
			color: '#666666',
			marginTop: 16,
			fontSize: 16,
		},
		emptySearchContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		},
		emptyTitle: {
			color: '#000000',
			fontSize: 18,
			fontWeight: '600',
			marginBottom: 8,
		},
		emptySubtitle: {
			color: '#666666',
			fontSize: 14,
			textAlign: 'center',
			paddingHorizontal: 40,
		},
		listContainer: {
			flex: 1,
		},
		listContent: {
			flexGrow: 1,
			paddingBottom: 100,
		},
		emptyList: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			paddingTop: 100,
		},
		friendRowContainer: {
			backgroundColor: theme.colors.level3,
		},
		friendRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 20,
			paddingVertical: 12,
		},
		thumbnailContainer: {
			marginRight: 16,
		},
		friendInfo: {
			flex: 1,
			justifyContent: 'center',
		},
		friendName: {
			fontSize: 17,
			fontWeight: '600',
			color: theme.colors.text,
			marginBottom: 2,
		},
		friendPreview: {
			fontSize: 15,
			color: '#8E8E93',
			lineHeight: 20,
		},
		timeContainer: {
			alignItems: 'flex-end',
			justifyContent: 'center',
		},
		friendTime: {
			fontSize: 15,
			color: '#8E8E93',
			fontWeight: '400',
		},
		separator: {
			height: StyleSheet.hairlineWidth,
			backgroundColor: '#E5E5EA',
			marginLeft: 92, // Align with text content
		},
		floatingButton: {
			position: 'absolute',
			bottom: 34,
			right: 20,
			width: 56,
			height: 56,
			borderRadius: 28,
			backgroundColor: '#007AFF',
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#007AFF',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.3,
			shadowRadius: 12,
			elevation: 8,
		},
		floatingButtonText: {
			color: '#FFFFFF',
			fontSize: 24,
			fontWeight: '400',
			lineHeight: 24,
		},
	});
}

export default FriendsScreen;