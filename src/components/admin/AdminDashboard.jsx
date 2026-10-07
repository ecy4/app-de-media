import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Image as ImageIcon, 
  MessageSquare, 
  Trash2, 
  Eye, 
  EyeOff, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Search, 
  AlertTriangle,
  Loader2,
  Send,
  Radio,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard({ 
  pins, 
  onDeletePin, 
  onToggleHidePin, 
  onClose, 
  onOpenPin 
}) {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('pins'); // 'pins' | 'hidden' | 'users' | 'reports' | 'comments' | 'broadcast'
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState(null);
  const [allComments, setAllComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Load user petitions / reports
  const loadReports = async () => {
    if (!supabase) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, pins(id, title, media_url, is_hidden)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReportsList(data);
      }
    } catch (e) {
      console.warn('Reports table might not exist yet:', e);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleResolveReport = async (reportId, action, pinId) => {
    if (!supabase) return;
    try {
      if (action === 'hide' && pinId) {
        await onToggleHidePin(pinId);
      } else if (action === 'delete' && pinId) {
        await onDeletePin(pinId);
      }
      
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (!error) {
        setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      }
    } catch (err) {
      console.error('Error resolving report:', err);
    }
  };

  const handleDismissReport = async (reportId) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      if (!error) {
        setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
      }
    } catch (err) {
      console.error('Error dismissing report:', err);
    }
  };

  // Fetch real registered profiles from Supabase
  const loadProfiles = async () => {
    if (!supabase) return;
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsersList(data);
      }
    } catch (e) {
      console.error('Error fetching admin profiles:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all comments across pins for moderation
  const loadComments = async () => {
    if (!supabase) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, pins(title)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllComments(data);
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    loadComments();
    loadReports();
  }, []);

  const totalLikes = pins.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = allComments.length || pins.reduce((acc, p) => acc + (p.comments?.length || 0), 0);
  const hiddenPinsCount = pins.filter(p => p.isHidden).length;
  const pendingReportsCount = reportsList.filter(r => r.status === 'pending').length;

  // Send global notification announcement to all users
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || !supabase) return;
    setSendingBroadcast(true);
    setBroadcastFeedback(null);

    try {
      // Create notification for every registered profile
      const notificationsToInsert = usersList.map((usr) => ({
        user_id: usr.id,
        sender_id: user?.id,
        sender_name: user?.user_metadata?.full_name || 'Equipo PinMedia',
        sender_avatar: user?.user_metadata?.avatar_url,
        type: 'admin_announcement',
        message: `📢 Anuncio oficial: ${broadcastMessage.trim()}`
      }));

      if (notificationsToInsert.length > 0) {
        const { error } = await supabase.from('notifications').insert(notificationsToInsert);
        if (error) throw error;
      }

      setBroadcastFeedback({ success: true, text: `¡Anuncio enviado con éxito a ${usersList.length} usuarios!` });
      setBroadcastMessage('');
    } catch (err) {
      console.error('Error sending broadcast:', err);
      setBroadcastFeedback({ success: false, text: 'Error al enviar el anuncio general.' });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!supabase) return;
    if (!window.confirm('¿Eliminar este comentario permanentemente?')) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (!error) {
        setAllComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!supabase) return;
    try {
      const newSuspended = !currentStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: newSuspended })
        .eq('id', userId);

      if (!error) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: newSuspended } : u));
      }
    } catch (e) {
      console.error('Error updating profile status:', e);
    }
  };

  const handleDeleteProfile = async (userId) => {
    if (!supabase) return;
    if (!window.confirm('¿Estás seguro de eliminar este perfil definitivamente de la base de datos?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (!error) {
        setUsersList(prev => prev.filter(u => u.id !== userId));
      }
    } catch (e) {
      console.error('Error deleting profile:', e);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    if (!supabase) return;
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (!error) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        if (userId === user?.id) {
          updateProfile({ role: newRole });
        }
      }
    } catch (e) {
      console.error('Error changing role:', e);
    }
  };

  const filteredPins = pins.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = usersList.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-8 py-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-500/40 rounded-full text-red-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            <span>Centro de Control Maestro</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
            Supervisión integral de contenido, moderación de reportes comunitarios y control de usuarios en tiempo real.
          </p>
        </div>

        <button
          onClick={onClose}
          className="relative z-10 self-start sm:self-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all backdrop-blur-md active:scale-95"
        >
          Volver al Feed
        </button>

        <div className="absolute right-0 top-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-3">
            <span>Total Pines</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900">{pins.length}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-gray-500 font-semibold">
              Sincronizado con Supabase
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-3">
            <span>Usuarios Reales</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900">{usersList.length}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[11px] text-gray-500 font-semibold">
              Perfiles registrados
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-3">
            <span>Comentarios</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900">{totalComments}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] text-gray-500 font-semibold">
              En publicaciones
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-3">
            <span>Pines Ocultos</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900">{hiddenPinsCount}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${hiddenPinsCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="text-[11px] text-gray-500 font-semibold">
              {hiddenPinsCount > 0 ? 'Baneados / Archivados' : 'Cero infracciones'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pins')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pins'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos los Pines ({pins.length})
        </button>

        <button
          onClick={() => setActiveTab('hidden')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'hidden'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Ocultos / Baneados ({hiddenPinsCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('reports');
            loadReports();
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Peticiones / Reportes {pendingReportsCount > 0 && `(${pendingReportsCount})`}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            loadProfiles();
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Usuarios ({usersList.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('comments');
            loadComments();
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'comments'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Comentarios ({allComments.length})
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📢 Anuncio Global
        </button>
      </div>

      {/* Tab 1: Moderación de Pines */}
      {activeTab === 'pins' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por título o autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Mostrando {filteredPins.length} pines
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-4">Medio</th>
                  <th className="p-4">Título</th>
                  <th className="p-4">Autor</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Likes</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPins.map((pin) => (
                  <tr key={pin.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4">
                      <div 
                        onClick={() => onOpenPin(pin)}
                        className="w-12 h-14 rounded-lg overflow-hidden bg-black cursor-pointer group relative"
                      >
                        {pin.type === 'video' ? (
                          <video src={pin.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={pin.mediaUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-900 max-w-[200px] truncate">
                      {pin.title}
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={pin.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{pin.author?.name || 'Creador'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700">
                        {pin.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {pin.likes || 0}
                    </td>
                    <td className="p-4">
                      {pin.isHidden ? (
                        <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          Oculto
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          Visible
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onToggleHidePin(pin.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title={pin.isHidden ? "Mostrar pin" : "Ocultar pin"}
                        >
                          {pin.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onDeletePin(pin.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Pines Ocultos / Baneados */}
      {activeTab === 'hidden' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-red-500" />
                <span>Pines Ocultos o Baneados del Feed</span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Estas publicaciones no son visibles para el público general, pero permanecen archivadas en Supabase.
              </p>
            </div>
            <span className="text-xs bg-red-50 text-red-700 font-bold px-3 py-1 rounded-full">
              {pins.filter(p => p.isHidden).length} ocultos
            </span>
          </div>

          <div className="overflow-x-auto">
            {pins.filter(p => p.isHidden).length === 0 ? (
              <div className="py-14 text-center text-xs text-gray-400">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                No hay ningún pin oculto o baneado en este momento.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Medio</th>
                    <th className="p-4">Título</th>
                    <th className="p-4">Autor</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pins.filter(p => p.isHidden).map((pin) => (
                    <tr key={pin.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <div 
                          onClick={() => onOpenPin(pin)}
                          className="w-12 h-14 rounded-lg overflow-hidden bg-black cursor-pointer relative"
                        >
                          {pin.type === 'video' ? (
                            <video src={pin.mediaUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={pin.mediaUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900 max-w-[200px] truncate">
                        {pin.title}
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={pin.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{pin.author?.name || 'Creador'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700">
                          {pin.category}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onToggleHidePin(pin.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Desbanear / Restaurar</span>
                          </button>
                          <button
                            onClick={() => onDeletePin(pin.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar permanentemente de Supabase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Peticiones y Reportes de Usuarios */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Peticiones de Moderación y Reportes</span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Peticiones enviadas por usuarios reportando contenido inapropiado o solicitudes de revisión.
              </p>
            </div>
            <button
              onClick={loadReports}
              className="text-xs font-bold text-[#E60023] hover:underline"
            >
              Actualizar peticiones
            </button>
          </div>

          <div className="overflow-x-auto">
            {loadingReports ? (
              <div className="py-12 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                <span>Cargando peticiones de moderación...</span>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="py-14 text-center text-xs text-gray-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                No hay peticiones ni reportes pendientes. ¡Todo en orden!
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Reportado Por</th>
                    <th className="p-4">Motivo / Razón</th>
                    <th className="p-4">Pin Afectado</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Resolución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportsList.map((rep) => (
                    <tr key={rep.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">
                        {rep.reporter_name || 'Usuario'}
                      </td>
                      <td className="p-4 text-gray-800 max-w-xs font-medium">
                        {rep.reason || rep.message || 'Contenido inadecuado'}
                      </td>
                      <td className="p-4">
                        {rep.pins ? (
                          <div className="flex items-center gap-2">
                            {rep.pins.media_url && (
                              <img src={rep.pins.media_url} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                            <span className="font-semibold truncate max-w-[120px]">{rep.pins.title || 'Pin'}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-[10px]">{rep.pin_id ? rep.pin_id.slice(0, 8) : 'General'}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'resolved' 
                            ? 'bg-emerald-50 text-emerald-700'
                            : rep.status === 'dismissed'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-amber-50 text-amber-700 animate-pulse'
                        }`}>
                          {rep.status === 'resolved' ? 'Resuelto' : rep.status === 'dismissed' ? 'Descartado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-[10px]">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {rep.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleResolveReport(rep.id, 'hide', rep.pin_id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full font-bold text-[10px] transition-colors"
                              title="Ocultar pin y marcar resuelto"
                            >
                              Ocultar Pin
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, 'delete', rep.pin_id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-[10px] transition-colors"
                              title="Borrar pin y marcar resuelto"
                            >
                              Borrar Pin
                            </button>
                            <button
                              onClick={() => handleDismissReport(rep.id)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-bold text-[10px] transition-colors"
                              title="Descartar reporte"
                            >
                              Ignorar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-semibold">Cerrado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {activeTab === 'users' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar usuarios por nombre o @username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
            <button
              onClick={loadProfiles}
              className="text-xs font-bold text-[#E60023] hover:underline"
            >
              Actualizar lista
            </button>
          </div>

          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="py-12 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                <span>Cargando perfiles desde Supabase...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No hay perfiles registrados en la base de datos.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Handle</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={usr.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.username}`}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{usr.full_name}</p>
                            <span className="text-[10px] text-gray-400">
                              Registrado: {new Date(usr.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-gray-600">@{usr.username}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleUserRole(usr.id, usr.role)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            usr.role === 'admin'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {usr.role === 'admin' ? 'Administrador' : 'Usuario'}
                        </button>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          !usr.is_suspended
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {!usr.is_suspended ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(usr.id, usr.is_suspended)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              !usr.is_suspended
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {!usr.is_suspended ? 'Suspender' : 'Reactivar'}
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(usr.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar perfil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Moderación de Comentarios */}
      {activeTab === 'comments' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Comentarios publicados en pines</h3>
            <button
              onClick={loadComments}
              className="text-xs font-bold text-[#E60023] hover:underline"
            >
              Actualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            {loadingComments ? (
              <div className="py-12 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                <span>Cargando comentarios...</span>
              </div>
            ) : allComments.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No hay comentarios registrados.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Autor</th>
                    <th className="p-4">Comentario</th>
                    <th className="p-4">Pin Asociado</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allComments.map((cm) => (
                    <tr key={cm.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-semibold text-gray-900 flex items-center gap-2">
                        <img
                          src={cm.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80'}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{cm.author_name}</span>
                      </td>
                      <td className="p-4 text-gray-700 max-w-xs">{cm.text}</td>
                      <td className="p-4 text-gray-500 max-w-[150px] truncate">
                        {cm.pins?.title || 'Pin #' + cm.pin_id.slice(0, 8)}
                      </td>
                      <td className="p-4 text-gray-400 text-[10px]">
                        {new Date(cm.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteComment(cm.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Borrar comentario ofensivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Anuncios Globales / Notificaciones Masivas */}
      {activeTab === 'broadcast' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-50 text-[#E60023] rounded-2xl">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transmisión de Anuncios Oficiales</h2>
              <p className="text-xs text-gray-500">
                Envía una notificación de alta prioridad a la campanita de todos los usuarios registrados.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Mensaje del Anuncio
              </label>
              <textarea
                required
                rows={4}
                maxLength={300}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Ejemplo: ¡Mantenimiento programado hoy a las 23:00 hrs! Nueva actualización disponible..."
                className="w-full p-3.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-[#E60023] transition-all resize-none"
              />
              <span className="text-[10px] text-gray-400 block text-right mt-1">
                {broadcastMessage.length}/300 caracteres
              </span>
            </div>

            {broadcastFeedback && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                broadcastFeedback.success 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {broadcastFeedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={sendingBroadcast || !broadcastMessage.trim()}
              className="w-full py-3 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-40 text-white rounded-full font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {sendingBroadcast ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitiendo a {usersList.length} usuarios...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar a todos ({usersList.length} usuarios)</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
