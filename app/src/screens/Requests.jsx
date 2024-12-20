import { ActivityIndicator, FlatList, View, Text, TouchableOpacity } from "react-native"
import useGlobal from "../core/global"
import Empty from "../common/Empty"
import Cell from "../common/Cell"
import Thumbnail from "../common/Thumbnail"
import utils from "../core/utils"
import LinearGradient from "react-native-linear-gradient";




function RequestAccept({ item }) {
	const requestAccept = useGlobal(state => state.requestAccept)

	return (
		<LinearGradient
			colors={["#09203F", "#537895"]}
			style={{
				flex: 1,

			}}
		>
			<TouchableOpacity
				style={{
					backgroundColor: '#202020',
					paddingHorizontal: 14,
					height: 36,
					borderRadius: 18,
					alignItems: 'center',
					justifyContent: 'center'
				}}
				onPress={() => requestAccept(item.sender.username)}
			>
				<Text style={{ color: 'white', fontWeight: 'bold' }}>Accept</Text>
			</TouchableOpacity>
		</LinearGradient>
	)
}




function RequestRow({ item }) {
	const message = 'Requested to connect with you'
	//const time = '7m ago'

	return (

		<Cell>
			<LinearGradient
				colors={["#09203F", "#537895"]}
				style={{
					flex: 1,

				}}
			>
				<Thumbnail
					url={item.sender.thumbnail}
					size={76}
				/>
				<View
					style={{
						flex: 1,
						paddingHorizontal: 16
					}}
				>
					<Text
						style={{
							fontWeight: 'bold',
							color: '#202020',
							marginBottom: 4
						}}
					>
						{item.sender.name}
					</Text>
					<Text
						style={{
							color: '#606060',
						}}
					>
						{message} <Text style={{ color: '#909090', fontSize: 13 }}>
							{utils.formatTime(item.created)}
						</Text>
					</Text>
				</View>

				<RequestAccept item={item} />

			</LinearGradient>
		</Cell>


	)
}



function RequestsScreen() {
	const requestList = useGlobal(state => state.requestList)

	// Show loading indicator
	if (requestList === null) {
		return (
			<ActivityIndicator style={{ flex: 1 }} />
		)
	}

	// Show empty if no requests
	if (requestList.length === 0) {
		return (
			<Empty icon='bell' message='No requests' />
		)
	}

	// Show request list
	return (
		<LinearGradient
			colors={["#09203F", "#537895"]}
			style={{
				flex: 1,

			}}
		>
			<View style={{ flex: 1 }}>

				<FlatList
					data={requestList}
					renderItem={({ item }) => (
						<RequestRow item={item} />
					)}
					keyExtractor={item => item.sender.username}
				/>


			</View>
		</LinearGradient>
	)
}

export default RequestsScreen