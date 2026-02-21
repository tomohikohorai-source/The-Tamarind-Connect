
import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { UserProfile, Activity, Child, MarketItem, Skill, PrivacySettings, LocationType } from '../types';
import { LOCATION_METADATA, AVATAR_ICONS, GENRE_ICONS, AGE_OPTIONS, SKILL_ICONS } from '../constants';
import { Home, Calendar, Edit3, Trash2, X, User, ShoppingBag, PackageCheck, Plus, ShoppingCart, Eye, EyeOff, Settings, ShieldAlert, ChevronLeft, ChevronRight, PlusCircle, CheckCircle, Bell, MessageSquare, AlertCircle, Ban, Send, ChevronDown, ChevronUp, History, Trash, Clock, Edit2, ShoppingBasket, BookOpen, Star, MessageCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { db, doc, setDoc } from '../firebase';
import { PetGarden } from './PetGarden';

interface Props {
  profile: UserProfile; 
  currentUser: UserProfile; 
  activities: Activity[];
  marketItems: MarketItem[];
  skills: Skill[];
  onLogout: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onEditMarket: (item: MarketItem) => void;
  onDeleteMarket: (id: string) => void;
  onMarketStatusChange: (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => void;
  onAddPlay: () => void;
  onAddMarket: () => void;
  onAddSkill: () => void;
  onEditSkill: (skill) => void;
  onDeleteSkill: (id: string) => void;
  onAddMarketComment: (itemId: string, text: string) => void;
  onGoToTransaction: (itemId: string) => void;
  onGoToSkill: (skillId: string) => void;
  onClose?: () => void; 
}

const CollapsibleHeader = memo(({ title, icon, count, isOpen, onToggle, hasBadge, badgeLabel }: { title: string, icon: React.ReactNode, count: number, isOpen: boolean, onToggle: () => void, hasBadge?: boolean, badgeLabel?: string }) => (
  <button onClick={onToggle} className="flex items-center justify-between w-full py-4 px-3 group transition-all">
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
  type: 'MARKET' | 'SKILL';
  itemId: string;
  title: string;
  message: string;
  isActionRequired: boolean;
  isDismissed: boolean;
  timestamp: string;
}

export const ProfilePage: React.FC<Props> = ({ 
  profile, currentUser, activities, marketItems, skills, onLogout, onEdit, onDelete, onUpdateProfile, 
  onEditMarket, onDeleteMarket, onMarketStatusChange, onAddPlay, onAddMarket, onAddSkill, onEditSkill, onDeleteSkill, 
  onAddMarketComment, onGoToTransaction, onGoToSkill, onClose
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  // Track notifications that have been read/clicked
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('play_share_dismissed_notifs') || '[]');
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    activeSales: true,
    pastSales: false,
    buying: true,
    skills: true,
    play: true,
    notifications: true
  });

  const toggleSection = useCallback((key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] })), []);

  const [editNickname, setEditNickname] = useState(profile.parentNickname);
  const [editAvatar, setEditAvatar] = useState(profile.avatarIcon);
  const [editBlock, setEditBlock] = useState(profile.roomNumber);
  const [editChildren, setEditChildren] = useState<Child[]>(profile.children);

  const isOwnProfile = profile.uid === currentUser.uid;
  const privacy = profile.privacySettings || { showChildren: true, showListings: true, showPastSales: true, showBuying: true, showPlayHistory: true, showSkills: true };

  // Notification Generation Logic (English, Persists after clicking but visuals change)
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

      // 1. Purchase Request (Seller)
      if (isOwner && item.requestStatus === 'PENDING') {
        list.push({ id: `${item.id}-req`, type: 'MARKET', itemId: item.id, title: item.title, message: 'A neighbor is requesting to buy this item. Please approve or decline.', isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-req`), timestamp: lastUpdate });
      }
      // 2. Buyer confirmed pickup (Seller)
      if (isOwner && item.status === 'RESERVED' && item.buyerConfirmedCompletion && !item.sellerConfirmedCompletion) {
        list.push({ id: `${item.id}-conf`, type: 'MARKET', itemId: item.id, title: item.title, message: 'Buyer reported pickup! Please finalize the transaction.', isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-conf`), timestamp: lastUpdate });
      }
      // 3. Request Approved (Buyer)
      if (isBuyer && item.status === 'RESERVED' && !item.buyerConfirmedCompletion) {
        list.push({ id: `${item.id}-appr`, type: 'MARKET', itemId: item.id, title: item.title, message: 'Your purchase request was approved! Please report pickup once you have the item.', isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-appr`), timestamp: lastUpdate });
      }
      // 4. New Comments
      if ((isOwner || isBuyer || hasParticipated) && lastComment && lastComment.userId !== profile.uid) {
        list.push({ id: `${item.id}-cmt`, type: 'MARKET', itemId: item.id, title: item.title, message: `New message: "${lastComment.text.substring(0, 20)}..."`, isActionRequired: true, isDismissed: checkIsDismissed(`${item.id}-cmt`), timestamp: lastUpdate });
      }
    });

    skills.forEach(skill => {
      const isOwner = skill.userId === profile.uid;
      const hasParticipated = skill.comments.some(c => c.userId === profile.uid);
      const lastComment = skill.comments.length > 0 ? skill.comments[skill.comments.length - 1] : null;
      const lastUpdate = skill.lastUpdated || 'initial';

      const checkIsDismissed = (id: string) => dismissedNotifIds.includes(id);

      if ((isOwner || hasParticipated) && lastComment && lastComment.userId !== profile.uid) {
        list.push({ id: `${skill.id}-cmt`, type: 'SKILL', itemId: skill.id, title: skill.title, message: `New reply in skill exchange: "${lastComment.text.substring(0, 20)}..."`, isActionRequired: true, isDismissed: checkIsDismissed(`${skill.id}-cmt`), timestamp: lastUpdate });
      }
    });

    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [marketItems, skills, profile.uid, isOwnProfile, dismissedNotifIds]);

  // Unread badge logic
  const activeUnreadCount = useMemo(() => notifications.filter(n => !n.isDismissed).length, [notifications]);

  const myActivities = useMemo(() => activities
    .filter(a => a.userId === profile.uid)
    .sort((a, b) => b.startTime.localeCompare(a.startTime)), [activities, profile.uid]);

  const mySales = useMemo(() => marketItems.filter(item => item.userId === profile.uid), [marketItems, profile.uid]);
  const myActiveSales = useMemo(() => mySales.filter(i => i.status !== 'SOLD'), [mySales]);
  
  const myPurchases = useMemo(() => marketItems.filter(item => {
    const isBuyer = item.buyerId === profile.uid;
    const isParticipant = item.comments.some(c => c.userId === profile.uid) && item.userId !== profile.uid;
    return isBuyer || isParticipant;
  }), [marketItems, profile.uid]);
  
  const mySkills = useMemo(() => skills.filter(s => {
    const isOwner = s.userId === profile.uid;
    const isParticipant = s.comments.some(c => c.userId === profile.uid) && s.userId !== profile.uid;
    return isOwner || isParticipant;
  }), [skills, profile.uid]);

  const checkHasMarketAction = useCallback((item: MarketItem) => {
    if (!isOwnProfile) return false;
    const lastCommentFromOthers = item.comments.length > 0 && item.comments[item.comments.length - 1].userId !== profile.uid;

    if (item.userId === profile.uid) {
      return item.requestStatus === 'PENDING' || lastCommentFromOthers || (item.status === 'RESERVED' && item.buyerConfirmedCompletion && !item.sellerConfirmedCompletion);
    }
    if (item.buyerId === profile.uid) {
      return lastCommentFromOthers || (item.status === 'RESERVED' && !item.buyerConfirmedCompletion);
    }
    return lastCommentFromOthers && item.comments.some(c => c.userId === profile.uid);
  }, [isOwnProfile, profile.uid]);

  const checkHasSkillAction = useCallback((skill: Skill) => {
    if (!isOwnProfile) return false;
    const lastCommentFromOthers = skill.comments.length > 0 && skill.comments[skill.comments.length - 1].userId !== profile.uid;
    
    if (skill.userId === profile.uid) {
      return lastCommentFromOthers;
    }
    return lastCommentFromOthers && skill.comments.some(c => c.userId === profile.uid);
  }, [isOwnProfile, profile.uid]);

  const hasAnyMarketAction = useMemo(() => myActiveSales.some(checkHasMarketAction), [myActiveSales, checkHasMarketAction]);
  const hasAnySkillAction = useMemo(() => mySkills.some(checkHasSkillAction), [mySkills, checkHasSkillAction]);
  const hasAnyBuyingAction = useMemo(() => myPurchases.some(checkHasMarketAction), [myPurchases, checkHasMarketAction]);

  const handleSaveProfile = async () => {
    if (!editNickname.trim()) return;
    const updatedProfile: UserProfile = { 
      ...profile, 
      parentNickname: editNickname,
      avatarIcon: editAvatar,
      roomNumber: editBlock,
      children: editChildren
    };
    try {
      await setDoc(doc(db, "users", profile.uid), updatedProfile);
      onUpdateProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (e: any) { alert("Error: " + e.message); }
  };

  const handleNotificationJump = (notif: AppNotification) => {
    // Record as read but keep in list
    if (!notif.isDismissed) {
      const nextDismissed = [...dismissedNotifIds, notif.id];
      setDismissedNotifIds(nextDismissed);
      localStorage.setItem('play_share_dismissed_notifs', JSON.stringify(nextDismissed));
    }

    if (notif.type === 'MARKET') {
      onGoToTransaction(notif.itemId);
    } else {
      onGoToSkill(notif.itemId);
    }
  };

  const togglePrivacy = async (key: keyof PrivacySettings) => {
    if (!isOwnProfile) return;
    const currentSettings = profile.privacySettings || { showChildren: true, showListings: true, showPastSales: true, showBuying: true, showPlayHistory: true, showSkills: true };
    const updatedSettings = { ...currentSettings, [key]: !currentSettings[key] };
    const updatedProfile = { ...profile, privacySettings: updatedSettings };
    try {
      await setDoc(doc(db, "users", profile.uid), updatedProfile);
      onUpdateProfile(updatedProfile);
    } catch (e: any) { alert("Error: " + e.message); }
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

  const removeChild = (id: string) => {
    setEditChildren(editChildren.filter(c => c.id !== id));
  };

  const updateChild = (id: string, field: keyof Child, value: any) => {
    setEditChildren(editChildren.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className={`p-6 pb-32 space-y-8 animate-fade-in overflow-y-auto max-h-screen hide-scrollbar bg-[#fdfbf7] ${onClose ? 'fixed inset-0 z-[100]' : ''}`}>
      {onClose && (
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-widest bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm mb-6 active:scale-95 transition-all">
          <ChevronLeft size={16} /> Community Hub
        </button>
      )}

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-5xl border-2 border-pink-100 shadow-lg shrink-0">{profile.avatarIcon}</div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter truncate leading-none mb-2">{profile.parentNickname}</h2>
            <p className="text-gray-400 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest"><Home size={12} className="text-pink-300" /> Block {profile.roomNumber}</p>
          </div>
        </div>
        {isOwnProfile && (
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className={`p-4 rounded-2xl border transition-all ${showSettings ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-100 shadow-sm'}`}><Settings size={20} /></button>
            <button onClick={() => setIsEditingProfile(true)} className="p-4 bg-pink-50 text-pink-500 rounded-2xl border border-pink-100 shadow-sm active:scale-95 transition-all"><Edit3 size={20} /></button>
          </div>
        )}
      </div>

      {/* 1. Children Info */}
      {(isOwnProfile || privacy.showChildren) && profile.children.length > 0 && (
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="bg-pink-100 text-pink-500 p-2 rounded-xl"><User size={16} /></div>
            <h3 className="font-black text-gray-800 uppercase text-[11px] tracking-widest">Children Info</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar">
            {profile.children.map(child => (
              <div key={child.id} className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{child.avatarIcon}</div>
                <div>
                  <div className="text-[11px] font-black text-gray-800 uppercase">{child.nickname}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase">{child.age} yrs • {child.gender}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Notifications Section */}
      {isOwnProfile && notifications.length > 0 && (
        <div className="bg-white rounded-[32px] border border-pink-100 overflow-hidden shadow-sm">
          <CollapsibleHeader title="Notifications" icon={<Bell size={18}/>} count={activeUnreadCount} isOpen={openSections.notifications} onToggle={() => toggleSection('notifications')} hasBadge={notifications.some(n => !n.isDismissed && n.isActionRequired)} badgeLabel="Urgent" />
          {openSections.notifications && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
               {(showAllNotifications ? notifications : notifications.slice(0, 5)).map(n => (
                 <button 
                   key={n.id} 
                   onClick={() => handleNotificationJump(n)}
                   className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] flex gap-4 items-start ${n.isDismissed ? 'bg-gray-50 border-gray-100 opacity-60' : n.isActionRequired ? 'bg-red-50 border-red-100 shadow-sm ring-1 ring-red-50' : 'bg-white border-pink-100 shadow-sm'}`}
                 >
                   <div className={`p-2 rounded-xl shrink-0 ${n.isDismissed ? 'bg-gray-200 text-gray-400' : n.isActionRequired ? 'bg-red-500 text-white animate-pulse' : 'bg-pink-100 text-pink-500'}`}>
                     {n.type === 'MARKET' ? <ShoppingBag size={16}/> : <BookOpen size={16}/>}
                   </div>
                   <div className="min-w-0 flex-grow">
                     <div className="flex justify-between items-start mb-0.5">
                       <h4 className={`text-[11px] font-black uppercase truncate tracking-tight ${n.isDismissed ? 'text-gray-400' : n.isActionRequired ? 'text-red-600' : 'text-gray-800'}`}>{n.title}</h4>
                       <span className="text-[7px] font-bold text-gray-300 shrink-0 ml-2">{format(new Date(n.timestamp), 'HH:mm')}</span>
                     </div>
                     <p className={`text-[10px] leading-relaxed font-bold ${n.isDismissed ? 'text-gray-400' : n.isActionRequired ? 'text-red-400' : 'text-gray-500'}`}>{n.message}</p>
                   </div>
                   <ChevronRight size={14} className="mt-2 text-gray-300 shrink-0" />
                 </button>
               ))}
               {notifications.length > 5 && (
                 <button onClick={() => setShowAllNotifications(!showAllNotifications)} className="w-full py-2 text-[9px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-600 transition-colors">
                   {showAllNotifications ? 'Show Less' : `View All ${notifications.length} notifications`}
                 </button>
               )}
            </div>
          )}
        </div>
      )}

      {showSettings && isOwnProfile && (
        <div className="bg-white p-6 rounded-[32px] border-2 border-gray-800 shadow-xl space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={18} className="text-gray-800" />
            <h3 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">Privacy Controls</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { key: 'showChildren', label: 'Children Info', icon: <User size={14}/> },
              { key: 'showListings', label: 'Items for Sale', icon: <ShoppingBag size={14}/> },
              { key: 'showSkills', label: 'Skills & Help', icon: <BookOpen size={14}/> },
              { key: 'showPastSales', label: 'Past Sales', icon: <History size={14}/> },
              { key: 'showBuying', label: 'Items I\'m Buying', icon: <PackageCheck size={14}/> },
              { key: 'showPlayHistory', label: 'Play History', icon: <Calendar size={14}/> }
            ].map(item => (
              <button 
                key={item.key} 
                onClick={() => togglePrivacy(item.key as any)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${privacy[item.key as keyof PrivacySettings] ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                </div>
                {privacy[item.key as keyof PrivacySettings] ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSettings(false)} className="w-full mt-4 py-4 bg-gray-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"><CheckCircle size={14}/> Close Settings</button>
        </div>
      )}

      <div className="space-y-4">
        {/* 3. ITEMS FOR SALE - Active */}
        {(isOwnProfile || privacy.showListings) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Items For Sale" icon={<ShoppingBag size={18}/>} count={myActiveSales.length} isOpen={openSections.activeSales} onToggle={() => toggleSection('activeSales')} hasBadge={hasAnyMarketAction} badgeLabel="Needs Action" />
            {openSections.activeSales && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myActiveSales.length > 0 ? (
                  myActiveSales.map(item => (
                    <button key={item.id} onClick={() => onGoToTransaction(item.id)} className={`w-full p-4 rounded-[28px] border flex items-center justify-between bg-white text-left active:scale-[0.98] transition-all relative ${checkHasMarketAction(item) ? 'border-red-300 bg-red-50/20' : (item.status === 'RESERVED' ? 'border-orange-200 bg-orange-50/20 shadow-sm' : 'border-gray-50 shadow-sm')}`}>
                      <div className="flex items-center gap-4 min-w-0 flex-grow">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${item.status === 'RESERVED' ? 'bg-orange-50 border-orange-100' : 'bg-teal-50 border-teal-100'}`}>{GENRE_ICONS[item.genre] || '📦'}</div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{item.title}</div>
                          <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${item.status === 'AVAILABLE' ? (item.requestStatus === 'PENDING' ? 'text-pink-500' : 'text-teal-500') : 'text-orange-500'}`}>
                            {item.requestStatus === 'PENDING' ? 'PENDING REQUEST' : item.status}
                            {checkHasMarketAction(item) && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[7px] animate-pulse">ACTION</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 pl-2">
                        {isOwnProfile && item.userId === profile.uid && item.status === 'AVAILABLE' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onEditMarket(item); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-teal-50 hover:text-teal-400 transition-all border border-gray-100 shadow-sm"><Edit2 size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteMarket(item.id); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 transition-all border border-gray-100 shadow-sm"><Trash2 size={14}/></button>
                          </>
                        )}
                        <div className={`p-2.5 rounded-xl shadow-lg transition-all ${checkHasMarketAction(item) ? 'bg-red-500 animate-pulse text-white' : (item.status === 'RESERVED' ? 'bg-orange-500 text-white' : 'bg-teal-500 text-white')}`}><MessageCircle size={14}/></div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No active listings</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. ITEMS I'M BUYING */}
        {(isOwnProfile || privacy.showBuying) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Shopping & Interest" icon={<ShoppingBasket size={18}/>} count={myPurchases.length} isOpen={openSections.buying} onToggle={() => toggleSection('buying')} hasBadge={hasAnyBuyingAction} badgeLabel="Update Required" />
            {openSections.buying && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myPurchases.length > 0 ? (
                  myPurchases.map(item => (
                    <button key={item.id} onClick={() => onGoToTransaction(item.id)} className={`w-full p-4 rounded-[28px] border flex items-center justify-between bg-white active:scale-[0.98] transition-all text-left relative ${checkHasMarketAction(item) ? 'border-red-300 bg-red-50/20' : (item.status === 'SOLD' ? 'opacity-60 border-gray-100 grayscale' : 'border-orange-100 bg-orange-50/20 shadow-sm')}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm">{item.parentAvatarIcon}</div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{item.title}</div>
                          <div className={`text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5`}>
                            {item.status === 'SOLD' ? 'Received' : (item.status === 'RESERVED' ? 'Reserved' : 'Requested')} • Unit {item.roomNumber}
                            {checkHasMarketAction(item) && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[7px] animate-pulse">ACTION</span>}
                          </div>
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-xl shadow-lg transition-all ${checkHasMarketAction(item) ? 'bg-red-500 animate-pulse text-white' : (item.status === 'SOLD' ? 'bg-gray-100 text-gray-400' : 'bg-orange-500 text-white')}`}><MessageCircle size={14}/></div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No items currently buying</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. SKILLS SECTION (Now below Buying) */}
        {(isOwnProfile || privacy.showSkills) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Skills & Help" icon={<BookOpen size={18}/>} count={mySkills.length} isOpen={openSections.skills} onToggle={() => toggleSection('skills')} hasBadge={hasAnySkillAction} badgeLabel="Needs Attention" />
            {openSections.skills && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {mySkills.length > 0 ? (
                  mySkills.map(skill => (
                    <button key={skill.id} onClick={() => onGoToSkill(skill.id)} className={`w-full p-4 rounded-[28px] border flex items-center justify-between bg-white text-left active:scale-[0.98] transition-all shadow-sm relative ${checkHasSkillAction(skill) ? 'border-red-100 bg-red-50/10' : 'border-indigo-50'}`}>
                      <div className="flex items-center gap-4 min-w-0 flex-grow">
                        <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                          {SKILL_ICONS[skill.category] || '🌟'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-black text-gray-800 truncate uppercase tracking-tight">{skill.title}</div>
                          <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{skill.type} • {skill.price}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 pl-2">
                        {isOwnProfile && skill.userId === profile.uid && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onEditSkill(skill); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-400 transition-all border border-gray-100 shadow-sm"><Edit2 size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteSkill(skill.id); }} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 transition-all border border-gray-100 shadow-sm"><Trash2 size={14}/></button>
                          </>
                        )}
                        <div className={`p-2.5 rounded-xl text-white shadow-lg ${checkHasSkillAction(skill) ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}><MessageCircle size={14}/></div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No skills shared yet</div>
                )}
                {isOwnProfile && (
                   <button onClick={onAddSkill} className="w-full py-3.5 bg-indigo-50 text-indigo-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                     <Plus size={16}/> Post a New Skill
                   </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. PLAY HISTORY */}
        {(isOwnProfile || privacy.showPlayHistory) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Play History" icon={<History size={18}/>} count={myActivities.length} isOpen={openSections.play} onToggle={() => toggleSection('play')} />
            {openSections.play && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myActivities.length > 0 ? (
                  myActivities.map(a => (
                    <div key={a.id} className="p-4 rounded-[28px] border border-gray-50 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${LOCATION_METADATA[a.location].bgColor} ${LOCATION_METADATA[a.location].textColor} shrink-0`}>
                          {LOCATION_METADATA[a.location].icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
                            {format(new Date(a.startTime), 'MMM d')} • {LOCATION_METADATA[a.location].label}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 truncate">
                            {format(new Date(a.startTime), 'HH:mm')} - {format(new Date(a.endTime), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                      {isOwnProfile && a.userId === profile.uid && (
                        <div className="flex gap-1.5">
                          <button onClick={() => onEdit(a)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-pink-50 hover:text-pink-400 transition-all border border-gray-100 shadow-sm"><Edit2 size={12}/></button>
                          <button onClick={() => onDelete(a.id)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 transition-all border border-gray-100 shadow-sm"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No play plans recorded</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Pet Garden (Now at the bottom of the list) */}
      {isOwnProfile && <PetGarden profile={profile} />}

      {isOwnProfile && (
        <button 
          onClick={onLogout}
          className="w-full py-5 bg-white border-2 border-red-50 text-red-400 rounded-[32px] font-black uppercase text-[11px] tracking-[0.2em] shadow-sm active:bg-red-50 transition-all mt-4"
        >
          Logout of Community
        </button>
      )}

      {isEditingProfile && isOwnProfile && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-end justify-center p-0 backdrop-blur-sm animate-fade-in overscroll-none">
          <div className="w-full max-w-lg bg-white rounded-t-[48px] shadow-2xl flex flex-col h-[92vh] border-t-4 border-pink-400 overflow-hidden relative">
             <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0 bg-white sticky top-0 z-10">
               <h3 className="font-black text-gray-800 uppercase text-[14px] tracking-[0.1em]">Resident Profile</h3>
               <div className="flex items-center gap-3">
                 <button 
                   onClick={handleSaveProfile} 
                   className="px-5 py-2.5 bg-pink-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-100 active:scale-95 transition-all"
                 >
                   Apply Updates
                 </button>
                 <button onClick={() => setIsEditingProfile(false)} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
                   <X size={26}/>
                 </button>
               </div>
             </div>
             
             <div className="flex-grow overflow-y-auto p-8 pt-6 pb-32 space-y-10 hide-scrollbar overscroll-contain">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Identity Icon</label>
                  <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                    {AVATAR_ICONS.PARENTS.map(icon => (
                      <button key={icon} onClick={() => setEditAvatar(icon)} className={`shrink-0 w-14 h-14 text-3xl rounded-2xl flex items-center justify-center border-2 transition-all ${editAvatar === icon ? 'border-pink-400 bg-pink-50' : 'border-gray-100 opacity-60'}`}>{icon}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Parent Nickname</label>
                    <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full p-4.5 bg-gray-50 border-none rounded-2xl font-black text-[14px] outline-none" placeholder="Nickname" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Building Block</label>
                     <div className="flex gap-3">
                        {['3A', '3B'].map(b => (
                          <button key={b} onClick={() => setEditBlock(b as any)} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${editBlock === b ? 'bg-pink-400 text-white shadow-xl' : 'bg-gray-50 text-gray-400'}`}>Block {b}</button>
                        ))}
                      </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Children Info</label>
                    <button onClick={addChild} className="text-[10px] px-4 py-2 rounded-full font-black bg-pink-100 text-pink-600 uppercase tracking-widest flex items-center gap-1">
                      <PlusCircle size={14}/> Add
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {editChildren.map((child) => (
                      <div key={child.id} className="p-5 bg-gray-50/50 border-2 border-pink-50 rounded-[32px] relative space-y-4 shadow-sm animate-fade-in">
                        <button onClick={() => removeChild(child.id)} className="absolute top-3 right-3 text-red-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                          {AVATAR_ICONS.CHILDREN.map(icon => (
                            <button 
                              key={icon} 
                              onClick={() => updateChild(child.id, 'avatarIcon', icon)}
                              className={`shrink-0 w-10 h-10 text-xl rounded-xl border-2 transition-all ${child.avatarIcon === icon ? 'border-pink-400 bg-pink-50' : 'border-white bg-white shadow-sm'}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={child.nickname} 
                            onChange={e => updateChild(child.id, 'nickname', e.target.value)} 
                            placeholder="Name" 
                            className="flex-grow p-3 rounded-xl bg-white border border-pink-50 text-xs font-bold outline-none" 
                          />
                          <div className="relative">
                            <select 
                              value={child.age} 
                              onChange={e => updateChild(child.id, 'age', e.target.value)}
                              className="w-20 p-3 rounded-xl bg-white border border-pink-50 text-xs font-bold outline-none appearance-none"
                            >
                              {AGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <div className="absolute right-2 top-3 text-[8px] font-black text-gray-300 pointer-events-none">YRS</div>
                          </div>
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
                              onClick={() => updateChild(child.id, 'gender', g.id as any)}
                              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                                child.gender === g.id 
                                  ? `bg-${g.color}-50 border-${g.color}-400 text-${g.color}-500` 
                                  : 'bg-white border-white text-gray-300 shadow-sm'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {editChildren.length === 0 && (
                      <div className="py-10 text-center bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px]">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No children added</p>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
