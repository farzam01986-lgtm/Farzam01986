import { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AIChatService, cleanFarsiBreastWords } from '../../geminiService';
import { stripFeelings } from '../utils/stringUtils';
import { ChatProfile, Message, ChatSettings } from '../../types';
import { auth, db } from '../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { 
  ensureAuth, 
  sendFirestoreMessage, 
  listenToRoomMessages, 
  markRoomMessagesAsSeen,
  listenToRegisteredUsers,
  listenToIncomingCalls,
  deleteUserFromFirestore,
  deleteFirestoreStory
} from '../../firebaseService';
import { detectPersianGender } from '../../components/AddProfileSheet';
import { ROLE_LABELS } from '../initialProfiles';

export function useChatEngine() {
  const store = useAppStore();
  const chatServiceRef = useRef<AIChatService | null>(null);

  // Initialize AIChatService
  if (!chatServiceRef.current) {
    chatServiceRef.current = new AIChatService();
    chatServiceRef.current.settings = store.settings;
  }

  // Sync settings with chatService
  useEffect(() => {
    if (chatServiceRef.current) {
      chatServiceRef.current.settings = store.settings;
    }
  }, [store.settings]);

  const initChat = async (targetP: ChatProfile, currentSettings: ChatSettings, existingMessages: Message[] = []) => {
    try {
      if (!chatServiceRef.current) {
        chatServiceRef.current = new AIChatService();
      }
      await chatServiceRef.current.startNewChat(targetP, currentSettings.userName, currentSettings, existingMessages);
    } catch (e) {
      console.error("Initialization failed", e);
    }
  };

  const handleSelectProfile = async (profileId: string) => {
    const targetProfile = store.profiles.find(p => p.id === profileId);
    if (!targetProfile) return;

    store.setCurrentProfileId(profileId);
    store.setMessages(targetProfile.messages);
    store.setPinnedMsgId(targetProfile.pinnedMsgId || null);
    store.setChatSearchQuery("");
    store.setShowChatSearch(false);
    
    // Clear unread count
    store.setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, unreadCount: 0 } : p));
    
    // Sync AI settings with profile info so settings modal works correctly!
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

    // Initialize/reset Gemini chat session with this profile's messages and settings
    await initChat(targetProfile, updatedSettings, targetProfile.messages);
  };

  const handleAddProfile = (newProfile: ChatProfile) => {
    let initialMessages: Message[] = [];
    try {
      const archiveSaved = localStorage.getItem('chat_history_archive');
      if (archiveSaved) {
        const archive = JSON.parse(archiveSaved);
        const key = (newProfile.name + "_" + newProfile.role).trim();
        if (archive[key] && Array.isArray(archive[key])) {
          initialMessages = archive[key].map((m: any) => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
          }));
        }
      }
    } catch (e) {
      console.error("Failed to restore archived messages", e);
    }

    const profileWithHistory = {
      ...newProfile,
      messages: initialMessages
    };

    store.setProfiles(prev => [profileWithHistory, ...prev]);
    store.setShowAddProfile(false);
    // Automatically select the newly created profile and open its chat!
    handleSelectProfile(profileWithHistory.id);
  };

  const handleUpdateSettings = (newSettings: ChatSettings) => {
    store.setSettings(newSettings);
    store.setShowSettings(false);
    
    // Sync to the current active profile if one is selected
    if (store.currentProfileId) {
      store.setProfiles(prev => prev.map(p => {
        if (p.id === store.currentProfileId) {
          return {
            ...p,
            name: newSettings.aiName || p.name,
            age: newSettings.aiAge || p.age,
            avatar: newSettings.aiProfilePic || p.avatar,
            role: (newSettings as any).persona || p.role,
            customPersonaPrompt: (newSettings as any).customPersonaPrompt || p.customPersonaPrompt,
            customRoleLabel: newSettings.customRoleLabel || p.customRoleLabel
          };
        }
        return p;
      }));
    }
    
    // If the chat service exists, re-configure its settings
    if (chatServiceRef.current) {
      chatServiceRef.current.settings = newSettings;
    }
  };

  const confirmDeleteProfile = () => {
    const profileToDelete = store.profileToDelete;
    if (!profileToDelete) return;
    
    const targetP = store.profiles.find(p => p.id === profileToDelete);
    
    // 1. If deleteClearHistory is checked, we clear the message history (both active and in the backup archive!)
    if (store.deleteClearHistory && targetP) {
      targetP.messages = [];
      
      // Clear from backup archive
      try {
        const archiveSaved = localStorage.getItem('chat_history_archive');
        if (archiveSaved) {
          const archive = JSON.parse(archiveSaved);
          const key = (targetP.name + "_" + targetP.role).trim();
          delete archive[key];
          localStorage.setItem('chat_history_archive', JSON.stringify(archive));
        }
      } catch (e) {
        console.error("Failed to clear profile from master archive", e);
      }
    }
    
    // 2. If deleteRemoveFromPresets is checked, we remove this character from custom presets in localStorage!
    if (store.deleteRemoveFromPresets && targetP) {
      try {
        const saved = localStorage.getItem('custom_presets');
        if (saved) {
          const presets = JSON.parse(saved);
          const filtered = presets.filter((p: any) => !(p.name === targetP.name && p.role === targetP.role));
          localStorage.setItem('custom_presets', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error("Error removing custom preset", e);
      }
    }
    
    // 3. Remove from the active profiles list
    store.setProfiles(prev => prev.filter(p => p.id !== profileToDelete));
    
    // If the active chat is the deleted profile, close it
    if (store.currentProfileId === profileToDelete) {
      store.setCurrentProfileId(null);
      store.setMessages([]);
    }
    
    store.setProfileToDelete(null);
    store.setDeleteClearHistory(false);
    store.setDeleteRemoveFromPresets(false);
    store.setShowSuccessToast(true);
    setTimeout(() => store.setShowSuccessToast(false), 3000);
  };

  const triggerAiResponse = async (text: string, image?: string, audio?: string, customAiMsgId?: string) => {
    store.setIsTyping(true);
    let aiMsgId = customAiMsgId || (Date.now() + 1).toString();

    try {
      if (chatServiceRef.current) {
        // Add empty message for AI if not already in the list
        store.setMessages(prev => {
          if (prev.some(m => m.id === aiMsgId)) return prev;
          return [...prev, {
            id: aiMsgId,
            text: "",
            sender: 'ai',
            timestamp: new Date(),
          }];
        });

        const activeProfile = store.profiles.find(p => p.id === store.currentProfileId);
        const response = await chatServiceRef.current.sendMessage(text, image, audio, activeProfile?.avatar);
        let responseText = cleanFarsiBreastWords(response.text);
        const generatedImage = response.generatedImage;
        if (!responseText) {
          if (generatedImage) {
            responseText = "عزیزم، اینم عکسی که ازم خواسته بودی... امیدوارم خوشت بیاد! 😘📸";
          } else {
            responseText = "عزیزم، عکست/صدات رو دیدم/شنیدم ولی الان حضور ذهن ندارم چطور جواب بدم... ❤️";
          }
        }
        const strippedResponseText = stripFeelings(responseText);

        store.setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          text: strippedResponseText,
          originalText: responseText,
          image: generatedImage,
          audioBase64: (response as any).audio
        } : m));

        return { responseText, aiMsgId };
      }
    } catch (e) {
      console.error("Message send loop crashed:", e);
      if (aiMsgId) {
        const errorMsg = "مشکلی در دریافت پاسخ پیش آمد. لطفاً چند لحظه دیگر دوباره تلاش کنید.";
        store.setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          text: errorMsg
        } : m));
      }
    } finally {
      store.setIsTyping(false);
    }
    return null;
  };

  const getRelevantMembers = (text: string, members: ChatProfile[]) => {
    const lower = text.toLowerCase();
    const mentionedMember = members.find(member => lower.includes(member.name.toLowerCase()));
    if (mentionedMember) {
      return [mentionedMember];
    }
    return members;
  };

  const handleSendMessage = async (
    text: string, 
    image?: string, 
    audio?: string, 
    playTtsCallback?: (text: string, msgId: string, memberVoice?: string) => void
  ) => {
    if (!text && !image && !audio) return;

    const activeProfile = store.profiles.find(p => p.id === store.currentProfileId);
    if (activeProfile && activeProfile.realUser) {
      try {
        await sendFirestoreMessage({
          text,
          image,
          audio,
          sender: auth.currentUser?.uid || 'anonymous',
          senderName: store.settings.userName,
          senderAvatar: store.settings.userProfilePic,
          profileId: store.currentProfileId!,
          replyTo: store.replyingMessage ? {
            id: store.replyingMessage.id,
            text: store.replyingMessage.text,
            senderName: store.replyingMessage.sender === 'user' ? 'شما' : activeProfile.name
          } : undefined
        });
        store.setReplyingMessage(null);
      } catch (err) {
        console.error("Failed to send Firestore message:", err);
      }
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      image,
      sender: 'user',
      timestamp: new Date(),
      audioBase64: audio,
      replyTo: store.replyingMessage ? {
        id: store.replyingMessage.id,
        text: store.replyingMessage.text,
        senderName: store.replyingMessage.sender === 'user' ? 'شما' : (store.profiles.find(p => p.id === store.currentProfileId)?.name || 'مخاطب')
      } : undefined
    };
    store.setMessages(prev => [...prev, userMsg]);
    store.setReplyingMessage(null);
    store.setIsTyping(true);

    localStorage.setItem('last_active_time', Date.now().toString());

    // Group chat interception
    if (activeProfile && activeProfile.isGroup) {
      const groupMembers = store.profiles.filter(p => activeProfile.memberIds?.includes(p.id));
      const relevant = getRelevantMembers(text, groupMembers);
      
      relevant.forEach((member, index) => {
        setTimeout(async () => {
          const memberMsgId = (Date.now() + index + 2).toString();
          
          const emptyMsg: Message = {
            id: memberMsgId,
            text: "",
            sender: "ai",
            senderName: member.name,
            senderAvatar: member.avatar,
            timestamp: new Date()
          };
          store.setMessages(prev => [...prev, emptyMsg]);
          
          try {
            if (chatServiceRef.current) {
              await chatServiceRef.current.startNewChat(member, store.settings.userName, store.settings, store.messages);
              
              let inputPrompt = text;
              if (!inputPrompt) {
                if (image) inputPrompt = "[کاربر یک عکس فرستاده است]";
                else if (audio) inputPrompt = "[کاربر یک ویس فرستاده است]";
              }

              const groupInstructionPrompt = `شما در یک گروه چت صمیمی حضور دارید و کاربر پیام جدیدی فرستاده است. این پیام می‌تواند متن معمولی، عکس، یا ایموجی/استیکر تک باشد.
ب VERY IMPORTANT: شما باید پیام کاربر را دقیقاً تحلیل کنید و پاسخی بسیار متناسب، هوشمندانه و طبیعی بر اساس محتوای آن بدهید:
- اگر کاربر عکس فرستاده است (شما آن را به عنوان تصویر ورودی دریافت می‌کنید)، با توجه دقیق به جزئیات تصویر، احساس و محتوای آن پاسخ دهید و نظر بدهید.
- اگر کاربر یک استیکر یا تک‌ایموجی فرستاده است، با توجه به نوع آن ایموجی (مثلاً خنده، غم، تعجب، قلب)، واکنش مناسب عاطفی نشان دهید (می‌توانید بنویسید یا خودتان استیکر متقابل بدهید).
- به عنوان شخصیت خودتان (${member.name} با نقش ${member.customRoleLabel || ROLE_LABELS[member.role]}) با لحن صمیمی و دوستانه پاسخ دهید.

روش‌های پاسخ مجاز شما (یکی را انتخاب کنید):
۱. پاسخ متنی صمیمی، دلسوزانه یا شوخ‌طبعانه متناسب با نقشتان (حداکثر ۲ جمله عامیانه فارسی تهرانی).
۲. ارسال عکس طراحی‌شده در جواب: [DRAW: detailed image prompt in English]
۳. ارسال واکنش استیکری: [STICKER: ایموجی مناسب] (مثال: [STICKER: 😂] یا [STICKER: ❤️])

پیام یا محتوای ارسالی کاربر:
"${inputPrompt}"`;

              const response = await chatServiceRef.current.sendMessage(groupInstructionPrompt, image, audio, member.avatar);
              const rawText = response.text || "";
              
              let parsedText = rawText;
              let parsedSticker: string | undefined = undefined;
              let parsedImage: string | undefined = response.generatedImage;

              // Extract STICKER
              const stickerMatch = rawText.match(/\[STICKER:\s*([^\s\]]+)\]/);
              if (stickerMatch) {
                parsedSticker = stickerMatch[1].trim();
                parsedText = ""; // Clear text for stickers
              }

              // Extract DRAW
              const drawMatch = rawText.match(/\[DRAW:\s*([^\]]+)\]/);
              if (drawMatch && !parsedImage) {
                const drawPrompt = drawMatch[1].trim();
                parsedImage = await chatServiceRef.current.generateImage(drawPrompt, '1:1').catch(() => undefined);
                parsedText = parsedText.replace(/\[DRAW:\s*[^\]]+\]/, "").trim();
              }

              let cleanedResponseText = stripFeelings(cleanFarsiBreastWords(parsedText));
              if (!cleanedResponseText && !parsedSticker && !parsedImage) {
                cleanedResponseText = "سرم شلوغه عزیزم، یکم دیگه باهات صحبت می‌کنم! 😘";
              }
              
              store.setMessages(prev => prev.map(m => m.id === memberMsgId ? {
                ...m,
                text: cleanedResponseText,
                originalText: parsedText,
                sticker: parsedSticker,
                image: parsedImage,
                senderName: member.name,
                senderAvatar: member.avatar
              } : m));

              if (playTtsCallback && cleanedResponseText) {
                playTtsCallback(cleanedResponseText, memberMsgId, member.ttsOverrideVoice);
              }
            }
          } catch (err) {
            console.error("Group response error:", err);
            store.setMessages(prev => prev.map(m => m.id === memberMsgId ? {
              ...m,
              text: `من (${member.name}) الان سرم شلوغه عزیزم، یکم دیگه باهات صحبت می‌کنم.`
            } : m));
          } finally {
            if (index === relevant.length - 1) {
              store.setIsTyping(false);
            }
          }
        }, (index + 1) * 3000);
      });
      return;
    }

    const aiRes = await triggerAiResponse(text, image, audio);
    return aiRes;
  };

  const handleCreateGroup = (groupName: string, selectedMemberIds: string[]) => {
    const newGroupProfile: ChatProfile = {
      id: "group-" + Date.now(),
      name: groupName,
      avatar: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400",
      age: "0",
      role: "Custom",
      customRoleLabel: "گروه",
      messages: [
        {
          id: "welcome-group-" + Date.now(),
          text: `گروه "${groupName}" با موفقیت ایجاد شد! 🎉`,
          sender: "ai",
          timestamp: new Date()
        }
      ],
      lastActive: Date.now(),
      isGroup: true,
      memberIds: selectedMemberIds
    };
    
    store.setProfiles(prev => [newGroupProfile, ...prev]);
    store.setActiveListTab('groups');
    handleSelectProfile(newGroupProfile.id);
  };

  const handleClearOnlyChats = () => {
    if (store.currentProfileId) {
      const activeP = store.profiles.find(p => p.id === store.currentProfileId);
      if (activeP) {
        try {
          const archiveSaved = localStorage.getItem('chat_history_archive');
          if (archiveSaved) {
            const archive = JSON.parse(archiveSaved);
            const key = (activeP.name + "_" + activeP.role).trim();
            delete archive[key];
            localStorage.setItem('chat_history_archive', JSON.stringify(archive));
          }
        } catch (e) {
          console.error("Failed to clear profile from master archive", e);
        }
      }
      
      store.setMessages([]);
      store.setProfiles(prev => prev.map(p => p.id === store.currentProfileId ? { ...p, messages: [] } : p));
    }
    store.setShowClearConfirm(false);
    store.setShowSuccessToast(true);
    setTimeout(() => store.setShowSuccessToast(false), 3000);
  };

  const handleClearAllProfilesHistory = () => {
    store.setProfiles(prev => prev.map(p => ({ ...p, messages: [] })));
    store.setMessages([]);
    try {
      localStorage.removeItem('chat_history_archive');
    } catch (e) {
      console.error("Error clearing backup history", e);
    }
    store.setShowSuccessToast(true);
    setTimeout(() => store.setShowSuccessToast(false), 3000);
  };

  const handleClearAll = () => {
    localStorage.removeItem('chat_history');
    localStorage.removeItem('chat_settings');
    localStorage.removeItem('chat_profiles');
    localStorage.removeItem('custom_presets');
    localStorage.removeItem('user_stories');
    
    store.setProfiles([]);
    store.setCurrentProfileId(null);
    store.setMessages([]);
    store.setSettings({
      userName: '',
      ttsEnabled: true,
      ttsAutoPlay: false,
      ttsVoice: 'Zephyr',
      aiName: 'سارا 💋',
      aiAge: '22',
      aiProfilePic: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      backgroundGradient: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)'
    });
    store.setShowClearConfirm(false);
    store.setShowSuccessToast(true);
    setTimeout(() => store.setShowSuccessToast(false), 3000);
  };

  const handleDeleteAccount = async () => {
    const myId = store.settings.userId || auth.currentUser?.uid;
    if (myId) {
      try {
        await deleteUserFromFirestore(myId);
      } catch (e) {
        console.error("Failed to delete user doc:", e);
      }
      
      try {
        const storiesToDelete = store.userStories.filter(s => s.authorId === myId);
        for (const s of storiesToDelete) {
          await deleteFirestoreStory(s.id);
        }
      } catch (e) {
        console.error("Failed to delete user stories:", e);
      }
      
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
        }
      } catch (e) {
        console.warn("Auth delete failed:", e);
      }
    }
    
    localStorage.clear();
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleDeleteMessage = (msgId: string) => {
    store.setMessages(prev => prev.filter(m => m.id !== msgId));
    store.setProfiles(prev => prev.map(p => {
      if (p.id === store.currentProfileId) {
        return { ...p, messages: p.messages.filter(m => m.id !== msgId) };
      }
      return p;
    }));
  };

  const handleReactMessage = (msgId: string, emoji: string) => {
    const updateReactions = (reactions: string[] | undefined) => {
      const arr = Array.isArray(reactions) ? [...reactions] : [];
      const idx = arr.indexOf(emoji);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(emoji);
      return arr;
    };

    store.setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: updateReactions(m.reactions) } : m));
    store.setProfiles(prev => prev.map(p => {
      if (p.id === store.currentProfileId) {
        return {
          ...p,
          messages: p.messages.map(m => m.id === msgId ? { ...m, reactions: updateReactions(m.reactions) } : m)
        };
      }
      return p;
    }));
  };

  const handlePinMessage = (msg: Message) => {
    const isAlreadyPinned = store.pinnedMsgId === msg.id;
    const newPinnedId = isAlreadyPinned ? null : msg.id;
    store.setPinnedMsgId(newPinnedId);
    
    store.setProfiles(prev => prev.map(p => {
      if (p.id === store.currentProfileId) {
        return { ...p, pinnedMsgId: newPinnedId };
      }
      return p;
    }));
  };

  const handleForwardMessage = (msg: Message) => {
    store.setForwardingMsg(msg);
  };

  return {
    chatServiceRef,
    initChat,
    handleSelectProfile,
    handleAddProfile,
    handleUpdateSettings,
    confirmDeleteProfile,
    triggerAiResponse,
    handleSendMessage,
    handleCreateGroup,
    handleClearOnlyChats,
    handleClearAllProfilesHistory,
    handleClearAll,
    handleDeleteAccount,
    handleDeleteMessage,
    handleReactMessage,
    handlePinMessage,
    handleForwardMessage,
  };
}
