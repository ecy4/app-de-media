import React, { useState, useEffect } from 'react';
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
  UserPlus
} from 'lucide-react';
import MediaCard from './MediaCard';
import { useAuth } from '../context/AuthContext';
import { sanitizeInput, validateSafeUrl } from '../utils/security';
import { renderWithMentions } from '../utils/mentions';

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

  const isSaved = savedPinIds.includes(pin.id) || pin.saved;
  const isLiked = likedPinIds.includes(pin.id);
  const currentLikes = (pin.likes || 0) + (isLiked && !pin.userLikedInitially ? 1 : 0) - (!isLiked && pin.userLikedInitially ? 1 : 0);

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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle new comment with XSS sanitization
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const cleanText = sanitizeInput(commentInput);
    if (!cleanText) return;

    if (!user) {
      onOpenAuth('login');
      return;
    }

    const newCommentObj = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cm-${Date.now()}`,
      author: sanitizeInput(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tú'),
      avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`,
      text: cleanText,
      time: 'Justo ahora'
    };

    onAddComment(pin.id, newCommentObj);
    setCommentInput('');
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?pin=${pin.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
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

  const handleSaveClick = () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    onToggleSave(pin.id);
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

  // Validate destination URL if present
  const safeDestinationUrl = pin.destinationUrl ? validateSafeUrl(pin.destinationUrl) : null;

  // Related pins filter (same category or shared tags, excluding current)
  const relatedPins = allPins.filter(
    (p) => p.id !== pin.id && (p.category === pin.category || p.tags?.some(t => pin.tags?.includes(t)))
  ).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 lg:p-8 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-gray-800 shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
        title="Cerrar (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl my-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Main Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          {/* Left Column: Large Media View */}
          <div className="md:col-span-6 lg:col-span-7 bg-black flex items-center justify-center p-2 sm:p-4 rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl relative overflow-hidden">
            {pin.type === 'video' ? (
              <video
                src={pin.mediaUrl}
                poster={pin.thumbnail}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[75vh] w-full object-contain rounded-2xl"
              />
            ) : (
              <img
                src={pin.mediaUrl}
                alt={pin.title}
                className="max-h-[75vh] w-full object-contain rounded-2xl"
              />
            )}
          </div>

          {/* Right Column: Pin Details & Sidebar */}
          <div className="md:col-span-6 lg:col-span-5 p-6 flex flex-col justify-between bg-white">
            <div>
              {/* Action Toolbar */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
                    title="Copiar enlace directo"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleLikeClick}
                    className={`p-2.5 rounded-full transition-colors flex items-center gap-1.5 font-bold text-sm ${
                      isLiked 
                        ? 'bg-red-50 text-[#E60023]' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    title="Me gusta"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{currentLikes}</span>
                  </button>

                  {copiedToast && (
                    <span className="text-xs font-semibold bg-black text-white px-2.5 py-1 rounded-full animate-fadeIn">
                      ¡Copiado!
                    </span>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveClick}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 shadow-sm flex items-center gap-1.5 ${
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

              {/* Title & Description */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {pin.title}
                </h1>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                  {renderWithMentions(pin.description, onAuthorClick)}
                </p>

                {/* Safe Destination URL link */}
                {safeDestinationUrl && (
                  <a
                    href={safeDestinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#E60023] hover:underline bg-red-50 px-3 py-1.5 rounded-full"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{safeDestinationUrl.replace(/^https?:\/\//, '').split('/')[0]}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}

                {/* Tags */}
                {pin.tags && pin.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {pin.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Author Card (Clickable to visit Creator Profile) */}
              <div className="flex items-center justify-between mt-6 p-3 bg-gray-50 rounded-2xl">
                <div 
                  onClick={handleAuthorClick}
                  className="flex items-center gap-3 cursor-pointer group/author"
                  title="Visitar perfil del creador"
                >
                  <img
                    src={pin.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={pin.author?.name}
                    className="w-11 h-11 rounded-full object-cover ring-1 ring-gray-200 group-hover/author:ring-red-300 transition-all"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-none group-hover/author:underline">
                      {pin.author?.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {pin.author?.handle} • {pin.author?.followers || '1.2k'} seguidores
                    </p>
                  </div>
                </div>

                {user?.id !== pin.author?.id && (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-black text-white hover:bg-neutral-800'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Siguiendo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center justify-between">
                <span>Comentarios ({pin.comments?.length || 0})</span>
              </h4>

              {/* Comments List */}
              <div className="max-h-44 overflow-y-auto no-scrollbar space-y-3 mb-4 pr-1">
                {(!pin.comments || pin.comments.length === 0) ? (
                  <div className="text-center py-4 text-xs text-gray-400">
                    <MessageSquare className="w-5 h-5 mx-auto mb-1 opacity-50" />
                    <p>Aún no hay comentarios. ¡Sé el primero en opinar!</p>
                  </div>
                ) : (
                  pin.comments.map((cm) => (
                    <div key={cm.id} className="flex gap-2.5 items-start text-xs animate-fadeIn">
                      <img
                        src={cm.avatar}
                        alt={cm.author}
                        className="w-6 h-6 rounded-full object-cover mt-0.5"
                      />
                      <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{cm.author}</span>
                          <span className="text-[10px] text-gray-400">{cm.time}</span>
                        </div>
                        <p className="text-gray-700 mt-1">
                          {renderWithMentions(cm.text, (authorObj) => {
                             onClose();
                             if (onAuthorClick) onAuthorClick(authorObj);
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={250}
                  placeholder={user ? "Escribe un comentario..." : "Inicia sesión para comentar..."}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 text-xs bg-gray-100 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="p-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-40 disabled:hover:bg-[#E60023] text-white rounded-full transition-all"
                  title="Enviar comentario"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section: Related Pins */}
        {relatedPins.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/70 p-6 sm:p-8">
            <h3 className="text-center font-bold text-lg text-gray-900 mb-6">
              Más como esto
            </h3>
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
              {relatedPins.map((relatedPin) => (
                <MediaCard
                  key={relatedPin.id}
                  pin={relatedPin}
                  savedPinIds={savedPinIds}
                  onPinClick={(p) => {
                    onSelectRelatedPin(p);
                    const modalEl = document.querySelector('.overflow-y-auto');
                    if (modalEl) modalEl.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onToggleSave={onToggleSave}
                  onShare={onShare}
                  onAuthorClick={onAuthorClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
