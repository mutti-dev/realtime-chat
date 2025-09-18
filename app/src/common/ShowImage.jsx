import { Image } from "react-native"
import utils from "../core/utils"

function ShowImage({ url, size }) {
	return (
		<Image 
			source={utils.image(url)}
			style={{ 
				width: size, 
				height: size*0.5, 
				marginLeft: 100,
				marginBottom: 50,
				marginTop: 0,
				// padding: 10,
				//
				alignContent: 'center',
				alignItems: 'center',
				justifyContent: 'center',
				
				// borderRadius: 20,
				// backgroundColor: '#e0e0e0', 
				
			}}
		/>
	)
}

export default ShowImage