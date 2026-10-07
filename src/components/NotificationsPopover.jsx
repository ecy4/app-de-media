import React from 'react';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Sparkles, 
  Check, 
  Trash2, 
  ExternalLink,
  X
} from 'lucide-react';

export default function NotificationsPopover({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAllAsRead, 
  onNotificationClick, 
  onClearNotification 
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 fill-[#E60023] text-[#E60023]" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />;
      case 'save':
        return <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  return (
    <div className="absolute right-0 sm:right-6 top-14 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-fadeIn">
      {/* Popover Header */}
      <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-gray-900">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-[#E60023] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} nuevas
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-[#E60023] hover:underline font-semibold flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Leídas</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto no-scrollbar divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-10 text-center px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-2">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Sin notificaciones aún</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Te avisaremos cuando otros usuarios interactúen con tus pines.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onNotificationClick(n);
                onClose();
              }}
              className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group relative ${
                !n.read ? 'bg-red-50/40' : ''
              }`}
            >
              {/* Avatar + Action Badge */}
              <div className="relative shrink-0">
                <img
                  src={n.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={n.sender_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  {getIcon(n.type)}
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 leading-snug">
                  <strong className="text-gray-900">{n.sender_name}</strong> {n.message}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {n.created_at || 'Reciente'}
                </span>
              </div>

              {/* Unread bullet or delete action */}
              <div className="flex items-center gap-1">
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-[#E60023] shrink-0" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearNotification(n.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-200 transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
