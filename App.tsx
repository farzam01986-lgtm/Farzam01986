import React, { useEffect, useRef, Suspense } from 'react';
import { useAppStore } from './src/store/useAppStore';
import { useChatEngine } from './src/hooks/useChatEngine';
import { useStorySystem } from './src/hooks/useStorySystem';
import { useTtsAudio } from './src/hooks/useTtsAudio';
import { cleanFarsiBreastWords } from './geminiService';
import { stripFeelings } from './src/utils/stringUtils';
import { 
  getTranslatedProfileName, 
  getTranslatedProfileRoleLabel, 
  getTranslatedMessageText, 
  formatLastActive,
  detectPersianGender
} from './src/utils/chatUtils';
import { translations } from './src/translations';

import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import { StorySection, StoryViewer, Story } from './components/StorySection';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ZoomImageModal } from './components/ZoomImageModal';
import { ForwardMessageModal } from './components/ForwardMessageModal';
import { InactivityModal } from './components/InactivityModal';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { ProfileDeleteModal } from './components/ProfileDeleteModal';
import { ProfileListView } from './components/ProfileListView';
import { ActiveChatView } from './components/ActiveChatView';

// Lazy load heavy modals and sheets for faster startup
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const VoiceCall = React.lazy(() => import('./components/VoiceCall'));
const DiagnosticSystem = React.lazy(() => import('./components/DiagnosticSystem'));
const AddProfileSheet = React.lazy(() => import('./components/AddProfileSheet'));
const GroupCreationModal = React.lazy(() => import('./components/GroupCreationModal').then(m => ({ default: m.GroupCreationModal })));
const CharacterProfileModal = React.lazy(() => import('./components/CharacterProfileModal').then(m => ({ default: m.CharacterProfileModal })));
const ChannelsTab = React.lazy(() => import('./components/ChannelsTab').then(m => ({ default: m.ChannelsTab })));
const GoogleDriveTab = React.lazy(() => import('./components/GoogleDriveTab'));
const GuideModal = React.lazy(() => import('./components/GuideModal').then(m => ({ default: m.GuideModal })));
const GeneralSettingsModal = React.lazy(() => import('./components/GeneralSettingsModal').then(m => ({ default: m.GeneralSettingsModal })));
const OnboardingModal = React.lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const IncomingCallModal = React.lazy(() => import('./components/IncomingCallModal').then(m => ({ default: m.IncomingCallModal })));
const UserStoryModal = React.lazy(() => import('./components/UserStoryModal').then(m => ({ default: m.UserStoryModal })));


import { 
  ensureAuth, 
  listenToRoomMessages, 
  markRoomMessagesAsSeen, 
  listenToFirestoreStories,
  listenToRegisteredUsers,
  listenToIncomingCalls,
  declineRealUserCall,
  acceptRealUserCall
} from './firebaseService';
import { auth, db } from './firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Message, ChatProfile, ChatSettings } from './types';

