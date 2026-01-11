
import React, { useState, useEffect } from 'react';
import { UserProfile, LocationType, Activity } from '../types';
import { LOCATION_METADATA } from '../constants';
import { addDays, format, setHours, setMinutes, parseISO, isAfter } from 'date-fns';
import { Clock, MessageSquare, Megaphone, AlertCircle, Calendar } from 'lucide-react';

interface Props {
  profile: UserProfile;
  initialActivity?: Activity;
  onSubmit: (activity: Activity) => void;
  onCancel: () => void;
}

export const CheckInForm: React.FC<Props> = ({ profile, initialActivity, onSubmit, onCancel }) => {
  const [location, setLocation] = useState<LocationType>(initialActivity?.location || LocationType.POOL);
  const [type, setType] = useState<'NOW' | 'FUTURE'>(initialActivity ? 'FUTURE' : 'NOW');
  const [selectedChildren, setSelectedChildren] = useState<string[]>(initialActivity?.childNicknames || profile.children.map(c => c.nickname));
  const [date, setDate] = useState(initialActivity ? parseISO(initialActivity.startTime) : new Date());
  
  const now = new Date();
  const [startTime, setStartTime] = useState(initialActivity ? format(parseISO(initialActivity.startTime), 'HH:mm') : format(now, 'HH:mm'));
  const [endTime, setEndTime] = useState(initialActivity ? format(parseISO(initialActivity.endTime), 'HH:mm') : format(new Date(now.getTime() + 60 * 60000), 'HH:mm'));
  
  const [message, setMessage] = useState(initialActivity?.message || '');
  const [isInvitation, setIsInvitation] = useState(initialActivity?.isInvitation || false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (endTime > "20:00") {
      setEndTime("20:00");
    }
    if (startTime > "20:00") {
      setStartTime("20:00");
    }
  }, [endTime, startTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let start: Date;
    if (type === 'NOW') {
      start = new Date();
    } else {
      const [sh, sm] = startTime.split(':').map(Number);
      start = setMinutes(setHours(date, sh), sm);
    }
    
    const [eh, em] = endTime.split(':').map(Number);
    const end = setMinutes(setHours(date, eh), em);

    if (isAfter(start, end)) {
      setError('End time must be after start time');
      return;
    }

    if (endTime > "20:00") {
      setError('Facility closes at 20:00');
      return;
    }

    const activity: Activity = {
      id: initialActivity?.id || crypto.randomUUID(),
      userId: initialActivity?.userId || 'user-unique', 
      parentNickname: profile.parentNickname,
      roomNumber: profile.roomNumber,
      location,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      message,
      childNicknames: selectedChildren,
      isInvitation,
      parentAvatarIcon: profile.avatarIcon
    };

    onSubmit(activity);
  };

  const toggleChild = (nickname: string) => {
    if (selectedChildren.includes(nickname)) {
      setSelectedChildren(selectedChildren.filter(n => n !== nickname));
    } else {
      setSelectedChildren([...selectedChildren, nickname]);
    }
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-pink-50 hide-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{initialActivity ? 'Edit Activity' : 'Register Activity'}</h2>
        <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Location */}
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-widest">Select Location</label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(LocationType) as LocationType[]).map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`p-4 rounded-3xl border-2 flex flex-col items-center transition-all ${
                  location === loc ? `${LOCATION_METADATA[loc].borderColor} bg-white ring-4 ring-pink-50` : 'border-transparent bg-gray-50 opacity-60'
                }`}
              >
                <span className="text-3xl mb-1">{LOCATION_METADATA[loc].icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${location === loc ? LOCATION_METADATA[loc].textColor : 'text-gray-400'}`}>
                  {LOCATION_METADATA[loc].label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        {!initialActivity && (
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-widest">When?</label>
            <div className="flex gap-3">
              {[
                { id: 'NOW', label: 'Play Now' },
                { id: 'FUTURE', label: 'Book Future' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all text-sm uppercase tracking-widest ${
                    type === t.id ? 'bg-pink-400 text-white shadow-xl' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time */}
        <div className="space-y-4">
          {(type === 'FUTURE' || initialActivity) && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase flex items-center gap-1"><Calendar size={12}/> Date</label>
              <label className="block bg-gray-50 rounded-2xl cursor-pointer">
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  max={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                  value={format(date, 'yyyy-MM-dd')}
                  onChange={e => setDate(new Date(e.target.value))}
                  className="w-full p-4 bg-transparent border-none outline-none text-base font-bold text-gray-700 cursor-pointer"
                />
              </label>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase flex items-center gap-1"><Clock size={12}/> Start Time</label>
              <label className={`block bg-gray-50 rounded-2xl cursor-pointer ${type === 'NOW' && !initialActivity ? 'opacity-50 pointer-events-none' : ''}`}>
                <input
                  type="time"
                  value={startTime}
                  disabled={type === 'NOW' && !initialActivity}
                  max="20:00"
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full p-4 bg-transparent border-none outline-none text-lg font-black text-gray-800 cursor-pointer"
                />
              </label>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase flex items-center gap-1"><Clock size={12}/> End Time (Max 20:00)</label>
              <label className="block bg-gray-50 rounded-2xl cursor-pointer">
                <input
                  type="time"
                  max="20:00"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full p-4 bg-transparent border-none outline-none text-lg font-black text-gray-800 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Kids Selection */}
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-widest">Who is playing?</label>
          <div className="flex flex-wrap gap-3">
            {profile.children.map(child => (
              <button
                key={child.id}
                type="button"
                onClick={() => toggleChild(child.nickname)}
                className={`flex items-center gap-3 pr-5 pl-1.5 py-1.5 rounded-full border-2 transition-all ${
                  selectedChildren.includes(child.nickname)
                    ? 'bg-pink-100 border-pink-300 text-pink-600 font-black'
                    : 'bg-white border-gray-100 text-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-50 overflow-hidden border border-gray-200 flex items-center justify-center text-lg">
                  {child.avatarIcon}
                </div>
                <span className="text-sm tracking-tight">{child.nickname}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={16} /> Short Note
          </label>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Bringing water toys / At the sandbox"
            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-sm font-bold placeholder:font-medium placeholder:text-gray-300"
          />
        </div>

        {/* Invitation */}
        <div className="flex items-center justify-between p-5 bg-orange-50 rounded-[32px] border border-orange-100">
          <div className="flex items-center gap-4 text-orange-700">
            <Megaphone size={24} className="animate-pulse" />
            <div>
              <div className="font-black text-xs uppercase tracking-wider">Invite Neighbors</div>
              <div className="text-[10px] font-bold opacity-60">Shown in the invitation banner</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isInvitation}
            onChange={e => setIsInvitation(e.target.checked)}
            className="w-7 h-7 rounded-xl accent-orange-500 cursor-pointer"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs font-black bg-red-50 p-4 rounded-2xl animate-pulse">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={selectedChildren.length === 0}
          className={`w-full py-5 rounded-[28px] font-black shadow-xl transition-all active:scale-95 uppercase tracking-widest ${
            selectedChildren.length > 0 ? 'bg-pink-400 text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          {initialActivity ? 'Update Status' : 'Post Status'}
        </button>
      </form>
    </div>
  );
};
