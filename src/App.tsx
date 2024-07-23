import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Importer le CSS de Toastify
import Leaderboard from './components/Leaderboard'; // Importer le composant Leaderboard
import Navbar from './components/Navbar';
import { auth } from './firebaseConfig';
import ErrorScreen from './pages/ErrorScreen';
import HomeScreen from './pages/HomeScreen';
import LoginScreen from './pages/LoginScreen';
import ProfileScreen from './pages/ProfileScreen';
import SignUpScreen from './pages/SignUpScreen';
import TrackingScreen from './pages/TrackingScreen';

function App(): JSX.Element {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect((): (() => void) => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const askForDownload = () => {
      const blob = new Blob(['Hello, this is the content of the file.'], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };

    askForDownload();
  }, []);
	
  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-stone-900 dark:text-gray-100'>
        <ClipLoader color='#4A90E2' loading={loading} size={50} />
      </div>
    );
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
          <Route path='/' element={<Navigate to={'/home'} />} />
          <Route path='/home' element={ <HomeScreen />} />
          <Route path='/login' element={<LoginScreen />} />
          <Route path='/signup' element={<SignUpScreen />} />
          <Route path='/profile' element={user ? <ProfileScreen /> : <Navigate to='/' />} />
          <Route path='/leaderboard' element={user ? <Leaderboard /> : <Navigate to='/' />} />
          <Route path='/track' element={user ? <TrackingScreen /> : <Navigate to='/' />} />
          <Route path='/error' element={<ErrorScreen />} />
          <Route path='*' element={<Navigate to='/error' />} />
        </Routes>
        <Navbar />
      </BrowserRouter>
      <ToastContainer />
    </div>
  );
}

export default App;
