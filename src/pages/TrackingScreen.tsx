import { GoogleMap, Libraries, useLoadScript } from '@react-google-maps/api'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import _ from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaPause, FaPlay, FaStop } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { auth, database } from '../firebaseConfig'

const mapContainerStyle = {
	width: '100%',
	height: '300px'
}

const libraries: Libraries = ['places']

const TrackingScreen: React.FC = () => {
	const [location, setLocation] = useState<GeolocationCoordinates | null>(null)
	const [tracking, setTracking] = useState(false)
	const [paused, setPaused] = useState(false)
	const [startTime, setStartTime] = useState<Date | null>(null)
	const [elapsedTime, setElapsedTime] = useState('00:00:00')
	const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0)
	const [totalDistance, setTotalDistance] = useState<number>(0)
	const [speed, setSpeed] = useState<number>(0)
	const [previousLocation, setPreviousLocation] =
		useState<GeolocationCoordinates | null>(null)
	const [showingLocation, setShowingLocation] = useState(false)
	const mapRef = useRef<google.maps.Map | null>(null)
	const markerRef = useRef<google.maps.Marker | null>(null)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	const { isLoaded, loadError } = useLoadScript({
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
		libraries
	})

	const debounceCalculateDistance = useCallback(
		_.debounce(
			async (start: GeolocationCoordinates, end: GeolocationCoordinates) => {
				const origin = `${start.latitude},${start.longitude}`
				const destination = `${end.latitude},${end.longitude}`

				try {
					const response = await fetch(
						`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
						{ mode: 'no-cors' }
					)
					const data = await response.json()

					if (data.rows && data.rows[0].elements[0].status === 'OK') {
						const distanceInMeters = data.rows[0].elements[0].distance.value
						const distanceInKilometers = distanceInMeters / 1000
						setTotalDistance(
							prevDistance => prevDistance + distanceInKilometers
						)
						const timeElapsedInSeconds = totalElapsedTime / 1000
						if (timeElapsedInSeconds > 0) {
							setSpeed((distanceInKilometers / timeElapsedInSeconds) * 3.6) // Convert to km/h
						}
					} else {
						console.error('Error fetching distance from Google Maps API:', data)
					}
				} catch (error) {
					console.error('Error fetching distance from Google Maps API:', error)
				}
			},
			30000
		),
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
					setLocation(position.coords)
					if (previousLocation) {
						debounceCalculateDistance(previousLocation, position.coords)
					}
					setPreviousLocation(position.coords)
				},
				error => console.error(error),
				{ enableHighAccuracy: true }
			)
			return () => navigator.geolocation.clearWatch(watchId)
		}
	}, [tracking, previousLocation, debounceCalculateDistance])

	useEffect(() => {
		if (location && mapRef.current) {
			if (markerRef.current) {
				markerRef.current.setPosition({
					lat: location.latitude,
					lng: location.longitude
				})
			} else {
				markerRef.current = new google.maps.Marker({
					position: { lat: location.latitude, lng: location.longitude },
					map: mapRef.current
				})
			}
			mapRef.current.setCenter({
				lat: location.latitude,
				lng: location.longitude
			})
		}
	}, [location])

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
				await addDoc(
					collection(database, 'laps'), // Changement ici pour la collection centrale 'laps'
					{
						uid: auth.currentUser.uid, // Ajout du champ UID
						name: auth.currentUser.displayName || auth.currentUser.email,
						position: `${location.latitude}, ${location.longitude}`,
						time: elapsedTime,
						timestamp: serverTimestamp()
					}
				)
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

	if (loadError) return <div>Error loading maps</div>
	if (!isLoaded) return <div>Loading maps...</div>

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
					<div className='mt-6'>
						<GoogleMap
							mapContainerStyle={mapContainerStyle}
							center={{ lat: location.latitude, lng: location.longitude }}
							zoom={15}
							onLoad={map => {
								mapRef.current = map
								markerRef.current = new google.maps.Marker({
									map: map,
									position: { lat: location.latitude, lng: location.longitude }
								})
							}}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default TrackingScreen
