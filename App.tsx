
import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, Activity } from './types';
import { store } from './services/store';
import { PasscodeGate } from './components/PasscodeGate';
import { ProfileSetup } from './components/ProfileSetup';
import { Timeline } from './components/Timeline';
import { CheckInForm } from './components/CheckInForm';
import { ProfilePage } from './components/ProfilePage';
import { Home, PlusCircle, UserCircle } from 'lucide-react';

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
    setActivities(store.getActivities());
  }, []);

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
    const oldRoom = profile?.roomNumber;
    setProfile(newProfile);
    setActivities(prev => prev.map(a => ({
      ...a,
      parentNickname: a.roomNumber === oldRoom ? newProfile.parentNickname : a.parentNickname,
      roomNumber: a.roomNumber === oldRoom ? newProfile.roomNumber : a.roomNumber,
      parentAvatarIcon: a.roomNumber === oldRoom ? newProfile.avatarIcon : a.parentAvatarIcon
    })));
  };

  const handleAddActivity = (activity: Activity) => {
    const exists = activities.some(a => a.id === activity.id);
    if (exists) {
      store.updateActivity(activity);
      setActivities(prev => prev.map(a => a.id === activity.id ? activity : a));
    } else {
      store.addActivity(activity);
      setActivities(prev => [...prev, activity]);
    }
    setShowCheckIn(false);
    setEditingActivity(undefined);
  };

  const handleDeleteActivity = (id: string) => {
    store.deleteActivity(id);
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowCheckIn(true);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out? Your profile data will be cleared from this device.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleOpenCheckIn = () => {
    setEditingActivity(undefined);
    setShowCheckIn(true);
  };

  if (appState === 'LOCKED') {
    return <PasscodeGate onSuccess={handlePasscodeSuccess} />;
  }

  if (appState === 'SETUP') {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] max-w-lg mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-5 flex flex-col items-center border-b border-gray-100">
        <h1 className="text-xl font-black text-pink-500 tracking-tighter uppercase">The Tamarind Connect</h1>
        {profile && (
          <div className="mt-2 text-[9px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">
            Unit {profile.roomNumber}
          </div>
        )}
      </header>

      {/* Main Content */}
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

      {/* Check-In Modal / Overlay */}
      {showCheckIn && profile && (
        <div className="fixed inset-0 z-50 flex items-end animate-in fade-in duration-300">
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-4">
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center gap-1 w-1/3 transition-all ${
              activeTab === 'HOME' ? 'text-pink-400' : 'text-gray-300'
            }`}
          >
            <Home size={24} className={activeTab === 'HOME' ? 'scale-110 transition-transform' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
          </button>
          
          <button
            onClick={handleOpenCheckIn}
            className="flex flex-col items-center justify-center -translate-y-8 w-1/3"
          >
            <div className="w-16 h-16 bg-pink-400 rounded-[28px] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border-4 border-white hover:bg-pink-500">
              <PlusCircle size={32} />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center gap-1 w-1/3 transition-all ${
              activeTab === 'PROFILE' ? 'text-pink-400' : 'text-gray-300'
            }`}
          >
            <UserCircle size={24} className={activeTab === 'PROFILE' ? 'scale-110 transition-transform' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </div>
      </nav>

      {/* Animation helpers */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default App;
