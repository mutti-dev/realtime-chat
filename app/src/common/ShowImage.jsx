import { Image } from "react-native"
import utils from "../core/utils"

function ShowImage({ url, size }) {
	return (
		<Image 
			source={utils.image(url)}
			style={{ 
				width: size, 
				height: size*1.5, 
				borderRadius: 20,
				backgroundColor: '#e0e0e0', 
				
			}}
		/>
	)
}

export default ShowImage