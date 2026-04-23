
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { MarketItem, UserProfile, MarketComment } from '../types';
import { MARKET_GENRES, GENRE_ICONS, getCondoName } from '../constants';
import { ShoppingBag, Tag, MapPin, CreditCard, Clock, Edit2, Trash2, MessageCircle, Send, ChevronDown, ChevronUp, Sparkles, User, Image as ImageIcon, PackageCheck, CheckCircle2, Search, SlidersHorizontal, X, AlertTriangle, CheckCircle, Ban, ArrowUpDown, ChevronRight, Check, UserCircle, Info, ChevronLeft, Lock, Coins, Handshake, ExternalLink, Flame, Heart, Share2 } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { AffiliateBanner } from './AffiliateBanner';
import { MarketSkeleton } from './Skeleton';

import { Language, translations } from '../translations';

interface Props {
  items: MarketItem[];
  profile: UserProfile | null;
  language?: Language;
  loading?: boolean;
  initialActiveItemId?: string | null;
  onEdit: (item: MarketItem) => void;
  onStatusChange: (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => void;
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

const InstructionBanner = memo(({ item, profile, language = 'en' }: { item: MarketItem, profile: UserProfile | null, language?: Language }) => {
  const t = translations[language];
  if (!profile) return null;
  const isSeller = item.userId === profile.uid;
  const isBuyer = item.buyerId === profile.uid;

  if (item.status === 'AVAILABLE' && item.requestStatus === 'PENDING') {
    if (isSeller) return (
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 animate-pulse border-2 border-white shadow-xl">
        <div className="bg-white/20 p-2 rounded-xl text-2xl flex items-center justify-center">{item.buyerAvatarIcon || <AlertTriangle size={24} />}</div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.buyer}: {item.buyerNickname}</div>
          <div className="text-[13px] font-bold leading-tight">{t.wantsToBuyMsg}</div>
        </div>
      </div>
    );
    if (isBuyer) return (
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
        <div className="bg-white/20 p-2 rounded-xl"><Clock size={24} /></div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.applicationSent}</div>
          <div className="text-[13px] font-bold leading-tight">{t.sellerReviewingMsg}</div>
        </div>
      </div>
    );
  }

  if (item.status === 'RESERVED') {
    if (isBuyer) {
      if (!item.buyerConfirmedCompletion) return (
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
          <div className="bg-white/20 p-2 rounded-xl"><Handshake size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.itemsReserved}</div>
            <div className="text-[13px] font-bold leading-tight">{t.pickupInstruction}</div>
          </div>
        </div>
      );
      return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
          <div className="bg-white/20 p-2 rounded-xl"><CheckCircle size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.pickupConfirmed}</div>
            <div className="text-[13px] font-bold leading-tight">{t.waitingSellerFinalize}</div>
          </div>
        </div>
      );
    }
    if (isSeller) {
      if (item.buyerConfirmedCompletion) return (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 animate-bounce border-2 border-white shadow-xl">
          <div className="bg-white/20 p-2 rounded-xl"><PackageCheck size={24} /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.buyerConfirmed}</div>
            <div className="text-[13px] font-bold leading-tight">{t.handoverCompleteMsg}</div>
          </div>
        </div>
      );
      return (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-5 rounded-[28px] mb-6 flex items-center gap-4 border-2 border-white shadow-xl">
          <div className="bg-white/20 p-2 rounded-xl text-2xl flex items-center justify-center">{item.buyerAvatarIcon || <MessageCircle size={24} />}</div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.reservedFor} {item.buyerNickname}</div>
            <div className="text-[13px] font-bold leading-tight">{t.arrangePickupMsg}</div>
          </div>
        </div>
      );
    }
  }
  return null;
});

