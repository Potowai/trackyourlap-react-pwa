import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

// Correct the default icon issue in Leaflet

L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

interface MapProps {
	location: GeolocationCoordinates | null
}

const LeafletMap: React.FC<MapProps> = ({ location }) => {
	const [position, setPosition] = useState<[number, number]>([51.505, -0.09])

	useEffect(() => {
		if (location) {
			setPosition([location.latitude, location.longitude])
		}
	}, [location])

	return (
		<MapContainer
			center={position}
			zoom={15}
			style={{ height: '300px', width: '100%' }}
		>
			<TileLayer
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
				attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
			/>
			<Marker position={position}>
				<Popup>You are here</Popup>
			</Marker>
		</MapContainer>
	)
}

export default LeafletMap
