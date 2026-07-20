import React from 'react';
import { ChatProfile } from '../types';
import { acceptRealUserCall, declineRealUserCall } from '../firebaseService';

interface IncomingCallModalProps {
  incomingCallSession: any;
  profiles: ChatProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<ChatProfile[]>>;
  setCurrentProfileId: (id: string | null) => void;
  setIsVideoCall: (isVideo: boolean) => void;
  setIsCalling: (isCalling: boolean) => void;
  setShowIncomingCallModal: (show: boolean) => void;
  setIncomingCallSession: (session: any) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCallSession,
  profiles,
  setProfiles,
  setCurrentProfileId,
  setIsVideoCall,
  setIsCalling,
  setShowIncomingCallModal,
  setIncomingCallSession,
}) => {
  if (!incomingCallSession) return null;

  return (
    <div id="incoming-call-overlay" className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div id="incoming-call-container" className="bg-[#1c1c1e] text-white rounded-[40px] p-8 w-full max-w-[340px] shadow-2xl flex flex-col items-center border border-white/10">
        {/* Avatar container */}
        <div className="relative w-28 h-28 mb-6 rounded-full overflow-hidden border-4 border-emerald-500/30 flex items-center justify-center bg-gray-800 shadow-xl">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            alt="تماس‌گیرنده"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <h3 className="text-xl font-bold mb-2 tracking-tight">تماس امن دو نفره</h3>
        <span className="text-sm text-emerald-400 font-medium mb-8 flex items-center gap-1.5 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          در حال زنگ خوردن...
        </span>

        {/* Answer & Decline buttons */}
        <div className="flex gap-8 w-full justify-center">
          <button 
            id="btn-answer-call"
            type="button"
            onClick={async () => {
              const roomId = incomingCallSession.roomId;
              const callerProfile = profiles.find(p => p.realUser && p.theirUid === incomingCallSession.callerId);
              if (callerProfile) {
                setCurrentProfileId(callerProfile.id);
              } else {
                const tempProfile: ChatProfile = {
                  id: roomId,
                  name: "کاربر مسنجر",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  age: "نامعلوم",
                  realUser: true,
                  theirUid: incomingCallSession.callerId,
                  messages: [],
                  role: 'Custom',
                  customRoleLabel: 'کاربر واقعی'
                };
                setProfiles(prev => [tempProfile, ...prev]);
                setCurrentProfileId(tempProfile.id);
              }
              
              try {
                await acceptRealUserCall(roomId);
              } catch (err) {
                console.error("Accept call error:", err);
              }
              setIsVideoCall(incomingCallSession.isVideo || false);
              setIsCalling(true);
              setShowIncomingCallModal(false);
            }}
            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg hover:bg-emerald-600 transition duration-300 transform hover:scale-105 cursor-pointer"
          >
            <i className="fas fa-phone text-xl text-white"></i>
          </button>

          <button 
            id="btn-decline-call"
            type="button"
            onClick={async () => {
              try {
                await declineRealUserCall(incomingCallSession.roomId);
              } catch (err) {
                console.error("Decline call error:", err);
              }
              setShowIncomingCallModal(false);
              setIncomingCallSession(null);
            }}
            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition duration-300 transform hover:scale-105 cursor-pointer"
          >
            <i className="fas fa-phone-slash text-xl text-white transform rotate-[135deg]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
