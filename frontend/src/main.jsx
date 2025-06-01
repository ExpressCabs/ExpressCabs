// main.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import AddressScreen from './screens/AddressScreen';
import DriverDashboard from './components/DriverDashboard';
import DriverLoginScreen from './components/DriverLoginScreen';
import HeaderFooter from './components/HeaderFooter';
import UserLoginScreen from './components/UserLoginScreen';
import UserRegisterScreen from './components/UserRegisterScreen';
import UserLoginPopup from './components/UserLoginPopup';
import UserRidesScreen from './components/UserRidesScreen';


const App = () => {
  const [mode, setMode] = useState('passenger');

  // Driver auth
  const [loggedInDriver, setLoggedInDriver] = useState(() => {
    const stored = localStorage.getItem('driver');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (driver) => {
    setLoggedInDriver(driver);
    localStorage.setItem('driver', JSON.stringify(driver));
  };

  const handleLogout = () => {
    setLoggedInDriver(null);
    localStorage.removeItem('driver');
  };

  // User auth
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleUserLogin = (user) => {
    setLoggedInUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setMode('myrides');
  };

  const handleUserLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('user');
  };

  // Show user login popup on first site visit if not logged in
  const [showUserPopup, setShowUserPopup] = useState(() => {
    const alreadySeen = sessionStorage.getItem('seenUserPopup');
    return !alreadySeen && !loggedInUser;
  });

  return (
    <>
      <HeaderFooter
        mode={mode}
        setMode={setMode}
        loggedInDriver={loggedInDriver}
        loggedInUser={loggedInUser}
        setShowUserPopup={setShowUserPopup}
        setShowUserLoginScreen={setMode}
        handleUserLogout={handleUserLogout}
      />

      <div className="pt-16 p-4">
        {showUserPopup && (
          <UserLoginPopup
            onLogin={handleUserLogin}
            onClose={() => {
              setShowUserPopup(false);
              sessionStorage.setItem('seenUserPopup', 'true');
            }}
          />
        )}

        <div className="min-h-screen border rounded p-4 shadow">
          {mode === 'myrides' ? (
            <UserRidesScreen
              user={loggedInUser}
              onLogout={handleUserLogout}
              setMode={setMode}
            />
          ) : mode === 'userlogin' ? (
            <UserLoginScreen
              onLogin={handleUserLogin}
              onRegisterClick={() => setMode('userregister')}
            />
          ) : mode === 'userregister' ? (
            <UserRegisterScreen
              onBackToLogin={() => setMode('userlogin')}
            />
          ) : mode === 'passenger' ? (
            <AddressScreen loggedInUser={loggedInUser} />
          ) : loggedInDriver ? (
            <DriverDashboard driver={loggedInDriver} onLogout={handleLogout} />
          ) : (
            <DriverLoginScreen onLogin={handleLogin} />
          )}
        </div>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
