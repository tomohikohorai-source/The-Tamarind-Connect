
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, UserProfile, Activity } from './types';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { Timeline } from './components/Timeline';
import { CheckInForm } from './components/CheckInForm';
import { ProfilePage } from './components/ProfilePage';
import { PasscodeGate } from './components/PasscodeGate';
import { PetGarden } from './components/PetGarden';
import { store } from './services/store';
import { Home, PlusCircle, UserCircle, RefreshCw } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { 
  db, auth, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, getDoc, onAuthStateChanged, signOut
} from './firebase';

const App: React.FC = () => {
  const [isVerified, setIsVerified] = useState(store.isVerified());
  const [appState, setAppState] = useState<AppState>('AUTH');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'HOME' | 'PROFILE'>('HOME');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, string>>(() => {
    return store.getAcknowledgedActivities();
  });

  // Pull-to-refresh logic
  const touchStartRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartRef.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.4, 80)); // Limit distance
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleManualRefresh();
    }
    setPullDistance(0);
    touchStartRef.current = null;
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Smooth reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
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
      else if (hash === '#home' || hash === '') setActiveTab('HOME');
      else if (hash === '#checkin') setShowCheckIn(true);
      else { setShowCheckIn(false); setEditingActivity(undefined); }
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
      }, (error) => {
        setIsLive(false);
      });
      return () => {
        unsubAct();
        setIsLive(false);
      };
    }
  }, [appState]);

  const unseenCount = useMemo(() => {
    if (!profile) return 0;
    const count = activities.filter(a => {
      if (a.userId === profile.uid) return false;
      const lastSeenUpdate = acknowledgedMap[a.id];
      return !lastSeenUpdate || lastSeenUpdate !== (a.lastUpdated || 'initial');
    }).length;
    
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count).catch(console.error);
      } else {
        (navigator as any).clearAppBadge().catch(console.error);
      }
    }
    
    return count;
  }, [activities, acknowledgedMap, profile]);

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

  const changeTab = (tab: 'HOME' | 'PROFILE') => {
    setActiveTab(tab);
    window.location.hash = tab.toLowerCase();
  };

  const openCheckIn = () => { setShowCheckIn(true); window.location.hash = 'checkin'; };
  const closeCheckIn = () => { setShowCheckIn(false); setEditingActivity(undefined); window.location.hash = activeTab.toLowerCase(); };
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
      closeCheckIn();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Delete this schedule?')) {
      try { await deleteDoc(doc(db, "activities", id)); } catch (e: any) { alert(e.message); }
    }
  };

  const handleLogout = async () => { if (confirm('Logout?')) { await signOut(auth); setAppState('AUTH'); } };

  if (!isVerified) return <PasscodeGate onSuccess={handlePasscodeSuccess} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading Connect...</div>;
  if (appState === 'AUTH') return <AuthScreen />;
  if (appState === 'SETUP' && auth.currentUser) return <ProfileSetup onComplete={handleProfileComplete} />;

  return (
    <div 
      className="flex flex-col min-h-screen bg-[#fdfbf7] max-w-lg mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden touch-none sm:touch-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <div className={`p-2 bg-white rounded-full shadow-lg border border-pink-100 ${pullDistance > 60 ? 'text-pink-500 scale-110' : 'text-gray-300'} transition-all`}>
          <RefreshCw size={24} className={`${pullDistance > 60 ? 'animate-spin' : ''}`} />
        </div>
      </div>

      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-5 flex flex-col items-center border-b border-gray-100">
        <button 
          onClick={handleManualRefresh}
          className="flex items-center gap-2 mb-1 group active:scale-95 transition-all"
        >
          <div className={`w-2 h-2 rounded-full ${isLive && isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isLive && isOnline ? 'text-green-500' : 'text-red-400'}`}>
            {isOnline ? (isLive ? 'Live Syncing' : 'Connecting...') : 'Offline'}
          </span>
          <RefreshCw size={10} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
        </button>
        <h1 className="text-xl font-black text-pink-500 tracking-tighter uppercase text-center">The Tamarind Connect</h1>
        {profile && <div className="mt-2 text-[9px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">Block {profile.roomNumber}</div>}
      </header>

      <main className="flex-grow overflow-y-auto touch-pan-y hide-scrollbar" style={{ transform: `translateY(${pullDistance}px)` }}>
        {activeTab === 'HOME' && profile && (
          <div className="animate-fade-in">
            <PetGarden profile={profile} />
            <Timeline activities={activities} profile={profile} acknowledgedMap={acknowledgedMap} onEdit={(a) => { setEditingActivity(a); window.location.hash = 'checkin'; }} onDelete={handleDeleteActivity} onUpdateProfile={setProfile} />
          </div>
        )}
        {activeTab === 'PROFILE' && profile && (
          <ProfilePage profile={profile} activities={activities} onLogout={handleLogout} onEdit={(a) => { setEditingActivity(a); window.location.hash = 'checkin'; }} onDelete={handleDeleteActivity} onUpdateProfile={setProfile} />
        )}
      </main>

      {isRefreshing && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Refreshing...</span>
          </div>
        </div>
      )}

      {(showCheckIn || editingActivity) && profile && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCheckIn} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <CheckInForm profile={profile} initialActivity={editingActivity} onSubmit={handleAddActivity} onCancel={closeCheckIn} />
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-4 relative">
          <button onClick={() => changeTab('HOME')} className={`flex flex-col items-center gap-1 w-1/3 relative ${activeTab === 'HOME' ? 'text-pink-400' : 'text-gray-300'}`}>
            <Home size={22} />
            <span className="text-[9px] font-black uppercase">Home</span>
            {(activeTab !== 'HOME' && unseenCount > 0) && (
              <span className="absolute top-1/2 left-1/2 -translate-x-[-12px] -translate-y-[-10px] w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-sm animate-bounce">
                {unseenCount}
              </span>
            )}
          </button>
          <div className="w-1/3 flex justify-center"><button onClick={openCheckIn} className="flex items-center gap-2 bg-pink-400 text-white px-6 py-3.5 rounded-[32px] font-black shadow-2xl shadow-pink-100 border-4 border-white -translate-y-6 active:scale-95 transition-all"><PlusCircle size={20} /><span className="text-[10px] uppercase tracking-widest">Add Plans</span></button></div>
          <button onClick={() => changeTab('PROFILE')} className={`flex flex-col items-center gap-1 w-1/3 ${activeTab === 'PROFILE' ? 'text-pink-400' : 'text-gray-300'}`}><UserCircle size={22} /><span className="text-[9px] font-black uppercase">Profile</span></button>
        </div>
      </nav>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
