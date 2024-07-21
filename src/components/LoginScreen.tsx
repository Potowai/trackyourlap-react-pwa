import {
	GoogleAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup
} from 'firebase/auth'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'

function LoginScreen(): JSX.Element {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const navigate = useNavigate()

	async function handleLogin(
		event: FormEvent<HTMLFormElement>,
		email: string,
		password: string
	): Promise<void> {
		event.preventDefault()
		try {
			await signInWithEmailAndPassword(auth, email, password)
			navigate('/') // Redirige vers la page d'accueil après une connexion réussie
		} catch (error) {
			console.error('Erreur de connexion', error)
		}
	}

	async function handleGoogleLogin(): Promise<void> {
		const provider = new GoogleAuthProvider()
		try {
			await signInWithPopup(auth, provider)
			navigate('/') // Redirige vers la page d'accueil après une connexion réussie
		} catch (error) {
			console.error('Erreur de connexion avec Google', error)
		}
	}

	function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
		setEmail(event.target.value)
	}

	function handlePasswordChange(event: ChangeEvent<HTMLInputElement>): void {
		setPassword(event.target.value)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-100'>
			<div className='w-full max-w-md rounded-lg bg-white p-8 shadow-md'>
				<h2 className='mb-6 text-center text-2xl font-bold'>Connexion</h2>
				<form
					onSubmit={event => handleLogin(event, email, password)}
					className='space-y-4'
				>
					<div>
						<label
							htmlFor='email'
							className='block text-sm font-medium text-gray-700'
						>
							Email
						</label>
						<input
							id='email'
							type='email'
							value={email}
							onChange={handleEmailChange}
							required
							className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
						/>
					</div>
					<div>
						<label
							htmlFor='password'
							className='block text-sm font-medium text-gray-700'
						>
							Mot de passe
						</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={handlePasswordChange}
							required
							className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
						/>
					</div>
					<div>
						<button
							type='submit'
							className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
						>
							Connexion
						</button>
					</div>
				</form>
				<div className='mt-6'>
					<button
						type='button'
						onClick={handleGoogleLogin}
						className='flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
					>
						Connexion avec Google
					</button>
				</div>
				<div className='mt-6 text-center'>
					<p className='text-sm text-gray-600'>
						Vous n'avez pas de compte ?{' '}
						<a href='/signup' className='text-indigo-600 hover:underline'>
							Inscrivez-vous
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}

export default LoginScreen
