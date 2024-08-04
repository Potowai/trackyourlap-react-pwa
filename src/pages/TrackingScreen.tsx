import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import _ from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaPause, FaPlay, FaStop } from 'react-icons/fa'
import {
	MapContainer,
	Marker,
	Polyline,
	TileLayer,
	useMapEvents
} from 'react-leaflet'
import { toast } from 'react-toastify'
import { auth, database } from '../firebaseConfig'

const icon = L.icon({
	iconUrl:
		'https://firebasestorage.googleapis.com/v0/b/trackyourlap-999c1.appspot.com/o/location-pin.png?alt=media&token=4c30be9f-b8ec-4c0f-a617-fb7637ee8b0b',
	iconSize: [45, 45]
})

const portes = [
	{ name: 'Chez Alexis :)', coordinates: [47.2645632, -1.523712] },
	{ name: "Porte de l'Estuaire", coordinates: [47.2, -1.6125] },
	{ name: 'Porte de Saint-Herblain', coordinates: [47.2167, -1.6208] },
	{ name: "Porte d'Atlantis", coordinates: [47.2333, -1.6083] },
	{ name: "Porte d'Ar Mor", coordinates: [47.2375, -1.5958] },
	{ name: 'Porte de Chézine', coordinates: [47.25, -1.5792] },
	{ name: 'Porte de Sautron', coordinates: [47.2583, -1.5667] },
	{ name: "Porte d'Orvault", coordinates: [47.2667, -1.55] },
	{ name: 'Porte de Rennes', coordinates: [47.2833, -1.5417] },
	{ name: 'Porte de Gesvres', coordinates: [47.3, -1.5333] },
	{ name: 'Porte de La Chapelle', coordinates: [47.3083, -1.525] },
	{ name: 'Porte de la Beaujoire', coordinates: [47.3167, -1.5083] },
	{ name: 'Porte de Carquefou', coordinates: [47.3333, -1.5] },
	{ name: 'Porte de Sainte-Luce', coordinates: [47.35, -1.4917] },
	{ name: "Porte d'Anjou", coordinates: [47.3667, -1.4833] },
	{ name: 'Porte du Vignoble', coordinates: [47.3833, -1.475] },
	{ name: 'Porte de Goulaine', coordinates: [47.4, -1.4667] },
	{ name: 'Porte de Saint-Sébastien', coordinates: [47.4167, -1.4583] },
	{ name: 'Porte de Vertou', coordinates: [47.4333, -1.45] },
	{ name: 'Porte des Sorinières', coordinates: [47.45, -1.4417] },
	{ name: 'Porte de Rezé', coordinates: [47.4667, -1.4333] },
	{ name: 'Porte de Retz', coordinates: [47.4833, -1.425] },
	{ name: 'Porte de Grand Lieu', coordinates: [47.5, -1.4167] },
	{ name: 'Porte de Bouguenais', coordinates: [47.1806, -1.6078] }
]

const distanceThreshold = 0.05 // Distance en kilomètres pour détecter l'entrée/sortie d'une porte

