
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, UserProfile, Activity } from './types';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { Timeline } from './components/Timeline';
import { CheckInForm } from './components/CheckInForm';
import { ProfilePage } from './components/ProfilePage';
import { PasscodeGate } from './components/PasscodeGate';
import { PetGarden } from './components/PetGarden';
import { store } from './services/store';
import { Home, PlusCircle, UserCircle } from 'lucide-react';
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

  // Notification state
  const [unseenCount, setUnseenCount] = useState(0);

  // Sync state with URL hash
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
        const data: Activity[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as Activity));
        setActivities(data);
      });
      return () => unsubAct();
    }
  }, [appState]);

  // Handle Notifications
  useEffect(() => {
    if (appState === 'READY' && profile) {
      const acknowledged = store.getAcknowledgedActivities();
      const count = activities.filter(a => {
        if (a.userId === profile.uid) return false;
        return !acknowledged[a.id] || acknowledged[a.id] !== a.lastUpdated;
      }).length;
      setUnseenCount(count);

      // If user is currently on HOME tab, auto-acknowledge after a small delay
      if (activeTab === 'HOME') {
        const timer = setTimeout(() => {
          const newMapping: Record<string, string> = { ...acknowledged };
          activities.forEach(a => {
            newMapping[a.id] = a.lastUpdated;
          });
          store.setAcknowledgedActivities(newMapping);
          setUnseenCount(0);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [activities, activeTab, appState, profile]);

  const changeTab = (tab: 'HOME' | 'PROFILE') => {
    setActiveTab(tab);
    window.location.hash = tab.toLowerCase();
  };

  const openCheckIn = () => {
    setShowCheckIn(true);
    window.location.hash = 'checkin';
  };

  const closeCheckIn = () => {
    setShowCheckIn(false);
    setEditingActivity(undefined);
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
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] max-w-lg mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-5 flex flex-col items-center border-b border-gray-100">
        <h1 className="text-xl font-black text-pink-500 tracking-tighter uppercase text-center">The Tamarind Connect</h1>
        {profile && <div className="mt-2 text-[9px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">Block {profile.roomNumber}</div>}
      </header>

      <main className="flex-grow">
        {activeTab === 'HOME' && profile && (
          <div className="animate-fade-in">
            <PetGarden profile={profile} />
            <Timeline 
              activities={activities} 
              profile={profile} 
              onEdit={(a) => { setEditingActivity(a); window.location.hash = 'checkin'; }} 
              onDelete={handleDeleteActivity}
              onUpdateProfile={setProfile}
            />
          </div>
        )}
        {activeTab === 'PROFILE' && profile && (
          <ProfilePage profile={profile} activities={activities} onLogout={handleLogout} onEdit={(a) => { setEditingActivity(a); window.location.hash = 'checkin'; }} onDelete={handleDeleteActivity} onUpdateProfile={setProfile} />
        )}
      </main>

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
            {unseenCount > 0 && (
              <span className="absolute top-0 right-1/3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
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
