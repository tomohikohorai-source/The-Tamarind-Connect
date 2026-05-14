
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { MarketItem, Skill, WantedItem, UserProfile, WantedComment } from '@/types';
import { MARKET_GENRES, GENRE_ICONS, getCondoName } from '@/constants';
import { Heart, Search, SlidersHorizontal, ChevronLeft, ChevronRight, MessageCircle, Send, Sparkles, Flame, Image as ImageIcon, Edit2, Trash2, MapPin, Clock, Lock, ArrowUpDown, Coins, Info, Share2, Star } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { AffiliateBanner } from './AffiliateBanner';
import { calculateUserStats, getBadgeLevel, getBadgeColor } from '@/services/badgeService';
import { Language, translations } from '@/translations';
import { WantedSkeleton } from './Skeleton';

interface Props {
  items: WantedItem[];
  marketItems: MarketItem[];
  skills: Skill[];
  profile: UserProfile | null;
  language?: Language;
  loading?: boolean;
  initialActiveItemId?: string | null;
  onEdit: (item: WantedItem) => void;
  onDelete: (id: string) => void;
  onAddComment: (itemId: string, text: string) => void;
  onLike: (itemId: string) => void;
  onViewProfile?: (userId: string) => void;
  onChatClose?: () => void;
  onViewItem?: (id: string | null) => void;
  tabResetToggle?: boolean;
  ensureAuth?: (action: () => void) => void;
  condos?: { id: string, name: string }[];
}

