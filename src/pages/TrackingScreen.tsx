import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaPause, FaPlay, FaStop } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { auth, database } from '../firebaseConfig'

const TrackingScreen: React.FC = () => {
	const [location, setLocation] = useState<GeolocationCoordinates | null>(null)
	const [tracking, setTracking] = useState(false)
	const [paused, setPaused] = useState(false)
	const [startTime, setStartTime] = useState<Date | null>(null)
	const [elapsedTime, setElapsedTime] = useState('00:00:00')
	const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0)
	const timerRef = useRef<NodeJS.Timeout | null>(null) // Utilisation de useRef pour le timer

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
				position => setLocation(position.coords),
				error => console.error(error),
				{ enableHighAccuracy: true }
			)
			return () => navigator.geolocation.clearWatch(watchId)
		}
	}, [tracking])

	const startTracking = () => {
		setStartTime(new Date())
		setTracking(true)
		setPaused(false)
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
	}

	const sendTime = async () => {
		if (auth.currentUser && location) {
			try {
				await addDoc(
					collection(database, 'users', auth.currentUser.uid, 'laps'),
					{
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

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
			<div className='w-full max-w-lg rounded-lg bg-white p-8 shadow-md dark:bg-stone-800'>
				<div className='mb-6 flex items-center justify-between'>
					<div className='text-center'>
						<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
							TIME
						</p>
						<p className='text-3xl font-bold'>{elapsedTime}</p>
					</div>
					<div className='text-center'>
						<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
							HEART RATE
						</p>
						<p className='text-3xl font-bold'>148 BPM</p> {/* Example value */}
					</div>
				</div>
				<div className='mb-6 text-center'>
					<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
						CURRENT SPEED
					</p>
					<p className='text-6xl font-bold'>37.7 KM/H</p> {/* Example value */}
				</div>
				<div className='mb-6 text-center'>
					<p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
						DISTANCE
					</p>
					<p className='text-4xl font-bold'>57.1 KM</p> {/* Example value */}
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
					<button className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-600 text-white shadow-md focus:outline-none'>
						<FaMapMarkerAlt size={24} />
					</button>
				</div>
				<button
					onClick={sendTime}
					className='mt-4 w-full rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
				>
					Envoyer le temps
				</button>
			</div>
		</div>
	)
}

export default TrackingScreen
