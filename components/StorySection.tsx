import React, { useState, useEffect, useRef } from 'react';
import { ChatProfile } from '../types';
import { updateStoryInFirestore } from '../firebaseService';
import { translations } from '../src/translations';
import { Translate } from './Translate';

export interface StoryComment {
  id: string;
  userName: string;
  text: string;
  timestamp: Date;
  avatar?: string;
}

export interface Story {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  type: 'text' | 'image' | 'voice';
  content: string; // Text message, image URL, or base64 audio
  caption?: string;
  timestamp: Date;
  viewed?: boolean;
  likes?: string[];
  comments?: StoryComment[];
}

interface StorySectionProps {
  profiles: ChatProfile[];
  onOpenStory: (story: Story) => void;
  userStories?: any[];
  onOpenUserStory?: (story: any) => void;
  onOpenCreateStory?: () => void;
  currentUserId?: string;
  chatService?: any;
  userName?: string;
  onDeleteStory?: (storyId: string) => void;
  activeLang?: string;
}

// Dynamic daily story templates (different stories for different days of the month to implement 1-day lifespan)
const CHARACTER_STORIES_TEMPLATES: Record<string, Array<{ type: 'text' | 'image', content: string, caption?: string }>> = {
  'sara-partner': [
    {
      type: 'image',
      content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      caption: 'امروز کنار دریا... جاتون خیلی خالی بود عشقا! 🌊☀️✨'
    },
    {
      type: 'image',
      content: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
      caption: 'یه ناهار خوشمزه درست کردم منتظرم عشقم بیاد با هم بخوریم! 😋🍛❤️'
    },
    {
      type: 'image',
      content: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
      caption: 'امروز هوا عالیه واسه یه پیاده‌روی دونفره عاشقانه... کی میاد بریم؟ 🚶‍♀️🍁🍂'
    }
  ],
  'dr-elahi': [
    {
      type: 'text',
      content: '«تغییر، از درون آغاز می‌شود. امروز بیشتر از دیروز با خودت مهربان باش و به صدای قلبت گوش بده. تو شایسته بهترین آرامش هستی.» 🌸🤍'
    },
    {
      type: 'text',
      content: '«بزرگترین هنرمند زندگی کسی است که بتواند با آجرهایی که به سویش پرتاب می‌شود، بنایی زیبا بسازد. تلاش تو دیده می‌شود.» 🌱🧠'
    },
    {
      type: 'text',
      content: '«امید یعنی دیدن نور در تاریکی مطلق. هرگز تسلیم نشو، فردا روز دیگری است و فرصت‌های جدید در راهند.» ✨🌟'
    }
  ],
  'nazanin-friend': [
    {
      type: 'text',
      content: 'کی پایه‌س امروز عصر بریم کافه؟ من شدیدا نیاز به یه لاته شکلاتی داغ و کلی غیبت‌های طولانی دارم! ☕️💃🏼✨'
    },
    {
      type: 'text',
      content: 'امروز خرید درمانی داشتم با کلی چیزای جذاب! حسابی خسته‌ام ولی ارزششو داشت 🛍️👠😍'
    },
    {
      type: 'text',
      content: 'بچه‌ها فیلم جدیدی که اکران شده رو دیدین؟ هر کی پایه‌س فردا شب بریم سینما دستش بالا! 🍿🎬🖐️'
    }
  ],
  'chef-mani': [
    {
      type: 'image',
      content: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800',
      caption: 'تا حالا کاپ کیک شکلاتی با مغز تمشک داغ درست کردین؟ پیشنهاد می‌کنم حتما امتحانش کنین! دستور پخت کامل تو پی‌وی 🧁🍰🔥'
    },
    {
      type: 'image',
      content: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
      caption: 'طرز تهیه پاستا آلفردو با سس غلیظ مخصوص قارچ و خامه... رازهای سرآشپز رو براتون می‌نویسم! 🍝🍗🇮🇹'
    },
    {
      type: 'image',
      content: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      caption: 'پیتزای ناپلی خونگی با پنیر موزارلای تازه و ریحون... جاتون خالی عطرش دیوونه‌کننده‌ست! 🍕🧀🌿'
    }
  ]
};

