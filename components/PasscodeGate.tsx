
import React, { useState } from 'react';
import { RESIDENT_PASSCODE } from '../constants';
import { Language, translations } from '../translations';

interface Props {
  onSuccess: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const PasscodeGate: React.FC<Props> = ({ onSuccess, language, onLanguageChange }) => {
  const t = translations[language];
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50 relative">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center border border-pink-100">
        <div className="text-5xl mb-4">🏢</div>
        <h1 className="text-2xl font-black text-pink-500 mb-2">{t.appName}</h1>
        <p className="text-gray-500 mb-8 font-medium text-sm">{t.passcodePrompt}</p>
        
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
          {error && <p className="text-red-500 text-sm animate-bounce">{t.invalidPasscode}</p>}
          <button
            type="submit"
            className="w-full bg-pink-400 hover:bg-pink-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
          >
            {t.enterApp}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-pink-50">
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-400 shrink-0">
              <span className="text-xs">✉️</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-pink-300 uppercase tracking-widest">Support & Inquiries</p>
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed mt-1">
                For inquiries or questions, please email <a href="mailto:nearbyexchange@gmail.com" className="text-pink-500 underline">nearbyexchange@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
