import {
	addDoc,
	collection,
	doc,
	getDoc,
	serverTimestamp,
	setDoc
} from 'firebase/firestore'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import _ from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaPause, FaPlay, FaStop } from 'react-icons/fa'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { toast } from 'react-toastify'
import { auth, database } from '../firebaseConfig'

// Correct the default icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
	iconUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
	shadowUrl:
		'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

const mapContainerStyle = {
	width: '100%',
	height: '300px'
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
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	const debounceCalculateDistance = useCallback(
		_.debounce((start: number[], end: number[]) => {
			const toRadians = (degrees: number) => degrees * (Math.PI / 180)
			const R = 6371e3 // Radius of Earth in meters
			const φ1 = toRadians(start[0])
			const φ2 = toRadians(end[0])
			const Δφ = toRadians(end[0] - start[0])
			const Δλ = toRadians(end[1] - start[1])
			const a =
				Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
				Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
			const distance = R * c
			setTotalDistance(prevDistance => prevDistance + distance / 1000)
			const timeElapsedInSeconds = totalElapsedTime / 1000
			if (timeElapsedInSeconds > 0) {
				setSpeed((distance / timeElapsedInSeconds) * 3.6) // Convert to km/h
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
					const newLocation: number[] = [
						position.coords.latitude,
						position.coords.longitude
					]
					setLocation(newLocation)
					if (previousLocation) {
						debounceCalculateDistance(previousLocation, newLocation)
					}
					setPreviousLocation(newLocation)
				},
				error => console.error(error),
				{ enableHighAccuracy: true }
			)
			return () => navigator.geolocation.clearWatch(watchId)
		}
	}, [tracking, previousLocation, debounceCalculateDistance])

	const startTracking = () => {
		setStartTime(new Date())
		setTracking(true)
		setPaused(false)
		setTotalDistance(0)
		setSpeed(0)
		setPreviousLocation(null)
		setShowingLocation(false)
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
	}

	const sendTime = async () => {
		if (auth.currentUser && location) {
			try {
				const lapData = {
					position: `${location[0]}, ${location[1]}`,
					time: elapsedTime,
					timestamp: serverTimestamp(),
					uid: auth.currentUser.uid,
					name: auth.currentUser.displayName || auth.currentUser.email
				}

				await addDoc(
					collection(database, `users/${auth.currentUser.uid}/laps`),
					lapData
				)
				// Check if this is the best time and update the bestTimes collection
				const bestTimeDocRef = doc(database, 'bestTimes', auth.currentUser.uid)
				const bestTimeDoc = await getDoc(bestTimeDocRef)

				if (
					!bestTimeDoc.exists() ||
					convertTimeToSeconds(elapsedTime) <
						convertTimeToSeconds(bestTimeDoc.data()?.time)
				) {
					await setDoc(bestTimeDocRef, lapData)
				}
				toast.success('Time sent successfully!')
			} catch (error) {
				console.error('Error sending time:', error)
				toast.error('Error sending time.')
			}
		} else {
			toast.error('User not authenticated or location not available.')
		}
	}

	const showLocation = () => {
		setShowingLocation(true)
	}

	const convertTimeToSeconds = (time: string): number => {
		const parts = time.split(':')
		const seconds =
			parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
		return seconds
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
						onClick={showLocation}
						className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-600 text-white shadow-md focus:outline-none'
					>
						<FaMapMarkerAlt size={24} />
					</button>
				</div>
				<button
					onClick={sendTime}
					className='mt-4 w-full rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
				>
					Envoyer le temps
				</button>
				{showingLocation && location && (
					<div className='mt-6 h-80'>
						<MapContainer
							center={location as LatLngExpression}
							zoom={15}
							style={{ minHeight: '150px', height: '100%' }}
						>
							<TileLayer
								url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							/>
							<Marker position={location as LatLngExpression}>
								<Popup>Vous êtes ici</Popup>
							</Marker>
						</MapContainer>
					</div>
				)}
			</div>
		</div>
	)
}

export default TrackingScreen
