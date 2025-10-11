import { ActivityIndicator, FlatList, View, Text, TouchableOpacity } from "react-native"
import useGlobal from "../store"
import Empty from "../common/Empty"
import Cell from "../common/Cell"
import Thumbnail from "../common/Thumbnail"
import utils from "../core/utils"
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "react-native-paper"

function RequestAccept({ item }) {
	const requestAccept = useGlobal(state => state.requestAccept)

	return (
		<TouchableOpacity
			style={{
				backgroundColor: '#007AFF',
				paddingHorizontal: 20,
				height: 40,
				borderRadius: 20,
				alignItems: 'center',
				justifyContent: 'center',
				shadowColor: '#007AFF',
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.3,
				shadowRadius: 8,
				elevation: 6,
				minWidth: 90,
			}}
			onPress={() => requestAccept(item.sender.username)}
			activeOpacity={0.8}
		>
			<Text style={{ 
				color: 'white', 
				fontWeight: '600',
				fontSize: 15,
				letterSpacing: 0.5
			}}>
				Accept
			</Text>
		</TouchableOpacity>
	)
}

function RequestRow({ item }) {
	const message = 'wants to connect with you'

	return (
		<View style={{
			backgroundColor: 'rgba(255, 255, 255, 0.95)',
			marginHorizontal: 16,
			marginVertical: 6,
			borderRadius: 16,
			padding: 16,
			flexDirection: 'row',
			alignItems: 'center',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 3,
			borderWidth: 0.5,
			borderColor: 'rgba(255, 255, 255, 0.2)',
		}}>
			<View style={{
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 4,
				elevation: 3,
			}}>
				<Thumbnail
					url={item.sender.thumbnail}
					size={64}
				/>
			</View>
			
			<View style={{
				flex: 1,
				paddingHorizontal: 16,
				paddingRight: 12,
			}}>
				<Text style={{
					fontWeight: '700',
					color: '#1a1a1a',
					fontSize: 17,
					marginBottom: 4,
					letterSpacing: 0.2,
				}}>
					{item.sender.name}
				</Text>
				<Text style={{
					color: '#666',
					fontSize: 14,
					lineHeight: 18,
				}}>
					{message} 
				</Text>
				<Text style={{ 
					color: '#999', 
					fontSize: 12,
					marginTop: 2,
					fontWeight: '500',
				}}>
					{utils.formatTime(item.created)}
				</Text>
			</View>

			<RequestAccept item={item} />
		</View>
	)
}

function RequestsScreen() {
	const requestList = useGlobal(state => state.requestList)
	const theme = useTheme();

	// Show loading indicator
	if (requestList === null) {
		return (
			<LinearGradient
				colors={[theme.colors.background, theme.colors.background]}
				style={{ flex: 1 }}
			>
				<View style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center'
				}}>
					<ActivityIndicator size="large" color={theme.colors.text} />
					<Text style={{
						color: theme.colors.text,
						marginTop: 16,
						fontSize: 16,
						opacity: 0.8
					}}>
						Loading requests...
					</Text>
				</View>
			</LinearGradient>
		)
	}

	// Show empty if no requests
	if (requestList.length === 0) {
		return (
			<LinearGradient
				colors={[theme.colors.background, theme.colors.background]}
				style={{ flex: 1 }}
			>
				<Empty icon='notifications-outline' message='No Notifications' />
			</LinearGradient>
		)
	}

	// Show request list
	return (
		<LinearGradient
			colors={[theme.colors.background, theme.colors.background]}
			style={{ flex: 1 }}
		>
			<View style={{ flex: 1, paddingTop: 12 }}>
				<View style={{
					paddingHorizontal: 16,
					paddingBottom: 16,
					paddingTop: 8,
				}}>
					<Text style={{
						fontSize: 28,
						fontWeight: '800',
						color: 'white',
						marginBottom: 4,
						letterSpacing: 0.5,
					}}>
						Requests
					</Text>
					<Text style={{
						fontSize: 16,
						color: 'rgba(255, 255, 255, 0.7)',
						fontWeight: '500',
					}}>
						{requestList.length} pending connection{requestList.length === 1 ? '' : 's'}
					</Text>
				</View>

				<FlatList
					data={requestList}
					renderItem={({ item }) => (
						<RequestRow item={item} />
					)}
					keyExtractor={item => item.sender.username}
					contentContainerStyle={{
						paddingBottom: 20,
					}}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</LinearGradient>
	)
}

export default RequestsScreen