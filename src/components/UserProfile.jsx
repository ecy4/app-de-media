import React, { useState, useEffect } from 'react';
import { 
  User, 
  Share2, 
  Bookmark, 
  Plus, 
  Sparkles, 
  Globe, 
  UserCheck, 
  UserPlus, 
  ArrowLeft,
  Edit3,
  Loader2
} from 'lucide-react';
import MasonryGrid from './MasonryGrid';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from './EditProfileModal';
import { 
  fetchCreatorFollowStats, 
  checkIsFollowingUser, 
  toggleFollowUser 
} from '../lib/supabaseClient';

export default function UserProfile({ 
  viewedCreator = null, // If null, viewing logged-in user; if object, viewing that creator
  pins, 
  savedPinIds, 
  onPinClick, 
  onToggleSave, 
  onShare, 
  onOpenCreatePin, 
  onExploreClick, 
  onShowToast, 
  onBackToFeed,
  onAuthorClick,
  onOpenAuth 
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('created'); // 'created' | 'saved'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  // Determine target user ID
  const isSelf = !viewedCreator || viewedCreator.id === user?.id || viewedCreator.handle === `@${user?.user_metadata?.username}`;
  const targetId = isSelf ? user?.id : viewedCreator.id;

  const displayName = isSelf
    ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario')
    : (viewedCreator.name || 'Creador');

  const displayHandle = isSelf
    ? (user?.user_metadata?.username || user?.email?.split('@')[0] || 'usuario')
    : (viewedCreator.handle?.replace(/^@/, '') || 'creador');

  const displayAvatar = isSelf
    ? (user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`)
    : (viewedCreator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayHandle}`);

  const displayBio = isSelf
    ? (user?.user_metadata?.bio || 'Creador visual y coleccionista de ideas ✨')
    : (viewedCreator.bio || 'Compartiendo fotografía, diseño y proyectos creativos en PinMedia.');

  const displayWebsite = isSelf ? user?.user_metadata?.website : viewedCreator.website;
  const displayRole = isSelf ? (user?.user_metadata?.role || 'user') : (viewedCreator.role || 'user');

  // Load Real Follow Stats from Supabase 'user_follows' table
  useEffect(() => {
    async function loadFollows() {
      if (targetId) {
        const stats = await fetchCreatorFollowStats(targetId);
        setFollowStats(stats);

        if (!isSelf && user?.id) {
          const following = await checkIsFollowingUser(user.id, targetId);
          setIsFollowing(following);
        }
      }
    }
    loadFollows();
  }, [targetId, user?.id, isSelf]);

  const handleFollowToggle = async () => {
    if (!user) {
      onOpenAuth?.('login');
      return;
    }
    if (!targetId || isSelf) return;

    setLoadingFollow(true);
    try {
      const nowFollowing = await toggleFollowUser(user.id, targetId);
      setIsFollowing(nowFollowing);
      setFollowStats(prev => ({
        ...prev,
        followersCount: Math.max(0, prev.followersCount + (nowFollowing ? 1 : -1))
      }));
      onShowToast?.(nowFollowing ? `Ahora sigues a @${displayHandle}` : `Dejaste de seguir a @${displayHandle}`);
    } catch (err) {
      console.error('Follow error:', err);
      onShowToast?.('Error al actualizar el seguimiento en la base de datos', true);
    } finally {
      setLoadingFollow(false);
    }
  };

  // Filter created pins
  const createdPins = pins.filter((p) => {
    if (isSelf) {
      return p.author?.id === user?.id || p.user_id === user?.id || p.author?.handle === `@${displayHandle}`;
    } else {
      return p.author?.id === targetId || p.user_id === targetId || p.author?.handle === `@${displayHandle}`;
    }
  });

  // Filter saved pins (Only available for own authenticated profile)
  const savedPins = isSelf ? pins.filter((p) => savedPinIds.includes(p.id) || p.saved) : [];

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Back button for third party profile */}
      {!isSelf && onBackToFeed && (
        <button
          onClick={onBackToFeed}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Feed</span>
        </button>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-8">
        {/* Avatar */}
        <div className="relative group mb-3">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-gray-100 shadow-md transition-transform group-hover:scale-105"
          />
          {displayRole === 'admin' && (
            <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
              Admin
            </span>
          )}
        </div>

        {/* User Info */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {displayName}
        </h1>
        <p className="text-sm font-semibold text-gray-500 mt-0.5">
          @{displayHandle}
        </p>

        {/* Bio */}
        <p className="text-xs sm:text-sm text-gray-700 mt-2 max-w-md leading-relaxed">
          {displayBio}
        </p>

        {/* Website link */}
        {displayWebsite && (
          <a
            href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs font-semibold text-[#E60023] hover:underline flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{displayWebsite.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        {/* Real Stats from Database */}
        <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm font-semibold text-gray-600">
          <span>
            <strong className="text-gray-900">{createdPins.length}</strong> creados
          </span>
          {isSelf && (
            <>
              <span>•</span>
              <span>
                <strong className="text-gray-900">{savedPins.length}</strong> guardados
              </span>
            </>
          )}
          <span>•</span>
          <span>
            <strong className="text-gray-900">{followStats.followersCount}</strong> seguidores
          </span>
          <span>•</span>
          <span>
            <strong className="text-gray-900">{followStats.followingCount}</strong> seguidos
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          {isSelf ? (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar perfil</span>
              </button>
              <button
                onClick={onOpenCreatePin}
                className="px-4 py-2 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Pin</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleFollowToggle}
              disabled={loadingFollow}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                isFollowing
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-[#E60023] hover:bg-[#ad081b] text-white'
              }`}
            >
              {loadingFollow ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Siguiendo</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Seguir creador</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                onShowToast?.('¡Enlace de perfil copiado al portapapeles!');
              }
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {isSelf ? (
        <div className="flex items-center justify-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('created')}
            className={`pb-3 font-bold text-sm sm:text-base transition-all relative ${
              activeTab === 'created' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span>Creados ({createdPins.length})</span>
            {activeTab === 'created' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 font-bold text-sm sm:text-base transition-all relative ${
              activeTab === 'saved' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span>Guardados ({savedPins.length})</span>
            {activeTab === 'saved' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />
            )}
          </button>
        </div>
      ) : (
        <div className="border-b border-gray-200 mb-6 text-center">
          <h2 className="font-bold text-base text-gray-900 pb-3 border-b-2 border-black inline-block">
            Pines de @{displayHandle} ({createdPins.length})
          </h2>
        </div>
      )}

      {/* Tab Content / Grid */}
      <div>
        {isSelf && activeTab === 'saved' ? (
          savedPins.length > 0 ? (
            <MasonryGrid
              pins={savedPins}
              savedPinIds={savedPinIds}
              onPinClick={onPinClick}
              onToggleSave={onToggleSave}
              onShare={onShare}
              onAuthorClick={onAuthorClick}
              onResetFilters={() => {}}
            />
          ) : (
            <div className="py-16 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-gray-800">
                Aún no tienes Pines guardados
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Explora el feed y presiona el botón rojo "Guardar" para coleccionar tus ideas favoritas.
              </p>
              <button
                onClick={onExploreClick}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Explorar ideas
              </button>
            </div>
          )
        ) : createdPins.length > 0 ? (
          <MasonryGrid
            pins={createdPins}
            savedPinIds={savedPinIds}
            onPinClick={onPinClick}
            onToggleSave={onToggleSave}
            onShare={onShare}
            onAuthorClick={onAuthorClick}
            onResetFilters={() => {}}
            onOpenCreatePin={isSelf ? onOpenCreatePin : undefined}
          />
        ) : (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-gray-800">
              {isSelf ? 'Aún no has creado ningún Pin' : 'Este creador aún no ha publicado pines'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {isSelf
                ? 'Sube tus fotos o videos para empezar a inspirar a otros.'
                : 'Visita más tarde para ver sus nuevas creaciones.'}
            </p>
            {isSelf && (
              <button
                onClick={onOpenCreatePin}
                className="px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Crear tu primer Pin
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isSelf && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(msg) => onShowToast?.(msg)}
        />
      )}
    </div>
  );
}
