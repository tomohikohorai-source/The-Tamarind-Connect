
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, UserProfile, Activity, MarketItem, Skill, WantedItem, AppTab, MarketComment, SkillComment, WantedComment } from './types';
import { Language, translations } from './translations';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { ProfilePage } from './components/ProfilePage';
import { PasscodeGate } from './components/PasscodeGate';
import { MarketPlace } from './components/MarketPlace';
import { MarketItemForm } from './components/MarketItemForm';
import { SkillExchange } from './components/SkillExchange';
import { SkillForm } from './components/SkillForm';
import { WantedList } from './components/WantedList';
import { WantedItemForm } from './components/WantedItemForm';
import { store } from './services/store';
import { DEMO_PASSCODE, TAMARIND_CONDO } from './constants';
import { SAMPLE_MARKET_ITEMS, SAMPLE_SKILLS, SAMPLE_WANTED_ITEMS } from './services/sampleData';
import { PlusCircle, UserCircle, RefreshCw, ShoppingBag, LogOut, BookOpen, Heart, Share2, ExternalLink, MessageCircle, Send } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { 
  db, auth, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, getDoc, onAuthStateChanged, signOut, arrayUnion, arrayRemove, where, setDoc
} from './firebase';

export const App: React.FC = () => {
  const [isVerified, setIsVerified] = useState(store.isVerified());
  const [appState, setAppState] = useState<AppState>('AUTH');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<AppTab>('MARKET');
  const [tabResetToggle, setTabResetToggle] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('app_language') as Language) || 'en');
  const t = translations[language];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };
  
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);
  
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [editingMarketItem, setEditingMarketItem] = useState<MarketItem | undefined>(undefined);
  const [targetMarketId, setTargetMarketId] = useState<string | null>(null);

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>(undefined);
  const [targetSkillId, setTargetSkillId] = useState<string | null>(null);

  const [showWantedForm, setShowWantedForm] = useState(false);
  const [editingWantedItem, setEditingWantedItem] = useState<WantedItem | undefined>(undefined);
  const [targetWantedId, setTargetWantedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [wantedLoading, setWantedLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(() => localStorage.getItem('app_admin_mode') === 'true');

  const condoCode = store.getPasscode() || profile?.condoCode || '';
  const isTestAdmin = profile?.customUserId === 'testtest';
  const effectiveCondoCode = (isTestAdmin && isAdminMode) ? DEMO_PASSCODE : condoCode;

  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, string>>(() => store.getAcknowledgedActivities());
  const [acknowledgedMarketMap, setAcknowledgedMarketMap] = useState<Record<string, string>>(() => store.getAcknowledgedMarket());
  const [acknowledgedSkillMap, setAcknowledgedSkillMap] = useState<Record<string, string>>(() => store.getAcknowledgedSkills());
  const [acknowledgedWantedMap, setAcknowledgedWantedMap] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('play_share_seen_wanted') || '{}'));

  const [showShareMenu, setShowShareMenu] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
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
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

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

  // Migration: Set condoId for all users to "The Tamarind"
  useEffect(() => {
    const migrateUser = async () => {
      // Ensure the condo master data exists
      try {
        await setDoc(doc(db, "condos", TAMARIND_CONDO.id), TAMARIND_CONDO, { merge: true });
      } catch (e) {
        console.error("Condo master data error:", e);
      }

      if (profile && !profile.condoId) {
        try {
          await updateDoc(doc(db, "users", profile.uid), { condoId: TAMARIND_CONDO.id });
          setProfile(prev => prev ? { ...prev, condoId: TAMARIND_CONDO.id } : null);
        } catch (e) {
          console.error("Migration error:", e);
        }
      }
    };
    migrateUser();
  }, [profile]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#profile') setActiveTab('PROFILE');
      else if (hash === '#market' || hash === '') setActiveTab('MARKET');
      else if (hash === '#wanted') setActiveTab('WANTED');
      else if (hash === '#skills') setActiveTab('SKILLS');
      else if (hash === '#home' || hash === '#play') setActiveTab('PLAY');
      
      if (hash === '#checkin') setShowCheckIn(true);
      else if (hash === '#sell') setShowMarketForm(true);
      else if (hash === '#post-skill') setShowSkillForm(true);
      else if (hash === '#post-wanted') setShowWantedForm(true);
      else { 
        setShowCheckIn(false); 
        setEditingActivity(undefined);
        setShowMarketForm(false);
        setEditingMarketItem(undefined);
        setShowSkillForm(false);
        setEditingSkill(undefined);
        setShowWantedForm(false);
        setEditingWantedItem(undefined);
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
          
          // Migration: Add condoCode if missing
          if (!userData.condoCode) {
            const currentPasscode = store.getPasscode();
            if (currentPasscode) {
              userData.condoCode = currentPasscode;
              try { await updateDoc(doc(db, "users", user.uid), { condoCode: currentPasscode }); } catch (e) { console.error(e); }
            }
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
    if (appState === 'READY' && profile) {
      const qAct = query(
        collection(db, "activities")
      );
      const unsubAct = onSnapshot(qAct, (snapshot) => {
        setIsLive(true);
        const data: Activity[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as Activity));
        
        const filtered = effectiveCondoCode === DEMO_PASSCODE 
          ? data.filter(item => item.condoCode === DEMO_PASSCODE)
          : data.filter(item => item.condoCode !== DEMO_PASSCODE);

        filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setActivities(filtered);
      }, (error) => { setIsLive(false); });

      const qMarket = query(
        collection(db, "marketItems")
      );
      const unsubMarket = onSnapshot(qMarket, (snapshot) => {
        const data: MarketItem[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as MarketItem));
        
        const filtered = effectiveCondoCode === DEMO_PASSCODE 
          ? data.filter(item => item.condoCode === DEMO_PASSCODE)
          : data.filter(item => item.condoCode !== DEMO_PASSCODE);

        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (effectiveCondoCode === DEMO_PASSCODE) {
          const combined = [...SAMPLE_MARKET_ITEMS, ...filtered];
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMarketItems(combined);
        } else {
          setMarketItems(filtered);
        }
        setMarketLoading(false);
      }, (error) => {
        console.error("Market snapshot error:", error);
        setMarketLoading(false);
      });

      const qSkills = query(
        collection(db, "skills")
      );
      const unsubSkills = onSnapshot(qSkills, (snapshot) => {
        const data: Skill[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as Skill));
        
        const filtered = effectiveCondoCode === DEMO_PASSCODE 
          ? data.filter(item => item.condoCode === DEMO_PASSCODE)
          : data.filter(item => item.condoCode !== DEMO_PASSCODE);

        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (effectiveCondoCode === DEMO_PASSCODE) {
          const combined = [...SAMPLE_SKILLS, ...filtered];
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSkills(combined);
        } else {
          setSkills(filtered);
        }
        setSkillsLoading(false);
      }, (error) => {
        console.error("Skills snapshot error:", error);
        setSkillsLoading(false);
      });

      const qWanted = query(
        collection(db, "wantedItems")
      );
      const unsubWanted = onSnapshot(qWanted, (snapshot) => {
        const data: WantedItem[] = [];
        snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as WantedItem));
        
        const filtered = effectiveCondoCode === DEMO_PASSCODE 
          ? data.filter(item => item.condoCode === DEMO_PASSCODE)
          : data.filter(item => item.condoCode !== DEMO_PASSCODE);

        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (effectiveCondoCode === DEMO_PASSCODE) {
          const combined = [...SAMPLE_WANTED_ITEMS, ...filtered];
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setWantedItems(combined);
        } else {
          setWantedItems(filtered);
        }
        setWantedLoading(false);
      }, (error) => {
        console.error("Wanted snapshot error:", error);
        setWantedLoading(false);
      });

      return () => { unsubAct(); unsubMarket(); unsubSkills(); unsubWanted(); setIsLive(false); };
    }
  }, [appState, profile, isAdminMode, effectiveCondoCode]);

  // One-time cleanup script for specific items as requested
  useEffect(() => {
    const performCleanup = async () => {
      const titlesToDelete = ["Swimming Fins", "Swimming Kickboard 900"];
      for (const item of marketItems) {
        if (titlesToDelete.includes(item.title) && profile && item.userId === profile.uid) {
           try {
             await deleteDoc(doc(db, "marketItems", item.id));
           } catch (e) {
             console.error("Cleanup deletion failed:", e);
           }
        }
      }
    };
    if (appState === 'READY' && marketItems.length > 0 && profile) {
      performCleanup();
    }
  }, [appState, marketItems, profile?.uid]);

  const unseenCount = useMemo(() => {
    if (!profile) return 0;
    return activities.filter(a => {
      if (a.userId === profile.uid) return false;
      const lastSeenUpdate = acknowledgedMap[a.id];
      return !lastSeenUpdate || lastSeenUpdate !== (a.lastUpdated || 'initial');
    }).length;
  }, [activities, acknowledgedMap, profile]);

  const hasInitializedSeenMaps = useRef(false);

  useEffect(() => {
    if (appState === 'READY' && profile && !hasInitializedSeenMaps.current && 
        !marketLoading && !skillsLoading && !wantedLoading) {
      
      const newMarketMapping = { ...acknowledgedMarketMap };
      marketItems.forEach(item => { 
        if (!newMarketMapping[item.id]) {
          newMarketMapping[item.id] = item.lastUpdated || 'initial'; 
        }
      });
      setAcknowledgedMarketMap(newMarketMapping);
      store.setAcknowledgedMarket(newMarketMapping);

      const newSkillMapping = { ...acknowledgedSkillMap };
      skills.forEach(skill => { 
        if (!newSkillMapping[skill.id]) {
          newSkillMapping[skill.id] = skill.lastUpdated || 'initial'; 
        }
      });
      setAcknowledgedSkillMap(newSkillMapping);
      store.setAcknowledgedSkills(newSkillMapping);

      const newWantedMapping = { ...acknowledgedWantedMap };
      wantedItems.forEach(w => { 
        if (!newWantedMapping[w.id]) {
          newWantedMapping[w.id] = w.lastUpdated || 'initial'; 
        }
      });
      setAcknowledgedWantedMap(newWantedMapping);
      localStorage.setItem('play_share_seen_wanted', JSON.stringify(newWantedMapping));

      hasInitializedSeenMaps.current = true;
    }
  }, [appState, profile, marketLoading, skillsLoading, wantedLoading, marketItems, skills, wantedItems]);

  const profileActionsCount = useMemo(() => {
    if (!profile) return 0;
    
    const dismissedIds: string[] = JSON.parse(localStorage.getItem('play_share_dismissed_notifs') || '[]');

    const marketNotifications = marketItems.filter(item => {
      const isOwner = item.userId === profile.uid;
      const isBuyer = item.buyerId === profile.uid;
      const hasParticipated = item.comments.some(c => c.userId === profile.uid);
      const lastCommentFromOthers = item.comments.length > 0 && item.comments[item.comments.length - 1].userId !== profile.uid;
      const isInvolved = isOwner || isBuyer || hasParticipated;

      if (isOwner && item.requestStatus === 'PENDING' && !dismissedIds.includes(`${item.id}-req`)) return true;
      if (isOwner && item.status === 'RESERVED' && item.buyerConfirmedCompletion && !item.sellerConfirmedCompletion && !dismissedIds.includes(`${item.id}-conf`)) return true;
      if (isBuyer && item.status === 'RESERVED' && !item.buyerConfirmedCompletion && !dismissedIds.includes(`${item.id}-appr`)) return true;
      if (isInvolved && lastCommentFromOthers && !dismissedIds.includes(`${item.id}-cmt`)) return true;

      const lastSeenUpdate = acknowledgedMarketMap[item.id];
      const isUnseenInformation = lastSeenUpdate !== (item.lastUpdated || 'initial');
      if (isUnseenInformation && isInvolved && !dismissedIds.some(id => id.startsWith(item.id))) return true;

      return false;
    }).length;

    const skillNotifications = skills.filter(skill => {
      const isOwner = skill.userId === profile.uid;
      const isRequester = skill.requesterId === profile.uid;
      const hasParticipated = skill.comments.some(c => c.userId === profile.uid);
      const lastCommentFromOthers = skill.comments.length > 0 && skill.comments[skill.comments.length - 1].userId !== profile.uid;
      const isCmtDismissed = dismissedIds.includes(`${skill.id}-cmt`);
      const isInvolved = isOwner || isRequester || hasParticipated;

      if (isOwner && skill.requestStatus === 'PENDING' && !dismissedIds.includes(`${skill.id}-req`)) return true;
      if (isRequester && skill.status === 'RESERVED' && !dismissedIds.includes(`${skill.id}-appr`)) return true;
      if (isInvolved && lastCommentFromOthers && !isCmtDismissed) return true;

      const lastSeenUpdate = acknowledgedSkillMap[skill.id];
      if (lastSeenUpdate !== (skill.lastUpdated || 'initial') && isInvolved && !isCmtDismissed) return true;

      return false;
    }).length;

    const wantedNotifications = wantedItems.filter(wanted => {
      const isOwner = wanted.userId === profile.uid;
      const hasParticipated = wanted.comments.some(c => c.userId === profile.uid);
      const lastCommentFromOthers = wanted.comments.length > 0 && wanted.comments[wanted.comments.length - 1].userId !== profile.uid;
      const isInvolved = isOwner || hasParticipated;
      
      if (isInvolved && lastCommentFromOthers && !dismissedIds.includes(`${wanted.id}-cmt`)) return true;
      
      const lastSeenUpdate = acknowledgedWantedMap[wanted.id];
      if (lastSeenUpdate !== (wanted.lastUpdated || 'initial') && isInvolved && !dismissedIds.some(id => id.startsWith(wanted.id))) return true;

      return false;
    }).length;

    return marketNotifications + skillNotifications + wantedNotifications;
  }, [marketItems, skills, wantedItems, profile, acknowledgedMarketMap, acknowledgedSkillMap, acknowledgedWantedMap]);

  useEffect(() => {
    if (activeTab === 'PROFILE' && profile) {
      const newMarketMapping = { ...acknowledgedMarketMap };
      marketItems.forEach(item => { newMarketMapping[item.id] = item.lastUpdated || 'initial'; });
      setAcknowledgedMarketMap(newMarketMapping);
      store.setAcknowledgedMarket(newMarketMapping);

      const newSkillMapping = { ...acknowledgedSkillMap };
      skills.forEach(skill => { newSkillMapping[skill.id] = skill.lastUpdated || 'initial'; });
      setAcknowledgedSkillMap(newSkillMapping);
      store.setAcknowledgedSkills(newSkillMapping);

      const newWantedMapping = { ...acknowledgedWantedMap };
      wantedItems.forEach(w => { newWantedMapping[w.id] = w.lastUpdated || 'initial'; });
      setAcknowledgedWantedMap(newWantedMapping);
      localStorage.setItem('play_share_seen_wanted', JSON.stringify(newWantedMapping));
    }
    
    if (activeTab === 'PROFILE' && profile && profileActionsCount > 0) {
      // Logic for profile actions if needed
    }
  }, [activeTab, activities, marketItems, skills, wantedItems, profile]);

  const changeTab = (tab: AppTab) => {
    if (activeTab === tab) {
      setTabResetToggle(prev => !prev);
    }
    setActiveTab(tab);
    setTargetMarketId(null);
    setTargetSkillId(null);
    setTargetWantedId(null);
    setViewingProfile(null);
    setShowMarketForm(false);
    setShowSkillForm(false);
    setShowWantedForm(false);
    setEditingMarketItem(undefined);
    setEditingSkill(undefined);
    setEditingWantedItem(undefined);
    window.location.hash = tab.toLowerCase();
  };

  const handleActionClick = () => {
    if (activeTab === 'MARKET' || activeTab === 'PROFILE') {
      setShowMarketForm(true);
      window.location.hash = 'sell';
    } else if (activeTab === 'WANTED') {
      setShowWantedForm(true);
      window.location.hash = 'post-wanted';
    } else if (activeTab === 'SKILLS') {
      setShowSkillForm(true);
      window.location.hash = 'post-skill';
    } else {
      setShowCheckIn(true);
      window.location.hash = 'checkin';
    }
  };

  const closeModals = () => {
    setShowCheckIn(false);
    setShowMarketForm(false);
    setShowSkillForm(false);
    setShowWantedForm(false);
    setEditingActivity(undefined);
    setEditingMarketItem(undefined);
    setEditingSkill(undefined);
    setEditingWantedItem(undefined);
    window.location.hash = activeTab === 'PLAY' ? 'play' : activeTab.toLowerCase();
  };

  const handlePasscodeSuccess = (code: string) => { 
    store.setVerified(true); 
    store.setPasscode(code);
    setIsVerified(true); 
  };
  
  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile({ ...newProfile, totalLoginDays: 1, lastLoginDate: new Date().toISOString() });
    setAppState('READY'); 
  };

  const handleAddActivity = async (activity: Activity) => {
    if (!profile) return;
    try {
      if (editingActivity) {
        const { id, ...data } = activity;
        await updateDoc(doc(db, "activities", editingActivity.id), data);
      } else {
        const { id, ...data } = activity;
        await addDoc(collection(db, "activities"), {
          ...data,
          condoCode: effectiveCondoCode
        });
      }
      closeModals();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      try { await deleteDoc(doc(db, "activities", id)); } catch (e: any) { alert(e.message); }
    }
  };

  const handleMarketSubmit = async (item: MarketItem) => {
    if (!profile) return;
    try {
      if (editingMarketItem) {
        const { id, ...data } = item;
        await updateDoc(doc(db, "marketItems", editingMarketItem.id), data);
      } else {
        const { id, ...data } = item;
        await addDoc(collection(db, "marketItems"), {
          ...data,
          condoCode: effectiveCondoCode
        });
      }
      closeModals();
    } catch (e: any) { alert(e.message); }
  };

  const handleMarketDelete = async (id: string) => {
    try { 
      await deleteDoc(doc(db, "marketItems", id)); 
    } catch (e: any) { 
      alert("Failed to delete item: " + e.message); 
    }
  };

  const handleMarketStatusChange = async (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => {
    try {
      const now = new Date().toISOString();
      const updates: any = { 
        status, 
        lastUpdated: now,
        ...(extraFlags || {}) 
      };
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
      } else if (status === 'RESERVED' && (!extraFlags || Object.keys(extraFlags).length === 0)) {
        updates.requestStatus = 'NONE';
        updates.rejectionReason = '';
      }
      await updateDoc(doc(db, "marketItems", id), updates);
      
      // Immediate acknowledgment for the current user
      const nextMap = { ...acknowledgedMarketMap, [id]: now };
      setAcknowledgedMarketMap(nextMap);
      store.setAcknowledgedMarket(nextMap);
    } catch (e: any) { alert("Update failed: " + e.message); }
  };

  const handleMarketLike = async (itemId: string) => {
    if (!profile) return;
    const item = marketItems.find(i => i.id === itemId);
    if (!item) return;
    const isLiked = item.likes?.includes(profile.uid);
    try {
      await updateDoc(doc(db, "marketItems", itemId), {
        likes: isLiked ? arrayRemove(profile.uid) : arrayUnion(profile.uid)
      });
    } catch (e: any) { alert(e.message); }
  };

  const handleSkillLike = async (skillId: string) => {
    if (!profile) return;
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;
    const isLiked = skill.likes?.includes(profile.uid);
    try {
      await updateDoc(doc(db, "skills", skillId), {
        likes: isLiked ? arrayRemove(profile.uid) : arrayUnion(profile.uid)
      });
    } catch (e: any) { alert(e.message); }
  };

  const handleWantedLike = async (wantedId: string) => {
    if (!profile) return;
    const item = wantedItems.find(i => i.id === wantedId);
    if (!item) return;
    const isLiked = item.likes?.includes(profile.uid);
    try {
      await updateDoc(doc(db, "wantedItems", wantedId), {
        likes: isLiked ? arrayRemove(profile.uid) : arrayUnion(profile.uid)
      });
    } catch (e: any) { alert(e.message); }
  };

  const handleMarketComment = async (itemId: string, text: string) => {
    if (!profile) return;
    const now = new Date().toISOString();
    const comment: MarketComment = {
      id: crypto.randomUUID(),
      userId: profile.uid,
      userNickname: profile.parentNickname,
      userAvatar: profile.avatarIcon,
      text,
      createdAt: now
    };
    try {
      await updateDoc(doc(db, "marketItems", itemId), {
        comments: arrayUnion(comment),
        lastUpdated: now
      });
      // Immediate acknowledgment
      const nextMap = { ...acknowledgedMarketMap, [itemId]: now };
      setAcknowledgedMarketMap(nextMap);
      store.setAcknowledgedMarket(nextMap);
    } catch (e: any) { alert(e.message); }
  };

  const handleSkillSubmit = async (skill: Skill) => {
    if (!profile) return;
    try {
      if (editingSkill) {
        const { id, ...data } = skill;
        await updateDoc(doc(db, "skills", editingSkill.id), data);
      } else {
        const { id, ...data } = skill;
        await addDoc(collection(db, "skills"), {
          ...data,
          condoCode: effectiveCondoCode
        });
      }
      closeModals();
    } catch (e: any) { alert(e.message); }
  };

  const handleSkillDelete = async (id: string) => {
    try { await deleteDoc(doc(db, "skills", id)); } catch (e: any) { alert("Failed to delete post: " + e.message); }
  };

  const handleSkillStatusChange = async (id: string, status: Skill['status'], requesterId?: string, rejectionReason?: string) => {
    try {
      const updates: any = { 
        status, 
        lastUpdated: new Date().toISOString()
      };
      if (requesterId && profile) {
        updates.requesterId = requesterId;
        updates.requesterNickname = profile.parentNickname;
        updates.requesterAvatarIcon = profile.avatarIcon;
        updates.requestStatus = 'PENDING';
      } else if (rejectionReason) {
        updates.requesterId = ''; 
        updates.requesterNickname = '';
        updates.requesterAvatarIcon = '';
        updates.requestStatus = 'REJECTED';
        updates.status = 'AVAILABLE';
      } else if (status === 'RESERVED') {
        updates.requestStatus = 'NONE';
      }
      await updateDoc(doc(db, "skills", id), updates);
    } catch (e: any) { alert("Update failed: " + e.message); }
  };

  const handleSkillComment = async (skillId: string, text: string) => {
    if (!profile) return;
    const comment: SkillComment = {
      id: crypto.randomUUID(),
      userId: profile.uid,
      userNickname: profile.parentNickname,
      userAvatar: profile.avatarIcon,
      text,
      createdAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, "skills", skillId), {
        comments: arrayUnion(comment),
        lastUpdated: new Date().toISOString()
      });
    } catch (e: any) { alert(e.message); }
  };

  const handleWantedSubmit = async (wanted: WantedItem) => {
    if (!profile) return;
    try {
      if (editingWantedItem) {
        const { id, ...data } = wanted;
        await updateDoc(doc(db, "wantedItems", editingWantedItem.id), data);
      } else {
        const { id, ...data } = wanted;
        await addDoc(collection(db, "wantedItems"), {
          ...data,
          condoCode: effectiveCondoCode
        });
      }
      closeModals();
    } catch (e: any) { alert(e.message); }
  };

  const handleWantedComment = async (wantedId: string, text: string) => {
    if (!profile) return;
    const comment: WantedComment = {
      id: crypto.randomUUID(),
      userId: profile.uid,
      userNickname: profile.parentNickname,
      userAvatar: profile.avatarIcon,
      text,
      createdAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, "wantedItems", wantedId), {
        comments: arrayUnion(comment),
        lastUpdated: new Date().toISOString()
      });
    } catch (e: any) { alert(e.message); }
  };

  const handleWantedDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "wantedItems", id));
    } catch (e: any) {
      alert("Failed to delete item: " + e.message);
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

  const handleLogout = async () => { 
    if (confirm(t.logout)) { 
      try {
        await signOut(auth); 
        store.clearAll(); 
        window.location.reload(); 
      } catch (e: any) {
        alert("Logout failed: " + e.message);
      }
    } 
  };

  const handleShare = (platform: 'copy' | 'whatsapp' | 'line' | 'airdrop') => {
    const shareData = {
      title: 'Nearby Exchange',
      text: 'Join our community app for condominium residents!',
      url: window.location.origin,
    };

    const fullText = `${shareData.text} ${shareData.url}`;

    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(shareData.url);
        alert(t.copyLink);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'line':
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'airdrop':
        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else {
          alert('AirDrop is only available on supported devices via the system share menu.');
        }
        break;
    }
    setShowShareMenu(false);
  };

  if (!isVerified) return <PasscodeGate language={language} onSuccess={handlePasscodeSuccess} onLanguageChange={handleLanguageChange} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500 font-black uppercase tracking-widest text-xs animate-pulse">{t.loading}</div>;
  if (appState === 'AUTH') return <AuthScreen language={language} onLanguageChange={handleLanguageChange} />;
  if (appState === 'SETUP' && auth.currentUser) return <ProfileSetup language={language} onComplete={handleProfileComplete} />;

  const isMarket = activeTab === 'MARKET';
  const isWanted = activeTab === 'WANTED';
  const isSkills = activeTab === 'SKILLS';
  const isProfile = activeTab === 'PROFILE';
  
  const themeColor = isMarket ? 'text-teal-500' : isWanted ? 'text-amber-500' : isSkills ? 'text-indigo-500' : 'text-pink-500';
  const themeBg = (isMarket || isProfile) ? 'bg-teal-400' : isWanted ? 'bg-amber-400' : isSkills ? 'bg-indigo-400' : 'bg-pink-400';
  const themeShadow = (isMarket || isProfile) ? 'shadow-teal-100' : isWanted ? 'shadow-amber-100' : isSkills ? 'shadow-indigo-100' : 'shadow-pink-100';

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] max-w-lg mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden touch-none sm:touch-auto" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md p-5 flex flex-col items-center border-b border-gray-100">
        <div className="w-full flex justify-between items-center absolute px-5">
           <div className="flex items-center gap-3">
             <button onClick={handleManualRefresh} className="flex items-center gap-2 group active:scale-95 transition-all">
               <div className={`w-2 h-2 rounded-full ${isLive && isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
               <RefreshCw size={12} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
             </button>
           </div>
           <button onClick={handleLogout} className="p-2.5 text-gray-300 hover:text-red-400 active:scale-90 transition-all">
             <LogOut size={20} />
           </button>
        </div>
        <div className="flex flex-col items-center">
          <h1 className={`text-xl font-black ${themeColor} tracking-tighter uppercase text-center transition-colors duration-500`}>{t.appName}</h1>
          <div className="flex gap-2 mt-1">
            <button 
              onClick={() => setShowShareMenu(true)} 
              className="flex items-center gap-1.5 bg-pink-500 text-white px-3 py-1 rounded-full shadow-lg shadow-pink-100 active:scale-90 transition-all hover:bg-pink-600 z-10"
            >
              <Share2 size={12} className="animate-bounce" />
              <span className="text-[9px] font-black uppercase tracking-tight">{t.shareApp}</span>
            </button>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="flex-grow overflow-y-auto touch-pan-y hide-scrollbar" style={{ transform: `translateY(${pullDistance}px)` }}>
        {activeTab === 'MARKET' && profile && (
          <MarketPlace 
            items={marketItems} 
            profile={profile} 
            language={language} 
            loading={marketLoading}
            initialActiveItemId={targetMarketId} 
            tabResetToggle={tabResetToggle}
            onEdit={(item) => { setEditingMarketItem(item); setShowMarketForm(true); }} 
            onStatusChange={handleMarketStatusChange} 
            onDelete={handleMarketDelete} 
            onAddComment={handleMarketComment} 
            onLike={handleMarketLike}
            onViewProfile={handleViewProfile} 
            onChatClose={() => setTargetMarketId(null)} 
          />
        )}
        {activeTab === 'WANTED' && profile && (
          <WantedList 
            items={wantedItems} 
            profile={profile} 
            language={language} 
            loading={wantedLoading}
            initialActiveItemId={targetWantedId} 
            tabResetToggle={tabResetToggle}
            onEdit={(item) => { setEditingWantedItem(item); setShowWantedForm(true); }} 
            onDelete={handleWantedDelete} 
            onAddComment={handleWantedComment} 
            onLike={handleWantedLike}
            onViewProfile={handleViewProfile} 
            onChatClose={() => setTargetWantedId(null)} 
          />
        )}
        {activeTab === 'SKILLS' && profile && (
          <SkillExchange 
            skills={skills} 
            profile={profile} 
            language={language} 
            loading={skillsLoading}
            initialActiveSkillId={targetSkillId} 
            tabResetToggle={tabResetToggle}
            onEdit={(skill) => { setEditingSkill(skill); setShowSkillForm(true); }} 
            onDelete={handleSkillDelete} 
            onStatusChange={handleSkillStatusChange} 
            onAddComment={handleSkillComment} 
            onLike={handleSkillLike}
            onViewProfile={handleViewProfile} 
            onChatClose={() => setTargetSkillId(null)} 
          />
        )}
        {activeTab === 'PROFILE' && profile && (
          <ProfilePage 
            profile={profile} 
            currentUser={profile} 
            marketItems={marketItems} 
            skills={skills} 
            wantedItems={wantedItems} 
            tabResetToggle={tabResetToggle}
            onLogout={handleLogout} 
            onUpdateProfile={setProfile} 
            onEditMarket={(item) => { setEditingMarketItem(item); setShowMarketForm(true); }} 
            onDeleteMarket={handleMarketDelete} 
            onMarketStatusChange={handleMarketStatusChange} 
            onAddMarket={() => setShowMarketForm(true)} 
            onAddSkill={() => setShowSkillForm(true)} 
            onEditSkill={(skill) => { setEditingSkill(skill); setShowSkillForm(true); }} 
            onDeleteSkill={handleSkillDelete} 
            onAddMarketComment={handleMarketComment} 
            onGoToTransaction={(id) => { setTargetMarketId(id); setActiveTab('MARKET'); }} 
            onGoToSkill={(id) => { setTargetSkillId(id); setActiveTab('SKILLS'); }} 
            onGoToWanted={(id) => { setTargetWantedId(id); setActiveTab('WANTED'); }}
            acknowledgedMarketMap={acknowledgedMarketMap}
            acknowledgedSkillMap={acknowledgedSkillMap}
            acknowledgedWantedMap={acknowledgedWantedMap}
            language={language}
            isAdminMode={isAdminMode}
            onToggleAdminMode={(val) => {
              setIsAdminMode(val);
              localStorage.setItem('app_admin_mode', String(val));
            }}
          />
        )}
      </main>

      {viewingProfile && profile && (
        <ProfilePage 
          profile={viewingProfile} 
          currentUser={profile} 
          marketItems={marketItems}
          skills={skills}
          wantedItems={wantedItems}
          onLogout={() => {}} 
          onUpdateProfile={() => {}} 
          onEditMarket={() => {}} 
          onDeleteMarket={() => {}} 
          onMarketStatusChange={() => {}} 
          onAddMarket={() => {}} 
          onAddSkill={() => {}}
          onEditSkill={() => {}}
          onDeleteSkill={() => {}}
          onAddMarketComment={() => {}} 
          onGoToTransaction={(id) => { setTargetMarketId(id); setViewingProfile(null); setActiveTab('MARKET'); }} 
          onGoToSkill={(id) => { setTargetSkillId(id); setViewingProfile(null); setActiveTab('SKILLS'); }} 
          onGoToWanted={(id) => { setTargetWantedId(id); setViewingProfile(null); setActiveTab('WANTED'); }}
          onClose={() => setViewingProfile(null)} 
          language={language}
          isAdminMode={isAdminMode}
          onToggleAdminMode={(val) => {
            setIsAdminMode(val);
            localStorage.setItem('app_admin_mode', String(val));
          }}
        />
      )}

      {(showMarketForm || editingMarketItem) && profile && (
        <div className="fixed inset-0 z-[500] flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModals} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <MarketItemForm profile={profile} language={language} initialItem={editingMarketItem} onSubmit={handleMarketSubmit} onCancel={closeModals} />
          </div>
        </div>
      )}

      {(showSkillForm || editingSkill) && profile && (
        <div className="fixed inset-0 z-[500] flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModals} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <SkillForm profile={profile} language={language} initialSkill={editingSkill} onSubmit={handleSkillSubmit} onCancel={closeModals} />
          </div>
        </div>
      )}

      {(showWantedForm || editingWantedItem) && profile && (
        <div className="fixed inset-0 z-[500] flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModals} />
          <div className="w-full max-w-lg mx-auto relative z-10 animate-slide-up">
            <WantedItemForm profile={profile} language={language} initialItem={editingWantedItem} onSubmit={handleWantedSubmit} onCancel={closeModals} />
          </div>
        </div>
      )}

      {showShareMenu && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl border-4 border-pink-400 animate-slide-up">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mx-auto border-4 border-white shadow-lg mb-2">
                  <Share2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{t.spreadWord}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.inviteNeighbors}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleShare('copy')} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group active:scale-95">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"><ExternalLink size={20} className="text-gray-400" /></div>
                  <span className="font-black text-gray-700 uppercase text-xs tracking-widest">{t.copyLink}</span>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-all group active:scale-95">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"><MessageCircle size={20} className="text-green-500" /></div>
                  <span className="font-black text-green-700 uppercase text-xs tracking-widest">{t.whatsapp}</span>
                </button>
                <button onClick={() => handleShare('line')} className="flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all group active:scale-95">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"><Send size={20} className="text-emerald-500" /></div>
                  <span className="font-black text-emerald-700 uppercase text-xs tracking-widest">{t.line}</span>
                </button>
                <button onClick={() => handleShare('airdrop')} className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all group active:scale-95">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"><RefreshCw size={20} className="text-blue-500" /></div>
                  <span className="font-black text-blue-700 uppercase text-xs tracking-widest">{t.airdrop}</span>
                </button>
              </div>
              
              <button onClick={() => setShowShareMenu(false)} className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">{t.close}</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40">
        <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-1 relative">
          <button onClick={() => changeTab('MARKET')} className={`flex flex-col items-center gap-1 flex-1 relative transition-all ${activeTab === 'MARKET' ? 'text-teal-400' : 'text-gray-300'}`}>
            <ShoppingBag size={20} /><span className="text-[7px] font-black uppercase tracking-wider">{t.market}</span>
          </button>
          <button onClick={() => changeTab('WANTED')} className={`flex flex-col items-center gap-1 flex-1 relative transition-all ${activeTab === 'WANTED' ? 'text-amber-400' : 'text-gray-300'}`}>
            <Heart size={20} /><span className="text-[7px] font-black uppercase tracking-wider">{t.wanted}</span>
          </button>
          
          <button onClick={handleActionClick} className={`flex flex-col items-center justify-center ${themeBg} text-white w-14 h-14 rounded-[22px] font-black shadow-xl ${themeShadow} border-4 border-white -translate-y-6 active:scale-95 transition-all flex-shrink-0 mx-1`}>
            <PlusCircle size={24} />
            <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5 leading-none">{t.postListing}</span>
          </button>

          <button onClick={() => changeTab('SKILLS')} className={`flex flex-col items-center gap-1 flex-1 relative transition-all ${activeTab === 'SKILLS' ? 'text-indigo-400' : 'text-gray-300'}`}>
            <BookOpen size={20} /><span className="text-[7px] font-black uppercase tracking-wider">{t.skills}</span>
          </button>

          <button onClick={() => changeTab('PROFILE')} className={`flex flex-col items-center gap-1 flex-1 relative transition-all ${activeTab === 'PROFILE' ? 'text-pink-400' : 'text-gray-300'}`}>
            <UserCircle size={20} /><span className="text-[7px] font-black uppercase tracking-wider">{t.profile}</span>
            {(activeTab !== 'PROFILE' && profileActionsCount > 0) && <span className="absolute top-1/2 left-1/2 -translate-x-[-10px] -translate-y-[-10px] w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[7px] text-white font-black">{profileActionsCount}</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};
