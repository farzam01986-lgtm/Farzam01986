import React from 'react';
import { ChatProfile, ChatSettings } from '../types';
import { StorySection, Story } from './StorySection';
import { ChannelsTab } from './ChannelsTab';
import GoogleDriveTab from './GoogleDriveTab';
import { auth } from '../firebase';

interface ProfileListViewProps {
  activeLang: 'fa' | 'en' | 'ar' | 'es';
  t: any;
  isRtl: boolean;
  profiles: ChatProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<ChatProfile[]>>;
  settings: ChatSettings;
  userStories: any[];
  setUserStories: React.Dispatch<React.SetStateAction<any[]>>;
  currentUserId: string | null;
  chatServiceRefCurrent: any;
  handleSelectProfile: (profileId: string) => void;
  handleDeleteProfile: (profileId: string) => void;
  getTranslatedProfileName: (p: ChatProfile | null | undefined) => string;
  getTranslatedProfileRoleLabel: (p: ChatProfile | null | undefined) => string;
  getTranslatedMessageText: (msg: any, profileId: string) => string;
  formatLastActive: (timestamp: number | undefined) => string;
  
  // State getters/setters
  activeListTab: 'contacts' | 'groups' | 'channels' | 'drive';
  setActiveListTab: (tab: 'contacts' | 'groups' | 'channels' | 'drive') => void;
  isChannelActive: boolean;
  setIsChannelActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  setShowCreateStoryModal: (show: boolean) => void;
  setShowGeneralSettings: (show: boolean) => void;
  setShowGroupCreationModal: (show: boolean) => void;
  setShowAddProfile: (show: boolean) => void;
  setActiveStory: (story: Story | null) => void;
  setActiveUserStoryViewer: (story: any) => void;
}

