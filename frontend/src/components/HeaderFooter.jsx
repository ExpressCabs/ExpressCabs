// src/components/HeaderFooter.js
import React from 'react';

const HeaderFooter = () => {
  return (
    <>
      {/* Header */}
      <header className="w-full bg-white shadow-md p-4 fixed top-0 z-50">
        <div className="text-lg font-semibold text-center">Express Cabs</div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-0" />

      {/* Footer */}
      <footer className="w-full fixed bottom-0 z-50 bg-white border-t shadow-md flex justify-around p-3">
        <a
          href="tel:+61123456789"
          className="bg-blue-600 text-white font-medium px-6 py-2 rounded-full shadow hover:bg-blue-700 transition"
        >
          📞 Call
        </a>
        <a
          href="https://wa.me/61123456789"
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
