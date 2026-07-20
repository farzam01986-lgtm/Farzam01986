import React, { useState } from 'react';
import { ChatProfile, ChatSettings, Message } from '../types';
import ChatArea from './ChatArea';
import InputArea from './InputArea';

interface ActiveChatViewProps {
  currentProfileId: string;
  setCurrentProfileId: (id: string | null) => void;
  activeProfile: ChatProfile | undefined;
  settings: ChatSettings;
  profiles: ChatProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<ChatProfile[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  
  activeLang: 'fa' | 'en' | 'ar' | 'es';
  t: any;
  getTranslatedProfileName: (p: ChatProfile | null | undefined) => string;
  getTranslatedProfileRoleLabel: (p: ChatProfile | null | undefined) => string;
  getTranslatedMessageText: (msg: any, profileId: string) => string;
  
  mutedProfileIds: string[];
  setMutedProfileIds: React.Dispatch<React.SetStateAction<string[]>>;
  isTyping: boolean;
  isTtsEnabled: boolean;
  currentlyPlayingMsgId: string | null;
  generatingAudioMsgIds: string[];
  pinnedMsgId: string | null;
  
  replyingMessage: Message | null;
  setReplyingMessage: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  
  // Handlers
  handleSelectProfile: (profileId: string) => void;
  handleStartCall: (isVideo?: boolean) => void;
  handleDeleteProfile: (id: string) => void;
  setZoomedImageUrl: (url: string) => void;
  setProfileModalInitialTab: (tab: 'photos' | 'voices' | 'links' | 'files') => void;
  setShowCharacterProfileModal: (show: boolean) => void;
  setShowClearConfirm: (show: boolean) => void;
  setShowDiagnostic: (show: boolean) => void;
  handleRequestSpeech: (msg: Message) => void;
  handleDeleteMessage: (id: string) => void;
  handleSendMessage: (text: string, image?: string, audio?: string, replyTo?: any) => void;
  handleReactMessage: (id: string, emoji: string) => void;
  handlePinMessage: (msg: Message) => void;
  handleForwardMessage: (msg: Message) => void;
}

export const ActiveChatView: React.FC<ActiveChatViewProps> = ({
  currentProfileId,
  setCurrentProfileId,
  activeProfile,
  settings,
  profiles,
  setProfiles,
  messages,
  setMessages,
  activeLang,
  t,
  getTranslatedProfileName,
  getTranslatedProfileRoleLabel,
  getTranslatedMessageText,
  mutedProfileIds,
  setMutedProfileIds,
  isTyping,
  isTtsEnabled,
  currentlyPlayingMsgId,
  generatingAudioMsgIds,
  pinnedMsgId,
  replyingMessage,
  setReplyingMessage,
  editingMessage,
  setEditingMessage,
  handleSelectProfile,
  handleStartCall,
  handleDeleteProfile,
  setZoomedImageUrl,
  setProfileModalInitialTab,
  setShowCharacterProfileModal,
  setShowClearConfirm,
  setShowDiagnostic,
  handleRequestSpeech,
  handleDeleteMessage,
  handleSendMessage,
  handleReactMessage,
  handlePinMessage,
  handleForwardMessage,
}) => {
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const activeBg = activeProfile?.chatBackground || settings.backgroundGradient;
  const backgroundStyle = activeBg.startsWith('data:image') || activeBg.startsWith('http') || activeBg.startsWith('https')
    ? { backgroundImage: `url(${activeBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: activeBg };

  return (
    <div id="active-chat-view-container" className="flex flex-col h-full w-full relative">
      <div id="active-chat-header" className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#517da2] to-[#3a5d7c] text-white shadow-md select-none shrink-0" dir="rtl">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Back Button to return to list */}
          <button 
            id="btn-back-to-list"
            type="button"
            onClick={() => setCurrentProfileId(null)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 text-white/95 shrink-0 cursor-pointer"
            title="بازگشت به لیست گفتگوها"
          >
            <i className="fas fa-arrow-right text-base"></i>
          </button>

          {/* Avatar and Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div 
              id="header-chat-avatar"
              className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-sm bg-gray-50 shrink-0 cursor-zoom-in hover:scale-105 active:scale-95 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImageUrl(activeProfile?.avatar || settings.aiProfilePic || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400');
              }}
              title="بزرگنمایی تصویر"
            >
              <img src={activeProfile?.avatar || settings.aiProfilePic} alt={activeProfile?.name || settings.aiName} className="w-full h-full object-cover" />
            </div>
            {(() => {
              const headerText = activeProfile 
                ? `${getTranslatedProfileName(activeProfile)}${activeProfile.isGroup ? "" : ` (${getTranslatedProfileRoleLabel(activeProfile)})`}`
                : settings.aiName;

              const getHeaderFontSizeClass = (text: string) => {
                const len = text.length;
                if (len < 15) return 'text-[14px] md:text-[15px]';
                if (len < 25) return 'text-[12.5px] md:text-[13.5px]';
                if (len < 35) return 'text-[11px] md:text-[12px]';
                return 'text-[9.5px] md:text-[10.5px]';
              };

              return (
                <div 
                  id="header-profile-info"
                  className="text-right min-w-0 cursor-pointer hover:opacity-85 select-none transition-opacity flex-1 flex flex-col justify-center h-10"
                  onClick={() => {
                    setProfileModalInitialTab('photos');
                    setShowCharacterProfileModal(true);
                  }}
                  title="مشاهده اطلاعات و تنظیمات شخصیت"
                >
                  <div className="flex items-center gap-1.5 min-w-0 justify-start">
                    <h2 className={`font-black text-white truncate leading-tight flex items-center gap-1.5 justify-start ${getHeaderFontSizeClass(headerText)}`}>
                      {mutedProfileIds.includes(currentProfileId) && (
                        <i className="fas fa-volume-mute text-[10px] opacity-75"></i>
                      )}
                      <span>{headerText}</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 justify-start">
                    {activeProfile?.isGroup ? (
                      <span className="text-[9px] text-blue-100 font-bold tracking-tight">
                        {activeProfile.memberIds ? `${activeProfile.memberIds.length} ${t.members}، ${activeProfile.memberIds.length} ${t.online}` : t.group}
                      </span>
                    ) : (
                      <>
                        <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-[9px] text-blue-100 font-bold tracking-tight">
                          {isTyping ? t.typing : t.online}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* Telegram-style Vertical Ellipsis 3-dots Button */}
          <button 
            id="btn-toggle-header-menu"
            type="button"
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${showHeaderMenu ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            title={t.chatMenu}
          >
            <i className="fas fa-ellipsis-v text-sm"></i>
          </button>

          {/* Telegram-style Dropdown Menu */}
          {showHeaderMenu && (
            <>
              {/* Click-away backdrop layer */}
              <div id="header-menu-backdrop" className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)}></div>
              
              <div id="header-dropdown-menu" className="absolute left-0 top-11 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 flex flex-col text-right animate-in fade-in zoom-in-95 duration-150" dir="rtl">
                {/* Item 1: Mute/Unmute */}
                <button 
                  id="menu-item-mute"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    const isCurrentlyMuted = mutedProfileIds.includes(currentProfileId);
                    if (isCurrentlyMuted) {
                      setMutedProfileIds(prev => prev.filter(id => id !== currentProfileId));
                    } else {
                      setMutedProfileIds(prev => [...prev, currentProfileId]);
                    }
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">
                    {mutedProfileIds.includes(currentProfileId) ? t.unmute : t.mute}
                  </span>
                  <i className={`fas ${mutedProfileIds.includes(currentProfileId) ? 'fa-volume-up text-blue-500' : 'fa-volume-mute text-gray-400'} text-sm`}></i>
                </button>

                {/* Item 2: Voice Call (Only if not group) */}
                {!activeProfile?.isGroup && (
                  <button 
                    id="menu-item-voice-call"
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleStartCall();
                    }}
                    className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                  >
                    <span className="text-right">{t.voiceCall}</span>
                    <i className="fas fa-phone-alt text-gray-400 text-sm"></i>
                  </button>
                )}

                {/* Item 3: Video Call */}
                <button 
                  id="menu-item-video-call"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleStartCall(true);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">{t.videoCall}</span>
                  <i className="fas fa-video text-gray-400 text-sm"></i>
                </button>

                {/* Item 4: Search inside Chat */}
                <button 
                  id="menu-item-search-chat"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowChatSearch(!showChatSearch);
                    if (showChatSearch) setChatSearchQuery("");
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">{t.searchInChat}</span>
                  <i className="fas fa-search text-gray-400 text-sm"></i>
                </button>

                <div className="h-[1px] bg-gray-100 my-1"></div>

                {/* Item 5: Clear Chat History */}
                <button 
                  id="menu-item-clear-history"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowClearConfirm(true);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">{t.clearHistory}</span>
                  <i className="fas fa-broom text-gray-400 text-sm"></i>
                </button>

                {/* Item 6: Change Background */}
                <button 
                  id="menu-item-change-bg"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setProfileModalInitialTab('photos');
                    setShowCharacterProfileModal(true);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">{t.changeBg}</span>
                  <i className="fas fa-palette text-gray-400 text-sm"></i>
                </button>

                {/* Item 10: Uploaded Photos */}
                <button 
                  id="menu-item-uploaded-photos"
                  type="button"
                  onClick={() => {
                    showHeaderMenu && setShowHeaderMenu(false);
                    setProfileModalInitialTab('photos');
                    setShowCharacterProfileModal(true);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-gray-700 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">{t.uploadedPhotos}</span>
                  <i className="fas fa-images text-gray-400 text-sm"></i>
                </button>
                
                {activeProfile?.isGroup && !activeProfile?.isLeft && (
                  <button 
                    id="menu-item-leave-group"
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (window.confirm(t.confirmLeaveGroup)) {
                        const systemMsg: Message = {
                          id: "system-" + Date.now(),
                          text: t.leftGroup,
                          sender: "system",
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, systemMsg]);
                        setProfiles(prev => prev.map(p => p.id === currentProfileId ? {
                          ...p,
                          isLeft: true,
                          messages: [...(p.messages || []), systemMsg]
                        } : p));
                      }
                    }}
                    className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-red-600 text-xs font-black transition-colors w-full cursor-pointer"
                  >
                    <span className="text-right">ترک گروه</span>
                    <i className="fas fa-door-open text-red-500 text-sm"></i>
                  </button>
                )}

                {/* Item 7: Delete Chat */}
                <button 
                  id="menu-item-delete-chat"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleDeleteProfile(currentProfileId);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-red-600 text-xs font-black transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">حذف گفتگو</span>
                  <i className="fas fa-trash-alt text-red-500 text-sm"></i>
                </button>

                <div className="h-[1px] bg-gray-100 my-1"></div>

                {/* Item 9: Diagnostics and System Monitor */}
                <button 
                  id="menu-item-diagnostics"
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowDiagnostic(true);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between text-green-600 text-xs font-bold transition-colors w-full cursor-pointer"
                >
                  <span className="text-right">پایش و عیب‌یابی</span>
                  <i className="fas fa-shield-alt text-green-500 text-sm"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showChatSearch && (
        <div id="chat-search-panel" className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top duration-200 z-20 relative" dir="rtl">
          <div className="relative flex-1">
            <input 
              id="input-chat-search"
              type="text"
              placeholder="جستجوی متن در این گفتگو..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-1.5 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-right"
              autoFocus
            />
            <i className="fas fa-search absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
          <button 
            id="btn-cancel-chat-search"
            type="button"
            onClick={() => {
              setShowChatSearch(false);
              setChatSearchQuery("");
            }}
            className="text-xs font-black text-gray-500 hover:text-gray-700 px-2 py-1.5 transition-colors cursor-pointer"
          >
            لغو
          </button>
        </div>
      )}

      <div id="active-chat-area-container" className="flex-1 relative overflow-hidden" style={backgroundStyle}>
        {!settings.backgroundGradient.startsWith('data:image') && <div className="telegram-pattern"></div>}
        <ChatArea 
          messages={messages.map(m => ({
            ...m,
            text: getTranslatedMessageText(m, currentProfileId)
          }))} 
          userProfilePic={settings.userProfilePic}
          aiProfilePic={settings.aiProfilePic} 
          aiName={settings.aiName}
          ttsEnabled={isTtsEnabled}
          currentlyPlayingMsgId={currentlyPlayingMsgId}
          generatingAudioMsgIds={generatingAudioMsgIds}
          onPlayAudio={handleRequestSpeech}
          onRetryAudio={handleRequestSpeech}
          onDeleteMessage={handleDeleteMessage}
          onStartChat={() => handleSendMessage("سلام")}
          onStartCall={handleStartCall}
          onReplyMessage={(msg) => setReplyingMessage(msg)}
          onEditMessage={(msg) => setEditingMessage(msg)}
          onReactMessage={handleReactMessage}
          onPinMessage={handlePinMessage}
          onForwardMessage={handleForwardMessage}
          pinnedMsgId={pinnedMsgId}
          searchQuery={chatSearchQuery}
          isGroup={activeProfile?.isGroup}
          onAvatarClick={(senderName) => {
            const foundProfile = profiles.find(p => p.name === senderName);
            if (foundProfile) {
              handleSelectProfile(foundProfile.id);
            }
          }}
          chatFontSize={settings.chatFontSize || '14px'}
          activeLang={activeLang}
        />
      </div>

      {activeProfile?.isLeft ? (
        <div id="left-group-indicator" className="p-4 bg-red-50 border-t border-red-100 flex items-center justify-center gap-2 text-red-600 font-extrabold text-xs select-none" dir="rtl">
          <i className="fas fa-door-open text-sm"></i>
          <span>شما از این گروه خارج شده‌اید. امکان ارسال پیام وجود ندارد.</span>
        </div>
      ) : (
        <InputArea 
          onSend={handleSendMessage} 
          replyingMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onUpdateMessage={(msgId, newText) => {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: newText, isEdited: true } : m));
            setEditingMessage(null);
          }}
          activeLang={activeLang}
        />
      )}
    </div>
  );
};
