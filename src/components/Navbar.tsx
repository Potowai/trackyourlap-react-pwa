import { signOut } from 'firebase/auth'
import React, { useEffect, useState } from 'react'
import {
	FaHome,
	FaSignInAlt,
	FaSignOutAlt,
	FaTrophy,
	FaUser,
	FaUserPlus
} from 'react-icons/fa' // Import des icônes
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'

const Navbar: React.FC = () => {
	const [user, setUser] = useState(auth.currentUser)
	const navigate = useNavigate()
	const iconSize = 40
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(currentUser => {
			setUser(currentUser)
		})
		return () => unsubscribe()
	}, [])

	const handleSignOut = async () => {
		try {
			await signOut(auth)
			navigate('/login')
		} catch (error) {
			console.error('Erreur de déconnexion', error)
		}
	}

	const linkClass = (path: string) =>
		location.pathname === path ? 'text-green-500' : 'hover:text-gray-300'

	return (
		<nav className='fixed bottom-0 z-10 w-full  bg-stone-900 p-6 text-white'>
			<div className='container mx-auto flex items-center justify-between'>
				<div>
					<Link to='/' className={`text-lg font-semibold ${linkClass('/')}`}>
						<FaHome size={iconSize} />
					</Link>
				</div>
				<div className='flex items-center space-x-4'>
					{user ? (
						<>
							<Link to='/profile' className={linkClass('/profile')}>
								<FaUser size={iconSize} />
							</Link>
							<Link to='/leaderboard' className={linkClass('/leaderboard')}>
								<FaTrophy size={iconSize} />
							</Link>
							<button onClick={handleSignOut} className='hover:text-gray-300'>
								<FaSignOutAlt size={iconSize} />
							</button>
						</>
					) : (
						<>
							<Link to='/login' className={linkClass('/login')}>
								<FaSignInAlt size={iconSize} />
							</Link>
							<Link to='/signup' className={linkClass('/signup')}>
								<FaUserPlus size={iconSize} />
							</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	)
}

export default Navbar
