
import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { Skill, UserProfile, SkillComment, MarketItem, WantedItem } from '../types';
import { Language, translations } from '../translations';
import { SKILL_CATEGORIES, SKILL_ICONS, getCondoName } from '../constants';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, User, MessageCircle, Send, Plus, X, ArrowUpDown, Lock, BookOpen, Star, Info, MessageSquare, AlertTriangle, ExternalLink, Flame, Sparkles, Handshake, Clock, CheckCircle, Heart, Share2, Edit2, Trash2, MapPin } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { calculateUserStats, getBadgeLevel, getBadgeColor } from '../services/badgeService';

interface Props {
  skills: Skill[];
  marketItems: MarketItem[];
  wantedItems: WantedItem[];
  profile: UserProfile | null;
  initialActiveSkillId?: string | null;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Skill['status'], requesterId?: string, rejectionReason?: string, extraUpdates?: any) => void;
  onAddComment: (skillId: string, text: string) => void;
  onLike: (skillId: string) => void;
  onViewProfile?: (userId: string) => void;
  onChatClose?: () => void;
  onViewItem?: (id: string | null) => void;
  language?: Language;
  loading?: boolean;
  tabResetToggle?: boolean;
  ensureAuth?: (action: () => void) => void;
  condos?: { id: string, name: string }[];
}

const SkillStatusBanner = memo(({ skill, profile, t }: { skill: Skill, profile: UserProfile | null, t: any }) => {
  if (!profile) return null;
  const isOwner = skill.userId === profile.uid;
  const isRequester = skill.requesterId === profile.uid;

  if (skill.status === 'AVAILABLE' && skill.requestStatus === 'PENDING') {
    if (isOwner) return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 animate-pulse border-2 border-white shadow-xl">
        <div className="bg-white/20 p-2 rounded-xl text-2xl flex items-center justify-center">{skill.requesterAvatarIcon || <AlertTriangle size={24} />}</div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.requestFrom}: {skill.requesterNickname}</div>
          <div className="text-[13px] font-bold leading-tight">{t.exchangeRequestMsg}</div>
        </div>
      </div>
    );
    if (isRequester) return (
      <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
        <div className="bg-white/20 p-2 rounded-xl"><Clock size={24} /></div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.applicationSent}</div>
          <div className="text-[13px] font-bold leading-tight">{t.waitingApproval}</div>
        </div>
      </div>
    );
  }

  if (skill.status === 'RESERVED') {
    if (isOwner) return (
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
        <div className="bg-white/20 p-2 rounded-xl text-2xl flex items-center justify-center">{skill.requesterAvatarIcon || <Handshake size={24} />}</div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.partner}: {skill.requesterNickname}</div>
          <div className="text-[13px] font-bold leading-tight">{t.sessionReservedMsg}</div>
        </div>
      </div>
    );
    if (isRequester) return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
        <div className="bg-white/20 p-2 rounded-xl text-2xl flex items-center justify-center">{skill.parentAvatarIcon || <CheckCircle size={24} />}</div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.partner}: {skill.parentNickname}</div>
          <div className="text-[13px] font-bold leading-tight">{t.requestApprovedMsg}</div>
        </div>
      </div>
    );
  }
  return null;
});

import { SkillSkeleton } from './Skeleton';

