
import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, Activity } from './types';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { Timeline } from './components/Timeline';
import { CheckInForm } from './components/CheckInForm';
import { ProfilePage } from './components/ProfilePage';
import { PasscodeGate } from './components/PasscodeGate';
import { store } from './services/store';
import { Home, PlusCircle, UserCircle } from 'lucide-react';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          if (!userData.customUserId && user.displayName) {
            userData.customUserId = user.displayName;
            try { await updateDoc(doc(db, "users", user.uid), { customUserId: user.displayName }); } catch (e) { console.error(e); }
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

      return () => { unsubAct(); };
    }
  }, [appState]);

  const handlePasscodeSuccess = () => { store.setVerified(true); setIsVerified(true); };
  const handleProfileComplete = (newProfile: UserProfile) => { setProfile(newProfile); setAppState('READY'); };

  const handleAddActivity = async (activity: Activity) => {
    try {
      if (editingActivity) {
        const { id, ...data } = activity;
        await updateDoc(doc(db, "activities", editingActivity.id), data);
      } else {
        const { id, ...data } = activity;
        await addDoc(collection(db, "activities"), data);
      }
      setShowCheckIn(false);
      setEditingActivity(undefined);
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
        {activeTab === 'HOME' && (
          <Timeline 
            activities={activities} 
            profile={profile} 
            onEdit={setEditingActivity} 
            onDelete={handleDeleteActivity}
            onUpdateProfile={setProfile}
          />
        )}
        {activeTab === 'PROFILE' && profile && (
          <ProfilePage profile={profile} activities={activities} onLogout={handleLogout} onEdit={setEditingActivity} onDelete={handleDeleteActivity} onUpdateProfile={setProfile} />
        )}
      </main>

      {(showCheckIn || editingActivity) && profile && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowCheckIn(false); setEditingActivity(undefined); }} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <CheckInForm profile={profile} initialActivity={editingActivity} onSubmit={handleAddActivity} onCancel={() => { setShowCheckIn(false); setEditingActivity(undefined); }} />
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-4 relative">
          <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center gap-1 w-1/3 ${activeTab === 'HOME' ? 'text-pink-400' : 'text-gray-300'}`}><Home size={22} /><span className="text-[9px] font-black uppercase">Home</span></button>
          <div className="w-1/3 flex justify-center"><button onClick={() => setShowCheckIn(true)} className="flex items-center gap-2 bg-pink-400 text-white px-6 py-3.5 rounded-[32px] font-black shadow-2xl shadow-pink-100 border-4 border-white -translate-y-6 active:scale-95 transition-all"><PlusCircle size={20} /><span className="text-[10px] uppercase tracking-widest">Add Plans</span></button></div>
          <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center gap-1 w-1/3 ${activeTab === 'PROFILE' ? 'text-pink-400' : 'text-gray-300'}`}><UserCircle size={22} /><span className="text-[9px] font-black uppercase">Profile</span></button>
        </div>
      </nav>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