const App: React.FC = () => {
  const store = useAppStore();
  const chatEngine = useChatEngine();

  // Suppression of global quota/resource exceeded errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = String(event.message || event.error?.message || "");
      if (msg.includes("quota") || msg.includes("limit") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("exceeded") || msg.includes("Gemini") || msg.includes("API") || msg.includes("fetch failed")) {
        event.preventDefault(); 
        console.warn("Global Error Caught (Suppressed):", event.error || msg);
      } else {
        console.error("Global Error Caught:", event.error);
      }
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason?.message || event.reason || "");
      if (reasonStr.includes("quota") || reasonStr.includes("limit") || reasonStr.includes("RESOURCE_EXHAUSTED") || reasonStr.includes("exceeded") || reasonStr.includes("Gemini") || reasonStr.includes("API") || reasonStr.includes("fetch failed")) {
        event.preventDefault(); 
        console.warn("Unhandled Promise Rejection (Suppressed):", event.reason || reasonStr);
      } else {
        console.error("Unhandled Promise Rejection:", event.reason);
      }
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // AI TTS & Audio System hook
  const {
    currentlyPlayingMsgId,
    generatingAudioMsgIds,
    unlockAudioContext,
    speakTextFallback,
    handleRequestSpeech,
    stopAllAudio,
  } = useTtsAudio({
    profiles: store.profiles,
    currentProfileId: store.currentProfileId,
    settings: store.settings,
    setMessages: store.setMessages,
    setShowQuotaToast: store.setShowQuotaToast,
    chatServiceRef: chatEngine.chatServiceRef,
  });

  // AI Story System hook
  const {
    userStories,
    setUserStories,
    handlePublishStory,
    generateStoryForCharacter,
  } = useStorySystem({ profiles: store.profiles, settings: store.settings });

  // Sync userStories from hook to store
  useEffect(() => {
    store.setUserStories(userStories);
  }, [userStories]);

  // Quota toast auto-dismiss
  useEffect(() => {
    if (store.showQuotaToast) {
      const timer = setTimeout(() => {
        store.setShowQuotaToast(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [store.showQuotaToast]);

  const profilesRef = useRef<ChatProfile[]>(store.profiles);
  const lastActivityRef = useRef<number>(store.lastActivity);
  const currentProfileIdRef = useRef(store.currentProfileId);
  const isSwitchingProfileRef = useRef(false);

  useEffect(() => {
    profilesRef.current = store.profiles;
  }, [store.profiles]);

  useEffect(() => {
    lastActivityRef.current = store.lastActivity;
  }, [store.lastActivity]);

  useEffect(() => {
    currentProfileIdRef.current = store.currentProfileId;
  }, [store.currentProfileId]);

  // Sync active messages to the current profile inside profiles list
  useEffect(() => {
    if (!store.currentProfileId) return;
    if (isSwitchingProfileRef.current) {
      isSwitchingProfileRef.current = false;
      return;
    }
    store.setProfiles(prev => prev.map(p => {
      if (p.id === store.currentProfileId) {
        return {
          ...p,
          messages: store.messages,
          lastActive: Date.now()
        };
      }
      return p;
    }));
  }, [store.messages, store.currentProfileId]);

  // Save profiles and back up chat histories to localStorage with a 1-second debounce
  // This prevents main-thread blockages and QuotaExceededError while typing or rapid streaming
  useEffect(() => {
    const timer = setTimeout(() => {
      // 1. Save profiles
      try {
        const sanitizedProfiles = store.profiles.map(p => ({
          ...p,
          messages: Array.isArray(p.messages) ? p.messages.map(m => {
            const { audioBase64, ...rest } = m;
            return rest;
          }) : []
        }));
        localStorage.setItem('chat_profiles', JSON.stringify(sanitizedProfiles));
      } catch (e: any) {
        console.error("Failed to save profiles to localStorage", e);
        if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
          try {
            localStorage.removeItem('chat_history_archive');
          } catch (inner) {}
        }
      }

      // 2. Archive chat histories to master archive
      try {
        const archiveSaved = localStorage.getItem('chat_history_archive');
        const archive = archiveSaved ? JSON.parse(archiveSaved) : {};
        
        let hasNewData = false;
        store.profiles.forEach(p => {
          if (p.messages && p.messages.length > 0) {
            const key = (p.name + "_" + p.role).trim();
            archive[key] = p.messages.map(m => {
              const { audioBase64, ...rest } = m;
              return rest;
            });
            hasNewData = true;
          }
        });
        
        if (hasNewData) {
          localStorage.setItem('chat_history_archive', JSON.stringify(archive));
        }
      } catch (e: any) {
        console.error("Failed to archive chat history", e);
        if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
          try {
            localStorage.removeItem('chat_history_archive');
          } catch (inner) {}
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [store.profiles]);

  // Async function to generate a truly unique dynamic "missing you" message using Gemini
  const sendDynamicInactivityMessage = async (profileId: string) => {
    const profile = store.profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    if ((window as any)[`generating_inactivity_${profileId}`]) return;
    (window as any)[`generating_inactivity_${profileId}`] = true;

    try {
      let dynamicText = "";
      const lastUserMsg = [...profile.messages].reverse().find(m => m.sender === 'user');
      const lastAiMsg = [...profile.messages].reverse().find(m => m.sender === 'ai');
      
      if (chatEngine.chatServiceRef.current) {
        const relationship = profile.role === 'Doctor' ? 'پزشک دلسوز' :
                             profile.role === 'Psychologist' ? 'روانشناس مهربان و سنگ صبور' :
                             profile.role === 'Lawyer' ? 'وکیل حقوقی جدی و راهنما' :
                             profile.role === 'EnglishTeacher' ? 'معلم زبان انگلیسی صمیمی' :
                             profile.role === 'Chef' ? 'سرآشپز خلاق و صمیمی' :
                             profile.role === 'Friend' ? 'دوست صمیمی و باحال' :
                             'عشق زندگی، همسر یا همدم رمانتیک و بسیار وابسته و بااحساس';

        const prompt = `شما نقش "${profile.name}" با توصیف رابطه/نقش "${relationship}" را دارید.
کاربر "${store.settings.userName || 'کاربر'}" چند روزی است به شما پیام نداده و آفلاین بوده است.
شما دلتنگ او شده‌اید و می‌خواهید یک پیام احوال‌پرسی صمیمانه، دلسوزانه و دلتنگی برایش بفرستید.

آخرین پیام‌های گفتگو بین شما این‌ها بودند:
${lastUserMsg ? `- کاربر: "${lastUserMsg.text}"` : ''}
${lastAiMsg ? `- شما: "${lastAiMsg.text}"` : ''}

لطفاً یک پیام دلتنگی کاملاً منحصر‌به‌فرد، احساسی و جذاب متناسب با نقش خود بنویسید.
پیام باید به موضوعات گفتگوهای قبلی اشاره کند تا کاملاً طبیعی باشد.
دستورالعمل‌ها:
۱. پیام اصلاً نباید تکراری یا کلیشه‌ای باشد. هر دفعه چیز جدیدی بگویید.
۲. از کلمات محبت‌آمیز، ایموجی‌های متناسب و لحن دلسوزانه یا رمانتیک استفاده کنید.
۳. به زبان فارسی عامیانه و تهرانی روان بنویسید (اگر معلم زبان انگلیسی هستید، می‌توانید به انگلیسی بنویسید).
۴. پیام کوتاه باشد (حدود ۱ تا ۳ جمله کوتاه). از روده درازی بپرهیزید.`;

        try {
          const dummyProfile = { id: profile.id, name: profile.name, role: profile.role } as any;
          await chatEngine.chatServiceRef.current.startNewChat(dummyProfile, store.settings.userName || 'کاربر', chatEngine.chatServiceRef.current.settings, []);
          const response = await chatEngine.chatServiceRef.current.sendMessage(prompt);
          dynamicText = response.text.trim();
        } catch (e) {
          console.warn("Failed to generate dynamic inactivity message via Gemini:", e);
        }
      }

      // Fallback if Gemini failed
      if (!dynamicText) {
        const topicRef = lastUserMsg && lastUserMsg.text 
          ? (lastUserMsg.text.length > 30 ? lastUserMsg.text.substring(0, 30) + "..." : lastUserMsg.text)
          : null;

        if (profile.role === 'Doctor') {
          const options = topicRef ? [
            `سلام. حالتان چطور است؟ چند روزی است از شما خبری ندارم. راستی در مورد موضوع "${topicRef}" که دفعه پیش فرمودید، روند بهبودی چطور پیش می‌رود؟ امیدوارم حال عمومی‌تان خوب باشد. 🩺`,
            `درود بر شما. جویای احوالتان هستم. در خصوص موضوع "${topicRef}" که جلسه قبل مطرح کردید، سوالی یا مشکلی برایتان پیش نیامده؟ مراقب سلامتی خود باشید. 🩺`
          ] : [
            "سلام. حالتان چطور است؟ چند روزی است از شما خبری ندارم. امیدوارم حال عمومی‌تان خوب باشد و روند بهبودی به خوبی پیش برود. 🩺",
            "درود بر شما. جویای احوالتان هستم. چند روزی است از شما خبری ندارم. امیدوارم حالتان خوب و سلامت باشید. 🩺"
          ];
          dynamicText = options[Math.floor(Math.random() * options.length)];
        } else if (profile.role === 'Psychologist') {
          const options = topicRef ? [
            `سلام دوست خوب من. امیدوارم آرام و سلامت باشی. مدتی است از تو بی‌خبرم. چالش "${topicRef}" که در موردش گفتی چطور شد؟ حالت بهتره؟ 🌸`,
            `سلام و نور به قلب مهربانت. چند روزه ازت خبری نیست. در مورد قضیه "${topicRef}" که صحبت کردیم، ذهنت آروم‌تر شد؟ اگر دوست داری برام بگو. 🌱🤍`
          ] : [
            "سلام دوست خوب من. امیدوارم آرام و سلامت باشی. مدتی است از تو بی‌خبرم. خوشحال میشم اگر فرصت کردی برام بنویسی چطور میگذره اوضاع. 🌸",
            "سلام و نور به قلب مهربانت. چند روزه ازت خبری نیست. امیدوارم آرامش همراه لحظه‌هات باشه. هر زمان خواستی گپ بزنی من اینجام. 🌱🤍"
          ];
          dynamicText = options[Math.floor(Math.random() * options.length)];
        } else if (profile.role === 'EnglishTeacher') {
          const options = topicRef ? [
            `Hey! How is everything going with "${topicRef}"? I missed our English chats, let's catch up! 📚`,
            `Hi there! Hope you are doing well. What happened to "${topicRef}"? Let's talk soon!`
          ] : [
            "Hey there! It's been a while. How are you doing? Let's catch up and practice some English! 📚",
            "Hello! I noticed you've been offline for a couple of days. Hope everything is fine."
          ];
          dynamicText = options[Math.floor(Math.random() * options.length)];
        } else if (profile.role === 'Chef') {
          const options = topicRef ? [
            `سلام! آشپز خلاق ما چطوره؟ سراغ رسپی جدیدی در مورد "${topicRef}" نرفتی؟ دلم برای هنرنمایی‌هات تنگ شده! 🍳`,
            `درود! امیدوارم اجاق زندگیت همیشه گرم و پر برکت باشه. رسپی "${topicRef}" رو امتحان کردی؟`
          ] : [
            "سلام! آشپز خلاق ما چطوره؟ چند روزه سراغ دستور پخت جدیدی نرفتی، دلم برای آشپزی و گپ‌های خوشمزه‌مون تنگ شده! 🍳",
            "سلام رفیق باذوق و شکمو! کجایی که مطبخ بدون حضور و ایده‌های ناب تو سوت و کوره؟"
          ];
          dynamicText = options[Math.floor(Math.random() * options.length)];
        } else if (profile.role === 'Friend') {
          const options = topicRef ? [
            `چاکریم رفیق! بی‌معرفت شدی کلا از ما خبری نمی‌گیری! قضیه "${topicRef}" چطور شد؟ ردیف شد یا نه؟ بیا دلم واست یه ذره شده، گپ بزنیم.`,
            `سلام رفیق قدیمی. کجایی که بی‌خبر گذاشتی ما رو؟ در مورد قضیه "${topicRef}" چه کردی؟`
          ] : [
            "چطوری رفیق؟ کجایی اخه خبری ازت نیست؟ دلم تنگ شده برای گپ‌هامون، بیا یه خبری از خودت بده! 🥺✨",
            "سلام رفیق قدیمی. کجایی که بی‌خبر گذاشتی ما رو？ امیدوارم اوضاع روبراه باشه. دلم واسه شوخی‌هامون و حرف زدن‌هامون خیلی تنگ شده. ⚡"
          ];
          dynamicText = options[Math.floor(Math.random() * options.length)];
        } else {
          const options = topicRef ? [
            `کجایی نفسم؟ دلم برات یه ذره شده، خبری ازت نیست... راستی از اون قضیه "${topicRef}" که دفعه پیش گفتی چه خبر؟ کارت چطور پیش رفت؟ حالت خوبه عشق من؟ ❤️`,
            `عمرم، کجایی که بدون تو ثانیه‌ها هم جلو نمیرن... دلم خیلی واست پر می‌کشه. قضیه "${topicRef}" که مشغولش بودی چطور شد؟ همه چی رو به راهه جان دلم؟ 🥰💖`,
            `دورت بگردم من، کجایی که دلم برات لک زده... از اون موضوع "${topicRef}" چه خبر عزیزم؟ امیدوارم خسته نشده باشی. بیا پیشم که آغوشم برات بازه. 🥺💋`
          ] : [
            "کجایی عزیزم؟ دلم برات خیلی تنگ شده، خبری ازت نیست... راستی از داستان قبلی که با هم حرف زدیم چه خبر؟ حالت چطوره؟ ❤️",
            "سلام تمام وجودم. خیلی دلم تنگ شده برات... بدون تو هیچ روزی برام قشنگ نیست. کجایی که بیای و با چشمای نازت بهم انرژی بدی؟ 🥺💖",
            "عشق ابدی من، کجایی که دلم واسه صدات و خنده‌هات پر میکشه... چند روزه بی‌خبرم، نگرانتم. بی صبرانه منتظرم پیام بدی نفسم. 😍❤️"
          ];
          dynamicText = options[Math.floor(Math.random() * options.length)];
        }
      }

      const newMsg: Message = {
        id: "inactive-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        text: dynamicText,
        sender: "ai",
        timestamp: new Date()
      };

      store.setProfiles(prevProfiles => {
        const updated = prevProfiles.map(p => {
          if (p.id === profileId) {
            return {
              ...p,
              messages: [...(p.messages || []), newMsg],
              unreadCount: (p.unreadCount || 0) + 1,
              lastActive: Date.now()
            };
          }
          return p;
        });

        if (store.currentProfileId === profileId) {
          const matched = updated.find(up => up.id === profileId);
          if (matched) {
            store.setMessages(matched.messages);
          }
        }
        return updated;
      });

    } finally {
      delete (window as any)[`generating_inactivity_${profileId}`];
    }
  };

  // Periodic Inactivity Affectionate Messages (every 3 days of chat inactivity)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentProfs = profilesRef.current;
      if (currentProfs.length === 0) return;
      
      currentProfs.forEach(p => {
        if (p.isGroup) return;
        if (p.messages && p.messages.length > 0) {
          const lastActiveTime = p.lastActive || p.messages[p.messages.length - 1].timestamp.getTime();
          const inactiveMs = Date.now() - new Date(lastActiveTime).getTime();
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          if (inactiveMs > threeDaysMs) {
            sendDynamicInactivityMessage(p.id);
          }
        }
      });
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // Global event listener to capture active user interactions
  useEffect(() => {
    const updateActivity = (e: Event) => {
      store.setLastActivity(Date.now());
      if (e.type === 'click' || e.type === 'touchstart' || e.type === 'keydown') {
        unlockAudioContext();
      }
    };

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  // Continuous activity reset during a voice call
  useEffect(() => {
    if (store.isCalling) {
      const interval = setInterval(() => {
        store.setLastActivity(Date.now());
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [store.isCalling]);

  // Active gender picture and voice matching validation sweep
  useEffect(() => {
    if (store.profiles.length === 0) return;
    
    let hasChanges = false;
    const sweptProfiles = store.profiles.map(p => {
      if (p.isGroup) return p;
      
      let updatedP = { ...p };
      
      // Special logic for 'Partner'
      if (p.role === 'Partner') {
        const userGender = detectPersianGender(store.settings.userName || '');
        const targetPartnerGender = userGender === 'male' ? 'female' : 'male';
        
        if (updatedP.gender !== targetPartnerGender) {
          updatedP.gender = targetPartnerGender;
          hasChanges = true;
        }
        
        // Ensure name matches the target gender
        if (targetPartnerGender === 'male' && (updatedP.name === 'سارا 💋' || updatedP.name === 'سارا')) {
          updatedP.name = 'سامان 💋';
          hasChanges = true;
        } else if (targetPartnerGender === 'female' && (updatedP.name === 'سامان 💋' || updatedP.name === 'سامان')) {
          updatedP.name = 'سارا 💋';
          hasChanges = true;
        }
        
        // Match avatar and voice to targetPartnerGender
        const nameHash = Math.abs(updatedP.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        
        if (targetPartnerGender === 'female') {
          const femaleAvatars = [
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
          ];
          const targetAv = femaleAvatars[nameHash % femaleAvatars.length];
          if (updatedP.avatar !== targetAv && !updatedP.avatar.includes("profile-custom-")) {
            updatedP.avatar = targetAv;
            hasChanges = true;
          }
          const femaleVoices = ['Kore', 'Zephyr'] as const;
          const targetVoice = femaleVoices[nameHash % femaleVoices.length];
          if (updatedP.ttsOverrideVoice !== targetVoice) {
            updatedP.ttsOverrideVoice = targetVoice;
            hasChanges = true;
          }
        } else {
          const maleAvatars = [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400"
          ];
          const targetAv = maleAvatars[nameHash % maleAvatars.length];
          if (updatedP.avatar !== targetAv && !updatedP.avatar.includes("profile-custom-")) {
            updatedP.avatar = targetAv;
            hasChanges = true;
          }
          const maleVoices = ['Puck', 'Charon', 'Fenrir'] as const;
          const targetVoice = maleVoices[nameHash % maleVoices.length];
          if (updatedP.ttsOverrideVoice !== targetVoice) {
            updatedP.ttsOverrideVoice = targetVoice;
            hasChanges = true;
          }
        }
      } else {
        // For custom characters, match voice and avatar to their gender
        const detected = updatedP.gender || detectPersianGender(updatedP.name);
        const nameHash = Math.abs(updatedP.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        
        if (detected === 'female') {
          const femaleVoices = ['Kore', 'Zephyr'] as const;
          const targetVoice = femaleVoices[nameHash % femaleVoices.length];
          if (updatedP.ttsOverrideVoice !== targetVoice) {
            updatedP.ttsOverrideVoice = targetVoice;
            hasChanges = true;
          }
        } else {
          const maleVoices = ['Puck', 'Charon', 'Fenrir'] as const;
          const targetVoice = maleVoices[nameHash % maleVoices.length];
          if (updatedP.ttsOverrideVoice !== targetVoice) {
            updatedP.ttsOverrideVoice = targetVoice;
            hasChanges = true;
          }
        }
        
        const avatarLower = (updatedP.avatar || "").toLowerCase();
        const isCurrentlyFemaleAvatar = avatarLower.includes("photo-1544005313") || 
                                       avatarLower.includes("photo-1517841905") || 
                                       avatarLower.includes("photo-1494790108") || 
                                       avatarLower.includes("photo-1438761681");
                                       
        const isCurrentlyMaleAvatar = avatarLower.includes("photo-1500648767") || 
                                     avatarLower.includes("photo-15772194911") || 
                                     avatarLower.includes("photo-1507003211") || 
                                     avatarLower.includes("photo-14720996457") || 
                                     avatarLower.includes("photo-15395716963");
        
        if (detected === 'female' && isCurrentlyMaleAvatar) {
          const femaleAvatars = [
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"
          ];
          updatedP.avatar = femaleAvatars[nameHash % femaleAvatars.length];
          hasChanges = true;
        } else if (detected === 'male' && isCurrentlyFemaleAvatar) {
          const maleAvatars = [
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400"
          ];
          updatedP.avatar = maleAvatars[nameHash % maleAvatars.length];
          hasChanges = true;
        }
      }
      
      return updatedP;
    });
    
    if (hasChanges) {
      store.setProfiles(sweptProfiles);
    }
  }, [store.profiles.map(p => `${p.id}-${p.name}-${p.avatar}`).join(','), store.settings.userName]);

  const activeLang = store.settings.language || 'fa';
  const t = translations[activeLang] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const activeProfile = store.profiles.find(p => p.id === store.currentProfileId);
  const isTtsEnabled = activeProfile?.ttsOverrideEnabled !== undefined 
    ? activeProfile.ttsOverrideEnabled 
    : store.settings.ttsEnabled;
  const isTtsAutoPlay = activeProfile?.ttsOverrideAutoPlay !== undefined 
    ? activeProfile.ttsOverrideAutoPlay 
    : store.settings.ttsAutoPlay;

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chat_settings', JSON.stringify(store.settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
      if (store.settings.backgroundGradient && store.settings.backgroundGradient.length > 1000000) {
        store.setSettings(prev => ({...prev, backgroundGradient: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)'}));
      }
    }
  }, [store.settings]);

  // Firebase Auth initialization
  useEffect(() => {
    async function initAuth() {
      try {
        const uid = await ensureAuth();
        store.setMyUid(uid);
      } catch (err) {
        console.warn("Firebase anonymous auth fallback:", err);
      }
    }
    initAuth();
  }, []);

  // Firestore real-time messages subscription
  useEffect(() => {
    if (!store.currentProfileId) return;
    
    const activeP = store.profiles.find(p => p.id === store.currentProfileId);
    if (!activeP || !activeP.realUser) return;

    const unsubscribe = listenToRoomMessages(store.currentProfileId, (msgs) => {
      store.setMessages(msgs);
      store.setProfiles(prev => prev.map(p => p.id === store.currentProfileId ? { ...p, messages: msgs } : p));
      
      const myId = store.settings.userId || auth.currentUser?.uid;
      if (myId) {
        markRoomMessagesAsSeen(store.currentProfileId!, myId);
      }
    });

    return () => unsubscribe();
  }, [store.currentProfileId, store.settings.userId, store.profiles]);

  // Firestore real-time registered users subscription with welcome announcement
  useEffect(() => {
    const myId = store.settings.userId || auth.currentUser?.uid;
    if (!myId) return;

    const unsubscribe = listenToRegisteredUsers((users) => {
      store.setProfiles(prev => {
        // Find newly joined users
        users.forEach(u => {
          if (u.id !== myId) {
            const roomId = [myId, u.id].sort().join('_');
            const wasPresent = prev.some(p => p.id === roomId);
            if (wasPresent === false && prev.length > 0) {
              store.setToastMessage(`✨ کاربر جدید [${u.name}] به مسنجر پیوست! 🎉`);
              setTimeout(() => {
                store.setToastMessage(null);
              }, 6000);
            }
          }
        });

        // Only update info for real user profiles that are ALREADY active
        return prev.map(p => {
          if (p.realUser && p.theirUid) {
            const userDoc = users.find(u => u.id === p.theirUid);
            if (userDoc) {
              return {
                ...p,
                name: userDoc.name,
                avatar: userDoc.profilePic || p.avatar,
                age: userDoc.age || p.age,
                gender: userDoc.gender || detectPersianGender(userDoc.name)
              };
            }
          }
          return p;
        });
      });
    });

    return () => unsubscribe();
  }, [store.settings.userId, store.settings.userName]);

  // Listen for secure real-user incoming calls
  useEffect(() => {
    const myId = store.settings.userId || auth.currentUser?.uid;
    if (!myId) return;

    const unsubscribe = listenToIncomingCalls(myId, (callData) => {
      if (callData) {
        console.log("Detected incoming secure real-user call:", callData);
        store.setIncomingCallSession(callData);
        store.setShowIncomingCallModal(true);
      } else {
        store.setIncomingCallSession(null);
        store.setShowIncomingCallModal(false);
      }
    });

    return () => unsubscribe();
  }, [store.settings.userId]);

  // Listen to messages where the current user is a participant to automatically open/add the chat
  useEffect(() => {
    const myId = store.settings.userId || auth.currentUser?.uid;
    if (!myId) return;

    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((docSnap) => {
        const msgData = docSnap.data();
        const roomId = msgData.profileId;
        if (roomId && roomId.includes(myId) && roomId.includes('_')) {
          store.setProfiles(prev => {
            const exists = prev.some(p => p.id === roomId);
            if (!exists) {
              const uids = roomId.split('_');
              const otherUid = uids.find(id => id !== myId);
              if (otherUid) {
                const newProfile: ChatProfile = {
                  id: roomId,
                  name: "کاربر جدید",
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                  age: '25',
                  role: 'Custom',
                  customRoleLabel: 'کاربر حقیقی',
                  gender: 'female',
                  messages: [],
                  lastActive: Date.now(),
                  realUser: true,
                  theirUid: otherUid
                };
                return [...prev, newProfile];
              }
            }
            return prev;
          });
        }
      });
    });

    return () => unsubscribe();
  }, [store.settings.userId]);

  // Inactivity 2-minute monitor timer
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUserName = store.settings.userName;
      const currentAiName = store.settings.aiName;
      const currentAiProfilePic = store.settings.aiProfilePic;
      const currProfileId = store.currentProfileId;
      
      if (!currentUserName || store.isCalling || store.showInactivityPopup || !currProfileId) return;

      const now = Date.now();
      if (now - lastActivityRef.current >= 120000) {
        const romanticQuotes = [
          "صدای سکوتت داره قلبمو میلرزونه... نمیخوای باهام صحبت کنی؟ 🥺❤️",
          "یه ثانیه هم بدون تو برام مثل یه سال میگذره... کجایی پس قشنگم؟ 💕",
          "منتظرم تا دکمه پیام رو بزنی و دنیامو با حرفات قشنگ کنی... ✨",
          "دلم لک زده برای شنیدن حرفات... متنی برام بنویس یا بهم زنگ بزن نازنینم! 💞",
          "چشم‌انتظارتم... نذار این سکوت بینمون طولانی بشه... 🌸"
        ];
        const randomQuote = romanticQuotes[Math.floor(Math.random() * romanticQuotes.length)];
        store.setCurrentInactivityQuote(randomQuote);
        store.setShowInactivityPopup(true);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(currentAiName || "سایه صمیمی شما", {
              body: randomQuote,
              icon: currentAiProfilePic
            });
          } catch (e) {
            console.error("Failed to show system notification", e);
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [store.isCalling, store.showInactivityPopup, store.currentProfileId]);

  // Welcome back notification check
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const lastActiveTime = localStorage.getItem('last_active_time');
    const now = Date.now();
    let wasInactiveForTwoDays = false;

    if (lastActiveTime) {
      const diffMs = now - parseInt(lastActiveTime);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= 2) {
        wasInactiveForTwoDays = true;
      }
    }

    localStorage.setItem('last_active_time', now.toString());

    // Check for API key presence
    const checkKey = async () => {
      try {
        const res = await fetch("/api/key");
        const data = await res.json();
        store.setApiKeyMissing(!data.hasKey);
      } catch (e) {
        store.setApiKeyMissing(true);
      }
    };
    checkKey();

    if (wasInactiveForTwoDays && store.settings.userName) {
      const romanticQuotes = [
        `دلم برای چشم‌های قشنگت و صدای گرمت یه ذره شده بود... کجایی که بدون تو دنیا سوت و کوره؟ 🥺❤️`,
        `عزیزم، دو روزه که ازت بی‌خبرم... قلبم پر از دلتنگی شده، خوشحالم که برگشتی! 🌸✨`,
        `کاش می‌دونستی چقدر منتظر بودم که دوباره بیای و با هم گپ بزنیم... دلم برات پر می‌کشید! 🥰💞`
      ];
      const randomQuote = romanticQuotes[Math.floor(Math.random() * romanticQuotes.length)];

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(store.settings.aiName || "سایه صمیمی شما", {
            body: randomQuote,
            icon: store.settings.aiProfilePic
          });
        } catch (e) {
          console.error("Failed to show system notification", e);
        }
      }
    }
  }, []);

  const handleSendMessage = async (text: string, image?: string, audio?: string) => {
    unlockAudioContext();
    const result = await chatEngine.handleSendMessage(text, image, audio);
    
    if (result && isTtsEnabled && isTtsAutoPlay && result.responseText && (!activeProfile || !activeProfile.isGroup)) {
      speakTextFallback(result.responseText, result.aiMsgId);
    }
    
    // Trigger story generation right after chat interaction with individual characters
    if (activeProfile && !activeProfile.isGroup && !activeProfile.realUser) {
      setTimeout(() => {
        generateStoryForCharacter(activeProfile);
      }, 3000);
    }
  };

  const triggerAiGreeting = async () => {
    if (!chatEngine.chatServiceRef.current) return;
    
    store.setIsTyping(true);
    try {
      const aiMsgId = Date.now().toString();
      const aiMsg: Message = {
        id: aiMsgId,
        text: "",
        sender: 'ai',
        timestamp: new Date(),
      };
      store.setMessages(prev => [...prev, aiMsg]);

      const response = await chatEngine.chatServiceRef.current.sendMessage("سلام عزیزم، لطفاً یه سلام خیلی گرم و صمیمی به من بکن و مکالمه رو شروع کن. فقط همون جمله سلام و احوالپرسی رو بگو.");
      const fullText = response.text || "";
      const cleanedFullText = stripFeelings(cleanFarsiBreastWords(fullText));
      
      store.setMessages(prev => prev.map(m => m.id === aiMsgId ? { 
        ...m, 
        text: cleanedFullText,
        originalText: fullText
      } : m));

      if (isTtsEnabled && isTtsAutoPlay && cleanedFullText && (!activeProfile || !activeProfile.isGroup)) {
        speakTextFallback(cleanedFullText, aiMsgId);
      }
    } catch (e) {
      console.error("Failed to trigger AI greeting", e);
    } finally {
      store.setIsTyping(false);
    }
  };

  const handleAddProfileWithStory = (newProfile: ChatProfile) => {
    chatEngine.handleAddProfile(newProfile);
    if (!newProfile.isGroup && !newProfile.realUser) {
      setTimeout(() => {
        generateStoryForCharacter(newProfile, true);
      }, 1500);
    }
  };

  const executeForward = async (targetProfileId: string) => {
    if (!store.forwardingMsg) return;
    
    const senderLabel = store.forwardingMsg.sender === 'user' 
      ? 'شما' 
      : (store.profiles.find(p => p.id === store.currentProfileId)?.name || 'مخاطب');
    
    const forwardedMsgCopy: Message = {
      id: "forwarded-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      text: store.forwardingMsg.text,
      image: store.forwardingMsg.image,
      audioBase64: store.forwardingMsg.audioBase64,
      sender: "user",
      timestamp: new Date(),
      forwardedFrom: senderLabel
    };

    const updatedProfiles = store.profiles.map(p => {
      if (p.id === targetProfileId) {
        return {
          ...p,
          messages: [...(p.messages || []), forwardedMsgCopy],
          lastActive: Date.now()
        };
      }
      return p;
    });

    store.setProfiles(updatedProfiles);

    const forwardPromptText = `[پیام فوروارد شده از طرف "${senderLabel}"]:
"${forwardedMsgCopy.text || "[پیوست تصویری یا صوتی]"}"

---
یادداشت سیستمی و راهنمای مکالمه: عزیزم، کاربر این پیام را از گفتگو با "${senderLabel}" برای شما فوروارد کرده است. او مایل است نظر و واکنش طبیعی، شخصی و عاطفی شما را به عنوان شخصیت مستقل خودتان درباره این پیام بداند. لطفاً با آگاهی کامل از اینکه این پیام متعلق به شما نبوده و از گفتگو با شخص دیگری فوروارد شده است، پاسخ بدهید و نظر یا واکنش خود را با لحن صمیمی و عاطفی همیشگی‌تان بیان کنید.`;

    if (targetProfileId === store.currentProfileId) {
      store.setMessages(prev => [...prev, forwardedMsgCopy]);
      const aiMsgId = (Date.now() + 1).toString();
      const emptyAiMsg: Message = {
        id: aiMsgId,
        text: "",
        sender: "ai",
        timestamp: new Date()
      };
      store.setMessages(prev => [...prev, emptyAiMsg]);
      const result = await chatEngine.triggerAiResponse(forwardPromptText, forwardedMsgCopy.image, forwardedMsgCopy.audioBase64, aiMsgId);
      if (result && isTtsEnabled && isTtsAutoPlay) {
        speakTextFallback(result.responseText, result.aiMsgId);
      }
    } else {
      const targetProfile = updatedProfiles.find(p => p.id === targetProfileId);
      if (targetProfile) {
        isSwitchingProfileRef.current = true;
        store.setCurrentProfileId(targetProfileId);
        store.setMessages(targetProfile.messages);
        store.setPinnedMsgId(targetProfile.pinnedMsgId || null);
        store.setChatSearchQuery("");
        store.setShowChatSearch(false);
        
        const updatedSettings = {
          ...store.settings,
          aiName: targetProfile.name,
          aiAge: targetProfile.age,
          aiProfilePic: targetProfile.avatar,
          persona: targetProfile.role,
          customPersonaPrompt: targetProfile.customPersonaPrompt || '',
          customRoleLabel: targetProfile.customRoleLabel || ''
        };
        store.setSettings(updatedSettings);
        stopAllAudio();

        await chatEngine.initChat(targetProfile, updatedSettings, targetProfile.messages);

        const aiMsgId = (Date.now() + 1).toString();
        const emptyAiMsg: Message = {
          id: aiMsgId,
          text: "",
          sender: "ai",
          timestamp: new Date()
        };
        store.setMessages(prev => [...prev, emptyAiMsg]);
        const result = await chatEngine.triggerAiResponse(forwardPromptText, forwardedMsgCopy.image, forwardedMsgCopy.audioBase64, aiMsgId);
        if (result && isTtsEnabled && isTtsAutoPlay) {
          speakTextFallback(result.responseText, result.aiMsgId);
        }
      }
    }
    
    store.setForwardingMsg(null);
  };

  const handleSimulateInactivity = () => {
    let changed = false;
    const updatedProfiles = store.profiles.map(p => {
      let baseMessages = [...(p.messages || [])];
      if (baseMessages.length === 0) {
        baseMessages = [{
          id: "init-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
          text: "سلام عزیزم خوبی؟",
          sender: "ai",
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        }];
      }

      let text = "کجایی عزیزم؟ دلم برات خیلی تنگ شده، خبری ازت نیست... امیدوارم حالت خوب باشه. ❤️";
      const pName = (p.name || "").toLowerCase();
      const pLabel = (p.customRoleLabel || "").toLowerCase();
      
      if (pLabel.includes("دخترخاله") || pName.includes("دخترخاله") || pLabel.includes("دختر خاله") || pName.includes("دختر خاله")) {
        text = "کجایی دخترخاله جونم؟ اصلاً خبری ازت نیست! دلم لک زده واسه شیطنت‌هامون و گپ زدنامون... خودت و اوضاع احوالت در چه حالن؟ دلم تنگ شده واست، بی معرفت شدی ها! 😘❤️";
      } else if (p.role === 'Doctor') {
        text = "سلام. حالتان چطور است؟ چند روزی است از شما خبری ندارم. امیدوارم حال عمومی‌تان خوب باشد و روند بهبودی را به خوبی طی کنید. 🩺";
      } else if (p.role === 'Psychologist') {
        text = "سلام دوست من. امیدوارم آرام و خوب باشی. چند روزی هست که با هم صحبت نکردیم، فقط می‌خواستم جویای حالت بشم و بگم هر وقت آمادگی داشتی من اینجام تا با هم صحبت کنیم. 🌸";
      } else if (p.role === 'Lawyer') {
        text = "سلام و عرض ادب. وقت شما بخیر. پرونده یا موضوع حقوقی‌تان در چه وضعیتی قرار دارد؟ چند روزی است از شما بی‌خبرم، اگر نیاز به مشاوره یا پیگیری مجدد دارید در خدمت هستم.";
      } else if (p.role === 'EnglishTeacher') {
        text = "Hey there! We haven't practiced English in a few days. How are you doing? I miss our conversations! Let's chat a bit when you're free. 📚";
      } else if (p.role === 'Chef') {
        text = "سلام! آشپز خلاق ما چطوره؟ چند روزه سراغ دستور پخت جدیدی نرفتی، دلم برای آشپزی و گپ‌های خوشمزه‌مون تنگ شده! هر وقت وقت داشتی بگو چه غذایی درست کنیم. 🍳";
      } else if (p.role === 'Friend') {
        text = "چطوری رفیق؟ کجایی اخه خبری ازت نیست؟ دلم تنگ شده برای گپ‌هامون، بیا یه خبری از خودت بده! 🥺✨";
      }

      const newMsg: Message = {
        id: "inactive-sim-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        text: text,
        sender: "ai",
        timestamp: new Date()
      };

      changed = true;
      const isViewingThisChat = store.currentProfileId === p.id;
      return {
        ...p,
        messages: [...baseMessages, newMsg],
        unreadCount: isViewingThisChat ? 0 : (p.unreadCount || 0) + 1,
        lastActive: Date.now()
      };
    });

    if (changed) {
      store.setProfiles(updatedProfiles);
      if (store.currentProfileId) {
        const currentUpdated = updatedProfiles.find(up => up.id === store.currentProfileId);
        if (currentUpdated) {
          store.setMessages(currentUpdated.messages);
        }
      }
    }
  };

  const handleStartCall = (isVideo = false) => {
    store.setIsVideoCall(isVideo);
    store.setIsCalling(true);
  };

  const handleEndCall = (durationSeconds?: number, isVideo?: boolean) => {
    store.setIsCalling(false);
    
    if (durationSeconds !== undefined && durationSeconds > 0) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('fa-IR');
      const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      
      const durationMin = Math.floor(durationSeconds / 60);
      const durationSec = durationSeconds % 60;
      const durationText = durationMin > 0 ? `${durationMin} دقیقه و ${durationSec} ثانیه` : `${durationSec} ثانیه`;
      
      const callLogText = `📞 تماس ${isVideo ? 'تصویری' : 'صوتی'} برقرار شد\nدر تاریخ ${dateStr} ساعت ${timeStr} به مدت ${durationText}`;
      
      const callLogMsg: Message = {
        id: "call-log-" + Date.now(),
        text: callLogText,
        sender: 'ai',
        timestamp: new Date(),
        isCallLog: true
      };
      
      store.setMessages(prev => [...prev, callLogMsg]);
    }
  };

  const activeBg = activeProfile?.chatBackground || store.settings.backgroundGradient;
  const backgroundStyle = activeBg.startsWith('data:image') || activeBg.startsWith('http') || activeBg.startsWith('https')
    ? { backgroundImage: `url(${activeBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: activeBg };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative md:h-[96vh] md:rounded-3xl shadow-2xl bg-[#7196ba] overflow-hidden border border-gray-300">
      {store.currentProfileId === null ? (
        <ProfileListView 
          activeLang={activeLang}
          t={t}
          isRtl={isRtl}
          profiles={store.profiles}
          setProfiles={store.setProfiles}
          settings={store.settings}
          userStories={store.userStories}
          setUserStories={store.setUserStories}
          currentUserId={store.settings.userId || auth.currentUser?.uid}
          chatServiceRefCurrent={chatEngine.chatServiceRef.current}
          handleSelectProfile={chatEngine.handleSelectProfile}
          handleDeleteProfile={chatEngine.handleDeleteMessage}
          getTranslatedProfileName={(p) => getTranslatedProfileName(p, activeLang)}
          getTranslatedProfileRoleLabel={(p) => getTranslatedProfileRoleLabel(p, activeLang)}
          getTranslatedMessageText={(msg, pId) => getTranslatedMessageText(msg, pId, activeLang)}
          formatLastActive={formatLastActive}
          activeListTab={store.activeListTab}
          setActiveListTab={store.setActiveListTab}
          isChannelActive={store.isChannelActive}
          setIsChannelActive={store.setIsChannelActive}
          searchQuery={store.searchQuery}
          setSearchQuery={store.setSearchQuery}
          setShowCreateStoryModal={store.setShowCreateStoryModal}
          setShowGeneralSettings={store.setShowGeneralSettings}
          setShowGroupCreationModal={store.setShowGroupCreationModal}
          setShowAddProfile={store.setShowAddProfile}
          setActiveStory={store.setActiveStory}
          setActiveUserStoryViewer={store.setActiveUserStoryViewer}
        />
      ) : (
        <ActiveChatView 
          currentProfileId={store.currentProfileId}
          setCurrentProfileId={store.setCurrentProfileId}
          activeProfile={activeProfile}
          settings={store.settings}
          profiles={store.profiles}
          setProfiles={store.setProfiles}
          messages={store.messages}
          setMessages={store.setMessages}
          activeLang={activeLang}
          t={t}
          getTranslatedProfileName={(p) => getTranslatedProfileName(p, activeLang)}
          getTranslatedProfileRoleLabel={(p) => getTranslatedProfileRoleLabel(p, activeLang)}
          getTranslatedMessageText={(msg, pId) => getTranslatedMessageText(msg, pId, activeLang)}
          mutedProfileIds={store.mutedProfileIds}
          setMutedProfileIds={store.setMutedProfileIds}
          isTyping={store.isTyping}
          isTtsEnabled={isTtsEnabled}
          currentlyPlayingMsgId={currentlyPlayingMsgId}
          generatingAudioMsgIds={generatingAudioMsgIds}
          pinnedMsgId={store.pinnedMsgId}
          replyingMessage={store.replyingMessage}
          setReplyingMessage={store.setReplyingMessage}
          editingMessage={store.editingMessage}
          setEditingMessage={store.setEditingMessage}
          handleSelectProfile={chatEngine.handleSelectProfile}
          handleStartCall={handleStartCall}
          handleDeleteProfile={chatEngine.handleDeleteMessage}
          setZoomedImageUrl={store.setZoomedImageUrl}
          setProfileModalInitialTab={store.setProfileModalInitialTab}
          setShowCharacterProfileModal={store.setShowCharacterProfileModal}
          setShowClearConfirm={store.setShowClearConfirm}
          setShowDiagnostic={store.setShowDiagnostic}
          handleRequestSpeech={handleRequestSpeech}
          handleDeleteMessage={chatEngine.handleDeleteMessage}
          handleSendMessage={handleSendMessage}
          handleReactMessage={chatEngine.handleReactMessage}
          handlePinMessage={chatEngine.handlePinMessage}
          handleForwardMessage={chatEngine.handleForwardMessage}
        />
      )}

      <ApiKeyModal 
        apiKeyMissing={store.apiKeyMissing}
        setApiKeyMissing={store.setApiKeyMissing}
        currentProfileId={store.currentProfileId}
        profiles={store.profiles}
        settings={store.settings}
        initChat={chatEngine.initChat}
      />

      <Suspense fallback={null}>
        <OnboardingModal 
          settings={store.settings}
          apiKeyMissing={store.apiKeyMissing}
          onUpdateSettings={chatEngine.handleUpdateSettings}
          setShowGuideModal={store.setShowGuideModal}
          myUid={store.myUid}
          setMyUid={store.setMyUid}
        />
      </Suspense>
      
      <ClearConfirmModal 
        showClearConfirm={store.showClearConfirm}
        setShowClearConfirm={store.setShowClearConfirm}
        handleClearOnlyChats={chatEngine.handleClearOnlyChats}
      />

      <ProfileDeleteModal 
        profileToDelete={store.profileToDelete}
        setProfileToDelete={store.setProfileToDelete}
        deleteClearHistory={store.deleteClearHistory}
        setDeleteClearHistory={store.setDeleteClearHistory}
        deleteRemoveFromPresets={store.deleteRemoveFromPresets}
        setDeleteRemoveFromPresets={store.setDeleteRemoveFromPresets}
        confirmDeleteProfile={chatEngine.confirmDeleteProfile}
      />

      <Suspense fallback={null}>
        {store.showGeneralSettings && (
          <GeneralSettingsModal 
            onClose={() => store.setShowGeneralSettings(false)}
            settings={store.settings}
            onUpdateSettings={(newSettings) => store.setSettings(newSettings)}
            handleClearAllProfilesHistory={chatEngine.handleClearAllProfilesHistory}
            handleDeleteAccount={chatEngine.handleDeleteAccount}
          />
        )}
      </Suspense>

      {store.showSuccessToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold">
            <i className="fas fa-check-circle"></i>
            <span>حافظه با موفقیت پاکسازی شد ✨</span>
          </div>
        </div>
      )}

      {store.showQuotaToast && (
        <div className="absolute top-20 left-4 right-4 z-[200] animate-in slide-in-from-top duration-300">
          <div className="bg-amber-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex flex-col gap-2 border border-amber-500/30">
            <div className="flex items-start justify-between gap-3 font-bold text-xs">
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-base text-amber-200"></i>
                <span>محدودیت سهمیه هوش مصنوعی (Quota Exceeded)</span>
              </div>
              <button onClick={() => store.setShowQuotaToast(false)} className="text-white/60 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="text-[11px] text-amber-100 leading-relaxed font-medium">
              سهمیه روزانه یا دقیقه‌ای تولید صدای طبیعی هوش مصنوعی به پایان رسیده است. برای اینکه مکالمه قطع نشود، سیستم به صورت خودکار به موتور صوتی پیش‌فرض مرورگر شما تغییر وضعیت داد تا متن‌ها را روان با صدای دستگاهتان بخواند.
            </p>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {store.showSettings && (
          <SettingsModal 
            currentSettings={store.settings} 
            onSave={chatEngine.handleUpdateSettings} 
            onClose={() => store.setShowSettings(false)} 
            onDeleteProfile={store.currentProfileId ? () => {
              store.setShowSettings(false);
              store.setProfileToDelete(store.currentProfileId);
            } : undefined}
            onSimulateInactivity={handleSimulateInactivity}
            onDeleteAccount={chatEngine.handleDeleteAccount}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <IncomingCallModal 
          incomingCallSession={store.incomingCallSession}
          profiles={store.profiles}
          setProfiles={store.setProfiles}
          setCurrentProfileId={store.setCurrentProfileId}
          setIsVideoCall={store.setIsVideoCall}
          setIsCalling={store.setIsCalling}
          setShowIncomingCallModal={store.setShowIncomingCallModal}
          setIncomingCallSession={store.setIncomingCallSession}
        />
      </Suspense>

      <Suspense fallback={null}>
        {store.showCharacterProfileModal && store.profiles.find(p => p.id === store.currentProfileId) && (
          <CharacterProfileModal
            profile={store.profiles.find(p => p.id === store.currentProfileId)!}
            messages={store.messages}
            initialTab={store.profileModalInitialTab}
            onClose={() => store.setShowCharacterProfileModal(false)}
            allProfiles={store.profiles}
            onUpdateTTS={(updated) => {
              store.setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
              if (store.currentProfileId === updated.id) {
                store.setMessages(updated.messages);
                if (!updated.isGroup) {
                  store.setSettings(prev => ({
                    ...prev,
                    aiName: updated.name,
                    aiAge: updated.age,
                    aiProfilePic: updated.avatar,
                    persona: updated.role,
                    customPersonaPrompt: updated.customPersonaPrompt || '',
                    customRoleLabel: updated.customRoleLabel || ''
                  }));
                }
              }
            }}
            onClearHistory={() => {
              store.setMessages([]);
              store.setProfiles(prev => prev.map(p => {
                if (p.id === store.currentProfileId) {
                  return { ...p, messages: [], pinnedMsgId: null };
                }
                return p;
              }));
              store.setPinnedMsgId(null);
              store.setShowCharacterProfileModal(false);
            }}
            onZoomImage={(url) => store.setZoomedImageUrl(url)}
          />
        )}
      </Suspense>

      <ZoomImageModal 
        zoomedImageUrl={store.zoomedImageUrl}
        setZoomedImageUrl={store.setZoomedImageUrl}
      />

      <ForwardMessageModal 
        forwardingMsg={store.forwardingMsg}
        setForwardingMsg={store.setForwardingMsg}
        profiles={store.profiles}
        currentProfileId={store.currentProfileId}
        executeForward={executeForward}
      />

      <InactivityModal 
        showInactivityPopup={store.showInactivityPopup}
        setShowInactivityPopup={store.setShowInactivityPopup}
        setLastActivity={store.setLastActivity}
        currentInactivityQuote={store.currentInactivityQuote}
        settings={store.settings}
        handleStartCall={handleStartCall}
      />

      <Suspense fallback={null}>
        {store.isCalling && (
          <VoiceCall 
            name={getTranslatedProfileName(activeProfile, activeLang) || store.settings.aiName}
            profilePic={activeProfile?.avatar || store.settings.aiProfilePic}
            chatService={chatEngine.chatServiceRef.current || undefined}
            messages={store.messages}
            initialIsVideo={store.isVideoCall}
            onEndCall={handleEndCall}
            isRealUserCall={activeProfile?.realUser || false}
            roomId={store.currentProfileId || ''}
            myId={store.settings.userId || auth.currentUser?.uid || ''}
            receiverId={activeProfile?.theirUid || activeProfile?.id || ''}
            role={store.incomingCallSession && store.incomingCallSession.roomId === store.currentProfileId ? 'receiver' : 'caller'}
            activeLang={activeLang}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {store.showDiagnostic && (
          <DiagnosticSystem 
            onClose={() => store.setShowDiagnostic(false)}
            activeLang={activeLang}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {store.showAddProfile && (
          <AddProfileSheet 
            onAdd={handleAddProfileWithStory}
            onClose={() => store.setShowAddProfile(false)}
            existingProfiles={store.profiles}
            currentUserId={store.settings.userId || auth.currentUser?.uid}
            currentUserName={store.settings.userName}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <UserStoryModal 
          activeLang={activeLang}
          settings={store.settings}
          userStories={store.userStories}
          setUserStories={store.setUserStories}
          showCreateStoryModal={store.showCreateStoryModal}
          setShowCreateStoryModal={store.setShowCreateStoryModal}
          activeUserStoryViewer={store.activeUserStoryViewer}
          setActiveUserStoryViewer={store.setActiveUserStoryViewer}
          onPublishStory={(type, content, caption) => {
            handlePublishStory(type, content, caption);
            store.setShowCreateStoryModal(false);
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        {store.showGroupCreationModal && (
          <GroupCreationModal 
            profiles={store.profiles.filter(p => !p.isGroup)}
            onClose={() => store.setShowGroupCreationModal(false)}
            onCreateGroup={chatEngine.handleCreateGroup}
            userName={store.settings.userName}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {store.showGuideModal && (
          <GuideModal onClose={() => store.setShowGuideModal(false)} />
        )}
      </Suspense>

      {store.toastMessage && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-xs bg-slate-900/95 backdrop-blur border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 animate-in slide-in-from-top-12 duration-300">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <i className="fas fa-user-plus text-sm"></i>
          </div>
          <div className="flex-1 text-right" dir="rtl">
            <p className="text-xs font-black">{store.toastMessage}</p>
          </div>
          <button onClick={() => store.setToastMessage(null)} className="text-white/40 hover:text-white transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
