import React, { useState } from 'react';

const PassengerDetails = ({ setStep, onSubmitPassengerDetails }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const isValid = name.trim() && phone.trim();

  const handleNext = () => {
    if (!isValid) return;
    onSubmitPassengerDetails({ name, phone, email, note });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-2">Passenger Details</h2>

      <div>
        <label className="block font-medium">Full Name *</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label className="block font-medium">Phone Number *</label>
        <input
          type="tel"
          className="w-full p-2 border rounded"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0412345678"
        />
      </div>

      <div>
        <label className="block font-medium">Email (optional)</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block font-medium">Driver Note (optional)</label>
        <textarea
          className="w-full p-2 border rounded"
          rows="3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any instructions for driver"
        />
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={() => setStep(2)}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`px-6 py-2 rounded text-white font-semibold ${
            isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PassengerDetails;
