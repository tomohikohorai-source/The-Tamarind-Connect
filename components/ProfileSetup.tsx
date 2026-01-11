
import React, { useState } from 'react';
import { UserProfile, Child } from '../types';
import { AVATAR_ICONS } from '../constants';
import { Trash2, PlusCircle, User, Baby } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export const ProfileSetup: React.FC<Props> = ({ onComplete }) => {
  const [parentNickname, setParentNickname] = useState('');
  const [parentAvatar, setParentAvatar] = useState(AVATAR_ICONS.PARENTS[0]);
  const [block, setBlock] = useState<'3A' | '3B'>('3A');
  const [unitPath, setUnitPath] = useState('');
  const [children, setChildren] = useState<Child[]>([]);

  const addChild = () => {
    if (children.length >= 10) return;
    const newChild: Child = {
      id: crypto.randomUUID(),
      nickname: '',
      age: '',
      gender: 'boy',
      intro: '',
      avatarIcon: AVATAR_ICONS.CHILDREN[0]
    };
    setChildren([...children, newChild]);
  };

  const updateChild = (id: string, updates: Partial<Child>) => {
    setChildren(children.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeChild = (id: string) => {
    setChildren(children.filter(c => c.id !== id));
  };

  const roomNumber = `${block}-${unitPath}`;
  // Relaxed validation: non-empty and reasonably sized
  const isUnitValid = unitPath.trim().length > 0 && unitPath.length < 15;
  const isFormValid = parentNickname.trim().length > 0 && isUnitValid && children.length > 0 && children.every(c => c.nickname.trim().length > 0 && c.age.trim().length > 0);

  const handleSubmit = () => {
    if (isFormValid) {
      onComplete({ parentNickname, roomNumber, children, avatarIcon: parentAvatar });
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-black text-pink-500 mb-2 text-center uppercase tracking-wider">The Tamarind Connect</h2>
        <h3 className="text-lg font-bold text-gray-600 mb-6 text-center">Create Profile</h3>
        
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
            <h3 className="font-bold text-orange-800 mb-4 text-sm uppercase tracking-wide">Parent Info</h3>
            
            <div className="mb-6">
              <label className="text-[11px] text-gray-400 block mb-2 font-bold uppercase">Select Icon (Swipe to scroll)</label>
              <div className="flex gap-3 overflow-x-auto pb-4 pt-2 -mx-2 px-2 snap-x scrollbar-thin scrollbar-thumb-pink-200">
                {AVATAR_ICONS.PARENTS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setParentAvatar(icon)}
                    className={`shrink-0 w-14 h-14 text-3xl rounded-2xl flex items-center justify-center border-2 transition-all snap-center ${
                      parentAvatar === icon ? 'border-pink-400 bg-pink-50 scale-105 shadow-md' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-orange-600 block mb-1 font-bold uppercase">Parent Nickname</label>
                <input
                  type="text"
                  value={parentNickname}
                  onChange={e => setParentNickname(e.target.value)}
                  placeholder="e.g. Hana's Mom"
                  className="w-full p-3 rounded-2xl border-2 border-orange-50 outline-none focus:border-pink-300 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="text-[11px] text-orange-600 block mb-1 font-bold uppercase">Room Number</label>
                <div className="flex gap-2">
                  <select 
                    value={block}
                    onChange={(e) => setBlock(e.target.value as any)}
                    className="p-3 rounded-2xl border-2 border-orange-50 outline-none focus:border-pink-300 bg-gray-50/50 font-bold"
                  >
                    <option value="3A">3A</option>
                    <option value="3B">3B</option>
                  </select>
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={unitPath}
                      onChange={e => setUnitPath(e.target.value)}
                      placeholder="e.g. 10-01"
                      className={`w-full p-3 rounded-2xl border-2 outline-none transition-colors bg-gray-50/50 ${isUnitValid || !unitPath ? 'border-orange-50 focus:border-pink-300' : 'border-red-300 bg-red-50'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm uppercase">Children ({children.length})</h3>
              <button
                onClick={addChild}
                className="flex items-center gap-1 text-xs px-4 py-2 rounded-full font-bold shadow-sm bg-pink-100 text-pink-600 active:scale-95 transition-transform"
              >
                <PlusCircle size={14} /> ADD CHILD
              </button>
            </div>

            {children.map((child) => (
              <div key={child.id} className="p-4 border-2 border-pink-100 rounded-3xl relative bg-white shadow-sm space-y-4">
                <button
                  onClick={() => removeChild(child.id)}
                  className="absolute -top-2 -right-2 bg-white border border-gray-100 text-red-400 p-1.5 rounded-full shadow-md active:scale-90"
                >
                  <Trash2 size={16} />
                </button>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-2 font-bold uppercase">Child Icon</label>
                  <div className="flex gap-2 overflow-x-auto pb-4 pt-1 -mx-2 px-2 snap-x scrollbar-thin scrollbar-thumb-pink-100">
                    {AVATAR_ICONS.CHILDREN.map(icon => (
                      <button
                        key={icon}
                        onClick={() => updateChild(child.id, { avatarIcon: icon })}
                        className={`shrink-0 w-12 h-12 text-2xl rounded-xl flex items-center justify-center border-2 transition-all snap-center ${
                          child.avatarIcon === icon ? 'border-pink-400 bg-pink-50 scale-105 shadow-md' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-grow">
                      <label className="text-[10px] text-gray-400 block mb-0.5 font-bold uppercase">Nickname</label>
                      <input
                        type="text"
                        value={child.nickname}
                        onChange={e => updateChild(child.id, { nickname: e.target.value })}
                        placeholder="Name"
                        className="w-full p-2 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-bold"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] text-gray-400 block mb-0.5 font-bold uppercase">Age/Grade</label>
                      <input
                        type="text"
                        value={child.age}
                        onChange={e => updateChild(child.id, { age: e.target.value })}
                        placeholder="3yo"
                        className="w-full p-2 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase">Gender</label>
                    <div className="flex gap-2">
                      {(['boy', 'girl', 'other'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateChild(child.id, { gender: g })}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                            child.gender === g
                              ? g === 'boy' ? 'bg-blue-50 border-blue-200 text-blue-500 shadow-sm' : 
                                g === 'girl' ? 'bg-pink-50 border-pink-200 text-pink-500 shadow-sm' : 
                                'bg-gray-50 border-gray-300 text-gray-600 shadow-sm'
                              : 'bg-white border-gray-100 text-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {g === 'boy' ? '👦 Boy' : g === 'girl' ? '👧 Girl' : '✨ Other'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {children.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 bg-gray-50/50 text-sm font-bold">
                Please add at least one child
              </div>
            )}
          </section>

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
             <p className="text-[10px] text-orange-400 font-bold leading-relaxed text-center uppercase tracking-wider">
               Required: Nickname, Unit, and Child info
             </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full py-5 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest ${
              isFormValid ? 'bg-pink-400 text-white shadow-pink-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            Start Connect
          </button>
        </div>
      </div>
    </div>
  );
};
