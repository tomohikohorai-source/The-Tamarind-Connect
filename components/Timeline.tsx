
import React, { useState, useMemo } from 'react';
import { Activity, LocationType, UserProfile } from '../types';
import { LOCATION_METADATA } from '../constants';
import { format, addDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Clock, MessageCircle, Megaphone, Edit3, Trash2 } from 'lucide-react';

interface Props {
  activities: Activity[];
  profile: UserProfile | null;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const Timeline: React.FC<Props> = ({ activities, profile, onEdit, onDelete }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => isSameDay(parseISO(a.startTime), selectedDate));
  }, [activities, selectedDate]);

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
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 pt-1 px-1">
        {dates.map((d, i) => (
          <button key={i} onClick={() => setSelectedDate(d)} className={`flex flex-col items-center min-w-[72px] p-4 rounded-[28px] transition-all relative ${isSameDay(d, selectedDate) ? 'bg-pink-400 text-white shadow-xl scale-105 font-black' : 'bg-white text-gray-400 border-2 border-transparent shadow-sm'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">{format(d, 'EEE', { locale: enUS })}</span>
            <span className="text-xl leading-none">{format(d, 'd')}</span>
          </button>
        ))}
      </div>
      <div className="pb-24">
        {renderSection(LocationType.POOL)}
        {renderSection(LocationType.OUTDOOR)}
        {renderSection(LocationType.INDOOR)}
      </div>
    </div>
  );
};
