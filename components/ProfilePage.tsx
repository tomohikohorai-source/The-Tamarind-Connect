
import React, { useState } from 'react';
import { UserProfile, Activity, Child } from '../types';
import { AVATAR_ICONS, LOCATION_METADATA } from '../constants';
import { Home, Baby, LogOut, Calendar, Edit3, Trash2, Save, X, PlusCircle, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  profile: UserProfile;
  activities: Activity[];
  onLogout: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const ProfilePage: React.FC<Props> = ({ profile, activities, onLogout, onEdit, onDelete, onUpdateProfile }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNickname, setEditNickname] = useState(profile.parentNickname);
  const [editAvatar, setEditAvatar] = useState(profile.avatarIcon);
  
  const initialBlock = profile.roomNumber.split('-')[0] || '3A';
  const initialUnit = profile.roomNumber.split('-').slice(1).join('-') || '';
  
  const [editBlock, setEditBlock] = useState<'3A' | '3B'>(initialBlock as any);
  const [editUnitPath, setEditUnitPath] = useState(initialUnit);
  const [editChildren, setEditChildren] = useState<Child[]>(profile.children);

  const myActivities = activities
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  // Relaxed validation to ensure the button is clickable
  const isUnitValid = editUnitPath.trim().length > 0;
  const isFormValid = editNickname.trim().length > 0 && isUnitValid && editChildren.length > 0 && editChildren.every(c => c.nickname.trim().length > 0 && c.age.trim().length > 0);

  const handleSaveProfile = () => {
    if (isFormValid) {
      onUpdateProfile({
        parentNickname: editNickname,
        roomNumber: `${editBlock}-${editUnitPath}`,
        children: editChildren,
        avatarIcon: editAvatar
      });
      setIsEditingProfile(false);
    }
  };

  const handleAddChild = () => {
    if (editChildren.length >= 10) return;
    const newChild: Child = {
      id: crypto.randomUUID(),
      nickname: '',
      age: '',
      gender: 'boy',
      intro: '',
      avatarIcon: AVATAR_ICONS.CHILDREN[0]
    };
    setEditChildren([...editChildren, newChild]);
  };

  const updateEditChild = (id: string, updates: Partial<Child>) => {
    setEditChildren(editChildren.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeEditChild = (id: string) => {
    setEditChildren(editChildren.filter(c => c.id !== id));
  };

  return (
    <div className="p-6 pb-24 space-y-8 animate-fade-in overflow-y-auto max-h-screen hide-scrollbar">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-pink-50 rounded-[20px] flex items-center justify-center text-4xl border border-pink-100 shadow-inner">
            {profile.avatarIcon}
          </div>
          {!isEditingProfile ? (
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{profile.parentNickname}</h2>
              <p className="text-gray-400 flex items-center gap-1 font-black text-[10px] uppercase tracking-wider">
                <Home size={12} /> Unit {profile.roomNumber}
              </p>
            </div>
          ) : (
            <div className="font-black text-gray-800 uppercase tracking-widest text-sm">Update Profile</div>
          )}
        </div>
        {!isEditingProfile && (
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="p-3 bg-pink-50 text-pink-500 rounded-2xl hover:bg-pink-100 transition-colors flex items-center gap-1.5 text-xs font-black uppercase active:scale-95"
          >
            <Edit3 size={16} /> Edit
          </button>
        )}
      </div>

      {isEditingProfile && (
        <section className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 space-y-5 animate-slide-up">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-orange-800 uppercase text-xs tracking-widest">Profile Editor</h3>
            <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 bg-white p-1.5 rounded-full shadow-sm"><X size={18} /></button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-orange-600 block mb-2 font-black uppercase tracking-widest">Icon (Optional)</label>
              <div className="flex gap-2 overflow-x-auto pb-4 pt-2 -mx-2 px-2 snap-x scrollbar-thin scrollbar-thumb-orange-200">
                {AVATAR_ICONS.PARENTS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setEditAvatar(icon)}
                    className={`shrink-0 w-12 h-12 text-2xl rounded-xl flex items-center justify-center border-2 transition-all snap-center ${
                      editAvatar === icon ? 'border-pink-400 bg-white scale-110 shadow-sm' : 'border-orange-100 bg-orange-50/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] text-orange-600 block mb-1 font-black uppercase tracking-widest">Nickname</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={e => setEditNickname(e.target.value)}
                  className="w-full p-3 rounded-2xl border-none outline-none bg-white text-sm font-bold shadow-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-orange-600 block mb-1 font-black uppercase tracking-widest">Room Number</label>
                <div className="flex gap-2">
                  <select 
                    value={editBlock}
                    onChange={(e) => setEditBlock(e.target.value as any)}
                    className="p-3 rounded-2xl border-none outline-none bg-white text-sm font-black shadow-sm"
                  >
                    <option value="3A">3A</option>
                    <option value="3B">3B</option>
                  </select>
                  <input
                    type="text"
                    value={editUnitPath}
                    onChange={e => setEditUnitPath(e.target.value)}
                    placeholder="e.g. 10-01"
                    className="flex-grow p-3 rounded-2xl border-none outline-none bg-white text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] text-orange-600 block font-black uppercase tracking-widest">Children ({editChildren.length})</label>
                <button 
                  onClick={handleAddChild}
                  className="text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-1 uppercase bg-pink-400 text-white shadow-md active:scale-95 transition-transform"
                >
                  <PlusCircle size={14} /> Add
                </button>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200">
                {editChildren.map(child => (
                  <div key={child.id} className="p-4 bg-white rounded-3xl border border-orange-100 relative shadow-sm space-y-3">
                    <button onClick={() => removeEditChild(child.id)} className="absolute top-2 right-2 text-red-300 hover:text-red-500"><X size={18}/></button>
                    
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Child Icon</label>
                      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 -mx-2 px-2 snap-x scrollbar-thin scrollbar-thumb-pink-100">
                        {AVATAR_ICONS.CHILDREN.map(icon => (
                          <button
                            key={icon}
                            onClick={() => updateEditChild(child.id, { avatarIcon: icon })}
                            className={`shrink-0 w-10 h-10 text-xl rounded-xl flex items-center justify-center border-2 transition-all snap-center ${
                              child.avatarIcon === icon ? 'border-pink-400 bg-pink-50 scale-110 shadow-sm' : 'border-gray-50'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" value={child.nickname} 
                        onChange={e => updateEditChild(child.id, { nickname: e.target.value })} 
                        placeholder="Nickname"
                        className="flex-1 p-2 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none"
                      />
                      <input 
                        type="text" value={child.age} 
                        onChange={e => updateEditChild(child.id, { age: e.target.value })} 
                        placeholder="Age"
                        className="w-16 p-2 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase">Gender</label>
                      <div className="flex gap-2">
                        {(['boy', 'girl', 'other'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => updateEditChild(child.id, { gender: g })}
                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border-2 transition-all ${
                              child.gender === g
                                ? g === 'boy' ? 'bg-blue-50 border-blue-200 text-blue-500 shadow-sm' : 
                                  g === 'girl' ? 'bg-pink-50 border-pink-200 text-pink-500 shadow-sm' : 
                                  'bg-gray-100 border-gray-300 text-gray-700 shadow-sm'
                                : 'bg-white border-gray-50 text-gray-300'
                            }`}
                          >
                            {g === 'boy' ? 'Boy' : g === 'girl' ? 'Girl' : 'Other'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={!isFormValid}
              className={`w-full py-5 rounded-3xl font-black shadow-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest active:scale-95 ${isFormValid ? 'bg-pink-400 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'}`}
            >
              <Save size={20} /> Update Profile
            </button>
          </div>
        </section>
      )}

      {!isEditingProfile && (
        <section className="animate-fade-in">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Baby className="text-pink-400" /> Registered Kids
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {profile.children.map(child => (
              <div key={child.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2 transition-transform active:scale-95">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border-2 ${
                    child.gender === 'boy' ? 'bg-blue-50 border-blue-100' : 
                    child.gender === 'girl' ? 'bg-pink-50 border-pink-100' : 
                    'bg-gray-50 border-gray-100'
                  }`}>
                    {child.avatarIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-gray-700 truncate text-sm tracking-tight">{child.nickname}</div>
                    <div className="text-[9px] text-gray-400 uppercase font-black">{child.age}</div>
                  </div>
                </div>
                <div className={`text-[8px] font-black uppercase tracking-widest text-center py-1 rounded-full ${
                  child.gender === 'boy' ? 'text-blue-500 bg-blue-50/50' : 
                  child.gender === 'girl' ? 'text-pink-500 bg-pink-50/50' : 
                  'text-gray-500 bg-gray-50/50'
                }`}>
                  {child.gender}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
          <Calendar className="text-pink-400" /> My Activity History
        </h3>
        <div className="space-y-4">
          {myActivities.length > 0 ? (
            myActivities.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wider">
                      <span>{LOCATION_METADATA[a.location].icon}</span>
                      <span>{LOCATION_METADATA[a.location].label}</span>
                    </div>
                    <div className="font-black text-gray-800 text-sm">
                      {format(parseISO(a.startTime), 'MMM d')} | {format(parseISO(a.startTime), 'HH:mm')} - {format(parseISO(a.endTime), 'HH:mm')}
                    </div>
                    <div className="text-[11px] text-pink-500 font-black uppercase mt-1 tracking-tight">
                      {a.childNicknames.join(' • ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(a)} className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-pink-50 hover:text-pink-400 transition-colors"><Edit3 size={18} /></button>
                    <button onClick={() => onDelete(a.id)} className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-[32px] text-gray-300 border-2 border-dashed border-gray-100 text-xs font-black uppercase tracking-widest">
              No Registered Activities
            </div>
          )}
        </div>
      </section>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-4 text-red-400 font-black uppercase text-xs tracking-widest bg-red-50/50 rounded-3xl border border-red-50 active:scale-95 transition-transform"
      >
        <LogOut size={18} /> Sign Out (Reset Data)
      </button>
    </div>
  );
};
