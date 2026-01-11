
import React, { useState, useEffect } from 'react';
import { UserProfile, LocationType, Activity, Child } from '../types';
import { LOCATION_METADATA } from '../constants';
import { addDays, format, setHours, setMinutes, parseISO, isAfter } from 'date-fns';
import { Clock, MessageSquare, Megaphone, AlertCircle, Calendar, ChevronLeft, X } from 'lucide-react';

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
    if (endTime > "20:00") setEndTime("20:00");
    if (startTime > "20:00") setStartTime("20:00");
  }, [endTime, startTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Use manually set or default startTime for both NOW and FUTURE types
    const [sh, sm] = startTime.split(':').map(Number);
    const start = setMinutes(setHours(date, sh), sm);
    
    const [eh, em] = endTime.split(':').map(Number);
    const end = setMinutes(setHours(date, eh), em);

    if (isAfter(start, end)) {
      setError('End time must be after start time');
      return;
    }

    const selectedAvatars = profile.children
      .filter(c => selectedChildren.includes(c.nickname))
      .map(c => c.avatarIcon);

    const activity: Activity = {
      id: initialActivity?.id || crypto.randomUUID(),
      userId: profile.uid, 
      parentNickname: profile.parentNickname,
      roomNumber: profile.roomNumber,
      location,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      message,
      childNicknames: selectedChildren,
      childAvatars: selectedAvatars,
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
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-pink-50 hide-scrollbar relative">
      <div className="flex justify-between items-center mb-10">
        <button 
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-black text-xs bg-gray-50 px-4 py-2.5 rounded-2xl transition-all active:scale-95 border border-gray-100 uppercase tracking-widest shadow-sm"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase pr-2">
          {initialActivity ? 'Edit Plan' : 'Check-In'}
        </h2>
        <button onClick={onCancel} className="text-gray-300 hover:text-gray-500">
           <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-[10px] font-black bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-[0.2em]">Select Area</label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(LocationType) as LocationType[]).map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`p-4 rounded-3xl border-2 flex flex-col items-center transition-all ${
                  location === loc ? `${LOCATION_METADATA[loc].borderColor} bg-white ring-4 ring-pink-50/50` : 'border-transparent bg-gray-50 opacity-60'
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

        {!initialActivity && (
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-[0.2em]">Schedule</label>
            <div className="flex gap-3">
              {[
                { id: 'NOW', label: 'Play Now' },
                { id: 'FUTURE', label: 'Book Future' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest ${
                    type === t.id ? 'bg-pink-400 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {(type === 'FUTURE' || initialActivity) && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase flex items-center gap-2"><Calendar size={14}/> Date</label>
              <input
                type="date"
                min={format(new Date(), 'yyyy-MM-dd')}
                max={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                value={format(date, 'yyyy-MM-dd')}
                onChange={e => setDate(new Date(e.target.value))}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-base font-bold text-gray-700"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase flex items-center gap-2"><Clock size={14}/> From</label>
              <input
                type="time"
                value={startTime}
                max="20:00"
                onChange={e => setStartTime(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-lg font-black text-gray-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase flex items-center gap-2"><Clock size={14}/> Until</label>
              <input
                type="time"
                max="20:00"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-lg font-black text-gray-800"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-[0.2em]">Who's playing?</label>
          <div className="flex flex-wrap gap-3">
            {profile.children.map(child => (
              <button
                key={child.id}
                type="button"
                onClick={() => toggleChild(child.nickname)}
                className={`flex items-center gap-3 pr-5 pl-1.5 py-1.5 rounded-[20px] border-2 transition-all ${
                  selectedChildren.includes(child.nickname)
                    ? 'bg-pink-400 border-pink-400 text-white font-black shadow-lg scale-[1.05]'
                    : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xl shadow-inner ${selectedChildren.includes(child.nickname) ? 'bg-white/20' : 'bg-gray-50'}`}>
                  {child.avatarIcon}
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{child.nickname}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-[0.2em]">Memo (Optional)</label>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 text-gray-300" size={18} />
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Bringing some snacks! / Let's play tag!"
              rows={3}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-3xl border-none outline-none font-medium text-sm text-gray-700 resize-none focus:ring-2 ring-pink-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-orange-400 rounded-[32px] text-white shadow-xl shadow-orange-100">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Megaphone size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="font-black text-[13px] uppercase tracking-widest">Invite Neighbors</div>
              <div className="text-[10px] font-bold opacity-80">Add INVITE badge to card</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isInvitation}
              onChange={e => setIsInvitation(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-white/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40"></div>
          </label>
        </div>

        <button
          type="submit"
          disabled={selectedChildren.length === 0}
          className={`w-full py-5 rounded-[28px] font-black shadow-2xl transition-all active:scale-95 uppercase tracking-[0.2em] text-[13px] ${
            selectedChildren.length > 0 ? 'bg-pink-400 text-white shadow-pink-200' : 'bg-gray-200 text-gray-400'
          }`}
        >
          {initialActivity ? 'Save Changes' : 'Confirm Check-In'}
        </button>
      </form>
    </div>
  );
};
