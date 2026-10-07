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
  Loader2,
  Folder,
  FolderPlus,
  LayoutGrid
} from 'lucide-react';
import MasonryGrid from './MasonryGrid';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from './EditProfileModal';
import { 
  fetchCreatorFollowStats, 
  checkIsFollowingUser, 
  toggleFollowUser,
  fetchUserBoards,
  createBoardInDb
} from '../lib/supabaseClient';

export default function UserProfile({ 
  viewedCreator = null,
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
  const [activeTab, setActiveTab] = useState('created'); // 'created' | 'saved' | 'boards'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  // Boards state
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);

  const isSelf = !viewedCreator || viewedCreator.id === user?.id || viewedCreator.handle === `@${user?.user_metadata?.username}`;
  
  const [profileData, setProfileData] = useState(null);
  const [resolvedTargetId, setResolvedTargetId] = useState(isSelf ? user?.id : null);

  const displayName = isSelf
    ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Artista')
    : (profileData?.full_name || viewedCreator?.name || 'Creador');

  const displayHandle = isSelf
    ? (user?.user_metadata?.username || user?.email?.split('@')[0] || 'artista')
    : (profileData?.username || viewedCreator?.handle?.replace(/^@/, '') || 'creador');

  const displayAvatar = isSelf
    ? (user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`)
    : (profileData?.avatar_url || viewedCreator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayHandle}`);

  const displayBio = isSelf
    ? (user?.user_metadata?.bio || 'Estudio de ilustración y referencias anatómicas 🎨')
    : (profileData?.bio || viewedCreator?.bio || 'Referencias visuales y proyectos creativos.');

  const displayWebsite = isSelf ? user?.user_metadata?.website : (profileData?.website || viewedCreator?.website);
  const displayRole = isSelf ? (user?.user_metadata?.role || 'user') : (profileData?.role || viewedCreator?.role || 'user');

  // Load Boards
  useEffect(() => {
    async function loadBoards() {
      const targetId = isSelf ? user?.id : resolvedTargetId;
      if (targetId) {
        const loaded = await fetchUserBoards(targetId);
        setBoards(loaded || []);
      }
    }
    loadBoards();
  }, [isSelf, user?.id, resolvedTargetId]);

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

        const { data: dbProfile } = await query.maybeSingle();

        if (dbProfile) {
          setProfileData(dbProfile);
          finalId = dbProfile.id;
        }

        if (finalId) {
          setResolvedTargetId(finalId);
          const stats = await fetchCreatorFollowStats(finalId);
          setFollowStats(stats);

          if (user?.id) {
            const isFol = await checkIsFollowingUser(user.id, finalId);
            setIsFollowing(isFol);
          }
        }
      } catch (e) {
        console.error('Error loading creator profile:', e);
      }
    }

    loadCreatorProfileAndFollows();
  }, [viewedCreator, isSelf, user?.id]);

  const handleFollowToggle = async () => {
    if (!user) {
      onOpenAuth?.('login');
      return;
    }
    if (!resolvedTargetId || loadingFollow) return;

    setLoadingFollow(true);
    try {
      const nowFollowing = await toggleFollowUser(user.id, resolvedTargetId);
      setIsFollowing(nowFollowing);
      setFollowStats(prev => ({
        ...prev,
        followersCount: nowFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1)
      }));
      onShowToast?.(nowFollowing ? '¡Ahora sigues a este artista!' : 'Has dejado de seguir a este artista');
    } catch (err) {
      console.error(err);
      onShowToast?.(err.message || 'Error al actualizar seguimiento', true);
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleCreateNewBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim() || !user?.id) return;
    setCreatingBoard(true);
    try {
      const created = await createBoardInDb(user.id, newBoardTitle.trim());
      if (created) {
        setBoards(prev => [created, ...prev]);
        setNewBoardTitle('');
        setShowCreateBoardModal(false);
        onShowToast?.(`Tablero "${created.title}" creado con éxito.`);
      }
    } catch (err) {
      onShowToast?.(err.message || 'Error al crear tablero', true);
    } finally {
      setCreatingBoard(false);
    }
  };

  const createdPins = pins.filter((p) => {
    if (isSelf) {
      return (p.user_id && p.user_id === user?.id) || (!p.isExternal && p.author?.id === user?.id);
    }
    return (p.user_id && p.user_id === resolvedTargetId) || 
           (p.author?.id === resolvedTargetId) || 
           (p.author?.handle === `@${displayHandle}`);
  });

  const savedPins = pins.filter((p) => savedPinIds.includes(p.id) || p.saved);

  return (
    <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-4 animate-fadeIn text-neutral-100">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al estudio</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="mb-8 rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl relative">
        <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e60023_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        <div className="px-6 pb-8 pt-0 flex flex-col items-center text-center relative -mt-16 sm:-mt-20">
          <div className="relative mb-3 group">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-neutral-900 shadow-xl ring-4 ring-neutral-800">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-full h-full rounded-full object-cover shadow-inner"
              />
            </div>
            {displayRole === 'admin' && (
              <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg ring-2 ring-neutral-900">
                Admin
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {displayName}
          </h1>
          <p className="text-sm font-bold text-neutral-400 mt-1">
            @{displayHandle}
          </p>
          <p className="text-xs sm:text-sm text-neutral-300 mt-3 max-w-md leading-relaxed font-normal">
            {displayBio}
          </p>

          {displayWebsite && (
            <a
              href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs font-bold text-red-400 hover:underline flex items-center gap-1.5 bg-neutral-800 px-3 py-1 rounded-full"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{displayWebsite.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {/* Stats Bar */}
          <div className="flex items-center gap-2 sm:gap-6 mt-5 p-2 px-4 sm:px-6 bg-neutral-950/80 border border-neutral-800 rounded-2xl text-xs sm:text-sm font-semibold text-neutral-400">
            <div className="px-3 py-1 text-center">
              <strong className="block text-base sm:text-lg font-black text-white">{createdPins.length}</strong>
              <span className="text-[11px] text-neutral-500">Láminas</span>
            </div>
            {isSelf && (
              <>
                <div className="w-[1px] h-7 bg-neutral-800" />
                <div className="px-3 py-1 text-center">
                  <strong className="block text-base sm:text-lg font-black text-white">{savedPins.length}</strong>
                  <span className="text-[11px] text-neutral-500">Guardados</span>
                </div>
                <div className="w-[1px] h-7 bg-neutral-800" />
                <div className="px-3 py-1 text-center">
                  <strong className="block text-base sm:text-lg font-black text-white">{boards.length}</strong>
                  <span className="text-[11px] text-neutral-500">Moodboards</span>
                </div>
              </>
            )}
            <div className="w-[1px] h-7 bg-neutral-800" />
            <div className="px-3 py-1 text-center">
              <strong className="block text-base sm:text-lg font-black text-white">{followStats.followersCount}</strong>
              <span className="text-[11px] text-neutral-500">Seguidores</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-5">
            {isSelf ? (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-xs font-bold flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar perfil</span>
                </button>
                <button
                  onClick={onOpenCreatePin}
                  className="px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md shadow-red-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Subir Lámina</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={loadingFollow}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
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
                    <span>Seguir artista</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  onShowToast?.('¡Enlace de artista copiado al portapapeles!');
                }
              }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 border-b border-neutral-800 mb-6">
        <button
          onClick={() => { setActiveTab('created'); setSelectedBoardId(null); }}
          className={`pb-3 font-bold text-xs sm:text-sm transition-all relative ${
            activeTab === 'created' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <span>Láminas Propias ({createdPins.length})</span>
          {activeTab === 'created' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E60023] rounded-full" />
          )}
        </button>

        {isSelf && (
          <>
            <button
              onClick={() => { setActiveTab('saved'); setSelectedBoardId(null); }}
              className={`pb-3 font-bold text-xs sm:text-sm transition-all relative ${
                activeTab === 'saved' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>Guardados ({savedPins.length})</span>
              {activeTab === 'saved' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E60023] rounded-full" />
              )}
            </button>

            <button
              onClick={() => { setActiveTab('boards'); }}
              className={`pb-3 font-bold text-xs sm:text-sm transition-all relative flex items-center gap-1.5 ${
                activeTab === 'boards' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Folder className="w-4 h-4 text-amber-400" />
              <span>Tableros ({boards.length})</span>
              {activeTab === 'boards' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E60023] rounded-full" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'boards' && isSelf ? (
          <div>
            {/* Create Board Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-400" />
                <span>Moodboards de Referencia</span>
              </h2>
              <button
                onClick={() => setShowCreateBoardModal(true)}
                className="px-4 py-2 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Nuevo Tablero</span>
              </button>
            </div>

            {/* Boards Grid */}
            {boards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boards.map(b => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBoardId(b.id);
                      setActiveTab('saved');
                    }}
                    className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {b.description || 'Colección de estudio visual'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-amber-400 mb-3">
                  <FolderPlus className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-white">Sin tableros aún</h3>
                <p className="text-xs text-neutral-400 mt-1 mb-4">
                  Crea moodboards como "Práctica de Manos", "Fantasía Oscura" o "Estudio de Iluminación" para organizar tus referencias.
                </p>
                <button
                  onClick={() => setShowCreateBoardModal(true)}
                  className="px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full font-bold text-xs"
                >
                  Crear mi primer tablero
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'saved' && isSelf ? (
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
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500 mb-3">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-white">
                Aún no tienes referencias guardadas
              </h3>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                Explora el estudio y presiona "Guardar" para coleccionar referencias en tus tableros.
              </p>
              <button
                onClick={onExploreClick}
                className="px-5 py-2.5 bg-[#E60023] text-white rounded-full font-bold text-xs shadow-md"
              >
                Explorar referencias
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
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-white">
              {isSelf ? 'Aún no has subido láminas de dibujo' : 'Este artista aún no ha publicado láminas'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              {isSelf
                ? 'Sube tus bocetos, renders o fotos de referencia para inspirar a otros ilustradores.'
                : 'Visita su perfil más tarde para ver nuevos estudios visuales.'}
            </p>
            {isSelf && (
              <button
                onClick={onOpenCreatePin}
                className="px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full font-bold text-xs shadow-md"
              >
                Subir tu primera lámina
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateBoardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2">Crear Tablero de Referencias</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Agrupa referencias para tus cómics, pinturas digitales o ejercicios de dibujo.
            </p>
            <form onSubmit={handleCreateNewBoard}>
              <input
                type="text"
                placeholder="Nombre del tablero (ej. Poses Dinámicas)"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBoardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingBoard || !newBoardTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E60023] hover:bg-[#ad081b] text-white disabled:opacity-50"
                >
                  {creatingBoard ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
