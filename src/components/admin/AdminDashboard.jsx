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
  Loader2 
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
  const [activeTab, setActiveTab] = useState('pins'); // 'pins' | 'users'
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  useEffect(() => {
    loadProfiles();
  }, []);

  const totalLikes = pins.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = pins.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-[#E60023] rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-xs text-gray-500">
                Supervisión general, moderación de contenido y control de usuarios reales en Supabase
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="self-start sm:self-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold transition-all"
        >
          Volver al Feed
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Total Pines</span>
            <ImageIcon className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{pins.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            ● Base de datos Supabase
          </span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Usuarios Registrados</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{usersList.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            ● Perfiles en tabla profiles
          </span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Comentarios</span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{totalComments}</p>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 inline-block">
            ● Moderados
          </span>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Interacciones Totales</span>
            <TrendingUp className="w-4 h-4 text-[#E60023]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {totalLikes > 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            ● Actividad en vivo
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('pins')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'pins'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Moderación de Pines ({pins.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            loadProfiles();
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Gestión de Usuarios Reales ({usersList.length})
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
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
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

      {/* Tab 2: Gestión de Usuarios Reales de Supabase */}
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
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
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
    </div>
  );
}
