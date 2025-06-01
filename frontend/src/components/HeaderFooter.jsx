// src/components/HeaderFooter.js
import React, { useState, useEffect } from 'react';

const HeaderFooter = ({ mode, setMode, loggedInDriver, loggedInUser, setShowUserPopup }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <header className="w-full bg-white shadow-md p-4 fixed top-0 z-50 flex justify-between items-center">
        <div className="text-lg font-semibold">Express Cabs</div>

        {/* Desktop Menu */}
        <nav className="hidden sm:flex gap-6 font-medium text-gray-700">
          <button onClick={() => setMode('passenger')} className="hover:text-blue-600">
            🚕 Book Ride
          </button>
          <button onClick={() => setMode('driver')} className="hover:text-blue-600">
            👨‍✈️ Driver ({loggedInDriver ? 'Dashboard' : 'Login'})
          </button>
          <button className="hover:text-blue-600">📞 Contact Us</button>
          <button className="hover:text-blue-600">🧾 Services</button>
          {loggedInUser ? (
            <button onClick={() => setMode('myrides')} className="hover:text-blue-600">
              📋 My Rides
            </button>
          ) : (
            <button onClick={() => setMode('userlogin')} className="hover:text-blue-600">
              👤 Login / Register
            </button>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="text-2xl sm:hidden z-50"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          ☰
        </button>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div
            className="absolute top-16 right-4 w-48 bg-white shadow-lg border rounded-md z-40 sm:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                setMode('passenger');
                setMenuOpen(false);
              }}
            >
              🚕 Book Ride
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                setMode('driver');
                setMenuOpen(false);
              }}
            >
              👨‍✈️ Driver ({loggedInDriver ? 'Dashboard' : 'Login'})
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              📞 Contact Us
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              🧾 Services
            </button>
            {loggedInUser ? (
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setMenuOpen(false);
                  setMode('myrides');
                }}
              >
                📋 My Rides
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setMode('userlogin');
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                👤 Login / Register
              </button>
            )}
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Footer */}
      <footer className="w-full fixed bottom-0 z-50 bg-white border-t shadow-md flex justify-around p-3">
        <a
          href="tel:+61482038902"
          className="bg-blue-600 text-white font-medium px-6 py-2 rounded-full shadow hover:bg-blue-700 transition"
        >
          📞 Call
        </a>
        <a
          href="https://wa.me/61482038902"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white font-medium px-6 py-2 rounded-full shadow hover:bg-green-700 transition"
        >
          🟢 WhatsApp
        </a>
      </footer>

      {/* Spacer for fixed footer */}
      <div className="h-20" />
    </>
  );
};

export default HeaderFooter;
