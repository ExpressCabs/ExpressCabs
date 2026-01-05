// src/main.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { useLocation } from 'react-router-dom';

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AirportTaxiMelbourne from './screens/AirportTaxiMelbourne';
import AddressScreen from './screens/AddressScreen';
import ContactUs from './screens/ContactUs';
import OurServices from './screens/OurServices';
import DriverDashboard from './components/DriverDashboard';
import DriverLoginScreen from './components/DriverLoginScreen';
import HeaderFooter from './components/HeaderFooter';
import UserLoginScreen from './components/UserLoginScreen';
import UserRegisterScreen from './components/UserRegisterScreen';
import UserLoginPopup from './components/UserLoginPopup';
import UserRidesScreen from './components/UserRidesScreen';
import RideSuccessScreen from './components/RideSuccessScreen';
import DriverRegister from './screens/DriverRegister';
import DriverForgotPassword from './components/DriverForgetPassword';
import UserForgotPassword from './components/UserForgotPassword';
import DriverResetPassword from './components/DriverResetPassword';
import AirportTransferSuburb from "./pages/AirportTransferSuburb";
import AirportTransfersMelbourne from "./pages/AirportTransfersMelbourne";
import ScrollToTop from './components/ScrollToTop';
// Admin panel imports
import RequireAdmin from './admin/components/RequireAdmin';
import AdminDashboard from './admin/pages/dashboard';
import InviteDriver from './admin/pages/inviteDriver';
import BlogNew from './admin/pages/blogNew';
import BlogList from './admin/pages/blogList';
import EmailSender from './admin/pages/emailSender';
import AdminLogin from './admin/pages/AdminLogin';

import BlogSlug from './screens/blogslug';

const App = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('passenger');

  // Use effect to read mode from sessionStorage after redirects
  const location = useLocation();
  useEffect(() => {
    const next = location.state?.nextMode || sessionStorage.getItem('nextMode');
    if (next) {
      setMode(next);
      sessionStorage.removeItem('nextMode');
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
    const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVh();
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);

  return () => {
    window.removeEventListener('resize', setVh);
    window.removeEventListener('orientationchange', setVh);
  };
  }, [location.state]);


  const [loggedInDriver, setLoggedInDriver] = useState(() => {
    const stored = localStorage.getItem('driver');
    return stored ? JSON.parse(stored) : null;
  });

  const [loggedInUser, setLoggedInUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loggedInAdmin, setLoggedInAdmin] = useState(() => {
    const stored = localStorage.getItem('admin');
    return stored ? JSON.parse(stored) : null;
  });


  const handleUserLogin = (user) => {
    setLoggedInUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setMode('myrides');
    navigate('/');
  };

  const handleUserLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('user');
    setMode('passenger');
    navigate('/');
  };

  const handleAdminLogin = (admin) => {
    setLoggedInAdmin(admin);
    localStorage.setItem('admin', JSON.stringify(admin));
  };

  const handleAdminLogout = () => {
    setLoggedInAdmin(null);
    localStorage.removeItem('admin');
  };


  const [showUserPopup, setShowUserPopup] = useState(() => {
    const alreadySeen = sessionStorage.getItem('seenUserPopup');
    return !alreadySeen && !loggedInUser;
  });

  const Home = () => (
    <div className="pt-2 p-1 ">
      {/*{showUserPopup && (
        <UserLoginPopup
          onLogin={handleUserLogin}
          onClose={() => {
            setShowUserPopup(false);
            sessionStorage.setItem('seenUserPopup', 'true');
          }}
        />
      )}*/}

      <div className="app-min-h border rounded shadow">
        {mode === 'myrides' ? (
          <UserRidesScreen
            user={loggedInUser}
            onLogout={handleUserLogout}
            setMode={setMode}
          />
        ) : mode === 'userlogin' ? (
          <UserLoginScreen
            onLogin={handleUserLogin}
            onRegisterClick={() => {
              setMode('userregister');
              navigate('/register');
            }}
          />
        ) : mode === 'userregister' ? (
          <UserRegisterScreen
            onBackToLogin={() => {
              setMode('userlogin');
              navigate('/');
            }}
          />
        ) : mode === 'passenger' ? (
          <AddressScreen loggedInUser={loggedInUser} />
        ) : mode === 'driverlogin' ? (
          <DriverLoginScreen onLogin={(driver) => {
            localStorage.setItem('driver', JSON.stringify(driver));
            setLoggedInDriver(driver);
            setMode('driverdashboard');
          }} />
        ) : mode === 'driverdashboard' ? (
          <DriverDashboard driver={loggedInDriver} onLogout={() => {
            setLoggedInDriver(null);
            localStorage.removeItem('driver');
            setMode('driverlogin');
          }} />
        ) : mode === 'services' ? (
          <OurServices />
        ) : mode === 'contact' ? (
          <ContactUs />
        ) : (
          <div>Unknown mode</div>
        )}
      </div>
    </div>
  );

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

      <Routes>
        <Route path="/" element={<Home key={mode} />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/services" element={<OurServices />} />
        <Route path="/ride-success" element={<RideSuccessScreen />} />
        <Route path="/airport-taxi-melbourne" element={<AirportTaxiMelbourne loggedInUser={loggedInUser} />} />
        <Route path="/driver-register" element={<DriverRegister />} />
        <Route path="/driver-forgot-password" element={<DriverForgotPassword />} />
        <Route path="/user-forgot-password" element={<UserForgotPassword />} />
        <Route path="/reset-password" element={<DriverResetPassword />} />
        <Route
          path="/airport-transfer/melbourne/:suburbSlug"
           element={<AirportTransferSuburb />}
        />
        <Route path="/airport-transfer/melbourne" element={<AirportTransfersMelbourne />} />

        <Route
          path="/driver"
          element={
            loggedInDriver ? (
              <DriverDashboard driver={loggedInDriver} onLogout={() => {
                setLoggedInDriver(null);
                localStorage.removeItem('driver');
              }} />
            ) : (
              <DriverLoginScreen onLogin={(driver) => {
                setLoggedInDriver(driver);
                localStorage.setItem('driver', JSON.stringify(driver));
              }} />
            )
          }
        />
        <Route
          path="/register"
          element={
            <UserRegisterScreen
              onBackToLogin={() => {
                setMode('userlogin');
                navigate('/');
              }}
            />
          }
        />

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin admin={loggedInAdmin}>
              <AdminDashboard onLogout={handleAdminLogout} />
            </RequireAdmin>
          }
        >
          <Route path="invite-driver" element={<InviteDriver />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blogs/new" element={<BlogNew />} />
          <Route path="email" element={<EmailSender />} />
        </Route>
        <Route path="/blog/:slug" element={<BlogSlug />} />
      </Routes>
    </>
  );
};

const AppWrapper = () => (
  <BrowserRouter>
    <HelmetProvider>
      <ScrollToTop />
      <App />
    </HelmetProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
