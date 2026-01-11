
import React, { useState, useMemo, useEffect } from 'react';
import { Activity, LocationType, UserProfile } from '../types';
import { LOCATION_METADATA } from '../constants';
import { format, addDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Clock, MessageCircle, Megaphone, Edit3, Trash2, Sparkles, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, doc, updateDoc } from '../firebase';

interface Props {
  activities: Activity[];
  profile: UserProfile | null;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

interface FortuneResult {
  rank: string;
  message: string;
  luckyPlace: string;
  emoji: string;
}

export const Timeline: React.FC<Props> = ({ activities, profile, onEdit, onDelete, onUpdateProfile }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFortuneLoading, setIsFortuneLoading] = useState(false);
  const [isFortuneExpanded, setIsFortuneExpanded] = useState(false);
  
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => isSameDay(parseISO(a.startTime), selectedDate));
  }, [activities, selectedDate]);

  const currentFortune = useMemo((): FortuneResult | null => {
    if (!profile?.lastFortuneDate || !profile?.lastFortuneResult) return null;
    const fortuneDate = parseISO(profile.lastFortuneDate);
    if (!isSameDay(fortuneDate, new Date())) return null;
    try {
      return JSON.parse(profile.lastFortuneResult);
    } catch {
      return null;
    }
  }, [profile]);

  const handleDrawFortune = async () => {
    if (!profile || isFortuneLoading) return;
    setIsFortuneLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "コンドミニアムの住民向けアプリで使う「今日の住民占い」の結果を1つ生成してください。住民同士の交流が楽しくなるような、温かい内容にしてください。JSON形式で返してください。プロパティは rank (運勢ランク: 大吉、絶好調、ニコニコ、など), message (住民への一言メッセージ 100文字程度。具体的なアドバイスや励ましを含めてください), luckyPlace (プールエリア、屋外プレイグラウンド、屋内プレイグラウンド、ロビーのいずれか1つ), emoji (その運勢に合う絵文字) です。",
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text || "{}";
      const result: FortuneResult = JSON.parse(resultText);
      const today = new Date().toISOString();

      const updatedProfile = {
        ...profile,
        lastFortuneDate: today,
        lastFortuneResult: JSON.stringify(result)
      };

      await updateDoc(doc(db, "users", profile.uid), {
        lastFortuneDate: today,
        lastFortuneResult: JSON.stringify(result)
      });

      onUpdateProfile(updatedProfile);
    } catch (error) {
      console.error("Fortune Error:", error);
    } finally {
      setIsFortuneLoading(false);
    }
  };

  const isNow = (activity: Activity) => {
    const now = new Date();
    const start = parseISO(activity.startTime);
    const end = parseISO(activity.endTime);
    return isWithinInterval(now, { start, end });
  };

  const renderSection = (type: LocationType) => {
    const meta = LOCATION_METADATA[type];
    const sectionActivities = filteredActivities
      .filter(a => a.location === type)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <div key={type} className="mb-8">
        <div className={`flex items-center gap-2 mb-4 p-3.5 rounded-2xl ${meta.bgColor} ${meta.textColor} shadow-sm border ${meta.borderColor}`}>
          <span className="text-xl">{meta.icon}</span>
          <h3 className="font-extrabold text-[12px] uppercase tracking-[0.1em]">{meta.label}</h3>
        </div>
        
        {sectionActivities.length > 0 ? (
          <div className="space-y-5">
            {sectionActivities.map(a => {
              const isMine = profile && a.userId === profile.uid;
              return (
                <div key={a.id} className={`p-5 rounded-[32px] bg-white border-2 ${isNow(a) ? meta.borderColor : 'border-gray-50'} shadow-sm relative transition-all active:scale-[0.98]`}>
                  <div className="absolute top-0 right-0 flex items-center">
                    {a.isInvitation && (
                      <div className="bg-orange-400 text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 rounded-bl-xl shadow-sm animate-pulse">
                        <Megaphone size={12} /> Invite
                      </div>
                    )}
                    {isNow(a) && (
                      <div className={`px-4 py-1.5 text-[9px] font-black uppercase ${a.isInvitation ? 'rounded-bl-none' : 'rounded-bl-2xl'} ${meta.bgColor} ${meta.textColor} tracking-widest border-l border-white/20`}>
                        Live
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2 text-gray-800 font-black">
                      <Clock size={16} className="text-pink-300" />
                      <span className="text-sm tracking-tight">{format(parseISO(a.startTime), 'HH:mm')} - {format(parseISO(a.endTime), 'HH:mm')}</span>
                    </div>
                    {isMine && (
                      <div className="flex gap-2 mr-10">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(a); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-pink-50 hover:text-pink-400 border border-gray-100"><Edit3 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) onDelete(a.id); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 border border-gray-100"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 overflow-hidden">
                    <div className="flex -space-x-4 shrink-0 items-center py-1">
                      {(a.childAvatars || []).map((avatar, idx) => (
                        <div 
                          key={idx} 
                          className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center text-3xl shadow-lg border-2 border-gray-50 relative shrink-0"
                          style={{ zIndex: 10 - idx }}
                        >
                          {avatar}
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-grow pr-2">
                      <div className="text-[10px] text-pink-500 font-black uppercase tracking-widest mb-1 opacity-80">Players</div>
                      <div className="text-[15px] font-black text-gray-800 truncate leading-tight">
                        {a.childNicknames.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-gray-50 pt-4 mt-2">
                    <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1.5 rounded-full shrink-0 border border-gray-100">
                      <div className="text-lg leading-none">{a.parentAvatarIcon}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Unit {a.roomNumber}</div>
                    </div>
                    {a.message && (
                      <div className="flex-grow flex gap-2 items-start min-w-0 overflow-hidden">
                        <MessageCircle size={12} className="text-pink-300 mt-1 shrink-0" />
                        <p className="text-[11px] text-gray-400 font-medium truncate italic leading-relaxed">{a.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-300 text-[10px] font-black border-2 border-dashed border-gray-100 rounded-[32px] uppercase tracking-[0.2em] bg-gray-50/30">Empty Schedule</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Daily Fortune Section */}
      <section className="animate-fade-in">
        {!currentFortune ? (
          <button 
            onClick={handleDrawFortune}
            disabled={isFortuneLoading}
            className="w-full p-6 bg-gradient-to-br from-pink-400 to-orange-300 rounded-[32px] shadow-xl shadow-pink-100 flex items-center justify-between text-white active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col items-start text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Resident Fortune</span>
              <span className="text-lg font-black tracking-tight">{isFortuneLoading ? 'Generating Luck...' : 'Draw Today\'s Fortune'}</span>
            </div>
            <div className="bg-white/20 p-4 rounded-3xl relative z-10">
              <Wand2 size={24} className={isFortuneLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'} />
            </div>
            {/* Decoration */}
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </button>
        ) : (
          <div className="w-full p-6 bg-white border-2 border-pink-100 rounded-[40px] shadow-sm flex items-start gap-5 animate-slide-up transition-all">
            <div className="w-20 h-20 bg-pink-50 rounded-[28px] flex items-center justify-center text-4xl shadow-inner shrink-0 mt-1">
              {currentFortune.emoji || '✨'}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-pink-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{currentFortune.rank}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={10} className="text-orange-300" /> Today's Luck
                </span>
              </div>
              
              <div className="relative">
                <p className={`text-sm font-bold text-gray-800 leading-snug mb-2 transition-all duration-300 ${isFortuneExpanded ? '' : 'line-clamp-2'}`}>
                  {currentFortune.message}
                </p>
                {currentFortune.message && currentFortune.message.length > 30 && (
                  <button 
                    onClick={() => setIsFortuneExpanded(!isFortuneExpanded)}
                    className="flex items-center gap-1 text-[10px] font-black text-pink-500 uppercase tracking-widest mb-3 hover:text-pink-600 active:scale-95 transition-all"
                  >
                    {isFortuneExpanded ? (
                      <><ChevronUp size={14} /> 閉じる</>
                    ) : (
                      <><ChevronDown size={14} /> 続きを見る</>
                    )}
                  </button>
                )}
              </div>

              <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                <span className="uppercase tracking-widest">Lucky Place:</span>
                <span className="text-pink-500 font-black">{currentFortune.luckyPlace}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 pt-1 px-1">
        {dates.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDate(d)}
            className={`flex flex-col items-center min-w-[72px] p-4 rounded-[28px] transition-all relative ${
              isSameDay(d, selectedDate) ? 'bg-pink-400 text-white shadow-xl scale-105 font-black' : 'bg-white text-gray-400 border-2 border-transparent shadow-sm'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">{format(d, 'EEE', { locale: enUS })}</span>
            <span className="text-xl leading-none">{format(d, 'd')}</span>
          </button>
        ))}
      </div>
      <div className="pb-24">{renderSection(LocationType.POOL)}{renderSection(LocationType.OUTDOOR)}{renderSection(LocationType.INDOOR)}</div>
    </div>
  );
};
