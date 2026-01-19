
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Skill, UserProfile, SkillComment } from '../types';
import { SKILL_CATEGORIES, SKILL_ICONS } from '../constants';
// Added ChevronRight to the import list
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, User, MessageCircle, Send, Plus, X, ArrowUpDown, Lock, BookOpen, Star, Info, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  skills: Skill[];
  profile: UserProfile;
  initialActiveSkillId?: string | null;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  onAddComment: (skillId: string, text: string) => void;
  onViewProfile?: (userId: string) => void;
  onChatClose?: () => void;
}

export const SkillExchange: React.FC<Props> = ({ skills, profile, initialActiveSkillId, onEdit, onDelete, onAddComment, onViewProfile, onChatClose }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'OFFER' | 'REQUEST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [showFilters, setShowFilters] = useState(false);
  
  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialActiveSkillId) {
      const skill = skills.find(s => s.id === initialActiveSkillId);
      if (skill) setViewingSkill(skill);
    }
  }, [initialActiveSkillId, skills]);

  useEffect(() => {
    if (viewingSkill) {
      const updated = skills.find(s => s.id === viewingSkill.id);
      if (updated) setViewingSkill(updated);
    }
  }, [skills]);

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      if (filterType !== 'ALL' && skill.type !== filterType) return false;
      if (searchQuery && !skill.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== 'All Categories' && skill.category !== selectedCategory) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [skills, filterType, searchQuery, selectedCategory]);

  const handleSendComment = (skillId: string) => {
    const text = commentInputs[skillId];
    if (!text?.trim()) return;
    onAddComment(skillId, text);
    setCommentInputs(prev => ({ ...prev, [skillId]: '' }));
  };

  if (viewingSkill) {
    const isMine = viewingSkill.userId === profile.uid;
    return (
      <div className="animate-fade-in space-y-6 pb-32 px-4 pt-4">
        <div className="flex items-center justify-between">
           <button 
             onClick={() => { setViewingSkill(null); if(onChatClose) onChatClose(); }} 
             className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
           >
             <ChevronLeft size={16} /> Skill Board
           </button>
           <button onClick={() => onViewProfile && onViewProfile(viewingSkill.userId)} className="p-2 text-indigo-500 bg-white rounded-2xl border border-indigo-50 shadow-sm active:scale-90 transition-all flex items-center gap-2">
             <span className="text-[10px] font-black uppercase tracking-widest">{viewingSkill.parentNickname}</span>
             <span className="text-xl">{viewingSkill.parentAvatarIcon}</span>
           </button>
        </div>

        <div className="bg-white p-6 rounded-[32px] border-2 border-indigo-50 shadow-lg space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${viewingSkill.type === 'OFFER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                {viewingSkill.type === 'OFFER' ? 'Skill Provider' : 'Requesting Help'}
              </span>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter pt-2 leading-tight">{viewingSkill.title}</h1>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                {SKILL_ICONS[viewingSkill.category]} {viewingSkill.category}
              </div>
            </div>
            <div className="text-right shrink-0">
               <div className="text-[14px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">{viewingSkill.price}</div>
            </div>
          </div>
          <p className="text-gray-400 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{viewingSkill.description}</p>
          
          {isMine && (
            <div className="flex gap-4 pt-2">
              <button onClick={() => onEdit(viewingSkill)} className="flex-1 py-3.5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-gray-100 shadow-sm active:scale-95 transition-all">Edit Info</button>
              <button onClick={() => { if(confirm('Delete?')) { onDelete(viewingSkill.id); setViewingSkill(null); } }} className="flex-1 py-3.5 bg-red-50 text-red-300 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-50 shadow-sm active:scale-95 transition-all">Delete Post</button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><MessageSquare size={14}/></div>
            <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">Interest & Chat</h3>
          </div>

          <div className="space-y-4">
            {viewingSkill.comments.map(c => {
              const isMe = c.userId === profile.uid;
              return (
                <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm">{c.userAvatar}</div>
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
              <div className="py-12 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[44px] tracking-[0.2em] bg-white/40">No messages yet. Say hello!</div>
            )}
          </div>

          <div className="pt-6">
             <div className="flex gap-2 items-center bg-white p-2 rounded-[28px] border-2 border-indigo-50 focus-within:border-indigo-400 focus-within:ring-4 ring-indigo-50 transition-all shadow-sm">
                <input 
                  type="text" 
                  value={commentInputs[viewingSkill.id] || ''}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [viewingSkill.id]: e.target.value }))}
                  placeholder="Ask for details or express interest..."
                  className="flex-grow bg-transparent border-none px-4 py-3 text-sm font-bold outline-none placeholder:text-gray-300"
                  onKeyDown={e => e.key === 'Enter' && handleSendComment(viewingSkill.id)}
                />
                <button 
                  onClick={() => handleSendComment(viewingSkill.id)} 
                  disabled={!(commentInputs[viewingSkill.id] || '').trim()}
                  className={`p-3 rounded-full shadow-lg active:scale-90 transition-all ${ (commentInputs[viewingSkill.id] || '').trim() ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-300'}`}
                >
                  <Send size={18} />
                </button>
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
              placeholder="Search skills..." 
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
              <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Exchange Filters</h4>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All Categories'); setFilterType('ALL'); }} className="text-[9px] font-black text-indigo-500 uppercase">Reset</button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-3 bg-gray-50 border-none rounded-xl text-[11px] font-black outline-none appearance-none">
                <option>All Categories</option>
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['ALL', 'OFFER', 'REQUEST'].map((f) => (
            <button key={f} onClick={() => setFilterType(f as any)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === f ? 'bg-indigo-400 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 shadow-sm'}`}>
              {f === 'ALL' ? 'ALL SKILLS' : f === 'OFFER' ? 'PROVIDERS' : 'RESOURCES NEEDED'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSkills.map(skill => (
          <button key={skill.id} onClick={() => setViewingSkill(skill)} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm text-left animate-fade-in active:scale-[0.98] transition-all flex items-center gap-4 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-12 h-12 flex items-center justify-center opacity-10 rotate-12 ${skill.type === 'OFFER' ? 'text-indigo-500' : 'text-orange-500'}`}>
               <BookOpen size={48} fill="currentColor" />
            </div>
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${skill.type === 'OFFER' ? 'bg-indigo-50 border border-indigo-100' : 'bg-orange-50 border border-orange-100'}`}>
               {SKILL_ICONS[skill.category] || '🌟'}
            </div>
            
            <div className="flex-grow min-w-0 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${skill.type === 'OFFER' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                  {skill.type}
                </span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Unit {skill.roomNumber}</span>
              </div>
              <h3 className="text-[15px] font-black text-gray-800 truncate tracking-tight">{skill.title}</h3>
              <div className="text-[10px] font-bold text-indigo-400 line-clamp-1">{skill.price} • {skill.category}</div>
            </div>
            
            <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight size={20} className="text-indigo-300" />
            </div>
          </button>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="py-24 text-center">
          <div className="text-gray-100 mb-4 flex justify-center"><Star size={64}/></div>
          <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">No skill listings found</p>
        </div>
      )}
    </div>
  );
};
