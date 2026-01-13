
import React, { useState, useMemo } from 'react';
import { UserProfile, Activity, Child, MarketItem, PrivacySettings, LocationType } from '../types';
import { LOCATION_METADATA, AVATAR_ICONS, GENRE_ICONS, AGE_OPTIONS } from '../constants';
import { Home, Calendar, Edit3, Trash2, X, User, ShoppingBag, PackageCheck, Plus, ShoppingCart, Eye, EyeOff, Settings, ShieldAlert, ChevronLeft, PlusCircle, CheckCircle, Bell, MessageSquare, AlertCircle, Ban, Send, ChevronDown, ChevronUp, History, Trash, Clock, Edit2, ShoppingBasket } from 'lucide-react';
import { format } from 'date-fns';
import { db, doc, setDoc } from '../firebase';
import { PetGarden } from './PetGarden';

interface Props {
  profile: UserProfile; 
  currentUser: UserProfile; 
  activities: Activity[];
  marketItems: MarketItem[];
  onLogout: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onEditMarket: (item: MarketItem) => void;
  onDeleteMarket: (id: string) => void;
  onMarketStatusChange: (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => void;
  onAddPlay: () => void;
  onAddMarket: () => void;
  onAddMarketComment: (itemId: string, text: string) => void;
  onGoToTransaction: (itemId: string) => void;
  onClose?: () => void; 
}

const CollapsibleHeader: React.FC<{ title: string, icon: React.ReactNode, count: number, isOpen: boolean, onToggle: () => void }> = ({ title, icon, count, isOpen, onToggle }) => (
  <button onClick={onToggle} className="flex items-center justify-between w-full py-4 px-3 group transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl transition-colors ${isOpen ? 'bg-pink-100 text-pink-500' : 'bg-gray-50 text-gray-400 group-hover:text-pink-400'}`}>
        {icon}
      </div>
      <h3 className="font-black text-gray-800 uppercase text-[11px] tracking-widest">{title} {count > 0 && <span className="text-pink-400 ml-1.5 opacity-60">({count})</span>}</h3>
    </div>
    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
      <ChevronDown size={18} className="text-gray-300" />
    </div>
  </button>
);

export const ProfilePage: React.FC<Props> = ({ 
  profile, currentUser, activities, marketItems, onLogout, onEdit, onDelete, onUpdateProfile, 
  onEditMarket, onDeleteMarket, onMarketStatusChange, onAddPlay, onAddMarket, onAddMarketComment, onGoToTransaction, onClose
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [rejectItem, setRejectItem] = useState<MarketItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    activeSales: true,
    pastSales: false,
    buying: true,
    play: true
  });

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Profile Edit State
  const [editNickname, setEditNickname] = useState(profile.parentNickname);
  const [editAvatar, setEditAvatar] = useState(profile.avatarIcon);
  const [editBlock, setEditBlock] = useState(profile.roomNumber);
  const [editChildren, setEditChildren] = useState<Child[]>(profile.children);

  const isOwnProfile = profile.uid === currentUser.uid;

  const myActivities = useMemo(() => activities
    .filter(a => a.userId === profile.uid)
    .sort((a, b) => b.startTime.localeCompare(a.startTime)), [activities, profile.uid]);

  const mySales = useMemo(() => marketItems.filter(item => item.userId === profile.uid), [marketItems, profile.uid]);
  const myActiveSales = useMemo(() => mySales.filter(i => i.status !== 'SOLD'), [mySales]);
  const myPastSales = useMemo(() => mySales.filter(i => i.status === 'SOLD'), [mySales]);
  
  // Buyer logic: include items where I am the buyerId
  const myPurchases = useMemo(() => marketItems.filter(item => item.buyerId === profile.uid), [marketItems, profile.uid]);

  // Combined Action Items (For both Buyer and Seller)
  const actionItems = useMemo(() => {
    if (!isOwnProfile) return [];
    
    const sellerTasks = mySales.filter(item => {
      const hasPendingApp = item.requestStatus === 'PENDING';
      const hasNewMessage = item.status === 'RESERVED' && item.comments.length > 0 && item.comments[item.comments.length - 1].userId !== profile.uid;
      const needsEndDeal = item.status === 'RESERVED' && item.buyerConfirmedCompletion && !item.sellerConfirmedCompletion;
      return hasPendingApp || hasNewMessage || needsEndDeal;
    });

    const buyerTasks = myPurchases.filter(item => {
      if (item.status !== 'RESERVED') return false;
      const hasNewMessage = item.comments.length > 0 && item.comments[item.comments.length - 1].userId !== profile.uid;
      const needsConfirmation = !item.buyerConfirmedCompletion;
      return hasNewMessage || needsConfirmation;
    });

    return [...sellerTasks, ...buyerTasks];
  }, [mySales, myPurchases, isOwnProfile, profile.uid]);

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

