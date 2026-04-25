
import React from 'react';
import { ChevronLeft, Info, Heart, Shield, Users, Mail } from 'lucide-react';
import { Language, translations } from '../translations';

interface AboutProps {
  onBack: () => void;
  language: Language;
}

export const About: React.FC<AboutProps> = ({ onBack, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="text-gray-400" size={24} />
        </button>
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">About Nearby Exchange</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 pb-32">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-500 mb-6">
            <Info size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">
            Connecting Communities, One Exchange at a Time.
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Nearby Exchange is a community-driven platform designed specifically for residential complexes. 
            Our mission is to foster meaningful connections between neighbors through the exchange of skills, 
            goods, and local knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="p-6 bg-rose-50 rounded-[32px] space-y-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
              <Heart size={20} />
            </div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Built with Community</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We believe that the people living closest to you are your greatest resource. 
              By making it easy to assist each other, we build stronger, safer, and happier neighborhoods.
            </p>
          </div>

          <div className="p-6 bg-teal-50 rounded-[32px] space-y-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-teal-500 shadow-sm">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Skill Sharing</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Everyone has a talent. Whether it's cooking, language tutoring, or tech support, 
              your skills are valuable to someone nearby.
            </p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-[32px] space-y-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
              <Shield size={20} />
            </div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Trusted Environment</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              By limiting access to verified residents of specific condos, 
              we ensure a high level of trust and safety within our community marketplace.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Us</h3>
          <div className="flex items-center gap-3 text-gray-700">
            <Mail size={18} className="text-indigo-500" />
            <span className="text-sm font-bold truncate">nearbyexchange@gmail.com</span>
          </div>
        </div>

        <div className="text-center pt-8">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Handcrafted with Care for the People of Penang
          </p>
          <p className="text-[10px] text-gray-300 mt-1 font-bold italic uppercase tracking-widest">
            v1.2.0 • 2026
          </p>
        </div>
      </div>
    </div>
  );
};
