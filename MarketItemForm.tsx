
import React from 'react';
import { LogIn, X, ChevronLeft } from 'lucide-react';
import { Language, translations } from '../translations';

interface Props {
  language: Language;
  onProceed: () => void;
  onCancel: () => void;
}

export const LoginRequiredModal: React.FC<Props> = ({ language, onProceed, onCancel }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl border-4 border-teal-400 animate-slide-up">
        <div className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 mx-auto border-4 border-white shadow-lg mb-2">
            <LogIn size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
              {t.loginRequired}
            </h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={onProceed} 
              className="w-full py-4 bg-teal-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-100 active:scale-95 transition-all border-2 border-white"
            >
              {t.proceedToLogin}
            </button>
            <button 
              onClick={onCancel} 
              className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={16} /> {t.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
