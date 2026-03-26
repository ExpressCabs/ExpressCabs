import React, { useEffect, useRef, useState } from 'react';

const OTPVerification = ({ phone, onBack, onSuccess }) => {
  const topRef = useRef(null);
  const sentOnce = useRef(false);
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const sendOtp = async () => {
    if (!phone) {
      setError('Missing phone number');
      return;
    }

    setSending(true);
    setError('');
    setInfo('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to send OTP');
        return;
      }

      setInfo(data?.message || 'OTP sent to your phone');
    } catch (err) {
      console.error('OTP send error:', err);
      setError('Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!topRef.current) return;

    topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    sendOtp();
  }, []);

  const handleVerify = async () => {
    if (!otp) {
      setError('Enter the OTP');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        onSuccess();
      } else {
        setError(data?.error || 'Invalid OTP');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('OTP verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div ref={topRef} className="scroll-mt-28 text-slate-900">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(226,232,240,0.46)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_22px_48px_-34px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <div className="text-center">
          <span className="rounded-full border border-slate-300/55 bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            Secure verification
          </span>
          <h2 className="mt-4 text-2xl font-bold">Verify your number</h2>
          <p className="mt-2 text-sm text-slate-700">
            Enter the code sent to <strong>{phone}</strong>
          </p>
        </div>

        <div className="mt-5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="h-12 w-full rounded-2xl border border-slate-300/70 bg-white/88 px-3 text-center text-lg tracking-[0.35em] shadow-[inset_0_1px_0_rgba(255,255,255,0.94),0_18px_36px_-30px_rgba(15,23,42,0.24)] focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            placeholder="Enter OTP"
          />
        </div>

        {info && <p className="mt-3 text-sm text-green-600">{info}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 grid gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="h-12 w-full rounded-2xl border border-slate-800/70 bg-[linear-gradient(180deg,rgba(30,41,59,0.98)_0%,rgba(15,23,42,1)_100%)] text-white shadow-[0_20px_46px_-30px_rgba(15,23,42,0.65)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {verifying ? 'Verifying...' : 'Verify & Book'}
          </button>

          <button
            onClick={sendOtp}
            disabled={sending}
            className="h-12 w-full rounded-2xl border border-slate-300/55 bg-white/78 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:bg-white/88 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {sending ? 'Sending...' : 'Resend OTP'}
          </button>

          <button
            onClick={onBack}
            className="mt-1 text-sm font-medium text-slate-700 underline"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
