import React, { useState, useRef } from 'react';
import { 
  Share2, 
  MoreHorizontal, 
  Play, 
  Heart, 
  Check, 
  ExternalLink 
} from 'lucide-react';

export default function MediaCard({ 
  pin, 
  savedPinIds = [],
  onPinClick, 
  onToggleSave,
  onShare,
  onAuthorClick 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef(null);

  const isSaved = savedPinIds.includes(pin.id) || pin.saved;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (pin.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (pin.type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    onToggleSave(pin.id);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    onShare(pin);
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (onAuthorClick && pin.author) {
      onAuthorClick(pin.author);
    }
  };

  return (
    <div className="break-inside-avoid mb-6 group cursor-pointer">
      {/* Media Wrapper */}
      <div
        onClick={() => onPinClick(pin)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.15)] transition-all duration-300 transform group-hover:-translate-y-0.5"
      >
        {/* Video badge */}
        {pin.type === 'video' && (
          <div className="absolute top-3.5 left-3.5 z-20 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Play className="w-3 h-3 fill-current" />
            <span>Video</span>
          </div>
        )}

        {/* Media Player / Image */}
        {pin.type === 'video' ? (
          <div className="relative w-full overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={pin.mediaUrl}
              poster={pin.thumbnail}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-auto object-cover rounded-3xl transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-3xl min-h-[220px]" />
            )}
            <img
              src={pin.mediaUrl}
              alt={pin.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-auto object-cover rounded-3xl transition-all duration-700 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}

        {/* Hover Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 rounded-3xl transition-opacity duration-300 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Action Buttons overlay */}
        <div 
          className={`absolute inset-0 p-3 flex flex-col justify-between transition-opacity duration-200 z-20 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Row: Quick Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveClick}
              className={`px-4 py-2.5 rounded-full font-bold text-sm tracking-tight transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 ${
                isSaved
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-[#E60023] text-white hover:bg-[#ad081b]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardado</span>
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>

          {/* Bottom Row: Handle, Share & Options */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleAuthorClick}
              className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-semibold text-gray-800 flex items-center gap-1 hover:bg-white transition-colors shadow-sm max-w-[130px] truncate"
              title={`Ver perfil de ${pin.author?.name || 'creador'}`}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{pin.author?.handle || '@creador'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShareClick}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all hover:scale-110"
                title="Compartir"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pin Meta Information */}
      <div className="mt-2 px-1">
        <h3 className="font-semibold text-sm text-neutral-200 line-clamp-1 leading-snug group-hover:text-[#E60023] transition-colors">
          {pin.title}
        </h3>
        
        <div className="flex items-center justify-between mt-1 text-xs text-neutral-400">
          <div 
            onClick={handleAuthorClick}
            className="flex items-center gap-1.5 min-w-0 hover:text-white cursor-pointer group/author"
          >
            <img
              src={pin.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={pin.author?.name || 'Creador'}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
            <span className="truncate font-medium group-hover/author:underline">
              {pin.author?.name || 'Creador'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {pin.source_provider && pin.source_provider !== 'supabase' && (
              pin.source_provider === 'openverse' ? (
                <a 
                  href={pin.download_url || pin.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  title="Licencia CC - Ver original en Openverse"
                >
                  Openverse CC
                </a>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  {pin.source_provider}
                </span>
              )
            )}
            <div className="flex items-center gap-1 text-gray-400 font-medium">
              <Heart className="w-3.5 h-3.5 fill-gray-200 text-gray-400" />
              <span>{pin.likes > 1000 ? `${(pin.likes / 1000).toFixed(1)}k` : pin.likes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
