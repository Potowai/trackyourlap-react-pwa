import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import { auth } from '../firebaseConfig';

function HomeScreen(): JSX.Element {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100">
        <ClipLoader color="#4A90E2" loading={loading} size={50} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100">
      <div className="max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-stone-800 mx-6">
        {user ? (
          <div className="text-center">
            <p className="mb-4 text-2xl">
              Bienvenue,{' '}
              <span className="font-bold">{user.displayName || user.email}</span>
            </p>

            <Link to="/track" className="mb-4 block text-indigo-600 hover:underline">
              <button
                type="button"
                className="bg-green-500 text-white text-2xl font-bold px-4 py-2 border-2 border-gray-300 
                rounded-full shadow-md hover:bg-green-600 active:bg-green-700 active:shadow-lg transform active:translate-y-1 h-32 w-32"
              >
                TRACK
              </button>
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Bienvenue sur TrackYourLap</h1>
            <p className="mb-4">
              TrackYourLap est une application qui vous permet de suivre vos parcours et performances en temps réel. 
              Connectez-vous pour accéder à toutes les fonctionnalités, y compris le suivi de vos laps, l'affichage de 
              votre position sur la carte, et bien plus encore.
            </p>
            <p className="mb-4">
              Veuillez vous connecter ou vous inscrire pour commencer à utiliser l'application.
            </p>
            <Link to="/login" className="text-indigo-600 hover:underline">
              <button
                type="button"
                className="mb-4 w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-2xl font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Se connecter
              </button>
            </Link>
            <Link to="/signup" className="text-indigo-600 hover:underline">
              <button
                type="button"
                className="w-full rounded-md border border-transparent bg-green-600 px-4 py-2 text-2xl font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                S'inscrire
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeScreen;
