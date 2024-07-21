function ErrorScreen(): JSX.Element {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className='w-full max-w-md rounded-lg text-center shadow-md'>
				<h1 className='mb-4 text-2xl font-bold'>Page non trouvée</h1>
				<p className='mb-4'>
					Désolé, la page que vous recherchez n'existe pas.
				</p>
				<a href='/' className='text-indigo-600 hover:underline'>
					Retour à la page d'accueil
				</a>
			</div>
		</div>
	)
}

export default ErrorScreen