export const ProfileListView: React.FC<ProfileListViewProps> = ({
  activeLang,
  t,
  isRtl,
  profiles,
  setProfiles,
  settings,
  userStories,
  setUserStories,
  currentUserId,
  chatServiceRefCurrent,
  handleSelectProfile,
  handleDeleteProfile,
  getTranslatedProfileName,
  getTranslatedProfileRoleLabel,
  getTranslatedMessageText,
  formatLastActive,
  activeListTab,
  setActiveListTab,
  isChannelActive,
  setIsChannelActive,
  searchQuery,
  setSearchQuery,
  setShowCreateStoryModal,
  setShowGeneralSettings,
  setShowGroupCreationModal,
  setShowAddProfile,
  setActiveStory,
  setActiveUserStoryViewer,
}) => {
  const filteredProfiles = profiles.filter(p => {
    // If the active tab is 'groups', only show groups. Otherwise, only show individual chats
    if (activeListTab === 'groups') {
      if (!p.isGroup) return false;
    } else if (activeListTab === 'contacts') {
      if (p.isGroup) return false;
    } else {
      return false; // For channels or drive, they have their own custom tab view logic
    }

    if (!searchQuery.trim()) return true;
    const nameMatch = getTranslatedProfileName(p).toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = getTranslatedProfileRoleLabel(p).toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || roleMatch;
  });

  const sortedProfiles = [...filteredProfiles].sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

  const [visibleCount, setVisibleCount] = React.useState(30);

  React.useEffect(() => {
    setVisibleCount(30);
  }, [activeListTab, searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
      if (visibleCount < sortedProfiles.length) {
        setVisibleCount(prev => Math.min(prev + 30, sortedProfiles.length));
      }
    }
  };

  const visibleProfiles = sortedProfiles.slice(0, visibleCount);

  return (
    <div id="profile-list-view-container" className="flex flex-col h-full w-full bg-slate-50 relative">
      {/* Main List Header */}
      {!(isChannelActive && activeListTab === 'channels') && (
        <div id="main-list-header" className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#517da2] to-[#3a5d7c] text-white shadow-md select-none shrink-0" dir={isRtl ? "rtl" : "ltr"}>
          <h1 className="text-base font-black text-white">{t.appTitle}</h1>
          <div className="flex items-center gap-2">
            <button 
              id="btn-trigger-create-story"
              type="button"
              onClick={() => setShowCreateStoryModal(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer animate-pulse-subtle"
              title={t.newStory}
            >
              <i className="fas fa-camera text-sm"></i>
            </button>
            <button 
              id="btn-trigger-general-settings"
              type="button"
              onClick={() => setShowGeneralSettings(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title={t.messengerSettings}
            >
              <i className="fas fa-cog text-base animate-spin-slow"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header Tabs (Telegram-like) */}
      {!(isChannelActive && activeListTab === 'channels') && (
        <div id="header-tabs" className="flex border-b border-gray-100 bg-white shrink-0 select-none" dir={isRtl ? "rtl" : "ltr"}>
          <button 
            id="tab-contacts"
            type="button"
            onClick={() => setActiveListTab('contacts')}
            className={`flex-1 py-3 text-xs font-black transition-all border-b-2 text-center ${
              activeListTab === 'contacts' 
                ? 'border-b-[#517da2] text-[#517da2]' 
                : 'border-b-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.contactsTab} ({profiles.filter(p => !p.isGroup).length})
          </button>
          <button 
            id="tab-groups"
            type="button"
            onClick={() => setActiveListTab('groups')}
            className={`flex-1 py-3 text-xs font-black transition-all border-b-2 text-center ${
              activeListTab === 'groups' 
                ? 'border-b-[#517da2] text-[#517da2]' 
                : 'border-b-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.groupsTab} ({profiles.filter(p => p.isGroup).length})
          </button>
          <button 
            id="tab-channels"
            type="button"
            onClick={() => setActiveListTab('channels')}
            className={`flex-1 py-3 text-xs font-black transition-all border-b-2 text-center ${
              activeListTab === 'channels' 
                ? 'border-b-[#517da2] text-[#517da2]' 
                : 'border-b-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.channelsTab}
          </button>
          <button 
            id="tab-drive"
            type="button"
            onClick={() => setActiveListTab('drive')}
            className={`flex-1 py-3 text-xs font-black transition-all border-b-2 text-center ${
              activeListTab === 'drive' 
                ? 'border-b-[#517da2] text-[#517da2]' 
                : 'border-b-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            ☁️ {activeLang === 'fa' ? 'پشتیبان ابری' : activeLang === 'ar' ? 'درايف' : activeLang === 'es' ? 'Drive' : 'Drive'}
          </button>
        </div>
      )}

      {/* Search Bar */}
      {activeListTab !== 'channels' && activeListTab !== 'drive' && (
        <div id="search-bar-container" className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="relative">
            <input 
              id="input-search-profiles"
              type="text"
              placeholder={t.searchPlaceholder || (isRtl ? "جستجو..." : "Search...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-700 font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm placeholder-gray-400 ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            />
            <i className={`fas fa-search absolute top-1/2 -translate-y-1/2 text-gray-400 text-xs ${
              isRtl ? 'right-4' : 'left-4'
            }`}></i>
            {searchQuery && (
              <button 
                id="btn-clear-search"
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times-circle text-sm"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {activeListTab === 'channels' ? (
        <ChannelsTab profiles={profiles} settings={settings} activeLang={activeLang} onChannelSelectStateChange={setIsChannelActive} />
      ) : activeListTab === 'drive' ? (
        <GoogleDriveTab activeLang={activeLang} />
      ) : (
        <>
          {/* List of Profiles */}
          <div id="profiles-list-scroll" onScroll={handleScroll} className="flex-1 overflow-y-auto bg-white custom-scrollbar divide-y divide-gray-50 pb-20">
            {activeListTab === 'contacts' && (
              <StorySection 
                profiles={profiles} 
                onOpenStory={(story) => setActiveStory(story)}
                userStories={userStories}
                onOpenUserStory={(story) => setActiveUserStoryViewer(story)}
                onOpenCreateStory={() => setShowCreateStoryModal(true)}
                currentUserId={settings.userId || auth.currentUser?.uid}
                chatService={chatServiceRefCurrent}
                userName={settings.userName}
                activeLang={activeLang}
              />
            )}
            {sortedProfiles.length === 0 ? (
              <div id="no-contacts-placeholder" className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400 select-none animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                  <i className="fas fa-users text-xl text-gray-300"></i>
                </div>
                <p className="text-xs font-bold text-gray-500">{t.noContactsFound}</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed max-w-[220px]">
                  {settings.language === 'fa' 
                    ? 'با فشردن علامت + در پایین سمت چپ می‌توانید مخاطبین جدید بسازید یا اضافه کنید.' 
                    : settings.language === 'ar' 
                    ? 'يمكنك إنشاء جهات اتصال جديدة أو إضافتها بالضغط على علامة + في أسفل اليسار.' 
                    : settings.language === 'es' 
                    ? 'Puede crear o agregar nuevos contactos presionando el signo + en la esquina inferior izquierda.' 
                    : 'You can create or add new contacts by pressing the + sign in the bottom left corner.'}
                </p>
              </div>
            ) : (
              visibleProfiles.map((p) => {
                const lastMsg = p.messages && p.messages.length > 0 ? p.messages[p.messages.length - 1] : null;
                const lastMsgText = lastMsg ? (lastMsg.isCallLog ? (settings.language === 'fa' ? "📞 تماس برقرار شد" : settings.language === 'ar' ? "📞 تم إجراء الاتصال" : settings.language === 'es' ? "📞 Llamada establecida" : "📞 Call established") : getTranslatedMessageText(lastMsg, p.id)) : "";
                
                return (
                  <div 
                    id={`profile-item-${p.id}`}
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/75 transition-all cursor-pointer active:bg-slate-100/70 border-b border-gray-50"
                  >
                    {/* Avatar with dynamic online badge */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                        <img src={p.avatar} alt={getTranslatedProfileName(p)} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <span className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-right min-w-0" dir="rtl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-black text-gray-900 text-[14px] hover:text-[#517da2] transition-colors truncate">
                            {getTranslatedProfileName(p)} <span className="text-[11px] font-bold text-gray-400">({getTranslatedProfileRoleLabel(p)})</span>
                          </span>
                          {p.unreadCount && p.unreadCount > 0 ? (
                            <span className="text-[10px] bg-green-500 text-white font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap min-w-[20px] text-center shadow-sm">
                              {p.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap font-mono">
                          {formatLastActive(p.lastActive)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-gray-400 font-medium truncate max-w-[170px] text-right">
                          {lastMsg ? (
                            <>
                              {lastMsg.sender === 'user' ? (
                                <span className="text-gray-400 font-bold">
                                  {settings.language === 'fa' ? 'شما: ' : settings.language === 'ar' ? 'أنت: ' : settings.language === 'es' ? 'Tú: ' : 'You: '}
                                </span>
                              ) : null}
                              {lastMsgText}
                            </>
                          ) : (
                            <span className="text-[#517da2] font-black italic text-[9px]">
                              {settings.language === 'fa' ? 'شروع اولین گفتگو ✨' : settings.language === 'ar' ? 'ابدأ أول محادثة ✨' : settings.language === 'es' ? 'Comienza el primer chat ✨' : 'Start the first chat ✨'}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`btn-delete-profile-item-${p.id}`}
                            type="button"
                            onClick={() => {
                              handleDeleteProfile(p.id);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100/90 text-red-500 flex items-center justify-center border border-red-100 transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
                            title="حذف مخاطب"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating plus button at bottom left */}
          <button 
            id="btn-add-profile-floating"
            type="button"
            onClick={() => {
              if (activeListTab === 'groups') {
                setShowGroupCreationModal(true);
              } else {
                setShowAddProfile(true);
              }
            }}
            className="absolute bottom-4 left-6 w-11 h-11 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-full shadow-xl shadow-[#517da2]/40 transition-all active:scale-95 flex items-center justify-center z-20 cursor-pointer"
            title={activeListTab === 'groups' ? "ایجاد گروه جدید" : "افزودن مخاطب جدید"}
          >
            <i className="fas fa-plus text-base"></i>
          </button>
        </>
      )}
    </div>
  );
};
