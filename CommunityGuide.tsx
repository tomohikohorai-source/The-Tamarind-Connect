
import React from 'react';
import { ChevronLeft, FileText, Scale, ShieldAlert, Gavel, UserCheck } from 'lucide-react';
import { Language, translations } from '@/translations';

interface TermsOfServiceProps {
  onBack: () => void;
  language: Language;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="text-gray-400" size={24} />
        </button>
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">Terms of Service</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 pb-32">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-blue-600 mb-6 shadow-sm">
            <Gavel size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">
            Terms of Service & Community Guidelines.
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Last Updated: May 1, 2026
          </p>
        </div>

        <div className="space-y-10 text-gray-600">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <UserCheck size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">1. Acceptance of Terms</h3>
            </div>
            <p className="text-sm leading-relaxed">
              By accessing or using Nearby Exchange, you agree to be bound by these Terms of Service. 
              Our platform is intended for use by residents of authorized residential complexes only.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <ShieldAlert size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">2. User Conduct</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Users must provide accurate information and interact respectfully. Prohibited behaviors include:
            </p>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>Posting illegal, harmful, or fraudulent content.</li>
              <li>Impersonating other residents or staff.</li>
              <li>Harassment or discrimination against any community member.</li>
              <li>Attempting to bypass platform security measures.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <FileText size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">3. Marketplace & Skill Exchange</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Nearby Exchange acts as a facilitator, not a party to any transactions. 
              Users are solely responsible for the items they sell, the services they provide, 
              and the safety of their interactions with neighbors.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <Scale size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">4. Limitation of Liability</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Nearby Exchange shall not be liable for any disputes, damages, or losses arising from 
              user interactions or transactions arranged through the platform. Use of the service 
              is at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <FileText size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">5. Termination</h3>
            </div>
            <p className="text-sm leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms or 
              the community standards that maintain the safety of Nearby Exchange.
            </p>
          </section>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 text-center">
          <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
            For legal inquiries, please contact: nearbyexchange@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};