const MarketItemCard = memo(({ item, onClick, profile, onLike }: { item: MarketItem, onClick: () => void, profile: UserProfile | null, onLike: (e: React.MouseEvent) => void }) => {
  const isNew = differenceInHours(new Date(), new Date(item.createdAt)) <= 72;
  const isDiscounted = item.priceUpdatedAt && 
                      item.previousPrice !== undefined && 
                      item.price < item.previousPrice && 
                      differenceInHours(new Date(), new Date(item.priceUpdatedAt)) <= 72;

  const isSold = item.status === 'SOLD';
  const canClick = !isSold || (profile && (item.userId === profile.uid || item.buyerId === profile.uid));
  const isLiked = profile ? item.likes?.includes(profile.uid) : false;

  return (
    <button 
      onClick={onClick} 
      disabled={!canClick}
      className={`bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm text-left animate-fade-in active:scale-[0.98] transition-all flex flex-col relative ${!canClick ? 'opacity-80 grayscale-[0.5]' : ''}`}
    >
      <div className="relative aspect-square">
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200"><ImageIcon size={32} /></div>
        )}
        
        {isSold && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-[0.2em] shadow-2xl border-4 border-white -rotate-12 animate-pulse">
              SOLD
            </div>
          </div>
        )}
        
        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm ${item.status === 'AVAILABLE' ? (item.requestStatus === 'PENDING' ? 'bg-teal-400 text-white' : 'bg-green-400 text-white') : (item.status === 'SOLD' ? 'bg-gray-400 text-white' : 'bg-orange-400 text-white')}`}>
            {item.requestStatus === 'PENDING' ? 'REQ' : item.status}
          </div>
          {isNew && (
            <div className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm flex items-center gap-0.5">
              <Sparkles size={8} /> NEW
            </div>
          )}
          {isDiscounted && (
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm flex items-center gap-0.5 animate-pulse">
              <Flame size={8} /> DISCOUNT
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

        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm border border-teal-50">
          <div className="flex flex-col items-end">
            {isDiscounted && item.previousPrice && (
               <span className="text-[7px] text-gray-400 line-through font-bold">RM{item.previousPrice}</span>
            )}
            <span className="text-teal-600 font-black text-[10px]">{item.type === 'FREE' ? 'FREE' : `RM${item.price}`}</span>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-[11px] font-black text-gray-800 line-clamp-1 uppercase tracking-tight">{item.title}</h3>
      </div>
    </button>
  );
});

type SortOption = 'newest' | 'price_low' | 'price_high';

export const MarketPlace: React.FC<Props> = ({ items, profile, language = 'en', loading = false, initialActiveItemId, onEdit, onStatusChange, onDelete, onAddComment, onLike, onViewProfile, onChatClose, onViewItem, tabResetToggle, ensureAuth, condos = [] }) => {
  const t = translations[language];
  const [filterStatus, setFilterStatus] = useState<MarketItem['status'] | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>(t.allGenres);
  const [selectedCondition, setSelectedCondition] = useState<string>(t.anyCondition);
  const [selectedCondoId, setSelectedCondoId] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const [viewingItem, setViewingItem] = useState<MarketItem | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewingItem(null);
  }, [tabResetToggle]);

  useEffect(() => {
    if (initialActiveItemId) {
      const item = items.find(i => i.id === initialActiveItemId);
      if (item) {
        // Validation for deep linking - restrict access to RESERVED and SOLD items
        if ((item.status === 'RESERVED' || item.status === 'SOLD') && (!profile || (item.userId !== profile.uid && item.buyerId !== profile.uid))) {
           alert(t.transactionPrivateMsg);
           if (onChatClose) onChatClose();
           return;
        }
        setViewingItem(item);
      } else if (!loading && items.length > 0) {
        // Item not found
        alert(t.itemNotFound);
        if (onChatClose) onChatClose();
      }
    }
  }, [initialActiveItemId, items, profile?.uid, t.transactionPrivateMsg, t.itemNotFound, loading, onChatClose]);

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
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewingItem)) {
        setViewingItem(updated);
      }
    }
  }, [items, viewingItem?.id]);

  const [confirmRequestItem, setConfirmRequestItem] = useState<MarketItem | null>(null);
  const [rejectRequestItem, setRejectRequestItem] = useState<MarketItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredItems = useMemo(() => {
    const currentFilter = filterStatus;
    let result = items.filter(item => {
      if (currentFilter === 'RESERVED') {
        if (item.requestStatus !== 'PENDING' && item.status !== 'RESERVED') return false;
      } else if (currentFilter === 'AVAILABLE') {
        if (item.status !== 'AVAILABLE' || item.requestStatus === 'PENDING') return false;
      } else if (currentFilter !== 'ALL' && item.status !== currentFilter) {
        return false;
      }

      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedGenre !== t.allGenres && item.genre !== selectedGenre) return false;
      if (selectedCondition !== t.anyCondition && item.condition !== selectedCondition) return false;
      if (selectedCondoId !== 'ALL' && item.condoId !== selectedCondoId) return false;
      if (minPrice && item.price < Number(minPrice)) return false;
      if (maxPrice && item.price > Number(maxPrice)) return false;
      
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0;
    });
  }, [items, filterStatus, searchQuery, selectedGenre, selectedCondition, minPrice, maxPrice, sortBy, t.allGenres, t.anyCondition]);

  const handleSendComment = (itemId: string) => {
    const text = commentInputs[itemId];
    if (!text?.trim()) return;
    onAddComment(itemId, text);
    setCommentInputs(prev => ({ ...prev, [itemId]: '' }));
  };

  const scrollGallery = (direction: 'prev' | 'next') => {
    if (!galleryRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = galleryRef.current;
    
    if (direction === 'next') {
      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        galleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        galleryRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft <= 5) {
        galleryRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        galleryRef.current.scrollBy({ left: -clientWidth, behavior: 'smooth' });
      }
    }
  };

  const handleConfirmRequest = () => {
    if (confirmRequestItem) {
      onStatusChange(confirmRequestItem.id, 'AVAILABLE', profile.uid);
      setConfirmRequestItem(null);
    }
  };

  const handleConfirmReject = () => {
    if (rejectRequestItem && rejectionReason.trim()) {
      onStatusChange(rejectRequestItem.id, 'AVAILABLE', undefined, rejectionReason);
      setRejectRequestItem(null);
      setRejectionReason('');
    }
  };

  const handleBuyerCompletion = (item: MarketItem) => {
    if (confirm(t.confirmReceipt)) {
      onStatusChange(item.id, 'RESERVED', undefined, undefined, { buyerConfirmedCompletion: true });
    }
  };

  const handleSellerCompletion = (item: MarketItem) => {
    if (confirm(t.endTransactionMsg)) {
      onStatusChange(item.id, 'SOLD', undefined, undefined, { sellerConfirmedCompletion: true });
      setViewingItem(null);
      if (onChatClose) onChatClose();
    }
  };

  const handleRequestCancellation = (item: MarketItem) => {
    const isSeller = profile && item.userId === profile.uid;
    const msg = isSeller ? t.cancelTradeSeller : t.cancelTradeBuyer;
    if (confirm(msg)) {
      const updates = isSeller ? { sellerRequestedCancellation: true } : { buyerRequestedCancellation: true };
      onStatusChange(item.id, 'RESERVED', undefined, undefined, updates);
    }
  };

  const handleConfirmCancellation = (item: MarketItem) => {
    if (confirm(t.returnAvailableMsg)) {
      onStatusChange(item.id, 'AVAILABLE', undefined, undefined, { 
        buyerId: '', 
        buyerNickname: '', 
        buyerAvatarIcon: '', 
        requestStatus: 'NONE',
        buyerRequestedCancellation: false,
        sellerRequestedCancellation: false,
        buyerConfirmedCompletion: false,
        sellerConfirmedCompletion: false
      });
      setViewingItem(null);
      if (onChatClose) onChatClose();
    }
  };

  const handleItemClick = (item: MarketItem) => {
    // Check privacy for TRADE (RESERVED) and SOLD items
    if ((item.status === 'RESERVED' || item.status === 'SOLD') && (!profile || (item.userId !== profile.uid && item.buyerId !== profile.uid))) {
      alert(t.transactionPrivateMsg);
      return;
    }
    setViewingItem(item);
    if (onViewItem) onViewItem(item.id);
  };

  const handleShare = () => {
    if (!viewingItem) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#market?id=${viewingItem.id}`;
    
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
    const isSeller = profile && viewingItem.userId === profile.uid;
    const isBuyer = profile && viewingItem.buyerId === profile.uid;

    return (
      <div className="animate-fade-in space-y-6 pb-20 px-4 pt-4">
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => { setViewingItem(null); if(onChatClose) onChatClose(); if(onViewItem) onViewItem(null); }} 
                className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
              >
                <ChevronLeft size={16} /> {t.market}
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
             className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-teal-50 shadow-sm active:scale-90 transition-all shrink-0"
           >
             <span className="text-xl leading-none">{viewingItem.parentAvatarIcon}</span>
             <span className="text-[8px] font-black text-teal-500 uppercase tracking-tighter max-w-[50px] truncate text-center leading-none">
               {viewingItem.parentNickname}
             </span>
           </button>
        </div>

        <InstructionBanner item={viewingItem} profile={profile} language={language} />

        {viewingItem.status !== 'SOLD' && (
          <div className="bg-white p-6 rounded-[32px] border-2 border-teal-50 shadow-lg animate-slide-down">
              {viewingItem.userId !== profile?.uid && viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus !== 'PENDING' && (
                <button 
                  onClick={() => {
                    if (ensureAuth) {
                      ensureAuth(() => setConfirmRequestItem(viewingItem));
                    } else {
                      setConfirmRequestItem(viewingItem);
                    }
                  }} 
                  className="w-full py-5 bg-teal-400 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-[14px] shadow-xl shadow-teal-100 active:scale-[0.97] transition-all border-4 border-white block"
                >
                  {t.requesting}
                </button>
              )}

              {isSeller && viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus === 'PENDING' && (
                <div className="space-y-4 p-5 bg-orange-50/50 rounded-[32px] border-2 border-orange-100 mb-4">
                  <p className="text-[11px] font-black text-orange-600 uppercase tracking-widest text-center">{t.buyerApplicationReceived}</p>
                  <div className="flex gap-3">
                    <button onClick={() => onStatusChange(viewingItem.id, 'RESERVED')} className="flex-1 py-5 bg-green-500 text-white rounded-[28px] font-black uppercase text-[14px] tracking-widest shadow-xl active:scale-95 border-4 border-white transition-all">{t.confirm}</button>
                    <button onClick={() => setRejectRequestItem(viewingItem)} className="flex-1 py-5 bg-white text-red-500 rounded-[28px] font-black uppercase text-[14px] tracking-widest border-2 border-red-100 active:scale-95 transition-all">{t.cancel}</button>
                  </div>
                </div>
              )}

              {isSeller && (viewingItem.status === 'AVAILABLE' || viewingItem.status === 'RESERVED') && (
                <div className="flex flex-col gap-3">
                  {viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus !== 'PENDING' && (
                    <button onClick={() => onEdit(viewingItem)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-[24px] font-black uppercase text-[11px] tracking-widest border border-gray-100 active:scale-95 shadow-sm flex items-center justify-center gap-2 transition-all">
                      <Edit2 size={16}/> {t.edit}
                    </button>
                  )}
                  <button onClick={() => { if(confirm(t.deleteItem)) { onDelete(viewingItem.id); setViewingItem(null); if(onChatClose) onChatClose(); } }} className="w-full py-3.5 bg-white text-red-300 rounded-[24px] font-black uppercase text-[10px] tracking-widest border border-red-50 active:scale-95 flex items-center justify-center gap-2 transition-all opacity-70 hover:opacity-100">
                    <Trash2 size={14}/> {t.deleteListing}
                  </button>
                </div>
              )}

              {viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus === 'PENDING' && !isSeller && (
                <div className="bg-teal-50 text-teal-600 px-4 py-3.5 rounded-full text-[12px] font-black uppercase tracking-widest text-center border border-teal-100 shadow-inner flex items-center justify-center gap-2">
                  <PackageCheck size={18}/> {t.waitingForSeller}
                </div>
              )}
          </div>
        )}

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm relative">
          {viewingItem.images && viewingItem.images.length > 0 ? (
            <>
              <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                {viewingItem.images.map((img, i) => (
                  <img key={i} src={img} className="w-full aspect-square object-cover snap-center shrink-0" alt={`View ${i}`} loading="lazy" referrerPolicy="no-referrer" />
                ))}
              </div>
              {viewingItem.images.length > 1 && (
                <>
                  <button onClick={() => scrollGallery('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 z-10"><ChevronLeft size={20} /></button>
                  <button onClick={() => scrollGallery('next')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 z-10"><ChevronRight size={20} /></button>
                </>
              )}
            </>
          ) : (
            <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-200"><ImageIcon size={64} /></div>
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
                <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100">{t.rank} {viewingItem.condition}</span>
                <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100">{viewingItem.type}</span>
              </div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-tight">{viewingItem.title}</h1>
            </div>

            <div className="flex items-center justify-between bg-teal-50/50 p-4 rounded-[28px] border border-teal-100/50">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest mb-1">{t.price}</span>
                <span className="text-2xl font-black text-teal-600 tracking-tighter leading-none">
                  {viewingItem.type === 'FREE' ? t.free : `RM ${viewingItem.price}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.via}</span>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{viewingItem.paymentMethod}</span>
              </div>
            </div>

            <p className="text-gray-400 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{viewingItem.description}</p>
          </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-400"><MapPin size={12}/><span className="text-[8px] font-black uppercase tracking-widest">{t.pickupLocation}</span></div>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{viewingItem.pickupLocation}</div>
            </div>
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-400"><Clock size={12}/><span className="text-[8px] font-black uppercase tracking-widest">{t.pickupTime}</span></div>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{viewingItem.pickupDateTime}</div>
            </div>
          </div>

          {viewingItem.status !== 'AVAILABLE' && (
            <div className={`border p-6 rounded-[32px] space-y-5 shadow-sm ${viewingItem.status === 'SOLD' ? 'bg-gray-50 border-gray-100' : 'bg-orange-50 border-orange-100'}`}>
               <div className="flex items-center justify-center gap-4">
                  <div className={`flex flex-col items-center gap-1 ${viewingItem.status === 'SOLD' || viewingItem.buyerConfirmedCompletion ? 'text-green-500' : 'text-orange-500'}`}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${viewingItem.status === 'SOLD' || viewingItem.buyerConfirmedCompletion ? 'bg-green-500 text-white border-green-500' : 'bg-white border-orange-200'}`}>
                      {viewingItem.status === 'SOLD' || viewingItem.buyerConfirmedCompletion ? <Check size={20}/> : '1'}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">{t.received}</span>
                  </div>
                  <div className={`w-12 h-px ${viewingItem.status === 'SOLD' ? 'bg-green-200' : 'bg-orange-200'}`}></div>
                  <div className={`flex flex-col items-center gap-1 ${viewingItem.status === 'SOLD' || viewingItem.sellerConfirmedCompletion ? 'text-green-500' : 'text-gray-300'}`}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${viewingItem.status === 'SOLD' || viewingItem.sellerConfirmedCompletion ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-100'}`}>
                      {viewingItem.status === 'SOLD' || viewingItem.sellerConfirmedCompletion ? <Check size={20}/> : '2'}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">{t.done}</span>
                  </div>
               </div>
               {viewingItem.status === 'RESERVED' && (
                 <div className="space-y-4">
                   {isBuyer ? (
                      !viewingItem.buyerConfirmedCompletion && (
                        <button onClick={() => handleBuyerCompletion(viewingItem)} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">I've picked up the item</button>
                      )
                   ) : (
                      isSeller && viewingItem.buyerConfirmedCompletion && (
                        <button onClick={() => handleSellerCompletion(viewingItem)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Complete Transaction</button>
                      )
                   )}

                   {/* Cancellation Section */}
                   <div className="pt-2 border-t border-orange-200/50">
                     <div className="space-y-2">
                       {viewingItem.buyerRequestedCancellation && viewingItem.sellerRequestedCancellation ? (
                         <button onClick={() => handleConfirmCancellation(viewingItem)} className="w-full py-3 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Finalize Cancellation</button>
                       ) : (
                         <>
                           {isBuyer && (
                             viewingItem.buyerRequestedCancellation ? (
                               <div className="text-center py-2 bg-orange-100/50 rounded-xl border border-orange-200">
                                 <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Cancellation Requested</p>
                               </div>
                             ) : (
                               <button onClick={() => handleRequestCancellation(viewingItem)} className="w-full py-3 bg-white text-red-400 border border-red-100 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                 {viewingItem.sellerRequestedCancellation ? "Agree to Cancel Trade" : "Request Cancellation"}
                               </button>
                             )
                           )}
                           {isSeller && (
                             viewingItem.sellerRequestedCancellation ? (
                               <div className="text-center py-2 bg-orange-100/50 rounded-xl border border-orange-200">
                                 <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Cancellation Requested</p>
                               </div>
                             ) : (
                               <button onClick={() => handleRequestCancellation(viewingItem)} className="w-full py-3 bg-white text-red-400 border border-red-100 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                 {viewingItem.buyerRequestedCancellation ? "Agree to Cancel Trade" : "Request Cancellation"}
                               </button>
                             )
                           )}
                         </>
                       )}
                     </div>
                   </div>
                 </div>
               )}
            </div>
          )}

          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-teal-100 text-teal-600 p-2 rounded-xl"><MessageCircle size={14}/></div>
              <div className="flex-grow">
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">
                  {viewingItem.status === 'RESERVED' ? t.trade : viewingItem.status === 'SOLD' ? t.available : t.all}
                </h3>
                {isSeller && viewingItem.status === 'RESERVED' && (
                  <p className="text-[8px] font-black text-teal-500 uppercase mt-0.5">Chatting with {viewingItem.buyerNickname}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {viewingItem.comments.map(c => {
                const isMe = profile && c.userId === profile.uid;
                const isItemSeller = c.userId === viewingItem.userId;
                return (
                  <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{c.userAvatar}</div>
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter max-w-[44px] truncate text-center leading-tight">{c.userNickname}</span>
                    </div>
                    <div className={`p-4 rounded-[24px] text-[13px] shadow-sm max-w-[80%] ${isMe ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                      <div className={`text-[8px] font-black uppercase mb-1 opacity-80 ${isMe ? 'text-teal-50 text-right' : 'text-teal-500'}`}>
                        {isItemSeller ? t.sell : t.all} • {format(new Date(c.createdAt), 'HH:mm')}
                      </div>
                      <div className="font-bold leading-relaxed whitespace-pre-wrap">{c.text}</div>
                    </div>
                  </div>
                );
              })}
              {viewingItem.comments.length === 0 && (
                <div className="py-12 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[44px] tracking-[0.2em] bg-white/40">{t.noMessage}</div>
              )}
            </div>

            {viewingItem.status !== 'SOLD' ? (
              <div className="pt-6">
                 <p className="text-[9px] text-gray-400 font-bold px-4 italic mb-2">{t.translationNotice}</p>
                  <div className="flex gap-2 items-center bg-white p-2 rounded-[28px] border-2 border-teal-50 focus-within:border-teal-400 focus-within:ring-4 ring-teal-50 transition-all shadow-sm">
                    <input 
                      type="text" 
                      value={commentInputs[viewingItem.id] || ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [viewingItem.id]: e.target.value }))}
                      placeholder="..."
                      className="flex-grow bg-transparent border-none px-4 py-3 text-sm font-bold outline-none placeholder:text-gray-300"
                      onKeyDown={e => e.key === 'Enter' && handleSendComment(viewingItem.id)}
                    />
                    <button 
                      onClick={() => handleSendComment(viewingItem.id)} 
                      disabled={!(commentInputs[viewingItem.id] || '').trim()}
                      className={`p-3 rounded-full shadow-lg active:scale-90 transition-all ${ (commentInputs[viewingItem.id] || '').trim() ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-300'}`}
                    >
                      <span className="sr-only">{t.send}</span>
                      <Send size={18} />
                    </button>
                  </div>
              </div>
            ) : (
              <div className="py-6 flex items-center justify-center gap-4 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                <Lock size={18} className="text-gray-300" />
                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">{t.close}</span>
              </div>
            )}
          </div>
        </div>

        {confirmRequestItem && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-teal-400">
              <div className="text-center space-y-5">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 mx-auto border-4 border-white shadow-lg"><AlertTriangle size={40} /></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{t.requesting}</h3>
                <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-widest px-4">{t.confirm} "{confirmRequestItem.title}"?</p>
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setConfirmRequestItem(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest">{t.back}</button>
                  <button onClick={handleConfirmRequest} className="flex-1 py-5 bg-teal-400 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">{t.send}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {rejectRequestItem && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-red-400">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight text-center">{t.cancel}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center leading-relaxed">{t.description}</p>
                <textarea 
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="..."
                  className="w-full p-5 bg-gray-50 border-none rounded-3xl font-bold text-sm h-32 resize-none outline-none focus:ring-4 ring-red-50"
                />
                <div className="flex gap-4 pt-4">
                  <button onClick={() => { setRejectRequestItem(null); setRejectionReason(''); }} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest transition-all">{t.back}</button>
                  <button onClick={handleConfirmReject} disabled={!rejectionReason.trim()} className={`flex-1 py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${rejectionReason.trim() ? 'bg-red-500 text-white shadow-red-100 active:scale-95' : 'bg-gray-100 text-gray-300 opacity-50 cursor-not-allowed'}`}>{t.cancel}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-32 space-y-4 relative">
      <div className="space-y-3 sticky top-0 bg-[#fdfbf7] z-30 pt-2 pb-4">
        <div className="flex gap-2">
            <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-teal-100 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-teal-400 text-white border-teal-400 shadow-lg' : 'bg-white text-gray-400 border-gray-100 shadow-sm'}`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-[32px] border border-teal-50 shadow-xl space-y-5 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{t.sortAndFilters}</h4>
              <button onClick={() => { setSearchQuery(''); setSelectedGenre(t.allGenres); setSelectedCondition(t.anyCondition); setSelectedCondoId('ALL'); setMinPrice(''); setMaxPrice(''); setSortBy('newest'); }} className="text-[9px] font-black text-teal-500 uppercase">{t.resetAll}</button>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.genre}</label>
                <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"><option>{t.allGenres}</option>{MARKET_GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.condition}</label>
                <select value={selectedCondition} onChange={e => setSelectedCondition(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"><option>{t.anyCondition}</option><option value="S">{t.rankS}</option><option value="A">{t.rankA}</option><option value="B">{t.rankB}</option><option value="C">{t.rankC}</option></select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.minPrice}</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minPrice}
                    min="0"
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.maxPrice}</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.sortBy}</label>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12}/>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as SortOption)} 
                  className="w-full pl-8 pr-3 py-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none appearance-none"
                >
                  <option value="newest">{t.newestFirst}</option>
                  <option value="price_low">{t.priceLowToHigh}</option>
                  <option value="price_high">{t.priceHighToLow}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'].map((f) => (
            <button key={f} onClick={() => setFilterStatus(f as any)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === f ? 'bg-teal-400 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 shadow-sm'}`}>
              {f === 'RESERVED' ? t.trade : f === 'ALL' ? t.all : t[f.toLowerCase() as keyof typeof t] || f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {((index === 4) || (index > 4 && (index - 4) % 10 === 0)) && (
              <div className="col-span-2">
                <AffiliateBanner index={Math.floor((index - 4) / 10)} />
              </div>
            )}
            <MarketItemCard 
              item={item} 
              onClick={() => handleItemClick(item)} 
              profile={profile} 
              onLike={(e) => { e.stopPropagation(); onLike(item.id); }}
            />
          </React.Fragment>
        ))}
      </div>
      {loading ? (
        <div className="p-4 space-y-4">
          <MarketSkeleton />
        </div>
      ) : filteredItems.length === 0 && (
        <div className="py-20 text-center">
          <div className="text-gray-200 mb-4 flex justify-center"><ShoppingBag size={48}/></div>
          <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{t.noMatchingItems}</p>
        </div>
      )}
    </div>
  );
};
