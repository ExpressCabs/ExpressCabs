// src/main.jsx
import React, { useEffect, useState, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";

import HeaderFooter from "./components/HeaderFooter";
import ScrollToTop from "./components/ScrollToTop";
import DelayedGtag from "./utils/delayedGtag";

// Keep these as direct imports if they are used immediately on homepage/mode switching
import DriverDashboard from "./components/DriverDashboard";
import DriverLoginScreen from "./components/DriverLoginScreen";
import UserLoginScreen from "./components/UserLoginScreen";
import UserRegisterScreen from "./components/UserRegisterScreen";
import UserRidesScreen from "./components/UserRidesScreen";
import RideSuccessScreen from "./components/RideSuccessScreen";

// AddressScreen is used in Home() in your file, but it was not imported in the upload.
// If it lives elsewhere, update this import path to the correct file.
import AddressScreen from "./screens/AddressScreen";

// Lazy-load non-critical screens/pages
const AirportTaxiMelbourne = lazy(() => import("./screens/AirportTaxiMelbourne"));
const ContactUs = lazy(() => import("./screens/ContactUs"));
const OurServices = lazy(() => import("./screens/OurServices"));
const DriverRegister = lazy(() => import("./screens/DriverRegister"));
const BlogSlug = lazy(() => import("./screens/blogslug"));

const DriverForgotPassword = lazy(() => import("./components/DriverForgetPassword"));
const UserForgotPassword = lazy(() => import("./components/UserForgotPassword"));
const DriverResetPassword = lazy(() => import("./components/DriverResetPassword"));

const AirportTransferSuburb = lazy(() => import("./pages/AirportTransferSuburb"));
const AirportTransfersMelbourne = lazy(() => import("./pages/AirportTransfersMelbourne"));

// Lazy-load admin pages
const RequireAdmin = lazy(() => import("./admin/components/RequireAdmin"));
const AdminDashboard = lazy(() => import("./admin/pages/dashboard"));
const InviteDriver = lazy(() => import("./admin/pages/inviteDriver"));
const BlogNew = lazy(() => import("./admin/pages/blogNew"));
const BlogList = lazy(() => import("./admin/pages/blogList"));
const EmailSender = lazy(() => import("./admin/pages/emailSender"));
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("passenger");

  // Keep your existing "nextMode" redirect logic + VH fix
  useEffect(() => {
    const next = location.state?.nextMode || sessionStorage.getItem("nextMode");
    if (next) {
      setMode(next);
      sessionStorage.removeItem("nextMode");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, [location.state]);

  const [loggedInDriver, setLoggedInDriver] = useState(() => {
    const stored = localStorage.getItem("driver");
    return stored ? JSON.parse(stored) : null;
  });

  const [loggedInUser, setLoggedInUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [loggedInAdmin, setLoggedInAdmin] = useState(() => {
    const stored = localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });

  const handleUserLogin = (user) => {
    setLoggedInUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    setMode("myrides");
    navigate("/");
  };

  const handleUserLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem("user");
    setMode("passenger");
    navigate("/");
  };

  const handleAdminLogin = (admin) => {
    setLoggedInAdmin(admin);
    localStorage.setItem("admin", JSON.stringify(admin));
  };

  const handleAdminLogout = () => {
    setLoggedInAdmin(null);
    localStorage.removeItem("admin");
  };

  const [showUserPopup, setShowUserPopup] = useState(() => {
    const alreadySeen = sessionStorage.getItem("seenUserPopup");
    return !alreadySeen && !loggedInUser;
  });

  const Home = () => (
    <div className="app-shell px-2 sm:px-3 pb-2">
      {/* {showUserPopup && (...)} */}

      <div className="content-surface min-h-screen rounded-[20px]">
        {mode === "myrides" ? (
          <UserRidesScreen
            user={loggedInUser}
            onLogout={handleUserLogout}
            setMode={setMode}
          />
        ) : mode === "userlogin" ? (
          <UserLoginScreen
            onLogin={handleUserLogin}
            onRegisterClick={() => {
              setMode("userregister");
              navigate("/register");
            }}
          />
        ) : mode === "userregister" ? (
          <UserRegisterScreen
            onBackToLogin={() => {
              setMode("userlogin");
              navigate("/");
            }}
          />
        ) : mode === "passenger" ? (
          <AddressScreen loggedInUser={loggedInUser} />
        ) : mode === "driverlogin" ? (
          <DriverLoginScreen
            onLogin={(driver) => {
              localStorage.setItem("driver", JSON.stringify(driver));
              setLoggedInDriver(driver);
              setMode("driverdashboard");
            }}
          />
        ) : mode === "driverdashboard" ? (
          <DriverDashboard
            driver={loggedInDriver}
            onLogout={() => {
              setLoggedInDriver(null);
              localStorage.removeItem("driver");
              setMode("driverlogin");
            }}
          />
        ) : mode === "services" ? (
          <OurServices />
        ) : mode === "contact" ? (
          <ContactUs />
        ) : (
          <div>Unknown mode</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Loads gtag after 4 seconds */}
      <DelayedGtag />

      <HeaderFooter
        mode={mode}
        setMode={setMode}
        loggedInDriver={loggedInDriver}
        loggedInUser={loggedInUser}
        setShowUserPopup={setShowUserPopup}
        setShowUserLoginScreen={setMode}
        handleUserLogout={handleUserLogout}
      />

      {/* REQUIRED for lazy() routes */}
      <Suspense
        fallback={
          <div className="w-full py-14 text-center text-sm text-slate-600">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home key={mode} />} />

          <Route path="/contact" element={<ContactUs />} />
          <Route path="/services" element={<OurServices />} />
          <Route path="/ride-success" element={<RideSuccessScreen />} />

          <Route
            path="/airport-taxi-melbourne"
            element={<AirportTaxiMelbourne loggedInUser={loggedInUser} />}
          />

          <Route path="/driver-register" element={<DriverRegister />} />
          <Route path="/driver-forgot-password" element={<DriverForgotPassword />} />
          <Route path="/user-forgot-password" element={<UserForgotPassword />} />
          <Route path="/reset-password" element={<DriverResetPassword />} />

          <Route
            path="/airport-transfer/melbourne/:suburbSlug"
            element={<AirportTransferSuburb />}
          />
          <Route
            path="/airport-transfer/melbourne"
            element={<AirportTransfersMelbourne />}
          />

          <Route
            path="/driver"
            element={
              loggedInDriver ? (
                <DriverDashboard
                  driver={loggedInDriver}
                  onLogout={() => {
                    setLoggedInDriver(null);
                    localStorage.removeItem("driver");
                  }}
                />
              ) : (
                <DriverLoginScreen
                  onLogin={(driver) => {
                    setLoggedInDriver(driver);
                    localStorage.setItem("driver", JSON.stringify(driver));
                  }}
                />
              )
            }
          />

          <Route
            path="/register"
            element={
              <UserRegisterScreen
                onBackToLogin={() => {
                  setMode("userlogin");
                  navigate("/");
                }}
              />
            }
          />

          <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />

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
      </Suspense>
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
