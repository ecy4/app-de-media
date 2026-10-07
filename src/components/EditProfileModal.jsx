import React, { useState, useRef } from 'react';
import { X, Camera, User, Globe, FileText, Loader2, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured, uploadMediaFile } from '../lib/supabaseClient';

export default function EditProfileModal({ isOpen, onClose, onSuccess }) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const initialFullName = user?.user_metadata?.full_name || '';
  const initialUsername = user?.user_metadata?.username || '';
  const initialBio = user?.user_metadata?.bio || '';
  const initialWebsite = user?.user_metadata?.website || '';
  const initialAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`;

  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [website, setWebsite] = useState(initialWebsite);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalAvatarUrl = avatarPreview;

      // Upload avatar to Supabase Storage or Base64
      if (avatarFile) {
        if (isSupabaseConfigured && supabase) {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { data, error: uploadErr } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true });

          if (uploadErr) {
            console.warn('Storage upload warning, fallback to pins bucket:', uploadErr);
            finalAvatarUrl = await uploadMediaFile(avatarFile, user.id);
          } else {
            const { data: pubData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            finalAvatarUrl = pubData.publicUrl;
          }
        } else {
          finalAvatarUrl = await uploadMediaFile(avatarFile, user.id);
        }
      }

      const updatedMeta = {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        bio: bio.trim(),
        website: website.trim(),
        avatar_url: finalAvatarUrl
      };

      // 1. Update Supabase profiles table if configured
      if (isSupabaseConfigured && supabase && user?.id) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...updatedMeta,
            created_at: new Date().toISOString()
          });

        if (profileErr) console.warn('Supabase profile upsert warning:', profileErr);
      }

      // 2. Update AuthContext state
      await updateProfile(updatedMeta);
      onSuccess?.('Perfil actualizado correctamente');
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-bold text-[#E60023] hover:underline"
            >
              Cambiar foto de perfil
            </button>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nombre de Usuario
            </label>
            <div className="relative">
              <span className="text-gray-400 absolute left-3.5 top-2 text-sm font-semibold">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Biografía
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale al mundo sobre ti y lo que te inspira..."
              maxLength={200}
              className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
          </div>

          {/* Website Link */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Sitio Web / Enlace
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://tuportafolio.com"
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full font-bold text-xs text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
