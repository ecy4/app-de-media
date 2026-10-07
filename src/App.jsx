import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import FeaturedCarousel from './components/FeaturedCarousel';
import MasonryGrid from './components/MasonryGrid';
import PinDetailModal from './components/PinDetailModal';
import CreatePinModal from './components/CreatePinModal';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import ExploreView from './components/ExploreView';
import AdminDashboard from './components/admin/AdminDashboard';
import SupabaseConnectionError from './components/SupabaseConnectionError';
import { fetchFeedMedia } from './services/mediaApi';
import { 
  fetchPinsFromSupabase, 
  createSupabasePin, 
  fetchUserLikedPinIds, 
  togglePinLikeInDb, 
  fetchUserSavedPinIds, 
  togglePinSaveInDb, 
  addCommentToSupabase,
  isSupabaseConfigured,
  fetchUserNotifications,
  markNotificationsAsReadInDb,
  deleteNotificationInDb
} from './lib/supabaseClient';
import { Check, Loader2, AlertCircle } from 'lucide-react';

function AppContent() {
  const { user, healthStatus } = useAuth();

  // Pins from Supabase database
  const [supabasePins, setSupabasePins] = useState([]);
  
  // Dynamic API pins (Empty by default unless valid API keys are configured)
  const [apiPins, setApiPins] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Real Database Saved pins & Liked pins
  const [savedPinIds, setSavedPinIds] = useState([]);
  const [likedPinIds, setLikedPinIds] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('home'); // 'home' | 'explore' | 'profile' | 'admin'
  const [viewedCreator, setViewedCreator] = useState(null);
  const [activePinId, setActivePinId] = useState(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isCreatePinOpen, setIsCreatePinOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 1. Fetch Pins from Supabase
  const loadDatabasePins = useCallback(async () => {
    if (healthStatus.connected) {
      const dbPins = await fetchPinsFromSupabase();
      setSupabasePins(dbPins || []);
    }
  }, [healthStatus.connected]);

  useEffect(() => {
    loadDatabasePins();
  }, [loadDatabasePins]);

  // 2. Fetch User Likes, Saves & Notifications from Supabase
  useEffect(() => {
    async function loadUserInteractions() {
      if (user?.id && healthStatus.connected) {
        const [saved, liked, notifs] = await Promise.all([
          fetchUserSavedPinIds(user.id),
          fetchUserLikedPinIds(user.id),
          fetchUserNotifications(user.id)
        ]);
        setSavedPinIds(saved);
        setLikedPinIds(liked);
        setNotifications(notifs);
      } else {
        setSavedPinIds([]);
        setLikedPinIds([]);
        setNotifications([]);
      }
    }
    loadUserInteractions();
  }, [user?.id, healthStatus.connected]);

  // 3. Fetch Dynamic Media from API (returns empty if no keys configured)
  const loadLiveMedia = useCallback(async (cat, q) => {
    setIsLoadingMedia(true);
    try {
      const fetched = await fetchFeedMedia({ category: cat, query: q, perPage: 24 });
      setApiPins(fetched || []);
    } catch (err) {
      console.error('Error fetching live media:', err);
      setApiPins([]);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    loadLiveMedia(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, loadLiveMedia]);

  // Combined Pins (Database Pins + API Media)
  const allPins = useMemo(() => {
    const combined = [...supabasePins, ...apiPins.filter(p => !supabasePins.some(sp => sp.id === p.id))];
    return combined.filter(p => !p.isHidden);
  }, [supabasePins, apiPins]);

  // 4. Robust Browser History & Back/Forward Navigation Handler
  const syncStateFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    const viewParam = params.get('view') || 'home';
    const profileParam = params.get('profile');
    const categoryParam = params.get('category');
    const queryParam = params.get('q');

    // Sync active Pin modal
    setActivePinId(pinParam || null);

    // Sync category & query
    if (categoryParam) setSelectedCategory(categoryParam);
    if (queryParam) setSearchQuery(queryParam);

    // Sync view & creator
    if (profileParam) {
      setViewedCreator({
        id: profileParam,
        name: profileParam.replace(/^@/, ''),
        handle: profileParam.startsWith('@') ? profileParam : `@${profileParam}`
      });
      setActiveView('profile');
    } else {
      setViewedCreator(null);
      const userRole = user?.role || user?.user_metadata?.role || 'user';
      if (viewParam === 'admin' && userRole !== 'admin') {
        setActiveView('home');
      } else {
        setActiveView(viewParam);
      }
    }
  }, [user]);

  // Sync on mount and on popstate (Browser Back / Forward buttons)
  useEffect(() => {
    syncStateFromUrl();
    window.addEventListener('popstate', syncStateFromUrl);
    return () => window.removeEventListener('popstate', syncStateFromUrl);
  }, [syncStateFromUrl]);

  // Helper to push state changes to browser history
  const navigateTo = (newView, params = {}) => {
    const url = new URL(window.location.href);
    
    if (newView === 'home') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', newView);
    }

    if (params.profile) {
      url.searchParams.set('profile', params.profile);
    } else {
      url.searchParams.delete('profile');
    }

    if (params.pin) {
      url.searchParams.set('pin', params.pin);
    } else {
      url.searchParams.delete('pin');
    }

    if (params.category) {
      url.searchParams.set('category', params.category);
    }

    window.history.pushState({}, '', url);
    syncStateFromUrl();
  };

  const openPinDetail = (pin) => {
    const url = new URL(window.location.href);
    url.searchParams.set('pin', pin.id);
    window.history.pushState({}, '', url);
    setActivePinId(pin.id);
  };

  const closePinDetail = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('pin');
    window.history.pushState({}, '', url);
    setActivePinId(null);
  };

  const handleOpenCreatorProfile = (creator) => {
    const creatorHandle = creator.handle || creator.id;
    navigateTo('profile', { profile: creatorHandle });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateView = (viewName) => {
    const userRole = user?.role || user?.user_metadata?.role || 'user';
    if (viewName === 'admin' && userRole !== 'admin') {
      showToast('Acceso restringido: Se requieren permisos de Administrador.', true);
      return;
    }
    navigateTo(viewName);
  };

  // Toast feedback helper
  const showToast = (message, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleOpenCreatePin = () => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setIsCreatePinOpen(true);
  };

  // Create Pin in Supabase
  const handlePinCreated = async (newPinPayload) => {
    try {
      const createdPin = await createSupabasePin(newPinPayload);
      setSupabasePins(prev => [createdPin, ...prev]);
      showToast('¡Tu Pin ha sido publicado con éxito en Supabase!');
      navigateTo('home');
    } catch (err) {
      console.error('Error creating pin:', err);
      showToast(err.message || 'Error al guardar el pin en Supabase', true);
    }
  };

  // Real Save Pin Toggle in Supabase
  const handleToggleSave = async (pinId) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }

    try {
      const nowSaved = await togglePinSaveInDb(user.id, pinId);
      setSavedPinIds(prev => nowSaved ? [...prev, pinId] : prev.filter(id => id !== pinId));
      showToast(nowSaved ? 'Pin guardado en tu colección' : 'Pin eliminado de tus guardados');
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.message || 'Error al guardar el pin', true);
    }
  };

  // Real Like Pin Toggle in Supabase
  const handleToggleLike = async (pinId) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }

    try {
      const nowLiked = await togglePinLikeInDb(user.id, pinId);
      setLikedPinIds(prev => nowLiked ? [...prev, pinId] : prev.filter(id => id !== pinId));
      
      setSupabasePins(prev => prev.map(p => {
        if (p.id === pinId) {
          return { ...p, likes: Math.max(0, (p.likes || 0) + (nowLiked ? 1 : -1)) };
        }
        return p;
      }));
    } catch (err) {
      console.error('Like error:', err);
      showToast(err.message || 'Error al actualizar el like', true);
    }
  };

  // Real Comment in Supabase
  const handleAddComment = async (pinId, commentObj) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }

    try {
      const savedComment = await addCommentToSupabase(
        pinId,
        user.id,
        user.user_metadata?.full_name || 'Usuario',
        user.user_metadata?.avatar_url,
        commentObj.text
      );

      setSupabasePins(prev => prev.map(p => {
        if (p.id === pinId) {
          return { ...p, comments: [savedComment, ...(p.comments || [])] };
        }
        return p;
      }));

      showToast('Comentario guardado en Supabase');
    } catch (err) {
      console.error('Comment error:', err);
      showToast(err.message || 'Error al registrar el comentario', true);
    }
  };

  // Admin moderation handlers
  const handleDeletePin = async (pinId) => {
    if (user?.role !== 'admin' && user?.user_metadata?.role !== 'admin') {
      showToast('Acceso denegado: se requiere rol de Administrador.', true);
      return;
    }

    try {
      const { supabase } = await import('./lib/supabaseClient');
      if (supabase) {
        const { error } = await supabase.from('pins').delete().eq('id', pinId);
        if (error) throw error;
      }
      setSupabasePins(prev => prev.filter(p => p.id !== pinId));
      setApiPins(prev => prev.filter(p => p.id !== pinId));
      showToast('Pin eliminado permanentemente de Supabase.');
    } catch (err) {
      console.error('Error deleting pin:', err);
      showToast(err.message || 'Error al eliminar el pin de la base de datos', true);
    }
  };

  const handleToggleHidePin = async (pinId) => {
    if (user?.role !== 'admin' && user?.user_metadata?.role !== 'admin') {
      showToast('Acceso denegado: se requiere rol de Administrador.', true);
      return;
    }

    const currentPin = allPins.find(p => p.id === pinId);
    const newHiddenState = !currentPin?.isHidden;

    try {
      const { supabase } = await import('./lib/supabaseClient');
      if (supabase) {
        const { error } = await supabase.from('pins').update({ is_hidden: newHiddenState }).eq('id', pinId);
        if (error) throw error;
      }
      setSupabasePins(prev => prev.map(p => p.id === pinId ? { ...p, isHidden: newHiddenState } : p));
      showToast(newHiddenState ? 'Pin ocultado del feed público.' : 'Pin visible nuevamente.');
    } catch (err) {
      console.error('Error toggling pin visibility:', err);
      showToast(err.message || 'Error al actualizar visibilidad', true);
    }
  };

  const handleShare = (pin) => {
    const shareUrl = `${window.location.origin}?pin=${pin.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Enlace copiado al portapapeles');
    }
  };

  // Active pin object for modal
  const activePin = useMemo(() => {
    return allPins.find((p) => p.id === activePinId) || null;
  }, [allPins, activePinId]);

  // Blocking Supabase Connectivity Screen if health check fails
  if (!healthStatus.checking && !healthStatus.connected) {
    return <SupabaseConnectionError message={healthStatus.message} />;
  }

  const currentUserRole = user?.role || user?.user_metadata?.role || 'user';

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Sticky Navigation Bar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={handleNavigateView}
        onResetFilter={() => {
          setSelectedCategory('all');
          setSearchQuery('');
          navigateTo('home');
        }}
        onOpenAuth={handleOpenAuth}
        onOpenCreatePin={handleOpenCreatePin}
        notifications={notifications}
        onMarkAllNotificationsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          if (user) markNotificationsAsReadInDb(user.id);
        }}
        onNotificationClick={(n) => {
          if (n.type === 'follow' && n.sender_name) {
            // For follow notifications, navigate directly to their profile
            handleOpenCreatorProfile({ id: n.sender_id, handle: n.sender_name });
          } else if (n.pin_id) {
            // For pin-related notifications, try opening the pin
            const target = allPins.find(p => p.id === n.pin_id);
            if (target) {
              openPinDetail(target);
            } else {
              // If pin not loaded in current view, fallback to their profile
              handleOpenCreatorProfile({ id: n.sender_id, handle: n.sender_name });
            }
          } else if (n.sender_name) {
            handleOpenCreatorProfile({ id: n.sender_id, handle: n.sender_name });
          }
        }}
        onClearNotification={(id) => {
          setNotifications(prev => prev.filter(n => n.id !== id));
          deleteNotificationInDb(id);
        }}
      />

      {/* Main Content Router */}
      {activeView === 'admin' && currentUserRole === 'admin' ? (
        <AdminDashboard
          pins={allPins}
          onDeletePin={handleDeletePin}
          onToggleHidePin={handleToggleHidePin}
          onClose={() => handleNavigateView('home')}
          onOpenPin={openPinDetail}
        />
      ) : activeView === 'profile' ? (
        <UserProfile
          viewedCreator={viewedCreator}
          pins={allPins}
          savedPinIds={savedPinIds}
          onPinClick={openPinDetail}
          onToggleSave={handleToggleSave}
          onShare={handleShare}
          onAuthorClick={handleOpenCreatorProfile}
          onOpenCreatePin={handleOpenCreatePin}
          onExploreClick={() => handleNavigateView('explore')}
          onBackToFeed={() => handleNavigateView('home')}
          onShowToast={(msg, isErr) => showToast(msg, isErr)}
          onOpenAuth={handleOpenAuth}
        />
      ) : activeView === 'explore' ? (
        <ExploreView
          pins={allPins}
          savedPinIds={savedPinIds}
          onPinClick={openPinDetail}
          onToggleSave={handleToggleSave}
          onShare={handleShare}
          onAuthorClick={handleOpenCreatorProfile}
          onOpenCreatePin={handleOpenCreatePin}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            navigateTo('home', { category: cat });
          }}
        />
      ) : (
        <>
          {/* Categories Horizontal Scroll Bar */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              navigateTo('home', { category: cat });
            }}
          />

          {/* Featured Trends Carousel */}
          {selectedCategory === 'all' && !searchQuery && (
            <FeaturedCarousel
              onSelectCollection={(cat) => {
                setSelectedCategory(cat);
                navigateTo('home', { category: cat });
              }}
            />
          )}

          {/* Main Masonry Grid */}
          <main className="flex-1 relative">
            {isLoadingMedia && (
              <div className="flex items-center justify-center py-6 gap-2 text-xs font-semibold text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                <span>Consultando contenido en tiempo real...</span>
              </div>
            )}
            <MasonryGrid
              pins={allPins}
              savedPinIds={savedPinIds}
              onPinClick={openPinDetail}
              onToggleSave={handleToggleSave}
              onShare={handleShare}
              onAuthorClick={handleOpenCreatorProfile}
              onOpenCreatePin={handleOpenCreatePin}
              onResetFilters={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                navigateTo('home');
              }}
            />
          </main>
        </>
      )}

      {/* Pin Detail Overlay Modal */}
      {activePin && (
        <PinDetailModal
          pin={activePin}
          allPins={allPins}
          savedPinIds={savedPinIds}
          likedPinIds={likedPinIds}
          onClose={closePinDetail}
          onToggleSave={handleToggleSave}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          onShare={handleShare}
          onSelectRelatedPin={openPinDetail}
          onOpenAuth={handleOpenAuth}
          onAuthorClick={handleOpenCreatorProfile}
        />
      )}

      {/* Create Pin Modal */}
      <CreatePinModal
        isOpen={isCreatePinOpen}
        onClose={() => setIsCreatePinOpen(false)}
        onPinCreated={handlePinCreated}
      />

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        defaultMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          showToast('¡Sesión iniciada correctamente en Supabase!');
          loadDatabasePins();
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn border ${
          toastMessage.isError ? 'bg-red-700 border-red-500' : 'bg-[#111111] border-white/10'
        }`}>
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-red-200 stroke-[3]" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
