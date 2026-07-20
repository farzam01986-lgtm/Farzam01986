import React, { useState, useEffect } from 'react';
import { ChatProfile, Message } from '../types';
import { ROLE_LABELS } from '../src/initialProfiles';
import { translations } from '../src/translations';

interface CharacterProfileModalProps {
  profile: ChatProfile;
  messages: Message[];
  onClose: () => void;
  onUpdateTTS: (updatedProfile: ChatProfile) => void;
  onZoomImage: (imageUrl: string) => void;
  onPlayAudioMsg?: (msg: Message) => void;
  currentlyPlayingMsgId?: string | null;
  onClearHistory?: () => void;
  initialTab?: 'photos' | 'voices' | 'links' | 'files';
  allProfiles?: ChatProfile[];
  activeLang?: string;
}

export const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({
  profile,
  messages,
  onClose,
  onUpdateTTS,
  onZoomImage,
  onPlayAudioMsg,
  currentlyPlayingMsgId,
  onClearHistory,
  initialTab,
  allProfiles = [],
  activeLang = "fa"
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'voices' | 'links' | 'files'>(initialTab || 'photos');
  const t = translations[activeLang as 'fa' | 'en' | 'ar' | 'es'] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load profile-specific TTS override state
  const [ttsEnabled, setTtsEnabled] = useState(profile.ttsOverrideEnabled !== false);
  const [ttsAutoPlay, setTtsAutoPlay] = useState(profile.ttsOverrideAutoPlay === true);
  const [ttsVoice, setTtsVoice] = useState(profile.ttsOverrideVoice || 'Zephyr');

  // Local sync to parent whenever options change
  useEffect(() => {
    onUpdateTTS({
      ...profile,
      ttsOverrideEnabled: ttsEnabled,
      ttsOverrideAutoPlay: ttsAutoPlay,
      ttsOverrideVoice: ttsVoice
    });
  }, [ttsEnabled, ttsAutoPlay, ttsVoice]);

  // Calculations for stats
  const totalMsgs = messages.length;
  const wordCount = messages.reduce((acc, m) => acc + (m.text ? m.text.trim().split(/\s+/).length : 0), 0);
  
  // Calculate duration of acquaintance
  const getFamiliarityDuration = () => {
    if (messages.length === 0) return 'امروز شروع شده';
    const firstMsg = messages[0];
    const diffMs = Date.now() - new Date(firstMsg.timestamp).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'امروز شروع شده';
    if (diffDays === 1) return '۱ روز';
    return `${diffDays} روز`;
  };

  // Filter media from message history
  const photos = messages.filter(m => m.image);
  const voices = messages.filter(m => m.audioBase64);
  
  // Extract links from messages using regex
  const links = messages.reduce<{ id: string; url: string; text: string; timestamp: Date }[]>((acc, m) => {
    if (!m.text) return acc;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = m.text.match(urlRegex);
    if (matches) {
      matches.forEach((url, i) => {
        acc.push({
          id: `${m.id}-link-${i}`,
          url,
          text: m.text.length > 30 ? m.text.substring(0, 30) + '...' : m.text,
          timestamp: m.timestamp
        });
      });
    }
    return acc;
  }, []);

  // Simulate file attachments from messages (files contain typical formats or mock file uploads)
  const files = messages.reduce<{ id: string; name: string; size: string; timestamp: Date }[]>((acc, m) => {
    if (m.text && (m.text.includes('.pdf') || m.text.includes('.docx') || m.text.includes('.zip') || m.text.includes('فایل'))) {
      const parts = m.text.split(' ');
      const fileName = parts.find(p => p.includes('.')) || 'Document.pdf';
      acc.push({
        id: `${m.id}-file`,
        name: fileName,
        size: '1.4 MB',
        timestamp: m.timestamp
      });
    }
    return acc;
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Header with profile picture */}
        <div className="relative bg-gradient-to-r from-[#517da2] to-[#3a5d7c] py-6 px-6 text-center flex flex-col items-center justify-center shrink-0 animate-in fade-in duration-200" dir={isRtl ? "rtl" : "ltr"}>
          <button 
            onClick={onClose}
            className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10`}
            title={t.closeBtn}
          >
            <i className="fas fa-times text-sm"></i>
          </button>

          {/* Avatar Zoom action and Custom Edit/Upload overlay */}
          <div className="relative w-20 h-20 mx-auto group">
            <button
              onClick={() => onZoomImage(profile.avatar)}
              className="w-full h-full rounded-full border-2 border-white/40 shadow-lg overflow-hidden bg-gray-100 block transition-transform hover:scale-105 active:scale-95"
              title={t.zoomImage}
            >
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            </button>
            <label 
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-90 border-2 border-white"
              title={t.changeProfilePic}
            >
              <i className="fas fa-camera text-[10px]"></i>
              <input 
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      onUpdateTTS({
                        ...profile,
                        avatar: reader.result as string
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          <h2 className="text-white font-black text-lg mt-4 px-1 break-words leading-snug text-center">{profile.name}</h2>
          <p className="text-blue-100 text-xs mt-1.5 font-bold text-center px-1">
            {profile.isGroup 
              ? t.publicGroup 
              : `${profile.customRoleLabel || ROLE_LABELS[profile.role] || (activeLang === 'fa' ? "مخاطب" : "Contact")} • ${profile.age} ${activeLang === 'fa' ? 'ساله' : 'years old'}`}
          </p>
          {profile.description && (
            <div className="w-full mt-3 px-1">
              <p className={`text-blue-50 ${
                profile.description.length < 20 ? 'text-[15px] sm:text-[17px] font-black' :
                profile.description.length < 45 ? 'text-[13px] sm:text-[15px] font-extrabold' :
                profile.description.length < 90 ? 'text-[12px] sm:text-[13px] font-bold' :
                profile.description.length < 150 ? 'text-[11px] sm:text-[12px] font-semibold' : 'text-[10px] sm:text-[11px] font-medium'
              } bg-black/25 px-4 py-2.5 rounded-2xl block text-center leading-relaxed whitespace-pre-wrap break-words border border-white/5 w-full mx-auto`} dir={isRtl ? "rtl" : "ltr"}>
                {profile.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {profile.isGroup ? (
            <>
              {/* Group Edit Details */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h3 className="text-gray-800 text-xs font-black mb-1 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                  <i className="fas fa-edit text-blue-500"></i>
                  <span>{t.editGroupInfo}</span>
                </h3>
                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold block mb-1">{t.groupName}</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={(e) => onUpdateTTS({ ...profile, name: e.target.value })} 
                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none font-bold animate-pulse-once"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold block mb-1">
                    {isRtl ? 'لینک دعوت گروه تلگرامی:' : 'Telegram Group Invite Link:'}
                  </label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl">
                    <span className="font-mono text-[9.5px] text-gray-500 select-all truncate flex-1 text-left">
                      {`https://t.me/joinchat/g${profile.id.replace('group-', '')}`}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://t.me/joinchat/g${profile.id.replace('group-', '')}`);
                        alert(isRtl ? 'لینک دعوت گروه با موفقیت کپی شد! 🔗' : 'Group invite link copied! 🔗');
                        
                        // Let's also trigger a simulated member join for group!
                        setTimeout(() => {
                          const availableProfiles = allProfiles.filter(ap => !ap.isGroup && !(profile.memberIds || []).includes(ap.id));
                          if (availableProfiles.length > 0) {
                            const joinedProfile = availableProfiles[Math.floor(Math.random() * availableProfiles.length)];
                            const updatedIds = [...(profile.memberIds || []), joinedProfile.id];
                            const systemMsg: Message = {
                              id: "system-" + Date.now(),
                              text: isRtl 
                                ? `🎉 [${joinedProfile.name}] با لینک دعوت گروه عضو شد!` 
                                : `🎉 [${joinedProfile.name}] joined the group via invite link!`,
                              sender: "system",
                              timestamp: new Date()
                            };
                            const updatedMessages = [...(profile.messages || []), systemMsg];
                            onUpdateTTS({
                              ...profile,
                              memberIds: updatedIds,
                              messages: updatedMessages
                            });
                            alert(isRtl 
                              ? `🔔 پیام سیستم: [${joinedProfile.name}] با لینک دعوت وارد گروه شد!` 
                              : `🔔 System message: [${joinedProfile.name}] joined the group via invite link!`
                            );
                          }
                        }, 4000);
                      }}
                      type="button"
                      className="px-2.5 py-1 bg-[#517da2] text-white rounded-lg text-[9px] font-black cursor-pointer hover:bg-[#436a8d] transition-colors"
                    >
                      {isRtl ? 'کپی' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Members List & Management */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                <h3 className="text-gray-800 text-xs font-black mb-3 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                  <i className="fas fa-users text-blue-500"></i>
                  <span>{t.manageGroupMembers}</span>
                </h3>
                
                {/* List of current members */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto mb-3.5 pr-0.5">
                  {/* Real user (Creator) */}
                  <div className="flex items-center justify-between bg-amber-50/50 p-2 rounded-xl border border-amber-100/50 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-[10px]">
                        {activeLang === 'fa' ? 'من' : 'Me'}
                      </div>
                      <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                        <span className="font-extrabold text-slate-800">{t.youLabel}</span>
                        <span className="text-[9px] text-amber-600">{t.memberLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.isLeft ? (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-black">
                          {activeLang === 'fa' ? 'خارج شده‌اید 🚪' : 'Left 🚪'}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm(t.confirmLeaveGroup)) {
                              const systemMsg: Message = {
                                id: "system-" + Date.now(),
                                text: t.leftGroup,
                                sender: "system",
                                timestamp: new Date()
                              };
                              const updatedMessages = [...(profile.messages || []), systemMsg];
                              onUpdateTTS({
                                ...profile,
                                isLeft: true,
                                messages: updatedMessages
                              });
                            }
                          }}
                          className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 rounded-lg border border-red-100 cursor-pointer active:scale-95 transition-all"
                        >
                          {t.leaveGroup}
                        </button>
                      )}
                    </div>
                  </div>

                  {allProfiles.filter(p => profile.memberIds?.includes(p.id)).map((m) => {
                    return (
                      <div key={m.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover border border-slate-100" />
                          <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                            <span className="font-extrabold text-slate-800">{m.name}</span>
                            <span className="text-[9px] text-gray-400">{m.customRoleLabel || ROLE_LABELS[m.role] || (activeLang === 'fa' ? "مخاطب" : "Contact")}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updatedIds = (profile.memberIds || []).filter(id => id !== m.id);
                              const systemMsg: Message = {
                                id: "system-" + Date.now(),
                                text: activeLang === 'fa' ? `🚪 کاربر [${m.name}] از گروه حذف شد.` : `🚪 User [${m.name}] was removed from the group.`,
                                sender: "system",
                                timestamp: new Date()
                              };
                              const updatedMessages = [...(profile.messages || []), systemMsg];
                              onUpdateTTS({ 
                                ...profile, 
                                memberIds: updatedIds,
                                messages: updatedMessages
                              });
                            }}
                            className="text-[10px] text-red-500 hover:text-red-700 font-black cursor-pointer bg-red-50 px-2 py-1 rounded-lg border border-red-100 active:scale-95 transition-all"
                          >
                            {t.removeBtn}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add new members with individual click buttons */}
                {allProfiles.filter(p => !p.isGroup && !profile.memberIds?.includes(p.id)).length > 0 ? (
                  <div className="space-y-2 mt-4 border-t border-slate-200/40 pt-3">
                    <label className="text-[10px] text-gray-400 font-extrabold block">{t.addNewMembers}</label>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                      {allProfiles
                        .filter(p => !p.isGroup && !profile.memberIds?.includes(p.id))
                        .map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 text-xs shadow-sm">
                            <div className="flex items-center gap-2">
                              <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover border border-slate-100" />
                              <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                                <span className="font-extrabold text-slate-700 text-[11px]">{p.name}</span>
                                <span className="text-[8px] text-gray-400">{p.customRoleLabel || ROLE_LABELS[p.role] || (activeLang === 'fa' ? "مخاطب" : "Contact")}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const updatedIds = [...(profile.memberIds || []), p.id];
                                const systemMsg: Message = {
                                  id: "system-" + Date.now(),
                                  text: activeLang === 'fa' ? `👤 کاربر [${p.name}] به گروه اضافه شد.` : `👤 User [${p.name}] was added to the group.`,
                                  sender: "system",
                                  timestamp: new Date()
                                };
                                const updatedMessages = [...(profile.messages || []), systemMsg];
                                onUpdateTTS({ 
                                  ...profile, 
                                  memberIds: updatedIds,
                                  messages: updatedMessages
                                });
                              }}
                              className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-black px-2.5 py-1 rounded-lg border border-blue-100 active:scale-95 transition-all cursor-pointer"
                            >
                              {activeLang === 'fa' ? '+ افزودن به گروه' : '+ Add to Group'}
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-400 font-bold text-center mt-3 border-t border-slate-100 pt-3">{t.noOtherContacts}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Voice settings for this specific character */}
              {!profile.isGroup && (
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <h3 className="text-gray-800 text-xs font-black mb-3 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                    <i className="fas fa-volume-up text-pink-500"></i>
                    <span>{t.voiceSettings}</span>
                  </h3>
                  
                  <div className="flex flex-col gap-3.5">
                    {/* Audio Playback mode choices */}
                    <div>
                      <label className="text-[10px] text-gray-400 font-extrabold block mb-1.5">{t.playbackMode}</label>
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/50 p-1 rounded-xl text-center text-xs font-bold">
                        <button
                          onClick={() => { setTtsEnabled(true); setTtsAutoPlay(true); }}
                          className={`py-1.5 rounded-lg transition-all ${ttsEnabled && ttsAutoPlay ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {activeLang === 'fa' ? 'اتوماتیک' : (activeLang === 'ar' ? 'تلقائي' : (activeLang === 'es' ? 'Automático' : 'Automatic'))}
                        </button>
                        <button
                          onClick={() => { setTtsEnabled(true); setTtsAutoPlay(false); }}
                          className={`py-1.5 rounded-lg transition-all ${ttsEnabled && !ttsAutoPlay ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {activeLang === 'fa' ? 'دستی' : (activeLang === 'ar' ? 'يدوي' : (activeLang === 'es' ? 'Manual' : 'Manual'))}
                        </button>
                        <button
                          onClick={() => { setTtsEnabled(false); }}
                          className={`py-1.5 rounded-lg transition-all ${!ttsEnabled ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {activeLang === 'fa' ? 'غیرفعال' : (activeLang === 'ar' ? 'معطل' : (activeLang === 'es' ? 'Desactivado' : 'Disabled'))}
                        </button>
                      </div>
                    </div>

                    {/* Voice override dropdown */}
                    <div>
                      <label className="text-[10px] text-gray-400 font-extrabold block mb-1.5">{t.voiceSelection}</label>
                      <select
                        value={ttsVoice}
                        onChange={(e) => setTtsVoice(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-blue-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 focus:outline-none font-bold"
                      >
                        <option value="Zephyr">{activeLang === 'fa' ? 'Zephyr (پیش‌فرض زنانه)' : (activeLang === 'ar' ? 'Zephyr (افتراضي أنثى)' : (activeLang === 'es' ? 'Zephyr (Femenino por defecto)' : 'Zephyr (Default Female)'))}</option>
                        <option value="Kore">{activeLang === 'fa' ? 'Kore (زنانه ملایم)' : (activeLang === 'ar' ? 'Kore (أنثى ناعمة)' : (activeLang === 'es' ? 'Kore (Femenino suave)' : 'Kore (Soft Female)'))}</option>
                        <option value="Puck">{activeLang === 'fa' ? 'Puck (مردانه شوخ)' : (activeLang === 'ar' ? 'Puck (ذكر مرح)' : (activeLang === 'es' ? 'Puck (Masculino juguetón)' : 'Puck (Playful Male)'))}</option>
                        <option value="Charon">{activeLang === 'fa' ? 'Charon (مردانه آرام)' : (activeLang === 'ar' ? 'Charon (ذكر هادئ)' : (activeLang === 'es' ? 'Charon (Masculino tranquilo)' : 'Charon (Calm Male)'))}</option>
                        <option value="Fenrir">{activeLang === 'fa' ? 'Fenrir (مردانه عمیق)' : (activeLang === 'ar' ? 'Fenrir (ذكر عميق)' : (activeLang === 'es' ? 'Fenrir (Masculino profundo)' : 'Fenrir (Deep Male)'))}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Chat Background Customization (For both single and group chats) */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
            <h3 className="text-gray-800 text-xs font-black mb-3 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
              <i className="fas fa-image text-indigo-500"></i>
              <span>{t.chatBgTitle}</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={profile.chatBackground || ''}
                  onChange={(e) => onUpdateTTS({ ...profile, chatBackground: e.target.value })}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] text-gray-700 font-mono focus:outline-none text-left"
                  placeholder={activeLang === 'fa' ? 'آدرس عکس یا کد گرادینت پس‌زمینه...' : 'Image URL or gradient CSS...'}
                  dir="ltr"
                />
                <label className="text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white font-black px-2.5 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                  <span>{t.uploadFile}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onUpdateTTS({ ...profile, chatBackground: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                {[
                  'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)',
                  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  'linear-gradient(to right, #ff9966, #ff5e62)',
                  'linear-gradient(to right, #11998e, #38ef7d)',
                  'linear-gradient(to right, #7f00ff, #e100ff)'
                ].map((grad, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onUpdateTTS({ ...profile, chatBackground: grad })}
                    className="w-8 h-6 rounded-md shrink-0 border border-slate-300 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    style={{ background: grad }}
                  />
                ))}
                {profile.chatBackground && (
                  <button
                    type="button"
                    onClick={() => onUpdateTTS({ ...profile, chatBackground: undefined })}
                    className="text-[9px] text-red-500 font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    {t.removeCustomBg}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Media Gallery with Tabs */}
          <div className="flex flex-col bg-slate-50/70 border border-slate-100 rounded-2xl overflow-hidden min-h-[220px]">
            {/* Gallery Header tabs */}
            <div className="flex bg-slate-200/40 border-b border-slate-100 p-1 shrink-0 text-center text-xs font-bold">
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'photos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.photosTab} ({photos.length})
              </button>
              <button
                onClick={() => setActiveTab('voices')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'voices' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.voicesTab} ({voices.length})
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'links' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.linksTab} ({links.length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'files' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.filesTab} ({files.length})
              </button>
            </div>

            {/* Gallery Contents */}
            <div className="flex-1 p-3">
              {activeTab === 'photos' && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/40">
                    <span className="text-[10px] text-gray-500 font-bold">{t.sharedPhotos}</span>
                    <label className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white font-black px-2.5 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm">
                      <i className="fas fa-plus text-[9px]"></i>
                      <span>{t.uploadPhotoBtn}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              const newMsg: Message = {
                                id: `system-upload-${Date.now()}`,
                                text: activeLang === 'fa' ? 'تصویر بارگذاری‌شده به گالری 🖼️' : 'Image uploaded to gallery 🖼️',
                                image: base64,
                                sender: 'user',
                                timestamp: new Date()
                              };
                              onUpdateTTS({
                                ...profile,
                                messages: [...profile.messages, newMsg]
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {photos.length === 0 ? (
                    <div className="text-center py-10 text-[11px] text-gray-400 font-bold">{t.noPhotosText}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 overflow-y-auto max-h-[160px] p-0.5">
                      {photos.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => p.image && onZoomImage(p.image)}
                          className="aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-zoom-in border border-slate-200 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                        >
                          <img src={p.image} className="w-full h-full object-cover" alt="Gallery photo" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'voices' && (
                voices.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-gray-400 font-bold">{t.noVoicesText}</div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[160px]">
                    {voices.map((v, i) => (
                      <div key={v.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onPlayAudioMsg?.(v)}
                            className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          >
                            {currentlyPlayingMsgId === v.id ? (
                              <i className="fas fa-stop text-[10px] text-red-500"></i>
                            ) : (
                              <i className="fas fa-play text-[10px]"></i>
                            )}
                          </button>
                          <span className="text-[11px] text-slate-700 font-bold">{t.voiceMsgLabel} {voices.length - i}</span>
                        </div>
                        <span className="text-[9px] text-gray-400">
                          {new Date(v.timestamp).toLocaleDateString(activeLang === 'fa' ? 'fa-IR' : 'en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'links' && (
                links.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-gray-400 font-bold">{t.noLinksText}</div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[160px]">
                    {links.map(l => (
                      <a 
                        key={l.id} 
                        href={l.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-[11px] text-blue-500 font-bold truncate max-w-[70%]">{l.url}</span>
                        <i className="fas fa-external-link-alt text-[10px] text-gray-400"></i>
                      </a>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'files' && (
                files.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-gray-400 font-bold">{t.noFilesText}</div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[160px]">
                    {files.map(f => (
                      <div key={f.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <i className="far fa-file-pdf text-red-500 text-sm"></i>
                          <div className={`text-right ${isRtl ? 'text-right' : 'text-left'}`}>
                            <span className="text-[11px] text-slate-700 font-bold block truncate max-w-[150px]">{f.name}</span>
                            <span className="text-[9px] text-gray-400">{f.size}</span>
                          </div>
                        </div>
                        <button className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                          <i className="fas fa-download text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Clear History Button */}
          {onClearHistory && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 mt-2">
              <button
                onClick={() => {
                  onClearHistory();
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-red-100"
              >
                <i className="fas fa-trash-alt"></i>
                {t.clearHistoryBtn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
