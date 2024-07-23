import { collection, getDocs } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import { auth, database } from '../firebaseConfig'

interface Lap {
	position: {
		_lat: number
		_long: number
	}
	time: string
	timestamp: {
		seconds: number
		nanoseconds: number
	}
}

function ProfileScreen() {
	const [user, setUser] = useState(auth.currentUser)
	const [scores, setScores] = useState<Lap[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(currentUser => {
			setUser(currentUser)
			if (currentUser) {
				fetchScores(currentUser.uid)
			}
		})
		return () => unsubscribe()
	}, [])

	const fetchScores = async (uid: string) => {
		setLoading(true)
		try {
			const lapsCollection = collection(database, 'users', uid, 'laps')
			const lapsSnapshot = await getDocs(lapsCollection)
			const lapsData = lapsSnapshot.docs
				.map(doc => doc.data() as Lap)
				.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
			setScores(lapsData)
		} catch (error) {
			console.error('Error fetching scores:', error)
		}
		setLoading(false)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
			<div className='w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-stone-800'>
				<h1 className='mb-6 text-center text-2xl font-bold'>Profil</h1>
				{user ? (
					<div className='text-center'>
						{user.photoURL && (
							<img
								src={user.photoURL}
								alt='User Profile'
								className='mx-auto mb-4 h-32 w-32 rounded-full'
							/>
						)}
						<p className='mb-4'>
							Nom d'utilisateur: {user.displayName || user.email}
						</p>
						<h2 className='text-xl font-semibold'>Scores</h2>
						{loading ? (
							<ClipLoader color='#4A90E2' loading={loading} size={50} />
						) : (
							<ul className='mt-4 space-y-2'>
								{scores.map((score, index) => (
									<li
										key={index}
										className='rounded-md bg-stone-100 p-2 dark:bg-stone-900'
									>
										<p>
											Position:{' '}
											{`Lat: ${score.position._lat}, Long: ${score.position._long}`}
										</p>
										<p>Time: {score.time}</p>
										<p>
											Date:{' '}
											{new Date(
												score.timestamp.seconds * 1000
											).toLocaleString()}
										</p>
									</li>
								))}
							</ul>
						)}
					</div>
				) : (
					<p className='text-center'>Aucun utilisateur connecté</p>
				)}
			</div>
		</div>
	)
}

export default ProfileScreen
