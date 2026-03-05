
import React, { useState, useRef } from 'react';
import { UserProfile, WantedItem } from '../types';
import { MARKET_GENRES } from '../constants';
import { ChevronLeft, X, Package, Info, Camera, Trash2, Coins, Layers, ShieldAlert, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  profile: UserProfile;
  initialItem?: WantedItem;
  onSubmit: (item: WantedItem) => void;
  onCancel: () => void;
}

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; // Updated from 800 to 400 for better performance
      const MAX_HEIGHT = 400; // Updated from 800 to 400 for better performance
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

export const WantedItemForm: React.FC<Props> = ({ profile, initialItem, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialItem?.title || '');
  const [genre, setGenre] = useState(initialItem?.genre || MARKET_GENRES[0]);
  const [description, setDescription] = useState(initialItem?.description || '');
  const [hopePrice, setHopePrice] = useState(initialItem?.hopePrice?.toString() || '10');
  const [images, setImages] = useState<string[]>(initialItem?.images || []);
  const [preferredTiming, setPreferredTiming] = useState(initialItem?.preferredTiming || format(new Date(), 'yyyy-MM-dd'));
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 3 - images.length;
    const selectedFiles = (Array.from(files) as File[]).slice(0, remainingSlots);
    setIsCompressing(true);
    const newImages: string[] = [];
    for (const file of selectedFiles) {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file as Blob);
      });
      const compressed = await compressImage(base64);
      newImages.push(compressed);
    }
    setImages(prev => [...prev, ...newImages]);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentHopePrice = Math.max(0, Number(hopePrice));
    const isPriceChanged = initialItem && currentHopePrice !== initialItem.hopePrice;
    
    const itemData: any = {
      id: initialItem?.id || crypto.randomUUID(),
      userId: profile.uid,
      parentNickname: profile.parentNickname,
      roomNumber: profile.roomNumber,
      parentAvatarIcon: profile.avatarIcon,
      title,
      genre,
      description,
      hopePrice: currentHopePrice,
      pickupLocation: '', // Removed preference field
      preferredTiming,
      images,
      comments: initialItem?.comments || [],
      status: initialItem?.status || 'OPEN',
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (isPriceChanged && initialItem) {
        itemData.previousHopePrice = initialItem.hopePrice;
        itemData.hopePriceUpdatedAt = new Date().toISOString();
    } else if (initialItem?.previousHopePrice !== undefined) {
        itemData.previousHopePrice = initialItem.previousHopePrice;
        itemData.hopePriceUpdatedAt = initialItem.hopePriceUpdatedAt;
    }

    onSubmit(itemData as WantedItem);
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-amber-50 hide-scrollbar relative">
      <div className="flex justify-between items-center mb-10">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-500 font-black text-xs bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 uppercase tracking-widest shadow-sm active:scale-95 transition-all"><ChevronLeft size={18} /> Back</button>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">{initialItem ? 'Edit Wanted' : 'Post Wanted'}</h2>
        <button onClick={onCancel} className="text-gray-300"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-widest ml-1">Example Image (Optional)</label>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-100 shadow-sm shrink-0">
                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white rounded-full backdrop-blur-sm"><X size={12} /></button>
              </div>
            ))}
            {images.length < 3 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isCompressing} className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-amber-400 hover:text-amber-400 transition-all shrink-0 active:scale-95">
                {isCompressing ? <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div> : <Camera size={24} />}
                <span className="text-[8px] font-black uppercase">Add Photo</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">What are you looking for?</label>
            <div className="relative">
              <Package className="absolute left-4 top-3.5 text-amber-200" size={18} />
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Please fill in this field')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="e.g. Baby Stroller" 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-amber-50" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Genre</label>
            <div className="relative">
              <Layers className="absolute left-4 top-3.5 text-amber-200" size={18} />
              <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 ring-amber-50">
                {MARKET_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Hope Price (RM)</label>
            <div className="relative">
              <Coins className="absolute left-4 top-3.5 text-amber-200" size={18} />
              <input 
                type="number" 
                min="0" 
                value={hopePrice} 
                onChange={e => setHopePrice(e.target.value)} 
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Please fill in this field')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                placeholder="10" 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-black text-lg text-amber-600 focus:ring-2 ring-amber-50" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Additional details</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Color, brand, or condition you want..." className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-medium text-sm h-24 resize-none focus:ring-2 ring-amber-50" />
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Wanted By</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 text-amber-200" size={18} />
              <input 
                type="date" 
                min={today}
                value={preferredTiming} 
                onChange={e => setPreferredTiming(e.target.value)} 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-amber-50" 
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-amber-600 leading-relaxed uppercase tracking-widest text-left">
              Neighbors who have this item and are willing to sell or give it away might list it on the MARKET for you!
            </p>
          </div>
        </div>

        <button type="submit" className="w-full py-5 rounded-[28px] font-black bg-amber-400 text-white shadow-2xl shadow-amber-100 uppercase tracking-[0.2em] text-[13px] active:scale-95 transition-all">Submit Wishlist Post</button>
      </form>
    </div>
  );
};
