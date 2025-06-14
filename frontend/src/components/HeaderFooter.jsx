import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';

const HeaderFooter = ({ mode, setMode, loggedInDriver, loggedInUser, setShowUserPopup }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleSetMode = (newMode) => {
    setMode(newMode);
    navigate('/');
  };

  const goTo = (path, newMode) => {
    if (newMode) setMode(newMode);
    navigate(path);
  };

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white shadow-md p-4 fixed top-0 z-50 flex justify-between items-center"
      >
        <div className="text-xl font-bold tracking-wide text-blue-700">Express Cabs</div>

        {/* Desktop Menu */}
        <nav className="hidden sm:flex gap-6 font-medium text-gray-700">
          <button onClick={() => handleSetMode('passenger')} className="hover:text-blue-600 transition">
            Book Ride
          </button>
          <button
            onClick={() => handleSetMode(loggedInDriver ? 'driverdashboard' : 'driverlogin')}
            className="hover:text-blue-600 transition"
          >
            Driver ({loggedInDriver ? 'Dashboard' : 'Login'})
          </button>
          <button onClick={() => goTo('/services', 'services')} className="hover:text-blue-600 transition">
            Services
          </button>
          <button onClick={() => goTo('/contact', 'contact')} className="hover:text-blue-600 transition">
            Contact Us
          </button>
          {loggedInUser ? (
            <button onClick={() => handleSetMode('myrides')} className="hover:text-blue-600 transition">
              My Rides
            </button>
          ) : (
            <button onClick={() => handleSetMode('userlogin')} className="hover:text-blue-600 transition">
              Login / Register
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="text-2xl sm:hidden z-50"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          ☰
        </button>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div
            className="absolute top-16 right-4 w-48 bg-white shadow-lg border rounded-md z-40 sm:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                handleSetMode('passenger');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Book Ride
            </button>
            <button
              onClick={() => {
                handleSetMode(loggedInDriver ? 'driverdashboard' : 'driverlogin');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Driver ({loggedInDriver ? 'Dashboard' : 'Login'})
            </button>
            <button
              onClick={() => {
                goTo('/services', 'services');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Services
            </button>
            <button
              onClick={() => {
                goTo('/contact', 'contact');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Contact Us
            </button>
            {loggedInUser ? (
              <button
                onClick={() => {
                  handleSetMode('myrides');
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                My Rides
              </button>
            ) : (
              <button
                onClick={() => {
                  handleSetMode('userlogin');
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Login / Register
              </button>
            )}
          </div>
        )}
      </motion.header>

      {/* Spacer */}
      <div className="h-16" />

      {/* Footer */}
      <motion.footer
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full fixed bottom-0 z-50 bg-white border-t shadow-md p-4"
      >
        <div className="flex justify-center gap-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="tel:+61482038902"
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <FaPhoneAlt /> Call Now
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://wa.me/61482038902"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            <FaWhatsapp /> WhatsApp
          </motion.a>
        </div>
      </motion.footer>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
};

export default HeaderFooter;
