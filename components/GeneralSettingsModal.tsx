import React, { useState, useRef } from 'react';
import { ChatSettings } from '../types';
import { translations } from '../src/translations';

interface GeneralSettingsModalProps {
  onClose: () => void;
  settings: ChatSettings;
  onUpdateSettings: (settings: ChatSettings) => void;
  handleClearAllProfilesHistory: () => void;
  handleDeleteAccount: () => void;
}

export const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({
  onClose,
  settings,
  onUpdateSettings,
  handleClearAllProfilesHistory,
  handleDeleteAccount
}) => {
  const activeLang = settings.language || 'fa';
  const t = translations[activeLang] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const [showConfirmAllHistoryClear, setShowConfirmAllHistoryClear] = useState(false);
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const updateSettingField = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    localStorage.setItem('chat_settings', JSON.stringify(updated));
  };

  return (
    <div id="general-settings-modal-container" className="absolute inset-0 z-[90] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div id="general-settings-modal-content" className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh] overflow-hidden scale-in-center">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 select-none">
          <button 
            id="close-general-settings-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
          <h3 className="text-base font-extrabold text-gray-900">تنظیمات عمومی پیام‌رسان</h3>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-6 text-right custom-scrollbar" dir="rtl">
          
          {/* User Name Config */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400">نام کاربری شما</label>
            <input 
              id="user-name-input"
              type="text"
              value={settings.userName || ''}
              onChange={(e) => updateSettingField('userName', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-right"
              placeholder="مثال: فرزاد، علی..."
            />
            <p className="text-[10px] text-gray-400 leading-relaxed mr-1">این نام در مکالمات برای ارجاع هوش مصنوعی به شما استفاده می‌شود.</p>
          </div>

          {/* User Profile Picture Config */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-400">عکس پروفایل شما</label>
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0 relative group">
                <img src={settings.userProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="User Avatar" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <i className="fas fa-camera text-white text-xs"></i>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateSettingField('userProfilePic', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input 
                  id="profile-pic-link-input"
                  type="text"
                  value={settings.userProfilePic || ''}
                  onChange={(e) => updateSettingField('userProfilePic', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] focus:ring-1 focus:ring-blue-100 outline-none transition-all text-left font-mono"
                  placeholder="لینک عکس دلخواه..."
                />
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0">
                  {[
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', // Man
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', // Woman
                    'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=100', // Cool guy
                    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100'  // Cat
                  ].map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateSettingField('userProfilePic', url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all shrink-0 ${settings.userProfilePic === url ? 'border-blue-500 scale-105' : 'border-transparent hover:scale-105'} cursor-pointer`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Appearance & Language Settings Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-400">
              {isRtl ? 'ظاهر و زبان برنامه' : 'Appearance & Language'}
            </label>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
              
              {/* Language Picker */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 font-bold">{t.appLang}:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['fa', 'en', 'ar', 'es'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => updateSettingField('language', l)}
                      className={`py-2 rounded-xl text-[10px] font-extrabold border transition-all ${
                        activeLang === l 
                          ? 'bg-[#517da2]/15 border-[#517da2] text-[#517da2] shadow-sm' 
                          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-100'
                      } cursor-pointer`}
                    >
                      {l === 'fa' ? 'فارسی' : l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Español'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-200/50 w-full"></div>

              {/* Font Size Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 font-bold">{t.fontSize}:</span>
                <div className="grid grid-cols-6 gap-1">
                  {(['12px', '14px', '16px', '18px', '20px', '22px'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateSettingField('chatFontSize', sz)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                        settings.chatFontSize === sz 
                          ? 'bg-[#517da2]/15 border-[#517da2] text-[#517da2] shadow-sm' 
                          : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-100'
                      } cursor-pointer`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* General Text Chat Audio Settings */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-400">تنظیمات صوتی عمومی</label>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">قابلیت پخش صوت هوش مصنوعی</span>
                <button 
                  id="toggle-tts-btn"
                  onClick={() => updateSettingField('ttsEnabled', !settings.ttsEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${settings.ttsEnabled ? 'bg-blue-500' : 'bg-gray-300'} cursor-pointer`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.ttsEnabled ? 'left-5' : 'left-0.5'}`}></div>
                </button>
              </div>
              
              {settings.ttsEnabled && (
                <div className="space-y-2 pt-2 border-t border-slate-200/40">
                  <p className="text-[10px] text-gray-400">نحوه پخش صوتی چت‌های متنی:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="tts-autoplay-true-btn"
                      onClick={() => updateSettingField('ttsAutoPlay', true)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsAutoPlay ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'} cursor-pointer`}
                    >
                      <i className="fas fa-bolt ml-1"></i>
                      پخش اتوماتیک (خودکار)
                    </button>
                    <button
                      id="tts-autoplay-false-btn"
                      onClick={() => updateSettingField('ttsAutoPlay', false)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${!settings.ttsAutoPlay ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'} cursor-pointer`}
                    >
                      <i className="fas fa-hand-paper ml-1"></i>
                      پخش دستی (کلیک روی بلندگو)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed mr-1">در حالت دستی، با کلیک روی بلندگو یا آیکون ویس کنار حباب پیام‌ها می‌توانید صدای آن را بشنوید.</p>
          </div>

          {/* Clear History of All Profiles with state-based confirmation */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-gray-800">پاکسازی کل تاریخچه‌ها</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              با کلیک روی دکمه زیر، تاریخچه پیام‌های تمامی شخصیت‌ها به طور کامل پاک می‌شود ولی خود شخصیت‌ها در لیست باقی می‌مانند.
            </p>
            {showConfirmAllHistoryClear ? (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center space-y-3">
                <p className="text-xs font-bold text-orange-800">آیا از پاک کردن تاریخچه تمام مخاطبان مطمئن هستید؟ این عمل غیرقابل بازگشت است.</p>
                <div className="flex gap-2">
                  <button 
                    id="confirm-clear-history-yes-btn"
                    onClick={() => {
                      handleClearAllProfilesHistory();
                      setShowConfirmAllHistoryClear(false);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer"
                  >
                    بله، پاک شوند
                  </button>
                  <button 
                    id="confirm-clear-history-no-btn"
                    onClick={() => setShowConfirmAllHistoryClear(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    لغو
                  </button>
                </div>
              </div>
            ) : (
              <button 
                id="clear-all-history-btn"
                onClick={() => setShowConfirmAllHistoryClear(true)}
                className="w-full py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-eraser"></i>
                پاک کردن تاریخچه تمام شخصیت‌ها
              </button>
            )}
          </div>

          {/* Account Deletion Section */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-red-600">حذف حساب کاربری</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              این دکمه حساب کاربری شما را به همراه نام کاربری، داستان‌ها، مخاطبان و تمام تاریخچه گفتگوها به طور کامل از دیتابیس ابری حذف می‌کند.
            </p>
            {showConfirmDeleteAccount ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center space-y-3">
                <p className="text-xs font-bold text-red-800">آیا از حذف کامل حساب کاربری خود و پاک شدن تمامی تاریخچه‌ها و اطلاعات مطمئن هستید؟ این کار غیرقابل بازگشت است.</p>
                <div className="flex gap-2">
                  <button 
                    id="confirm-delete-account-yes-btn"
                    onClick={() => {
                      handleDeleteAccount();
                      setShowConfirmDeleteAccount(false);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    بله، کاملاً حذف شود
                  </button>
                  <button 
                    id="confirm-delete-account-no-btn"
                    onClick={() => setShowConfirmDeleteAccount(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    لغو
                  </button>
                </div>
              </div>
            ) : (
              <button 
                id="delete-account-btn"
                onClick={() => setShowConfirmDeleteAccount(true)}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-user-slash"></i>
                حذف حساب کاربری و تمام اطلاعات
              </button>
            )}
          </div>

          {/* Share Program Link & Guide */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-black text-[#517da2] flex items-center gap-1.5 justify-end">
              <span>اشتراک‌گذاری برنامه یا سایت 🔗</span>
            </h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              لینک این پیام‌رسان را کپی کرده و برای دوستان خود بفرستید تا آن‌ها هم بتوانند به جمع ما بپیوندند!
            </p>
            <div className="flex gap-2">
              <button
                id="copy-share-link-btn"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(window.location.origin);
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2000);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black transition-all active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <i className={copiedShareLink ? "fas fa-check" : "fas fa-copy"}></i>
                <span>{copiedShareLink ? "کپی شد!" : "کپی لینک"}</span>
              </button>
              <input
                id="share-link-text-input"
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.origin : 'https://ai-messenger.com'}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 text-[9px] font-mono focus:outline-none text-left"
                dir="ltr"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <div className="bg-blue-50/50 border border-blue-100/30 rounded-2xl p-3 text-[10px] text-blue-800 leading-relaxed font-medium">
              💡 <strong>چگونه دوستانتان وارد شوند؟</strong> کافیست لینک کپی‌شده بالا را در تلگرام، ایتا، واتس‌اپ یا اینستاگرام برای دوستان خود بفرستید. آن‌ها با باز کردن این لینک در گوشی یا کامپیوتر مستقیماً وارد برنامه شده و شروع به گپ زدن با شما و هوش‌های مصنوعی می‌کنند!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 mt-4 select-none shrink-0">
          <button 
            id="dismiss-general-settings-btn"
            onClick={onClose}
            className="w-full py-3 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            بستن تنظیمات
          </button>
        </div>

      </div>
    </div>
  );
};
