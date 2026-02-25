
import React, { useState, useEffect, useRef } from 'react';
import { AIChatService } from './geminiService';
import { Message, ChatSettings } from './types';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import VoiceCall from './components/VoiceCall';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('chat_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      aiName: 'سارا 💋',
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
    localStorage.setItem('chat_settings', JSON.stringify(settings));
  }, [settings]);

  const chatServiceRef = useRef<AIChatService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          image: generatedImage,
          sender: 'ai',
          timestamp: new Date(),
          audioBase64: audioData
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error("Chat Error:", error);
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
  };

  const handleClearAll = () => {
    setMessages([]);
    localStorage.setItem('chat_history', '[]');
    
    const defaultSettings: ChatSettings = {
      aiName: 'سارا 💋',
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
      
      <div className="flex-1 relative overflow-hidden" style={backgroundStyle}>
        {!settings.backgroundGradient.startsWith('data:image') && <div className="telegram-pattern"></div>}
        <ChatArea 
          messages={messages} 
          aiProfilePic={settings.aiProfilePic} 
          onPlayAudio={handleRequestSpeech}
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
