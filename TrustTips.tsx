
import React from 'react';
import { ChevronLeft, ShieldCheck, UserCheck, MessageSquare, AlertTriangle } from 'lucide-react';
import { Language, translations } from '@/translations';

interface Props {
  onBack: () => void;
  language: Language;
}

export const SafetyGuide: React.FC<Props> = ({ onBack, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] animate-fade-in touch-auto">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-gray-800 uppercase tracking-widest">Safety Guide</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 max-w-lg mx-auto pb-44">
        <section className="space-y-4">
          <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 shadow-sm border-2 border-white">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
            How to Use Nearby Exchange Safely
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Our priority is to build a safe and trustworthy community for all residents. Please follow these guidelines to ensure a smooth and secure experience.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex gap-4">
            <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl h-fit">
              <UserCheck size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Verify Identities</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Always check the profile of the person you are interacting with. Members with badges have been active and contributing to the community.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl h-fit">
              <MessageSquare size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Communicate within the App</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Use our built-in comment system for all initial conversations and transaction details. This helps keep a record and maintains your privacy.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl h-fit">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Meet in Public Spaces</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                For physical exchanges, we recommend meeting in the condominium's common areas like the lobby or guard house. Avoid sharing specific apartment numbers until trust is established.
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 bg-pink-50 rounded-[32px] border border-pink-100/50">
          <h3 className="text-sm font-black text-pink-500 uppercase tracking-widest mb-3">Reporting Issues</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            If you encounter any suspicious behavior or have a dispute with another member, please report it immediately to the community administrator via the profile section.
          </p>
        </section>
      </div>
    </div>
  );
};