export const SkillExchange: React.FC<Props> = ({ skills, profile, initialActiveSkillId, onEdit, onDelete, onStatusChange, onAddComment, onLike, onViewProfile, onChatClose, onViewItem, language = 'en', loading = false, tabResetToggle, ensureAuth, condos = [] }) => {
  const t = translations[language];
  const [filterType, setFilterType] = useState<'ALL' | 'OFFER' | 'REQUEST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(t.allCategories);
  const [selectedCondoId, setSelectedCondoId] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const galleryRef = useRef<HTMLDivElement>(null);

  const scrollGallery = (direction: 'next' | 'prev') => {
    if (galleryRef.current) {
      const scrollAmount = galleryRef.current.clientWidth;
      galleryRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    setViewingSkill(null);
  }, [tabResetToggle]);

  useEffect(() => {
    if (initialActiveSkillId) {
      const skill = skills.find(s => s.id === initialActiveSkillId);
      if (skill) {
        // Access gate for private reserved/closed sessions
        if ((skill.status === 'RESERVED' || skill.status === 'CLOSED') && (!profile || (skill.userId !== profile.uid && skill.requesterId !== profile.uid))) {
           alert(t.privateSessionMsg);
           if (onChatClose) onChatClose();
           return;
        }
        setViewingSkill(skill);
      } else if (!loading && skills.length > 0) {
        alert(t.itemNotFound);
        if (onChatClose) onChatClose();
      }
    }
  }, [initialActiveSkillId, skills, profile?.uid, t.privateSessionMsg, t.itemNotFound, loading, onChatClose]);

  useEffect(() => {
    if (viewingSkill) {
      window.scrollTo(0, 0);
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 0);
    }
  }, [viewingSkill?.id]);

  useEffect(() => {
    if (viewingSkill) {
      const updated = skills.find(s => s.id === viewingSkill.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewingSkill)) {
        setViewingSkill(updated);
      }
    }
  }, [skills, viewingSkill?.id]);

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      if (filterType !== 'ALL' && skill.type !== filterType) return false;
      if (searchQuery && !skill.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== t.allCategories && skill.category !== selectedCategory) return false;
      if (selectedCondoId !== 'ALL' && skill.condoId !== selectedCondoId) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [skills, filterType, searchQuery, selectedCategory, t.allCategories]);

  const handleSendComment = (skillId: string) => {
    const text = commentInputs[skillId];
    if (!text?.trim()) return;
    onAddComment(skillId, text);
    setCommentInputs(prev => ({ ...prev, [skillId]: '' }));
  };

  const [confirmRequestSkill, setConfirmRequestSkill] = useState<Skill | null>(null);

  const handleConfirmRequest = () => {
    if (confirmRequestSkill && profile) {
      onStatusChange(confirmRequestSkill.id, 'AVAILABLE', profile.uid);
      setConfirmRequestSkill(null);
    }
  };

  const handleRequestCancellation = (skill: Skill) => {
    const isMine = profile && skill.userId === profile.uid;
    const msg = isMine ? t.cancelExchangeProvider : t.cancelExchangeRequester;
    if (confirm(msg)) {
      const updates = isMine ? { sellerRequestedCancellation: true } : { requesterRequestedCancellation: true };
      onStatusChange(skill.id, 'RESERVED', undefined, undefined, updates);
    }
  };

  const handleConfirmCancellation = (skill: Skill) => {
    if (confirm(t.confirmCancelStatus)) {
      onStatusChange(skill.id, 'AVAILABLE', undefined, undefined, { 
        requesterId: '', 
        requesterNickname: '', 
        requesterAvatarIcon: '', 
        requestStatus: 'NONE',
        requesterRequestedCancellation: false,
        sellerRequestedCancellation: false
      });
      setViewingSkill(null);
      if (onChatClose) onChatClose();
    }
  };

  const handleItemClick = (skill: Skill) => {
    if ((skill.status === 'RESERVED' || skill.status === 'CLOSED') && (!profile || (skill.userId !== profile.uid && skill.requesterId !== profile.uid))) {
      alert(t.accessRestrictedMsg);
      return;
    }
    setViewingSkill(skill);
    if (onViewItem) onViewItem(skill.id);
  };

  const handleShare = () => {
    if (!viewingSkill) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#skill?id=${viewingSkill.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: viewingSkill.title,
        text: viewingSkill.description,
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        alert(t.linkCopied);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(t.linkCopied);
    }
  };

  if (viewingSkill) {
    const isMine = profile && viewingSkill.userId === profile.uid;
    const isRequester = profile && viewingSkill.requesterId === profile.uid;

    const ownerStats = calculateUserStats(viewingSkill.userId, null, marketItems || [], skills, wantedItems || []);
    const badgeLevel = getBadgeLevel(ownerStats);
    const badgeColor = getBadgeColor(badgeLevel);

    return (
      <div className="animate-fade-in space-y-6 pb-32 px-4 pt-4">
        <div className="flex items-center justify-between">
           <div className="flex gap-2">
             <button 
               onClick={() => { setViewingSkill(null); if(onChatClose) onChatClose(); if(onViewItem) onViewItem(null); }} 
               className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
             >
               <ChevronLeft size={16} /> {t.skill}
             </button>
             <button 
               onClick={() => {
                 if (ensureAuth) {
                   ensureAuth(() => onLike(viewingSkill.id));
                 } else {
                   onLike(viewingSkill.id);
                 }
               }} 
               className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-2xl border shadow-sm active:scale-95 transition-all ${viewingSkill.likes?.includes(profile?.uid || '') ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-gray-400 border-gray-100'}`}
             >
               <Heart size={16} fill={viewingSkill.likes?.includes(profile?.uid || '') ? "currentColor" : "none"} />
               {viewingSkill.likes && viewingSkill.likes.length > 0 && <span>{viewingSkill.likes.length}</span>}
             </button>
             <button 
               onClick={handleShare} 
               className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
             >
               <Share2 size={16} /> {t.share}
             </button>
           </div>
           <button 
             onClick={() => onViewProfile && onViewProfile(viewingSkill.userId)} 
             className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-indigo-50 shadow-sm active:scale-90 transition-all shrink-0 relative"
           >
             <span className="text-xl leading-none">{viewingSkill.parentAvatarIcon}</span>
              {badgeLevel !== 'NONE' && (
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${badgeColor} flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-indigo-50`}>
                  <Star size={8} fill="currentColor" />
                </div>
              )}
             <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter max-w-[50px] truncate text-center leading-none">
               {viewingSkill.parentNickname}
             </span>
           </button>
        </div>

        <SkillStatusBanner skill={viewingSkill} profile={profile} t={t} />

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm relative">
          {viewingSkill.images && viewingSkill.images.length > 0 ? (
            <>
              <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                {viewingSkill.images.map((img, i) => (
                  <img key={i} src={img} className="w-full aspect-square object-cover snap-center shrink-0" alt={`View ${i}`} loading="lazy" referrerPolicy="no-referrer" />
                ))}
              </div>
              {viewingSkill.images.length > 1 && (
                <>
                  <button onClick={() => scrollGallery('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 z-10"><ChevronLeft size={20} /></button>
                  <button onClick={() => scrollGallery('next')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 z-10"><ChevronRight size={20} /></button>
                </>
              )}
            </>
          ) : (
            <div className={`aspect-square flex items-center justify-center text-6xl ${viewingSkill.type === 'OFFER' ? 'bg-indigo-50 text-indigo-100' : 'bg-orange-50 text-orange-100'}`}>
               {SKILL_ICONS[viewingSkill.category] || <BookOpen size={64} />}
            </div>
          )}
        </div>

        {viewingSkill.status === 'RESERVED' && (
          <div className="bg-white p-6 rounded-[32px] border-2 border-orange-50 shadow-lg mb-6 animate-fade-in">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest text-center">{t.exchangeManagement}</h4>
              {viewingSkill.requesterRequestedCancellation && viewingSkill.sellerRequestedCancellation ? (
                <button onClick={() => handleConfirmCancellation(viewingSkill)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">{t.finalizeCancellation}</button>
              ) : (
                <>
                  {isRequester && (
                    viewingSkill.requesterRequestedCancellation ? (
                      <div className="text-center py-3 bg-orange-50 rounded-2xl border border-orange-100">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{t.cancellationRequested}</p>
                      </div>
                    ) : (
                      <button onClick={() => handleRequestCancellation(viewingSkill)} className="w-full py-4 bg-white text-red-400 border border-red-100 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">
                        {viewingSkill.sellerRequestedCancellation ? t.agreeToCancel : t.requestCancellation}
                      </button>
                    )
                  )}
                  {isMine && (
                    viewingSkill.sellerRequestedCancellation ? (
                      <div className="text-center py-3 bg-orange-50 rounded-2xl border border-orange-100">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{t.cancellationRequested}</p>
                      </div>
                    ) : (
                      <button onClick={() => handleRequestCancellation(viewingSkill)} className="w-full py-4 bg-white text-red-400 border border-red-100 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">
                        {viewingSkill.requesterRequestedCancellation ? t.agreeToCancel : t.requestCancellation}
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-[32px] border-2 border-indigo-50 shadow-lg space-y-6 animate-slide-down">
          <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <MapPin size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.condominium}</span>
            </div>
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">{getCondoName(viewingSkill.condoId, viewingSkill.customCondoName)}</span>
          </div>

          {!isMine && viewingSkill.status === 'AVAILABLE' && viewingSkill.requestStatus !== 'PENDING' && (
            <button 
              onClick={() => {
                if (ensureAuth) {
                  ensureAuth(() => setConfirmRequestSkill(viewingSkill));
                } else {
                  setConfirmRequestSkill(viewingSkill);
                }
              }} 
              className="w-full py-5 bg-indigo-500 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-[14px] shadow-xl shadow-indigo-100 active:scale-[0.97] transition-all border-4 border-white block"
            >
              {t.requesting}
            </button>
          )}

          {isMine && viewingSkill.status === 'AVAILABLE' && viewingSkill.requestStatus === 'PENDING' && (
            <div className="space-y-4 p-5 bg-indigo-50/50 rounded-[32px] border-2 border-indigo-100 mb-4">
              <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest text-center">{t.inquiryReceived} {viewingSkill.requesterNickname}</p>
              <div className="flex gap-3">
                <button onClick={() => onStatusChange(viewingSkill.id, 'RESERVED')} className="flex-1 py-5 bg-indigo-500 text-white rounded-[28px] font-black uppercase text-[14px] tracking-widest shadow-xl active:scale-95 border-4 border-white transition-all">{t.confirm}</button>
                <button onClick={() => onStatusChange(viewingSkill.id, 'AVAILABLE', undefined, 'declined')} className="flex-1 py-5 bg-white text-gray-400 rounded-[28px] font-black uppercase text-[14px] tracking-widest border-2 border-gray-100 active:scale-95 transition-all">{t.cancel}</button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${viewingSkill.type === 'OFFER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {viewingSkill.type === 'OFFER' ? t.skillProvider : t.requestingHelp}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-tight">{viewingSkill.title}</h1>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                {SKILL_ICONS[viewingSkill.category]} {viewingSkill.category}
              </div>
            </div>

            <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-[28px] border border-indigo-100/50">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">{t.reward}</span>
                <span className="text-[18px] font-black text-indigo-600 leading-none">
                  {viewingSkill.price}
                </span>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.condominium}</div>
                <div className="text-[10px] font-black text-indigo-700 uppercase tracking-tight truncate max-w-[150px]">
                  {getCondoName(viewingSkill.condoId, viewingSkill.customCondoName)}
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{viewingSkill.description}</p>
          </div>
          
          {isMine && (
            <div className="flex flex-col gap-3 pt-2">
              {viewingSkill.status === 'AVAILABLE' && viewingSkill.requestStatus !== 'PENDING' && (
                <button onClick={() => onEdit(viewingSkill)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-[24px] font-black uppercase text-[11px] tracking-widest border border-gray-100 active:scale-95 shadow-sm flex items-center justify-center gap-2 transition-all">
                  <Edit2 size={16}/> {t.edit}
                </button>
              )}
              <button onClick={() => { if(confirm(t.deleteItem)) { onDelete(viewingSkill.id); setViewingSkill(null); } }} className="w-full py-3.5 bg-white text-red-300 rounded-[24px] font-black uppercase text-[10px] tracking-widest border border-red-50 active:scale-95 flex items-center justify-center gap-2 transition-all opacity-70 hover:opacity-100">
                <Trash2 size={14}/> {t.deleteListing}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><MessageSquare size={14}/></div>
            <div className="flex-grow">
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">
                {viewingSkill.status === 'RESERVED' ? t.privateDiscussion : t.interestAndChat}
              </h3>
              {isMine && viewingSkill.status === 'RESERVED' && (
                <p className="text-[8px] font-black text-indigo-500 uppercase mt-0.5">{t.partner}: {viewingSkill.requesterNickname}</p>
              )}
              {isRequester && viewingSkill.status === 'RESERVED' && (
                <p className="text-[8px] font-black text-indigo-500 uppercase mt-0.5">{t.partner}: {viewingSkill.parentNickname}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {viewingSkill.comments.map(c => {
              const isMe = profile && c.userId === profile.uid;
              return (
                <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{c.userAvatar}</div>
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter max-w-[44px] truncate text-center leading-tight">{c.userNickname}</span>
                  </div>
                  <div className={`p-4 rounded-[24px] text-[13px] shadow-sm max-w-[80%] ${isMe ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                    <div className={`text-[8px] font-black uppercase mb-1 opacity-80 ${isMe ? 'text-indigo-50 text-right' : 'text-indigo-500'}`}>
                      {c.userNickname} • {format(new Date(c.createdAt), 'HH:mm')}
                    </div>
                    <div className="font-bold leading-relaxed whitespace-pre-wrap">{c.text}</div>
                  </div>
                </div>
              );
            })}
            {viewingSkill.comments.length === 0 && (
              <div className="py-12 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[44px] tracking-[0.2em] bg-white/40">{t.noMessagesYet}</div>
            )}
          </div>

          <div className="pt-6">
             <div className="flex flex-col gap-2">
               <div className="flex gap-2 items-center bg-white p-2 rounded-[28px] border-2 border-indigo-50 focus-within:border-indigo-400 focus-within:ring-4 ring-indigo-50 transition-all shadow-sm">
                  <input 
                    type="text" 
                    value={commentInputs[viewingSkill.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [viewingSkill.id]: e.target.value }))}
                    placeholder={t.askDetailsPlaceholder}
                    className="flex-grow bg-transparent border-none px-4 py-3 text-sm font-bold outline-none placeholder:text-gray-300"
                    onKeyDown={e => e.key === 'Enter' && handleSendComment(viewingSkill.id)}
                  />
                  <button 
                    onClick={() => {
                      if (ensureAuth) {
                        ensureAuth(() => handleSendComment(viewingSkill.id));
                      } else {
                        handleSendComment(viewingSkill.id);
                      }
                    }} 
                    disabled={!(commentInputs[viewingSkill.id] || '').trim()}
                    className={`p-3 rounded-full shadow-lg active:scale-90 transition-all ${ (commentInputs[viewingSkill.id] || '').trim() ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 font-bold px-4 italic">{t.translationNotice}</p>
              </div>
          </div>
        </div>

        {confirmRequestSkill && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-indigo-400">
              <div className="text-center space-y-5">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto border-4 border-white shadow-lg"><Star size={40} /></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{t.expressInterest}</h3>
                <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-widest px-4">{t.contactNeighborAbout} "{confirmRequestSkill.title}"?</p>
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setConfirmRequestSkill(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest">{t.back}</button>
                  <button onClick={handleConfirmRequest} className="flex-1 py-5 bg-indigo-400 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">{t.send}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-32 space-y-4">
      <div className="space-y-3 sticky top-0 bg-[#fdfbf7] z-30 pt-2 pb-4">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-indigo-100 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-indigo-400 text-white border-indigo-400 shadow-lg' : 'bg-white text-gray-400 border-gray-100 shadow-sm'}`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-[32px] border border-indigo-50 shadow-xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{t.exchangeFilters}</h4>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory(t.allCategories); setSelectedCondoId('ALL'); setFilterType('ALL'); }} className="text-[9px] font-black text-indigo-500 uppercase">{t.resetAll}</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.condominium}</label>
              <select 
                value={selectedCondoId} 
                onChange={e => setSelectedCondoId(e.target.value)} 
                className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"
              >
                <option value="ALL">{t.anyCondo}</option>
                {condos.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.category}</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-[11px] font-black outline-none appearance-none">
                <option>{t.allCategories}</option>
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['ALL', 'OFFER', 'REQUEST'].map((f) => (
            <button key={f} onClick={() => setFilterType(f as any)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === f ? 'bg-indigo-400 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 shadow-sm'}`}>
              {f === 'ALL' ? t.all : f === 'OFFER' ? t.offer : t.request}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSkills.map((skill) => {
          const isNew = differenceInHours(new Date(), new Date(skill.createdAt)) <= 72;
          
          // Logic for Skill Discount (extract numeric part of price string)
          const getNum = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
          const currentVal = getNum(skill.price);
          const prevVal = skill.previousPrice ? getNum(skill.previousPrice) : 0;
          const isDiscounted = skill.priceUpdatedAt && 
                               prevVal > 0 && 
                               currentVal < prevVal && 
                               differenceInHours(new Date(), new Date(skill.priceUpdatedAt)) <= 72;

          const isClosed = skill.status === 'CLOSED';
          const canClick = !isClosed || (profile && (skill.userId === profile.uid || skill.requesterId === profile.uid));

          return (
            <button 
              key={skill.id} 
              onClick={() => handleItemClick(skill)} 
              disabled={!canClick}
              className={`bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm text-left animate-fade-in active:scale-[0.98] transition-all flex items-center gap-4 relative overflow-hidden group ${!canClick ? 'opacity-80 grayscale-[0.5]' : ''}`}
            >
              <div 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (ensureAuth) {
                    ensureAuth(() => onLike(skill.id));
                  } else {
                    onLike(skill.id);
                  }
                }}
                className={`absolute top-2 right-2 z-30 p-1.5 rounded-full backdrop-blur-md border transition-all flex items-center gap-1 cursor-pointer ${profile && skill.likes?.includes(profile.uid) ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/80 text-gray-400 border-white'}`}
              >
                <Heart size={10} fill={profile && skill.likes?.includes(profile.uid) ? "currentColor" : "none"} />
                {skill.likes && skill.likes.length > 0 && <span className="text-[8px] font-black">{skill.likes.length}</span>}
              </div>
              {isClosed && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                  <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-[0.2em] shadow-2xl border-4 border-white -rotate-12 animate-pulse">
                    {t.soldLabel}
                  </div>
                </div>
              )}
              <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center opacity-10 rotate-12 ${skill.type === 'OFFER' ? 'text-indigo-500' : 'text-orange-500'}`}>
                 <BookOpen size={48} fill="currentColor" />
              </div>
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden ${skill.type === 'OFFER' ? 'bg-indigo-50 border border-indigo-100' : 'bg-orange-50 border border-orange-100'}`}>
                 {skill.images && skill.images.length > 0 ? (
                   <img src={skill.images[0]} className="w-full h-full object-cover" alt={skill.title} referrerPolicy="no-referrer" />
                 ) : (
                   SKILL_ICONS[skill.category] || '🌟'
                 )}
              </div>
              
              <div className="flex-grow min-w-0 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${skill.type === 'OFFER' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                    {skill.type === 'OFFER' ? t.offer : t.wantedLabel}
                  </span>
                  {isNew && (
                    <span className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-0.5">
                      <Sparkles size={8}/> {t.new}
                    </span>
                  )}
                  {isDiscounted && (
                    <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-0.5">
                      <Flame size={8}/> {t.discount}
                    </span>
                  )}
                  {skill.status === 'RESERVED' && <span className="bg-indigo-400 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase">{t.reserved}</span>}
                </div>
                <h3 className="text-[15px] font-black text-gray-800 truncate tracking-tight">{skill.title}</h3>
                <div className="text-[10px] font-bold text-indigo-400 line-clamp-1">{skill.price} • {skill.category}</div>
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-0 group-hover:opacity-100 transition-all">
                <ChevronRight size={20} className="text-indigo-300" />
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          <SkillSkeleton />
        </div>
      ) : filteredSkills.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-gray-100 mb-4 flex justify-center"><Star size={64}/></div>
          <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{t.noSkillFound}</p>
        </div>
      )}
    </div>
  );
};