function haversineDistance(
	[lat1, lon1]: number[],
	[lat2, lon2]: number[]
): number {
	const R = 6371 // Rayon de la Terre en kilomètres
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

const TrackingScreen: React.FC = () => {
	const [location, setLocation] = useState<number[] | null>(null)
	const [tracking, setTracking] = useState(false)
	const [paused, setPaused] = useState(false)
	const [startTime, setStartTime] = useState<Date | null>(null)
	const [elapsedTime, setElapsedTime] = useState('00:00:00')
	const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0)
	const [totalDistance, setTotalDistance] = useState<number>(0)
	const [speed, setSpeed] = useState<number>(0)
	const [previousLocation, setPreviousLocation] = useState<number[] | null>(
		null
	)
	const [showingLocation, setShowingLocation] = useState(false)
	const [trackStarted, setTrackStarted] = useState(false)
	const [startPorte, setStartPorte] = useState<string | null>(null)
	const [trackPath, setTrackPath] = useState<number[][]>([])
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	const debounceCalculateDistance = useCallback(
		_.debounce((start: number[], end: number[]) => {
			const distanceInKilometers = haversineDistance(start, end)
			setTotalDistance(prevDistance => prevDistance + distanceInKilometers)
			const timeElapsedInSeconds = totalElapsedTime / 1000
			if (timeElapsedInSeconds > 0) {
				setSpeed((distanceInKilometers / timeElapsedInSeconds) * 3.6) // Convert to km/h
			}
		}, 30000),
		[totalElapsedTime]
	)

	useEffect(() => {
		if (tracking && startTime && !paused) {
			timerRef.current = setInterval(() => {
				const now = new Date().getTime()
				const diff = now - startTime.getTime() + totalElapsedTime
				const hours = Math.floor(diff / (1000 * 60 * 60))
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
				const seconds = Math.floor((diff % (1000 * 60)) / 1000)
				setElapsedTime(
					`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
				)
			}, 1000)
		} else if (timerRef.current) {
			clearInterval(timerRef.current)
		}
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}, [tracking, startTime, paused, totalElapsedTime])

	useEffect(() => {
		if (tracking) {
			const watchId = navigator.geolocation.watchPosition(
				position => {
					const { latitude, longitude } = position.coords
					setLocation([latitude, longitude])
					if (previousLocation) {
						debounceCalculateDistance(previousLocation, [latitude, longitude])
					}
					setPreviousLocation([latitude, longitude])
				},
				error => console.error(error),
				{ enableHighAccuracy: true }
			)
			return () => navigator.geolocation.clearWatch(watchId)
		}
	}, [tracking, previousLocation, debounceCalculateDistance])

	const validateTrack = () => {
		if (startPorte && trackPath.length > 1) {
			const startCoords = portes.find(p => p.name === startPorte)?.coordinates
			const endCoords = trackPath[trackPath.length - 1]

			if (
				startCoords &&
				haversineDistance(startCoords, endCoords) < distanceThreshold
			) {
				saveLap()
			}
		}
	}

	const saveLap = async () => {
		if (auth.currentUser && trackPath.length > 0) {
			try {
				await addDoc(
					collection(database, 'users', auth.currentUser.uid, 'laps'),
					{
						position: trackPath[trackPath.length - 1],
						time: elapsedTime,
						timestamp: serverTimestamp(),
						uid: auth.currentUser.uid
					}
				)
				setTrackStarted(false)
				setStartPorte(null)
				setTrackPath([])
				toast.success('Tour validé et temps enregistré!')
			} catch (error) {
				console.error('Error saving lap:', error)
				toast.error("Erreur lors de l'enregistrement du temps.")
			}
		}
	}

	const startTracking = () => {
		setStartTime(new Date())
		setTracking(true)
		setPaused(false)
		setTotalDistance(0)
		setSpeed(0)
		setPreviousLocation(null)
		setShowingLocation(false)
		setTrackPath([])
	}

	const pauseTracking = () => {
		setPaused(true)
		setTotalElapsedTime(
			prevTime =>
				prevTime + (new Date().getTime() - (startTime?.getTime() || 0))
		)
		setStartTime(null)
	}

	const stopTracking = () => {
		setTracking(false)
		setPaused(false)
		setStartTime(null)
		setElapsedTime('00:00:00')
		setTotalElapsedTime(0)
		setTotalDistance(0)
		setSpeed(0)
		setPreviousLocation(null)
		setShowingLocation(false)
		setTrackStarted(false)
		setStartPorte(null)
		setTrackPath([])
	}

	const TrackMap = () => {
		useMapEvents({
			locationfound: (e: { latlng: { lat: any; lng: any } }) => {
				const { lat, lng } = e.latlng
				setTrackPath(prev => [...prev, [lat, lng]])

				if (!trackStarted) {
					const porte = portes.find(
						p =>
							haversineDistance(p.coordinates, [lat, lng]) < distanceThreshold
					)
					if (porte) {
						setStartPorte(porte.name)
						setTrackStarted(true)
						toast.info(`Vous avez commencé à la ${porte.name}`)
					}
				} else {
					validateTrack()
				}
			}
		})

		return null
	}

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
			<div className='w-full max-w-lg p-8'>
				<div className='mb-6 text-center'>
					<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
						TIME
					</p>
					<p className='text-3xl font-bold'>{elapsedTime}</p>
				</div>
				<div className='mb-6 text-center'>
					<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
						CURRENT SPEED
					</p>
					<p className='text-6xl font-bold'>{speed.toFixed(1)} KM/H</p>
				</div>
				<div className='mb-6 text-center'>
					<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
						DISTANCE
					</p>
					<p className='text-4xl font-bold'>{totalDistance.toFixed(2)} KM</p>
				</div>
				<div className='mb-4 flex justify-around'>
					<button
						onClick={stopTracking}
						className='flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-md focus:outline-none'
					>
						<FaStop size={24} />
					</button>
					{tracking && !paused ? (
						<button
							onClick={pauseTracking}
							className='flex h-16 w-16 items-center justify-center rounded-full bg-yellow-600 text-white shadow-md focus:outline-none'
						>
							<FaPause size={24} />
						</button>
					) : (
						<button
							onClick={startTracking}
							className='flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md focus:outline-none'
						>
							<FaPlay size={24} />
						</button>
					)}
					<button
						onClick={() => setShowingLocation(!showingLocation)}
						className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-600 text-white shadow-md focus:outline-none'
					>
						<FaMapMarkerAlt size={24} />
					</button>
				</div>
				{showingLocation && (
					<MapContainer
						style={{ height: '300px', width: '100%' }}
						center={location as [number, number]}
						zoom={13}
						scrollWheelZoom={false}
					>
						<TileLayer
							url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
							attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
						/>
						{location && (
							<Marker icon={icon} position={location as [number, number]} />
						)}
						<Polyline
							positions={trackPath as [number, number][]}
							color='blue'
						/>
						<TrackMap />
					</MapContainer>
				)}
			</div>
		</div>
	)
}

export default TrackingScreen
