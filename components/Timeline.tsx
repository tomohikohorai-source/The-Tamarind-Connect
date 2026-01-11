
import React, { useState, useMemo } from 'react';
import { Activity, LocationType, UserProfile } from '../types';
import { LOCATION_METADATA } from '../constants';
import { format, addDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Clock, MessageCircle, Megaphone, Edit3, Trash2, Sparkles, Wand2, ChevronDown, ChevronUp, Loader2, Key } from 'lucide-react';
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

    const aistudio = (window as any).aistudio;

    // 1. APIキーの存在確認と選択ダイアログのトリガー
    if (!process.env.API_KEY && aistudio) {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
          // キー選択後は自動でリロードされるか、環境変数が更新される想定
        }
      } catch (e) {
        console.error("Key selection failed", e);
      }
    }

    setIsFortuneLoading(true);

    try {
      // 2. インスタンス生成（最新のAPIキーを反映させるため直前に行う）
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 3. 軽量モデル gemini-flash-lite-latest を使用してタイムアウトを防止
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: "Generate a 'Daily Resident Fortune' for a condo app. Format: STRICT JSON ONLY. Language: English. Include: rank, message (short, friendly), luckyPlace (one of: Pool, Outdoor Playground, Indoor Playground, Lobby), emoji.",
        config: { 
          responseMimeType: "application/json",
          temperature: 1.0 
        },
      });

      const rawText = response.text || "";
      
      // 4. JSON抽出のロジックを強化
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanedJson = jsonMatch ? jsonMatch[0] : "";
      
      let result: FortuneResult;
      try {
        if (!cleanedJson) throw new Error("Empty response");
        result = JSON.parse(cleanedJson);
      } catch (parseError) {
        // パース失敗時のフォールバック
        result = {
          rank: "Bright Day",
          message: "A wonderful day is waiting for you and your kids! Enjoy the sunshine and the community spirit at The Tamarind.",
          luckyPlace: "Outdoor Playground",
          emoji: "🌞"
        };
      }

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
    } catch (error: any) {
      console.error("Fortune API Error:", error);
      
      // 5. エラー原因に応じたユーザーへのフィードバック
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        alert("API Key is not active or incorrect. Please re-select your API key.");
        if (aistudio) await aistudio.openSelectKey();
      } else if (error?.message?.includes('fetch') || error?.message?.includes('NetworkError')) {
        alert("Network Error: Please check your internet connection or turn off VPN/Ad-blockers.");
      } else {
        alert(`Drawing failed: ${error.message || 'Unknown error'}. Please try again later.`);
      }
    } finally {
      setIsFortuneLoading(false);
    }
  };

  const isNow = (activity: Activity) => {
    const now = new Date();
    return isWithinInterval(now, { start: parseISO(activity.startTime), end: parseISO(activity.endTime) });
  };

  const renderSection = (type: LocationType) => {
    const meta = LOCATION_METADATA[type];
    const sectionActivities = filteredActivities.filter(a => a.location === type).sort((a, b) => a.startTime.localeCompare(b.startTime));

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
                      <div className={`px-4 py-1.5 text-[9px] font-black uppercase ${a.isInvitation ? 'rounded-bl-none' : 'rounded-bl-2xl'} ${meta.bgColor} ${meta.textColor} tracking-widest border-l border-white/20`}>Live</div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2 text-gray-800 font-black">
                      <Clock size={16} className="text-pink-300" />
                      <span className="text-sm tracking-tight">{format(parseISO(a.startTime), 'HH:mm')} - {format(parseISO(a.endTime), 'HH:mm')}</span>
                    </div>
                    {isMine && (
                      <div className="flex gap-2 mr-10">
                        <button onClick={() => onEdit(a)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-pink-50 hover:text-pink-400 border border-gray-100"><Edit3 size={14} /></button>
                        <button onClick={() => { if(confirm('Delete?')) onDelete(a.id); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 border border-gray-100"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-4 items-center">
                      {(a.childAvatars || []).map((avatar, idx) => (
                        <div key={idx} className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center text-3xl shadow-lg border-2 border-gray-50 relative" style={{ zIndex: 10 - idx }}>{avatar}</div>
                      ))}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="text-[10px] text-pink-500 font-black uppercase tracking-widest mb-1 opacity-80">Players</div>
                      <div className="text-[15px] font-black text-gray-800 truncate">{a.childNicknames.join(', ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-gray-50 pt-4 mt-2">
                    <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1.5 rounded-full shrink-0">
                      <div className="text-lg leading-none">{a.parentAvatarIcon}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase">Unit {a.roomNumber}</div>
                    </div>
                    {a.message && (
                      <div className="flex gap-2 items-start min-w-0">
                        <MessageCircle size={12} className="text-pink-300 mt-1 shrink-0" />
                        <p className="text-[11px] text-gray-400 font-medium truncate italic">{a.message}</p>
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
      {/* Daily Fortune */}
      <section className="animate-fade-in">
        {!currentFortune ? (
          <button 
            onClick={handleDrawFortune} 
            disabled={isFortuneLoading} 
            className="w-full p-6 bg-gradient-to-br from-pink-400 to-orange-300 rounded-[32px] shadow-xl text-white active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1 opacity-80">Resident Fortune</span>
              <span className="text-lg font-black">{isFortuneLoading ? 'Connecting...' : (!process.env.API_KEY && (window as any).aistudio ? 'Setup API Key' : 'Draw Today\'s Fortune')}</span>
            </div>
            <div className="bg-white/20 p-4 rounded-3xl">
              {isFortuneLoading ? <Loader2 size={24} className="animate-spin" /> : (!process.env.API_KEY && (window as any).aistudio ? <Key size={24} /> : <Wand2 size={24} />)}
            </div>
          </button>
        ) : (
          <div className="bg-white border-2 border-pink-100 rounded-[40px] shadow-sm p-6 flex items-start gap-5 transition-all animate-slide-up">
            <div className="w-16 h-16 bg-pink-50 rounded-[24px] flex items-center justify-center text-4xl shrink-0 mt-1">{currentFortune.emoji || '✨'}</div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-pink-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{currentFortune.rank}</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10} className="text-orange-300" /> Today's Luck</span>
              </div>
              <p className={`text-sm font-bold text-gray-800 leading-snug transition-all ${isFortuneExpanded ? '' : 'line-clamp-2'}`}>{currentFortune.message}</p>
              {currentFortune.message?.length > 50 && (
                <button onClick={() => setIsFortuneExpanded(!isFortuneExpanded)} className="text-[10px] font-black text-pink-500 uppercase mt-2 flex items-center gap-1 active:scale-95">
                  {isFortuneExpanded ? <><ChevronUp size={12}/> Close</> : <><ChevronDown size={12}/> Read More</> }
                </button>
              )}
              <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full w-fit mt-3">
                <span className="uppercase tracking-widest">Lucky Place:</span>
                <span className="text-pink-500 font-black">{currentFortune.luckyPlace}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 pt-1 px-1">
        {dates.map((d, i) => (
          <button key={i} onClick={() => setSelectedDate(d)} className={`flex flex-col items-center min-w-[72px] p-4 rounded-[28px] transition-all relative ${isSameDay(d, selectedDate) ? 'bg-pink-400 text-white shadow-xl scale-105 font-black' : 'bg-white text-gray-400 border-2 border-transparent shadow-sm'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">{format(d, 'EEE', { locale: enUS })}</span>
            <span className="text-xl leading-none">{format(d, 'd')}</span>
          </button>
        ))}
      </div>
      <div className="pb-24">{renderSection(LocationType.POOL)}{renderSection(LocationType.OUTDOOR)}{renderSection(LocationType.INDOOR)}</div>
    </div>
  );
};
