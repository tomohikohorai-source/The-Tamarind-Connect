
import React from 'react';
import { UserProfile } from '../types';
import { Sparkles, ChevronRight, Zap, HelpCircle } from 'lucide-react';

interface Props {
  profile: UserProfile;
}

interface PetState {
  icon: string;
  name: string;
  level: string;
  nextThreshold: number;
}

export const PetGarden: React.FC<Props> = ({ profile }) => {
  const days = profile.totalLoginDays || 1;

  // Evolution Roadmap: Max 25 days interval
  const EVOLUTION_STAGES: PetState[] = [
    { icon: '🥚', name: 'Mysterious Egg', level: 'Egg', nextThreshold: 2 },
    { icon: '🐣', name: 'Newborn Baby', level: 'Baby', nextThreshold: 7 },
    { icon: '🐤', name: 'Playful Chick', level: 'Child', nextThreshold: 15 },
    { icon: '🐥', name: 'Active Bird', level: 'Young', nextThreshold: 30 },
    { icon: '🐔', name: 'Energetic Bird', level: 'Grown-up', nextThreshold: 55 },
    { icon: '🦆', name: 'Explorer Duck', level: 'Adventurer', nextThreshold: 80 },
    { icon: '🦉', name: 'Wise Owl', level: 'Scholar', nextThreshold: 105 },
    { icon: '🦜', name: 'Social Parrot', level: 'Speaker', nextThreshold: 130 },
    { icon: '🕊️', name: 'Peace Messenger', level: 'Messenger', nextThreshold: 155 },
    { icon: '🦩', name: 'Elegant Flamingo', level: 'Noble', nextThreshold: 180 },
    { icon: '🦚', name: 'Royal Peacock', level: 'Aristocrat', nextThreshold: 205 },
    { icon: '🦢', name: 'Graceful Swan', level: 'Beauty', nextThreshold: 230 },
    { icon: '🦅', name: 'Sky Majesty', level: 'General', nextThreshold: 255 },
    { icon: '🐆', name: 'Swift Cheetah', level: 'Speedster', nextThreshold: 280 },
    { icon: '🦓', name: 'Hidden Zebra', level: 'Pattern', nextThreshold: 305 },
    { icon: '🦒', name: 'Star Reacher', level: 'Dreamer', nextThreshold: 330 },
    { icon: '🐘', name: 'Mighty Elephant', level: 'Heavyweight', nextThreshold: 355 },
    { icon: '🐲', name: 'Sky Dragon', level: 'Ancient', nextThreshold: 380 },
    { icon: '🦖', name: 'Primal King', level: 'Warlord', nextThreshold: 405 },
    { icon: '🦄', name: 'Mythic Unicorn', level: 'Fantasy', nextThreshold: 430 },
    { icon: '👾', name: 'Cosmic Entity', level: 'Interstellar', nextThreshold: 455 },
    { icon: '🧞', name: 'Guardian Spirit', level: 'Demigod', nextThreshold: 480 },
    { icon: '🧚', name: 'Fairy Queen', level: 'Ethereal', nextThreshold: 500 },
    { icon: '👑', name: 'Eternal Legend', level: 'God', nextThreshold: 9999 },
  ];

  const getCurrentPet = (d: number): { current: PetState; next: PetState | null; prevThreshold: number } => {
    let prevThreshold = 0;
    for (let i = 0; i < EVOLUTION_STAGES.length; i++) {
      if (d < EVOLUTION_STAGES[i].nextThreshold) {
        return { 
          current: EVOLUTION_STAGES[i], 
          next: EVOLUTION_STAGES[i + 1] || null,
          prevThreshold 
        };
      }
      prevThreshold = EVOLUTION_STAGES[i].nextThreshold;
    }
    return { current: EVOLUTION_STAGES[EVOLUTION_STAGES.length - 1], next: null, prevThreshold };
  };

  const { current, next, prevThreshold } = getCurrentPet(days);
  const daysRemaining = next ? current.nextThreshold - days : 0;
  
  // Progress bar within current stage
  const stageTotalDays = current.nextThreshold - prevThreshold;
  const stageCurrentProgress = days - prevThreshold;
  const progress = Math.min(100, (stageCurrentProgress / stageTotalDays) * 100);

  return (
    <div className="mx-4 mt-1 mb-4">
      <div className="bg-gradient-to-br from-white to-pink-50/40 rounded-[32px] border-2 border-white shadow-lg p-3.5 relative overflow-hidden group">
        
        {/* Compact Background Zap */}
        <div className="absolute -right-4 -top-4 text-pink-100/10 rotate-12 pointer-events-none">
          <Zap size={100} fill="currentColor" />
        </div>

        <div className="flex flex-col gap-3">
          {/* Main Info Row */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-inner border border-pink-50 flex items-center justify-center text-3xl animate-float-mini">
                {current.icon}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-pink-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full border border-white">
                Lv.{days}
              </div>
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-orange-100 text-orange-600 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                  {current.level}
                </span>
                <span className="text-[14px] font-black text-gray-800 tracking-tight flex items-center gap-1 truncate">
                  {current.name} <Sparkles size={12} className="text-yellow-400 shrink-0" />
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50/50">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-300 to-pink-400 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-pink-500 whitespace-nowrap">
                  {daysRemaining > 0 ? `${daysRemaining}D LEFT` : 'MAX'}
                </span>
              </div>
            </div>
          </div>

          {/* Mystery Footer Row - Single line */}
          {next && (
            <div className="flex items-center justify-between border-t border-white/50 pt-2 px-1">
              <div className="flex items-center gap-1.5">
                <HelpCircle size={10} className="text-pink-300" />
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Mystery Evolution at Day <span className="text-pink-400">{current.nextThreshold}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-40">
                <div className="w-4 h-4 bg-gray-50 rounded flex items-center justify-center text-[10px] grayscale">
                  {current.icon}
                </div>
                <ChevronRight size={8} />
                <div className="w-4 h-4 bg-pink-100 rounded flex items-center justify-center text-[10px]">
                  ❓
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float-mini {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-float-mini {
          animation: float-mini 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
