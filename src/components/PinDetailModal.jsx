import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Share2, 
  Heart, 
  Check, 
  Send, 
  Bookmark, 
  ExternalLink,
  MessageSquare,
  Globe,
  UserCheck,
  UserPlus,
  Flag,
  FlipHorizontal,
  Contrast,
  Maximize2,
  Minimize2,
  Pipette,
  Copy,
  FolderPlus,
  ChevronDown
} from 'lucide-react';
import MediaCard from './MediaCard';
import { useAuth } from '../context/AuthContext';
import { sanitizeInput, validateSafeUrl } from '../utils/security';
import { renderWithMentions } from '../utils/mentions';
import { fetchUserBoards, createBoardInDb } from '../lib/supabaseClient';

export default function PinDetailModal({ 
  pin, 
  allPins, 
  savedPinIds, 
  likedPinIds, 
  onClose, 
  onToggleSave, 
  onToggleLike, 
  onAddComment, 
  onShare, 
  onSelectRelatedPin, 
  onOpenAuth, 
  onAuthorClick 
}) {
  const { user } = useAuth();
  const [commentInput, setCommentInput] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Contenido inapropiado');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Artist Reference Studio Tools State
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [extractedColors, setExtractedColors] = useState([]);
  const [colorToast, setColorToast] = useState('');
  const [directLinkToast, setDirectLinkToast] = useState(false);

  // Boards Dropdown State
  const [boards, setBoards] = useState([]);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const imageRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const boardMenuRef = useRef(null);

  const isSaved = savedPinIds.includes(pin.id) || pin.saved;
  const isLiked = likedPinIds.includes(pin.id);
  const currentLikes = (pin.likes || 0) + (isLiked && !pin.userLikedInitially ? 1 : 0) - (!isLiked && pin.userLikedInitially ? 1 : 0);

  // Load Boards when user is authenticated
  useEffect(() => {
    if (user?.id) {
      fetchUserBoards(user.id).then(userBoards => {
        setBoards(userBoards || []);
      }).catch(err => console.warn('Could not load boards:', err));
    }
  }, [user?.id]);

  // Close board dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (boardMenuRef.current && !boardMenuRef.current.contains(e.target)) {
        setShowBoardMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if following on mount
  useEffect(() => {
    async function checkFollow() {
      if (user && pin?.author?.id) {
        try {
          const { checkIsFollowingUser } = await import('../lib/supabaseClient');
          const following = await checkIsFollowingUser(user.id, pin.author.id);
          setIsFollowing(following);
        } catch (e) {
          console.error(e);
        }
      }
    }
    checkFollow();
  }, [user, pin?.author?.id]);

  // Artist Keyboard Shortcuts: F = Flip, B = Black & White, Escape = Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'Escape') {
        if (isFocusMode) {
          setIsFocusMode(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFlipped(prev => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setIsGrayscale(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFocusMode]);

  // Color Palette Extraction from Image
  const handleExtractColors = () => {
    if (!imageRef.current) return;
    try {
      const img = imageRef.current;
      const canvas = hiddenCanvasRef.current || document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.src = pin.mediaUrl;
      tempImg.onload = () => {
        ctx.drawImage(tempImg, 0, 0, 60, 60);
        const imgData = ctx.getImageData(0, 0, 60, 60).data;
        const colorSamples = [];
        
        // Sample points across image
        for (let i = 0; i < imgData.length; i += 4 * 70) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
          if (!colorSamples.includes(hex)) {
            colorSamples.push(hex);
          }
          if (colorSamples.length >= 5) break;
        }

        if (colorSamples.length === 0) {
          colorSamples.push('#1F2937', '#DC2626', '#E5E7EB', '#F59E0B', '#3B82F6');
        }
        setExtractedColors(colorSamples);
      };
      tempImg.onerror = () => {
        setExtractedColors(['#18181B', '#E11D48', '#FAFAFA', '#F59E0B', '#2563EB']);
      };
    } catch (e) {
      setExtractedColors(['#18181B', '#E11D48', '#FAFAFA', '#F59E0B', '#2563EB']);
    }
  };

  const handleCopyColorHex = (hex) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      setColorToast(`Color ${hex} copiado!`);
      setTimeout(() => setColorToast(''), 2000);
    }
  };

  const handleCopyDirectLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin.mediaUrl);
      setDirectLinkToast(true);
      setTimeout(() => setDirectLinkToast(false), 2000);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const cleanText = sanitizeInput(commentInput);
    if (!cleanText) return;

    if (!user) {
      onOpenAuth('login');
      return;
    }

    const newCommentObj = {
      pin_id: pin.id,
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Artista',
      author_avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`,
      text: cleanText,
      created_at: new Date().toISOString()
    };

    onAddComment(newCommentObj);
    setCommentInput('');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleLikeClick = () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    onToggleLike(pin.id);
  };

  const handleSaveToBoard = async (boardId = null) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    setShowBoardMenu(false);
    onToggleSave(pin.id, boardId);
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim() || !user?.id) return;
    setIsCreatingBoard(true);
    try {
      const created = await createBoardInDb(user.id, newBoardTitle.trim());
      if (created) {
        setBoards(prev => [created, ...prev]);
        setNewBoardTitle('');
        handleSaveToBoard(created.id);
      }
    } catch (err) {
      console.error('Error creating board:', err);
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (loadingFollow || !pin?.author?.id) return;
    
    setLoadingFollow(true);
    try {
      const { toggleFollowUser } = await import('../lib/supabaseClient');
      const nowFollowing = await toggleFollowUser(user.id, pin.author.id);
      setIsFollowing(nowFollowing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleAuthorClick = () => {
    if (onAuthorClick && pin.author) {
      onClose();
      onAuthorClick(pin.author);
    }
  };

  const safeDestinationUrl = pin.destinationUrl ? validateSafeUrl(pin.destinationUrl) : null;

  const relatedPins = allPins.filter(
    (p) => p.id !== pin.id && (p.category === pin.category || p.tags?.some(t => pin.tags?.includes(t)))
  ).slice(0, 8);

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex justify-center p-2 sm:p-4 md:p-6 lg:p-8 animate-fadeIn ${
      isFocusMode ? 'bg-neutral-950 p-0 sm:p-0 md:p-0 lg:p-0' : 'bg-black/80 backdrop-blur-md'
    }`}>
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Backdrop */}
      {!isFocusMode && <div className="fixed inset-0" onClick={onClose} />}

      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700 shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
        title="Cerrar visor (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Container */}
      <div className={`relative z-10 w-full transition-all duration-300 my-auto rounded-3xl overflow-hidden flex flex-col ${
        isFocusMode 
          ? 'max-w-none h-screen bg-neutral-950 rounded-none border-none' 
          : 'max-w-6xl bg-neutral-900 border border-neutral-800 shadow-2xl'
      }`}>
        
        {/* Main Grid */}
        <div className={`grid grid-cols-1 ${isFocusMode ? 'grid-cols-1 h-full' : 'md:grid-cols-12 min-h-[580px]'}`}>
          
          {/* Media View Column */}
          <div className={`${
            isFocusMode ? 'col-span-1 h-full' : 'md:col-span-7 lg:col-span-8'
          } bg-neutral-950 flex flex-col items-center justify-center relative p-2 sm:p-4 overflow-hidden select-none`}>
            
            {/* FLOATING ARTIST TOOLBOX */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 shadow-2xl">
              {/* Flip Horizontal */}
              <button
                onClick={() => setIsFlipped(prev => !prev)}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isFlipped 
                    ? 'bg-[#E60023] text-white shadow-md' 
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
                title="Efecto Espejo (Atajo: F) - Evaluar simetría y proporciones"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Espejo (F)</span>
              </button>

              {/* Grayscale Toggle */}
              <button
                onClick={() => setIsGrayscale(prev => !prev)}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isGrayscale 
                    ? 'bg-neutral-100 text-neutral-900 shadow-md font-black' 
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
                title="Valores en B&N (Atajo: B) - Verificar contrastes de luz y sombra"
              >
                <Contrast className="w-4 h-4" />
                <span className="hidden sm:inline">B&N (B)</span>
              </button>

              {/* Focus Mode */}
              <button
                onClick={() => setIsFocusMode(prev => !prev)}
                className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isFocusMode 
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-black' 
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
                title="Lienzo Limpio / Pantalla Completa"
              >
                {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFocusMode ? 'Salir' : 'Lienzo'}</span>
              </button>

              {/* Color Picker & Palette */}
              {pin.type !== 'video' && (
                <button
                  onClick={handleExtractColors}
                  className="p-2 rounded-xl text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all flex items-center gap-1.5"
                  title="Extraer paleta de colores del dibujo"
                >
                  <Pipette className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Paleta</span>
                </button>
              )}

              {/* Copy Direct Link */}
              <button
                onClick={handleCopyDirectLink}
                className="p-2 rounded-xl text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all flex items-center gap-1.5"
                title="Copiar enlace directo de imagen (Para PureRef / Photoshop)"
              >
                <Copy className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Copiar URL</span>
              </button>
            </div>

            {/* Extracted Color Palette Overlay */}
            {extractedColors.length > 0 && (
              <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 p-2 rounded-2xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 shadow-2xl animate-fadeIn">
                <span className="text-[11px] font-bold text-neutral-400 px-1">Colores:</span>
                {extractedColors.map((hex, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopyColorHex(hex)}
                    style={{ backgroundColor: hex }}
                    className="w-7 h-7 rounded-xl border border-white/20 shadow-sm transition-transform hover:scale-125 focus:outline-none"
                    title={`Copiar HEX: ${hex}`}
                  />
                ))}
              </div>
            )}

            {/* Direct Link Toast Notification */}
            {directLinkToast && (
              <div className="absolute top-16 left-4 z-40 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg animate-fadeIn flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>¡URL directa copiada! Lista para pegar en PureRef o Photoshop</span>
              </div>
            )}

            {/* Color Hex Toast */}
            {colorToast && (
              <div className="absolute bottom-16 left-4 z-40 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg animate-fadeIn flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{colorToast}</span>
              </div>
            )}

            {/* Media Canvas Element */}
            {pin.type === 'video' ? (
              <video
                src={pin.mediaUrl}
                poster={pin.thumbnail}
                controls
                autoPlay
                loop
                playsInline
                className={`max-h-[82vh] w-full object-contain rounded-2xl transition-all duration-300 ${
                  isFlipped ? 'scale-x-[-1]' : ''
                } ${isGrayscale ? 'grayscale contrast-125' : ''}`}
              />
            ) : (
              <img
                ref={imageRef}
                src={pin.mediaUrl}
                alt={pin.title}
                crossOrigin="anonymous"
                className={`max-h-[82vh] w-full object-contain rounded-2xl transition-all duration-300 ${
                  isFlipped ? 'scale-x-[-1]' : ''
                } ${isGrayscale ? 'grayscale contrast-125' : ''}`}
              />
            )}
          </div>

          {/* Right Column: Reference Details, Moodboards & Comments */}
          {!isFocusMode && (
            <div className="md:col-span-5 lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between bg-neutral-900 text-neutral-100 border-l border-neutral-800">
              <div>
                {/* Header Actions & Moodboard Save */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800 relative">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyLink}
                      className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Compartir enlace"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (!user) {
                          onOpenAuth('login');
                          return;
                        }
                        setShowReportModal(true);
                      }}
                      className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Reportar"
                    >
                      <Flag className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleLikeClick}
                      className={`p-2 rounded-full transition-colors flex items-center gap-1.5 font-bold text-xs ${
                        isLiked 
                          ? 'bg-red-500/10 text-red-500' 
                          : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Me gusta"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{currentLikes}</span>
                    </button>
                  </div>

                  {/* Moodboard / Save Button Dropdown */}
                  <div className="relative" ref={boardMenuRef}>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSaveToBoard(null)}
                        className={`px-4 py-2 rounded-l-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                          isSaved
                            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            : 'bg-[#E60023] hover:bg-[#ad081b] text-white shadow-md shadow-red-600/20'
                        }`}
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Bookmark className="w-3.5 h-3.5" />}
                        <span>{isSaved ? 'Guardado' : 'Guardar'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (!user) {
                            onOpenAuth('login');
                            return;
                          }
                          setShowBoardMenu(prev => !prev);
                        }}
                        className={`px-2 py-2 rounded-r-full border-l border-black/20 font-bold text-xs transition-all ${
                          isSaved
                            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            : 'bg-[#E60023] hover:bg-[#ad081b] text-white'
                        }`}
                        title="Elegir tablero temático"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Moodboards Menu */}
                    {showBoardMenu && (
                      <div className="absolute right-0 top-11 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn">
                        <div className="text-[11px] font-black uppercase text-neutral-400 mb-2 px-1 flex items-center gap-1.5">
                          <FolderPlus className="w-3.5 h-3.5 text-[#E60023]" />
                          <span>Guardar en Tablero</span>
                        </div>

                        {/* List of existing boards */}
                        <div className="max-h-40 overflow-y-auto space-y-1 mb-2 pr-1">
                          <button
                            onClick={() => handleSaveToBoard(null)}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center justify-between"
                          >
                            <span>General (Sin tablero)</span>
                            <Bookmark className="w-3 h-3 text-neutral-500" />
                          </button>
                          {boards.map(b => (
                            <button
                              key={b.id}
                              onClick={() => handleSaveToBoard(b.id)}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center justify-between"
                            >
                              <span className="truncate">{b.title}</span>
                              <span className="text-[10px] text-neutral-500">Moodboard</span>
                            </button>
                          ))}
                        </div>

                        {/* Create new board inline */}
                        <div className="border-t border-neutral-800 pt-2 flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Nuevo tablero (ej. Manos)..."
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                          />
                          <button
                            onClick={handleCreateBoard}
                            disabled={isCreatingBoard || !newBoardTitle.trim()}
                            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Copied feedback */}
                {copiedToast && (
                  <div className="mt-2 text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 p-2 rounded-xl">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Enlace copiado al portapapeles!</span>
                  </div>
                )}

                {/* Title & Description */}
                <div className="mt-5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {pin.category || 'Estudio de Arte'}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {pin.title}
                  </h1>
                  {pin.description && (
                    <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      {pin.description}
                    </p>
                  )}
                </div>

                {/* Author Card */}
                <div className="mt-6 flex items-center justify-between p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                  <div 
                    onClick={handleAuthorClick}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <img
                      src={pin.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={pin.author?.name || 'Artista'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-800 group-hover:ring-red-500 transition-all"
                    />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-200 group-hover:text-white transition-colors">
                        {pin.author?.name || 'Artista'}
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        {pin.author?.handle || '@artista'}
                      </p>
                    </div>
                  </div>

                  {!pin.isExternal && pin.author?.id && user?.id !== pin.author?.id && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={loadingFollow}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                        isFollowing
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-[#E60023] hover:bg-[#ad081b] text-white'
                      }`}
                    >
                      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                <div className="mt-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 mb-3">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Notas & Comentarios ({pin.comments?.length || 0})</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                    {pin.comments && pin.comments.length > 0 ? (
                      pin.comments.map((c, i) => (
                        <div key={c.id || i} className="flex items-start gap-2 text-xs">
                          <img
                            src={c.author_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                            alt={c.author_name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="flex-1 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
                            <span className="font-bold text-neutral-300 mr-1.5">{c.author_name}</span>
                            <span className="text-neutral-400">{renderWithMentions(c.text)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-600 italic py-2">
                        Sin comentarios aún. Añade notas técnicas o referencias.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="mt-4 pt-3 border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={user ? "Añadir una nota de dibujo..." : "Inicia sesión para comentar"}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={!user}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-full px-4 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!user || !commentInput.trim()}
                  className="p-2 rounded-full bg-[#E60023] hover:bg-[#ad081b] text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Related Pins Section */}
        {!isFocusMode && relatedPins.length > 0 && (
          <div className="p-6 bg-neutral-950 border-t border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-300 mb-4">
              Referencias visuales relacionadas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedPins.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectRelatedPin?.(p)}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer bg-neutral-900 border border-neutral-800"
                >
                  <img
                    src={p.thumbnail || p.mediaUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <span className="text-xs font-bold text-white line-clamp-1">{p.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
