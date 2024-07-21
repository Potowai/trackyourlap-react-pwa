import { signOut } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../firebaseConfig'

async function handleSignOut(): Promise<void> {
	try {
		await signOut(auth)
	} catch (error) {
		console.error('Erreur de déconnexion', error)
	}
}

function HomeScreen(): JSX.Element {
	const [user, setUser] = useState(auth.currentUser)

	useEffect(() => {
		setUser(auth.currentUser)
	}, [])

	return (
		<div className='flex min-h-screen items-center justify-center '>
			<div className='w-full max-w-md rounded-lg p-8 shadow-md'>
				<h1 className='mb-6 text-center text-2xl font-bold'>Home Screen</h1>
				{user ? (
					<div>
						<p className='mb-4 text-center'>
							Bienvenue,{' '}
							<span className='font-bold'>
								{user.displayName || user.email}
							</span>
						</p>
						<button
							type='button'
							onClick={handleSignOut}
							className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
						>
							Se déconnecter
						</button>
					</div>
				) : (
					<p className='text-center'>Aucun utilisateur connecté</p>
				)}
			</div>
		</div>
	)
}

export default HomeScreen
