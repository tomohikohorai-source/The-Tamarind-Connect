
import React, { useState } from 'react';
import { RESIDENT_PASSCODE } from '../constants';

interface Props {
  onSuccess: () => void;
}

export const PasscodeGate: React.FC<Props> = ({ onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === RESIDENT_PASSCODE) {
      onSuccess();
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center border border-pink-100">
        <div className="text-5xl mb-4">🏢</div>
        <h1 className="text-2xl font-black text-pink-500 mb-2">The Tamarind Connect</h1>
        <p className="text-gray-500 mb-8 font-medium text-sm">Please enter the resident passcode</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="****"
            className={`w-full text-center text-4xl tracking-widest py-4 border-b-2 outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : 'border-pink-200 focus:border-pink-400'
            }`}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm animate-bounce">Invalid passcode</p>}
          <button
            type="submit"
            className="w-full bg-pink-400 hover:bg-pink-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
          >
            Enter App
          </button>
        </form>
      </div>
    </div>
  );
};
