import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface InputAreaProps {
  onSend: (text: string, image?: string, audio?: string, replyTo?: { id: string; text: string; senderName: string }) => void;
  replyingMessage: Message | null;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onUpdateMessage: (msgId: string, newText: string) => void;
  activeLang?: string;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSend,
  replyingMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onUpdateMessage,
  activeLang = 'fa'
}) => {
  const isRtl = activeLang === 'fa' || activeLang === 'ar';
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [showStickers, setShowStickers] = useState(false);
  
  // Voice Recording & Speech to Text (STT) States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSTTActive, setIsSTTActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync text with editing message
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (editingMessage) {
      if (text.trim()) {
        onUpdateMessage(editingMessage.id, text.trim());
      }
      return;
    }

    if (text.trim() || selectedImage) {
      const replyData = replyingMessage ? {
        id: replyingMessage.id,
        text: replyingMessage.text,
        senderName: replyingMessage.sender === 'user' ? 'شما' : (replyingMessage.senderName || 'مخاطب')
      } : undefined;

      onSend(text, selectedImage || undefined, undefined, replyData);
      setText('');
      setSelectedImage(null);
      if (replyingMessage) onCancelReply();
    }
  };

  // Speech to Text (STT) Speech recognition using Web Speech API
  const startSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("مرورگر شما از قابلیت تبدیل گفتار به نوشتار پشتیبانی نمی‌کند.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'fa-IR'; // Set Persian
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setIsSTTActive(true);
    };

    rec.onresult = (e: any) => {
      let finalStr = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalStr += e.results[i][0].transcript + ' ';
        }
      }
      if (finalStr) {
        setText(prev => (prev + finalStr).trim());
      }
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsSTTActive(false);
    };

    rec.onend = () => {
      setIsSTTActive(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSTT = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsSTTActive(false);
  };

  // Voice message recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onSend('', undefined, base64);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("دسترسی به میکروفون امکان‌پذیر نیست.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent sending
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setIsCameraOpen(true);
      setCameraFacingMode(mode);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsCameraOpen(false);
      alert("دسترسی به دوربین امکان‌پذیر نیست.");
    }
  };

  const toggleCamera = () => {
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        setSelectedImage(base64);
        stopCamera();
      }
    }
  };

  return (
    <div className="flex flex-col z-20" dir="rtl">
      {/* Camera Modal Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
              <button 
                onClick={stopCamera}
                className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
              
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 border-2 border-black/10 rounded-full"></div>
              </button>
              
              <button 
                onClick={toggleCamera}
                className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <i className="fas fa-sync text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote reply preview */}
      {replyingMessage && (
        <div className="px-4 py-2.5 bg-slate-100 border-t border-b border-slate-200/50 flex items-center justify-between text-[11px] font-black animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 border-r-2 border-blue-500 pr-2 text-right">
            <span className="text-blue-500 block shrink-0">پاسخ به {replyingMessage.sender === 'user' ? 'خودتان' : (replyingMessage.senderName || 'مخاطب')}:</span>
            <span className="text-gray-500 truncate max-w-[200px] font-normal">{replyingMessage.text}</span>
          </div>
          <button onClick={onCancelReply} className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-gray-500 flex items-center justify-center transition-all">
            <i className="fas fa-times text-[9px]"></i>
          </button>
        </div>
      )}

      {/* Edit message preview */}
      {editingMessage && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-b border-amber-200/40 flex items-center justify-between text-[11px] font-black animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 border-r-2 border-amber-500 pr-2 text-right">
            <span className="text-amber-600 block shrink-0">ویرایش پیام:</span>
            <span className="text-gray-500 truncate max-w-[200px] font-normal">{editingMessage.text}</span>
          </div>
          <button onClick={onCancelEdit} className="w-5 h-5 rounded-full bg-amber-200/50 hover:bg-amber-200 text-amber-700 flex items-center justify-center transition-all">
            <i className="fas fa-times text-[9px]"></i>
          </button>
        </div>
      )}

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 pb-2 animate-in fade-in slide-in-from-bottom-2 pt-2">
          <div className="relative inline-block">
            <img src={selectedImage} className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-lg" alt="Preview" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-transparent p-2 flex flex-col gap-2">
        {showStickers && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-0 shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden flex flex-col h-64">
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-6 gap-2">
                {[
                  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '😎', '🤩', '🥳', '😏', '😔', '🥺', '😢', '😭', '😡', '😱', '🤫', '🤔', '👍', '👎', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💋', '🔥', '✨'
                ].map((emoji, idx) => (
                  <button 
                    key={`${emoji}-${idx}`}
                    onClick={() => { setText(prev => prev + emoji); }}
                    className="text-2xl hover:bg-gray-100 rounded-lg transition-all p-2 flex items-center justify-center active:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-between items-center px-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Emoji Picker</span>
              <button onClick={() => setShowStickers(false)} className="text-blue-500 text-xs font-bold hover:bg-blue-50 px-2 py-1 rounded-md transition-colors">بستن</button>
            </div>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white rounded-3xl flex items-center p-1 shadow-md border border-gray-200 overflow-hidden">
            {isRecording ? (
              <div className="flex-1 flex items-center px-4 py-2 gap-3 animate-in fade-in slide-in-from-left-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-mono text-sm flex-1">{formatTime(recordingTime)}</span>
                <button onClick={cancelRecording} className="text-red-500 text-xs font-bold hover:bg-red-50/50 px-2.5 py-1.5 rounded-lg transition-colors">لغو</button>
              </div>
            ) : (
              <>
                 <textarea
                  rows={1}
                  value={text}
                  onChange={(e) => { setText(e.target.value); if(showStickers) setShowStickers(false); }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isSTTActive 
                      ? (isRtl ? "در حال گوش دادن به صدای شما..." : "Listening to your voice...") 
                      : (isRtl ? "پیام" : "Message")
                  }
                  className={`flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-1 text-gray-800 text-xs max-h-32 min-h-[40px] leading-tight ${
                    isSTTActive ? 'placeholder-blue-400 text-blue-600 font-bold' : ''
                  } ${isRtl ? 'text-right' : 'text-left'}`}
                />
                
                {/* Voice Typing & Attachment Controls */}
                <div className="flex items-center">
                  {/* Speech to Text Toggler */}
                  <button 
                    onClick={isSTTActive ? stopSTT : startSTT}
                    className={`p-2 transition-colors ${isSTTActive ? 'text-blue-500 animate-pulse' : 'text-gray-400 hover:text-blue-500'}`}
                    title={
                      isSTTActive 
                        ? (isRtl ? "توقف تایپ صوتی" : "Stop Voice Typing") 
                        : (isRtl ? "تایپ صوتی (تبدیل گفتار به متن)" : "Voice Typing (Speech-to-text)")
                    }
                  >
                    <i className="fas fa-keyboard text-lg"></i>
                  </button>
                  <button onClick={() => startCamera()} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title={isRtl ? "دوربین" : "Camera"}>
                    <i className="fas fa-camera text-lg"></i>
                  </button>
                  <button onClick={handleFileClick} className={`p-2 transition-colors ${selectedImage ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`} title={isRtl ? "پیوست فایل" : "Attach File"}>
                    <i className="fas fa-paperclip text-lg"></i>
                  </button>
                </div>
              </>
            )}
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
          </div>
          
          <div>
            {isRecording ? (
              <button onClick={stopRecording} className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-blue-500 text-white animate-pulse">
                <i className="fas fa-paper-plane text-base"></i>
              </button>
            ) : (
              <div className="flex gap-1.5">
                {(text.trim() || selectedImage) ? (
                  <button onClick={handleSend} className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-[#517da2] text-white transition-all active:scale-90">
                    <i className="fas fa-paper-plane text-base"></i>
                  </button>
                ) : (
                  <button onClick={startRecording} className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg bg-white text-gray-400 hover:text-blue-500 border border-gray-200 transition-colors active:scale-90" title="Record Voice">
                    <i className="fas fa-microphone text-base"></i>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