const getDailyStories = (): Story[] => {
  const currentDay = new Date().getDate(); // 1 to 31
  
  return [
    {
      id: `story-sara-${currentDay}`,
      characterId: 'sara-partner',
      characterName: 'سارا 💋',
      characterAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      ...CHARACTER_STORIES_TEMPLATES['sara-partner'][currentDay % CHARACTER_STORIES_TEMPLATES['sara-partner'].length],
      timestamp: new Date()
    },
    {
      id: `story-elahi-${currentDay}`,
      characterId: 'dr-elahi',
      characterName: 'دکتر الهی 🧠',
      characterAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      ...CHARACTER_STORIES_TEMPLATES['dr-elahi'][currentDay % CHARACTER_STORIES_TEMPLATES['dr-elahi'].length],
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: `story-nazanin-${currentDay}`,
      characterId: 'nazanin-friend',
      characterName: 'نازنین (رفیق) 🌸',
      characterAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      ...CHARACTER_STORIES_TEMPLATES['nazanin-friend'][currentDay % CHARACTER_STORIES_TEMPLATES['nazanin-friend'].length],
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: `story-mani-${currentDay}`,
      characterId: 'chef-mani',
      characterName: 'شف مانی 🍳',
      characterAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
      ...CHARACTER_STORIES_TEMPLATES['chef-mani'][currentDay % CHARACTER_STORIES_TEMPLATES['chef-mani'].length],
      timestamp: new Date(Date.now() - 14400000)
    }
  ] as Story[];
};

