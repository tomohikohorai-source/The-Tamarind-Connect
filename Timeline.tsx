
import React, { useState } from 'react';
import { UserProfile, Child } from '@/types';
import { Language, translations } from '@/translations';
import { AVATAR_ICONS, AGE_OPTIONS, CONDO_OPTIONS } from '@/constants';
import { auth, db, doc, setDoc, handleFirestoreError, OperationType } from '@/firebase';
import { store } from '@/services/store';
import { Trash2, PlusCircle } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
  language?: Language;
}

export const ProfileSetup: React.FC<Props> = ({ onComplete, language = 'en' }) => {
  const t = translations[language];
  const [parentNickname, setParentNickname] = useState('');
  const [parentAvatar, setParentAvatar] = useState(AVATAR_ICONS.PARENTS[0]);
  const [selectedCondoId, setSelectedCondoId] = useState<string>('');
  const [otherCondoName, setOtherCondoName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);

  // Add child helper function
  const addChild = () => {
    setChildren([...children, {
      id: crypto.randomUUID(),
      nickname: '',
      age: '3',
      gender: 'boy',
      intro: '',
      avatarIcon: AVATAR_ICONS.CHILDREN[0]
    }]);
  };

  // Children is now optional: length > 0 check removed
  const isFormValid = parentNickname.trim().length > 0 && selectedCondoId !== '' && 
                    (selectedCondoId !== 'Other-Penang' || otherCondoName.trim().length > 0) &&
                    children.every(c => c.nickname.trim().length > 0);

  const handleSubmit = async () => {
    if (isFormValid && auth.currentUser) {
      const profile: UserProfile = {
        uid: auth.currentUser.uid,
        customUserId: auth.currentUser.displayName || 'unknown_user',
        parentNickname,
        roomNumber: '', // Block removed
        condoCode: store.getPasscode() || '',
        children,
        avatarIcon: parentAvatar,
        totalLoginDays: 1,
        lastLoginDate: new Date().toISOString(),
        condoId: selectedCondoId,
        customCondoName: selectedCondoId === 'Other-Penang' ? otherCondoName : '',
        // Fix: Added missing properties showPastSales and showBuying to satisfy PrivacySettings interface
        privacySettings: {
          showChildren: true,
          showListings: true,
          showPastSales: true,
          showBuying: true
        }
      };
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), profile);
        onComplete(profile);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 pb-24 animate-fade-in">
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-black text-pink-500 mb-2 text-center tracking-tighter uppercase">{t.profileSetup}</h2>
        <p className="text-gray-400 text-[10px] text-center mb-8 uppercase font-bold tracking-widest">{t.connectNeighbors}</p>
        
        <div className="space-y-6">
          <p className="text-[9px] text-gray-400 font-bold text-center italic mb-2">{t.translationNotice}</p>
          <section className="bg-white p-6 rounded-[32px] shadow-sm border border-pink-50">
            <h3 className="font-black text-pink-400 mb-4 text-[10px] uppercase tracking-widest">{t.residentInfo}</h3>
            <div className="mb-6 overflow-x-auto pb-4 pt-2 -mx-2 px-2 flex gap-3 snap-x hide-scrollbar">
              {AVATAR_ICONS.PARENTS.map(icon => (
                <button key={icon} onClick={() => setParentAvatar(icon)} className={`shrink-0 w-14 h-14 text-3xl rounded-2xl flex items-center justify-center border-2 transition-all ${parentAvatar === icon ? 'border-pink-400 bg-pink-50 scale-105' : 'border-gray-100'}`}>{icon}</button>
              ))}
            </div>
            <div className="space-y-4">
              <input type="text" value={parentNickname} onChange={e => setParentNickname(e.target.value)} placeholder={t.parentNickname} className="w-full p-3.5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm" />
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.condominium}</label>
                <div className="relative">
                  <select 
                    value={selectedCondoId} 
                    onChange={e => setSelectedCondoId(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none"
                  >
                    <option value="" disabled>{t.selectCondo}</option>
                    {CONDO_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
                {selectedCondoId === 'Other-Penang' && (
                  <div className="animate-fade-in mt-2">
                    <input 
                      type="text" 
                      value={otherCondoName} 
                      onChange={e => setOtherCondoName(e.target.value)} 
                      placeholder="Enter your condominium name" 
                      className="w-full p-3.5 rounded-2xl bg-gray-50 border-2 border-pink-100 outline-none font-bold text-sm" 
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest">{t.childrenOptional}</h3>
              <button onClick={addChild} className="text-[10px] px-4 py-2 rounded-full font-black bg-pink-100 text-pink-600 uppercase tracking-widest"><PlusCircle size={14} className="inline mr-1"/> {t.add}</button>
            </div>
            {children.map((child) => (
              <div key={child.id} className="p-5 bg-white border-2 border-pink-50 rounded-[32px] relative space-y-4 shadow-sm">
                <button onClick={() => setChildren(children.filter(c => c.id !== child.id))} className="absolute top-3 right-3 text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
                
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {AVATAR_ICONS.CHILDREN.map(icon => (
                    <button key={icon} onClick={() => setChildren(children.map(c => c.id === child.id ? {...c, avatarIcon: icon} : c))} className={`shrink-0 w-10 h-10 text-xl rounded-xl border-2 transition-all ${child.avatarIcon === icon ? 'border-pink-400 bg-pink-50' : 'border-gray-50'}`}>{icon}</button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input type="text" value={child.nickname} onChange={e => setChildren(children.map(c => c.id === child.id ? {...c, nickname: e.target.value} : c))} placeholder={t.name} className="flex-grow p-3 rounded-xl bg-gray-50 text-xs font-bold outline-none" />
                  <div className="relative">
                    <select 
                      value={child.age} 
                      onChange={e => setChildren(children.map(c => c.id === child.id ? {...c, age: e.target.value} : c))}
                      className="w-20 p-3 rounded-xl bg-gray-50 text-xs font-bold outline-none appearance-none"
                    >
                      {AGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-2 top-3 text-[8px] font-black text-gray-300 pointer-events-none">{t.yrs}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[
                    { id: 'boy', label: t.boy, color: 'blue' },
                    { id: 'girl', label: t.girl, color: 'pink' },
                    { id: 'other', label: t.other, color: 'purple' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setChildren(children.map(c => c.id === child.id ? {...c, gender: g.id as any} : c))}
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
          </section>

          <button onClick={handleSubmit} disabled={!isFormValid} className={`w-full py-5 rounded-3xl font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs ${isFormValid ? 'bg-pink-400 text-white shadow-pink-200' : 'bg-gray-200 text-gray-400'}`}>{t.completeSetup}</button>
        </div>
      </div>
    </div>
  );
};
