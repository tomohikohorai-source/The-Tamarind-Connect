
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MarketItem, UserProfile, MarketComment } from '../types';
import { MARKET_GENRES, GENRE_ICONS } from '../constants';
import { ShoppingBag, Tag, MapPin, CreditCard, Clock, Edit2, Trash2, MessageCircle, Send, ChevronDown, ChevronUp, Sparkles, User, Image as ImageIcon, PackageCheck, CheckCircle2, Search, SlidersHorizontal, X, AlertTriangle, CheckCircle, Ban, ArrowUpDown, ChevronRight, Check, UserCircle, Info, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  items: MarketItem[];
  profile: UserProfile;
  initialActiveItemId?: string | null;
  onEdit: (item: MarketItem) => void;
  onStatusChange: (id: string, status: MarketItem['status'], buyerId?: string, rejectionReason?: string, extraFlags?: any) => void;
  onDelete: (id: string) => void;
  onAddComment: (itemId: string, text: string) => void;
  onViewProfile?: (userId: string) => void;
  onChatClose?: () => void;
}

type SortOption = 'newest' | 'price_low' | 'price_high';

export const MarketPlace: React.FC<Props> = ({ items, profile, initialActiveItemId, onEdit, onStatusChange, onDelete, onAddComment, onViewProfile, onChatClose }) => {
  const [filterStatus, setFilterStatus] = useState<MarketItem['status'] | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [selectedCondition, setSelectedCondition] = useState<string>('Any Condition');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // State for Item Detail View
  const [viewingItem, setViewingItem] = useState<MarketItem | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const prevCommentCount = useRef<number>(0);

  // Handle deep linking or opening from profile
  useEffect(() => {
    if (initialActiveItemId) {
      const item = items.find(i => i.id === initialActiveItemId);
      if (item) setViewingItem(item);
    }
  }, [initialActiveItemId, items]);

  // Ensure view starts at the top when an item is opened
  useEffect(() => {
    if (viewingItem) {
      if (detailScrollRef.current) {
        detailScrollRef.current.scrollTop = 0;
      }
      prevCommentCount.current = viewingItem.comments.length;
    }
  }, [viewingItem?.id]);

  // Update viewing item if items list updates (e.g. comments added)
  useEffect(() => {
    if (viewingItem) {
      const updated = items.find(i => i.id === viewingItem.id);
      if (updated) {
        setViewingItem(updated);
        // Only scroll to bottom if a NEW message was added (not on initial load)
        if (updated.comments.length > prevCommentCount.current) {
          setTimeout(() => {
            if (detailScrollRef.current) {
              detailScrollRef.current.scrollTo({
                top: detailScrollRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 100);
        }
        prevCommentCount.current = updated.comments.length;
      }
    }
  }, [items]);

  // Modals
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

      if (currentFilter === 'ALL' && item.status === 'SOLD') return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedGenre !== 'All Genres' && item.genre !== selectedGenre) return false;
      if (selectedCondition !== 'Any Condition' && item.condition !== selectedCondition) return false;
      if (maxPrice && item.price > Math.max(0, Number(maxPrice))) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0;
    });
  }, [items, filterStatus, searchQuery, selectedGenre, selectedCondition, maxPrice, sortBy]);

  const handleSendComment = (itemId: string) => {
    const text = commentInputs[itemId];
    if (!text?.trim()) return;
    onAddComment(itemId, text);
    setCommentInputs(prev => ({ ...prev, [itemId]: '' }));
  };

  const scrollGallery = (direction: 'prev' | 'next') => {
    if (!galleryRef.current) return;
    const width = galleryRef.current.clientWidth;
    galleryRef.current.scrollBy({ 
      left: direction === 'next' ? width : -width, 
      behavior: 'smooth' 
    });
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
    if (confirm("Confirm that you have received the item?")) {
      onStatusChange(item.id, 'RESERVED', undefined, undefined, { buyerConfirmedCompletion: true });
    }
  };

  const handleSellerCompletion = (item: MarketItem) => {
    if (confirm("Buyer has confirmed receipt. End this transaction and mark as SOLD?")) {
      onStatusChange(item.id, 'SOLD', undefined, undefined, { sellerConfirmedCompletion: true });
      setViewingItem(null);
      if (onChatClose) onChatClose();
    }
  };

  return (
    <div className="p-4 pb-32 space-y-4 relative">
      <div className="space-y-3 sticky top-0 bg-[#fdfbf7] z-30 pt-2 pb-4">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
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
              <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Sort & Filters</h4>
              <button onClick={() => { setSearchQuery(''); setSelectedGenre('All Genres'); setSelectedCondition('Any Condition'); setMaxPrice(''); setSortBy('newest'); }} className="text-[9px] font-black text-teal-500 uppercase">Reset All</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"><option>All Genres</option>{MARKET_GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select>
              <select value={selectedCondition} onChange={e => setSelectedCondition(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold outline-none"><option>Any Condition</option><option value="S">Rank S</option><option value="A">Rank A</option><option value="B">Rank B</option><option value="C">Rank C</option></select>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'].map((f) => (
            <button key={f} onClick={() => setFilterStatus(f as any)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === f ? 'bg-teal-400 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 shadow-sm'}`}>
              {f === 'RESERVED' ? 'TRADE' : f === 'ALL' ? 'EVERYTHING' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map(item => (
          <button key={item.id} onClick={() => setViewingItem(item)} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm text-left animate-fade-in active:scale-[0.98] transition-all flex flex-col">
            <div className="relative aspect-square">
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200"><ImageIcon size={32} /></div>
              )}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm ${item.status === 'AVAILABLE' ? (item.requestStatus === 'PENDING' ? 'bg-teal-400 text-white' : 'bg-green-400 text-white') : 'bg-orange-400 text-white'}`}>
                  {item.requestStatus === 'PENDING' ? 'REQ' : item.status}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm border border-teal-50">
                <span className="text-teal-600 font-black text-[10px]">{item.type === 'FREE' ? 'FREE' : `RM${item.price}`}</span>
              </div>
            </div>
            <div className="p-3 space-y-1">
              <h3 className="text-[11px] font-black text-gray-800 line-clamp-1 uppercase tracking-tight">{item.title}</h3>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Unit {item.roomNumber}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {viewingItem && (
        <div className="fixed inset-0 z-[200] bg-white animate-slide-up flex flex-col h-[100dvh] overflow-hidden">
          <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 shadow-sm z-10">
            <button onClick={() => { setViewingItem(null); if(onChatClose) onChatClose(); }} className="p-2 text-gray-400 active:scale-90"><ChevronLeft size={24} /></button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{viewingItem.genre}</span>
              <h3 className="text-sm font-black text-gray-800 truncate uppercase tracking-tight max-w-[200px]">{viewingItem.title}</h3>
            </div>
            <button onClick={() => onViewProfile && onViewProfile(viewingItem.userId)} className="p-2 text-teal-500">{viewingItem.parentAvatarIcon}</button>
          </header>

          <div ref={detailScrollRef} className="flex-grow overflow-y-auto hide-scrollbar bg-gray-50/30">
            {/* Gallery with Navigation Arrows */}
            <div className="bg-white relative group">
              {viewingItem.images && viewingItem.images.length > 0 ? (
                <>
                  <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                    {viewingItem.images.map((img, i) => (
                      <img key={i} src={img} className="w-full aspect-square object-cover snap-center shrink-0" alt={`View ${i}`} />
                    ))}
                  </div>
                  {viewingItem.images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); scrollGallery('prev'); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 active:scale-90 transition-all z-20"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); scrollGallery('next'); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-600 active:scale-90 transition-all z-20"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-200"><ImageIcon size={64} /></div>
              )}
              {viewingItem.images && viewingItem.images.length > 1 && (
                <div className="flex justify-center gap-1.5 py-3 bg-white">
                  {viewingItem.images.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <span className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100">Rank {viewingItem.condition}</span>
                    <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100">{viewingItem.type}</span>
                  </div>
                  <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter pt-2 leading-tight">{viewingItem.title}</h1>
                  <p className="text-gray-400 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{viewingItem.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-teal-600 tracking-tighter">{viewingItem.type === 'FREE' ? 'FREE' : `RM ${viewingItem.price}`}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">via {viewingItem.paymentMethod}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-400"><MapPin size={12}/><span className="text-[8px] font-black uppercase tracking-widest">Location</span></div>
                  <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight line-clamp-2">{viewingItem.pickupLocation}</div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-400"><Clock size={12}/><span className="text-[8px] font-black uppercase tracking-widest">Timing</span></div>
                  <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight line-clamp-2">{viewingItem.pickupDateTime}</div>
                </div>
              </div>

              {/* Resident Seller Info */}
              <button onClick={() => onViewProfile && onViewProfile(viewingItem.userId)} className="w-full flex items-center justify-between p-4 bg-teal-50/50 border border-teal-100 rounded-3xl active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{viewingItem.parentAvatarIcon}</div>
                  <div className="text-left">
                    <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Seller Neighbor</div>
                    <div className="text-[13px] font-black text-gray-800 uppercase tracking-tight">Unit {viewingItem.roomNumber}</div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-teal-300" />
              </button>

              {/* Transaction specific banners */}
              {viewingItem.status === 'RESERVED' && (
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-[32px] space-y-5 shadow-sm">
                   <div className="flex items-center justify-center gap-4">
                      <div className={`flex flex-col items-center gap-1 ${viewingItem.buyerConfirmedCompletion ? 'text-green-500' : 'text-orange-500'}`}>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${viewingItem.buyerConfirmedCompletion ? 'bg-green-500 text-white border-green-500' : 'bg-white border-orange-200'}`}>
                          {viewingItem.buyerConfirmedCompletion ? <Check size={20}/> : '1'}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Received</span>
                      </div>
                      <div className="w-12 h-px bg-orange-200"></div>
                      <div className={`flex flex-col items-center gap-1 ${viewingItem.sellerConfirmedCompletion ? 'text-green-500' : 'text-gray-300'}`}>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${viewingItem.sellerConfirmedCompletion ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-100'}`}>
                          {viewingItem.sellerConfirmedCompletion ? <Check size={20}/> : '2'}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Done</span>
                      </div>
                   </div>
                   {profile.uid === viewingItem.buyerId ? (
                      !viewingItem.buyerConfirmedCompletion && (
                        <button onClick={() => handleBuyerCompletion(viewingItem)} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95">I've picked up the item</button>
                      )
                   ) : (
                      viewingItem.buyerConfirmedCompletion && (
                        <button onClick={() => handleSellerCompletion(viewingItem)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95">Complete Transaction</button>
                      )
                   )}
                </div>
              )}

              {/* Q&A Section */}
              <div className="space-y-4 pb-72">
                <div className="flex items-center gap-2 px-1">
                  <div className="bg-teal-100 text-teal-600 p-2 rounded-xl"><MessageCircle size={14}/></div>
                  <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">
                    {viewingItem.status === 'RESERVED' ? 'Transaction Chat' : 'Public Q&A'}
                  </h3>
                </div>

                <div className="bg-teal-50/50 p-4 rounded-3xl border border-teal-100 shadow-inner">
                  <p className="text-[10px] font-bold text-teal-700 leading-relaxed uppercase tracking-wider">
                    {viewingItem.status === 'RESERVED' 
                      ? 'Discuss details like exact meeting point or any last-minute changes here.' 
                      : 'Ask neighbors about item details, usage, or to schedule a viewing.'}
                  </p>
                </div>

                {viewingItem.comments.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {viewingItem.comments.map(c => {
                      const isMe = c.userId === profile.uid;
                      const isSeller = c.userId === viewingItem.userId;
                      return (
                        <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm">{c.userAvatar}</div>
                          <div className={`p-4 rounded-[24px] text-[13px] shadow-sm max-w-[80%] ${isMe ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                            <div className={`text-[8px] font-black uppercase mb-1 opacity-80 ${isMe ? 'text-teal-50 text-right' : 'text-teal-500'}`}>
                              {isSeller ? 'Seller' : 'Neighbor'} • {format(new Date(c.createdAt), 'HH:mm')}
                            </div>
                            <div className="font-bold leading-relaxed whitespace-pre-wrap">{c.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[44px] tracking-[0.2em] bg-white/40">No Messages Yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Corrected Action Area: Slimmer and higher positioning for better usability without obscuring content */}
          <div className="fixed bottom-[84px] left-0 right-0 z-[210] px-4">
             <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.12)] p-4 rounded-[40px] space-y-3">
                {/* Status Badge */}
                {viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus === 'PENDING' && viewingItem.userId !== profile.uid && (
                   <div className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-center border border-teal-100">Application Sent - Awaiting Approval</div>
                )}

                {/* Compact Chat Input */}
                <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-full border border-gray-100 focus-within:border-teal-400 focus-within:ring-2 ring-teal-50 transition-all">
                  <input 
                    type="text" 
                    value={commentInputs[viewingItem.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [viewingItem.id]: e.target.value }))}
                    placeholder={viewingItem.status === 'RESERVED' ? "Message..." : "Ask a question..."}
                    className="flex-grow bg-transparent border-none px-4 py-2 text-sm font-bold outline-none placeholder:text-gray-300"
                    onKeyDown={e => e.key === 'Enter' && handleSendComment(viewingItem.id)}
                  />
                  <button 
                    onClick={() => handleSendComment(viewingItem.id)} 
                    disabled={!(commentInputs[viewingItem.id] || '').trim()}
                    className={`p-2.5 rounded-full shadow-lg active:scale-90 transition-all ${ (commentInputs[viewingItem.id] || '').trim() ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>

                {/* Main Action Row */}
                {viewingItem.userId !== profile.uid && viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus !== 'PENDING' && (
                  <button onClick={() => setConfirmRequestItem(viewingItem)} className="w-full py-3.5 bg-teal-400 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all">Request to Buy</button>
                )}
                
                {viewingItem.userId === profile.uid && viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus === 'PENDING' && (
                   <div className="flex gap-2">
                      <button onClick={() => onStatusChange(viewingItem.id, 'RESERVED')} className="flex-1 py-3 bg-green-500 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg">Approve</button>
                      <button onClick={() => setRejectRequestItem(viewingItem)} className="flex-1 py-3 bg-red-50 text-red-500 rounded-full font-black uppercase text-[10px] tracking-widest border border-red-100">Decline</button>
                   </div>
                )}

                {viewingItem.userId === profile.uid && viewingItem.status === 'AVAILABLE' && viewingItem.requestStatus !== 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(viewingItem)} className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-full font-black uppercase text-[9px] tracking-widest border border-gray-100">Edit</button>
                    <button onClick={() => { if(confirm('Delete?')) { onDelete(viewingItem.id); setViewingItem(null); } }} className="flex-1 py-3 bg-red-50 text-red-300 rounded-full font-black uppercase text-[9px] tracking-widest border border-red-50">Delete</button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Decision Modals */}
      {confirmRequestItem && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-teal-400">
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 mx-auto border-4 border-white shadow-lg"><AlertTriangle size={40} /></div>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Apply to Buy</h3>
              <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-widest px-4">Send interest for "{confirmRequestItem.title}" to your neighbor?</p>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setConfirmRequestItem(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest">Back</button>
                <button onClick={handleConfirmRequest} className="flex-1 py-5 bg-teal-400 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectRequestItem && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-red-400">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight text-center">Deny Request</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">State a reason for the neighbor</p>
              <textarea 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Someone else just picked it up"
                className="w-full p-5 bg-gray-50 border-none rounded-3xl font-bold text-sm h-32 resize-none outline-none focus:ring-2 ring-red-100 shadow-inner"
              />
              <div className="flex gap-4 pt-4">
                <button onClick={() => { setRejectRequestItem(null); setRejectionReason(''); }} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest">Back</button>
                <button onClick={handleConfirmReject} disabled={!rejectionReason.trim()} className={`flex-1 py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${rejectionReason.trim() ? 'bg-red-500 text-white shadow-red-100 active:scale-95' : 'bg-gray-100 text-gray-300 opacity-50 cursor-not-allowed'}`}>Deny</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
