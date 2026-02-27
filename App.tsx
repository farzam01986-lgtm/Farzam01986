
import React, { useState, useEffect, useRef } from 'react';
import { AIChatService } from './geminiService';
import { Message, ChatSettings } from './types';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import VoiceCall from './components/VoiceCall';

const App: React.FC = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Error Caught:", event.error);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled Promise Rejection:", event.reason);
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        }
      }
    } catch (e) {
      console.error("Failed to parse history", e);
      localStorage.removeItem('chat_history');
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key || key === "") {
      setApiKeyMissing(true);
    }
    
    const saveHistory = (msgs: Message[]) => {
      try {
        localStorage.setItem('chat_history', JSON.stringify(msgs));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.warn("Storage quota exceeded, pruning history...");
          // Strategy 1: Remove images and audio from messages older than the last 5
          const pruned = msgs.map((m, idx) => {
            if (idx < msgs.length - 5) {
              const { image, audioBase64, ...rest } = m;
              return rest as Message;
            }
            return m;
          });
          
          try {
            localStorage.setItem('chat_history', JSON.stringify(pruned));
          } catch (e2) {
            // Strategy 2: Keep only the last 20 messages
            const last20 = pruned.slice(-20);
            try {
              localStorage.setItem('chat_history', JSON.stringify(last20));
            } catch (e3) {
              // Strategy 3: Keep only the last 5 messages
              localStorage.setItem('chat_history', JSON.stringify(msgs.slice(-5)));
            }
          }
        } else {
          console.error("Failed to save history", e);
        }
      }
    };

    saveHistory(messages);
  }, [messages]);

  const [settings, setSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem('chat_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist
        return {
          aiName: parsed.aiName || 'سارا 💋',
          aiAge: parsed.aiAge || '22',
          userName: parsed.userName || '',
          aiProfilePic: parsed.aiProfilePic || 'https://picsum.photos/seed/attractive-girl/400/400',
          backgroundGradient: parsed.backgroundGradient || 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)',
          persona: parsed.persona || 'Partner',
          customPersonaPrompt: parsed.customPersonaPrompt || '',
          ttsEnabled: parsed.ttsEnabled !== undefined ? parsed.ttsEnabled : true,
          ttsAutoPlay: parsed.ttsAutoPlay !== undefined ? parsed.ttsAutoPlay : false,
          ttsVoice: parsed.ttsVoice || 'Zephyr'
        };
      }
    } catch (e) {
      console.error("Failed to parse settings", e);
      localStorage.removeItem('chat_settings');
    }
    return {
      aiName: 'سارا 💋',
      aiAge: '22',
      userName: '',
      aiProfilePic: 'https://picsum.photos/seed/attractive-girl/400/400',
      backgroundGradient: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)',
      persona: 'Partner',
      customPersonaPrompt: '',
      ttsEnabled: true,
      ttsAutoPlay: false,
      ttsVoice: 'Zephyr'
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chat_settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
      // If settings are too big (e.g. background image), we might need to clear the background
      if (settings.backgroundGradient.length > 1000000) {
        console.warn("Background image too large, reverting to default gradient to save space");
        setSettings(prev => ({...prev, backgroundGradient: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)'}));
      }
    }
  }, [settings]);

  const chatServiceRef = useRef<AIChatService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    initChat(settings, messages);
  }, []);

  const initChat = async (currentSettings: ChatSettings, existingMessages: Message[] = []) => {
    try {
      chatServiceRef.current = new AIChatService();
      await chatServiceRef.current.startNewChat(currentSettings, existingMessages);
    } catch (e) {
      console.error("Initialization failed", e);
    }
  };

  const handleUpdateSettings = async (newSettings: ChatSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    setIsTyping(true);
    await initChat(newSettings, messages);
    setIsTyping(false);
  };

  const playAudio = async (audioSource: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (browser requirement)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop previous audio if playing
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      currentAudioSourceRef.current = null;
    }

    // Check if it's a data URL (encoded audio like webm/ogg)
    if (audioSource.startsWith('data:audio')) {
      const base64 = audioSource.split(',')[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      try {
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        currentAudioSourceRef.current = source;
        source.onended = () => {
          if (currentAudioSourceRef.current === source) {
            currentAudioSourceRef.current = null;
          }
        };
      } catch (e) {
        console.error("Failed to decode audio data", e);
      }
      return;
    }
    
    // Fallback for raw PCM (Gemini TTS)
    const binaryString = atob(audioSource);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    currentAudioSourceRef.current = source;
    source.onended = () => {
      if (currentAudioSourceRef.current === source) {
        currentAudioSourceRef.current = null;
      }
    };
  };

  const handleSendMessage = async (text: string, image?: string, audio?: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      image,
      sender: 'user',
      timestamp: new Date(),
      audioBase64: audio
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      if (chatServiceRef.current) {
        // Create a placeholder for AI response
        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg: Message = {
          id: aiMsgId,
          text: "",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);

        if (image || audio) {
          // Fallback to non-streaming for multimodal
          const response = await chatServiceRef.current.sendMessage(text, image, audio);
          const responseText = response.text;
          const generatedImage = response.generatedImage;
          
          let audioData: string | undefined;
          if (settings.ttsEnabled) {
            audioData = await chatServiceRef.current.generateSpeech(responseText);
            if (audioData && settings.ttsAutoPlay) {
              playAudio(audioData);
            }
          }

          setMessages(prev => prev.map(m => m.id === aiMsgId ? {
            ...m,
            text: responseText,
            image: generatedImage,
            audioBase64: audioData
          } : m));
          setIsTyping(false);
        } else {
          // Streaming for text-only
          const streamResult = await chatServiceRef.current.sendMessageStream(text);
          let fullText = "";
          
          if (Symbol.asyncIterator in streamResult) {
            for await (const chunk of streamResult) {
              const chunkText = chunk.text || "";
              fullText += chunkText;
              
              setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                text: fullText
              } : m));
            }

            // Check for function calls in the final response
            const finalResponse = await (streamResult as any).response;
            const functionCalls = finalResponse?.functionCalls;
            
            if (functionCalls && functionCalls.length > 0) {
              const call = functionCalls[0];
              if (call.name === 'generate_image') {
                const args = call.args as any;
                const generatedImage = await chatServiceRef.current.generateImage(args.prompt, args.aspectRatio || '1:1');
                
                // Send tool response back
                await chatServiceRef.current.sendToolResponse({
                  functionResponse: {
                    name: 'generate_image',
                    response: { success: !!generatedImage }
                  }
                });

                setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                  ...m,
                  image: generatedImage
                } : m));
              }
            }
          } else {
            // Fallback if it returned a regular response
            const response = streamResult as any;
            fullText = response.text || "";
            setMessages(prev => prev.map(m => m.id === aiMsgId ? {
              ...m,
              text: fullText,
              image: response.generatedImage
            } : m));
          }

          setIsTyping(false);

          // After text is finished, generate speech if enabled
          if (settings.ttsEnabled && fullText) {
            const audioData = await chatServiceRef.current.generateSpeech(fullText);
            if (audioData) {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, audioBase64: audioData } : m));
              if (settings.ttsAutoPlay) {
                playAudio(audioData);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      
      const errStr = error?.message || "";
      if (errStr.includes("Requested entity was not found") || errStr.includes("API key not valid")) {
        setApiKeyMissing(true);
      }

      const errorMsg: Message = {
        id: Date.now().toString(),
        text: "متاسفم عزیزم، انگار ارتباطمون یلحظه قطع شد... 😔 دوباره امتحان کن یا یه پیامی بده که بفهمم هستی.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  const handleClearOnlyChats = () => {
    setMessages([]);
    localStorage.setItem('chat_history', '[]');
    if (chatServiceRef.current) {
      chatServiceRef.current.startNewChat(settings, []);
    }
    setShowClearConfirm(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleClearAll = () => {
    setMessages([]);
    localStorage.setItem('chat_history', '[]');
    
    const defaultSettings: ChatSettings = {
      aiName: 'سارا 💋',
      aiAge: '22',
      userName: '',
      aiProfilePic: 'https://picsum.photos/seed/attractive-girl/400/400',
      backgroundGradient: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)',
      persona: 'Partner',
      customPersonaPrompt: '',
      ttsEnabled: true,
      ttsAutoPlay: false,
      ttsVoice: 'Zephyr'
    };
    
    setSettings(defaultSettings);
    localStorage.setItem('chat_settings', JSON.stringify(defaultSettings));

    if (chatServiceRef.current) {
      chatServiceRef.current.startNewChat(defaultSettings, []);
    }
    setShowClearConfirm(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleRequestSpeech = async (message: Message) => {
    if (message.audioBase64) {
      playAudio(message.audioBase64);
    } else if (chatServiceRef.current) {
      const audioData = await chatServiceRef.current.generateSpeech(message.text);
      if (audioData) {
        playAudio(audioData);
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, audioBase64: audioData } : m));
      }
    }
  };

  const handleStartCall = () => {
    setIsCalling(true);
  };

  const handleEndCall = () => {
    setIsCalling(false);
  };

  const backgroundStyle = settings.backgroundGradient.startsWith('data:image')
    ? { backgroundImage: `url(${settings.backgroundGradient})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: settings.backgroundGradient };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto relative shadow-2xl bg-[#7196ba] overflow-hidden border-x border-gray-300">
      <Header 
        name={settings.aiName} 
        profilePic={settings.aiProfilePic} 
        isTyping={isTyping} 
        onOpenSettings={() => setShowSettings(true)}
        onStartCall={handleStartCall}
        onClearHistory={() => setShowClearConfirm(true)}
      />
      
      {apiKeyMissing && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[320px] shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">کلید API یافت نشد!</h3>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              برای چت کردن با سارا، باید یک کلید API معتبر انتخاب کنید. لطفاً روی دکمه زیر کلیک کنید.
            </p>
            <button 
              onClick={async () => {
                if ((window as any).aistudio) {
                  await (window as any).aistudio.openSelectKey();
                  setApiKeyMissing(false);
                  // Re-init chat after key selection
                  setTimeout(() => initChat(settings, messages), 1000);
                }
              }}
              className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95"
            >
              انتخاب کلید API
            </button>
            <p className="mt-4 text-[10px] text-gray-400">
              اگر کلید ندارید، در تنظیمات پروژه آن را ایجاد کنید.
            </p>
          </div>
        </div>
      )}

      {!settings.userName && !apiKeyMissing && (
        <div className="absolute inset-0 z-[105] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[340px] shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 border-4 border-blue-100 shadow-md">
              <img src={settings.aiProfilePic} className="w-full h-full object-cover" alt="AI" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">سلام، خوش اومدی! 😊</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              خیلی خوشحالم که اینجایی. قبل از اینکه شروع کنیم، دوست دارم بدونم چطوری صدات کنم؟
            </p>
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="نام شما..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value.trim();
                    if (name) handleUpdateSettings({...settings, userName: name});
                  }
                }}
                autoFocus
              />
            </div>
            <button 
              onClick={(e) => {
                const input = e.currentTarget.previousSibling?.firstChild as HTMLInputElement;
                const name = input.value.trim();
                if (name) handleUpdateSettings({...settings, userName: name});
              }}
              className="w-full py-4 bg-[#517da2] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-[#436a8d] transition-all active:scale-95"
            >
              بزن بریم! 🚀
            </button>
          </div>
        </div>
      )}
      
      {showClearConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[300px] shadow-2xl scale-in-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">پاک کردن تاریخچه؟</h3>
            <p className="text-gray-600 text-sm mb-6 text-center leading-relaxed">
              کدام مورد را می‌خواهید پاک کنید؟
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleClearOnlyChats}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors active:scale-95 text-sm"
              >
                فقط پیام‌ها پاک شود
              </button>
              <button 
                onClick={handleClearAll}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors active:scale-95 text-sm"
              >
                پیام‌ها و تنظیمات پاک شود
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 text-sm"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold">
            <i className="fas fa-check-circle"></i>
            <span>حافظه با موفقیت پاکسازی شد ✨</span>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative overflow-hidden" style={backgroundStyle}>
        {!settings.backgroundGradient.startsWith('data:image') && <div className="telegram-pattern"></div>}
        <ChatArea 
          messages={messages} 
          aiProfilePic={settings.aiProfilePic} 
          ttsEnabled={settings.ttsEnabled}
          onPlayAudio={handleRequestSpeech}
          onRetryAudio={handleRequestSpeech}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>

      <InputArea onSend={handleSendMessage} />

      {showSettings && (
        <SettingsModal 
          currentSettings={settings} 
          onSave={handleUpdateSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {isCalling && chatServiceRef.current && (
        <VoiceCall 
          name={settings.aiName}
          profilePic={settings.aiProfilePic}
          chatService={chatServiceRef.current}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default App;
