
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, UserProfile, Activity, MarketItem, AppTab, MarketComment } from './types';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { Timeline } from './components/Timeline';
import { CheckInForm } from './components/CheckInForm';
import { ProfilePage } from './components/ProfilePage';
import { PasscodeGate } from './components/PasscodeGate';
import { PetGarden } from './components/PetGarden';
import { MarketPlace } from './components/MarketPlace';
import { MarketItemForm } from './components/MarketItemForm';
import { store } from './services/store';
import { Home, PlusCircle, UserCircle, RefreshCw, ShoppingBag, Plus, ShoppingCart, LogOut } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { 
  db, auth, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, getDoc, onAuthStateChanged, signOut, arrayUnion, getDocs, writeBatch
} from './firebase';

const App: React.FC = () => {
  const [isVerified, setIsVerified] = useState(store.isVerified());
  const [appState, setAppState] = useState<AppState>('AUTH');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');
  
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [editingMarketItem, setEditingMarketItem] = useState<MarketItem | undefined>(undefined);
  const [targetMarketId, setTargetMarketId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, string>>(() => {
    return store.getAcknowledgedActivities();
  });

  const touchStartRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartRef.current;
      if (distance > 0) setPullDistance(Math.min(distance * 0.4, 80)); 
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) handleManualRefresh();
    setPullDistance(0);
    touchStartRef.current = null;
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => { window.location.reload(); }, 500);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#profile') setActiveTab('PROFILE');
      else if (hash === '#market') setActiveTab('MARKET');
      else if (hash === '#home' || hash === '') setActiveTab('HOME');
      
      if (hash === '#checkin') setShowCheckIn(true);
      else if (hash === '#sell') setShowMarketForm(true);
      else { 
        setShowCheckIn(false); 
        setEditingActivity(undefined);
        setShowMarketForm(false);
        setEditingMarketItem(undefined);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          let userData = userDoc.data() as UserProfile;
          const today = new Date();
          const todayStr = today.toISOString();
          const lastLogin = userData.lastLoginDate ? new Date(userData.lastLoginDate) : null;
          
          if (!lastLogin || !isSameDay(lastLogin, today)) {
            const newTotalDays = (userData.totalLoginDays || 0) + 1;
            userData = { ...userData, totalLoginDays: newTotalDays, lastLoginDate: todayStr };
            try { await updateDoc(doc(db, "users", user.uid), { totalLoginDays: newTotalDays, lastLoginDate: todayStr }); } catch (e) { console.error(e); }
          }
          setProfile(userData);
          setAppState('READY');
        } else {
          setAppState('SETUP');
        }
      } else {
        setAppState('AUTH');
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (appState === 'READY') {
      const qAct = query(collection(db, "activities"), orderBy("startTime", "asc"));
      const unsubAct = onSnapshot(qAct, (snapshot) => {
        setIsLive(true);
        const data: Activity[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as Activity));
        setActivities(data);
      }, (error) => { setIsLive(false); });

      const qMarket = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
      const unsubMarket = onSnapshot(qMarket, (snapshot) => {
        const data: MarketItem[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as MarketItem));
        setMarketItems(data);
      });

      return () => { unsubAct(); unsubMarket(); setIsLive(false); };
    }
  }, [appState]);

  const unseenCount = useMemo(() => {
    if (!profile) return 0;
    return activities.filter(a => {
      if (a.userId === profile.uid) return false;
      const lastSeenUpdate = acknowledgedMap[a.id];
      return !lastSeenUpdate || lastSeenUpdate !== (a.lastUpdated || 'initial');
    }).length;
  }, [activities, acknowledgedMap, profile]);

  const marketActionsCount = useMemo(() => {
    if (!profile) return 0;
    return marketItems.filter(item => {
      // Seller actions
      if (item.userId === profile.uid) {
        const hasPendingApp = item.requestStatus === 'PENDING';
        const hasNewMessage = item.status === 'RESERVED' && item.comments.length > 0 && item.comments[item.comments.length - 1].userId !== profile.uid;
        const needsCompletion = item.status === 'RESERVED' && item.buyerConfirmedCompletion && !item.sellerConfirmedCompletion;
        return hasPendingApp || hasNewMessage || needsCompletion;
      }
      // Buyer actions
      if (item.buyerId === profile.uid && item.status === 'RESERVED') {
        const hasNewMessage = item.comments.length > 0 && item.comments[item.comments.length - 1].userId !== profile.uid;
        const needsReception = !item.buyerConfirmedCompletion;
        return hasNewMessage || needsReception;
      }
      return false;
    }).length;
  }, [marketItems, profile]);

  useEffect(() => {
    if (activeTab === 'HOME' && profile && activities.length > 0) {
      const itemsToAcknowledge = activities.filter(a => {
        if (a.userId === profile.uid) return false;
        return acknowledgedMap[a.id] !== (a.lastUpdated || 'initial');
      });

      if (itemsToAcknowledge.length > 0) {
        const newMapping = { ...acknowledgedMap };
        activities.forEach(a => { newMapping[a.id] = a.lastUpdated || 'initial'; });
        setAcknowledgedMap(newMapping);
        store.setAcknowledgedActivities(newMapping);
      }
    }
  }, [activeTab, activities, profile, acknowledgedMap]);

  const changeTab = (tab: AppTab) => {
    setActiveTab(tab);
    window.location.hash = tab.toLowerCase();
  };

  const handleActionClick = () => {
    if (activeTab === 'MARKET') {
      setShowMarketForm(true);
      window.location.hash = 'sell';
    } else {
      setShowCheckIn(true);
      window.location.hash = 'checkin';
    }
  };

  const closeModals = () => {
    setShowCheckIn(false);
    setShowMarketForm(false);
    setEditingActivity(undefined);
    setEditingMarketItem(undefined);
    window.location.hash = activeTab.toLowerCase();
  };

  const handlePasscodeSuccess = () => { store.setVerified(true); setIsVerified(true); };
  
  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile({ ...newProfile, totalLoginDays: 1, lastLoginDate: new Date().toISOString() });
    setAppState('READY'); 
  };

  const handleAddActivity = async (activity: Activity) => {
    try {
      if (editingActivity) {
        const { id, ...data } = activity;
        await updateDoc(doc(db, "activities", editingActivity.id), data);
      } else {
        const { id, ...data } = activity;
        await addDoc(collection(db, "activities"), data);
      }
      closeModals();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Delete this plan permanently?')) {
      try { await deleteDoc(doc(db, "activities", id)); } catch (e: any) { alert(e.message); }
    }
  };

  const handleMarketSubmit = async (item: MarketItem) => {
    try {
      if (editingMarketItem) {
        const { id, ...data } = item;
        await updateDoc(doc(db, "marketItems", editingMarketItem.id), data);
      } else {
        const { id, ...data } = item;
        await addDoc(collection(db, "marketItems"), data);
      }
      closeModals();
    } catch (e: any) { alert(e.message); }
  };

  const handleMarketStatusChange = async (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => {
    try {
      const updates: any = { status, lastUpdated: new Date().toISOString(), ...extraFlags };
      
      if (buyerId && profile) {
        updates.buyerId = buyerId;
        updates.buyerNickname = profile.parentNickname;
        updates.buyerAvatarIcon = profile.avatarIcon;
        updates.requestStatus = 'PENDING';
      } else if (rejectionReason) {
        updates.buyerId = ''; 
        updates.buyerNickname = '';
        updates.buyerAvatarIcon = '';
        updates.requestStatus = 'REJECTED';
        updates.rejectionReason = rejectionReason;
        updates.status = 'AVAILABLE';
      } else if (status === 'RESERVED' && !extraFlags) {
        updates.requestStatus = 'NONE';
        updates.rejectionReason = '';
      }

      await updateDoc(doc(db, "marketItems", id), updates);
    } catch (e: any) { alert(e.message); }
  };

  const handleMarketComment = async (itemId: string, text: string) => {
    if (!profile) return;
    const comment: MarketComment = {
      id: crypto.randomUUID(),
      userId: profile.uid,
      userNickname: profile.parentNickname,
      userAvatar: profile.avatarIcon,
      text,
      createdAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, "marketItems", itemId), {
        comments: arrayUnion(comment),
        lastUpdated: new Date().toISOString()
      });
    } catch (e: any) { alert(e.message); }
  };

  const handleMarketDelete = async (id: string) => {
    if (confirm('Delete this listing permanently?')) {
      try { await deleteDoc(doc(db, "marketItems", id)); } catch (e: any) { alert(e.message); }
    }
  };

  const handleViewProfile = async (userId: string) => {
    if (profile && userId === profile.uid) {
      changeTab('PROFILE');
      return;
    }
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setViewingProfile(userDoc.data() as UserProfile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectToTransaction = (itemId: string) => {
    setTargetMarketId(itemId);
    setActiveTab('MARKET');
    window.location.hash = 'market';
  };

  const handleLogout = async () => { 
    if (confirm('Logout?')) { 
      try {
        await signOut(auth); 
        store.clearAll(); 
        setAppState('AUTH'); 
        setProfile(null);
        window.location.reload(); 
      } catch (e: any) {
        alert("Logout failed: " + e.message);
      }
    } 
  };

  if (!isVerified) return <PasscodeGate onSuccess={handlePasscodeSuccess} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500 font-black uppercase tracking-widest text-xs animate-pulse">Entering The Tamarind...</div>;
  if (appState === 'AUTH') return <AuthScreen />;
  if (appState === 'SETUP' && auth.currentUser) return <ProfileSetup onComplete={handleProfileComplete} />;

  const isMarket = activeTab === 'MARKET';
  const isProfile = activeTab === 'PROFILE';
  const themeColor = isMarket ? 'text-teal-500' : 'text-pink-500';
  const themeBg = isMarket ? 'bg-teal-400' : 'bg-pink-400';
  const themeShadow = isMarket ? 'shadow-teal-100' : 'shadow-pink-100';

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] max-w-lg mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden touch-none sm:touch-auto" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-5 flex flex-col items-center border-b border-gray-100">
        <div className="w-full flex justify-between items-center absolute px-5">
           <button onClick={handleManualRefresh} className="flex items-center gap-2 group active:scale-95 transition-all">
             <div className={`w-2 h-2 rounded-full ${isLive && isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
             <RefreshCw size={12} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
           </button>
           <button onClick={handleLogout} className="p-2.5 text-gray-300 hover:text-red-400 active:scale-90 transition-all">
             <LogOut size={20} />
           </button>
        </div>
        <h1 className={`text-xl font-black ${themeColor} tracking-tighter uppercase text-center transition-colors duration-500`}>The Tamarind Connect</h1>
        {profile && <div className="mt-2 text-[9px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">Block {profile.roomNumber}</div>}
      </header>

      <main className="flex-grow overflow-y-auto touch-pan-y hide-scrollbar" style={{ transform: `translateY(${pullDistance}px)` }}>
        {activeTab === 'HOME' && profile && (
          <div className="animate-fade-in">
            <PetGarden profile={profile} />
            <Timeline activities={activities} profile={profile} acknowledgedMap={acknowledgedMap} onEdit={(a) => { setEditingActivity(a); window.location.hash = 'checkin'; }} onDelete={handleDeleteActivity} onUpdateProfile={setProfile} onViewProfile={handleViewProfile} />
          </div>
        )}
        {activeTab === 'MARKET' && profile && (
          <MarketPlace items={marketItems} profile={profile} initialActiveItemId={targetMarketId} onEdit={(item) => { setEditingMarketItem(item); window.location.hash = 'sell'; }} onStatusChange={handleMarketStatusChange} onDelete={handleMarketDelete} onAddComment={handleMarketComment} onViewProfile={handleViewProfile} onChatClose={() => setTargetMarketId(null)} />
        )}
        {activeTab === 'PROFILE' && profile && (
          <ProfilePage profile={profile} currentUser={profile} activities={activities} marketItems={marketItems} onLogout={handleLogout} onEdit={(a) => { setEditingActivity(a); window.location.hash = 'checkin'; }} onDelete={handleDeleteActivity} onUpdateProfile={setProfile} onEditMarket={(item) => { setEditingMarketItem(item); window.location.hash = 'sell'; }} onDeleteMarket={handleMarketDelete} onMarketStatusChange={handleMarketStatusChange} onAddPlay={() => { setShowCheckIn(true); window.location.hash = 'checkin'; }} onAddMarket={() => { setShowMarketForm(true); window.location.hash = 'sell'; }} onAddMarketComment={handleMarketComment} onGoToTransaction={handleDirectToTransaction} />
        )}
      </main>

      {viewingProfile && profile && (
        <ProfilePage profile={viewingProfile} currentUser={profile} activities={activities} marketItems={marketItems} onLogout={() => {}} onEdit={() => {}} onDelete={() => {}} onUpdateProfile={() => {}} onEditMarket={() => {}} onDeleteMarket={() => {}} onMarketStatusChange={() => {}} onAddPlay={() => {}} onAddMarket={() => {}} onAddMarketComment={() => {}} onGoToTransaction={() => {}} onClose={() => setViewingProfile(null)} />
      )}

      {(showCheckIn || editingActivity) && profile && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModals} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <CheckInForm profile={profile} initialActivity={editingActivity} onSubmit={handleAddActivity} onCancel={closeModals} />
          </div>
        </div>
      )}

      {(showMarketForm || editingMarketItem) && profile && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModals} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <MarketItemForm profile={profile} initialItem={editingMarketItem} onSubmit={handleMarketSubmit} onCancel={closeModals} />
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-4 relative">
          <button onClick={() => changeTab('HOME')} className={`flex flex-col items-center gap-1 w-1/4 relative ${activeTab === 'HOME' ? 'text-pink-400' : 'text-gray-300'}`}>
            <Home size={22} /><span className="text-[9px] font-black uppercase tracking-wider">Play</span>
            {(activeTab !== 'HOME' && unseenCount > 0) && <span className="absolute top-1/2 left-1/2 -translate-x-[-11px] -translate-y-[-11px] w-4.5 h-4.5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-black">{unseenCount}</span>}
          </button>
          <button onClick={() => changeTab('MARKET')} className={`flex flex-col items-center gap-1 w-1/4 relative ${activeTab === 'MARKET' ? 'text-teal-400' : 'text-gray-300'}`}>
            <ShoppingBag size={22} /><span className="text-[9px] font-black uppercase tracking-wider">Market</span>
          </button>
          <div className="w-1/4 flex justify-center">
            {isProfile ? (
              <div className="flex gap-2.5 -translate-y-6">
                <button onClick={() => { setShowCheckIn(true); window.location.hash = 'checkin'; }} className="flex flex-col items-center justify-center w-14 h-14 bg-pink-400 text-white rounded-2xl font-black shadow-2xl shadow-pink-100 border-4 border-white active:scale-95 transition-all"><Plus size={22} /><span className="text-[7px] uppercase font-black">Play</span></button>
                <button onClick={() => { setShowMarketForm(true); window.location.hash = 'sell'; }} className="flex flex-col items-center justify-center w-14 h-14 bg-teal-400 text-white rounded-2xl font-black shadow-2xl shadow-teal-100 border-4 border-white active:scale-95 transition-all"><ShoppingCart size={20} /><span className="text-[7px] uppercase font-black">Sell</span></button>
              </div>
            ) : (
              <button onClick={handleActionClick} className={`flex items-center gap-2.5 ${themeBg} text-white px-7 py-4 rounded-[32px] font-black shadow-2xl ${themeShadow} border-4 border-white -translate-y-6 active:scale-95 transition-all`}><PlusCircle size={22} /><span className="text-[10px] uppercase tracking-widest">{isMarket ? 'Sell' : 'Add'}</span></button>
            )}
          </div>
          <button onClick={() => changeTab('PROFILE')} className={`flex flex-col items-center gap-1 w-1/4 relative ${activeTab === 'PROFILE' ? 'text-pink-400' : 'text-gray-300'}`}>
            <UserCircle size={22} /><span className="text-[9px] font-black uppercase tracking-wider">Me</span>
            {(activeTab !== 'PROFILE' && marketActionsCount > 0) && <span className="absolute top-1/2 left-1/2 -translate-x-[-11px] -translate-y-[-11px] w-4.5 h-4.5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-black">{marketActionsCount}</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
