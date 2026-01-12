import React, { useMemo } from 'react';
import { UserProfile } from '../types';
import { Sparkles, Zap, HelpCircle, Trees, Waves, Stars, Shield, Sword, Lock } from 'lucide-react';

interface Props {
  profile: UserProfile;
}

interface PetStage {
  icon: string;
  name: string;
  level: string;
  threshold: number;
}

interface EvolutionInfo {
  current: PetStage;
  next: PetStage | null;
  pathLabel: string;
  pathId: string;
  gradient: string;
  textColor: string;
  accentColor: string;
}

export const PetGarden: React.FC<Props> = ({ profile }) => {
  const days = profile.totalLoginDays || 1;

  // Stable hash based on UID
  const getHash = (seed: string) => seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mainBranchIndex = getHash(profile.uid) % 3; // 0: Forest, 1: Ocean, 2: Cosmic
  const subBranchIndex = getHash(profile.uid + 'v2') % 2; // 0: Alpha, 1: Beta

  const evolution = useMemo((): EvolutionInfo => {
    // 1. Common Stages (1-14 days)
    const COMMON: PetStage[] = [
      { icon: '🥚', name: 'Mysterious Egg', level: 'Seed', threshold: 1 },
      { icon: '🐣', name: 'Shell-capped Peep', level: 'Hatchling', threshold: 3 },
      { icon: '🐥', name: 'Aspirant Chick', level: 'Junior', threshold: 7 },
    ];

    // 2. Main Branches (15-99 days)
    const BRANCHES = [
      { // Forest Path
        id: 'forest', label: 'Forest Soul', gradient: 'from-green-50 to-emerald-50/40', text: 'text-emerald-600', accent: 'bg-emerald-100',
        stages: [
          { icon: '🦊', name: 'Forest Fox', level: 'Ranger', threshold: 15 },
          { icon: '🦌', name: 'Glade Deer', level: 'Scout', threshold: 30 },
          { icon: '🐅', name: 'Jade Tiger', level: 'Warrior', threshold: 60 },
        ],
        sub: [
          [ // Forest A: Ancient Protector
            { icon: '🐘', name: 'Elder Elephant', level: 'Guardian', threshold: 100 },
            { icon: '🦍', name: 'Jungle King', level: 'Chieftain', threshold: 150 },
            { icon: '🦕', name: 'Ancient Titan', level: 'God', threshold: 250 },
          ],
          [ // Forest B: Wild Hunter
            { icon: '🐺', name: 'Silver Wolf', level: 'Hunter', threshold: 100 },
            { icon: '🦁', name: 'Sun Lion', level: 'Sovereign', threshold: 150 },
            { icon: '🐉', name: 'Wood Dragon', level: 'Overlord', threshold: 250 },
          ]
        ]
      },
      { // Ocean Path
        id: 'ocean', label: 'Ocean Soul', gradient: 'from-blue-50 to-cyan-50/40', text: 'text-blue-600', accent: 'bg-blue-100',
        stages: [
          { icon: '🐠', name: 'Coral Fish', level: 'Social', threshold: 15 },
          { icon: '🐢', name: 'Sea Turtle', level: 'Steady', threshold: 30 },
          { icon: '🐬', name: 'Sky Dolphin', level: 'Ace', threshold: 60 },
        ],
        sub: [
          [ // Ocean A: Mythic Depth
            { icon: '🐙', name: 'Deep Kraken', level: 'Genius', threshold: 100 },
            { icon: '🐳', name: 'Island Whale', level: 'Leviathan', threshold: 150 },
            { icon: '🧜‍♂️', name: 'Sea God', level: 'Eternal', threshold: 250 },
          ],
          [ // Ocean B: Coastal King
            { icon: '🦈', name: 'Great Shark', level: 'Striker', threshold: 100 },
            { icon: '🐊', name: 'Deep Gator', level: 'Fearless', threshold: 150 },
            { icon: '🐋', name: 'Glacier Whale', level: 'Ancient', threshold: 250 },
          ]
        ]
      },
      { // Cosmic Path
        id: 'cosmic', label: 'Cosmic Soul', gradient: 'from-purple-50 to-pink-50/40', text: 'text-purple-600', accent: 'bg-purple-100',
        stages: [
          { icon: '🦄', name: 'Star Pony', level: 'Mystic', threshold: 15 },
          { icon: '🧚', name: 'Pixie Star', level: 'Fairy', threshold: 30 },
          { icon: '🤖', name: 'Neon Bot', level: 'Cyber', threshold: 60 },
        ],
        sub: [
          [ // Cosmic A: Celestial Being
            { icon: '🐲', name: 'Galaxy Dragon', level: 'Astral', threshold: 100 },
            { icon: '🛰️', name: 'Orbital Eye', level: 'Oracle', threshold: 150 },
            { icon: '👑', name: 'Cosmic King', level: 'Divinity', threshold: 250 },
          ],
          [ // Cosmic B: Dimension Walker
            { icon: '🛸', name: 'Space Pilot', level: 'Visitor', threshold: 100 },
            { icon: '👾', name: 'Void Entity', level: 'Stranger', threshold: 150 },
            { icon: '🧿', name: 'Eye of Time', level: 'Abyss', threshold: 250 },
          ]
        ]
      }
    ];

    let currentBranch = BRANCHES[mainBranchIndex];
    let allStages: PetStage[] = [...COMMON];

    if (days >= 15 && days < 100) {
      allStages = [...COMMON, ...currentBranch.stages];
    } else if (days >= 100) {
      allStages = [...COMMON, ...currentBranch.stages, ...currentBranch.sub[subBranchIndex]];
    }

    // Find current stage
    let currentIdx = 0;
    for (let i = 0; i < allStages.length; i++) {
      if (days >= allStages[i].threshold) {
        currentIdx = i;
      }
    }

    const current = allStages[currentIdx];
    const next = allStages[currentIdx + 1] || null;

    // Visual styles adapt based on phase
    const isCommon = days < 15;
    return {
      current,
      next,
      pathLabel: isCommon ? 'Common Soul' : (days >= 100 ? `${currentBranch.label} (Final)` : currentBranch.label),
      pathId: isCommon ? 'common' : currentBranch.id,
      gradient: isCommon ? 'from-orange-50 to-pink-50/40' : currentBranch.gradient,
      textColor: isCommon ? 'text-pink-600' : currentBranch.text,
      accentColor: isCommon ? 'bg-pink-100' : currentBranch.accent,
    };
  }, [days, mainBranchIndex, subBranchIndex]);

  const prevThreshold = evolution.current.threshold;
  const nextThreshold = evolution.next ? evolution.next.threshold : prevThreshold + 100;
  const progress = Math.min(100, ((days - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

  return (
    <div className="mx-4 mt-1 mb-4">
      <div className={`bg-gradient-to-br ${evolution.gradient} rounded-[32px] border-2 border-white shadow-lg p-3.5 relative overflow-hidden group`}>
        
        {/* Branch-specific background icons */}
        <div className={`absolute -right-4 -top-4 ${evolution.textColor} opacity-10 rotate-12 pointer-events-none`}>
          {evolution.pathId === 'forest' ? <Trees size={100} fill="currentColor" /> : 
           evolution.pathId === 'ocean' ? <Waves size={100} fill="currentColor" /> : 
           evolution.pathId === 'cosmic' ? <Stars size={100} fill="currentColor" /> : 
           <Zap size={100} fill="currentColor" />}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-inner border border-white flex items-center justify-center text-3xl animate-float-mini">
                {evolution.current.icon}
              </div>
              <div className={`absolute -bottom-1 -right-1 ${evolution.textColor.replace('text', 'bg')} text-[8px] font-black text-white px-1.5 py-0.5 rounded-full border border-white shadow-sm`}>
                Lv.{days}
              </div>
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`${evolution.accentColor} ${evolution.textColor} text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest whitespace-nowrap flex items-center gap-1`}>
                  {days < 15 ? <HelpCircle size={10}/> : (days >= 100 ? (subBranchIndex === 0 ? <Shield size={10}/> : <Sword size={10}/>) : <Zap size={10}/>)}
                  {evolution.current.level}
                </span>
                <span className="text-[14px] font-black text-gray-800 tracking-tight flex items-center gap-1 truncate">
                  {evolution.current.name} <Sparkles size={12} className="text-yellow-400 shrink-0" />
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50/50">
                  <div 
                    className={`h-full bg-gradient-to-r ${evolution.textColor.replace('text', 'from').replace('-600', '-300')} ${evolution.textColor.replace('text', 'to').replace('-600', '-500')} rounded-full transition-all duration-1000`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={`text-[9px] font-black ${evolution.textColor} whitespace-nowrap`}>
                  {evolution.next ? 'NEXT ???' : 'MAX'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/50 pt-2 px-1">
            <div className="flex items-center gap-1.5">
              <Lock size={10} className={`${evolution.textColor} opacity-40`} />
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                {evolution.next ? (
                  <>Next evolution approaching...</>
                ) : (
                  <>Ultimate Form Reached!</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-60">
              <span className="text-[7px] font-black text-gray-300 uppercase tracking-tighter mr-1">
                 {days < 15 ? 'Mystery Soul' : 'Evolving...'}
              </span>
              <div className="flex -space-x-1.5">
                <div className={`w-4 h-4 bg-white/50 rounded flex items-center justify-center text-[10px] z-10 border border-white/20`}>
                  {evolution.current.icon}
                </div>
                <div className={`w-4 h-4 ${evolution.accentColor} rounded flex items-center justify-center text-[10px] border border-white/20`}>
                  <Lock size={8} />
                </div>
              </div>
            </div>
          </div>
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