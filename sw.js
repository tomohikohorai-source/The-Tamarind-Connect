
import React from 'react';
import { ChevronLeft, Zap, Smile, BookOpen, Clock } from 'lucide-react';
import { Language, translations } from '@/translations';

interface Props {
  onBack: () => void;
  language: Language;
}

export const TrustTips: React.FC<Props> = ({ onBack, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] animate-fade-in touch-auto">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black text-gray-800 uppercase tracking-widest">Building Trust</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-grow overflow-y-auto p-6 space-y-8 max-w-lg mx-auto pb-44">
        <section className="space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-sm border-2 border-white">
            <Smile size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
            Tips for Building Trust with Neighbors
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Trust is the currency of our community. Here are some actionable tips to become a highly respected member.
          </p>
        </section>

        <section className="space-y-8">
          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center font-black text-sm">1</div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2">Be Honest in Descriptions</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              When listing an item or offering a skill, be clear about its condition or your level of expertise. Honesty prevents disappointment and builds long-term reputation.
            </p>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center font-black text-sm">2</div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2">Punctuality Matters</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Respect your neighbors' time. If you arrange a meet-up time, stick to it. If you're running late, update them as soon as possible via comments.
            </p>
          </div>

          <div className="relative pl-12">
            <div className="absolute left-0 top-0 w-8 h-8 bg-teal-100 text-teal-500 rounded-full flex items-center justify-center font-black text-sm">3</div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2">Engage and Like</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Show appreciation for good listings by giving them a Heart. Meaningful interactions make the community feel more alive and friendly.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-[32px] border border-amber-100">
           <Zap size={24} className="text-amber-500 shrink-0" />
           <p className="text-xs font-bold text-amber-800 tracking-tight">
             Consistency is key! Regular positive interactions will quickly build your profile's credibility.
           </p>
        </div>
      </div>
    </div>
  );
};
