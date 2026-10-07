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
  
  const [profileData, setProfileData] = useState(null);
  const [resolvedTargetId, setResolvedTargetId] = useState(isSelf ? user?.id : null);

  // Display variables (prioritizing loaded profileData from database)
  const displayName = isSelf
    ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario')
    : (profileData?.full_name || viewedCreator?.name || 'Creador');

  const displayHandle = isSelf
    ? (user?.user_metadata?.username || user?.email?.split('@')[0] || 'usuario')
    : (profileData?.username || viewedCreator?.handle?.replace(/^@/, '') || 'creador');

  const displayAvatar = isSelf
    ? (user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`)
    : (profileData?.avatar_url || viewedCreator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayHandle}`);

  const displayBio = isSelf
    ? (user?.user_metadata?.bio || 'Creador visual y coleccionista de ideas ✨')
    : (profileData?.bio || viewedCreator?.bio || 'Compartiendo fotografía, diseño y proyectos creativos en PinMedia.');

  const displayWebsite = isSelf ? user?.user_metadata?.website : (profileData?.website || viewedCreator?.website);
  const displayRole = isSelf ? (user?.user_metadata?.role || 'user') : (profileData?.role || viewedCreator?.role || 'user');

  // Load Real Profile & Follow Stats from Supabase
  useEffect(() => {
    async function loadCreatorProfileAndFollows() {
      if (isSelf) {
        setResolvedTargetId(user?.id);
        if (user?.id) {
          const stats = await fetchCreatorFollowStats(user.id);
          setFollowStats(stats);
        }
        return;
      }

      let finalId = viewedCreator?.id;
      const lookupHandle = viewedCreator?.handle?.replace(/^@/, '') || viewedCreator?.id?.replace(/^@/, '');

      try {
        const { supabase } = await import('../lib/supabaseClient');
        let query = supabase.from('profiles').select('*');

        if (finalId && finalId.includes('-') && finalId.length >= 32) {
          query = query.eq('id', finalId);
        } else if (lookupHandle) {
          query = query.eq('username', lookupHandle);
        }

        const { data: dbProfile, error } = await query.maybeSingle();

        if (dbProfile) {
          setProfileData(dbProfile);
          finalId = dbProfile.id;
        }
      } catch (err) {
        console.error('Error fetching creator profile:', err);
      }

      setResolvedTargetId(finalId);

      if (finalId) {
        const stats = await fetchCreatorFollowStats(finalId);
        setFollowStats(stats);

        if (user?.id) {
          const following = await checkIsFollowingUser(user.id, finalId);
          setIsFollowing(following);
        }
      }
    }
    loadCreatorProfileAndFollows();
  }, [viewedCreator, isSelf, user?.id]);

  const handleFollowToggle = async () => {
    if (!user) {
      onOpenAuth?.('login');
      return;
    }
    if (!resolvedTargetId || isSelf) return;

    setLoadingFollow(true);
    try {
      const nowFollowing = await toggleFollowUser(user.id, resolvedTargetId);
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

  // Filter created pins (Banned/hidden pins are hidden for everyone except the author or admin)
  const isUserAdmin = user?.role === 'admin' || user?.user_metadata?.role === 'admin';
  const createdPins = pins.filter((p) => {
    // If hidden, only show to author or admin
    if (p.isHidden && !isSelf && !isUserAdmin) {
      return false;
    }

    if (isSelf) {
      return p.author?.id === user?.id || p.user_id === user?.id || p.author?.handle === `@${displayHandle}`;
    } else {
      return p.author?.id === resolvedTargetId || p.user_id === resolvedTargetId || p.author?.handle === `@${displayHandle}`;
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

      {/* Profile Container */}
      <div className="relative mb-10 max-w-4xl mx-auto">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 w-full rounded-3xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/20" />
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Profile Card Header */}
        <div className="relative px-6 pb-6 pt-0 -mt-20 sm:-mt-24 flex flex-col items-center text-center">
          {/* Avatar with ring & glow */}
          <div className="relative group mb-4">
            <div className="p-1 bg-white rounded-full shadow-xl ring-4 ring-white/60">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-inner transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {displayRole === 'admin' && (
              <span className="absolute bottom-1 right-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-lg ring-2 ring-white">
                Admin
              </span>
            )}
          </div>

          {/* User Info */}
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {displayName}
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1">
            @{displayHandle}
          </p>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-gray-600 mt-3 max-w-md leading-relaxed font-normal">
            {displayBio}
          </p>

          {/* Website link */}
          {displayWebsite && (
            <a
              href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs font-bold text-[#E60023] hover:underline flex items-center gap-1.5 bg-red-50 hover:bg-red-100/80 px-3 py-1 rounded-full transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{displayWebsite.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {/* Modern Floating Stats Bar */}
          <div className="flex items-center gap-2 sm:gap-6 mt-5 p-2 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] rounded-2xl text-xs sm:text-sm font-semibold text-gray-600">
            <div className="px-3 py-1 text-center">
              <strong className="block text-base sm:text-lg font-black text-gray-900">{createdPins.length}</strong>
              <span className="text-[11px] text-gray-400 font-medium">Publicaciones</span>
            </div>
            {isSelf && (
              <>
                <div className="w-[1px] h-7 bg-gray-100" />
                <div className="px-3 py-1 text-center">
                  <strong className="block text-base sm:text-lg font-black text-gray-900">{savedPins.length}</strong>
                  <span className="text-[11px] text-gray-400 font-medium">Guardados</span>
                </div>
              </>
            )}
            <div className="w-[1px] h-7 bg-gray-100" />
            <div className="px-3 py-1 text-center">
              <strong className="block text-base sm:text-lg font-black text-gray-900">{followStats.followersCount}</strong>
              <span className="text-[11px] text-gray-400 font-medium">Seguidores</span>
            </div>
            <div className="w-[1px] h-7 bg-gray-100" />
            <div className="px-3 py-1 text-center">
              <strong className="block text-base sm:text-lg font-black text-gray-900">{followStats.followingCount}</strong>
              <span className="text-[11px] text-gray-400 font-medium">Siguiendo</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-5">
            {isSelf ? (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar perfil</span>
                </button>
                <button
                  onClick={onOpenCreatePin}
                  className="px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md shadow-red-600/20 transition-all active:scale-95"
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