  const handleRejectAction = () => {
    if (rejectItem && rejectionReason.trim()) {
      onMarketStatusChange(rejectItem.id, 'AVAILABLE', '', rejectionReason);
      setRejectItem(null);
      setRejectionReason('');
    }
  };

  const togglePrivacy = async (key: keyof PrivacySettings) => {
    if (!isOwnProfile) return;
    const settings = profile.privacySettings || { showChildren: true, showListings: true, showPastSales: true, showBuying: true, showPlayHistory: true };
    const updatedSettings = { ...settings, [key]: !settings[key] };
    const updatedProfile = { ...profile, privacySettings: updatedSettings };
    try {
      await setDoc(doc(db, "users", profile.uid), updatedProfile);
      onUpdateProfile(updatedProfile);
    } catch (e: any) { alert("Error: " + e.message); }
  };

  const privacy = profile.privacySettings || { showChildren: true, showListings: true, showPastSales: true, showBuying: true, showPlayHistory: true };

  return (
    <div className={`p-6 pb-32 space-y-8 animate-fade-in overflow-y-auto max-h-screen hide-scrollbar bg-[#fdfbf7] ${onClose ? 'fixed inset-0 z-[100]' : ''}`}>
      {onClose && (
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-widest bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm mb-6 active:scale-95 transition-all">
          <ChevronLeft size={16} /> Community Hub
        </button>
      )}

      {/* Profile Info Header */}
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

      {isOwnProfile && actionItems.length > 0 && (
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="bg-orange-500 text-white p-2 rounded-xl shadow-xl shadow-orange-100"><Bell size={16} className="animate-pulse" /></div>
            <h3 className="font-black text-gray-800 uppercase text-[11px] tracking-widest">Active Tasks</h3>
          </div>
          <div className="grid gap-4">
            {actionItems.map(item => {
              const isSeller = item.userId === profile.uid;
              const hasPendingApp = item.requestStatus === 'PENDING';
              const latestComment = item.comments.length > 0 ? item.comments[item.comments.length - 1] : null;
              const isNewMessage = latestComment && latestComment.userId !== profile.uid;

              let label = 'Update Required';
              if (isSeller) {
                if (hasPendingApp) label = 'New Sale Request';
                else if (item.buyerConfirmedCompletion) label = 'Action: Mark as Sold';
                else if (isNewMessage) label = 'Chat: Message from Buyer';
              } else {
                if (isNewMessage) label = 'Chat: Message from Seller';
                else if (!item.buyerConfirmedCompletion) label = 'Pending: Item Pick-up';
              }

              return (
                <div key={item.id} className="bg-white p-6 rounded-[36px] border-2 border-orange-100 shadow-xl space-y-4 animate-slide-up">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl border border-orange-100">{GENRE_ICONS[item.genre] || '📦'}</div>
                    <div className="flex-grow">
                      <div className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">{label}</div>
                      <div className="text-[13px] font-black text-gray-800 line-clamp-1">{item.title}</div>
                    </div>
                  </div>

                  {hasPendingApp && isSeller ? (
                    <div className="flex gap-2">
                      <button onClick={() => onMarketStatusChange(item.id, 'RESERVED')} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">Approve</button>
                      <button onClick={() => setRejectItem(item)} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase text-[9px] tracking-widest border border-red-100">Deny</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onGoToTransaction(item.id)}
                      className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-100 active:scale-95"
                    >
                      <MessageSquare size={16}/> Go to Chat Room
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <PetGarden profile={profile} />

      <div className="grid grid-cols-2 gap-4">
        <button onClick={onAddPlay} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-pink-50 rounded-[36px] shadow-sm active:scale-95 transition-all group">
          <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-400 mb-3 group-hover:bg-pink-400 group-hover:text-white transition-all"><Plus size={28} /></div>
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">New Play Plan</span>
        </button>
        <button onClick={onAddMarket} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-teal-50 rounded-[36px] shadow-sm active:scale-95 transition-all group">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-400 mb-3 group-hover:bg-teal-400 group-hover:text-white transition-all"><ShoppingCart size={28} /></div>
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">New Sale Item</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* ITEMS FOR SALE - Active */}
        {(isOwnProfile || privacy.showListings) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Items For Sale" icon={<ShoppingBag size={18}/>} count={myActiveSales.length} isOpen={openSections.activeSales} onToggle={() => toggleSection('activeSales')} />
            {openSections.activeSales && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myActiveSales.length > 0 ? (
                  myActiveSales.map(item => (
                    <div key={item.id} className={`p-4 rounded-[28px] border flex items-center justify-between bg-white ${item.status === 'RESERVED' ? 'border-orange-200 bg-orange-50/20 shadow-sm' : 'border-gray-50'}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${item.status === 'RESERVED' ? 'bg-orange-50 border-orange-100' : 'bg-teal-50 border-teal-100'}`}>{GENRE_ICONS[item.genre] || '📦'}</div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-black text-gray-800 truncate">{item.title}</div>
                          <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${item.status === 'AVAILABLE' ? 'text-teal-500' : 'text-orange-500'}`}>
                            {item.status}
                            {item.requestStatus === 'PENDING' && <span className="text-pink-500 animate-pulse">● REQ</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {isOwnProfile && (
                          <>
                            <button onClick={() => onEditMarket(item)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-teal-50 hover:text-teal-400 transition-all border border-gray-100 shadow-sm"><Edit2 size={14}/></button>
                            <button onClick={() => onDeleteMarket(item.id)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-400 transition-all border border-gray-100 shadow-sm"><Trash2 size={14}/></button>
                          </>
                        )}
                        {item.status === 'RESERVED' && (
                          <button onClick={() => onGoToTransaction(item.id)} className="p-2.5 bg-orange-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><MessageSquare size={14}/></button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No active listings</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PAST SALES - Sold Items */}
        {(isOwnProfile || privacy.showPastSales) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Past Sales" icon={<History size={18}/>} count={myPastSales.length} isOpen={openSections.pastSales} onToggle={() => toggleSection('pastSales')} />
            {openSections.pastSales && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myPastSales.length > 0 ? (
                  myPastSales.map(item => (
                    <div key={item.id} className="p-4 rounded-[28px] border border-gray-50 flex items-center justify-between bg-gray-50/50 opacity-70">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm">{GENRE_ICONS[item.genre] || '📦'}</div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-black text-gray-400 line-through truncate">{item.title}</div>
                          <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Sold for {item.type === 'FREE' ? 'FREE' : `RM ${item.price}`}</div>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-100 text-gray-400 rounded-xl"><CheckCircle size={14}/></div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No past sales</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ITEMS I'M BUYING */}
        {(isOwnProfile || privacy.showBuying) && (
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <CollapsibleHeader title="Items I'm Buying" icon={<ShoppingBasket size={18}/>} count={myPurchases.length} isOpen={openSections.buying} onToggle={() => toggleSection('buying')} />
            {openSections.buying && (
              <div className="px-4 pb-4 space-y-3 animate-fade-in">
                {myPurchases.length > 0 ? (
                  myPurchases.map(item => (
                    <div key={item.id} className={`p-4 rounded-[28px] border flex items-center justify-between bg-white ${item.status === 'SOLD' ? 'opacity-60 border-gray-100 grayscale' : 'border-orange-100 bg-orange-50/20 shadow-sm'}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm">{item.parentAvatarIcon}</div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-black text-gray-800 truncate">{item.title}</div>
                          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            {item.status === 'SOLD' ? 'Received' : (item.status === 'RESERVED' ? 'Reserved' : 'Requested')} • Unit {item.roomNumber}
                          </div>
                        </div>
                      </div>
                      {item.status === 'RESERVED' && (
                        <button onClick={() => onGoToTransaction(item.id)} className="p-2.5 bg-orange-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><MessageSquare size={14}/></button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No items currently buying</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PLAY HISTORY */}
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
                      {isOwnProfile && (
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

      {isOwnProfile && (
        <button 
          onClick={onLogout}
          className="w-full py-5 bg-white border-2 border-red-50 text-red-400 rounded-[32px] font-black uppercase text-[11px] tracking-[0.2em] shadow-sm active:bg-red-50 transition-all mt-4"
        >
          Logout of Community
        </button>
      )}

      {isEditingProfile && isOwnProfile && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-end justify-center p-0 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-[48px] shadow-2xl flex flex-col max-h-[92vh] border-t-4 border-pink-400">
             <div className="flex justify-between items-center p-8 border-b border-gray-50 shrink-0">
               <h3 className="font-black text-gray-800 uppercase text-[15px] tracking-[0.1em]">Resident Profile</h3>
               <button onClick={() => setIsEditingProfile(false)}><X size={28} className="text-gray-300"/></button>
             </div>
             
             <div className="flex-grow overflow-y-auto p-10 pt-4 space-y-10 hide-scrollbar pb-20">
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

                <div className="p-8 border-t border-gray-50 shrink-0 bg-white">
                  <button onClick={handleSaveProfile} className="w-full py-5.5 bg-pink-400 text-white rounded-[28px] font-black shadow-2xl shadow-pink-100 active:scale-95 transition-all uppercase tracking-[0.25em] text-[13px]">Apply Updates</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {rejectItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-red-400">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight text-center">Deny Request</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center leading-loose">State a reason for the neighbor</p>
              <textarea 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Reason..."
                className="w-full p-5 bg-gray-50 border-none rounded-3xl font-bold text-sm h-32 resize-none outline-none focus:ring-4 ring-red-50"
              />
              <div className="flex gap-4 pt-2">
                <button onClick={() => setRejectItem(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest">Back</button>
                <button onClick={handleRejectAction} disabled={!rejectionReason.trim()} className="flex-1 py-5 bg-red-500 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-red-100 active:scale-95">Send Denial</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
