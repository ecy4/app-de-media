import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Link as LinkIcon, 
  Loader2, 
  Tag
} from 'lucide-react';
import { CATEGORIES } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { uploadMediaFile } from '../lib/supabaseClient';
import { validateMediaFile, sanitizeInput, validateSafeUrl } from '../utils/security';

export default function CreatePinModal({ isOpen, onClose, onPinCreated }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('photography');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Hardened MIME and size validation
    const validation = validateMediaFile(selectedFile);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);
    setMediaType(validation.type);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveMedia = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !previewUrl) {
      setErrorMessage('Por favor añade una imagen o video para tu Pin.');
      return;
    }
    
    // Sanitize user inputs against XSS
    const cleanTitle = sanitizeInput(title);
    const cleanDescription = sanitizeInput(description);

    if (!cleanTitle) {
      setErrorMessage('Por favor asigna un título a tu Pin.');
      return;
    }

    // Validate safe destination URL if provided
    let safeDestUrl = null;
    if (destinationUrl.trim()) {
      safeDestUrl = validateSafeUrl(destinationUrl);
      if (!safeDestUrl) {
        setErrorMessage('El enlace de destino debe ser una URL válida (http:// o https://).');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Upload file securely to Supabase Storage bucket 'pins' or Base64
      const uploadedUrl = await uploadMediaFile(file, user?.id || 'anon', 'pins');

      // 2. Parse and sanitize tags
      const tagsArray = tagsInput
        .split(',')
        .map((t) => sanitizeInput(t.toLowerCase().replace(/^#/, '')))
        .filter(Boolean);

      // 3. Construct Pin object
      const newPin = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pin-${Date.now()}`,
        user_id: user?.id,
        title: cleanTitle,
        description: cleanDescription || 'Sin descripción adicional.',
        type: mediaType,
        mediaUrl: uploadedUrl,
        thumbnail: mediaType === 'video' ? uploadedUrl : undefined,
        category: category,
        destinationUrl: safeDestUrl || undefined,
        tags: tagsArray.length > 0 ? tagsArray : [category],
        aspectRatio: mediaType === 'video' ? 'aspect-[9/16]' : 'aspect-[3/4]',
        saved: false,
        likes: 0,
        isHidden: false,
        author: {
          id: user?.id || 'anon',
          name: sanitizeInput(user?.user_metadata?.full_name || 'Tú'),
          handle: `@${sanitizeInput(user?.user_metadata?.username || 'tu_usuario')}`,
          avatar: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          followers: '1',
          role: user?.user_metadata?.role || 'user'
        },
        comments: [],
        createdAt: new Date().toISOString()
      };

      onPinCreated(newPin);
      handleRemoveMedia();
      onClose();
    } catch (err) {
      console.error('Error creating pin:', err);
      setErrorMessage(err.message || 'Error al guardar el Pin. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Crear un Pin</h2>
            <span className="text-xs bg-red-50 text-[#E60023] font-semibold px-2.5 py-0.5 rounded-full">
              Subida Segura
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Media Uploader */}
          <div className="md:col-span-5 flex flex-col">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 min-h-[320px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#E60023] bg-red-50/50 scale-[0.99]'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50/80 hover:bg-gray-100'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-[#E60023] mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="font-bold text-sm text-gray-800">
                  Arrastra o haz clic para subir
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                  Imágenes (JPG, PNG, WebP) hasta 10 MB o Videos (MP4, WebM) hasta 50 MB.
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Fotos
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Videos
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[320px] max-h-[420px] group">
                {mediaType === 'video' ? (
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full h-full max-h-[420px] object-contain rounded-2xl"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="w-full h-full max-h-[420px] object-contain rounded-2xl"
                  />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-red-600 text-white rounded-full transition-all shadow-md"
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Pin Details Form */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Título del Pin *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Añade un título descriptivo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-base sm:text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Explica de qué trata este Pin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer font-medium"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Link */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Enlace de destino (ej. https://tuweb.com)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    placeholder="https://ejemplo.com"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="fotografia, diseno, arquitectura..."
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!file && !previewUrl)}
                className="px-6 py-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-40 disabled:hover:bg-[#E60023] text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publicando de forma segura...</span>
                  </>
                ) : (
                  'Publicar Pin'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
