import { collection, getDocs } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import { database } from '../firebaseConfig'

interface Lap {
	uid: string
	name: string
	time: string
	timestamp: {
		seconds: number
		nanoseconds: number
	}
}

interface UserScore {
	uid: string
	name: string
	bestTime: string
}

const Leaderboard: React.FC = () => {
	const [scores, setScores] = useState<UserScore[]>([])
	const [loading, setLoading] = useState(true)

	// Fonction pour convertir un temps au format HH:MM:SS en secondes
	const convertTimeToSeconds = (time: string): number => {
		if (!time) {
			return Infinity
		}
		const parts = time.split(':')
		const seconds =
			parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
		return seconds
	}

	useEffect(() => {
		const fetchScores = async () => {
			try {
				const lapsSnapshot = await getDocs(collection(database, 'laps'))
				const userScoresMap: {
					[uid: string]: { name: string; bestTime: string }
				} = {}

				lapsSnapshot.forEach(lapDoc => {
					const lapData = lapDoc.data() as Lap
					if (lapData.time && lapData.time.split(':').length === 3) {
						if (
							!userScoresMap[lapData.uid] ||
							convertTimeToSeconds(lapData.time) <
								convertTimeToSeconds(userScoresMap[lapData.uid].bestTime)
						) {
							userScoresMap[lapData.uid] = {
								name: lapData.name,
								bestTime: lapData.time
							}
						}
					}
				})

				const userScores: UserScore[] = Object.keys(userScoresMap).map(uid => ({
					uid,
					name: userScoresMap[uid].name || 'Anonymous',
					bestTime: userScoresMap[uid].bestTime
				}))

				// Trier les scores du plus rapide au plus lent
				userScores.sort(
					(a, b) =>
						convertTimeToSeconds(a.bestTime) - convertTimeToSeconds(b.bestTime)
				)

				setScores(userScores)
				setLoading(false)
			} catch (error) {
				console.error('Error fetching scores:', error)
			}
		}

		fetchScores()
	}, [])

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
				<ClipLoader color='#4A90E2' loading={loading} size={50} />
			</div>
		)
	}

	return (
		<div className='mx-6 flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
			<div className='w-full max-w-4xl rounded-lg bg-white p-8 shadow-md dark:bg-stone-800'>
				<h1 className='mb-6 text-center text-2xl font-bold'>Classement</h1>
				<table className='min-w-full bg-white dark:bg-stone-800'>
					<thead>
						<tr>
							<th className='border-b-2 border-gray-300 px-4 py-2 dark:border-stone-700'>
								Nom
							</th>
							<th className='border-b-2 border-gray-300 px-4 py-2 dark:border-stone-700'>
								Meilleur Temps
							</th>
						</tr>
					</thead>
					<tbody className='text-center'>
						{scores.map((user, index) => (
							<tr
								key={index}
								className='border-b border-gray-200 dark:border-stone-700 '
							>
								<td className='px-4 py-2'>{user.name}</td>
								<td className='px-4 py-2'>{user.bestTime}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default Leaderboard
