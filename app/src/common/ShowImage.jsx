import { Image } from "react-native"
import utils from "../core/utils"

function ShowImage({ url, size = 200 }) {
	return (
		<Image 
			source={utils.image(url)}
			style={{ 
				width: size, 
				height: size, 
				borderRadius: 12,
				overflow: 'hidden',
				backgroundColor: '#e9e9ea',
			}}
			resizeMode="cover"
		/>
	)
}

export default ShowImage