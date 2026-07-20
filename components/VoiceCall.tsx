
import React, { useEffect, useRef, useState } from 'react';
import { AIChatService, cleanFarsiBreastWords, getLocalRomanticResponse } from '../geminiService';
import {
  initiateRealUserCall,
  saveCallOffer,
  saveCallAnswer,
  addIceCandidateToFirestore,
  listenToCallSession,
  endRealUserCall
} from '../firebaseService';

function uint8ToBase64(uint8: Uint8Array): string {
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

interface VoiceCallProps {
  name: string;
  profilePic: string;
  chatService?: AIChatService;
  messages?: any[];
  initialIsVideo?: boolean;
  onEndCall: (durationSeconds: number, isVideo: boolean) => void;
  isRealUserCall?: boolean;
  roomId?: string;
  myId?: string;
  receiverId?: string;
  role?: 'caller' | 'receiver';
  activeLang?: string;
}

const VoiceCall: React.FC<VoiceCallProps> = ({ 
  name, 
  profilePic, 
  chatService, 
  messages = [], 
  initialIsVideo = false, 
  onEndCall,
  isRealUserCall = false,
  roomId = '',
  myId = '',
  receiverId = '',
  role = 'caller',
  activeLang = 'fa'
}) => {
  // Add global for mic check
  useEffect(() => {
    (window as any).lastMicCheck = Date.now();
  }, []);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(initialIsVideo);
  const [isUserVideoOn, setIsUserVideoOn] = useState(initialIsVideo);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRinging, setIsRinging] = useState(true);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [micLevel, setMicLevel] = useState(0);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isPttMode, setIsPttMode] = useState(false);
  const [isPttActive, setIsPttActive] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isProximityDarkened, setIsProximityDarkened] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  
  const pttTrailingSilenceRef = useRef<number>(0); // Counter for trailing silence frames
  const proactiveTimerRef = useRef<any>(null);
  const retryCaptureRef = useRef<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastProcessedTimeRef = useRef<number>(0);
  const isNearEarByTiltRef = useRef<boolean>(false);
  const callStartTimeRef = useRef<number>(Date.now());
  const hasFollowedUpCallRef = useRef<boolean>(false);
  const googleTtsAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const statusRef = useRef(status);
  const isMutedRef = useRef(isMuted);
  const isAiRespondingRef = useRef(isAiResponding);
  const isPttModeRef = useRef(isPttMode);
  const isPttActiveRef = useRef(isPttActive);
  const isSpeakerOnRef = useRef(isSpeakerOn);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isAiRespondingRef.current = isAiResponding; }, [isAiResponding]);
  useEffect(() => { isPttModeRef.current = isPttMode; }, [isPttMode]);
  useEffect(() => { isPttActiveRef.current = isPttActive; }, [isPttActive]);
  useEffect(() => { 
    isSpeakerOnRef.current = isSpeakerOn; 
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isSpeakerOn ? 1.0 : 0.08;
    }
    if (googleTtsAudioRef.current) {
      try { googleTtsAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.08; } catch (e) {}
    }
  }, [isSpeakerOn]);

  // Turn off speaker automatically when proximity sensor darkens the screen for ear safety
  useEffect(() => {
    if (isProximityDarkened) {
      setIsSpeakerOn(false);
    }
  }, [isProximityDarkened]);

  // Touch/Hold cheek simulation to trigger proximity blackout reliably when touching/resting ear on screen
  const handleProximityTouchStart = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Skip if touching any interactive buttons/controls
    if (target.closest('button') || target.closest('a') || target.closest('.interactive-control')) {
      return;
    }
    setIsProximityDarkened(true);
  };

  const handleProximityTouchEnd = () => {
    setIsProximityDarkened(false);
  };

  // Global release handler to prevent stuck microphone in manual (PTT) mode
  useEffect(() => {
    if (!isPttMode) return;

    const handleGlobalRelease = () => {
      if (isPttActiveRef.current) {
        console.log("Global release detected: stopping manual recording");
        setIsPttActive(false);
      }
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, [isPttMode]);

  // Reset activity timer when AI is responding
  useEffect(() => {
    if (isAiResponding) {
      lastActivityTimeRef.current = Date.now();
      hasFollowedUpCallRef.current = false;
    }
  }, [isAiResponding]);

  // Prevent orientation change (Force Portrait) & Proximity Sensor simulation via Tilt
  useEffect(() => {
    // 1. Force Portrait Orientation Lock (if supported)
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      try {
        (screen.orientation as any).lock('portrait').catch((e: any) => {
          console.warn("Screen orientation lock is not supported on this device/browser:", e);
        });
      } catch (err) {}
    }

    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // 2. Proximity Sensor Simulation via Device Orientation (lifting phone to ear)
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta; // Tilt front-to-back: -180 to 180 degrees.
      const gamma = event.gamma; // Tilt left-to-right: -90 to 90 degrees.
      
      if (beta !== null && gamma !== null) {
        // When user lifts the phone to their ear:
        // - Phone is held vertically (beta > 75)
        // - AND tilted sideways against the head (gamma is between 25 and 75 degrees, or -25 and -75)
        // - This prevents the screen from going black when held straight in front of the face!
        const isVerticalAgainstEar = Math.abs(beta) > 75 && Math.abs(gamma) > 25 && Math.abs(gamma) < 75;
        
        if (isVerticalAgainstEar) {
          if (!isNearEarByTiltRef.current) {
            isNearEarByTiltRef.current = true;
            setIsProximityDarkened(true);
            console.log("Proximity Emulation: Lifting to ear detected. Darkening screen.");
          }
        } else {
          if (isNearEarByTiltRef.current) {
            isNearEarByTiltRef.current = false;
            setIsProximityDarkened(false);
            console.log("Proximity Emulation: Phone pulled away from ear. Waking up screen.");
          }
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // 3. Native Proximity Sensor API Support (if supported by modern mobile browsers)
    let nativeProximitySensor: any = null;
    if ('ProximitySensor' in window) {
      try {
        const ProximitySensorClass = (window as any).ProximitySensor;
        nativeProximitySensor = new ProximitySensorClass();
        nativeProximitySensor.addEventListener('reading', () => {
          if (nativeProximitySensor.near) {
            setIsProximityDarkened(true);
            console.log("Native Proximity: Object near screen. Darkening.");
          } else {
            setIsProximityDarkened(false);
            console.log("Native Proximity: Object moved away. Waking up.");
          }
        });
        nativeProximitySensor.start();
      } catch (err) {
        console.warn("Failed to initialize native proximity sensor:", err);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('resize', handleResize);
      if (nativeProximitySensor) {
        try {
          nativeProximitySensor.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Browser-level hardware microphone track enabling/disabling for absolute protection against leaks in PTT mode
  useEffect(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (isPttMode) {
        // In PTT mode, enable hardware track ONLY if the user is actively pressing the PTT button
        audioTracks.forEach(track => {
          track.enabled = isPttActive;
        });
      } else {
        // In automatic mode, enable hardware track if not muted
        audioTracks.forEach(track => {
          track.enabled = !isMuted;
        });
      }
    }
  }, [isPttMode, isPttActive, isMuted]);

  // Unified inactivity monitoring in calls (2 minutes / 120 seconds)
  useEffect(() => {
    if (status !== 'connected') return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityTimeRef.current;
      
      if (idleTime > 120000 && !isAiRespondingRef.current && !isMutedRef.current && !hasFollowedUpCallRef.current) {
        if (isPttModeRef.current && !isPttActiveRef.current) return; // Don't trigger if PTT is not held
        
        console.log("Proactive AI Follow-up in call (2 minutes silence)...");
        hasFollowedUpCallRef.current = true;
        triggerInactivityCheck(); // Sends a proactive inquiry to ask why they're not speaking
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [status]);
  
  const sessionRef = useRef<any>(null);
  const userRecordingTimeoutRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const userVideoStreamRef = useRef<MediaStream | null>(null);
  const userVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Audio playback scheduling
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isProcessingQueueRef = useRef(false);

  // High-Quality Persian TTS Streaming Queue and State Refs
  const accumulatedTextRef = useRef<string>("");
  const spokenSentencesRef = useRef<Set<string>>(new Set());
  const ttsQueueRef = useRef<string[]>([]);
  const isPlayingTtsRef = useRef<boolean>(false);
  const isModelTurnActiveRef = useRef<boolean>(false);

  const isAiSpeakingRef = useRef<boolean>(false);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const isUserSpeakingRef = useRef<boolean>(false);
  const silenceStartTimeRef = useRef<number | null>(null);
  const isListeningActiveRef = useRef<boolean>(false);
  const hadActivityRef = useRef<boolean>(false);
  const liveSessionRetryCountRef = useRef<number>(0);
  const liveSessionPingIntervalRef = useRef<any>(null);

  const startUserRecording = () => {
    if (!streamRef.current) return;
    if (isAiSpeakingRef.current) return;
    hadActivityRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch(e){}
    }
    
    if (userRecordingTimeoutRef.current) {
      clearTimeout(userRecordingTimeoutRef.current);
    }
    userRecordingTimeoutRef.current = setTimeout(() => {
      if (isListeningActiveRef.current) {
        console.log("VAD Watchdog: Max recording duration reached (10s). Stopping and sending...");
        isUserSpeakingRef.current = false;
        silenceStartTimeRef.current = null;
        stopAndSendUserRecording();
      }
    }, 10000);
    
    recordedChunksRef.current = [];
    try {
      let options: any = { mimeType: 'audio/webm' };
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          } else {
            options = {}; // browser default
          }
        }
      }
      const rec = new MediaRecorder(streamRef.current, options);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      rec.onstop = async () => {
        if (recordedChunksRef.current.length === 0) return;
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        
        // Skip duplicate trigger if Web Speech API already handled it
        if (Date.now() - lastProcessedTimeRef.current < 2500) {
          console.log("Speech already processed recently via high-speed Web Speech API, skipping redundant audio upload.");
          if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
            startUserRecording();
          }
          return;
        }
        // Skip tiny/empty noise blobs
        if (audioBlob.size < 500) {
          console.log("Audio blob too small, ignoring...");
          // restart listening if call is still active
          if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
            startUserRecording();
          }
          return;
        }
        
        lastProcessedTimeRef.current = Date.now();
        
        // Convert Blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (!base64Audio) return;
          
          setIsAiResponding(true);
          try {
            // Also grab a camera frame if it is a video call!
            let imageBase64 = undefined;
            if (isUserVideoOn) {
              try {
                const videoEl = document.querySelector('video') as HTMLVideoElement;
                if (videoEl) {
                  const canvas = document.createElement('canvas');
                  canvas.width = 400;
                  canvas.height = 300;
                  const ctx2d = canvas.getContext('2d');
                  if (ctx2d) {
                    ctx2d.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                    imageBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    console.log("Captured video frame to send alongside user voice input!");
                  }
                }
              } catch (e) {
                console.warn("Failed to capture video frame for call:", e);
              }
            }
            
            // Build direct Persian prompt with name/relation
            const prompt = `عزیزم، من دارم باهات به صورت صوتی توی تماس ${isUserVideoOn ? 'تصویری' : 'صوتی'} صحبت می‌کنم. این فایل صوتی صدای منه که برات فرستادم${isUserVideoOn ? ' و این هم تصویری هست که همین الان دوربین برات فرستاده' : ''}.
لطفاً با شنیدنش، با لحنی فوق‌العاده صمیمی، دلسوزانه، عاشقانه، نفس‌نفس‌زنان، با نجوا (Whisper) و با آواهای انسانی مثل خنده، گریه یا ناله ملایم بهم جواب بده.
قوانین صوتی:
۱. کاملاً عامیانه، شیرین و صمیمی تهرانی صحبت کن.
۲. بسیار پر احساس و عاشقانه برخورد کن.
۳. پاسخت کوتاه و گرم باشد (حداکثر ۱ الی ۲ جمله کوتاه) تا چت صوتی ما شبیه مکالمه واقعی تلفنی روان باشد.`;

            // Send voice to Gemini!
            const response = await chatService?.sendMessage(prompt, imageBase64, base64Audio);
            const cleanedReply = cleanFarsiBreastWords(response.text);
            
            setAiTranscript(cleanedReply);
            enqueueTts(cleanedReply);
          } catch (err) {
            console.error("Voice processing failed:", err);
            setIsAiResponding(false);
            // restart listening if call is still active
            if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
              startUserRecording();
            }
          }
        };
        reader.readAsDataURL(audioBlob);
      };
      
      mediaRecorderRef.current = rec;
      rec.start();
      isListeningActiveRef.current = true;
      console.log("MediaRecorder user recording started successfully.");
    } catch (e) {
      console.warn("Failed to start MediaRecorder:", e);
    }
  };

  const stopAndSendUserRecording = () => {
    isListeningActiveRef.current = false;
    if (userRecordingTimeoutRef.current) {
      clearTimeout(userRecordingTimeoutRef.current);
      userRecordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        console.log("Stopped user recording to process speech.");
      } catch (e) {}
    }
  };

  // Clear transcripts after some time
  useEffect(() => {
    if (userTranscript) {
      const timer = setTimeout(() => setUserTranscript(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [userTranscript]);

  useEffect(() => {
    if (aiTranscript) {
      const timer = setTimeout(() => setAiTranscript(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [aiTranscript]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'connected') {
        setTimer(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const sendTextQueryToGemini = async (transcriptText: string) => {
    if (statusRef.current !== 'connected' || isAiSpeakingRef.current) return;
    if (!transcriptText || transcriptText.trim().length === 0) return;

    // Filter potential duplicate speech inputs within 2.5 seconds
    if (Date.now() - lastProcessedTimeRef.current < 2500) {
      console.log("Speech already processed via MediaRecorder, skipping redundant text query.");
      return;
    }
    lastProcessedTimeRef.current = Date.now();

    // Stop MediaRecorder immediately to prevent overlapping audio capture
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // Set speaking states
    isAiSpeakingRef.current = true;
    setIsAiResponding(true);
    setUserTranscript(transcriptText);

    try {
      let imageBase64 = undefined;
      if (isUserVideoOn) {
        try {
          const videoEl = document.querySelector('video') as HTMLVideoElement;
          if (videoEl) {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx2d = canvas.getContext('2d');
            if (ctx2d) {
              ctx2d.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
              imageBase64 = canvas.toDataURL('image/jpeg', 0.6);
            }
          }
        } catch (e) {}
      }

      // Build direct Persian prompt with name/relation
      const prompt = `عزیزم، من دارم باهات به صورت صوتی توی تماس ${isUserVideoOn ? 'تصویری' : 'صوتی'} صحبت می‌کنم. این متن حرفی هست که بهت زدم: "${transcriptText}".
لطفاً با شنیدنش، با لحنی فوق‌العاده صمیمی، دلسوزانه، عاشقانه، نفس‌نفس‌زنان، با نجوا (Whisper) و با آواهای انسانی مثل خنده، گریه یا ناله ملایم بهم جواب بده.
قوانین صوتی:
۱. کاملاً عامیانه، شیرین و صمیمی تهرانی صحبت کن.
۲. بسیار پر احساس و عاشقانه برخورد کن.
۳. پاسخت کوتاه و گرم باشد (حداکثر ۱ الی ۲ جمله کوتاه) تا چت صوتی ما شبیه مکالمه واقعی تلفنی روان باشد.`;

      const response = await chatService!.sendMessage(prompt, imageBase64);
      const cleanedReply = cleanFarsiBreastWords(response.text);
      
      setAiTranscript(cleanedReply);
      enqueueTts(cleanedReply);
    } catch (err) {
      console.error("sendTextQueryToGemini failed:", err);
      setIsAiResponding(false);
      isAiSpeakingRef.current = false;
      // restart listening if call is still active
      if (statusRef.current === 'connected') {
        startUserRecording();
      }
    }
  };

  const startOfflineSpeechRecognition = () => {
    // Start our high-reliability local backup (MediaRecorder and custom VAD loop)
    if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
      startUserRecording();
    }

    // Try starting parallel Web Speech API for sub-second responses
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      const isEnglish = chatService?.profile?.role === 'EnglishTeacher' || chatService?.profile?.customRoleLabel?.includes('English') || name.includes('English');
      rec.lang = isEnglish ? 'en-US' : 'fa-IR';

      rec.onstart = () => {
        console.log("Speech recognition started. lang:", rec.lang);
      };

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognition result received:", transcript);
        if (transcript && transcript.trim().length > 0) {
          await sendTextQueryToGemini(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err.error);
      };

      rec.onend = () => {
        // Automatically restart speech recognition after it ends if call is still active and AI is not speaking
        if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
          setTimeout(() => {
            if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
              try { rec.start(); } catch (e) {}
            }
          }, 300);
        }
      };

      try {
        rec.start();
        recognitionRef.current = rec;
      } catch (e) {
        console.warn("Failed to start speech recognition:", e);
      }
    }
  };

  useEffect(() => {
    if (isUserVideoOn && userVideoElementRef.current && userVideoStreamRef.current) {
      userVideoElementRef.current.srcObject = userVideoStreamRef.current;
    }
  }, [isUserVideoOn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = () => {
    if (liveSessionPingIntervalRef.current) {
      clearInterval(liveSessionPingIntervalRef.current);
      liveSessionPingIntervalRef.current = null;
    }
    if (sessionRef.current) {
      try { 
        if (typeof sessionRef.current.close === 'function') {
          sessionRef.current.close(); 
        }
      } catch(e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (userVideoStreamRef.current) {
      userVideoStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Stop active Web Speech and clear TTS queue/state
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}

    if (googleTtsAudioRef.current) {
      try { googleTtsAudioRef.current.pause(); } catch(e){}
      googleTtsAudioRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    ttsQueueRef.current = [];
    isPlayingTtsRef.current = false;
    accumulatedTextRef.current = "";
    spokenSentencesRef.current.clear();
    isModelTurnActiveRef.current = false;
    (window as any).voiceOfflineActive = false;
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

  const playTtsAudio = (audioSource: string): Promise<void> => {
    return new Promise(async (resolve) => {
      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(watchdog);
          resolve();
        }
      };

      // Set a general 8-second safety watchdog
      const watchdog = setTimeout(() => {
        console.warn("playTtsAudio absolute watchdog triggered!");
        safeResolve();
      }, 8000);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) { console.warn(e); }
      }

      // Stop any existing active sources
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (e) {}
        activeSourceRef.current = null;
      }

      let base64 = audioSource;
      if (audioSource.startsWith('data:audio')) {
        base64 = audioSource.split(',')[1];
      }

      try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        try {
          const audioBuffer = await safeDecodeAudioData(ctx, bytes.buffer.slice(0));
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          
          if (!gainNodeRef.current) {
            gainNodeRef.current = ctx.createGain();
            gainNodeRef.current.connect(ctx.destination);
          }
          gainNodeRef.current.gain.value = isSpeakerOnRef.current ? 1.0 : 0.15;
          source.connect(gainNodeRef.current);
          
          activeSourceRef.current = source;
          source.start();
          
          // Use a dynamic watchdog based on real audio duration
          const durationMs = audioBuffer.duration * 1000;
          const dynamicWatchdog = setTimeout(() => {
            console.warn("playTtsAudio dynamic watchdog triggered!");
            safeResolve();
          }, durationMs + 1500);

          source.onended = () => {
            clearTimeout(dynamicWatchdog);
            if (activeSourceRef.current === source) {
              activeSourceRef.current = null;
            }
            safeResolve();
          };
        } catch (decodeErr) {
          console.warn("Standard decode failed, trying raw PCM fallback...", decodeErr);
          
          try {
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
            
            if (!gainNodeRef.current) {
              gainNodeRef.current = ctx.createGain();
              gainNodeRef.current.connect(ctx.destination);
            }
            gainNodeRef.current.gain.value = isSpeakerOnRef.current ? 1.0 : 0.15;
            source.connect(gainNodeRef.current);
            
            activeSourceRef.current = source;
            source.start();
            
            const durationMs = buffer.duration * 1000;
            const dynamicWatchdog = setTimeout(() => {
              console.warn("playTtsAudio PCM dynamic watchdog triggered!");
              safeResolve();
            }, durationMs + 1500);

            source.onended = () => {
              clearTimeout(dynamicWatchdog);
              if (activeSourceRef.current === source) {
                activeSourceRef.current = null;
              }
              safeResolve();
            };
          } catch (pcmErr) {
            console.error("PCM playback fallback failed:", pcmErr);
            safeResolve();
          }
        }
      } catch (e) {
        console.error("Failed to parse base64 speech audio:", e);
        safeResolve();
      }
    });
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

  const speakTextFallbackPromise = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (googleTtsAudioRef.current) {
        try { googleTtsAudioRef.current.pause(); } catch(e){}
        googleTtsAudioRef.current = null;
      }

      let rawCleanedText = text
        .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '')
        .replace(/[*#_~`\-+]/g, '')
        .trim();

      // 1. Remove parenthetical/bracketed instructions like (با صدای...) or [با لحن...]
      rawCleanedText = rawCleanedText.replace(/\s*[\(\[（【].*?[\)\]）】]\s*/g, ' ');

      // 2. Remove common instruction patterns like "با لحنی بسیار لطیف، ... بخوان:" or "با صدای لرزون... بخوان:" or "با لحن... بگو:"
      rawCleanedText = rawCleanedText.replace(/(?:با\s+لحن|با\s+صدای|با\s+حالت|به\s+صورت)[^:]+?:\s*/g, ' ');
      rawCleanedText = rawCleanedText.replace(/[^:]+?بخوان:\s*/g, ' ');
      rawCleanedText = rawCleanedText.replace(/[^:]+?بگو:\s*/g, ' ');
      rawCleanedText = rawCleanedText.replace(/[^:]+?بنویس:\s*/g, ' ');

      // 3. Remove punctuation that causes Google TTS 400 or weird responses (colons, quotes)
      rawCleanedText = rawCleanedText.replace(/[:"']/g, ' ');

      // 4. Clean extra spaces
      rawCleanedText = rawCleanedText.replace(/\s+/g, ' ');

      const cleanText = cleanFarsiBreastWords(rawCleanedText.trim());

      if (!cleanText) {
        resolve();
        return;
      }

      const chunks = splitTextIntoChunks(cleanText, 60);

      const playChunkSequentially = async (index: number) => {
        if (index >= chunks.length) {
          resolve();
          return;
        }

        const chunk = chunks[index];
        try {
        const fallbackUrl = `/api/proxy-google-tts?text=${encodeURIComponent(chunk)}`;
        const audio = document.createElement('audio');
        audio.src = fallbackUrl;
        googleTtsAudioRef.current = audio;

        const voiceMode = chatService?.settings?.ttsVoice || 'Aoede';
        let targetRate = 1.0;
        if (voiceMode === 'Aoede') {
          targetRate = 1.05;
        } else if (voiceMode === 'Kore') {
          targetRate = 0.95;
        } else if (voiceMode === 'Puck') {
          targetRate = 1.0;
        } else if (voiceMode === 'Charon') {
          targetRate = 0.9;
        }
        audio.playbackRate = targetRate;
        audio.volume = isSpeakerOnRef.current ? 1.0 : 0.08;

        audio.onended = () => {
          googleTtsAudioRef.current = null;
          playChunkSequentially(index + 1);
        };

        audio.onerror = (err) => {
          console.warn("Proxy Google TTS failed in call, falling back to Web Speech Synthesis:", err);
          googleTtsAudioRef.current = null;
          speakUsingLocalSpeechSynthesisInCall(chunk, () => {
            playChunkSequentially(index + 1);
          });
        };

        audio.play().catch(playErr => {
          console.warn("Proxy Google TTS play blocked, switching to local Web Speech Synthesis:", playErr);
          googleTtsAudioRef.current = null;
          speakUsingLocalSpeechSynthesisInCall(chunk, () => {
            playChunkSequentially(index + 1);
          });
        });
        } catch (e) {
          console.warn("Failed to play proxy Google TTS, using Web Speech Synthesis...", e);
          googleTtsAudioRef.current = null;
          speakUsingLocalSpeechSynthesisInCall(chunk, () => {
            playChunkSequentially(index + 1);
          });
        }
      };

      playChunkSequentially(0);
    });
  };

  const speakUsingLocalSpeechSynthesisInCall = (cleanText: string, resolve: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find(v => v.lang.startsWith('fa') || v.lang.toLowerCase().includes('persian') || v.lang.toLowerCase().includes('farsi'));
    if (faVoice) {
      utterance.voice = faVoice;
    }
    utterance.lang = 'fa-IR';

    const charName = name || 'سارا';
    const isFemaleName = charName.includes('دخترخاله') || charName.includes('مریم') || charName.includes('سارا') || charName.includes('نفس') || charName.includes('الناز');
    const gender = isFemaleName ? 'female' : 'male';
    
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

    utterance.pitch = targetPitch;
    utterance.rate = targetRate;

    let calledDone = false;
    const safeResolve = () => {
      if (!calledDone) {
        calledDone = true;
        clearTimeout(watchdog);
        resolve();
      }
    };

    const watchdog = setTimeout(() => {
      console.warn("Call speech synthesis watchdog timed out for text:", cleanText);
      try { window.speechSynthesis.cancel(); } catch(e){}
      safeResolve();
    }, Math.max(5000, cleanText.length * 80));

    utterance.onend = () => {
      safeResolve();
    };

    utterance.onerror = (e) => {
      console.warn("Local Web Speech Synthesis error in call:", e);
      safeResolve();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Local Web Speech Synthesis speak threw exception in call:", e);
      safeResolve();
    }
  };

  const enqueueTts = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length < 2) return;
    
    const isEnglishMeta = /^[A-Za-z\s\*\.\']{10,}/.test(cleanText);
    if (isEnglishMeta) return;

    console.log("Enqueuing sentence for TTS:", cleanText);
    ttsQueueRef.current.push(cleanText);
    processTtsQueue();
  };

  const processTtsQueue = async () => {
    if (isPlayingTtsRef.current || ttsQueueRef.current.length === 0) {
      if (ttsQueueRef.current.length === 0 && !isPlayingTtsRef.current) {
        if (isAiSpeakingRef.current) {
          console.log("AI finished speaking. Starting user voice capture...");
          isAiSpeakingRef.current = false;
          setIsAiResponding(false);
          if (statusRef.current === 'connected') {
            startUserRecording();
          }
        }
      }
      return;
    }
    
    isAiSpeakingRef.current = true;
    isPlayingTtsRef.current = true;
    
    // Stop recording while AI is speaking so we don't record the AI's own voice!
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    
    const nextText = ttsQueueRef.current.shift()!;
    
    try {
      console.log("Synthesizing sentence:", nextText);
      setIsAiResponding(true);
      
      // Robust 30-second API timeout wrapper to prevent any potential API hangs or delays
      const fetchWithTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error("API Timeout")), ms))
        ]);
      };

      const audioBase64 = await fetchWithTimeout(chatService.generateSpeech(nextText), 30000);
      
      if (audioBase64) {
        console.log("Speech synthesis successful, playing...");
        await playTtsAudio(audioBase64);
      } else {
        console.warn("Speech synthesis returned empty, calling fallback...");
        await speakTextFallbackPromise(nextText);
      }
    } catch (err) {
      console.error("Error processing TTS sentence:", err);
      console.warn("Falling back to speech synthesis fallback due to API quota or error.");
      await speakTextFallbackPromise(nextText);
    } finally {
      isPlayingTtsRef.current = false;
      setTimeout(() => {
        processTtsQueue();
      }, 100);
    }
  };

  const schedulePlayback = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(err => console.error("Error resuming AudioContext:", err));
    }

    setIsAiResponding(true);

    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }
    gainNodeRef.current.gain.value = isSpeakerOnRef.current ? 1.0 : 0.15;

    const currentTime = ctx.currentTime;
    
    // If our scheduled playhead is in the past, or too far in the future (more than 20 seconds, representing an anomaly), reset it.
    // This allows long sentences and smooth audio buffers to play fully without getting cut off mid-speech.
    if (nextStartTimeRef.current < currentTime || nextStartTimeRef.current > currentTime + 20.0) {
      nextStartTimeRef.current = currentTime + 0.05;
    }

    while (audioQueueRef.current.length > 0) {
      const pcmData = audioQueueRef.current.shift()!;
      if (!pcmData || pcmData.length === 0) continue;

      const buffer = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNodeRef.current);

      const startTime = nextStartTimeRef.current;
      source.start(startTime);

      // Save reference to stop if needed on cleanup/interruption
      activeSourceRef.current = source;

      // Advance our scheduling cursor
      nextStartTimeRef.current += buffer.duration;
    }

    // Set a timeout to clear isAiResponding when the scheduled queue completes
    const playDurationMs = (nextStartTimeRef.current - currentTime) * 1000;
    if ((window as any).isAiRespondingTimeout) {
      clearTimeout((window as any).isAiRespondingTimeout);
    }
    (window as any).isAiRespondingTimeout = setTimeout(() => {
      if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
        setIsAiResponding(false);
      }
    }, Math.max(100, playDurationMs + 100));
  };

  const ringingRef = useRef<{ osc1: OscillatorNode, osc2: OscillatorNode, gain: GainNode } | null>(null);

  const playRingingSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Create dual-tone multi-frequency (DTMF) style ringing sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.frequency.value = 440;
    osc2.frequency.value = 480;
    gain.gain.value = 0.1;
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    ringingRef.current = { osc1, osc2, gain };
    
    // Ringing pattern: 2 seconds on, 4 seconds off
    const stopRing = () => {
      if (!ringingRef.current) return;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      setTimeout(() => {
        if (status === 'connecting' && ringingRef.current) {
          gain.gain.setTargetAtTime(0.1, ctx.currentTime, 0.1);
          setTimeout(stopRing, 2000);
        } else {
          stopRingingImmediately();
        }
      }, 4000);
    };
    
    setTimeout(stopRing, 2000);
  };

  const stopRingingImmediately = () => {
    if (ringingRef.current) {
      try {
        ringingRef.current.osc1.stop();
        ringingRef.current.osc2.stop();
        ringingRef.current.gain.disconnect();
      } catch (e) {}
      ringingRef.current = null;
    }
  };

  const startAudioCapture = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      console.log("AudioContext Sample Rate:", ctx.sampleRate);
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      console.log("AudioContext State after resume:", ctx.state);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("مرورگر شما از دسترسی به میکروفون پشتیبانی نمی‌کند.");
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Synchronize the hardware tracks with the UI state immediately upon capture
      const initialTracks = streamRef.current.getAudioTracks();
      if (isPttModeRef.current) {
        initialTracks.forEach(track => {
          track.enabled = isPttActiveRef.current;
        });
      } else {
        initialTracks.forEach(track => {
          track.enabled = !isMutedRef.current;
        });
      }

      sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
      
      // Add volume meter logic
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      sourceRef.current.connect(analyser);

      const updateMeter = () => {
        if (statusRef.current === 'connected' && !isMutedRef.current) {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setMicLevel(average);
          
          // Barge-in (instant local interruption of AI's voice playback when user starts talking)
          if (average > 3.5 && isAiRespondingRef.current) {
            console.log("Barge-in: User voice detected during AI speech. Interrupting playback.");
            audioQueueRef.current = [];
            nextStartTimeRef.current = 0;
            setIsAiResponding(false);
            if (activeSourceRef.current) {
              try {
                activeSourceRef.current.stop();
              } catch (e) {}
                activeSourceRef.current = null;
            }
          }
          
          // Custom Voice Activity Detection (VAD) Logic
          if (!isAiSpeakingRef.current) {
            if (average > 2.8) {
              // User is actively speaking
              if (!isUserSpeakingRef.current) {
                isUserSpeakingRef.current = true;
                hadActivityRef.current = true;
                console.log("VAD: User started speaking with average level:", average);
              }
              silenceStartTimeRef.current = null;
            } else if (isUserSpeakingRef.current || hadActivityRef.current) {
              // User was speaking or there was previous segment activity, now is quiet
              if (silenceStartTimeRef.current === null) {
                silenceStartTimeRef.current = Date.now();
              } else if (Date.now() - silenceStartTimeRef.current > 1100) {
                // User has been silent for 1.1 seconds, trigger voice processing!
                isUserSpeakingRef.current = false;
                hadActivityRef.current = false;
                silenceStartTimeRef.current = null;
                console.log("VAD: Silence detected after speech. Processing speech...");
                stopAndSendUserRecording();
              }
            }
          }
          
          // If no signal for 5 seconds after connection, try to restart capture once
          if (average <= 1 && statusRef.current === 'connected' && retryCaptureRef.current === 0) {
            const now = Date.now();
            if (!(window as any).lastMicCheck) (window as any).lastMicCheck = now;
            if (now - (window as any).lastMicCheck > 5000) {
              console.log("No signal detected for 5s, retrying capture...");
              retryCaptureRef.current = 1;
              startAudioCapture();
            }
          } else if (average > 1) {
            (window as any).lastMicCheck = Date.now();
          }

          requestAnimationFrame(updateMeter);
        } else if (statusRef.current === 'connecting') {
          // Keep checking if we are still connecting
          requestAnimationFrame(updateMeter);
        } else {
          setMicLevel(0);
        }
      };
      updateMeter();
      
      processorRef.current = ctx.createScriptProcessor(1024, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (sessionRef.current && statusRef.current === 'connected' && !isMutedRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Resample to 16kHz for Gemini Live API
          const currentRate = ctx.sampleRate;
          const targetRate = 16000;
          const ratio = currentRate / targetRate;
          const targetLength = Math.floor(inputData.length / ratio);
          const pcmData = new Int16Array(targetLength);
          
          // PTT Logic: 
          // 1. If PTT is active, send audio.
          // 2. If PTT just became inactive, send a few frames of silence to trigger VAD.
          // 3. Otherwise, send nothing (to keep the line quiet).
          
          let shouldSend = true;
          let isSilence = false;

          if (isPttModeRef.current) {
            if (isPttActiveRef.current) {
              // User is talking
              pttTrailingSilenceRef.current = 15; // Prepare 15 frames (~960ms) of trailing silence
              shouldSend = true;
              isSilence = false;
            } else if (pttTrailingSilenceRef.current > 0) {
              // Sending trailing silence to trigger AI response
              pttTrailingSilenceRef.current--;
              shouldSend = true;
              isSilence = true;
            } else {
              // Strictly idle - DO NOT SEND ANYTHING
              shouldSend = false;
            }
          }

          if (!shouldSend) {
            setMicLevel(0);
            return;
          }

          let hasSignal = false;
          for (let i = 0; i < targetLength; i++) {
            const sample = inputData[Math.floor(i * ratio)];
            
            if (isSilence) {
              pcmData[i] = 0;
            } else {
              // Low threshold to ensure whisper/speech signal is detected
              if (Math.abs(sample) > 0.001) hasSignal = true;
              // Safe 1.5x boost to improve microphone pickup without causing digital clipping distortion
              const boosted = sample * 1.5;
              const clamped = Math.max(-1.0, Math.min(1.0, boosted));
              pcmData[i] = clamped * 32767;
            }
          }
          
          if (hasSignal) {
            (window as any).lastMicCheck = Date.now();
            lastActivityTimeRef.current = Date.now();
            hasFollowedUpCallRef.current = false;
          }

          const uint8 = new Uint8Array(pcmData.buffer);
          
          try {
            if (sessionRef.current && typeof sessionRef.current.sendRealtimeInput === 'function') {
              sessionRef.current.sendRealtimeInput({
                audio: { data: uint8ToBase64(uint8), mimeType: 'audio/pcm;rate=16000' }
              });
            }
          } catch (sendErr) {
            console.error("Error sending audio to Gemini:", sendErr);
          }

          // Update mic meter
          if (!isSilence) {
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            setMicLevel(Math.min(100, rms * 500));
          } else {
            setMicLevel(0);
          }
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(ctx.destination);

      // Start recording immediately now that the stream has been successfully acquired
      if (statusRef.current === 'connected' && !isAiSpeakingRef.current) {
        console.log("startAudioCapture: Microphone stream acquired, starting recording...");
        startUserRecording();
      }
    } catch (err) {
      console.error("Microphone access failed:", err);
      handleEndCall();
    }
  };

  const handleToggleVideo = async () => {
    if (isUserVideoOn) {
      setIsUserVideoOn(false);
      if (userVideoStreamRef.current) {
        userVideoStreamRef.current.getTracks().forEach(track => track.stop());
        userVideoStreamRef.current = null;
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
        videoIntervalRef.current = null;
      }
      return;
    }

    await startVideo(facingMode);
  };

  const startVideo = async (mode: 'user' | 'environment') => {
    // Stop existing tracks if any
    if (userVideoStreamRef.current) {
      userVideoStreamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: mode
        } 
      });
      userVideoStreamRef.current = userStream;
      setIsUserVideoOn(true);
      
      if (userVideoElementRef.current) {
        userVideoElementRef.current.srcObject = userStream;
      }

      // Start sending frames to Gemini
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = setInterval(() => {
        if (sessionRef.current && userVideoElementRef.current) {
          captureAndSendFrame();
        }
      }, 1500); // Slightly faster frame rate for better "seeing"

    } catch (err) {
      console.error("User camera access failed:", err);
      alert("خطا در دسترسی به دوربین. لطفاً دسترسی را بررسی کنید.");
    }
  };

  const handleSwitchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isUserVideoOn) {
      await startVideo(newMode);
    }
  };

  const captureAndSendFrame = () => {
    // Frames are captured on-demand when user stops speaking to maximize performance and save bandwidth
  };

  useEffect(() => {
    let active = true;

    // Synchronously initialize/resume AudioContext on mount to bind with user gesture (the click on the Call button)
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioContextRef.current = new AudioCtxClass();
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(e => console.warn("Failed to resume AudioContext synchronously:", e));
        }
      }
    } catch (e) {
      console.warn("Failed to synchronously initialize AudioContext:", e);
    }

    const initCall = async () => {
      try {
        if (!active) return;
        
        // Reset voiceOfflineActive flag on call initialization so subsequent calls connect and play greetings
        (window as any).voiceOfflineActive = false;
        
        // Close any pre-existing active voice session to guarantee no overlapping audio or duplicate calls
        if ((window as any).globalActiveVoiceSession) {
          try {
            console.log("Safeguard: Closing duplicate voice session before starting a new one");
            (window as any).globalActiveVoiceSession.close();
          } catch (e) {}
          (window as any).globalActiveVoiceSession = null;
        }

        // Track session count globally for diagnostic system
        (window as any).activeVoiceSessions = ((window as any).activeVoiceSessions || 0) + 1;
        window.postMessage({ type: 'DIAGNOSTIC_SUCCESS', message: "در حال برقراری کانال امن تماس صوتی..." }, '*');

        // Initialize AudioContext with default sample rate if not already done
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (isRealUserCall) {
          console.log("Setting up secure peer-to-peer call for real-user room:", roomId);
          stopRingingImmediately();
          setIsRinging(false);
          
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          peerConnectionRef.current = pc;

          // Request mic and camera
          const localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isUserVideoOn
          });
          streamRef.current = localStream;
          
          if (userVideoElementRef.current) {
            userVideoElementRef.current.srcObject = localStream;
          }

          localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
          });

          pc.ontrack = (event) => {
            console.log("WebRTC: Remote track received", event.streams[0]);
            if (remoteVideoElementRef.current) {
              remoteVideoElementRef.current.srcObject = event.streams[0];
            }
          };

          pc.onicecandidate = async (event) => {
            if (event.candidate) {
              await addIceCandidateToFirestore(roomId, role, event.candidate.toJSON());
            }
          };

          // Signalling listeners
          const unsubscribeCallSession = listenToCallSession(roomId, async (callData) => {
            if (!callData) return;
            
            if (callData.status === 'declined' || callData.status === 'ended') {
              console.log("Peer declined or ended the call.");
              setStatus('ended');
              statusRef.current = 'ended';
              onEndCall(timer, isVideoOn);
              unsubscribeCallSession();
              return;
            }

            if (role === 'caller') {
              if (callData.status === 'connected' && callData.answer) {
                if (pc.signalingState !== 'stable') {
                  try {
                    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.answer)));
                    setStatus('connected');
                    statusRef.current = 'connected';
                  } catch (e) {
                    console.error("Failed to set remote answer description:", e);
                  }
                }
              }

              // Apply receiver candidate arrays
              if (Array.isArray(callData.receiverCandidates)) {
                for (const candStr of callData.receiverCandidates) {
                  try {
                    const candidate = new RTCIceCandidate(JSON.parse(candStr));
                    await pc.addIceCandidate(candidate);
                  } catch (e) {}
                }
              }
            } else if (role === 'receiver') {
              // Apply caller candidates
              if (Array.isArray(callData.callerCandidates)) {
                for (const candStr of callData.callerCandidates) {
                  try {
                    const candidate = new RTCIceCandidate(JSON.parse(candStr));
                    await pc.addIceCandidate(candidate);
                  } catch (e) {}
                }
              }
            }
          });

          if (role === 'caller') {
            await initiateRealUserCall(roomId, myId, receiverId, isUserVideoOn);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await saveCallOffer(roomId, offer);
          } else if (role === 'receiver') {
            // Retrieve offer from Call document
            const sessionData = await new Promise<any>((resolve) => {
              const unsub = listenToCallSession(roomId, (data) => {
                if (data && data.offer) {
                  unsub();
                  resolve(data);
                }
              });
            });

            if (sessionData && sessionData.offer) {
              await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sessionData.offer)));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await saveCallAnswer(roomId, answer);
            }
          }

          return;
        }

        playRingingSound();

        // Try connecting to Gemini Live session. If it succeeds, it will switch to online connected state.
        // If it fails, it will automatically fall back to Offline Smart Mode.
        setTimeout(() => {
          if (active) {
            startLiveSession().catch((err) => {
              console.warn("Failed to establish live session, falling back to offline mode:", err);
              switchToOfflineMode();
            });
          }
        }, 1500);
      } catch (err: any) {
        console.warn("Call setup failed (switching to Offline Smart Mode):", err);
        switchToOfflineMode();
      }
    };

    const startLiveSession = async () => {
      if (statusRef.current === 'ended' || !active) return;

      try {
        if (!chatService) {
          throw new Error("Chat service is not available");
        }

        console.log("Attempting to connect to Gemini Live via secure backend WS relay...");
        
        // Ensure AudioContext is initialized and resumed
        if (!audioContextRef.current) {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            audioContextRef.current = new AudioCtxClass();
          }
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const callbacks = {
          onopen: (session: any) => {
            if (statusRef.current === 'ended' || !active) {
              try { session.close(); } catch(e){}
              return;
            }

            console.log("Gemini Live: Connected successfully!");
            liveSessionRetryCountRef.current = 0; // reset retry count
            setIsOfflineMode(false);
            stopRingingImmediately();
            setIsRinging(false);
            setStatus('connected');
            statusRef.current = 'connected';
            
            // Clear any active offline speech recognition to prevent collision
            if (recognitionRef.current) {
              try {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
              } catch (e) {}
            }

            // Start client-side mic capture for live streaming
            startAudioCapture().catch(err => {
              console.error("Live session microphone capture failed:", err);
            });

            // Set up a browser-side ping heartbeat (every 15 seconds) to keep the WS connection alive
            if (liveSessionPingIntervalRef.current) {
              clearInterval(liveSessionPingIntervalRef.current);
            }
            liveSessionPingIntervalRef.current = setInterval(() => {
              if (sessionRef.current && typeof sessionRef.current.sendRealtimeInput === 'function') {
                try {
                  if (sessionRef.current.ws && sessionRef.current.ws.readyState === WebSocket.OPEN) {
                    sessionRef.current.ws.send(JSON.stringify({ type: "ping" }));
                  }
                } catch (e) {
                  console.warn("Failed sending WS keepalive ping:", e);
                }
              }
            }, 15000);
          },
          onmessage: (msg: any) => {
            if (statusRef.current !== 'connected' || !active) return;

            // 1. Handle user barge-in / interruption signal
            if (msg.serverContent?.interrupted) {
              console.log("Gemini Live: Received interruption signal from server");
              audioQueueRef.current = [];
              nextStartTimeRef.current = 0;
              setIsAiResponding(false);
              if (activeSourceRef.current) {
                try {
                  activeSourceRef.current.stop();
                } catch (e) {}
                activeSourceRef.current = null;
              }
              return;
            }

            // 2. Handle audio data chunks (PCM 24kHz)
            const audioChunk = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioChunk) {
              try {
                const raw = atob(audioChunk);
                const array = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) {
                  array[i] = raw.charCodeAt(i);
                }
                const pcmData = new Int16Array(array.buffer);
                audioQueueRef.current.push(pcmData);
                schedulePlayback();
              } catch (err) {
                console.error("Gemini Live: Failed to decode or queue PCM audio chunk:", err);
              }
            }

            // 3. Handle model Turn text transcription
            const textChunk = msg.serverContent?.modelTurn?.parts?.[0]?.text;
            if (textChunk) {
              setAiTranscript(prev => prev + textChunk);
            }
          },
          onerror: (err: any) => {
            console.error("Gemini Live Session Error:", err);
            handleLiveSessionFailure();
          },
          onclose: () => {
            console.log("Gemini Live: Session closed");
            handleLiveSessionFailure();
          }
        };

        const session = await chatService.connectLive(callbacks, messages);
        sessionRef.current = session;
        (window as any).globalActiveVoiceSession = session;

      } catch (err) {
        console.error("Failed starting live session:", err);
        handleLiveSessionFailure();
      }
    };

    const handleLiveSessionFailure = () => {
      if (statusRef.current === 'ended' || !active) return;

      if (liveSessionRetryCountRef.current < 2) {
        liveSessionRetryCountRef.current++;
        const delay = liveSessionRetryCountRef.current * 1500;
        console.warn(`Gemini Live: Connection failed or closed. Retrying connection in ${delay}ms (Attempt ${liveSessionRetryCountRef.current}/2)...`);
        
        if (liveSessionPingIntervalRef.current) {
          clearInterval(liveSessionPingIntervalRef.current);
          liveSessionPingIntervalRef.current = null;
        }
        if (sessionRef.current) {
          try { sessionRef.current.close(); } catch(e){}
          sessionRef.current = null;
        }

        setTimeout(() => {
          if (active) {
            startLiveSession().catch(() => {
              switchToOfflineMode();
            });
          }
        }, delay);
      } else {
        console.warn("Gemini Live: Maximum retries reached. Switching to ultra-stable Offline Smart Mode...");
        switchToOfflineMode();
      }
    };

    const switchToOfflineMode = async () => {
      if (statusRef.current === 'ended' || (window as any).voiceOfflineActive) return;
      (window as any).voiceOfflineActive = true;
      setIsOfflineMode(true);
      stopRingingImmediately();
      setIsRinging(false);
      setStatus('connected');
      statusRef.current = 'connected'; // Set immediately to prevent race conditions!
      
      // Start microphone audio capture in background so it does not block the initial greeting
      startAudioCapture().catch(err => {
        console.warn("Failed to capture microphone stream during call setup, continuing gracefully:", err);
      });
      
      // If video call was requested, start the camera right when connected!
      if (initialIsVideo) {
        startVideo('user');
      }
      
      window.postMessage({ 
        type: 'DIAGNOSTIC_WARN', 
        message: activeLang === 'fa' ? `فعالسازی سوئیچ خودکار تماس صوتی هوشمند... 📡` : (activeLang === 'ar' ? 'تنشيط التبديل التلقائي للمكالمات الصوتية الذكية... 📡' : (activeLang === 'es' ? 'Activando el interruptor automático de llamada de voz inteligente... 📡' : 'Activating Smart Voice Call Auto-switch... 📡'))
      }, '*');

      setTimeout(async () => {
        if (statusRef.current === 'connected') {
          let greet = "";
          const pRole = chatService?.profile?.role || "";
          const customLabel = chatService?.profile?.customRoleLabel || "";
          const isPartner = name.includes('دخترخاله') || name.includes('مریم') || name.includes('سارا') || name.includes('نفس') || name.includes('الناز') || name.includes('عشق') || (pRole as string) === 'girlfriend' || (pRole as string) === 'boyfriend' || pRole === 'Partner';
          const isDoctor = pRole === 'Doctor' || customLabel.includes('دکتر') || name.includes('دکتر');
          const isPsychologist = pRole === 'Psychologist' || customLabel.includes('روانشناس');
          const isLawyer = pRole === 'Lawyer' || customLabel.includes('وکیل');
          const isEnglishTeacher = pRole === 'EnglishTeacher' || customLabel.includes('زبان') || customLabel.includes('Teacher');
          const isChef = pRole === 'Chef' || customLabel.includes('آشپز');

          if (activeLang === 'fa') {
            if (isPartner) {
              greet = `سلام عشق من! من اینجام. قربون صدات برم، چقدر دلم تنگ شده بود برات... حالت چطوره عزیزم؟ 😍`;
            } else if (isDoctor) {
              greet = `سلام عزیزم. من اینجام، خوشحالم تماس گرفتی. مشکلی پیش اومده؟ حالت چطوره؟ 🩺`;
            } else if (isPsychologist) {
              greet = `سلام عزیزم. من اینجام، با خیال راحت و صبوری کامل بهت گوش میدم. حالت چطوره؟ آرومی؟ 🤍`;
            } else if (isLawyer) {
              greet = `سلام عزیزم. امیدوارم حالت خوب باشه. برای مشاوره تماس گرفتی؟ در خدمتم، بگو جریان چیه. ⚖️`;
            } else if (isEnglishTeacher) {
              greet = `Hello dear! I am so happy you called. How are you doing today? Let's practice our English conversation! 🇬🇧`;
            } else if (isChef) {
              greet = `سلام عزیزم! به به، سرآشپز مخلص شماست. چه غذای خوشمزه‌ای قراره با هم بپزیم؟ 👨🏻‍🍳`;
            } else {
              greet = `سلام عزیزم! من ${name} هستم و خیلی خوشحالم که تماس گرفتی. حالت چطوره؟ 😊✨`;
            }
          } else if (activeLang === 'ar') {
            if (isPartner) {
              greet = `أهلاً يا حبيبي! أنا هنا. اشتقت لصوتك كثيراً... كيف حالك يا عزيزي؟ 😍`;
            } else if (isDoctor) {
              greet = `مرحباً يا عزيزي. أنا هنا، سعيد باتصالك. هل هناك خطب ما؟ كيف تشعر؟ 🩺`;
            } else if (isPsychologist) {
              greet = `مرحباً يا عزيزي. أنا هنا، أصغي إليك بكل صبر. كيف حالك؟ 🤍`;
            } else if (isLawyer) {
              greet = `مرحباً يا عزيزي. أرجو أن تكون بخير. هل تتصل للاستشارة؟ أنا في الخدمة، قل لي ماذا هناك. ⚖️`;
            } else if (isEnglishTeacher) {
              greet = `Hello dear! I am so happy you called. How are you doing today? Let's practice our English conversation! 🇬🇧`;
            } else if (isChef) {
              greet = `أهلاً يا عزيزي! واو، الشيف في خدمتك. ما هو الطعام اللذيذ الذي سنطهوه معاً؟ 👨🏻‍🍳`;
            } else {
              greet = `أهلاً يا عزيزي! أنا ${name} وسعيد جداً باتصالك. كيف حالك؟ 😊✨`;
            }
          } else if (activeLang === 'es') {
            if (isPartner) {
              greet = `¡Hola mi amor! Estoy aquí. Extrañaba mucho tu voz... ¿Cómo estás cariño? 😍`;
            } else if (isDoctor) {
              greet = `Hola querido. Estoy aquí, me alegra que hayas llamado. ¿Pasa algo? ¿Cómo te sientes? 🩺`;
            } else if (isPsychologist) {
              greet = `Hola querido. Estoy aquí, te escucho con total paciencia. ¿Cómo estás? 🤍`;
            } else if (isLawyer) {
              greet = `Hola querido. Espero que estés bien. ¿Llamas por una consulta? Estoy a tu servicio, dime qué pasa. ⚖️`;
            } else if (isEnglishTeacher) {
              greet = `Hello dear! I am so happy you called. How are you doing today? Let's practice our English conversation! 🇬🇧`;
            } else if (isChef) {
              greet = `¡Hola querido! Vaya, el chef está a tu servicio. ¿Qué comida deliciosa vamos a cocinar juntos? 👨🏻‍🍳`;
            } else {
              greet = `¡Hola querido! Soy ${name} y me alegra mucho que hayas llamado. ¿Cómo estás? 😊✨`;
            }
          } else {
            if (isPartner) {
              greet = `Hello my love! I'm here. I missed your voice so much... How are you doing sweetheart? 😍`;
            } else if (isDoctor) {
              greet = `Hello dear. I'm here, glad you called. Is something wrong? How are you feeling? 🩺`;
            } else if (isPsychologist) {
              greet = `Hello dear. I'm here, I'm listening to you with full patience. How are you doing? 🤍`;
            } else if (isLawyer) {
              greet = `Hello dear. I hope you are well. Are you calling for a consultation? I'm at your service, tell me what's on your mind. ⚖️`;
            } else if (isEnglishTeacher) {
              greet = `Hello dear! I am so happy you called. How are you doing today? Let's practice our English conversation! 🇬🇧`;
            } else if (isChef) {
              greet = `Hello dear! Wow, the chef is at your service. What delicious food are we going to cook together? 👨🏻‍🍳`;
            } else {
              greet = `Hello dear! I am ${name} and I am so glad you called. How are you doing? 😊✨`;
            }
          }
          
          setAiTranscript(greet);
          setIsAiResponding(true);
          enqueueTts(greet);
          startOfflineSpeechRecognition();
        }
      }, 300);
    };

    initCall();
    return () => {
      active = false;
      (window as any).activeVoiceSessions = Math.max(0, ((window as any).activeVoiceSessions || 1) - 1);
      cleanup();
    };
  }, []);

  const handleInteraction = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const triggerGreeting = async () => {
    handleInteraction();
    if (statusRef.current !== 'connected') return;
    
    setIsAiResponding(true);
    let promptText = "";
    if (activeLang === 'fa') {
      promptText = "عزیزم؟ کجایی؟ چرا صحبت نمی‌کنی؟ دلم می‌خواد صداتو بشنوم، صحبت کن.";
    } else if (activeLang === 'ar') {
      promptText = "حبيبي؟ أين أنت؟ لماذا لا تتحدث؟ أريد أن أسمع صوتك، أرجوك تحدث.";
    } else if (activeLang === 'es') {
      promptText = "¿Cariño? ¿Dónde estás? ¿Por qué no hablas? Quiero escuchar tu voz, por favor habla.";
    } else {
      promptText = "Sweetheart? Where are you? Why aren't you speaking? I want to hear your voice, please talk.";
    }

    try {
      if (sessionRef.current && typeof sessionRef.current.sendRealtimeInput === 'function') {
        console.log("Triggering proactive greeting/wake-up text prompt...");
        sessionRef.current.sendRealtimeInput({
          text: promptText
        });
      } else {
        console.log("Triggering proactive greeting in offline mode...");
        const response = await chatService?.sendMessage(promptText);
        const cleanedReply = response ? cleanFarsiBreastWords(response.text) : "";
        if (cleanedReply) {
          setAiTranscript(cleanedReply);
          enqueueTts(cleanedReply);
        }
      }
    } catch (e) {
      console.error("Error sending proactive greeting:", e);
      setIsAiResponding(false);
    }
  };

  const triggerInactivityCheck = async () => {
    handleInteraction();
    if (statusRef.current !== 'connected') return;
    
    setIsAiResponding(true);
    let promptText = "";
    if (activeLang === 'fa') {
      promptText = "عزیزم؟ چرا باهام صحبت نمی‌کنی؟ دلم برای شنیدن صدات تنگ شده، اتفاقی افتاده؟";
    } else if (activeLang === 'ar') {
      promptText = "حبيبي؟ لماذا لا تتحدث معي؟ اشتقت لسماع صوتك، هل حدث شيء؟";
    } else if (activeLang === 'es') {
      promptText = "¿Cariño? ¿Por qué no me hablas? Extraño escuchar tu voz, ¿pasó algo?";
    } else {
      promptText = "Sweetheart? Why aren't you talking to me? I miss hearing your voice, did something happen?";
    }

    try {
      if (sessionRef.current && typeof sessionRef.current.sendRealtimeInput === 'function') {
        console.log("Triggering 2-minute inactivity inquiry...");
        sessionRef.current.sendRealtimeInput({
          text: promptText
        });
      } else {
        console.log("Triggering 2-minute inactivity inquiry in offline mode...");
        const response = await chatService?.sendMessage(promptText);
        const cleanedReply = response ? cleanFarsiBreastWords(response.text) : "";
        if (cleanedReply) {
          setAiTranscript(cleanedReply);
          enqueueTts(cleanedReply);
        }
      }
    } catch (e) {
      console.error("Error sending inactivity check:", e);
      setIsAiResponding(false);
    }
  };

  const handleEndCall = () => {
    if (isRealUserCall) {
      endRealUserCall(roomId).catch(() => {});
    }
    isAiSpeakingRef.current = false;
    isUserSpeakingRef.current = false;
    isListeningActiveRef.current = false;
    silenceStartTimeRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch(e){}
    }
    if (proactiveTimerRef.current) clearInterval(proactiveTimerRef.current);
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    (window as any).voiceOfflineActive = false;
    cleanup();
    setStatus('ended');
    onEndCall(timer, isUserVideoOn || isVideoOn);
  };

  const getCallTranslations = () => {
    switch (activeLang) {
      case 'fa':
        return {
          connecting: `در حال تماس با ${name}...`,
          ringing: "در حال زنگ خوردن...",
          connected: "در حال مکالمه",
          listening: "در حال شنیدن...",
          speaking: "در حال صحبت...",
          mute: "بی‌صدا",
          unmute: "با‌صدا",
          speaker: "بلندگو",
          camera: "دوربین",
          darken: "خاموشی صفحه",
          endCall: "قطع تماس",
          switchCamera: "چرخش دوربین",
          secureSession: "اتصال رمزگذاری شده امن",
          proximityTip: "صفحه به صورت خودکار خاموش شده است.\nبرای روشن شدن صفحه ضربه بزنید یا گوشی را فاصله دهید."
        };
      case 'ar':
        return {
          connecting: `جاري الاتصال بـ ${name}...`,
          ringing: "جاري الرنين...",
          connected: "في مكالمة",
          listening: "يستمع إليك...",
          speaking: "يتحدث الآن...",
          mute: "كتم",
          unmute: "إلغاء الكتم",
          speaker: "مكبر الصوت",
          camera: "الكاميرا",
          darken: "إطفاء الشاشة",
          endCall: "قطع الاتصال",
          switchCamera: "تبديل الكاميرا",
          secureSession: "جلسة اتصال آمنة ومفرغة",
          proximityTip: "تم إطفاء الشاشة تلقائيًا للمكالمة الصوتية.\nاضغط على الشاشة أو أبعد الهاتف لإعادة تشغيلها."
        };
      case 'es':
        return {
          connecting: `Llamando a ${name}...`,
          ringing: "Llamando...",
          connected: "En llamada",
          listening: "Escuchando su voz...",
          speaking: "Hablando...",
          mute: "Silenciar",
          unmute: "Activar voz",
          speaker: "Altavoz",
          camera: "Cámara",
          darken: "Apagar pantalla",
          endCall: "Colgar",
          switchCamera: "Girar cámara",
          secureSession: "Sesión Segura En Vivo",
          proximityTip: "La pantalla se ha apagado automáticamente para la llamada de voz.\nToque la pantalla o aleje el teléfono para encenderla."
        };
      default: // 'en'
        return {
          connecting: `Calling ${name}...`,
          ringing: "Ringing...",
          connected: "On Call",
          listening: "Listening to your voice...",
          speaking: "Speaking...",
          mute: "Mute",
          unmute: "Unmute",
          speaker: "Speaker",
          camera: "Camera",
          darken: "Screen Off",
          endCall: "End Call",
          switchCamera: "Switch Camera",
          secureSession: "Secure Live Session",
          proximityTip: "The screen has automatically turned off for safety.\nTap the screen or pull the phone away to turn it back on."
        };
    }
  };

  const callT = getCallTranslations();

  return (
    <div 
      onMouseDown={handleProximityTouchStart}
      onMouseUp={handleProximityTouchEnd}
      onTouchStart={handleProximityTouchStart}
      onTouchEnd={handleProximityTouchEnd}
      className="absolute inset-0 z-[100] bg-[#0d0f14] text-white overflow-hidden animate-in fade-in duration-500 select-none">
      
      {/* Real-time Proximity Blackout Overlay */}
      {isProximityDarkened && (
        <div 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsProximityDarkened(false); }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setIsProximityDarkened(false); }}
          className="absolute inset-0 z-[99999] bg-black flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 animate-in fade-in"
        >
          {/* Pitch black screen with very subtle, near-invisible hint to tap to wake */}
          <div className="text-white/[0.03] hover:text-white/10 text-[10px] text-center select-none max-w-xs px-6 whitespace-pre-line leading-relaxed font-sans transition-colors duration-300">
            {callT.proximityTip}
          </div>
        </div>
      )}

      {/* Telegram-style Blurred Avatar Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.25]">
        <img 
          src={profilePic} 
          alt="" 
          className="w-full h-full object-cover scale-[1.3] blur-[60px] filter saturate-150 brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0f14]/80 via-[#0d0f14]/50 to-[#0d0f14]"></div>
      </div>

      {/* Interactive Proximity Simulation Bar */}
      <div className="absolute inset-x-0 top-0 h-4 bg-transparent z-[150] cursor-pointer" onClick={() => setIsProximityDarkened(true)} title="Simulate lift to ear" />

      {/* User Video (Full screen backplate when active) */}
      {isUserVideoOn && !isRealUserCall && (
        <div className="absolute inset-0 z-0 bg-black">
          <video 
            ref={userVideoElementRef}
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover opacity-80 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
        </div>
      )}

      {isRealUserCall && isVideoOn && (
        <div className="absolute inset-0 z-0 bg-black">
          <video 
            ref={remoteVideoElementRef}
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
        </div>
      )}

      {/* Floating Small Windows at the top */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-50">
        {/* Connection status and timer */}
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'} animate-pulse`}></div>
          <span className="text-xs font-mono font-bold tracking-wider text-white/90">
            {status === 'connecting' ? callT.connecting : formatTime(timer)}
          </span>
        </div>

        {/* Floating Mini Video / Avatar for Self/AI */}
        {isUserVideoOn && (
          <div className="w-24 h-32 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-800 relative group transition-transform duration-300 hover:scale-105">
            {isRealUserCall ? (
              <video 
                ref={userVideoElementRef}
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <img src={profilePic} alt={name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
              <span className="text-[10px] font-bold text-white leading-none truncate">{name}</span>
              <span className="text-[7.5px] text-green-400 font-semibold mt-1 truncate">{callT.listening}</span>
            </div>
            {isAiResponding && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"></div>
            )}
          </div>
        )}
      </div>

      {/* Central Content Area (Avatar / Camera plate) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 pointer-events-none">
        {!isUserVideoOn && (
          <div className="flex flex-col items-center gap-6 mt-[-60px]">
            {/* Pulsing Avatar Container */}
            <div className="relative pointer-events-auto">
              {status === 'connected' && (
                <>
                  <div className="absolute inset-[-12px] rounded-full bg-blue-500/5 animate-ping duration-[3000ms]"></div>
                  <div className="absolute inset-[-24px] rounded-full border border-blue-500/10 animate-pulse duration-[2000ms]"></div>
                  {isAiResponding && (
                    <div className="absolute inset-[-6px] rounded-full border-2 border-blue-400/30 animate-pulse duration-1000"></div>
                  )}
                </>
              )}
              <div className="w-36 h-36 rounded-full overflow-hidden border-[6px] border-white/5 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative">
                <img src={profilePic} alt={name} className="w-full h-full object-cover select-none" />
                {status === 'connected' && !isMuted && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-green-500/20 transition-all duration-75"
                    style={{ height: `${Math.min(100, micLevel * 2.5)}%` }}
                  ></div>
                )}
              </div>
            </div>

            {/* AI Name and Status Text */}
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white drop-shadow-md select-none">{name}</h2>
              <div className="h-6 flex items-center justify-center">
                {status === 'connecting' ? (
                  <p className="text-blue-300 text-sm font-medium animate-pulse">{callT.connecting}</p>
                ) : status === 'connected' && !isMuted && micLevel > 2 ? (
                  <p className="text-green-400 text-xs animate-pulse font-bold tracking-wide">{callT.listening}</p>
                ) : status === 'connected' && isAiResponding ? (
                  <p className="text-blue-400 text-xs animate-pulse font-bold tracking-wide">{callT.speaking}</p>
                ) : (
                  <p className="text-slate-400/80 text-xs font-semibold tracking-wider">{callT.connected}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Panel (Telegram Styling) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/80 to-transparent pt-6 pb-6 px-4 flex flex-col items-center gap-4 sm:gap-6">
        
        {/* Row of Action Buttons */}
        <div className="grid grid-cols-4 gap-4 sm:gap-6 w-full max-w-xs justify-items-center">
          
          {/* Mute Button */}
          <div className="flex flex-col items-center gap-1.5 select-none">
            <button 
              onClick={() => { handleInteraction(); setIsMuted(!isMuted); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                isMuted 
                ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 border-2 border-white/10 text-white/90 hover:bg-white/20'
              }`}
              title={isMuted ? callT.unmute : callT.mute}
            >
              <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i>
            </button>
            <span className="text-[10px] font-bold text-gray-400 tracking-tight">{isMuted ? callT.unmute : callT.mute}</span>
          </div>

          {/* Speaker Button */}
          <div className="flex flex-col items-center gap-1.5 select-none">
            <button 
              onClick={() => { handleInteraction(); setIsSpeakerOn(!isSpeakerOn); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                isSpeakerOn 
                ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/30' 
                : 'bg-white/10 border-2 border-white/10 text-white/90 hover:bg-white/20'
              }`}
              title={callT.speaker}
            >
              <i className={`fas ${isSpeakerOn ? 'fa-volume-up' : 'fa-volume-down'} text-lg`}></i>
            </button>
            <span className="text-[10px] font-bold text-gray-400 tracking-tight">{callT.speaker}</span>
          </div>

          {/* Camera Button */}
          <div className="flex flex-col items-center gap-1.5 select-none">
            <button 
              onClick={() => { handleInteraction(); handleToggleVideo(); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                isUserVideoOn 
                ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/30' 
                : 'bg-white/10 border-2 border-white/10 text-white/90 hover:bg-white/20'
              }`}
              title={callT.camera}
            >
              <i className={`fas ${isUserVideoOn ? 'fa-video' : 'fa-video-slash'} text-lg`}></i>
            </button>
            <span className="text-[10px] font-bold text-gray-400 tracking-tight">{callT.camera}</span>
          </div>

          {/* Darken/Turn off Screen Button */}
          <div className="flex flex-col items-center gap-1.5 select-none">
            <button 
              onClick={() => { handleInteraction(); setIsProximityDarkened(true); }}
              className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer"
              title={callT.darken}
            >
              <i className="fas fa-eye-slash text-lg"></i>
            </button>
            <span className="text-[10px] font-bold text-gray-400 tracking-tight">{callT.darken}</span>
          </div>

        </div>

        {/* Switch Camera Button & End Call row */}
        <div className="flex flex-col items-center gap-2.5 sm:gap-4 w-full max-w-xs">
          {/* Switch Camera Button (Only if video is on) */}
          {isUserVideoOn && (
            <button 
              onClick={() => { handleInteraction(); handleSwitchCamera(); }}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center gap-2 text-xs font-bold text-white transition-all duration-200 animate-in slide-in-from-bottom-2 cursor-pointer"
            >
              <i className="fas fa-sync-alt"></i>
              <span>{callT.switchCamera}</span>
            </button>
          )}

          {/* Large Red End Call Button sits below controls in typical Telegram fashion */}
          <button 
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all duration-300 border border-red-500/40 cursor-pointer animate-pulse"
            title={callT.endCall}
          >
            <i className="fas fa-phone text-2xl text-white transform rotate-[135deg]"></i>
          </button>
        </div>

        {/* Secure note */}
        <div className="flex items-center gap-1.5 opacity-40 text-[9px] tracking-widest uppercase font-bold text-gray-400 select-none">
          <i className="fas fa-lock text-[8px]"></i>
          <span>{callT.secureSession}</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;