const WantedItemCard = memo(({ item, onClick, profile, onLike, language = 'en' }: { item: WantedItem, onClick: () => void, profile: UserProfile | null, onLike: (e: React.MouseEvent) => void, language?: Language }) => {
  const t = translations[language];
  const isNew = differenceInHours(new Date(), new Date(item.createdAt)) <= 72;
  const isDiscounted = item.hopePriceUpdatedAt && 
                      item.previousHopePrice !== undefined && 
                      item.hopePrice > item.previousHopePrice && 
                      differenceInHours(new Date(), new Date(item.hopePriceUpdatedAt)) <= 72;
  const isLiked = profile ? item.likes?.includes(profile.uid) : false;

  return (
    <button onClick={onClick} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm text-left animate-fade-in active:scale-[0.98] transition-all flex flex-col relative group">
      <div className="relative aspect-square">
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-200">
            <Heart size={32} fill="currentColor" />
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <div className="bg-amber-400 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm">
            WANTED
          </div>
          {isNew && (
            <div className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm flex items-center gap-0.5">
              <Sparkles size={8} /> {t.new}
            </div>
          )}
          {isDiscounted && (
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm flex items-center gap-0.5 animate-pulse">
              <Flame size={8} /> {t.priceUp}
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 z-10">
          <div 
            onClick={onLike}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-all flex items-center gap-1 ${isLiked ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/80 text-gray-400 border-white'}`}
          >
            <Heart size={10} fill={isLiked ? "currentColor" : "none"} />
            {item.likes && item.likes.length > 0 && <span className="text-[8px] font-black">{item.likes.length}</span>}
          </div>
        </div>

        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm border border-amber-50">
          <span className="text-amber-600 font-black text-[10px]">Hope: RM{item.hopePrice}</span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-[11px] font-black text-gray-800 line-clamp-1 uppercase tracking-tight">{item.title}</h3>
      </div>
    </button>
  );
});

export const WantedList: React.FC<Props> = ({ items, marketItems, skills, profile, language = 'en', loading = false, initialActiveItemId, onEdit, onDelete, onAddComment, onLike, onViewProfile, onChatClose, onViewItem, tabResetToggle, condos = [] }) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>(t.allGenres);
  const [selectedCondoId, setSelectedCondoId] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [viewingItem, setViewingItem] = useState<WantedItem | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewingItem(null);
  }, [tabResetToggle]);

  useEffect(() => {
    if (initialActiveItemId) {
      const item = items.find(i => i.id === initialActiveItemId);
      if (item) {
        setViewingItem(item);
      } else if (!loading && items.length > 0) {
        alert(t.itemNotFound);
        if (onChatClose) onChatClose();
      }
    }
  }, [initialActiveItemId, items, loading, t.itemNotFound, onChatClose]);

  useEffect(() => {
    if (viewingItem) {
      window.scrollTo(0, 0);
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 0);
    }
  }, [viewingItem?.id]);

  useEffect(() => {
    if (viewingItem) {
      const updated = items.find(i => i.id === viewingItem.id);
      if (updated) setViewingItem(updated);
    }
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedGenre !== t.allGenres && item.genre !== selectedGenre) return false;
      if (selectedCondoId !== 'ALL' && item.condoId !== selectedCondoId) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, searchQuery, selectedGenre, t.allGenres]);

  const handleSendComment = (itemId: string) => {
    const text = commentInputs[itemId];
    if (!text?.trim()) return;
    onAddComment(itemId, text);
    setCommentInputs(prev => ({ ...prev, [itemId]: '' }));
  };

  const handleShare = () => {
    if (!viewingItem) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#wanted?id=${viewingItem.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: viewingItem.title,
        text: viewingItem.description,
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

  if (viewingItem) {
    const isOwner = profile && viewingItem.userId === profile.uid;

    const ownerStats = calculateUserStats(viewingItem.userId, null, marketItems || [], skills || [], items);
    const badgeLevel = getBadgeLevel(ownerStats);
    const badgeColor = getBadgeColor(badgeLevel);

    return (
      <div className="animate-fade-in space-y-6 pb-20 px-4 pt-4">
        <div className="flex items-center justify-between">
           <div className="flex gap-2">
             <button 
               onClick={() => { setViewingItem(null); if(onChatClose) onChatClose(); if(onViewItem) onViewItem(null); }} 
               className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
             >
               <ChevronLeft size={16} /> {t.wanted}
             </button>
             <button 
               onClick={() => onLike(viewingItem.id)} 
               className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-2xl border shadow-sm active:scale-95 transition-all ${profile && viewingItem.likes?.includes(profile.uid) ? 'bg-rose-500 text-white border-rose-400' : 'bg-white text-gray-400 border-gray-100'}`}
             >
               <Heart size={16} fill={profile && viewingItem.likes?.includes(profile.uid) ? "currentColor" : "none"} />
               {viewingItem.likes && viewingItem.likes.length > 0 && <span>{viewingItem.likes.length}</span>}
             </button>
             <button 
               onClick={handleShare} 
               className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
             >
               <Share2 size={16} /> {t.share}
             </button>
           </div>
           <button 
             onClick={() => onViewProfile && onViewProfile(viewingItem.userId)} 
             className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-amber-50 shadow-sm active:scale-90 transition-all shrink-0 relative"
           >
             <span className="text-xl leading-none">{viewingItem.parentAvatarIcon}</span>
              {badgeLevel !== 'NONE' && (
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${badgeColor} flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-amber-50`}>
                  <Star size={8} fill="currentColor" />
                </div>
              )}
             <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter max-w-[50px] truncate text-center leading-none">
               {viewingItem.parentNickname}
             </span>
           </button>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm relative">
          {viewingItem.images && viewingItem.images.length > 0 ? (
            <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
              {viewingItem.images.map((img, i) => (
                <img key={i} src={img} className="w-full aspect-square object-cover snap-center shrink-0" alt={`View ${i}`} referrerPolicy="no-referrer" />
              ))}
            </div>
          ) : (
            <div className="aspect-square bg-amber-50 flex items-center justify-center text-amber-100">
               <Heart size={64} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
            <div className="flex items-center gap-2 text-gray-400"><MapPin size={12}/><span className="text-[8px] font-black uppercase tracking-widest">{t.condominium}</span></div>
            <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{getCondoName(viewingItem.condoId, viewingItem.customCondoName)}</div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">{t.lookingFor}</span>
              </div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-tight">{viewingItem.title}</h1>
            </div>

            <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-[28px] border border-amber-100/50">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">{t.hopePrice}</span>
                <span className="text-2xl font-black text-amber-600 tracking-tighter leading-none">
                  RM {viewingItem.hopePrice}
                </span>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.condominium}</div>
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-tight truncate max-w-[150px]">
                  {getCondoName(viewingItem.condoId, viewingItem.customCondoName)}
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{viewingItem.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-400"><MapPin size={12}/><span className="text-[8px] font-black uppercase tracking-widest">{t.pickupLocation}</span></div>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{viewingItem.pickupLocation || t.discuss}</div>
            </div>
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-400"><Clock size={12}/><span className="text-[8px] font-black uppercase tracking-widest">{t.wantedByDate}</span></div>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{viewingItem.preferredTiming}</div>
            </div>
          </div>

          {/* Guidance message for other users in English */}
          {!isOwner && (
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed tracking-tight uppercase">
                  {t.ifYouHaveItemMsg}
                </p>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="flex flex-col gap-3 pt-2">
              <button onClick={() => onEdit(viewingItem)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-[24px] font-black uppercase text-[11px] tracking-widest border border-gray-100 active:scale-95 shadow-sm flex items-center justify-center gap-2 transition-all">
                <Edit2 size={16}/> {t.edit}
              </button>
              <button onClick={() => { if(confirm(t.deleteItem)) { onDelete(viewingItem.id); setViewingItem(null); if(onChatClose) onChatClose(); } }} className="w-full py-3.5 bg-white text-red-300 rounded-[24px] font-black uppercase text-[10px] tracking-widest border border-red-50 active:scale-95 flex items-center justify-center gap-2 transition-all opacity-70 hover:opacity-100">
                <Trash2 size={14}/> {t.deleteListing}
              </button>
            </div>
          )}

          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><MessageCircle size={14}/></div>
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">{t.discussion}</h3>
            </div>

            <div className="space-y-4">
              {viewingItem.comments.map(c => {
                const isMe = profile && c.userId === profile.uid;
                const isItemOwner = c.userId === viewingItem.userId;
                return (
                  <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{c.userAvatar}</div>
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter max-w-[44px] truncate text-center leading-tight">{c.userNickname}</span>
                    </div>
                    <div className={`p-4 rounded-[24px] text-[13px] shadow-sm max-w-[80%] ${isMe ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                      <div className={`text-[8px] font-black uppercase mb-1 opacity-80 ${isMe ? 'text-amber-50 text-right' : 'text-amber-500'}`}>
                        {isItemOwner ? t.owner : t.neighbor} • {format(new Date(c.createdAt), 'HH:mm')}
                      </div>
                      <div className="font-bold leading-relaxed whitespace-pre-wrap">{c.text}</div>
                    </div>
                  </div>
                );
              })}
              {viewingItem.comments.length === 0 && (
                <div className="py-12 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[44px] tracking-[0.2em] bg-white/40">{t.noMessagesYet}</div>
              )}
            </div>

            <div className="pt-6">
               <p className="text-[9px] text-gray-400 font-bold px-4 italic mb-2">{t.translationNotice}</p>
               <div className="flex gap-2 items-center bg-white p-2 rounded-[28px] border-2 border-amber-50 focus-within:border-amber-400 focus-within:ring-4 ring-amber-50 transition-all shadow-sm">
                  <input 
                    type="text" 
                    value={commentInputs[viewingItem.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [viewingItem.id]: e.target.value }))}
                    placeholder={t.offerItemPlaceholder}
                    className="flex-grow bg-transparent border-none px-4 py-3 text-sm font-bold outline-none placeholder:text-gray-300"
                    onKeyDown={e => e.key === 'Enter' && handleSendComment(viewingItem.id)}
                  />
                  <button 
                    onClick={() => handleSendComment(viewingItem.id)} 
                    disabled={!(commentInputs[viewingItem.id] || '').trim()}
                    className={`p-3 rounded-full shadow-lg active:scale-90 transition-all ${ (commentInputs[viewingItem.id] || '').trim() ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
            </div>
          </div>
        </div>
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
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-amber-100 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-amber-400 text-white border-amber-400 shadow-lg' : 'bg-white text-gray-400 border-gray-100 shadow-sm'}`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-[32px] border border-amber-50 shadow-xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{t.sortAndFilters}</h4>
              <button onClick={() => { setSearchQuery(''); setSelectedGenre(t.allGenres); setSelectedCondoId('ALL'); }} className="text-[9px] font-black text-amber-500 uppercase">{t.resetAll}</button>
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

            <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">{t.genres}</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedGenre(t.allGenres)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${selectedGenre === t.allGenres ? 'bg-amber-400 text-white' : 'bg-gray-50 text-gray-400'}`}>{t.all}</button>
              {MARKET_GENRES.map(g => (
                <button key={g} onClick={() => setSelectedGenre(g)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${selectedGenre === g ? 'bg-amber-400 text-white' : 'bg-gray-50 text-gray-400'}`}>
                  {GENRE_ICONS[g]} {g}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {((index === 4) || (index > 4 && (index - 4) % 10 === 0)) && (
              <div className="col-span-2">
                <AffiliateBanner index={Math.floor((index - 4) / 10)} />
              </div>
            )}
            <WantedItemCard 
              item={item} 
              onClick={() => { setViewingItem(item); if(onViewItem) onViewItem(item.id); }} 
              profile={profile}
              onLike={(e) => { e.stopPropagation(); onLike(item.id); }}
              language={language} 
            />
          </React.Fragment>
        ))}
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          <WantedSkeleton />
        </div>
      ) : filteredItems.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-gray-100 mb-4 flex justify-center"><Heart size={64}/></div>
          <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{t.noWishlistFound}</p>
        </div>
      )}
    </div>
  );
};
