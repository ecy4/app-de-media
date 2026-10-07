import { createClient } from '@supabase/supabase-js';
import { 
  validateMediaFile, 
  generateSecureFileName, 
  sanitizeInput, 
  validateSafeUrl 
} from '../utils/security';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('tu-proyecto')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Health Check: Verifies live connectivity with Supabase Database
 */
export async function checkSupabaseHealth() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas.'
    };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Error al conectar con Supabase: ${error.message}`
      };
    }

    return { connected: true, message: 'Conectado exitosamente a Supabase' };
  } catch (err) {
    return {
      connected: false,
      message: `Error de red al contactar Supabase: ${err.message}`
    };
  }
}

/**
 * Upload media file directly and strictly to Supabase Storage.
 * NO Base64 or local fallback permitted.
 */
export async function uploadMediaFile(file, userId, bucket = 'pins') {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('No hay conexión con Supabase. No es posible subir archivos.');
  }

  if (!userId) {
    throw new Error('Debes iniciar sesión para subir archivos.');
  }

  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const secureFilePath = generateSecureFileName(userId, file);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(secureFilePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Error al subir a Supabase Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(secureFilePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo subido.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Fetch pins from Supabase with author, comments and likes counts
 */
export async function fetchPinsFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('pins')
      .select(`
        *,
        author:profiles(id, full_name, username, avatar_url, bio, website, role),
        comments(id, user_id, author_name, author_avatar, text, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Supabase pins:', error);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      description: p.description,
      type: p.type,
      mediaUrl: p.media_url,
      thumbnail: p.thumbnail_url || (p.type === 'image' ? p.media_url : undefined),
      category: p.category,
      destinationUrl: p.destination_url,
      tags: p.tags || [],
      aspectRatio: p.aspect_ratio || 'aspect-[3/4]',
      likes: p.likes_count || 0,
      isHidden: p.is_hidden || false,
      author: {
        id: p.author?.id || p.user_id,
        name: p.author?.full_name || 'Creador',
        handle: `@${p.author?.username || 'creador'}`,
        avatar: p.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        bio: p.author?.bio,
        website: p.author?.website,
        role: p.author?.role || 'user'
      },
      comments: (p.comments || []).map(c => ({
        id: c.id,
        user_id: c.user_id,
        author: c.author_name,
        avatar: c.author_avatar,
        text: c.text,
        time: new Date(c.created_at).toLocaleDateString()
      })),
      createdAt: p.created_at
    }));
  } catch (err) {
    console.error('fetchPinsFromSupabase exception:', err);
    return [];
  }
}

/**
 * Insert a newly created Pin into Supabase
 */
export async function createSupabasePin(pinPayload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está conectado.');
  }

  const { data, error } = await supabase
    .from('pins')
    .insert({
      user_id: pinPayload.user_id,
      title: sanitizeInput(pinPayload.title),
      description: sanitizeInput(pinPayload.description),
      type: pinPayload.type,
      media_url: pinPayload.mediaUrl,
      thumbnail_url: pinPayload.thumbnail,
      category: pinPayload.category,
      destination_url: pinPayload.destinationUrl ? validateSafeUrl(pinPayload.destinationUrl) : null,
      tags: pinPayload.tags,
      aspect_ratio: pinPayload.aspectRatio
    })
    .select(`
      *,
      author:profiles(id, full_name, username, avatar_url, bio, website, role)
    `)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    type: data.type,
    mediaUrl: data.media_url,
    thumbnail: data.thumbnail_url,
    category: data.category,
    destinationUrl: data.destination_url,
    tags: data.tags || [],
    aspectRatio: data.aspect_ratio,
    likes: 0,
    isHidden: false,
    author: {
      id: data.author?.id || data.user_id,
      name: data.author?.full_name || 'Tú',
      handle: `@${data.author?.username || 'tu_usuario'}`,
      avatar: data.author?.avatar_url,
      bio: data.author?.bio,
      website: data.author?.website,
      role: data.author?.role || 'user'
    },
    comments: [],
    createdAt: data.created_at
  };
}

/**
 * Real Followers / Following Database Queries
 */
