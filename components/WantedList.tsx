
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import { WantedItem, UserProfile, WantedComment } from '../types';
import { MARKET_GENRES, GENRE_ICONS } from '../constants';
import { Heart, Search, SlidersHorizontal, ChevronLeft, ChevronRight, MessageCircle, Send, Sparkles, Flame, Image as ImageIcon, Edit2, Trash2, MapPin, Clock, Lock, ArrowUpDown, Coins, Info } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';

interface Props {
  items: WantedItem[];
  profile: UserProfile;
  initialActiveItemId?: string | null;
  onEdit: (item: WantedItem) => void;
  onDelete: (id: string) => void;
  onAddComment: (itemId: string, text: string) => void;
  onViewProfile?: (userId: string) => void;
  onChatClose?: () => void;
}

const WantedItemCard = memo(({ item, onClick }: { item: WantedItem, onClick: () => void }) => {
  const isNew = differenceInHours(new Date(), new Date(item.createdAt)) <= 72;
  const isDiscounted = item.hopePriceUpdatedAt && 
                      item.previousHopePrice !== undefined && 
                      item.hopePrice > item.previousHopePrice && 
                      differenceInHours(new Date(), new Date(item.hopePriceUpdatedAt)) <= 72;

  return (
    <button onClick={onClick} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm text-left animate-fade-in active:scale-[0.98] transition-all flex flex-col relative group">
      <div className="relative aspect-square">
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
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
              <Sparkles size={8} /> NEW
            </div>
          )}
          {isDiscounted && (
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm flex items-center gap-0.5 animate-pulse">
              <Flame size={8} /> PRICE UP
            </div>
          )}
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

export const WantedList: React.FC<Props> = ({ items, profile, initialActiveItemId, onEdit, onDelete, onAddComment, onViewProfile, onChatClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');
  const [showFilters, setShowFilters] = useState(false);
  const [viewingItem, setViewingItem] = useState<WantedItem | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialActiveItemId) {
      const item = items.find(i => i.id === initialActiveItemId);
      if (item) setViewingItem(item);
    }
  }, [initialActiveItemId, items]);

  useEffect(() => {
    if (viewingItem) {
      const updated = items.find(i => i.id === viewingItem.id);
      if (updated) setViewingItem(updated);
    }
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedGenre !== 'All Genres' && item.genre !== selectedGenre) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, searchQuery, selectedGenre]);

  const handleSendComment = (itemId: string) => {
    const text = commentInputs[itemId];
    if (!text?.trim()) return;
    onAddComment(itemId, text);
    setCommentInputs(prev => ({ ...prev, [itemId]: '' }));
  };

  if (viewingItem) {
    const isOwner = viewingItem.userId === profile.uid;
    return (
      <div className="animate-fade-in space-y-6 pb-20 px-4 pt-4">
        <div className="flex items-center justify-between">
           <button 
             onClick={() => { setViewingItem(null); if(onChatClose) onChatClose(); }} 
             className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
           >
             <ChevronLeft size={16} /> Wanted Board
           </button>
           <button 
             onClick={() => onViewProfile && onViewProfile(viewingItem.userId)} 
             className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-amber-50 shadow-sm active:scale-90 transition-all shrink-0"
           >
             <span className="text-xl leading-none">{viewingItem.parentAvatarIcon}</span>
             <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter max-w-[50px] truncate text-center leading-none">
               {viewingItem.parentNickname}
             </span>
           </button>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm relative">
          {viewingItem.images && viewingItem.images.length > 0 ? (
            <div ref={galleryRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
              {viewingItem.images.map((img, i) => (
                <img key={i} src={img} className="w-full aspect-square object-cover snap-center shrink-0" alt={`View ${i}`} />
              ))}
            </div>
          ) : (
            <div className="aspect-square bg-amber-50 flex items-center justify-center text-amber-100">
               <Heart size={64} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Looking for</span>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter pt-2 leading-tight">{viewingItem.title}</h1>
              <p className="text-gray-400 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{viewingItem.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-amber-600 tracking-tighter">RM {viewingItem.hopePrice}</div>
              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Hope Price</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-400"><MapPin size={12}/><span className="text-[8px] font-black uppercase tracking-widest">Meeting</span></div>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{viewingItem.pickupLocation || 'Discuss in Chat'}</div>
            </div>
            <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-gray-400"><Clock size={12}/><span className="text-[8px] font-black uppercase tracking-widest">Wanted By</span></div>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-relaxed">{viewingItem.preferredTiming}</div>
            </div>
          </div>

          {/* Guidance message for other users in English */}
          {!isOwner && (
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed tracking-tight uppercase">
                  If you have this item and are willing to sell or give it away, please list it on the MARKET tab.
                </p>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="flex gap-4">
              <button onClick={() => onEdit(viewingItem)} className="flex-1 py-3.5 bg-gray-50 text-gray-400 rounded-[24px] font-black uppercase text-[10px] tracking-widest border border-gray-100 active:scale-95 shadow-sm flex items-center justify-center gap-2 transition-all">
                <Edit2 size={14}/> Edit
              </button>
              <button onClick={() => { if(confirm('Permanently delete this wishlist post?')) { onDelete(viewingItem.id); setViewingItem(null); if(onChatClose) onChatClose(); } }} className="flex-1 py-3.5 bg-red-50 text-red-300 rounded-[24px] font-black uppercase text-[10px] tracking-widest border border-red-50 active:scale-95 shadow-sm flex items-center justify-center gap-2 transition-all">
                <Trash2 size={14}/> Delete
              </button>
            </div>
          )}

          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2 px-1">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><MessageCircle size={14}/></div>
              <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">Discussion</h3>
            </div>

            <div className="space-y-4">
              {viewingItem.comments.map(c => {
                const isMe = c.userId === profile.uid;
                const isItemOwner = c.userId === viewingItem.userId;
                return (
                  <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{c.userAvatar}</div>
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter max-w-[44px] truncate text-center leading-tight">{c.userNickname}</span>
                    </div>
                    <div className={`p-4 rounded-[24px] text-[13px] shadow-sm max-w-[80%] ${isMe ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 border border-gray-100'}`}>
                      <div className={`text-[8px] font-black uppercase mb-1 opacity-80 ${isMe ? 'text-amber-50 text-right' : 'text-amber-500'}`}>
                        {isItemOwner ? 'Owner' : 'Neighbor'} • {format(new Date(c.createdAt), 'HH:mm')}
                      </div>
                      <div className="font-bold leading-relaxed whitespace-pre-wrap">{c.text}</div>
                    </div>
                  </div>
                );
              })}
              {viewingItem.comments.length === 0 && (
                <div className="py-12 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[44px] tracking-[0.2em] bg-white/40">No Messages Yet</div>
              )}
            </div>

            <div className="pt-6">
               <div className="flex gap-2 items-center bg-white p-2 rounded-[28px] border-2 border-amber-50 focus-within:border-amber-400 focus-within:ring-4 ring-amber-50 transition-all shadow-sm">
                  <input 
                    type="text" 
                    value={commentInputs[viewingItem.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [viewingItem.id]: e.target.value }))}
                    placeholder="Offer an item or ask details..."
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
              placeholder="Search wishlist..." 
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
            <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">Genres</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedGenre('All Genres')} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${selectedGenre === 'All Genres' ? 'bg-amber-400 text-white' : 'bg-gray-50 text-gray-400'}`}>All</button>
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
        {filteredItems.map((item) => (
          <WantedItemCard key={item.id} item={item} onClick={() => setViewingItem(item)} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-gray-100 mb-4 flex justify-center"><Heart size={64}/></div>
          <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">No wishlist items found</p>
        </div>
      )}
    </div>
  );
};
