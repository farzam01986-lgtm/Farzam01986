import React from 'react';
import { ChatProfile, ChatSettings } from '../types';

interface ApiKeyModalProps {
  apiKeyMissing: boolean;
  setApiKeyMissing: (missing: boolean) => void;
  currentProfileId: string | null;
  profiles: ChatProfile[];
  settings: ChatSettings;
  initChat: (profile: ChatProfile, settings: ChatSettings, messages: any[]) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  apiKeyMissing,
  setApiKeyMissing,
  currentProfileId,
  profiles,
  settings,
  initChat,
}) => {
  if (!apiKeyMissing) return null;

  return (
    <div id="apikey-missing-overlay" className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div id="apikey-missing-container" className="bg-white rounded-3xl p-8 w-full max-w-[320px] shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">کلید API یافت نشد!</h3>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          برای چت کردن با سارا، باید یک کلید API معتبر انتخاب کنید. لطفاً روی دکمه زیر کلیک کنید.
        </p>
        <button 
          id="btn-select-apikey"
          type="button"
          onClick={async () => {
            if ((window as any).aistudio) {
              try {
                await (window as any).aistudio.openSelectKey();
              } catch (err) {
                console.error("Failed to open select key dialog:", err);
              }
              setApiKeyMissing(false);
              setTimeout(() => {
                if (currentProfileId) {
                  const activeP = profiles.find(p => p.id === currentProfileId);
                  if (activeP) initChat(activeP, settings, activeP.messages);
                }
              }, 1000);
            }
          }}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
        >
          انتخاب کلید API
        </button>
      </div>
    </div>
  );
};
