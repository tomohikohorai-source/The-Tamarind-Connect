
import React from 'react';
import { ChevronLeft, Heart, Users, Sparkles, Star } from 'lucide-react';
import { Language, translations } from '@/translations';

interface Props {
  onBack: () => void;
  language: Language;
}

export const CommunityGuide: React.FC<Props> = ({ onBack, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] animate-fade-in touch-auto">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-gray-800 uppercase tracking-widest">Community Guide</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 max-w-lg mx-auto pb-44">
        <section className="space-y-4">
          <div className="w-16 h-16 bg-pink-50 rounded-3xl flex items-center justify-center text-pink-500 shadow-sm border-2 border-white">
            <Heart size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
            Contributing to Our Neighborhood
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Nearby Exchange is more than just a marketplace; it's a platform for fostering neighborly connections and mutual support.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6">
          <div className="p-6 bg-white rounded-[40px] border border-gray-100 shadow-sm space-y-3">
            <Users size={24} className="text-indigo-500" />
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-wider">Be Knowledgeable</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Share your expertise through the Skill Exchange. Whether it's cooking, language tutoring, or technical help, your skills are valuable to others.
            </p>
          </div>

          <div className="p-6 bg-white rounded-[40px] border border-gray-100 shadow-sm space-y-3">
            <Sparkles size={24} className="text-amber-500" />
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-wider">Sustainable Living</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Before throwing items away, consider listing them here for free or a small fee. Circular economy starts with your neighbors!
            </p>
          </div>

          <div className="p-6 bg-white rounded-[40px] border border-gray-100 shadow-sm space-y-3">
            <Star size={24} className="text-teal-500" />
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-wider">Earn Your Reputation</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Higher badge ranks signify a highly trusted and helpful neighbor. The more you "Like" others and "Post" quality listings, the higher you go!
            </p>
          </div>
        </div>

        <section className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100/50">
          <h3 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-3">Community First</h3>
          <p className="text-xs text-gray-600 leading-relaxed italic">
            "We are not just a collection of apartments, but a community of friends helping each other."
          </p>
        </section>
      </div>
    </div>
  );
};