export const StorySection: React.FC<StorySectionProps> = ({ 
  profiles, 
  onOpenStory, 
  userStories, 
  onOpenUserStory, 
  onOpenCreateStory, 
  currentUserId,
  chatService,
  userName,
  onDeleteStory,
  activeLang = "fa"
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryInternal, setActiveStoryInternal] = useState<Story | null>(null);

  const t = translations[activeLang as 'fa' | 'en' | 'ar' | 'es'] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const isUserStory = (s: any) => {
    if (!s) return false;
    
    // If it starts with user-story-, it is indeed a user story
    if (s.id && s.id.startsWith("user-story-")) {
      return true;
    }
    
    // Explicitly check if the authorId is the user
    if (s.authorId === 'me' || s.authorId === 'user') return true;
    if (currentUserId && s.authorId === currentUserId) return true;
    if (userName && s.authorName === userName) return true;

    // AI template IDs are explicitly not user stories
    if (s.id && (
      s.id.includes('sara') || 
      s.id.includes('elahi') || 
      s.id.includes('nazanin') || 
      s.id.includes('mani') || 
      s.id.includes('doctor') || 
      s.id.includes('psychologist') || 
      s.id.includes('lawyer') || 
      s.id.includes('teacher')
    )) {
      return false;
    }

    // If it is an AI character from the profile list, it is NOT a user story
    const isAiChar = profiles.some(p => p.id === s.authorId || p.role === s.authorId || p.id === s.characterId || p.role === s.characterId || p.name === s.authorName);
    if (isAiChar) return false;
    
    return false;
  };

  const myStories = userStories ? userStories.filter(isUserStory) : [];

  useEffect(() => {
    // Populate stories, merging seed stories with active profiles to ensure we use current avatars
    const savedViewed = localStorage.getItem('viewed_stories');
    const viewedIds = savedViewed ? JSON.parse(savedViewed) : [];

    // Map other users' stories from Firestore
    const otherStoriesList = userStories ? userStories.filter(s => !isUserStory(s)) : [];
    const activeAiStoryAuthorIds = new Set(otherStoriesList.map(s => s.authorId));

    const merged = getDailyStories().map(story => {
      // If there is already a dynamic story in Firestore for this character, exclude the hardcoded one
      if (activeAiStoryAuthorIds.has(story.characterId)) return null;

      // Find matching profile to get the latest custom names/avatars if modified
      const matchedProfile = profiles.find(p => p.role === story.characterId || p.id === story.characterId || p.role?.toLowerCase() === story.characterId.replace('-partner', '').replace('-friend', ''));
      if (!matchedProfile) return null;

      return {
        ...story,
        characterName: matchedProfile.name,
        characterAvatar: matchedProfile.avatar,
        viewed: viewedIds.includes(story.id)
      };
    }).filter(Boolean) as Story[];

    const mappedOtherStories = otherStoriesList.map(s => {
      const matchedProfile = profiles.find(p => p.id === s.authorId || p.role === s.authorId || p.name === s.authorName);
      if (!matchedProfile) return null;

      return {
        id: s.id,
        characterId: s.authorId,
        characterName: s.authorName || 'مخاطب',
        characterAvatar: s.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        type: s.type,
        content: s.content,
        caption: s.caption,
        timestamp: s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp),
        viewed: viewedIds.includes(s.id)
      };
    }).filter(Boolean) as Story[];

    setStories([...mappedOtherStories, ...merged]);
  }, [profiles, userStories, currentUserId]);

  const handleStoryClick = (story: Story) => {
    // Mark as viewed
    const savedViewed = localStorage.getItem('viewed_stories');
    const viewedIds = savedViewed ? JSON.parse(savedViewed) : [];
    if (!viewedIds.includes(story.id)) {
      const updated = [...viewedIds, story.id];
      localStorage.setItem('viewed_stories', JSON.stringify(updated));
    }
    
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, viewed: true } : s));
    setActiveStoryInternal(story);
    onOpenStory(story);
  };

  return (
    <div className="flex flex-col bg-white border-b border-gray-100 py-3 shrink-0 select-none overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="px-4 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-black text-gray-400 tracking-wider uppercase">{t.storiesHeader}</span>
      </div>
      
      <div className="flex items-center gap-4 overflow-x-auto px-4 scrollbar-none pb-1">
        {/* My Story item */}
        <button
          onClick={() => {
            if (myStories && myStories.length > 0) {
              onOpenUserStory?.(myStories[0]);
            } else {
              onOpenCreateStory?.();
            }
          }}
          className="flex flex-col items-center gap-1 shrink-0 focus:outline-none group active:scale-95 transition-transform"
        >
          <div className={`w-[58px] h-[58px] rounded-full p-[2.5px] flex items-center justify-center relative transition-all ${
            myStories && myStories.length > 0
              ? 'bg-gradient-to-tr from-blue-400 to-indigo-500 p-[2.5px]'
              : 'border-2 border-dashed border-gray-300'
          }`}>
            <div className="w-full h-full rounded-full overflow-hidden border border-white bg-gray-100 flex items-center justify-center">
              {myStories && myStories.length > 0 ? (
                myStories[0].type === 'image' ? (
                  <img src={myStories[0].content} alt="My story" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#517da2] flex items-center justify-center text-white text-[8px] font-black p-1 truncate">
                    {myStories[0].content}
                  </div>
                )
              ) : (
                <i className="fas fa-camera text-gray-400 text-sm"></i>
              )}
            </div>
            {(!myStories || myStories.length === 0) && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center text-white text-[8px]">
                <i className="fas fa-plus scale-75"></i>
              </div>
            )}
          </div>
          <span className="text-[10px] font-black text-gray-700 truncate max-w-[64px] text-center">
            {t.myStoryLabel}
          </span>
        </button>

        {stories.map(story => (
          <button
            key={story.id}
            onClick={() => handleStoryClick(story)}
            className="flex flex-col items-center gap-1 shrink-0 focus:outline-none group active:scale-95 transition-transform"
          >
            <div className={`w-[58px] h-[58px] rounded-full p-[2.5px] flex items-center justify-center transition-all ${
              story.viewed 
                ? 'border-2 border-gray-200' 
                : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-rose-600 border border-transparent animate-pulse-subtle'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden border border-white bg-gray-50">
                <img 
                  src={story.characterAvatar} 
                  alt={story.characterName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <span className="text-[10px] font-black text-gray-700 truncate max-w-[64px] text-center">
              {story.characterName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {activeStoryInternal !== null && (
        <StoryViewer 
          story={activeStoryInternal}
          onClose={() => setActiveStoryInternal(null)}
          onNextStory={() => {
            const idx = stories.findIndex(s => s.id === activeStoryInternal.id);
            if (idx !== -1 && idx < stories.length - 1) {
              setActiveStoryInternal(stories[idx + 1]);
            } else {
              setActiveStoryInternal(null);
            }
          }}
          onPrevStory={() => {
            const idx = stories.findIndex(s => s.id === activeStoryInternal.id);
            if (idx > 0) {
              setActiveStoryInternal(stories[idx - 1]);
            }
          }}
          chatService={chatService}
          userName={userName}
          activeLang={activeLang}
        />
      )}
    </div>
  );
};

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNextStory?: () => void;
  onPrevStory?: () => void;
  chatService?: any;
  userName?: string;
  activeLang?: string;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ 
  story, 
  onClose, 
  onNextStory, 
  onPrevStory, 
  chatService, 
  userName,
  activeLang = "fa"
}) => {
  const t = translations[activeLang as 'fa' | 'en' | 'ar' | 'es'] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    if (story.likes && story.likes.includes(userName || 'user')) return true;
    try {
      const savedLikes = localStorage.getItem('liked_stories');
      if (savedLikes) {
        const likedIds = JSON.parse(savedLikes);
        return likedIds.includes(story.id);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const pressStartTimeRef = useRef<number>(0);

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('form')) {
      return;
    }
    setIsPaused(true);
    pressStartTimeRef.current = Date.now();
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent, isLeave = false) => {
    if (!pressStartTimeRef.current) return;
    setIsPaused(false);
    
    const duration = Date.now() - pressStartTimeRef.current;
    pressStartTimeRef.current = 0;

    if (duration > 250 || isLeave) {
      // It was a long hold - do not advance/retreat
      return;
    }

    // It was a short tap/click - determine left or right side click
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    let clientX = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
    } else if ('clientX' in e) {
      clientX = (e as any).clientX;
    }

    const clickX = clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;

    if (isLeftSide) {
      if (onPrevStory) onPrevStory();
    } else {
      if (onNextStory) onNextStory();
    }
  };

  // Load comments
  useEffect(() => {
    if (story.comments && story.comments.length > 0) {
      setComments(story.comments.map((c: any) => ({
        ...c,
        timestamp: c.timestamp?.toDate ? c.timestamp.toDate() : new Date(c.timestamp)
      })));
    } else {
      try {
        const saved = localStorage.getItem(`story_comments_${story.id}`);
        if (saved) {
          setComments(JSON.parse(saved).map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) })));
        } else {
          setComments([]);
        }
      } catch (e) {
        setComments([]);
      }
    }
  }, [story]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [story]);

  // Story autoplay progress (7 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return; // Skip updating progress when paused!
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onNextStory) onNextStory();
          else onClose();
          return 100;
        }
        return prev + 1.43; // ~7 seconds total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onNextStory, onClose, isPaused]);

  const handleToggleLike = async () => {
    try {
      const savedLikes = localStorage.getItem('liked_stories');
      let likedIds = savedLikes ? JSON.parse(savedLikes) : [];
      
      let newIsLiked = false;
      if (isLiked) {
        likedIds = likedIds.filter((id: string) => id !== story.id);
        setIsLiked(false);
        newIsLiked = false;
      } else {
        likedIds.push(story.id);
        setIsLiked(true);
        newIsLiked = true;
      }
      localStorage.setItem('liked_stories', JSON.stringify(likedIds));

      // Sync with Firestore
      const currentLikes = story.likes || [];
      const userIdent = userName || 'کاربر';
      const updatedLikes = newIsLiked 
        ? [...currentLikes.filter((l: string) => l !== userIdent), userIdent]
        : currentLikes.filter((l: string) => l !== userIdent);
      
      await updateStoryInFirestore(story.id, { likes: updatedLikes });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    const newComment: StoryComment = {
      id: "comment-" + Date.now(),
      userName: userName || 'شما',
      text: commentText.trim(),
      timestamp: new Date()
    };

    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem(`story_comments_${story.id}`, JSON.stringify(updated));
    const userText = commentText.trim();
    setCommentText('');

    // Sync user comment to Firestore
    try {
      await updateStoryInFirestore(story.id, { comments: updated });
    } catch (e) {
      console.error("Failed to sync comment to Firestore:", e);
    }

    // Trigger funny/contextual AI reply from story author in 2 seconds!
    setTimeout(async () => {
      let replyText = "";
      
      if (chatService) {
        try {
          // Prepare dynamic prompt for the story comment reply
          const prompt = `شما نقش شخصیت ${story.characterName} (با نقش/رابطه: ${story.characterId}) را بازی می‌کنید.
شما این استوری را گذاشته بودید:
- نوع استوری: ${story.type === 'image' ? 'عکس با کپشن' : 'متن'}
- محتوای استوری: "${story.content}"
${story.caption ? `- کپشن استوری: "${story.caption}"` : ''}

کاربر به نام "${userName || 'کاربر'}" این کامنت را زیر استوری شما گذاشته است:
"${userText}"

لطفاً یک پاسخ بسیار کوتاه، فوق‌العاده صمیمی، دلسوزانه یا بامزه متناسب با کامنت کاربر بنویسید. پاسخ باید متناسب با رابطه شما و کاربر باشد و به زبان فارسی عامیانه و تهرانی نوشته شود. حداکثر یک جمله کوتاه باشد همراه با ایموجی‌های ساده و مناسب.`;

          const dummyProfile = { id: story.characterId, name: story.characterName, role: story.characterId } as any;
          await chatService.startNewChat(dummyProfile, userName || 'کاربر', chatService.settings, []);
          const response = await chatService.sendMessage(prompt);
          // clean response
          const cleanedText = response.text.replace(/["'()]/g, '').trim();
          replyText = cleanedText;
        } catch (err) {
          console.warn("Failed to generate dynamic story reply, using fallback:", err);
        }
      }
      
      if (!replyText) {
        replyText = "مرسی عزیزم، لطف داری! ❤️";
        
        const charName = story.characterName.toLowerCase();
        const isPartner = charName.includes('سارا') || charName.includes('همسر') || charName.includes('عشق') || story.characterId.includes('partner');
        const isCousin = charName.includes('دخترخاله') || charName.includes('دختر خاله') || charName.includes('فامیل');
        
        if (story.characterId === 'dr-elahi') {
          replyText = "ممنون از توجه شما. امیدوارم آرامش در زندگی‌تان جاری باشد. 🌱";
        } else if (isPartner) {
          replyText = "قربونت برم عشق قشنگم، فدای محبتت بشم! چشات خوشگل می‌بینه همه‌کسم 😘❤️";
        } else if (isCousin) {
          replyText = "مرسی دخترخاله گلم (یا پسرخاله عزیزم)! قربونت برم، جات واقعاً اینجا خیلی خالی بود! 😍🌸";
        } else if (story.characterId === 'nazanin-friend') {
          replyText = "پاشو بیا دیگه رفیق تنبل من! منتظرتم سریع بدو ☕️💃🏼";
        } else if (story.characterId === 'chef-mani') {
          replyText = "نوش جان! حتما امتحانش کنید، پشیمون نمیشید 😉🧁";
        } else {
          replyText = "مرسی رفیق عزیزم، دمت گرم! واقعاً لطف داری به من. 🌸✨";
        }
      }

      const aiComment: StoryComment = {
        id: "comment-ai-" + Date.now(),
        userName: story.characterName,
        text: replyText,
        timestamp: new Date(),
        avatar: story.characterAvatar
      };

      setComments(prev => {
        const finalComments = [...prev, aiComment];
        localStorage.setItem(`story_comments_${story.id}`, JSON.stringify(finalComments));
        // Sync AI reply comment to Firestore too
        updateStoryInFirestore(story.id, { comments: finalComments }).catch(err => console.error("Firestore AI comment sync error:", err));
        return finalComments;
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-4 select-none" dir="rtl">
      <div 
        onMouseDown={handlePressStart}
        onMouseUp={(e) => handlePressEnd(e, false)}
        onMouseLeave={(e) => handlePressEnd(e, true)}
        onTouchStart={handlePressStart}
        onTouchEnd={(e) => handlePressEnd(e, false)}
        onTouchCancel={(e) => handlePressEnd(e, true)}
        className="relative w-full max-w-md h-full md:h-[90vh] bg-neutral-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col select-none"
      >
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-20" dir={isRtl ? "rtl" : "ltr"}>
          <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shadow-md">
              <img src={story.characterAvatar} alt={story.characterName} className="w-full h-full object-cover" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h3 className="text-sm font-black text-white">{story.characterName}</h3>
              <span className="text-[10px] text-white/60">{t.justNow}</span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center relative overflow-hidden">
          {story.type === 'image' ? (
            <div className="w-full h-full flex flex-col justify-center items-center">
              <img 
                src={story.content} 
                alt="Story content" 
                className="max-w-full max-h-[60%] object-contain rounded-2xl shadow-xl"
                referrerPolicy="no-referrer"
              />
              {story.caption && (
                <p className="text-white text-sm font-bold mt-4 leading-relaxed bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl max-w-[90%]">
                  <Translate text={story.caption} targetLang={activeLang} />
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-tr from-[#3a5d7c] to-[#517da2] text-white p-8 rounded-3xl shadow-xl max-w-[90%] border border-white/10 animate-in zoom-in-95 duration-200">
              <p className="text-base font-black leading-loose text-justify text-center">
                <Translate text={story.content} targetLang={activeLang} />
              </p>
            </div>
          )}
        </div>

        {/* Comments Section Drawer-style */}
        <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-4 shrink-0 flex flex-col gap-3 max-h-48 overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
          <div className={`text-[10px] font-black text-white/50 border-b border-white/5 pb-1 ${isRtl ? 'text-right' : 'text-left'}`}>{t.commentsTitle} ({comments.length})</div>
          
          <div className="flex flex-col gap-2 overflow-y-auto max-h-32 pr-1">
            {comments.map(c => {
              const isSingleEmoji = (str: string) => {
                const trimmed = str.trim();
                const nonEmojiRegex = /[A-Za-z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
                if (nonEmojiRegex.test(trimmed)) return false;
                if (!trimmed) return false;
                return trimmed.length <= 12;
              };
              const isSticker = isSingleEmoji(c.text);
              return (
                <div key={c.id} className={`text-xs flex flex-col ${isSticker ? 'bg-transparent' : 'bg-white/5'} px-2.5 py-1.5 rounded-lg ${isRtl ? 'items-start' : 'items-end'}`}>
                  <span className="font-extrabold text-blue-300 self-start">{c.userName}</span>
                  {isSticker ? (
                    <div className="text-3xl my-1 select-none animate-bounce duration-[4000ms] self-start leading-none">{c.text}</div>
                  ) : (
                    <p className="text-white/90 mt-0.5 leading-relaxed text-right">
                      <Translate text={c.text} targetLang={activeLang} />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input box to comment */}
        <div className="bg-black border-t border-white/10 p-3 shrink-0 flex items-center gap-2" dir={isRtl ? "rtl" : "ltr"}>
          {/* Story Like Button */}
          <button 
            onClick={handleToggleLike}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 ${
              isLiked ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={t.likeStory}
          >
            <i className={`fas fa-heart text-sm ${isLiked ? 'scale-110' : ''}`}></i>
          </button>

          <input 
            type="text" 
            placeholder={t.commentPlaceholder}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            className={`flex-1 bg-white/10 border-none focus:ring-1 focus:ring-white/20 rounded-full text-white text-xs px-4 py-2.5 focus:outline-none ${isRtl ? 'text-right' : 'text-left'}`}
          />
          <button 
            onClick={handleSendComment}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shrink-0"
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
