import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Plus, 
  Compass, 
  X,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationsPopover from './NotificationsPopover';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  activeView, 
  setActiveView, 
  onResetFilter, 
  onOpenAuth, 
  onOpenCreatePin, 
  notifications = [], 
  onMarkAllNotificationsRead, 
  onNotificationClick, 
  onClearNotification 
}) {
  const { user, logout } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateClick = () => {
    if (!user) {
      onOpenAuth('login');
    } else {
      onOpenCreatePin();
    }
  };

  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`;
  const userFullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userHandle = user?.user_metadata?.username || user?.email?.split('@')[0] || 'usuario';
  const userRole = user?.role || user?.user_metadata?.role || 'user';

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] transition-all">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <button 
          onClick={() => {
            setActiveView('home');
            onResetFilter();
          }}
          className="flex items-center gap-2 focus:outline-none group p-1.5 hover:bg-gray-100/80 rounded-full transition-all"
          title="PinMedia - Inicio"
        >
          <div className="w-9 h-9 rounded-full bg-[#E60023] flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-500/20 transition-transform group-hover:scale-105 active:scale-95">
            P
          </div>
          <span className="hidden md:inline font-black text-xl tracking-tight text-[#E60023]">
            PinMedia
          </span>
        </button>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-1.5 font-bold text-sm">
          <button
            onClick={() => {
              setActiveView('home');
              onResetFilter();
            }}
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              activeView === 'home'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-700 hover:bg-gray-100 active:scale-95'
            }`}
          >
            Inicio
          </button>
          
          <button
            onClick={() => {
              setActiveView('explore');
            }}
            className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              activeView === 'explore'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-700 hover:bg-gray-100 active:scale-95'
            }`}
          >
            <Compass className="w-4 h-4" />
            Explorar
          </button>

          <button
            onClick={handleCreateClick}
            className="px-4 py-2 rounded-full text-neutral-800 hover:bg-gray-100 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#E60023] stroke-[3]" />
            <span>Crear</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveView('admin')}
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 font-bold shadow-sm ${
                activeView === 'admin'
                  ? 'bg-red-600 text-white shadow-red-600/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100/80 active:scale-95'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <div 
            className={`flex items-center bg-gray-100/80 rounded-full px-4 py-2.5 w-full transition-all duration-200 ${
              isSearchFocused ? 'ring-4 ring-red-100 bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-200/70'
            }`}
          >
            <Search className="w-5 h-5 text-gray-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar fotos, videos, arquitectura, diseño..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView === 'profile' || activeView === 'admin') setActiveView('home');
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-transparent focus:outline-none text-sm text-gray-900 placeholder:text-gray-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Create Button */}
        <button
          onClick={handleCreateClick}
          className="lg:hidden p-2.5 bg-red-50 text-[#E60023] rounded-full hover:bg-red-100 transition-colors"
          title="Crear Pin"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Right Section: Notifications & Authenticated Profile */}
        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                title="Centro de notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-[#E60023] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <NotificationsPopover
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onMarkAllAsRead={onMarkAllNotificationsRead}
                onNotificationClick={onNotificationClick}
                onClearNotification={onClearNotification}
              />
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 hover:bg-gray-100/80 rounded-full transition-all focus:outline-none border border-transparent hover:border-gray-200 active:scale-95"
              >
                <div className="relative">
                  <img
                    src={userAvatar}
                    alt={userFullName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[100px]">{userFullName}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Modern Glassmorphic Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] border border-gray-100 p-2 z-50 animate-fadeIn">
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/60 rounded-2xl mb-2 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={userAvatar}
                        alt={userFullName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black text-gray-900 truncate">{userFullName}</p>
                          {userRole === 'admin' && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium truncate">@{userHandle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveView('profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:text-black hover:bg-gray-100/80 rounded-2xl flex items-center justify-between font-bold transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-gray-100 group-hover:bg-white transition-colors">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span>Mi Perfil</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600">Ver pines</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenCreatePin();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:text-black hover:bg-gray-100/80 rounded-2xl flex items-center justify-between font-bold transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-red-50 text-[#E60023]">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span>Crear nuevo Pin</span>
                      </div>
                      <span className="text-[10px] bg-red-50 text-[#E60023] px-2 py-0.5 rounded-full font-bold">+ Subir</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('explore');
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:text-black hover:bg-gray-100/80 rounded-2xl flex items-center gap-2.5 font-bold transition-all group lg:hidden"
                    >
                      <div className="p-1.5 rounded-xl bg-gray-100 group-hover:bg-white transition-colors">
                        <Compass className="w-4 h-4 text-gray-600" />
                      </div>
                      <span>Explorar Colecciones</span>
                    </button>

                    {/* Admin Dashboard */}
                    {userRole === 'admin' && (
                      <button
                        onClick={() => {
                          setActiveView('admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-red-600 hover:bg-red-50/80 rounded-2xl flex items-center justify-between font-bold transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-red-100 text-red-600">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span>Panel de Moderación</span>
                        </div>
                        <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black">PRO</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-2xl flex items-center gap-2.5 font-bold transition-all"
                    >
                      <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors whitespace-nowrap"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#E60023] hover:bg-[#ad081b] rounded-full shadow-sm transition-colors whitespace-nowrap"
            >
              Registrarse
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
