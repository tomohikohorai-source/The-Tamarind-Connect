
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, collection, query, orderBy, onSnapshot, addDoc, getDocs, where, limit, doc, getDoc, setDoc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';
import { ReadContent, ReadSeriesState, UserProfile } from '../types';
import { translations } from '../translations';
import { Book, Lightbulb, ChevronRight, Lock, Clock, History, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { PRE_CREATED_CONTENT } from '../src/constants/readContentData';

interface ReadTabProps {
  profile: UserProfile | null;
  language: 'en' | 'zh' | 'ko' | 'ja';
  onShowAuth: () => void;
  tabResetToggle?: boolean;
}

import { ReadSkeleton } from './Skeleton';

export const ReadTab: React.FC<ReadTabProps> = ({ profile, language, onShowAuth, tabResetToggle }) => {
  const t = translations[language];
  const [contents, setContents] = useState<ReadContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const isGeneratingRef = React.useRef(false);
  const lastCheckRef = React.useRef<number>(0);
  const [selectedItem, setSelectedItem] = useState<ReadContent | null>(null);
  const hasCleanedUpRef = React.useRef(false);

  useEffect(() => {
    setSelectedItem(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, 0);
  }, [tabResetToggle]);

  useEffect(() => {
    if (selectedItem) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 0);
    }
  }, [selectedItem?.id]);

  useEffect(() => {
    const q = query(collection(db, "readContent"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: ReadContent[] = [];
      snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as ReadContent));
      setContents(data);
      setLoading(false);
      
      // Check if we need to post today's content (only for signed in users to avoid permission errors)
      if (auth.currentUser) {
        checkAndPost(data);
      }

      // One-time cleanup for duplicates (only for signed in users)
      if (auth.currentUser && !hasCleanedUpRef.current && data.length > 0) {
        hasCleanedUpRef.current = true;
        const seen = new Set<string>();
        data.forEach(item => {
          const key = `${item.type}-${item.title}-${item.chapterNumber || ''}`;
          if (seen.has(key)) {
            deleteDoc(doc(db, "readContent", item.id)).catch(err => handleFirestoreError(err, OperationType.DELETE, `readContent/${item.id}`));
          } else {
            seen.add(key);
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "readContent");
    });
    return () => unsub();
  }, []);

  const checkAndPost = async (existingContents: ReadContent[]) => {
    if (isGeneratingRef.current) return;
    
    // Throttle checks to once every 30 seconds to prevent loops/jitter
    const nowTime = Date.now();
    if (nowTime - lastCheckRef.current < 30000) return;
    lastCheckRef.current = nowTime;

    const today = format(new Date(), 'yyyy-MM-dd');
    // Check for our specific pre-created content
    const preCreatedNovels = existingContents.filter(c => c.type === 'NOVEL' && c.seriesId === 'pre_created_series_1');
    const preCreatedColumns = existingContents.filter(c => c.type === 'COLUMN');

    const hasChapter1 = preCreatedNovels.some(n => n.chapterNumber === 1);
    const hasChapter2 = preCreatedNovels.some(n => n.chapterNumber === 2);
    const hasColumn1 = preCreatedColumns.some(c => c.title === PRE_CREATED_CONTENT.columns[0].title);
    const hasColumn2 = preCreatedColumns.some(c => c.title === PRE_CREATED_CONTENT.columns[1].title);

    // Requirement: 2 chapters/columns as of today.
    if (!hasChapter1 || !hasChapter2 || !hasColumn1 || !hasColumn2) {
      isGeneratingRef.current = true;
      try {
        await seedInitialContent(existingContents, today);
      } catch (error) {
        console.error("Failed to seed initial content:", error);
      } finally {
        isGeneratingRef.current = false;
      }
      return;
    }

    const hasTodayNovel = existingContents.some(c => c.type === 'NOVEL' && c.createdAt.startsWith(today));
    const hasTodayColumn = existingContents.some(c => c.type === 'COLUMN' && c.createdAt.startsWith(today));
    
    if (!hasTodayNovel || !hasTodayColumn) {
      if (existingContents.length > 0) {
        isGeneratingRef.current = true;
        setGenerating(true);
        try {
          await postDailyContent(today, hasTodayNovel, hasTodayColumn);
        } catch (error) {
          console.error("Failed to post daily content:", error);
        } finally {
          setGenerating(false);
          isGeneratingRef.current = false;
        }
      }
      return;
    }
  };

  const seedInitialContent = async (existingContents: ReadContent[], today: string) => {
    const novels = existingContents.filter(c => c.type === 'NOVEL' && c.seriesId === 'pre_created_series_1');
    const columns = existingContents.filter(c => c.type === 'COLUMN' && c.title.includes('Penang'));
    
    const stateDoc = await getDoc(doc(db, "readSeriesState", "current_novel"));
    let state: ReadSeriesState;
    
    if (!stateDoc.exists()) {
      state = {
        id: "current_novel",
        currentSeriesId: "pre_created_series_1",
        currentChapter: 1,
        lastGeneratedDate: "",
        characters: "",
        plotPoints: "",
        title: "The Penang Pearl"
      };
    } else {
      state = stateDoc.data() as ReadSeriesState;
    }

    const batch = [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0);
    const yesterdayStr = yesterday.toISOString();
    
    const todayDate = new Date();
    todayDate.setHours(10, 0, 0, 0);
    const todayStr = todayDate.toISOString();

    // Post Chapter 1 if missing
    if (!novels.some(n => n.chapterNumber === 1)) {
      const n1 = PRE_CREATED_CONTENT.novels[0];
      batch.push(addDoc(collection(db, "readContent"), {
        title: n1.title,
        content: n1.content,
        snippet: n1.snippet,
        type: 'NOVEL',
        chapterNumber: 1,
        seriesId: "pre_created_series_1",
        createdAt: yesterdayStr
      }));
    }

    // Post Chapter 2 if missing
    if (!novels.some(n => n.chapterNumber === 2)) {
      const n2 = PRE_CREATED_CONTENT.novels[1];
      batch.push(addDoc(collection(db, "readContent"), {
        title: n2.title,
        content: n2.content,
        snippet: n2.snippet,
        type: 'NOVEL',
        chapterNumber: 2,
        seriesId: "pre_created_series_1",
        createdAt: todayStr
      }));
    }

    // Post Column 1 if missing
    if (!columns.some(c => c.title === PRE_CREATED_CONTENT.columns[0].title)) {
      const c1 = PRE_CREATED_CONTENT.columns[0];
      batch.push(addDoc(collection(db, "readContent"), {
        title: c1.title,
        content: c1.content,
        snippet: c1.snippet,
        type: 'COLUMN',
        columnNumber: 1,
        createdAt: yesterdayStr
      }));
    }

    // Post Column 2 if missing
    if (!columns.some(c => c.title === PRE_CREATED_CONTENT.columns[1].title)) {
      const c2 = PRE_CREATED_CONTENT.columns[1];
      batch.push(addDoc(collection(db, "readContent"), {
        title: c2.title,
        content: c2.content,
        snippet: c2.snippet,
        type: 'COLUMN',
        columnNumber: 2,
        createdAt: todayStr
      }));
    }

    if (batch.length > 0) {
      await Promise.all(batch);
    }

    await setDoc(doc(db, "readSeriesState", "current_novel"), {
      ...state,
      currentSeriesId: "pre_created_series_1",
      currentChapter: 3,
      lastGeneratedDate: today
    });
  };

  const postDailyContent = async (today: string, skipNovel = false, skipColumn = false) => {
    // 1. Get Series State
    const stateDoc = await getDoc(doc(db, "readSeriesState", "current_novel"));
    let state: ReadSeriesState;
    
    if (!stateDoc.exists()) {
      // This case should be handled by seedInitialContent, but for safety:
      state = {
        id: "current_novel",
        currentSeriesId: "pre_created_series_1",
        currentChapter: 1,
        lastGeneratedDate: "",
        characters: "",
        plotPoints: "",
        title: "The Penang Pearl"
      };
      await setDoc(doc(db, "readSeriesState", "current_novel"), state);
    } else {
      state = stateDoc.data() as ReadSeriesState;
    }

    // Don't generate if already generated today (STRICT CHECK)
    if (state.lastGeneratedDate === today) return; 

    const batch = [];

    // 2. Post Novel Chapter from Pre-created list
    if (!skipNovel) {
      const chapterIndex = state.currentChapter - 1;
      if (chapterIndex >= 0 && chapterIndex < PRE_CREATED_CONTENT.novels.length) {
        const novelData = PRE_CREATED_CONTENT.novels[chapterIndex];
        
        // Logic for 15 chapters per story going forward
        let novelChapter = novelData.chapter;
        let seriesId = state.currentSeriesId;
        let displayTitle = novelData.title;

        // The user says 1-30 (The Penang Pearl) is fine as is.
        // From chapter 31 onwards, we treat every 15 chapters as a new story.
        if (state.currentChapter > 30) {
          const storyIndex = Math.floor((state.currentChapter - 31) / 15);
          const storyNumber = storyIndex + 3; // Story 1 & 2 are the first 30 chapters
          seriesId = `series_story_${storyNumber}`;
          novelChapter = ((state.currentChapter - 31) % 15) + 1;
          
          // Replace absolute chapter number in title with relative one
          displayTitle = displayTitle.replace(/^Chapter \d+: /, `Chapter ${novelChapter}: `);
        }

        batch.push(addDoc(collection(db, "readContent"), {
          title: displayTitle,
          content: novelData.content,
          snippet: novelData.snippet,
          type: 'NOVEL',
          chapterNumber: novelChapter,
          seriesId: seriesId,
          createdAt: new Date().toISOString()
        }));
      }
    }

    // 3. Post Column from Pre-created list
    if (!skipColumn) {
      const columnIndex = state.currentChapter - 1;
      if (columnIndex >= 0 && columnIndex < PRE_CREATED_CONTENT.columns.length) {
        const columnData = PRE_CREATED_CONTENT.columns[columnIndex];
        batch.push(addDoc(collection(db, "readContent"), {
          title: columnData.title,
          content: columnData.content,
          snippet: columnData.snippet,
          type: 'COLUMN',
          columnNumber: columnData.id,
          createdAt: new Date().toISOString()
        }));
      }
    }

    if (batch.length > 0) {
      await Promise.all(batch);
    }

    // 4. Update Series State
    await updateDoc(doc(db, "readSeriesState", "current_novel"), {
      currentChapter: state.currentChapter + 1,
      lastGeneratedDate: today
    });
  };

  const { latestNovel, latestColumn, archiveItems } = useMemo(() => {
    const sorted = [...contents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const novel = sorted.find(c => c.type === 'NOVEL');
    const column = sorted.find(c => c.type === 'COLUMN');
    
    const latestIds = new Set([novel?.id, column?.id].filter(Boolean));
    const archive = sorted.filter(item => !latestIds.has(item.id));
    
    return { latestNovel: novel, latestColumn: column, archiveItems: archive };
  }, [contents]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#fdfbf7]">
        <ReadSkeleton />
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
          <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="rotate-180 text-gray-400" size={24} />
          </button>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight truncate">{selectedItem.title}</h2>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-6 pb-24">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedItem.type === 'NOVEL' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
              {selectedItem.type === 'NOVEL' ? t.dailyNovel : t.penangColumn}
            </span>
            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
              <Clock size={10} />
              {format(new Date(selectedItem.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>

          <h1 className="text-2xl font-black text-gray-900 leading-tight">{selectedItem.title}</h1>

          <div className="prose prose-sm max-w-none prose-indigo">
            <div className="text-gray-700 leading-relaxed font-medium">
              <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]">
      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-500">
            <BookOpen size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.read}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Daily Stories<br/>& Insights
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Fresh content every day, curated for the community.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10 pb-24 min-h-[400px]">
          {/* Today's Picks */}
          {(latestNovel || latestColumn) ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} />
                  Latest Updates
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[latestNovel, latestColumn].filter(Boolean).map((item) => (
                  <button 
                    key={item!.id}
                    onClick={() => setSelectedItem(item!)}
                    className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4 group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item!.type === 'NOVEL' ? 'bg-indigo-50 text-indigo-500' : 'bg-teal-50 text-teal-500'}`}>
                        {item!.type === 'NOVEL' ? t.dailyNovel : t.penangColumn}
                      </span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{item!.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 font-medium">
                        {item!.snippet}...
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Archive */}
          {archiveItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <History size={14} />
                {t.archive}
              </h3>
              <div className="space-y-3">
                {archiveItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-50 hover:border-indigo-100 transition-all group active:scale-[0.99]"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'NOVEL' ? 'bg-indigo-50 text-indigo-400' : 'bg-teal-50 text-teal-400'}`}>
                      {item.type === 'NOVEL' ? <Book size={18} /> : <Lightbulb size={18} />}
                    </div>
                    <div className="flex-grow min-w-0 text-left">
                      <h4 className="text-xs font-black text-gray-700 truncate uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        {format(new Date(item.createdAt), 'MMM dd')} • {item.type === 'NOVEL' ? `Chapter ${item.chapterNumber}` : `Column ${item.columnNumber || ''}`}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-200 group-hover:text-indigo-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
