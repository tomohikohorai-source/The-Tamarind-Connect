
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MarketItem, UserProfile, MarketComment } from '../types';
import { MARKET_GENRES, GENRE_ICONS } from '../constants';
import { ShoppingBag, Tag, MapPin, CreditCard, Clock, Edit2, Trash2, MessageCircle, Send, ChevronDown, ChevronUp, Sparkles, User, Image as ImageIcon, PackageCheck, CheckCircle2, Search, SlidersHorizontal, X, AlertTriangle, CheckCircle, Ban, ArrowUpDown, ChevronRight, Check, UserCircle } from 'lucide-react';
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

  // States for Transaction Room
  const [activeTransaction, setActiveTransaction] = useState<MarketItem | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Modals
  const [confirmRequestItem, setConfirmRequestItem] = useState<MarketItem | null>(null);
  const [rejectRequestItem, setRejectRequestItem] = useState<MarketItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Handle deep linking to chat
  useEffect(() => {
    if (initialActiveItemId) {
      const item = items.find(i => i.id === initialActiveItemId);
      if (item) setActiveTransaction(item);
    }
  }, [initialActiveItemId, items]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeTransaction?.comments]);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      if (filterStatus === 'RESERVED') {
        if (item.requestStatus !== 'PENDING' && item.status !== 'RESERVED') return false;
      } else if (filterStatus === 'AVAILABLE') {
        if (item.status !== 'AVAILABLE' || item.requestStatus === 'PENDING') return false;
      } else if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }

      if (filterStatus === 'ALL' && item.status === 'SOLD') return false;
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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All Genres');
    setSelectedCondition('Any Condition');
    setMaxPrice('');
    setSortBy('newest');
  };

  const handleConfirmRequest = () => {
    if (confirmRequestItem) {
      onStatusChange(confirmRequestItem.id, 'AVAILABLE', profile.uid);
      setConfirmRequestItem(null);
    }
  };

  const handleConfirmReject = () => {
    if (rejectRequestItem && rejectionReason.trim()) {
      onStatusChange(rejectRequestItem.id, 'AVAILABLE', '', rejectionReason);
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
      setActiveTransaction(null);
      if (onChatClose) onChatClose();
    }
  };

  // Helper to determine counterparty in the chat
  const counterparty = useMemo(() => {
    if (!activeTransaction) return null;
    const isSeller = profile.uid === activeTransaction.userId;
    return {
      uid: isSeller ? activeTransaction.buyerId : activeTransaction.userId,
      nickname: isSeller ? (activeTransaction.buyerNickname || 'Applicant') : activeTransaction.parentNickname,
      avatar: isSeller ? (activeTransaction.buyerAvatarIcon || '👤') : activeTransaction.parentAvatarIcon,
      role: isSeller ? 'Buyer' : 'Seller'
    };
  }, [activeTransaction, profile.uid]);

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
              <button onClick={clearFilters} className="text-[9px] font-black text-teal-500 uppercase">Reset All</button>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><ArrowUpDown size={10}/> Sort By</label>
              <div className="grid grid-cols-3 gap-2">
                {['newest', 'price_low', 'price_high'].map(id => (
                  <button key={id} onClick={() => setSortBy(id as any)} className={`py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${sortBy === id ? 'bg-teal-400 text-white border-teal-400' : 'bg-gray-50 text-gray-400 border-transparent'}`}>
                    {id === 'newest' ? 'Newest' : id === 'price_low' ? 'Price ↓' : 'Price ↑'}
                  </button>
                ))}
              </div>
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

      <div className="grid gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => {
            const isOwner = item.userId === profile.uid;
            const isBuyer = item.buyerId === profile.uid;
            const isReserved = item.status === 'RESERVED';
            const hasPendingRequest = item.requestStatus === 'PENDING';
            
            return (
              <div key={item.id} className={`bg-white rounded-[32px] overflow-hidden border shadow-sm relative animate-fade-in transition-all ${isReserved || hasPendingRequest ? 'border-orange-200 shadow-orange-50/50' : 'border-gray-100'}`}>
                <div className="relative">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt={item.title} className="w-full aspect-[4/3] object-cover" />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gray-50 flex items-center justify-center text-gray-200"><ImageIcon size={48} /></div>
                  )}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${item.status === 'AVAILABLE' ? (hasPendingRequest ? 'bg-teal-400 text-white' : 'bg-green-400 text-white') : 'bg-orange-400 text-white'}`}>
                      {hasPendingRequest ? 'REQUESTED' : item.status}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-teal-50">
                    <span className="text-teal-600 font-black text-xs">{item.type === 'FREE' ? 'FREE' : `RM ${item.price}`}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-800 tracking-tight leading-tight">{item.title}</h3>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-1">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <button onClick={() => onViewProfile && onViewProfile(item.userId)} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-lg">{item.parentAvatarIcon}</div>
                      <div className="text-left"><div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Unit</div><div className="text-[10px] font-black text-gray-600">{item.roomNumber}</div></div>
                    </button>
                    
                    <div className="flex gap-2">
                      {isOwner ? (
                        <>
                          {hasPendingRequest && (
                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => onViewProfile && item.buyerId && onViewProfile(item.buyerId)} 
                                  title="Check Buyer's ME Profile"
                                  className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-teal-50 hover:text-teal-500 transition-all border border-gray-200 shadow-sm"
                                >
                                  {item.buyerAvatarIcon ? <span className="text-xl">{item.buyerAvatarIcon}</span> : <UserCircle size={20}/>}
                                </button>
                                <button onClick={() => onStatusChange(item.id, 'RESERVED')} className="px-4 py-2 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-1 active:scale-95"><CheckCircle size={12}/> Approve</button>
                                <button onClick={() => setRejectRequestItem(item)} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase shadow-sm flex items-center gap-1 active:scale-95 border border-red-100"><X size={12}/> Deny</button>
                              </div>
                              <div className="text-[8px] font-black text-pink-500 uppercase tracking-widest">Check buyer profile before approving!</div>
                            </div>
                          )}
                          {isReserved && (
                            <button onClick={() => setActiveTransaction(item)} className="px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                              <MessageCircle size={14} /> Chat Room
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {item.status === 'AVAILABLE' && !hasPendingRequest && (
                            <button onClick={() => setConfirmRequestItem(item)} className="px-6 py-3 bg-teal-400 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95">Apply to Buy</button>
                          )}
                          {hasPendingRequest && isBuyer && (
                            <div className="px-5 py-3 bg-teal-50 text-teal-600 rounded-2xl text-[10px] font-black uppercase border border-teal-200">Awaiting Approval...</div>
                          )}
                          {isReserved && isBuyer && (
                            <button onClick={() => setActiveTransaction(item)} className="px-6 py-3 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95">
                              <MessageCircle size={16} /> Transaction
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-[44px] flex flex-col items-center justify-center gap-4">
            <ShoppingBag size={56} className="text-gray-100" />
            <span className="text-xs font-black text-gray-300 uppercase tracking-[0.25em]">No items found</span>
          </div>
        )}
      </div>

      {activeTransaction && counterparty && (
        <div className="fixed inset-0 z-[200] bg-white animate-slide-up flex flex-col h-[100dvh] overflow-hidden">
          <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <button onClick={() => { setActiveTransaction(null); if(onChatClose) onChatClose(); }} className="p-2 text-gray-400 active:scale-90"><X size={24} /></button>
            
            <button 
              onClick={() => onViewProfile && onViewProfile(counterparty.uid)}
              className="flex flex-col items-center gap-0.5 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-lg border border-orange-100 shadow-sm">{counterparty.avatar}</div>
                <div className="text-left">
                  <div className="text-xs font-black text-gray-800 line-clamp-1 uppercase tracking-tighter">{counterparty.nickname}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{counterparty.role} Profile</div>
                </div>
              </div>
            </button>

            <div className="w-10"></div> {/* Spacer */}
          </header>

          <div className="bg-orange-50/50 p-4 border-b border-orange-100 shrink-0">
             <div className="flex items-center justify-center gap-4 mb-3">
                <div className={`flex flex-col items-center gap-1 ${activeTransaction.buyerConfirmedCompletion ? 'text-green-500' : 'text-orange-500'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${activeTransaction.buyerConfirmedCompletion ? 'bg-green-500 text-white border-green-500' : 'bg-white border-orange-200'}`}>
                    {activeTransaction.buyerConfirmedCompletion ? <Check size={16}/> : '1'}
                  </div>
                  <span className="text-[8px] font-black uppercase">Received</span>
                </div>
                <div className="w-10 h-px bg-orange-200"></div>
                <div className={`flex flex-col items-center gap-1 ${activeTransaction.sellerConfirmedCompletion ? 'text-green-500' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${activeTransaction.sellerConfirmedCompletion ? 'bg-green-500 text-white border-green-500' : 'bg-white border-gray-100'}`}>
                    {activeTransaction.sellerConfirmedCompletion ? <Check size={16}/> : '2'}
                  </div>
                  <span className="text-[8px] font-black uppercase">Complete</span>
                </div>
             </div>
             {profile.uid === activeTransaction.buyerId ? (
                !activeTransaction.buyerConfirmedCompletion && (
                  <button onClick={() => handleBuyerCompletion(activeTransaction)} className="w-full py-3 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Confirm Item Received</button>
                )
             ) : (
                activeTransaction.buyerConfirmedCompletion && (
                  <button onClick={() => handleSellerCompletion(activeTransaction)} className="w-full py-3 bg-green-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Complete & Mark Sold</button>
                )
             )}
          </div>

          <div ref={chatScrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/30 hide-scrollbar">
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-orange-100 mb-2 shadow-sm text-center">
               <div className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Trading Item</div>
               <div className="text-[11px] font-bold text-gray-700 line-clamp-1">{activeTransaction.title}</div>
            </div>

            {activeTransaction.comments.map(c => (
              <div key={c.id} className={`flex gap-3 ${c.userId === profile.uid ? 'flex-row-reverse' : ''}`}>
                <button 
                  onClick={() => onViewProfile && onViewProfile(c.userId)}
                  className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm active:scale-90"
                >
                  {c.userAvatar}
                </button>
                <div className={`p-4 rounded-3xl text-[13px] shadow-sm max-w-[80%] ${c.userId === profile.uid ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                  <div className={`text-[8px] font-black uppercase mb-1 opacity-70 ${c.userId === profile.uid ? 'text-orange-50' : 'text-gray-400'}`}>
                    {c.userId === activeTransaction.userId ? 'Seller' : 'Buyer'} • {format(new Date(c.createdAt), 'HH:mm')}
                  </div>
                  <div className="font-bold leading-relaxed whitespace-pre-wrap">{c.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Fixed Input Area with safe padding */}
          <div className="p-4 pt-2 bg-white border-t border-gray-100 shrink-0 pb-12 sm:pb-8">
            <div className="flex gap-2 max-w-md mx-auto items-center bg-gray-50 p-2 rounded-[28px] border border-gray-200 focus-within:ring-2 ring-orange-100 transition-all">
              <input 
                type="text" 
                value={commentInputs[activeTransaction.id] || ''}
                onChange={e => setCommentInputs(prev => ({ ...prev, [activeTransaction.id]: e.target.value }))}
                placeholder="Type your message..."
                className="flex-grow bg-transparent border-none rounded-xl px-4 py-3 text-sm font-bold outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSendComment(activeTransaction.id)}
              />
              <button 
                onClick={() => handleSendComment(activeTransaction.id)} 
                disabled={!(commentInputs[activeTransaction.id] || '').trim()}
                className={`p-3 rounded-full shadow-lg active:scale-95 transition-all ${ (commentInputs[activeTransaction.id] || '').trim() ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modals */}
      {confirmRequestItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-teal-400">
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 mx-auto border-4 border-white shadow-lg"><AlertTriangle size={40} /></div>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Apply to Buy</h3>
              <p className="text-xs text-gray-400 font-bold leading-relaxed uppercase tracking-widest px-4">This will notify the neighbor of your interest in "{confirmRequestItem.title}".</p>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setConfirmRequestItem(null)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black uppercase text-[11px] tracking-widest">Back</button>
                <button onClick={handleConfirmRequest} className="flex-1 py-5 bg-teal-400 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-teal-100 active:scale-95">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectRequestItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[44px] p-10 w-full max-w-sm shadow-2xl animate-fade-in border-4 border-red-400">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight text-center">Deny Request</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">Please provide a reason for the neighbor</p>
              <textarea 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Someone else just picked it up"
                className="w-full p-5 bg-gray-50 border-none rounded-3xl font-bold text-sm h-32 resize-none outline-none focus:ring-2 ring-red-100"
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
