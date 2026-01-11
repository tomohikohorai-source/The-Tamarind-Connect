
import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, Activity } from './types';
import { store } from './services/store';
import { PasscodeGate } from './components/PasscodeGate';
import { ProfileSetup } from './components/ProfileSetup';
import { Timeline } from './components/Timeline';
import { CheckInForm } from './components/CheckInForm';
import { ProfilePage } from './components/ProfilePage';
import { Home, PlusCircle, UserCircle } from 'lucide-react';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from './firebase';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('LOCKED');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'HOME' | 'PROFILE'>('HOME');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);

  useEffect(() => {
    if (store.isVerified()) {
      const savedProfile = store.getUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
        setAppState('READY');
      } else {
        setAppState('SETUP');
      }
    }
  }, []);

  useEffect(() => {
    if (appState === 'READY') {
      console.log("Starting Firebase sync...");
      const q = query(collection(db, "activities"), orderBy("startTime", "asc"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data: Activity[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ ...doc.data(), id: doc.id } as Activity);
        });
        console.log(`Synced ${data.length} activities from Firebase`);
        setActivities(data);
      }, (error) => {
        console.error("Firebase Sync Error:", error);
        if (error.message.includes("index")) {
          alert("Firebaseの準備（インデックス作成）が必要です。コンソールのリンクをクリックして作成してください。");
        } else {
          alert("データの受信に失敗しました。Firebaseのセキュリティルールを確認してください。\n" + error.message);
        }
      });
      return () => unsubscribe();
    }
  }, [appState]);

  const handlePasscodeSuccess = () => {
    store.setVerified(true);
    setAppState('SETUP');
  };

  const handleProfileComplete = (newProfile: UserProfile) => {
    store.setUserProfile(newProfile);
    setProfile(newProfile);
    setAppState('READY');
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    store.setUserProfile(newProfile);
    setProfile(newProfile);
  };

  const handleAddActivity = async (activity: Activity) => {
    try {
      // 編集モード（editingActivityが存在する）か、新規作成かを明示的に判定
      if (editingActivity) {
        console.log("Updating existing activity:", editingActivity.id);
        const { id, ...data } = activity;
        await updateDoc(doc(db, "activities", editingActivity.id), data);
      } else {
        console.log("Adding new activity...");
        const { id, ...data } = activity;
        await addDoc(collection(db, "activities"), data);
      }
      setShowCheckIn(false);
      setEditingActivity(undefined);
    } catch (e: any) {
      console.error("Firebase Add/Update Error:", e);
      alert("データの保存に失敗しました。詳細:\n" + e.message);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      if (confirm('この予定を削除しますか？')) {
        await deleteDoc(doc(db, "activities", id));
      }
    } catch (e: any) {
      console.error("Delete Error:", e);
      alert("削除に失敗しました: " + e.message);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowCheckIn(true);
  };

  const handleLogout = () => {
    if (confirm('ログアウトしますか？プロフィール情報が消去されます。')) {
      store.clearAll();
      window.location.reload();
    }
  };

  const handleOpenCheckIn = () => {
    setEditingActivity(undefined);
    setShowCheckIn(true);
  };

  if (appState === 'LOCKED') return <PasscodeGate onSuccess={handlePasscodeSuccess} />;
  if (appState === 'SETUP') return <ProfileSetup onComplete={handleProfileComplete} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] max-w-lg mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-5 flex flex-col items-center border-b border-gray-100">
        <h1 className="text-xl font-black text-pink-500 tracking-tighter uppercase">The Tamarind Connect</h1>
        {profile && (
          <div className="mt-2 text-[9px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">
            Unit {profile.roomNumber}
          </div>
        )}
      </header>

      <main className="flex-grow">
        {activeTab === 'HOME' && (
          <Timeline 
            activities={activities} 
            profile={profile}
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
          />
        )}
        {activeTab === 'PROFILE' && profile && (
          <ProfilePage 
            profile={profile} 
            activities={activities} 
            onLogout={handleLogout} 
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {showCheckIn && profile && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCheckIn(false)} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <CheckInForm
              profile={profile}
              initialActivity={editingActivity}
              onSubmit={handleAddActivity}
              onCancel={() => setShowCheckIn(false)}
            />
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-4">
          <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center gap-1 w-1/3 ${activeTab === 'HOME' ? 'text-pink-400' : 'text-gray-300'}`}>
            <Home size={24} />
            <span className="text-[10px] font-black uppercase">Home</span>
          </button>
          
          <button onClick={handleOpenCheckIn} className="flex flex-col items-center justify-center -translate-y-8 w-1/3">
            <div className="w-16 h-16 bg-pink-400 rounded-[28px] flex items-center justify-center text-white shadow-2xl border-4 border-white">
              <PlusCircle size={32} />
            </div>
          </button>

          <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center gap-1 w-1/3 ${activeTab === 'PROFILE' ? 'text-pink-400' : 'text-gray-300'}`}>
            <UserCircle size={24} />
            <span className="text-[10px] font-black uppercase">Profile</span>
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default App;
