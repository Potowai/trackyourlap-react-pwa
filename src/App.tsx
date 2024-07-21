import { onAuthStateChanged, User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ErrorScreen from './components/ErrorScreen'
import HomeScreen from './components/HomeScreen'
import LoginScreen from './components/LoginScreen'
import SignUpScreen from './components/SignUpScreen'
import { auth } from './firebaseConfig'

function App(): JSX.Element {
	const [user, setUser] = useState<User | undefined>(undefined)
	const [loading, setLoading] = useState(true)

	useEffect((): (() => void) => {
		const unsubscribe = onAuthStateChanged(auth, currentUser => {
			setUser(currentUser ?? undefined)
			setLoading(false)
		})
		return () => unsubscribe()
	}, [])

	if (loading) {
		return <div>Loading...</div>
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={user ? <HomeScreen /> : <Navigate to='/login' />}
				/>
				<Route path='/login' element={<LoginScreen />} />
				<Route path='/signup' element={<SignUpScreen />} />
				<Route path='/error' element={<ErrorScreen />} />
				<Route path='*' element={<Navigate to='/error' />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