export async function fetchCreatorFollowStats(creatorId) {
  if (!isSupabaseConfigured || !supabase || !creatorId) {
    return { followersCount: 0, followingCount: 0 };
  }

  try {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('user_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', creatorId),
      supabase.from('user_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', creatorId)
    ]);

    return {
      followersCount: followersRes.count || 0,
      followingCount: followingRes.count || 0
    };
  } catch (e) {
    console.error('Error fetching follow stats:', e);
    return { followersCount: 0, followingCount: 0 };
  }
}

export async function checkIsFollowingUser(currentUserId, targetCreatorId) {
  if (!isSupabaseConfigured || !supabase || !currentUserId || !targetCreatorId || currentUserId === targetCreatorId) {
    return false;
  }

  try {
    const { data } = await supabase
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetCreatorId)
      .maybeSingle();

    return Boolean(data);
  } catch (e) {
    return false;
  }
}

export async function toggleFollowUser(currentUserId, targetCreatorId) {
  if (!isSupabaseConfigured || !supabase || !currentUserId || !targetCreatorId) {
    throw new Error('Debes iniciar sesión para seguir a un usuario.');
  }

  const isFollowing = await checkIsFollowingUser(currentUserId, targetCreatorId);

  if (isFollowing) {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetCreatorId);
    if (error) throw error;
    return false; // Not following anymore
  } else {
    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: currentUserId,
        following_id: targetCreatorId
      });
    if (error) throw error;

    // Send Notification
    try {
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUserId)
        .single();
      
      if (currentUser) {
        await supabase.from('notifications').insert({
          user_id: targetCreatorId,
          sender_id: currentUserId,
          sender_name: currentUser.full_name,
          sender_avatar: currentUser.avatar_url,
          type: 'follow',
          message: 'ha comenzado a seguirte.'
        });
      }
    } catch (e) {
      console.warn('Could not send follow notification', e);
    }

    return true; // Now following
  }
}

/**
 * Real Likes Operations
 */
export async function fetchUserLikedPinIds(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  try {
    const { data } = await supabase
      .from('pin_likes')
      .select('pin_id')
      .eq('user_id', userId);
    return (data || []).map(d => d.pin_id);
  } catch (e) {
    return [];
  }
}

export async function togglePinLikeInDb(userId, pinId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('Inicia sesión para dar me gusta.');
  }

  const { data: existing } = await supabase
    .from('pin_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('pin_id', pinId)
    .maybeSingle();

  if (existing) {
    await supabase.from('pin_likes').delete().eq('user_id', userId).eq('pin_id', pinId);
    return false;
  } else {
    await supabase.from('pin_likes').insert({ user_id: userId, pin_id: pinId });
    return true;
  }
}

/**
 * Real Saved Pins Operations
 */
export async function fetchUserSavedPinIds(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  try {
    const { data } = await supabase
      .from('saved_pins')
      .select('pin_id')
      .eq('user_id', userId);
    return (data || []).map(d => d.pin_id);
  } catch (e) {
    return [];
  }
}

export async function togglePinSaveInDb(userId, pinId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('Inicia sesión para guardar pines.');
  }

  const { data: existing } = await supabase
    .from('saved_pins')
    .select('id')
    .eq('user_id', userId)
    .eq('pin_id', pinId)
    .maybeSingle();

  if (existing) {
    await supabase.from('saved_pins').delete().eq('user_id', userId).eq('pin_id', pinId);
    return false;
  } else {
    await supabase.from('saved_pins').insert({ user_id: userId, pin_id: pinId });
    return true;
  }
}

/**
 * Real Comments Operations
 */
export async function addCommentToSupabase(pinId, userId, authorName, authorAvatar, text) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('Inicia sesión para comentar.');
  }

  const cleanText = sanitizeInput(text);
  if (!cleanText) throw new Error('El comentario no puede estar vacío.');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      pin_id: pinId,
      user_id: userId,
      author_name: sanitizeInput(authorName),
      author_avatar: authorAvatar,
      text: cleanText
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    user_id: data.user_id,
    author: data.author_name,
    avatar: data.author_avatar,
    text: data.text,
    time: 'Justo ahora'
  };
}
