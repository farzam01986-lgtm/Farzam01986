
import React, { useState, useRef } from 'react';

interface InputAreaProps {
  onSend: (text: string, image?: string, audio?: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [showStickers, setShowStickers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (text.trim() || selectedImage) {
      onSend(text, selectedImage || undefined);
      setText('');
      setSelectedImage(null);
    }
  };

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
      // Stop all tracks
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
    <div className="flex flex-col z-20">
      {/* Camera Modal Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
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
          <p className="text-white/60 mt-4 text-sm font-light">عکس بگیر و بفرست 📸</p>
        </div>
      )}

      {selectedImage && (
        <div className="px-4 pb-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-lg" 
              alt="Preview" 
            />
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
                  // Faces & Emotions
                  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '👻', '💀', '☠️', '👽', '👾', '🤖', '💩',
                  // Love & Hearts
                  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💋', '🔥', '✨', '💢', '🔞', '🔞', '🔞',
                  // Body & Gestures
                  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄',
                  // Objects & Fun
                  '🍑', '🍆', '💦', '🍒', '🍓', '🥂', '🍷', '🥃', '🍸', '🍹', '🍺', '🍻', '🍾', '🍿', '🍫', '🍭', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍨', '🍧', '🍦', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄'
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
              <button 
                onClick={() => setShowStickers(false)}
                className="text-blue-500 text-xs font-bold hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white rounded-3xl flex items-center p-1 shadow-md border border-gray-200 overflow-hidden">
            {isRecording ? (
              <div className="flex-1 flex items-center px-4 py-2 gap-3 animate-in fade-in slide-in-from-left-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-mono text-sm flex-1">{formatTime(recordingTime)}</span>
                <button 
                  onClick={cancelRecording}
                  className="text-red-500 text-sm font-bold hover:bg-red-50/50 px-2 py-1 rounded-lg transition-colors"
                >
                  لغو
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setShowStickers(!showStickers)}
                  className={`p-2 transition-colors ${showStickers ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                >
                  <i className="far fa-smile text-xl"></i>
                </button>
                <textarea
                  rows={1}
                  value={text}
                  onChange={(e) => { setText(e.target.value); if(showStickers) setShowStickers(false); }}
                  onKeyDown={handleKeyDown}
                  placeholder="پیام"
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-1 text-gray-800 text-sm max-h-32 min-h-[40px] leading-tight"
                />
              <div className="flex items-center">
                <button 
                  onClick={() => startCamera()}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Camera"
                >
                  <i className="fas fa-camera text-xl"></i>
                </button>
                <button 
                  onClick={handleFileClick}
                  className={`p-2 transition-colors ${selectedImage ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                  title="Attach File"
                >
                  <i className="fas fa-paperclip text-xl"></i>
                </button>
              </div>
            </>
          )}
          <input 
            type="file" 
            hidden 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>
        
        {isRecording ? (
          <button 
            onClick={stopRecording}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-blue-500 text-white animate-pulse"
          >
            <i className="fas fa-paper-plane text-xl"></i>
          </button>
        ) : (
          <div className="flex gap-2">
            {(text.trim() || selectedImage) ? (
              <button 
                onClick={handleSend}
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-[#517da2] text-white transition-all active:scale-90"
              >
                <i className="fas fa-paper-plane text-xl"></i>
              </button>
            ) : (
              <button 
                onClick={startRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-white text-gray-400 hover:text-blue-500 transition-colors active:scale-90"
                title="Record Voice"
              >
                <i className="fas fa-microphone text-xl"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default InputArea;
