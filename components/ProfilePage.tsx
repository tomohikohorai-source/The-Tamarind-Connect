
import React, { useState } from 'react';
import { UserProfile, Activity, Child } from '../types';
import { AVATAR_ICONS, LOCATION_METADATA } from '../constants';
import { Home, Baby, LogOut, Calendar, Edit3, Trash2, Save, X, PlusCircle, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { db, doc, setDoc } from '../firebase';

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
  const [editChildren, setEditChildren] = useState<Child[]>(profile.children);

  const myActivities = activities
    .filter(a => a.userId === profile.uid)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  const handleSaveProfile = async () => {
    if (!editNickname.trim() || editChildren.length === 0 || editChildren.some(c => !c.nickname.trim())) {
      alert("Please fill in all required fields.");
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      parentNickname: editNickname,
      avatarIcon: editAvatar,
      children: editChildren
    };

    try {
      await setDoc(doc(db, "users", profile.uid), updatedProfile);
      onUpdateProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (e: any) {
      alert("Error saving profile: " + e.message);
    }
  };

  const addChild = () => {
    if (editChildren.length >= 10) return;
    setEditChildren([...editChildren, {
      id: crypto.randomUUID(),
      nickname: '',
      age: '',
      gender: 'boy',
      intro: '',
      avatarIcon: AVATAR_ICONS.CHILDREN[0]
    }]);
  };

  const removeChild = (id: string) => {
    if (editChildren.length <= 1) {
      alert("You must have at least one child registered.");
      return;
    }
    setEditChildren(editChildren.filter(c => c.id !== id));
  };

  const updateChild = (id: string, updates: Partial<Child>) => {
    setEditChildren(editChildren.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div className="p-6 pb-32 space-y-8 animate-fade-in overflow-y-auto max-h-screen hide-scrollbar">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-4xl border-2 border-pink-100 shadow-sm shrink-0">
            {profile.avatarIcon}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter truncate">
              {profile.parentNickname}
            </h2>
            <p className="text-gray-400 flex items-center gap-1 font-black text-[10px] uppercase tracking-wider">
              <Home size={12} className="text-pink-300" /> Unit {profile.roomNumber}
            </p>
          </div>
        </div>
        {!isEditingProfile && (
          <button 
            onClick={() => {
              setEditNickname(profile.parentNickname);
              setEditAvatar(profile.avatarIcon);
              setEditChildren([...profile.children]);
              setIsEditingProfile(true);
            }} 
            className="p-3 bg-pink-50 text-pink-500 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 border border-pink-100 shadow-sm"
          >
            <Edit3 size={18} />
          </button>
        )}
      </div>

      {/* Edit Profile Section (Modal-like Inline) */}
      {isEditingProfile && (
        <section className="bg-orange-50/50 p-6 rounded-[40px] border-2 border-orange-100 space-y-6 animate-slide-up">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-orange-600 uppercase text-[10px] tracking-widest flex items-center gap-2">
              <User size={14}/> Edit My Profile
            </h3>
            <button onClick={() => setIsEditingProfile(false)} className="bg-white p-2 rounded-xl text-gray-400">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Parent Avatar & Name */}
            <div className="space-y-4 bg-white p-5 rounded-3xl shadow-sm border border-orange-50">
               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Parent Identity</label>
               <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {AVATAR_ICONS.PARENTS.map(icon => (
                    <button 
                      key={icon} 
                      onClick={() => setEditAvatar(icon)}
                      className={`shrink-0 w-12 h-12 text-2xl rounded-xl flex items-center justify-center border-2 transition-all ${editAvatar === icon ? 'border-orange-400 bg-orange-50 scale-105' : 'border-gray-50'}`}
                    >
                      {icon}
                    </button>
                  ))}
               </div>
               <input 
                 type="text" 
                 value={editNickname} 
                 onChange={e => setEditNickname(e.target.value)} 
                 placeholder="Parent Nickname"
                 className="w-full p-4 rounded-2xl bg-gray-50 border-none font-bold text-sm outline-none focus:ring-2 ring-orange-200" 
               />
            </div>

            {/* Children Management */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">My Children</label>
                <button 
                  onClick={addChild}
                  className="text-[9px] font-black text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-widest"
                >
                  <PlusCircle size={12} /> Add
                </button>
              </div>
              
              <div className="space-y-3">
                {editChildren.map((child) => (
                  <div key={child.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 relative space-y-3">
                    <button 
                      onClick={() => removeChild(child.id)} 
                      className="absolute top-3 right-3 text-red-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                      {AVATAR_ICONS.CHILDREN.map(icon => (
                        <button 
                          key={icon} 
                          onClick={() => updateChild(child.id, { avatarIcon: icon })}
                          className={`shrink-0 w-10 h-10 text-xl rounded-xl border-2 transition-all ${child.avatarIcon === icon ? 'border-orange-400 bg-orange-50' : 'border-gray-50'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={child.nickname} 
                        onChange={e => updateChild(child.id, { nickname: e.target.value })} 
                        placeholder="Name"
                        className="flex-grow p-3 rounded-xl bg-gray-50 border-none text-xs font-bold outline-none" 
                      />
                      <input 
                        type="text" 
                        value={child.age} 
                        onChange={e => updateChild(child.id, { age: e.target.value })} 
                        placeholder="Age"
                        className="w-16 p-3 rounded-xl bg-gray-50 border-none text-xs font-bold outline-none" 
                      />
                    </div>

                    <div className="flex gap-2">
                      {[
                        { id: 'boy', label: 'Boy', color: 'blue' },
                        { id: 'girl', label: 'Girl', color: 'pink' },
                        { id: 'other', label: 'Other', color: 'purple' }
                      ].map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => updateChild(child.id, { gender: g.id as any })}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                            child.gender === g.id 
                              ? `bg-${g.color}-50 border-${g.color}-400 text-${g.color}-500` 
                              : 'bg-white border-gray-50 text-gray-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSaveProfile} 
              className="w-full py-4 rounded-2xl font-black bg-orange-400 text-white shadow-xl shadow-orange-100 uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Save size={18} /> Update Profile
            </button>
          </div>
        </section>
      )}

      {/* Activity History Section */}
      <section className="space-y-4">
        <h3 className="font-black text-gray-800 mb-2 flex items-center gap-2 uppercase text-[10px] tracking-widest">
          <Calendar className="text-pink-400" size={14}/> My Activity History
        </h3>
        <div className="space-y-4">
          {myActivities.length > 0 ? (
            myActivities.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex justify-between items-center group transition-all hover:border-pink-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${LOCATION_METADATA[a.location].bgColor} flex items-center justify-center text-2xl`}>
                    {LOCATION_METADATA[a.location].icon}
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      {LOCATION_METADATA[a.location].label}
                    </div>
                    <div className="font-black text-gray-800 text-sm">
                      {format(parseISO(a.startTime), 'MMM d')} | {format(parseISO(a.startTime), 'HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(a)} 
                    className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-pink-50 hover:text-pink-400 transition-all active:scale-90"
                  >
                    <Edit3 size={16}/>
                  </button>
                  <button 
                    onClick={() => onDelete(a.id)} 
                    className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 transition-all active:scale-90"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white border-2 border-dashed border-gray-100 rounded-[40px] text-gray-300 text-[10px] font-black uppercase tracking-widest">
              No History Yet
            </div>
          )}
        </div>
      </section>

      {/* Logout Button */}
      <button 
        onClick={onLogout} 
        className="w-full flex items-center justify-center gap-2 py-5 text-red-400 font-black uppercase text-[10px] tracking-widest bg-red-50/50 rounded-3xl border-2 border-red-50 hover:bg-red-50 transition-colors"
      >
        <LogOut size={16}/> Logout Account
      </button>
    </div>
  );
};
