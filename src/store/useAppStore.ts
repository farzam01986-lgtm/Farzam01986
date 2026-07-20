import { create } from 'zustand';
import { ChatProfile, Message, ChatSettings } from '../../types';
import { Story } from '../../components/StorySection';
import { DEFAULT_PROFILES } from '../initialProfiles';

interface AppState {
  profiles: ChatProfile[];
  currentProfileId: string | null;
  showAddProfile: boolean;
  searchQuery: string;
  messages: Message[];
  isTyping: boolean;
  showSettings: boolean;
  isCalling: boolean;
  isVideoCall: boolean;
  incomingCallSession: any;
  showIncomingCallModal: boolean;
  showClearConfirm: boolean;
  showSuccessToast: boolean;
  showQuotaToast: boolean;
  apiKeyMissing: boolean;
  profileToDelete: string | null;
  deleteClearHistory: boolean;
  deleteRemoveFromPresets: boolean;
  showGeneralSettings: boolean;
  showGuideModal: boolean;
  activeListTab: 'contacts' | 'groups' | 'channels' | 'drive';
  isChannelActive: boolean;
  showGroupCreationModal: boolean;
  replyingMessage: Message | null;
  editingMessage: Message | null;
  showCharacterProfileModal: boolean;
  zoomedImageUrl: string | null;
  chatSearchQuery: string;
  showChatSearch: boolean;
  pinnedMsgId: string | null;
  forwardingMsg: Message | null;
  showCreateStoryModal: boolean;
  activeUserStoryViewer: any | null;
  activeStory: Story | null;
  lastActivity: number;
  showInactivityPopup: boolean;
  currentInactivityQuote: string;
  showDiagnostic: boolean;
  showHeaderMenu: boolean;
  profileModalInitialTab: 'photos' | 'voices' | 'links' | 'files';
  mutedProfileIds: string[];
  toastMessage: string | null;
  myUid: string;
  settings: ChatSettings;
  userStories: any[];

  // Setters
  setProfiles: (profiles: ChatProfile[] | ((prev: ChatProfile[]) => ChatProfile[])) => void;
  setCurrentProfileId: (id: string | null) => void;
  setShowAddProfile: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsTyping: (isTyping: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setIsCalling: (isCalling: boolean) => void;
  setIsVideoCall: (isVideo: boolean) => void;
  setIncomingCallSession: (session: any) => void;
  setShowIncomingCallModal: (show: boolean) => void;
  setShowClearConfirm: (show: boolean) => void;
  setShowSuccessToast: (show: boolean) => void;
  setShowQuotaToast: (show: boolean) => void;
  setApiKeyMissing: (missing: boolean) => void;
  setProfileToDelete: (id: string | null) => void;
  setDeleteClearHistory: (clear: boolean) => void;
  setDeleteRemoveFromPresets: (remove: boolean) => void;
  setShowGeneralSettings: (show: boolean) => void;
  setShowGuideModal: (show: boolean) => void;
  setActiveListTab: (tab: 'contacts' | 'groups' | 'channels' | 'drive') => void;
  setIsChannelActive: (active: boolean) => void;
  setShowGroupCreationModal: (show: boolean) => void;
  setReplyingMessage: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;
  setShowCharacterProfileModal: (show: boolean) => void;
  setZoomedImageUrl: (url: string | null) => void;
  setChatSearchQuery: (query: string) => void;
  setShowChatSearch: (show: boolean) => void;
  setPinnedMsgId: (id: string | null) => void;
  setForwardingMsg: (msg: Message | null) => void;
  setShowCreateStoryModal: (show: boolean) => void;
  setActiveUserStoryViewer: (viewer: any | null) => void;
  setActiveStory: (story: Story | null) => void;
  setLastActivity: (timestamp: number) => void;
  setShowInactivityPopup: (show: boolean) => void;
  setCurrentInactivityQuote: (quote: string) => void;
  setShowDiagnostic: (show: boolean) => void;
  setShowHeaderMenu: (show: boolean) => void;
  setProfileModalInitialTab: (tab: 'photos' | 'voices' | 'links' | 'files') => void;
  setMutedProfileIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setToastMessage: (msg: string | null) => void;
  setMyUid: (uid: string) => void;
  setSettings: (settings: ChatSettings | ((prev: ChatSettings) => ChatSettings)) => void;
  setUserStories: (stories: any[] | ((prev: any[]) => any[])) => void;
}

const getInitialProfiles = (): ChatProfile[] => {
  try {
    const saved = localStorage.getItem('chat_profiles');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          ...p,
          messages: Array.isArray(p.messages) ? p.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })) : []
        }));
      }
    }
  } catch (e) {
    console.error("Failed to parse profiles from localStorage", e);
  }
  return DEFAULT_PROFILES;
};

const getInitialSettings = (): ChatSettings => {
  try {
    const saved = localStorage.getItem('chat_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        aiName: parsed.aiName || 'سارا 💋',
        aiAge: parsed.aiAge || '22',
        userName: parsed.userName || '',
        userProfilePic: parsed.userProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        aiProfilePic: parsed.aiProfilePic || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        backgroundGradient: parsed.backgroundGradient || 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)',
        persona: parsed.persona || 'Partner',
        customPersonaPrompt: parsed.customPersonaPrompt || '',
        ttsEnabled: parsed.ttsEnabled !== undefined ? parsed.ttsEnabled : true,
        ttsAutoPlay: parsed.ttsAutoPlay !== undefined ? parsed.ttsAutoPlay : false,
        ttsVoice: parsed.ttsVoice || 'Zephyr',
        chatFontSize: parsed.chatFontSize || '14px',
        language: parsed.language || 'fa'
      };
    }
  } catch (e) {
    console.error("Failed to parse settings from localStorage", e);
  }
  return {
    aiName: 'سارا 💋',
    aiAge: '22',
    userName: '',
    userProfilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    aiProfilePic: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    backgroundGradient: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)',
    persona: 'Partner',
    customPersonaPrompt: '',
    ttsEnabled: true,
    ttsAutoPlay: false,
    ttsVoice: 'Zephyr',
    chatFontSize: '14px',
    language: 'fa'
  };
};

