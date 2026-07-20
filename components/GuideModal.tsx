import React, { useState, useEffect } from 'react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  const [guideTab, setGuideTab] = useState<'video' | 'text'>('video');
  const [guideVideoPlaying, setGuideVideoPlaying] = useState(false);
  const [guideVideoLoading, setGuideVideoLoading] = useState(false);
  const [guideVideoStep, setGuideVideoStep] = useState(0);

  // Rotate guide video subtitle steps
  useEffect(() => {
    let timer: any;
    if (guideVideoPlaying) {
      timer = setInterval(() => {
        setGuideVideoStep((prev) => (prev + 1) % 4);
      }, 5000);
    } else {
      setGuideVideoStep(0);
    }
    return () => clearInterval(timer);
  }, [guideVideoPlaying]);

  return (
    <div id="guide-modal-container" className="absolute inset-0 z-[120] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div id="guide-modal-content" className="bg-white rounded-3xl w-full max-w-[390px] max-h-[85vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" dir="rtl">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#517da2] to-[#3a5d7c] text-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <i className="fas fa-book-reader text-sm"></i>
            <h3 className="text-sm font-black">راهنمای جامع ثبت‌نام و ورود 📖</h3>
          </div>
          <button 
            id="close-guide-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>

        {/* Tab Swappers */}
        <div className="flex border-b border-gray-100 bg-gray-50 p-1 select-none shrink-0">
          <button
            id="guide-tab-video"
            type="button"
            onClick={() => {
              setGuideTab('video');
              setGuideVideoPlaying(false);
              setGuideVideoLoading(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${guideTab === 'video' ? 'bg-white text-[#517da2] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fas fa-video text-xs"></i>
            <span>آموزش ویدیویی صوتی 🎥</span>
          </button>
          <button
            id="guide-tab-text"
            type="button"
            onClick={() => {
              setGuideTab('text');
              setGuideVideoPlaying(false);
              setGuideVideoLoading(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${guideTab === 'text' ? 'bg-white text-[#517da2] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fas fa-file-alt text-xs"></i>
            <span>راهنمای متنی 📝</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {guideTab === 'video' ? (
            <div className="space-y-4">
              <p className="text-gray-500 text-[10px] font-black text-center leading-relaxed">
                با کلیک روی دکمه پخش، آموزش صوتی و تصویری فرآیندهای کار با پیام‌رسان شروع می‌شود:
              </p>

              {/* Mock Video Player */}
              <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md flex flex-col justify-between p-3 select-none">
                {guideVideoLoading ? (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10 text-white">
                    <span className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-[10px] font-black tracking-wider text-blue-200 animate-pulse">در حال بارگذاری ویدیو آموزشی با صدا...</span>
                  </div>
                ) : null}

                {/* Video Background Representation */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-850">
                  {guideVideoPlaying ? (
                    <div className="w-full h-full flex flex-col justify-between p-3 relative">
                      
                      {/* Simulated Screencast Visual Representation */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <i className="fas fa-mobile-alt text-8xl text-white"></i>
                      </div>

                      {/* Sound wave visualizer bars */}
                      <div className="flex justify-center items-center gap-1 mt-4">
                        <div className="w-1 bg-blue-500 rounded animate-[pulse_1s_infinite_100ms] h-6"></div>
                        <div className="w-1 bg-indigo-500 rounded animate-[pulse_1s_infinite_200ms] h-10"></div>
                        <div className="w-1 bg-blue-400 rounded animate-[pulse_1s_infinite_300ms] h-8"></div>
                        <div className="w-1 bg-cyan-400 rounded animate-[pulse_1s_infinite_400ms] h-12"></div>
                        <div className="w-1 bg-indigo-400 rounded animate-[pulse_1s_infinite_500ms] h-9"></div>
                        <div className="w-1 bg-blue-500 rounded animate-[pulse_1s_infinite_600ms] h-6"></div>
                      </div>

                      {/* Captions/Subtitles box */}
                      <div className="bg-black/60 border border-white/5 backdrop-blur-sm p-3 rounded-xl text-center text-white z-10 mx-auto max-w-[90%] mt-auto animate-in slide-in-from-bottom-2 duration-300">
                        <p className="text-[10px] font-extrabold text-blue-300 mb-0.5">🔊 گوینده صوتی سیستم:</p>
                        <p className="text-[11px] font-black text-white leading-relaxed">
                          {guideVideoStep === 0 && "۱. برای عضویت در سیستم، نام کاربری و پسورد اختیاری وارد کرده و تصویر خود را ثبت کنید."}
                          {guideVideoStep === 1 && "۲. ثبت نام در کسری از ثانیه انجام شده و شما وارد دنیای صمیمی هوش مصنوعی می‌شوید."}
                          {guideVideoStep === 2 && "۳. برای بازگشت به حساب، کافیست در تب ورود، نام کاربری و پسورد خود را مجدد وارد کنید."}
                          {guideVideoStep === 3 && "۴. تمام تاریخچه‌ها، داستان‌ها و تنظیمات شما به صورت کاملاً زنده در فضای ابری ثبت می‌شوند."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <button
                        id="play-guide-video-btn"
                        onClick={() => {
                          setGuideVideoLoading(true);
                          setTimeout(() => {
                            setGuideVideoLoading(false);
                            setGuideVideoPlaying(true);
                          }, 1500);
                        }}
                        className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-blue-500/30"
                      >
                        <i className="fas fa-play text-lg mr-1"></i>
                      </button>
                      <span className="text-[10px] font-black text-gray-300 mt-1">پخش فیلم راهنما با صدای گوینده</span>
                    </div>
                  )}
                </div>

                {/* Mock Media Controls Bar */}
                <div className="w-full flex items-center justify-between text-white/50 text-[10px] pt-1 z-10 border-t border-white/5 bg-black/25 px-2 py-1 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <button 
                      id="toggle-play-pause-btn"
                      onClick={() => setGuideVideoPlaying(!guideVideoPlaying)} 
                      disabled={guideVideoLoading}
                      className="hover:text-white disabled:opacity-50"
                    >
                      <i className={`fas ${guideVideoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>
                    <span>{guideVideoPlaying ? '00:15 / 01:20' : '00:00 / 01:20'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-volume-up"></i>
                    <span>صدای گوینده صوتی فعال</span>
                  </div>
                </div>
              </div>

              {/* Highlight bullets */}
              <div className="space-y-2.5 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 text-right">
                <h4 className="text-xs font-black text-blue-900 mb-2 flex items-center gap-1.5">
                  <i className="fas fa-info-circle text-xs"></i>
                  <span>نکات کلیدی آموزش تصویری:</span>
                </h4>
                <div className="flex items-start gap-1.5 text-[10px] text-blue-950 font-bold leading-relaxed">
                  <span className="text-blue-500">◀</span>
                  <p><strong>امنیت کامل:</strong> حساب کاربری شما با رمز عبور شخصی محافظت شده و به صورت مستقل بر روی سرور ثبت می‌شود.</p>
                </div>
                <div className="flex items-start gap-1.5 text-[10px] text-blue-950 font-bold leading-relaxed">
                  <span className="text-blue-500">◀</span>
                  <p><strong>بازگردانی چت‌ها:</strong> در صورت خروج یا پاک شدن مرورگر، چت‌ها و رفیق‌های هوش مصنوعی شما مجدداً با ورود ساده بارگذاری می‌شوند.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-right">
              <div className="space-y-3.5">
                
                {/* Process 1 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                  <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-blue-100 text-[#517da2] rounded-full flex items-center justify-center text-[10px] font-black">۱</span>
                    <span>عضویت و ثبت‌نام سریع</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed pr-6">
                    برای ثبت‌نام جدید، نام نمایشی، رمز عبور دلخواه و تصویر دلخواه خود را تعیین کنید. سیستم بلافاصله شناسه یکتای ابری برای شما صادر کرده و حساب شما ساخته می‌شود.
                  </p>
                </div>

                {/* Process 2 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                  <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-blue-100 text-[#517da2] rounded-full flex items-center justify-center text-[10px] font-black">۲</span>
                    <span>ورود مجدد به حساب</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed pr-6">
                    اگر مایلید در دستگاه یا مرورگر دیگری چت‌های خود را ادامه دهید، در فرم ورود نام کاربری و رمز خود را تایپ کنید؛ تمامی چت‌ها به صورت آنی بازخوانی می‌شوند.
                  </p>
                </div>

                {/* Process 3 */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                  <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-blue-100 text-[#517da2] rounded-full flex items-center justify-center text-[10px] font-black">۳</span>
                    <span>تاریخچه پیام‌ها و داستان‌ها</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed pr-6">
                    تمامی استوری‌ها، لایک‌ها و تاریخچه چت‌های خصوصی در دیتابیس همگام‌سازی می‌شوند. حتی اگر مرورگر خود را کلیر کنید، با لاگین مجدد هیچ اطلاعاتی از دست نخواهد رفت.
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center shrink-0">
          <button
            id="dismiss-guide-footer-btn"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#517da2] hover:bg-[#3a5d7c] text-white font-black text-xs rounded-xl transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            متوجه شدم، بازگشت به برنامه
          </button>
        </div>

      </div>
    </div>
  );
};
