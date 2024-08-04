import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { FaMoon, FaSun } from 'react-icons/fa'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Leaderboard from './components/Leaderboard'
import Navbar from './components/Navbar'
import { auth } from './firebaseConfig'
import ErrorScreen from './pages/ErrorScreen'
import HomeScreen from './pages/HomeScreen'
import LoginScreen from './pages/LoginScreen'
import ProfileScreen from './pages/ProfileScreen'
import SignUpScreen from './pages/SignUpScreen'
import TrackingScreen from './pages/TrackingScreen'

function App(): JSX.Element {
	const [user, setUser] = useState(auth.currentUser)
	const [loading, setLoading] = useState(true)
	const [darkMode, setDarkMode] = useState(true)
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
	const [installable, setInstallable] = useState(false)

	useEffect((): (() => void) => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			setUser(currentUser)
			setLoading(false)
		})
		return () => unsubscribe()
	}, [])

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [darkMode])

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: any) => {
			e.preventDefault()
			setDeferredPrompt(e)
			setInstallable(true)
			toast.info(
				"Cliquez sur le bouton de téléchargement pour installer l'application.",
				{
					autoClose: false
				}
			)
		}

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

		return () => {
			window.removeEventListener(
				'beforeinstallprompt',
				handleBeforeInstallPrompt
			)
		}
	}, [])

	const handleInstallClick = () => {
		if (deferredPrompt) {
			deferredPrompt.prompt()
			deferredPrompt.userChoice.then((choiceResult: any) => {
				if (choiceResult.outcome === 'accepted') {
					console.log('User accepted the install prompt')
				} else {
					console.log('User dismissed the install prompt')
				}
				setDeferredPrompt(null)
				setInstallable(false)
			})
		}
	}

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
				<ClipLoader color='#4A90E2' loading={loading} size={50} />
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-stone-100 pb-16 text-gray-900 dark:bg-stone-900 dark:text-gray-100'>
			<button
				onClick={() => setDarkMode(!darkMode)}
				className='absolute right-4 top-4 rounded '
			>
				{darkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
			</button>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<HomeScreen />} />
					<Route path='/login' element={<LoginScreen />} />
					<Route path='/signup' element={<SignUpScreen />} />
					<Route
						path='/profile'
						element={user ? <ProfileScreen /> : <Navigate to='/' />}
					/>
					<Route
						path='/leaderboard'
						element={user ? <Leaderboard /> : <Navigate to='/' />}
					/>
					<Route
						path='/track'
						element={user ? <TrackingScreen /> : <Navigate to='/' />}
					/>
					<Route path='/marker-icon-2x.png' />
					<Route path='/marker-icon.png' />
					<Route path='/error' element={<ErrorScreen />} />
					<Route path='*' element={<Navigate to='/error' />} />
				</Routes>
				<Navbar />
			</BrowserRouter>
			{installable && (
				<div className='fixed bottom-4 right-4'>
					<button
						onClick={handleInstallClick}
						className='flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-white shadow-md focus:outline-none'
					>
						Installer l'application
					</button>
				</div>
			)}
			<ToastContainer />
		</div>
	)
}

export default App