export const useAppStore = create<AppState>((set) => ({
  profiles: getInitialProfiles(),
  currentProfileId: null,
  showAddProfile: false,
  searchQuery: "",
  messages: [],
  isTyping: false,
  showSettings: false,
  isCalling: false,
  isVideoCall: false,
  incomingCallSession: null,
  showIncomingCallModal: false,
  showClearConfirm: false,
  showSuccessToast: false,
  showQuotaToast: false,
  apiKeyMissing: false,
  profileToDelete: null,
  deleteClearHistory: false,
  deleteRemoveFromPresets: false,
  showGeneralSettings: false,
  showGuideModal: false,
  activeListTab: 'contacts',
  isChannelActive: false,
  showGroupCreationModal: false,
  replyingMessage: null,
  editingMessage: null,
  showCharacterProfileModal: false,
  zoomedImageUrl: null,
  chatSearchQuery: "",
  showChatSearch: false,
  pinnedMsgId: null,
  forwardingMsg: null,
  showCreateStoryModal: false,
  activeUserStoryViewer: null,
  activeStory: null,
  lastActivity: Date.now(),
  showInactivityPopup: false,
  currentInactivityQuote: "",
  showDiagnostic: false,
  showHeaderMenu: false,
  profileModalInitialTab: 'photos',
  mutedProfileIds: [],
  toastMessage: null,
  myUid: '',
  settings: getInitialSettings(),
  userStories: [],

  setProfiles: (profiles) => set((state) => ({
    profiles: typeof profiles === 'function' ? profiles(state.profiles) : profiles
  })),
  setCurrentProfileId: (id) => set({ currentProfileId: id }),
  setShowAddProfile: (show) => set({ showAddProfile: show }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMessages: (messages) => set((state) => ({
    messages: typeof messages === 'function' ? messages(state.messages) : messages
  })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setShowSettings: (show) => set({ showSettings: show }),
  setIsCalling: (isCalling) => set({ isCalling }),
  setIsVideoCall: (isVideo) => set({ isVideoCall: isVideo }),
  setIncomingCallSession: (session) => set({ incomingCallSession: session }),
  setShowIncomingCallModal: (show) => set({ showIncomingCallModal: show }),
  setShowClearConfirm: (show) => set({ showClearConfirm: show }),
  setShowSuccessToast: (show) => set({ showSuccessToast: show }),
  setShowQuotaToast: (show) => set({ showQuotaToast: show }),
  setApiKeyMissing: (missing) => set({ apiKeyMissing: missing }),
  setProfileToDelete: (id) => set({ profileToDelete: id }),
  setDeleteClearHistory: (clear) => set({ deleteClearHistory: clear }),
  setDeleteRemoveFromPresets: (remove) => set({ deleteRemoveFromPresets: remove }),
  setShowGeneralSettings: (show) => set({ showGeneralSettings: show }),
  setShowGuideModal: (show) => set({ showGuideModal: show }),
  setActiveListTab: (tab) => set({ activeListTab: tab }),
  setIsChannelActive: (active) => set({ isChannelActive: active }),
  setShowGroupCreationModal: (show) => set({ showGroupCreationModal: show }),
  setReplyingMessage: (msg) => set({ replyingMessage: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),
  setShowCharacterProfileModal: (show) => set({ showCharacterProfileModal: show }),
  setZoomedImageUrl: (url) => set({ zoomedImageUrl: url }),
  setChatSearchQuery: (query) => set({ chatSearchQuery: query }),
  setShowChatSearch: (show) => set({ showChatSearch: show }),
  setPinnedMsgId: (id) => set({ pinnedMsgId: id }),
  setForwardingMsg: (msg) => set({ forwardingMsg: msg }),
  setShowCreateStoryModal: (show) => set({ showCreateStoryModal: show }),
  setActiveUserStoryViewer: (viewer) => set({ activeUserStoryViewer: viewer }),
  setActiveStory: (story) => set({ activeStory: story }),
  setLastActivity: (timestamp) => set({ lastActivity: timestamp }),
  setShowInactivityPopup: (show) => set({ showInactivityPopup: show }),
  setCurrentInactivityQuote: (quote) => set({ currentInactivityQuote: quote }),
  setShowDiagnostic: (show) => set({ showDiagnostic: show }),
  setShowHeaderMenu: (show) => set({ showHeaderMenu: show }),
  setProfileModalInitialTab: (tab) => set({ profileModalInitialTab: tab }),
  setMutedProfileIds: (ids) => set((state) => ({
    mutedProfileIds: typeof ids === 'function' ? ids(state.mutedProfileIds) : ids
  })),
  setToastMessage: (msg) => set({ toastMessage: msg }),
  setMyUid: (uid) => set({ myUid: uid }),
  setSettings: (settings) => set((state) => ({
    settings: typeof settings === 'function' ? settings(state.settings) : settings
  })),
  setUserStories: (stories) => set((state) => ({
    userStories: typeof stories === 'function' ? stories(state.userStories) : stories
  })),
}));
