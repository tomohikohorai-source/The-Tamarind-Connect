
import React, { useState, useRef } from 'react';
import { UserProfile, Skill } from '../types';
import { SKILL_CATEGORIES, SKILL_ICONS, CONDO_OPTIONS } from '../constants';
import { store } from '../services/store';
import { ChevronLeft, X, BookOpen, MessageSquare, ShieldAlert, Award, CreditCard, Layers, Building2, Camera } from 'lucide-react';

import { Language, translations } from '../translations';

interface Props {
  profile: UserProfile;
  language?: Language;
  initialSkill?: Skill;
  onSubmit: (skill: Skill) => void;
  onCancel: () => void;
}

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
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
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
  });
};

export const SkillForm: React.FC<Props> = ({ profile, language = 'en', initialSkill, onSubmit, onCancel }) => {
  const t = translations[language];
  const [title, setTitle] = useState(initialSkill?.title || '');
  const [category, setCategory] = useState(initialSkill?.category || SKILL_CATEGORIES[0]);
  const [description, setDescription] = useState(initialSkill?.description || '');
  const [type, setType] = useState<'OFFER' | 'REQUEST'>(initialSkill?.type || 'OFFER');
  const [price, setPrice] = useState(initialSkill?.price || 'Free');
  const [images, setImages] = useState<string[]>(initialSkill?.images || []);
  const [isCompressing, setIsCompressing] = useState(false);
  const [condoId, setCondoId] = useState(initialSkill?.condoId || profile.condoId || 'tamarind-penang');
  const [customCondoName, setCustomCondoName] = useState(initialSkill?.customCondoName || (initialSkill?.condoId === 'Other-Penang' ? '' : (profile.condoId === 'Other-Penang' ? profile.customCondoName : '')));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - images.length;
    const selectedFiles = (Array.from(files) as File[]).slice(0, remainingSlots);

    setIsCompressing(true);
    const newImages: string[] = [];
    for (const file of selectedFiles) {
      const reader = new FileReader();
      const base64: string = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file as Blob);
      });
      const compressed = await compressImage(base64);
      newImages.push(compressed);
    }
    setImages(prev => [...prev, ...newImages]);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Numeric comparison for DISCOUNT tracking
    const getNum = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
    const currentVal = getNum(price);
    const oldVal = initialSkill ? getNum(initialSkill.price) : 0;

    const isPriceReduced = initialSkill && currentVal > 0 && oldVal > 0 && currentVal < oldVal;
    const priceUpdatedAt = isPriceReduced ? new Date().toISOString() : initialSkill?.priceUpdatedAt;
    const previousPrice = isPriceReduced ? initialSkill.price : initialSkill?.previousPrice;

    // Clean construction to avoid undefined properties
    const skillData: any = {
      id: initialSkill?.id || crypto.randomUUID(),
      userId: profile.uid,
      condoCode: profile.condoCode || store.getPasscode() || '',
      condoId: condoId,
      customCondoName: condoId === 'Other-Penang' ? customCondoName : '',
      parentNickname: profile.parentNickname,
      parentAvatarIcon: profile.avatarIcon,
      roomNumber: profile.roomNumber,
      title,
      category,
      description,
      type,
      status: initialSkill?.status || 'AVAILABLE',
      requestStatus: initialSkill?.requestStatus || 'NONE',
      price,
      images,
      comments: initialSkill?.comments || [],
      createdAt: initialSkill?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (previousPrice !== undefined) skillData.previousPrice = previousPrice;
    if (priceUpdatedAt !== undefined) skillData.priceUpdatedAt = priceUpdatedAt;
    if (initialSkill?.requesterId) {
      skillData.requesterId = initialSkill.requesterId;
      skillData.requesterNickname = initialSkill.requesterNickname;
      skillData.requesterAvatarIcon = initialSkill.requesterAvatarIcon;
    }

    onSubmit(skillData as Skill);
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-indigo-50 hide-scrollbar relative">
      <div className="flex justify-between items-center mb-10">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-500 font-black text-xs bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 uppercase tracking-widest shadow-sm active:scale-95 transition-all"><ChevronLeft size={18} /> {t.back}</button>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">{initialSkill ? t.updateSkill : t.shareSkill}</h2>
        <button onClick={onCancel} className="text-gray-300"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-widest ml-1">Images (Max 3)</label>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm shrink-0">
                <img src={img} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white rounded-full backdrop-blur-sm"><X size={12} /></button>
              </div>
            ))}
            {images.length < 3 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isCompressing} className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-indigo-400 hover:text-indigo-400 transition-all shrink-0 active:scale-95">
                {isCompressing ? <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> : <Camera size={24} />}
                <span className="text-[8px] font-black uppercase">{isCompressing ? t.loading : t.add}</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
          </div>
        </div>

        <div className="flex gap-3">
          {[
            { id: 'OFFER', label: t.iCanHelp },
            { id: 'REQUEST', label: t.iNeedHelp }
          ].map(t_btn => (
            <button key={t_btn.id} type="button" onClick={() => setType(t_btn.id as any)} className={`flex-1 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest ${type === t_btn.id ? 'bg-indigo-400 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 text-gray-400'}`}>{t_btn.label}</button>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.condoLocation}</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <select 
                value={condoId} 
                onChange={e => setCondoId(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 ring-indigo-50"
              >
                {CONDO_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
            {condoId === 'Other-Penang' && (
              <div className="animate-fade-in mt-2">
                <input 
                  type="text" 
                  value={customCondoName} 
                  onChange={e => setCustomCondoName(e.target.value)} 
                  placeholder="Enter condominium name" 
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border-2 border-indigo-100 outline-none font-bold text-sm" 
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.heading}</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-indigo-50" required />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.category}</label>
            <div className="relative">
              <Layers className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 ring-indigo-50"
              >
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.reward}</label>
            <div className="relative">
              <Award className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-indigo-50" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.aboutSkill}</label>
            <p className="text-[9px] text-gray-400 font-bold italic mb-2 ml-1">{t.translationNotice}</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="..." className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-medium text-sm h-32 resize-none focus:ring-2 ring-indigo-50" />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
              {t.skillDisclaimer}
            </p>
          </div>
        </div>

        <button type="submit" className="w-full py-5 rounded-[28px] font-black bg-indigo-400 text-white shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-[13px] active:scale-95 transition-all">{t.submitSkill}</button>
      </form>
    </div>
  );
};
