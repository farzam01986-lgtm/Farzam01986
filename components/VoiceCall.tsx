
import React, { useEffect, useRef, useState } from 'react';
import { AIChatService } from '../geminiService';

interface VoiceCallProps {
  name: string;
  profilePic: string;
  chatService: AIChatService;
  onEndCall: () => void;
}

const VoiceCall: React.FC<VoiceCallProps> = ({ name, profilePic, chatService, onEndCall }) => {
  // Add global for mic check
  useEffect(() => {
    (window as any).lastMicCheck = Date.now();
  }, []);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isUserVideoOn, setIsUserVideoOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRinging, setIsRinging] = useState(true);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [micLevel, setMicLevel] = useState(0);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const proactiveTimerRef = useRef<any>(null);
  const retryCaptureRef = useRef<number>(0);
  
  const statusRef = useRef(status);
  const isMutedRef = useRef(isMuted);
  const isAiRespondingRef = useRef(isAiResponding);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isAiRespondingRef.current = isAiResponding; }, [isAiResponding]);
  
  const sessionRef = useRef<any>(null);
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
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
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
  };

  const schedulePlayback = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Schedule as many chunks as possible from the queue
    while (audioQueueRef.current.length > 0) {
      isProcessingQueueRef.current = true;
      setIsAiResponding(true);
      
      const pcmData = audioQueueRef.current.shift()!;
      
      // Gemini sends 24kHz audio
      const buffer = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      activeSourceRef.current = source;
      
      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.connect(ctx.destination);
      }
      
      gainNodeRef.current.gain.value = isSpeakerOn ? 1.0 : 0.0;
      source.connect(gainNodeRef.current);

      const currentTime = ctx.currentTime;
      
      // If the scheduled time is too far in the past or too far in the future, reset it
      // We use a 0.2s initial buffer for better stability
      if (nextStartTimeRef.current < currentTime || nextStartTimeRef.current > currentTime + 1.5) {
        nextStartTimeRef.current = currentTime + 0.2;
      }
      
      const startTime = Math.max(currentTime + 0.05, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      // When the last scheduled buffer ends, we check if there's more
      source.onended = () => {
        if (audioQueueRef.current.length === 0) {
          // Only stop responding state if no more audio is coming
          // We add a small delay to keep the UI stable
          setTimeout(() => {
            if (audioQueueRef.current.length === 0) {
              isProcessingQueueRef.current = false;
              setIsAiResponding(false);
            }
          }, 500);
        } else {
          schedulePlayback();
        }
      };
    }
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
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      
      const ctx = audioContextRef.current;
      console.log("AudioContext Sample Rate:", ctx.sampleRate);
      
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
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
          
          // Check if we have actual audio signal
          let hasSignal = false;
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const sample = inputData[i];
            // Even lower threshold for signal detection
            if (Math.abs(sample) > 0.002) hasSignal = true;
            // Boost input gain by 4.0x for even better hearing
            pcmData[i] = Math.max(-1, Math.min(1, sample * 4.0)) * 0x7FFF;
          }
          
          if (hasSignal) {
            (window as any).lastMicCheck = Date.now();
            if (Math.random() < 0.05) console.log("Mic signal detected and sending...");
          }

          const uint8 = new Uint8Array(pcmData.buffer);
          
          try {
            if (sessionRef.current && sessionRef.current.sendRealtimeInput) {
              sessionRef.current.sendRealtimeInput({
                media: { data: btoa(String.fromCharCode(...uint8)), mimeType: 'audio/pcm;rate=16000' }
              });
            }
          } catch (sendErr) {
            console.error("Error sending audio to Gemini:", sendErr);
          }
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(ctx.destination);
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
    if (!userVideoElementRef.current || !sessionRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const video = userVideoElementRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to a reasonable small size for the API
    const width = 320;
    const height = (video.videoHeight / video.videoWidth) * width;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to base64 jpeg
    const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

    try {
      if (sessionRef.current && sessionRef.current.sendRealtimeInput) {
        sessionRef.current.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'image/jpeg' }
        });
        console.log("Sent video frame to Gemini (facingMode:", facingMode, ")");
      }
    } catch (err) {
      console.error("Error sending video frame:", err);
    }
  };

  useEffect(() => {
    const initCall = async () => {
      try {
        // Initialize AudioContext with 16kHz for better compatibility with Live API input
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        playRingingSound();

        const session = await chatService.connectLive({
          onopen: () => {
            stopRingingImmediately();
            setIsRinging(false);
            setStatus('connected');
            startAudioCapture();
            
            // Proactive AI: If user is silent, AI should still talk occasionally
            if (proactiveTimerRef.current) clearInterval(proactiveTimerRef.current);
            proactiveTimerRef.current = setInterval(() => {
              // Use refs to check current state inside the interval
              if (statusRef.current === 'connected' && !isAiRespondingRef.current && !isMutedRef.current) {
                console.log("Proactive AI heartbeat...");
                triggerGreeting();
              }
            }, 12000); // Every 12 seconds of silence
            
            // Trigger initial greeting by sending a small silent chunk after a short delay
            setTimeout(() => {
              if (sessionRef.current && statusRef.current === 'connected') {
                console.log("Sending initial wake-up signal...");
                // Send a slightly longer buffer to ensure VAD triggers
                const silentPCM = new Int16Array(2048);
                // Add a tiny bit of noise to help VAD
                for(let i=0; i<silentPCM.length; i++) silentPCM[i] = (Math.random() - 0.5) * 10;
                
                const uint8 = new Uint8Array(silentPCM.buffer);
                sessionRef.current.sendRealtimeInput({
                  media: { data: btoa(String.fromCharCode(...uint8)), mimeType: 'audio/pcm;rate=16000' }
                });
              }
            }, 1000);
          },
          onmessage: (message: any) => {
            console.log("Live API Message:", message);
            
            // 1. Handle Audio Data
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              
              // If the queue was empty, wait for a few more chunks before starting playback
              // to build a small buffer and prevent choppiness
              // Increased to 6 chunks for a more solid buffer
              if (audioQueueRef.current.length >= 6 && !isProcessingQueueRef.current) {
                schedulePlayback();
              }
            }

            // 2. Handle AI Text Output (Transcription of what AI is saying)
            const aiText = message.serverContent?.modelTurn?.parts?.[0]?.text || 
                           message.outputAudioTranscription?.text;
            if (aiText) {
              console.log("AI Text:", aiText);
              setAiTranscript(aiText); // Show only current sentence as subtitle
            }
            
            // 3. Handle User Text Input (Transcription of what user is saying)
            const userText = message.serverContent?.userTurn?.parts?.[0]?.text || 
                             message.inputAudioTranscription?.text;
            
            if (userText) {
              console.log("User Text:", userText);
              setUserTranscript(userText);
            }

            // 4. Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupted!");
              if (activeSourceRef.current) {
                try { activeSourceRef.current.stop(); } catch(e) {}
                activeSourceRef.current = null;
              }
              audioQueueRef.current = [];
              nextStartTimeRef.current = 0;
              setAiTranscript("");
              setIsAiResponding(false);
            }
          },
          onclose: () => handleEndCall(),
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            handleEndCall();
          }
        });
        sessionRef.current = session;
      } catch (err) {
        console.error("Call setup failed:", err);
        onEndCall();
      }
    };

    initCall();
    return () => cleanup();
  }, []);

  const handleInteraction = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const triggerGreeting = () => {
    handleInteraction();
    if (sessionRef.current && statusRef.current === 'connected') {
      console.log("Triggering proactive greeting/wake-up...");
      // Send a burst of low-level noise to trigger AI response
      const silentPCM = new Int16Array(4096);
      for(let i=0; i<silentPCM.length; i++) {
        // Subtle noise burst
        silentPCM[i] = (Math.random() - 0.5) * 30;
      }
      const uint8 = new Uint8Array(silentPCM.buffer);
      sessionRef.current.sendRealtimeInput({
        media: { data: btoa(String.fromCharCode(...uint8)), mimeType: 'audio/pcm;rate=16000' }
      });
    }
  };

  const handleEndCall = () => {
    if (proactiveTimerRef.current) clearInterval(proactiveTimerRef.current);
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    cleanup();
    setStatus('ended');
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-between pt-12 pb-8 text-white animate-in fade-in duration-500">
      {/* User Video (Small Floating Window) */}
      {isUserVideoOn && (
        <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-50 bg-black animate-in zoom-in duration-300">
          <video 
            ref={userVideoElementRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
              <span className="text-[10px] font-medium text-white/80">شما</span>
            </div>
          )}
        </div>
      )}

      {/* Background Blur Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]"></div>
      </div>

      {/* User Video Window (Full Screen when active) */}
      {isUserVideoOn && (
        <div className="absolute inset-0 z-0 bg-black">
          <video 
            ref={userVideoElementRef}
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover opacity-100 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
        </div>
      )}

      {/* AI Avatar Window (Small floating window when video is on) */}
      {isUserVideoOn && (
        <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-50 bg-[#1e293b] animate-in zoom-in duration-300">
          <img src={profilePic} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
            <span className="text-[10px] font-bold text-white">{name}</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] text-white/70">در حال گوش دادن...</span>
            </div>
          </div>
          {/* Mic Level Overlay for AI Avatar */}
          {isAiResponding && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"></div>
          )}
        </div>
      )}

      <div className={`relative z-10 flex flex-col items-center w-full px-6 transition-all duration-500 ${isUserVideoOn ? 'hidden' : 'gap-6'}`}>
        {!isUserVideoOn && (
          <div className="relative">
            {/* Pulse Animation */}
            {status === 'connected' && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                <div className="absolute inset-[-10px] rounded-full border border-blue-500/30 animate-pulse"></div>
              </>
            )}
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#517da2] shadow-[0_0_50px_rgba(81,125,162,0.3)] relative z-10">
              <img src={profilePic} alt={name} className="w-full h-full object-cover" />
              {/* Mic Level Overlay */}
              {status === 'connected' && !isMuted && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-green-500/40 transition-all duration-75"
                  style={{ height: `${Math.min(100, micLevel * 2)}%` }}
                ></div>
              )}
            </div>
          </div>
        )}
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-2 drop-shadow-lg">{name}</h2>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? (micLevel > 5 ? 'bg-green-400 scale-125 shadow-[0_0_8px_#4ade80]' : 'bg-green-500') : 'bg-yellow-500'} transition-all duration-75`}></div>
            <p className="text-blue-200/70 font-medium text-lg drop-shadow-md">
              {status === 'connecting' ? 'در حال برقراری تماس...' : formatTime(timer)}
            </p>
          </div>
          <p className="text-[10px] text-blue-400/50 mt-1 uppercase tracking-widest">Live Session Active</p>
          {status === 'connected' && !isMuted && micLevel > 2 && (
            <p className="text-green-400 text-xs mt-1 animate-pulse font-medium">در حال شنیدن صدای شما...</p>
          )}
          {status === 'connected' && isAiResponding && (
            <p className="text-blue-400 text-xs mt-1 animate-pulse font-medium">در حال پاسخگویی...</p>
          )}
        </div>
      </div>

      {/* Transcriptions Display - Subtitles Style */}
      <div className={`relative z-20 w-full max-w-lg flex flex-col gap-2 transition-all duration-500 px-6 ${isUserVideoOn ? 'mt-auto mb-2' : 'mt-4'}`}>
        {aiTranscript && (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 text-center animate-in fade-in zoom-in duration-300 shadow-xl border border-white/10">
            <p className="text-base sm:text-lg text-white font-medium leading-relaxed drop-shadow-md">{aiTranscript}</p>
          </div>
        )}
        {userTranscript && !isUserVideoOn && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 self-end max-w-[90%] animate-in slide-in-from-right-4 duration-300 shadow-lg">
            <p className="text-sm text-white/90 leading-relaxed italic">«{userTranscript}»</p>
          </div>
        )}
      </div>

      <div className={`relative z-10 flex flex-col items-center w-full transition-all duration-500 ${isUserVideoOn ? 'gap-4 mb-6 mt-auto' : 'max-w-sm px-8 gap-8 mb-4'}`}>
        {/* Name and Timer at bottom for Video Mode */}
        {isUserVideoOn && (
          <div className="text-center mb-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-lg font-bold text-white drop-shadow-lg">{name}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-xs text-white/80 font-mono">{formatTime(timer)}</span>
            </div>
          </div>
        )}

        <div className={`flex items-center justify-center w-full ${isUserVideoOn ? 'gap-3 px-2' : 'justify-between gap-4'}`}>
          <button 
            onClick={() => { handleInteraction(); setIsMuted(!isMuted); }}
            className={`rounded-full flex items-center justify-center transition-all duration-300 ${isUserVideoOn ? 'w-11 h-11 text-lg' : 'w-16 h-16 text-2xl'} ${isMuted ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
          </button>
          
          <button 
            onClick={() => { handleInteraction(); setIsSpeakerOn(!isSpeakerOn); }}
            className={`rounded-full flex items-center justify-center transition-all duration-300 ${isUserVideoOn ? 'w-11 h-11 text-lg' : 'w-16 h-16 text-2xl'} ${isSpeakerOn ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
          >
            <i className={`fas ${isSpeakerOn ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
          </button>
          
          <button 
            onClick={() => { handleInteraction(); handleToggleVideo(); }}
            className={`rounded-full flex items-center justify-center transition-all duration-300 ${isUserVideoOn ? 'w-11 h-11 text-lg bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'w-16 h-16 text-2xl bg-white/10 hover:bg-white/20'}`}
            title={isUserVideoOn ? "قطع دوربین" : "وصل دوربین"}
          >
            <i className={`fas ${isUserVideoOn ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>

          {isUserVideoOn && (
            <button 
              onClick={() => { handleInteraction(); handleSwitchCamera(); }}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 text-lg"
              title="چرخش دوربین"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          )}

          {isUserVideoOn && (
            <button 
              onClick={handleEndCall}
              className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all active:scale-90"
            >
              <i className="fas fa-phone-slash text-lg transform rotate-[135deg]"></i>
            </button>
          )}
        </div>

        {status === 'connected' && !isUserVideoOn && (
          <button 
            onClick={triggerGreeting}
            className="px-6 py-2 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-500/50 rounded-full text-xs font-medium transition-all animate-pulse"
          >
            اگر هوش مصنوعی صحبت نمی‌کند، اینجا کلیک کنید
          </button>
        )}

        {!isUserVideoOn && (
          <button 
            onClick={handleEndCall}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all active:scale-90 group"
          >
            <i className="fas fa-phone-slash text-3xl transform rotate-[135deg] group-hover:scale-110 transition-transform"></i>
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2 opacity-40 text-xs tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <i className="fas fa-lock"></i>
          <span>End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;
