import { Platform } from "react-native"
import ProfileImage from '../assets/profile.png'
import { ADDRESS } from "./api"

function log() {
	// Much better console.log function that formats/indents
	// objects for better reabability
	for (let i = 0; i < arguments.length; i++) {
		let arg = arguments[i]
		// Stringify and indent object
		if (typeof arg === 'object') {
			arg = JSON.stringify(arg, null, 2)
		}
		console.log(`[${Platform.OS}]`, arg)
	}
}

function thumbnail(url) {
	if (!url) {
		return ProfileImage
	}
	return {
		uri: 'https://' + ADDRESS + url
	}
}

function image(url) {
	if (!url) {
		return ProfileImage
	}
	// If url is already an object with uri (e.g. { uri }) return as-is
	if (typeof url === 'object') {
		if (url.uri) return { uri: url.uri }
		// if object contains base64/data
		if (url.base64) return { uri: `data:image/jpeg;base64,${url.base64}` }
		if (url.data && typeof url.data === 'string' && url.data.startsWith('data:')) return { uri: url.data }
		// fallback to profile image
		return ProfileImage
	}
	// url is a string
	if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://') || url.startsWith('data:'))) {
		return { uri: url }
	}
	// Server absolute path e.g. /media/...
	if (typeof url === 'string' && url.startsWith('/')) {
		return { uri: 'http://' + ADDRESS + url }
	}
	// fallback to https prefix
	return {
		uri: 'https://' + ADDRESS + url
	}
}


function formatTime(date) {
	if (date === null)  {
		return '-'
	}
	const now = new Date()
	const s = Math.abs(now - new Date(date)) / 1000
	// Seconds
	if (s < 60) {
		return 'now'
	}
	// Minutes
	if (s < 60*60) {
		const m = Math.floor(s / 60)
		return `${m}m ago`
	}
	// Hours
	if (s < 60*60*24)  {
		const h = Math.floor(s / (60*60))
		return `${h}h ago`
	}
	// Days
	if (s < 60*60*24*7)  {
		const d = Math.floor(s / (60*60*24))
		return `${d}d ago`
	}
	// Weeks
	if (s < 60*60*24*7*4)  {
		const w = Math.floor(s / (60*60*24*7))
		return `${w}w ago`
	}
	// Years
	const y = Math.floor(s / (60*60*24*365))
	return `${y}y ago`
}


function resolvePreviewUri(file) {
	// Return a uri suitable for Image source
	if (!file) return null;
	if (typeof file === 'object') {
		if (file.uri) return file.uri;
		if (file.data && file.data.startsWith('/')) return 'https://' + ADDRESS + file.data;
		if (file.data && file.data.startsWith('data:image')) return file.data;
		return null;
	}
	// string
	if (file.startsWith('http://') || file.startsWith('https://') || file.startsWith('file://') || file.startsWith('data:')) {
		return file;
	}
	// server media path like "/media/..."
	if (file.startsWith('/')) {
		return 'https://' + ADDRESS + file;
	}
	return file;
}




export default { log, thumbnail, formatTime, image, resolvePreviewUri }