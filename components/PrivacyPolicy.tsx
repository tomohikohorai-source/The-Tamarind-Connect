
import React from 'react';
import { ChevronLeft, ShieldCheck, Lock, Eye, FileText, Scale } from 'lucide-react';
import { Language, translations } from '../translations';

interface PrivacyPolicyProps {
  onBack: () => void;
  language: Language;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="text-gray-400" size={24} />
        </button>
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">Privacy Policy</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 pb-32">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-teal-50 rounded-[24px] flex items-center justify-center text-teal-600 mb-6 font-black text-2xl shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">
            Your Privacy Matters to Us.
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Last Updated: April 25, 2026
          </p>
        </div>

        <div className="space-y-10">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-500">
              <Lock size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">1. Data Collection</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              We collect information that you provide directly to us, including your name, email address, 
              condo residency details, and any content you post in our marketplace or skill exchange.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-500">
              <Eye size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">2. How We Use Data</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow residents to connect with each other</li>
              <li>To provide customer care and support</li>
              <li>To monitor the usage of the Service for security purposes</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-500">
              <Scale size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">3. Data Sharing</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              We do not sell your personal data. Your contact information is only shared with other users 
              when you explicitly initiate or accept an exchange, or when you interact in the community forum.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-500">
              <FileText size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">4. Security</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              The security of your data is important to us, and we use industry-standard encryption 
              to protect your personal information during transmission and storage.
            </p>
          </section>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
          <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest text-center">
            If you have any questions about this Privacy Policy, please contact us at nearbyexchange@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};
