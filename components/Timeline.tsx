
import React, { useState, useMemo } from 'react';
import { Activity, LocationType, UserProfile } from '../types';
import { LOCATION_METADATA } from '../constants';
import { format, addDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Clock, MessageCircle, User, Megaphone, Edit3, Trash2 } from 'lucide-react';

interface Props {
  activities: Activity[];
  profile: UserProfile | null;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export const Timeline: React.FC<Props> = ({ activities, profile, onEdit, onDelete }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => isSameDay(parseISO(a.startTime), selectedDate));
  }, [activities, selectedDate]);

  const invitations = useMemo(() => {
    return activities.filter(a => a.isInvitation && isSameDay(parseISO(a.startTime), new Date()));
  }, [activities]);

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
      <div key={type} className="mb-6">
        <div className={`flex items-center gap-2 mb-3 p-3 rounded-2xl ${meta.bgColor} ${meta.textColor}`}>
          <span className="text-xl">{meta.icon}</span>
          <h3 className="font-bold text-sm uppercase tracking-wide">{meta.label}</h3>
        </div>
        
        {sectionActivities.length > 0 ? (
          <div className="space-y-4">
            {sectionActivities.map(a => {
              const isMine = profile && a.roomNumber === profile.roomNumber;
              return (
                <div key={a.id} className={`p-5 rounded-3xl bg-white border-2 ${isNow(a) ? meta.borderColor : 'border-gray-50'} shadow-sm relative overflow-hidden transition-all active:scale-[0.98]`}>
                  {isNow(a) && (
                    <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase rounded-bl-2xl ${meta.bgColor} ${meta.textColor} animate-pulse tracking-widest`}>
                      In Area
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-gray-800 font-black">
                      <Clock size={16} className="text-gray-300" />
                      <span className="text-sm">{format(parseISO(a.startTime), 'HH:mm')} - {format(parseISO(a.endTime), 'HH:mm')}</span>
                    </div>
                    {isMine && (
                      <div className="flex gap-2 mr-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                          className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-pink-50 hover:text-pink-400"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm('Delete this?')) onDelete(a.id); }}
                          className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl overflow-hidden border border-gray-100">
                      {a.parentAvatarIcon}
                    </div>
                    <div className="flex-grow">
                      <div className="text-xs font-bold text-gray-800">{a.parentNickname} <span className="text-gray-400 font-medium ml-1">Room {a.roomNumber}</span></div>
                      <div className="text-[10px] text-pink-500 font-black uppercase tracking-tighter mt-0.5">
                        Playing with: {a.childNicknames.join(', ')}
                      </div>
                    </div>
                  </div>

                  {a.message && (
                    <div className="flex gap-2 items-start bg-gray-50 p-3 rounded-2xl mt-1">
                      <MessageCircle size={14} className="text-pink-300 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500 italic leading-relaxed font-medium">"{a.message}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-300 text-xs font-bold border-2 border-dashed border-gray-100 rounded-3xl uppercase tracking-widest">
            No Activities Scheduled
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Invitation Banner */}
      {invitations.length > 0 && (
        <div className="bg-gradient-to-r from-pink-400 to-orange-400 p-5 rounded-3xl text-white shadow-lg animate-fade-in relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
          <h4 className="font-black flex items-center gap-2 mb-2 uppercase tracking-widest text-xs">
            <Megaphone size={16} className="animate-bounce" /> New Invitation!
          </h4>
          <div className="text-sm font-bold leading-snug">
            {invitations[0].parentNickname}: <span className="font-normal italic">"{invitations[0].message || "Join us for some fun!"}"</span>
          </div>
        </div>
      )}

      {/* Date Tabs */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {dates.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDate(d)}
            className={`flex flex-col items-center min-w-[70px] p-4 rounded-3xl transition-all ${
              isSameDay(d, selectedDate)
                ? 'bg-pink-400 text-white shadow-lg scale-105 font-black border-2 border-pink-300'
                : 'bg-white text-gray-400 border-2 border-transparent'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest mb-1">{format(d, 'EEE', { locale: enUS })}</span>
            <span className="text-xl">{format(d, 'd')}</span>
          </button>
        ))}
      </div>

      <div className="pb-10">
        {renderSection(LocationType.POOL)}
        {renderSection(LocationType.OUTDOOR)}
        {renderSection(LocationType.INDOOR)}
      </div>
    </div>
  );
};
