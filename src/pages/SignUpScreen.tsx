import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'

function SignUpScreen(): JSX.Element {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const navigate = useNavigate()

	async function handleSignUp(
		event: FormEvent<HTMLFormElement>,
		email: string,
		password: string
	): Promise<void> {
		event.preventDefault()
		try {
			await createUserWithEmailAndPassword(auth, email, password)
			navigate('/') // Redirige vers la page d'accueil après une inscription réussie
		} catch (error) {
			console.error("Erreur lors de l'inscription", error)
		}
	}

	function handleEmailChange(event: ChangeEvent<HTMLInputElement>): void {
		setEmail(event.target.value)
	}

	function handlePasswordChange(event: ChangeEvent<HTMLInputElement>): void {
		setPassword(event.target.value)
	}

	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className=' max-w-md '>
				<h2 className='mb-6 text-center text-2xl font-bold'>Inscription</h2>
				<form
					onSubmit={event => handleSignUp(event, email, password)}
					className='space-y-4'
				>
					<div>
						<label htmlFor='email' className='block text-sm font-medium'>
							Email
						</label>
						<input
							id='email'
							type='email'
							value={email}
							onChange={handleEmailChange}
							required
							className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black'
						/>
					</div>
					<div>
						<label htmlFor='password' className='block text-sm font-medium'>
							Mot de passe
						</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={handlePasswordChange}
							required
							className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-black'
						/>
					</div>
					<div>
						<button
							type='submit'
							className='flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
						>
							Inscription
						</button>
					</div>
				</form>
				<div className='mt-6 text-center'>
					<p className='text-sm '>
						Vous avez déjà un compte ?{' '}
						<Link to={'/login'} className='text-indigo-600 hover:underline'>
							Connexion
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default SignUpScreen
