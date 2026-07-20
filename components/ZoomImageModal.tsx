import React from 'react';

interface ZoomImageModalProps {
  zoomedImageUrl: string | null;
  setZoomedImageUrl: (url: string | null) => void;
}

export const ZoomImageModal: React.FC<ZoomImageModalProps> = ({
  zoomedImageUrl,
  setZoomedImageUrl,
}) => {
  if (!zoomedImageUrl) return null;

  return (
    <div 
      id="zoomed-image-overlay"
      className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200 cursor-zoom-out"
      onClick={() => setZoomedImageUrl(null)}
    >
      {/* Top Bar */}
      <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-10" onClick={e => e.stopPropagation()}>
        <button 
          id="btn-close-zoom"
          type="button"
          onClick={() => setZoomedImageUrl(null)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
        <a 
          id="btn-download-zoom"
          href={zoomedImageUrl} 
          download="profile_picture.jpg"
          target="_blank"
          rel="noreferrer"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <i className="fas fa-download text-base"></i>
        </a>
      </div>

      {/* Main Image Container */}
      <div className="relative max-w-full max-h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img 
          src={zoomedImageUrl} 
          alt="Zoomed" 
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
        />
      </div>
    </div>
  );
};
