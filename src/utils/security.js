/**
 * Security & Sanitization Utilities
 * Prevents XSS, directory traversal, malicious schemes (javascript:), and invalid media uploads.
 */

// Allowed MIME types for storage
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Basic XSS sanitizer for user-provided text (titles, descriptions, comments)
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '') // Strip brackets to prevent script injection
    .trim();
}

/**
 * Validates that an external URL starts exclusively with http:// or https://
 * Blocks javascript:, data:, vbscript: and other malicious schemes
 */
export function validateSafeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return '';
  const trimmed = urlString.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Validates uploaded media file type and file size
 */
export function validateMediaFile(file) {
  if (!file) {
    return { valid: false, error: 'No se ha seleccionado ningún archivo.' };
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'Formato no permitido. Solo se aceptan imágenes (JPG, PNG, WebP, GIF) y videos (MP4, WebM).'
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'La imagen no debe superar los 10 MB.' };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return { valid: false, error: 'El video no debe superar los 50 MB.' };
  }

  return {
    valid: true,
    type: isVideo ? 'video' : 'image'
  };
}

/**
 * Generates a safe, randomized storage filename preventing path traversal
 */
export function generateSecureFileName(userId = 'anon', file) {
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return `${sanitizedUserId}/${uuid}.${extension}`;
}
