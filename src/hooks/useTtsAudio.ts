import { useState, useRef, useEffect } from 'react';
import { Message, ChatSettings, ChatProfile } from '../../types';
import { cleanFarsiBreastWords } from '../../geminiService';
import { AIChatService } from '../../geminiService';

interface UseTtsAudioProps {
  profiles: ChatProfile[];
  currentProfileId: string | null;
  settings: ChatSettings;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setShowQuotaToast: (show: boolean) => void;
  chatServiceRef: React.MutableRefObject<AIChatService | null>;
}

export function useTtsAudio({
  profiles,
  currentProfileId,
  settings,
  setMessages,
  setShowQuotaToast,
  chatServiceRef,
}: UseTtsAudioProps) {
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const [generatingAudioMsgIds, setGeneratingAudioMsgIds] = useState<string[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const googleTtsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop playing on unmount and release resources (preventing audio leaks)
  useEffect(() => {
    return () => {
      if (googleTtsAudioRef.current) {
        try { googleTtsAudioRef.current.pause(); } catch (e) {}
      }
      if (currentAudioSourceRef.current) {
        try { currentAudioSourceRef.current.stop(); } catch (e) {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
      try {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    };
  }, []);

  const unlockAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(err => console.warn("Could not resume AudioContext:", err));
    }
    
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.warn("Silent audio unlock failed:", e);
    }

    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.warn("SpeechSynthesis silent unlock failed:", e);
    }
  };

  const safeDecodeAudioData = (audioCtx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      try {
        let isSettled = false;
        const handleResolve = (buf: AudioBuffer) => {
          if (!isSettled) {
            isSettled = true;
            resolve(buf);
          }
        };
        const handleReject = (err: any) => {
          if (!isSettled) {
            isSettled = true;
            reject(err || new Error("Unable to decode audio data"));
          }
        };

        const promise = audioCtx.decodeAudioData(
          arrayBuffer,
          handleResolve,
          handleReject
        );

        if (promise && typeof promise.catch === 'function') {
          promise.then(handleResolve).catch(handleReject);
        }
      } catch (e) {
        reject(e);
      }
    });
  };

  const playAudio = async (audioSource: string, msgId?: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (msgId) {
      setCurrentlyPlayingMsgId(msgId);
    }

    // Stop any active Web Audio node
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {}
      currentAudioSourceRef.current = null;
    }

    // Stop any active HTML5 audio element
    if (googleTtsAudioRef.current) {
      try {
        googleTtsAudioRef.current.pause();
      } catch (e) {}
      googleTtsAudioRef.current = null;
    }

    let base64 = audioSource;
    if (audioSource.startsWith('data:audio')) {
      base64 = audioSource.split(',')[1];
    }

    const playWebAudioFallback = async (bytes: Uint8Array) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (resumeErr) {
          console.warn("Failed to resume audio context:", resumeErr);
        }
      }

      try {
        (window as any).triggerDiagnosticLog?.("در حال تلاش برای دیکد استاندارد صوتی (WAV/MP3)...", "info");
        const audioBuffer = await safeDecodeAudioData(ctx, bytes.buffer.slice(0));
        (window as any).triggerDiagnosticLog?.("دیکد صوتی استاندارد با موفقیت انجام شد.", "success");
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        currentAudioSourceRef.current = source;
        source.onended = () => {
          if (currentAudioSourceRef.current === source) {
            currentAudioSourceRef.current = null;
          }
          if (msgId) {
            setCurrentlyPlayingMsgId(prev => prev === msgId ? null : prev);
          }
        };
      } catch (decodeErr: any) {
        console.warn("Standard audio decode failed, falling back to raw Int16 PCM...", decodeErr);
        (window as any).triggerDiagnosticLog?.("دیکد صوتی استاندارد ناموفق بود. لایه بک‌آپ بایت‌های PCM خام فعال شد.", "warning");
        
        const alignedLength = bytes.buffer.byteLength - (bytes.buffer.byteLength % 2);
        const dataInt16 = new Int16Array(bytes.buffer.slice(0, alignedLength));
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
          if (msgId) {
            setCurrentlyPlayingMsgId(prev => prev === msgId ? null : prev);
          }
        };
        (window as any).triggerDiagnosticLog?.("پخش صدای خام PCM با موفقیت آغاز شد.", "success");
      }
    };

    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      (window as any).triggerDiagnosticLog?.("موتور صوتی چت فراخوانی شد. در حال بررسی فرمت بایت‌ها...", "info");

      const isWavOrMp3 = (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) || 
                         (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) ||
                         (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33);

      if (isWavOrMp3) {
        (window as any).triggerDiagnosticLog?.("فرمت صوتی معتبر شناسایی شد. استفاده از پخش HTML5...", "info");
        const blobType = bytes[0] === 0x52 ? 'audio/wav' : 'audio/mpeg';
        const blob = new Blob([bytes], { type: blobType });
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        googleTtsAudioRef.current = audio;
        audio.onended = () => {
          googleTtsAudioRef.current = null;
          if (msgId) {
            setCurrentlyPlayingMsgId(prev => prev === msgId ? null : prev);
          }
        };
        audio.onerror = (err) => {
          console.warn("HTML5 audio element playback failed, falling back to Web Audio context...", err);
          playWebAudioFallback(bytes);
        };
        await audio.play();
        (window as any).triggerDiagnosticLog?.("پخش فایل صوتی آغاز شد.", "success");
      } else {
        await playWebAudioFallback(bytes);
      }
    } catch (e: any) {
      console.error("Failed to play audio", e);
      (window as any).triggerDiagnosticLog?.("خطای بحرانی در موتور پخش صوت: " + e.message, "error");
      if (msgId) {
        setCurrentlyPlayingMsgId(prev => prev === msgId ? null : prev);
      }
    }
  };

  const splitTextIntoChunks = (txt: string, maxLen = 150): string[] => {
    const words = txt.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const word of words) {
      if ((currentChunk + " " + word).length > maxLen) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk = currentChunk ? currentChunk + " " + word : word;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  };

  const speakTextFallback = (text: string, msgId?: string) => {
    if (googleTtsAudioRef.current) {
      try { googleTtsAudioRef.current.pause(); } catch(e){}
      googleTtsAudioRef.current = null;
    }

    if (msgId) {
      setCurrentlyPlayingMsgId(msgId);
    }

    let rawCleanedText = text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
      .replace(/[*#_~`\-+]/g, '')
      .trim();

    rawCleanedText = rawCleanedText.replace(/\s*[\(\[（【].*?[\)\]）】]\s*/g, ' ');
    rawCleanedText = rawCleanedText.replace(/(?:با\s+لحن|با\s+صدای|با\s+حالت|به\s+صورت)[^:]+?:\s*/g, ' ');
    rawCleanedText = rawCleanedText.replace(/[^:]+?بخوان:\s*/g, ' ');
    rawCleanedText = rawCleanedText.replace(/[^:]+?بگو:\s*/g, ' ');
    rawCleanedText = rawCleanedText.replace(/[^:]+?بنویس:\s*/g, ' ');
    rawCleanedText = rawCleanedText.replace(/[:"']/g, ' ');
    rawCleanedText = rawCleanedText.replace(/\s+/g, ' ');

    const cleanText = cleanFarsiBreastWords(rawCleanedText.trim());

    if (!cleanText) {
      if (msgId) setCurrentlyPlayingMsgId(null);
      return;
    }

    const activeProfile = profiles.find(p => p.id === currentProfileId);
    const charName = activeProfile?.name || 'سارا';
    const gender = activeProfile?.gender || (charName.includes('دخترخاله') || charName.includes('مریم') || charName.includes('سارا') || charName.includes('نفس') || charName.includes('الناز') ? 'female' : 'male');
    
    let nameHash = 0;
    for (let i = 0; i < charName.length; i++) {
      nameHash += charName.charCodeAt(i);
    }
    
    const basePitch = gender === 'female' ? 1.25 : 0.75;
    const pitchOffset = (nameHash % 5) * 0.08 - 0.16;
    const targetPitch = Math.max(0.5, Math.min(2.0, basePitch + pitchOffset));
    
    const baseRate = 1.0;
    const rateOffset = (nameHash % 3) * 0.05 - 0.05;
    const targetRate = Math.max(0.7, Math.min(1.4, baseRate + rateOffset));

    const chunks = splitTextIntoChunks(cleanText, 60);

    const playSpeechUtteranceFallback = (chunkText: string, onDone: () => void) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        onDone();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e){}

      const utterance = new SpeechSynthesisUtterance(chunkText);
      const voices = window.speechSynthesis.getVoices();
      const faVoice = voices.find(v => v.lang.startsWith('fa') || v.lang.toLowerCase().includes('persian') || v.lang.toLowerCase().includes('farsi'));
      if (faVoice) {
        utterance.voice = faVoice;
      }
      utterance.lang = 'fa-IR';

      utterance.pitch = targetPitch;
      utterance.rate = targetRate;

      let calledDone = false;
      const safeDone = () => {
        if (!calledDone) {
          calledDone = true;
          clearTimeout(watchdog);
          onDone();
        }
      };

      const watchdog = setTimeout(() => {
        console.warn("Speech synthesis watchdog timed out for chunk:", chunkText);
        try { window.speechSynthesis.cancel(); } catch(e){}
        safeDone();
      }, Math.max(5000, chunkText.length * 80));

      utterance.onend = () => safeDone();
      utterance.onerror = () => safeDone();
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("speechSynthesis.speak failed synchronously:", e);
        safeDone();
      }
    };

    const playChunkSequentially = async (index: number) => {
      if (index >= chunks.length) {
        if (msgId) {
          setCurrentlyPlayingMsgId(prev => prev === msgId ? null : prev);
        }
        return;
      }

      const chunk = chunks[index];
      try {
        const fallbackUrl = `/api/proxy-google-tts?text=${encodeURIComponent(chunk)}`;
        const audio = document.createElement('audio');
        audio.src = fallbackUrl;
        googleTtsAudioRef.current = audio;

        audio.playbackRate = targetRate;

        audio.onended = () => {
          googleTtsAudioRef.current = null;
          playChunkSequentially(index + 1);
        };

        audio.onerror = (err) => {
          console.warn("Proxy Google TTS failed, falling back to Web Speech Synthesis:", err);
          googleTtsAudioRef.current = null;
          playSpeechUtteranceFallback(chunk, () => {
            playChunkSequentially(index + 1);
          });
        };

        audio.play().catch(playErr => {
          console.warn("Proxy Google TTS play blocked, trying Web Speech Synthesis fallback:", playErr);
          googleTtsAudioRef.current = null;
          playSpeechUtteranceFallback(chunk, () => {
            playChunkSequentially(index + 1);
          });
        });
      } catch (e) {
        console.warn("Google TTS chunk play failed, trying Web Speech Synthesis...", e);
        googleTtsAudioRef.current = null;
        playSpeechUtteranceFallback(chunk, () => {
          playChunkSequentially(index + 1);
        });
      }
    };

    playChunkSequentially(0);
  };

  const handleRequestSpeech = async (message: Message) => {
    if (currentlyPlayingMsgId === message.id) {
      if (currentAudioSourceRef.current) {
        try { currentAudioSourceRef.current.stop(); } catch (e) {}
        currentAudioSourceRef.current = null;
      }
      if (googleTtsAudioRef.current) {
        try { googleTtsAudioRef.current.pause(); } catch (e) {}
        googleTtsAudioRef.current = null;
      }
      setCurrentlyPlayingMsgId(null);
      return;
    }

    if (message.audioBase64) {
      (window as any).triggerDiagnosticLog?.("شروع پخش فایل صوتی پیام...", "info");
      playAudio(message.audioBase64, message.id);
    } else if (chatServiceRef.current) {
      if (generatingAudioMsgIds.includes(message.id)) {
        console.log("Speech already generating for this message, ignoring duplicate request");
        return;
      }
      (window as any).triggerDiagnosticLog?.("در حال درخواست فایل صوتی جدید با هوش مصنوعی...", "info");
      setGeneratingAudioMsgIds(prev => [...prev, message.id]);
      setCurrentlyPlayingMsgId(message.id);
      
      try {
        const textToSpeak = message.originalText || message.text;
        const audioData = await chatServiceRef.current.generateSpeech(textToSpeak);
        if (audioData) {
          (window as any).triggerDiagnosticLog?.("فایل صوتی با موفقیت تولید و دریافت شد.", "success");
          playAudio(audioData, message.id);
          setMessages(prev => prev.map(m => m.id === message.id ? { ...m, audioBase64: audioData } : m));
        } else {
          (window as any).triggerDiagnosticLog?.("محدودیت سهمیه هوش مصنوعی. استفاده از موتور صوتی مرورگر...", "warning");
          console.log("Gemini TTS returned undefined. Falling back to native Web Speech API.");
          setShowQuotaToast(true);
          speakTextFallback(textToSpeak, message.id);
        }
      } catch (err: any) {
        console.warn("Manual speech generation failed with exception:", err);
        (window as any).triggerDiagnosticLog?.("خطا در هوش مصنوعی صوتی. سوئیچ خودکار به موتور صوتی محلی مرورگر...", "warning");
        setShowQuotaToast(true);
        speakTextFallback(message.originalText || message.text, message.id);
      } finally {
        setGeneratingAudioMsgIds(prev => prev.filter(id => id !== message.id));
      }
    }
  };

  const stopAllAudio = () => {
    if (googleTtsAudioRef.current) {
      try { googleTtsAudioRef.current.pause(); } catch (e) {}
      googleTtsAudioRef.current = null;
    }
    if (currentAudioSourceRef.current) {
      try { currentAudioSourceRef.current.stop(); } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    setCurrentlyPlayingMsgId(null);
  };

  return {
    currentlyPlayingMsgId,
    generatingAudioMsgIds,
    setCurrentlyPlayingMsgId,
    setGeneratingAudioMsgIds,
    unlockAudioContext,
    playAudio,
    speakTextFallback,
    handleRequestSpeech,
    stopAllAudio,
  };
}
