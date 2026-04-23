import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { UserProfile, Child, MarketItem, Skill, WantedItem, PrivacySettings } from '../types';
import { AVATAR_ICONS, GENRE_ICONS, AGE_OPTIONS, SKILL_ICONS, CONDO_OPTIONS, getCondoName } from '../constants';
import { Edit3, Trash2, X, User, ShoppingBag, PackageCheck, Plus, ShoppingCart, Eye, EyeOff, Settings, ShieldAlert, ChevronLeft, ChevronRight, PlusCircle, CheckCircle, Bell, MessageSquare, AlertCircle, Ban, Send, ChevronDown, ChevronUp, Trash, Clock, Edit2, ShoppingBasket, BookOpen, Star, MessageCircle, AlertTriangle, Heart, Lock, Mail, Languages, Building2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { db, doc, setDoc, updateDoc } from '../firebase';
import { Language, translations } from '../translations';
import { translateText } from '../services/geminiService';

interface Props {
  profile: UserProfile; 
  currentUser: UserProfile; 
  marketItems: MarketItem[];
  skills: Skill[];
  wantedItems: WantedItem[];
  onLogout: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onEditMarket: (item: MarketItem) => void;
  onDeleteMarket: (id: string) => void;
  onMarketStatusChange: (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => void;
  onAddMarket: () => void;
  onAddSkill: () => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onAddMarketComment: (itemId: string, text: string) => void;
  onGoToTransaction: (itemId: string) => void;
  onGoToSkill: (skillId: string) => void;
  onGoToWanted: (wantedId: string) => void;
  onClose?: () => void; 
  acknowledgedMarketMap?: Record<string, string>;
  acknowledgedSkillMap?: Record<string, string>;
  acknowledgedWantedMap?: Record<string, string>;
  language: Language;
  tabResetToggle?: boolean;
  isAdminMode?: boolean;
  onToggleAdminMode?: (val: boolean) => void;
}

const CollapsibleHeader = memo(({ title, icon, count, isOpen, onToggle, hasBadge, badgeLabel }: { title: string, icon: React.ReactNode, count: number, isOpen: boolean, onToggle: () => void, hasBadge?: boolean, badgeLabel?: string }) => (
  <button onClick={onToggle} className="flex items-center justify-between w-full py-4 px-3 group transition-all text-left">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl transition-colors ${isOpen ? 'bg-pink-100 text-pink-500' : 'bg-gray-50 text-gray-400 group-hover:text-pink-400'} relative`}>
        {icon}
        {hasBadge && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>}
      </div>
      <div className="flex flex-col items-start">
        <h3 className="font-black text-gray-800 uppercase text-[11px] tracking-widest">{title} {count > 0 && <span className="text-pink-400 ml-1.5 opacity-60">({count})</span>}</h3>
        {hasBadge && badgeLabel && <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter mt-0.5 animate-pulse flex items-center gap-1"><AlertTriangle size={8}/> {badgeLabel}</span>}
      </div>
    </div>
    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
      <ChevronDown size={18} className="text-gray-300" />
    </div>
  </button>
));

interface AppNotification {
  id: string;
  type: 'MARKET' | 'SKILL' | 'WANTED';
  itemId: string;
  title: string;
  message: string;
  reason: string;
  isActionRequired: boolean;
  isDismissed: boolean;
  timestamp: string;
}

export const ProfilePage: React.FC<Props> = ({ 
  profile, currentUser, marketItems, skills, wantedItems, onLogout, onUpdateProfile, 
  onEditMarket, onDeleteMarket, onMarketStatusChange, onAddMarket, onAddSkill, onEditSkill, onDeleteSkill, 
  onAddMarketComment, onGoToTransaction, onGoToSkill, onGoToWanted, onClose,
  acknowledgedMarketMap = {}, acknowledgedSkillMap = {}, acknowledgedWantedMap = {},
  language, tabResetToggle, isAdminMode, onToggleAdminMode
}) => {
  const t = translations[language];
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('play_share_dismissed_notifs') || '[]');
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    activeSales: true,
    pastSales: false,
    buying: true,
    wanted: true,
    skills: true,
    notifications: true,
    likes: true
  });

  const toggleSection = useCallback((key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] })), []);

  const [editNickname, setEditNickname] = useState(profile.parentNickname);
  const [editAvatar, setEditAvatar] = useState(profile.avatarIcon);
  const [editCondoId, setEditCondoId] = useState(profile.condoId || '');
  const [editCustomCondoName, setEditCustomCondoName] = useState(profile.customCondoName || '');
  const [editChildren, setEditChildren] = useState<Child[]>(profile.children);

  const isOwnProfile = profile.uid === currentUser.uid;

  useEffect(() => {
    setIsEditingProfile(false);
    setShowSettings(false);
  }, [tabResetToggle]);

  const privacy = profile.privacySettings || { showChildren: true, showListings: true, showPastSales: true, showBuying: true, showSkills: true, showWanted: true };

  const notifications = useMemo(() => {
    if (!isOwnProfile) return [];
    
    const list: AppNotification[] = [];
    marketItems.forEach(item => {
      const isOwner = item.userId === profile.uid;
      const isBuyer = item.buyerId === profile.uid;
      const hasParticipated = item.comments.some(c => c.userId === profile.uid);
      const lastComment = item.comments.length > 0 ? item.comments[item.comments.length - 1] : null;
      const lastUpdate = item.lastUpdated || 'initial';
      const checkIsDismissed = (id: string) => dismissedNotifIds.includes(id);
      
      const isSold = item.status === 'SOLD';
      const isAcknowledged = acknowledgedMarketMap[item.id] === lastUpdate;
      
      // If item is SOLD and already acknowledged, don't show any notifications for it
      if (isSold && isAcknowledged) return;

      if (isOwner && item.requestStatus === 'PENDING') {
        list.push({ id: `${item.id}-req`, type: 'MARKET', itemId: item.id, title: item.title, message: 'Purchase request received!', reason: t.notifRequestReceived, isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-req`), timestamp: lastUpdate });
      }
      if (isOwner && item.status === 'RESERVED' && item.buyerConfirmedCompletion && !item.sellerConfirmedCompletion) {
        list.push({ id: `${item.id}-conf`, type: 'MARKET', itemId: item.id, title: item.title, message: 'Buyer reported pickup!', reason: t.notifPickupReported, isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-conf`), timestamp: lastUpdate });
      }
      if (isBuyer && item.status === 'RESERVED' && !item.buyerConfirmedCompletion) {
        list.push({ id: `${item.id}-appr`, type: 'MARKET', itemId: item.id, title: item.title, message: 'Purchase request approved!', reason: t.notifRequestApproved, isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-appr`), timestamp: lastUpdate });
      }
      if ((isOwner || isBuyer || hasParticipated) && lastComment && lastComment.userId !== profile.uid) {
        list.push({ id: `${item.id}-cmt`, type: 'MARKET', itemId: item.id, title: item.title, message: lastComment.text, reason: t.notifNewComment, isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-cmt`), timestamp: lastUpdate });
      }
    });

    skills.forEach(skill => {
      const isOwner = skill.userId === profile.uid;
      const hasParticipated = skill.comments.some(c => c.userId === profile.uid);
      const lastComment = skill.comments.length > 0 ? skill.comments[skill.comments.length - 1] : null;
      const lastUpdate = skill.lastUpdated || 'initial';

      const isClosed = skill.status === 'CLOSED';
      const isAcknowledged = acknowledgedSkillMap[skill.id] === lastUpdate;

      if (isClosed && isAcknowledged) return;

      if ((isOwner || hasParticipated) && lastComment && lastComment.userId !== profile.uid) {
        list.push({ id: `${skill.id}-cmt`, type: 'SKILL', itemId: skill.id, title: skill.title, message: lastComment.text, reason: t.notifNewComment, isActionRequired: true, isDismissed: dismissedNotifIds.includes(`${skill.id}-cmt`), timestamp: skill.lastUpdated });
      }
    });

    wantedItems.forEach(wanted => {
      const isOwner = wanted.userId === profile.uid;
      const hasParticipated = wanted.comments.some(c => c.userId === profile.uid);
      const lastComment = wanted.comments.length > 0 ? wanted.comments[wanted.comments.length - 1] : null;
      if ((isOwner || hasParticipated) && lastComment && lastComment.userId !== profile.uid) {
        list.push({ id: `${wanted.id}-cmt`, type: 'WANTED', itemId: wanted.id, title: wanted.title, message: lastComment.text, reason: t.notifDiscussion, isActionRequired: true, isDismissed: dismissedNotifIds.includes(`${wanted.id}-cmt`), timestamp: wanted.lastUpdated });
      }
    });

    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [marketItems, skills, wantedItems, profile.uid, isOwnProfile, dismissedNotifIds]);

  const activeUnreadCount = useMemo(() => notifications.filter(n => !n.isDismissed).length, [notifications]);

  const myActiveSales = useMemo(() => marketItems.filter(i => i.userId === profile.uid && i.status !== 'SOLD'), [marketItems, profile.uid]);
  const myPurchases = useMemo(() => marketItems.filter(i => (i.buyerId === profile.uid || (i.comments.some(c => c.userId === profile.uid) && i.userId !== profile.uid))), [marketItems, profile.uid]);
  const mySkills = useMemo(() => skills.filter(s => (s.userId === profile.uid || s.comments.some(c => c.userId === profile.uid))), [skills, profile.uid]);
  const myWanted = useMemo(() => wantedItems.filter(w => (w.userId === profile.uid || w.comments.some(c => c.userId === profile.uid))), [wantedItems, profile.uid]);
  const myLikes = useMemo(() => {
    const likedMarket = marketItems.filter(i => i.likes?.includes(profile.uid));
    const likedSkills = skills.filter(s => s.likes?.includes(profile.uid));
    const likedWanted = wantedItems.filter(w => w.likes?.includes(profile.uid));
    
    return [
      ...likedMarket.map(i => ({ ...i, itemType: 'MARKET' as const })),
      ...likedSkills.map(s => ({ ...s, itemType: 'SKILL' as const })),
      ...likedWanted.map(w => ({ ...w, itemType: 'WANTED' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [marketItems, skills, wantedItems, profile.uid]);

  const handleNotificationJump = (notif: AppNotification) => {
    if (!notif.isDismissed) {
      const nextDismissed = [...dismissedNotifIds, notif.id];
      setDismissedNotifIds(nextDismissed);
      localStorage.setItem('play_share_dismissed_notifs', JSON.stringify(nextDismissed));
    }
    if (notif.type === 'MARKET') onGoToTransaction(notif.itemId);
    else if (notif.type === 'SKILL') onGoToSkill(notif.itemId);
  };

  const handleSaveProfile = async () => {
    if (!editNickname.trim() || !editCondoId) return;
    if (editCondoId === 'Other-Penang' && !editCustomCondoName.trim()) return;
    
    const updatedProfile: UserProfile = { 
      ...profile, 
      parentNickname: editNickname, 
      avatarIcon: editAvatar, 
      condoId: editCondoId, 
      customCondoName: editCondoId === 'Other-Penang' ? editCustomCondoName : '',
      children: editChildren 
    };
    try {
      await setDoc(doc(db, "users", profile.uid), updatedProfile);
      onUpdateProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (e: any) { alert("Error: " + e.message); }
  };

  const togglePrivacy = async (key: keyof PrivacySettings) => {
    const nextPrivacy = { ...privacy, [key]: !privacy[key] };
    const updatedProfile = { ...profile, privacySettings: nextPrivacy };
    try {
      await updateDoc(doc(db, "users", profile.uid), { privacySettings: nextPrivacy });
      onUpdateProfile(updatedProfile);
    } catch (e: any) { alert("Update failed: " + e.message); }
  };

  const addChild = () => {
    setEditChildren([...editChildren, {
      id: crypto.randomUUID(),
      nickname: '',
      age: '3',
      gender: 'boy',
      intro: '',
      avatarIcon: AVATAR_ICONS.CHILDREN[0]
    }]);
  };

  return (
    <div className={`p-6 pb-32 space-y-8 animate-fade-in overflow-y-auto max-h-screen hide-scrollbar bg-[#fdfbf7] ${onClose ? 'fixed inset-0 z-[100]' : ''}`}>
      {onClose && (
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-widest bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm mb-6 active:scale-95 transition-all">
          <ChevronLeft size={16} /> {t.back}
        </button>
      )}

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-5xl border-2 border-pink-100 shadow-lg shrink-0">{profile.avatarIcon}</div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter truncate leading-none mb-2">{profile.parentNickname}</h2>
            <div className="flex items-center gap-1.5 text-gray-400">
              <MapPin size={12} className="shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest truncate">
                {getCondoName(profile.condoId, profile.customCondoName)}
              </span>
            </div>
          </div>
        </div>
        {isOwnProfile && (
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className={`p-4 rounded-2xl border transition-all bg-white text-gray-400 border-gray-100 shadow-sm active:scale-95`}><Settings size={20} /></button>
            <button onClick={() => setIsEditingProfile(true)} className="p-4 bg-pink-50 text-pink-500 rounded-2xl border border-pink-100 shadow-sm active:scale-95 transition-all"><Edit3 size={20} /></button>
          </div>
        )}
      </div>

      {currentUser.customUserId === 'testtest' && (
        <div className="bg-white p-6 rounded-[32px] border-2 border-pink-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-pink-500" />
            <div>
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t.adminMode}</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{t.adminModeDesc}</p>
            </div>
          </div>
          <button 
            onClick={() => onToggleAdminMode?.(!isAdminMode)} 
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${isAdminMode ? 'bg-pink-50 border-2 border-pink-200' : 'bg-gray-50 border-2 border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <div className={isAdminMode ? 'text-pink-500' : 'text-gray-400'}>
                {isAdminMode ? <Eye size={18}/> : <EyeOff size={18}/>}
              </div>
              <span className={`text-[12px] font-black uppercase tracking-tight ${isAdminMode ? 'text-pink-600' : 'text-gray-500'}`}>
                {isAdminMode ? 'TEST DATA (1111)' : 'PRODUCTION DATA'}
              </span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all relative ${isAdminMode ? 'bg-pink-400' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAdminMode ? 'right-1' : 'left-1'}`} />
            </div>
          </button>
        </div>
      )}

      {isOwnProfile && showSettings && (
        <div className="fixed inset-0 z-[600] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-[40px] p-8 shadow-2xl relative animate-slide-up space-y-6 overflow-y-auto max-h-[90vh] hide-scrollbar pb-32">
            <div className="flex justify-between items-center mb-2 sticky top-0 bg-white py-2 z-10">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{t.settings}</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400"><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-1">{t.privacy}</h3>
              <div className="space-y-2">
                {[
                  { key: 'showChildren', label: t.players, icon: <User size={16}/> },
                  { key: 'showListings', label: t.all, icon: <ShoppingBag size={16}/> },
                  { key: 'showWanted', label: t.wishlist, icon: <Heart size={16}/> },
                  { key: 'showSkills', label: t.skills, icon: <BookOpen size={16}/> }
                ].map(opt => (
                  <button key={opt.key} onClick={() => togglePrivacy(opt.key as any)} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">{opt.icon}</div>
                      <span className="text-[12px] font-bold text-gray-700">{opt.label}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-all relative ${privacy[opt.key as keyof PrivacySettings] ? 'bg-pink-400' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privacy[opt.key as keyof PrivacySettings] ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest">{t.confirm}</button>
          </div>
        </div>
      )}

      {isEditingProfile && (
        <div className="fixed inset-0 z-[600] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditingProfile(false)} />
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-[40px] p-8 shadow-2xl relative animate-slide-up space-y-6 overflow-y-auto max-h-[90vh] hide-scrollbar pb-32">
             <div className="flex justify-between items-center mb-2 sticky top-0 bg-white py-4 z-10">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{t.edit}</h2>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 text-gray-400"><X size={24}/></button>
            </div>
            
            <div className="space-y-6">
               <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.nickname}</label>
                <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl mt-1 font-bold outline-none border-2 border-transparent focus:border-pink-100" />
               </div>

                <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.condominium}</label>
                <div className="relative mt-1">
                  <select 
                    value={editCondoId} 
                    onChange={e => setEditCondoId(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none appearance-none border-2 border-transparent focus:border-pink-100"
                  >
                    <option value="" disabled>{t.selectCondo}</option>
                    {CONDO_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
                {editCondoId === 'Other-Penang' && (
                  <div className="mt-2 animate-fade-in">
                    <input 
                      type="text" 
                      value={editCustomCondoName} 
                      onChange={e => setEditCustomCondoName(e.target.value)} 
                      placeholder="Enter your condominium name" 
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-pink-100" 
                    />
                  </div>
                )}
               </div>
               
               <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.avatar}</label>
                <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
                  {AVATAR_ICONS.PARENTS.map(ico => (
                    <button key={ico} onClick={() => setEditAvatar(ico)} className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${editAvatar === ico ? 'border-pink-400 bg-pink-50' : 'border-gray-100'}`}>{ico}</button>
                  ))}
                </div>
               </div>

               <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-800 text-[10px] uppercase tracking-widest">{t.players}</h3>
                  <button onClick={addChild} className="text-[10px] px-4 py-2 rounded-full font-black bg-pink-100 text-pink-600 uppercase tracking-widest flex items-center gap-1"><PlusCircle size={14}/> {t.add}</button>
                </div>
                {editChildren.map((child, index) => (
                  <div key={child.id} className="p-4 bg-gray-50 border border-gray-100 rounded-[28px] relative space-y-4">
                    <button onClick={() => setEditChildren(editChildren.filter(c => c.id !== child.id))} className="absolute top-2 right-2 p-2 text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      {AVATAR_ICONS.CHILDREN.map(icon => (
                        <button key={icon} onClick={() => setEditChildren(editChildren.map(c => c.id === child.id ? {...c, avatarIcon: icon} : c))} className={`shrink-0 w-9 h-9 text-lg rounded-xl border-2 transition-all ${child.avatarIcon === icon ? 'border-pink-400 bg-pink-50' : 'border-white bg-white shadow-sm'}`}>{icon}</button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input type="text" value={child.nickname} onChange={e => setEditChildren(editChildren.map(c => c.id === child.id ? {...c, nickname: e.target.value} : c))} placeholder="..." className="flex-grow p-3 rounded-xl bg-white border border-gray-100 text-xs font-bold outline-none" />
                      <div className="relative">
                        <select 
                          value={child.age} 
                          onChange={e => setEditChildren(editChildren.map(c => c.id === child.id ? {...c, age: e.target.value} : c))}
                          className="w-20 p-3 rounded-xl bg-white border border-gray-100 text-xs font-bold outline-none appearance-none pr-6"
                        >
                          {AGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <div className="absolute right-2 top-3 text-[8px] font-black text-gray-300 pointer-events-none">{t.yrs}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {['boy', 'girl', 'other'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setEditChildren(editChildren.map(c => c.id === child.id ? {...c, gender: g as any} : c))}
                          className={`flex-1 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all ${
                            child.gender === g 
                              ? 'bg-pink-400 border-pink-400 text-white' 
                              : 'bg-white border-white text-gray-400 shadow-sm'
                          }`}
                        >
                          {t[g as keyof typeof t] || g}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
               </div>
            </div>

            <div className="flex gap-3 pt-6 pb-32">
              <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[11px]">{t.back}</button>
              <button onClick={handleSaveProfile} className="flex-1 py-4 bg-pink-400 text-white rounded-2xl font-black uppercase text-[11px] shadow-lg">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {(isOwnProfile || privacy.showChildren) && profile.children.length > 0 && (
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="bg-pink-100 text-pink-500 p-2 rounded-xl"><User size={16} /></div>
            <h3 className="font-black text-gray-800 uppercase text-[11px] tracking-widest">{t.players}</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {profile.children.map(child => (
              <div key={child.id} className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{child.avatarIcon}</div>
                <div>
                  <div className="text-[11px] font-black text-gray-800 uppercase">{child.nickname}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase">{child.age} {t.yrs} • {t[child.gender as keyof typeof t] || child.gender}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOwnProfile && notifications.length > 0 && (
        <div className="bg-white rounded-[32px] border border-pink-100 overflow-hidden shadow-sm">
          <CollapsibleHeader title={t.chat} icon={<Bell size={18}/>} count={activeUnreadCount} isOpen={openSections.notifications} onToggle={() => toggleSection('notifications')} hasBadge={notifications.some(n => !n.isDismissed && n.isActionRequired)} badgeLabel={t.urgent} />
          {openSections.notifications && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
               {(showAllNotifications ? notifications : notifications.slice(0, 5)).map(n => (
                 <button key={n.id} onClick={() => handleNotificationJump(n)} className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] flex gap-4 items-start ${n.isDismissed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-pink-100 shadow-sm'}`}>
                   <div className={`p-2 rounded-xl shrink-0 ${n.isDismissed ? 'bg-gray-200 text-gray-400' : 'bg-pink-100 text-pink-500'}`}>
                     {n.type === 'MARKET' ? <ShoppingBag size={16}/> : n.type === 'SKILL' ? <BookOpen size={16}/> : <Heart size={16}/>}
                   </div>
                   <div className="min-w-0 flex-grow">
                     <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${n.isDismissed ? 'bg-gray-200 text-gray-500' : 'bg-pink-500 text-white'}`}>
                         {n.reason}
                       </span>
                       <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">
                         {n.type}
                       </span>
                     </div>
                     <h4 className="text-[11px] font-black uppercase truncate text-gray-800">{n.title}</h4>
                     <p className="text-[10px] leading-relaxed font-bold text-gray-500 line-clamp-1">{n.message}</p>
                   </div>
                 </button>
               ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {(isOwnProfile || privacy.showListings) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title={t.sell} icon={<ShoppingBag size={18}/>} count={myActiveSales.length} isOpen={openSections.activeSales} onToggle={() => toggleSection('activeSales')} />
            {openSections.activeSales && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myActiveSales.map(item => (
                  <button key={item.id} onClick={() => onGoToTransaction(item.id)} className="w-full p-4 rounded-[28px] border border-gray-100 flex items-center justify-between bg-white text-left shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border bg-teal-50 border-teal-100">{GENRE_ICONS[item.genre] || '📦'}</div>
                       <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{item.title}</div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(isOwnProfile || privacy.showBuying) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title={t.all} icon={<ShoppingBasket size={18}/>} count={myPurchases.length} isOpen={openSections.buying} onToggle={() => toggleSection('buying')} />
            {openSections.buying && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myPurchases.map(item => (
                  <button key={item.id} onClick={() => onGoToTransaction(item.id)} className="w-full p-4 rounded-[28px] border border-orange-50 flex items-center justify-between bg-white text-left shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">{item.parentAvatarIcon}</div>
                       <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{item.title}</div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WANTED SECTION */}
        {(isOwnProfile || privacy.showWanted) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title={t.wishlist} icon={<Heart size={18}/>} count={myWanted.length} isOpen={openSections.wanted} onToggle={() => toggleSection('wanted')} />
            {openSections.wanted && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myWanted.map(wanted => (
                  <div key={wanted.id} className="w-full p-4 rounded-[28px] border border-amber-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border bg-amber-50 border-amber-100">
                         {GENRE_ICONS[wanted.genre] || <Heart size={16} fill="currentColor"/>}
                       </div>
                       <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{wanted.title}</div>
                    </div>
                    <div className="text-[9px] font-black text-amber-500 uppercase">RM{wanted.hopePrice}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(isOwnProfile || privacy.showSkills) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title={t.skills} icon={<BookOpen size={18}/>} count={mySkills.length} isOpen={openSections.skills} onToggle={() => toggleSection('skills')} />
            {openSections.skills && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {mySkills.map(skill => (
                  <button key={skill.id} onClick={() => onGoToSkill(skill.id)} className="w-full p-4 rounded-[28px] border border-indigo-50 flex items-center justify-between bg-white text-left shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                         {skill.images && skill.images.length > 0 ? (
                           <img src={skill.images[0]} className="w-full h-full object-cover" alt={skill.title} referrerPolicy="no-referrer" />
                         ) : (
                           SKILL_ICONS[skill.category] || '🌟'
                         )}
                       </div>
                       <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{skill.title}</div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300"/>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isOwnProfile && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title={t.likedPosts} icon={<Heart size={18} fill="currentColor" className="text-rose-500" />} count={myLikes.length} isOpen={openSections.likes} onToggle={() => toggleSection('likes')} />
            {openSections.likes && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myLikes.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      if (item.itemType === 'MARKET') onGoToTransaction(item.id);
                      else if (item.itemType === 'SKILL') onGoToSkill(item.id);
                      else if (item.itemType === 'WANTED') onGoToWanted(item.id);
                    }} 
                    className="w-full p-4 rounded-[28px] border border-rose-50 flex items-center justify-between bg-white text-left shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                       <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border overflow-hidden ${item.itemType === 'MARKET' ? 'bg-teal-50 border-teal-100' : item.itemType === 'SKILL' ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                         {item.itemType === 'MARKET' ? (
                           (item as MarketItem).images && (item as MarketItem).images.length > 0 ? (
                             <img src={(item as MarketItem).images[0]} className="w-full h-full object-cover" alt={item.title} referrerPolicy="no-referrer" />
                           ) : (GENRE_ICONS[(item as MarketItem).genre] || '📦')
                         ) : item.itemType === 'SKILL' ? (
                           (item as Skill).images && (item as Skill).images.length > 0 ? (
                             <img src={(item as Skill).images[0]} className="w-full h-full object-cover" alt={item.title} referrerPolicy="no-referrer" />
                           ) : (SKILL_ICONS[(item as Skill).category] || '🌟')
                         ) : (GENRE_ICONS[(item as WantedItem).genre] || '🔍')}
                       </div>
                       <div className="flex flex-col min-w-0">
                         <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{item.title}</div>
                         <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.itemType}</div>
                       </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300"/>
                  </button>
                ))}
                {myLikes.length === 0 && (
                  <div className="py-8 text-center space-y-2">
                    <Heart size={32} className="mx-auto text-gray-100" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No liked posts yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-start gap-3">
            <Mail size={18} className="text-pink-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support & Inquiries</p>
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed mt-1">
                For inquiries or questions, please email <a href="mailto:nearbyexchange@gmail.com" className="text-pink-500 underline">nearbyexchange@gmail.com</a>
              </p>
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <button onClick={onLogout} className="w-full py-5 bg-white border-2 border-red-50 text-red-400 rounded-[32px] font-black uppercase text-[11px] tracking-[0.2em] shadow-sm active:bg-red-50 transition-all mt-4">
            {t.logout}
          </button>
        )}
      </div>
    </div>
  );
};