import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ClipLoader from 'react-spinners/ClipLoader'
import { auth } from '../firebaseConfig'

function HomeScreen(): JSX.Element {
	const [user, setUser] = useState(auth.currentUser)
	const [loading, setLoading] = useState(true)
	const navigate = useNavigate()

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(currentUser => {
			setUser(currentUser)
			setLoading(false)
		})
		return () => unsubscribe()
	}, [])

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
				<ClipLoader color='#4A90E2' loading={loading} size={50} />
			</div>
		)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
			<div className='max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-stone-800'>
				{user ? (
					<div className='text-center'>
						<p className='mb-4 text-2xl'>
							Bienvenue,{' '}
							<span className='font-bold'>
								{user.displayName || user.email}
							</span>
						</p>

						<Link
							to='/track'
							className='mb-4 block text-indigo-600 hover:underline'
						>
							<button
								type='button'
								className='mb-2 w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-2xl text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
							>
								TRAQUE
							</button>
						</Link>
					</div>
				) : (
					<p className='text-center'>Aucun utilisateur connecté</p>
				)}
			</div>
		</div>
	)
}

export default HomeScreen
