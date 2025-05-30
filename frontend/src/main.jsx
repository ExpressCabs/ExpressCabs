import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import AddressScreen from './screens/AddressScreen';
import DriverDashboard from './components/DriverDashboard';
import DriverLoginScreen from './components/DriverLoginScreen';
const App = () => {
  const [mode, setMode] = useState('passenger');
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


  return (
    <div className="pt-16 p-4">
      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setMode('passenger')}
          className={`px-4 py-2 rounded ${mode === 'passenger' ? 'bg-gray-700 text-white' : 'bg-gray-300'}`}
        >
          Passenger
        </button>
        <button
          onClick={() => setMode('driver')}
          className={`px-4 py-2 rounded ${mode === 'driver' ? 'bg-blue-600 text-white' : 'bg-blue-200'}`}
        >
          Driver
        </button>
      </div>

      {/* Active Screen */}
      <div className="min-h-screen border rounded p-4 shadow">
        {mode === 'passenger' ? (
          <AddressScreen />
        ) : loggedInDriver ? (
          <DriverDashboard driver={loggedInDriver} onLogout={handleLogout} />
        ) : (
          <DriverLoginScreen onLogin={handleLogin} />
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
