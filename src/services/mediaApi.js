/**
 * Multi-Provider Media Aggregator Service
 * 
 * Supports:
 * 1. Pixabay API (Images & Videos) - VITE_PIXABAY_API_KEY
 * 2. Unsplash API (Images) - VITE_UNSPLASH_ACCESS_KEY
 * 3. Open Fallbacks (Picsum Photos & Mixkit Free Videos) when keys are missing or exhausted (e.g. 429).
 * 
 * Architecture:
 * - Parallel execution via Promise.allSettled for fault tolerance.
 * - Normalized schema with dual casing support:
 *   { id, title, media_url, mediaUrl, media_type, type, author, likes_count, likes, category, aspect_ratio, aspectRatio, source_provider }
 * - Fisher-Yates shuffle algorithm to blend providers seamlessly.
 */

import { CATEGORIES } from '../constants/categories';

const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY;
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Mixkit free curated HD video clips fallback pool
const FALLBACK_VIDEOS = [
  {
    id: 'mixkit-aerial-waves',
    title: 'Olas del océano desde el aire',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-breaking-on-the-beach-42358-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-cyber-code',
    title: 'Líneas de código y datos en movimiento',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-matrix-style-binary-code-animated-background-35301-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-sunset-clouds',
    title: 'Atardecer cinemático entre nubes',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1514477917009-389c76a86b68?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-tunnel-lights',
    title: 'Túnel de luces nocturno en hipervelocidad',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-highway-in-the-middle-of-a-city-at-night-4433-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-ink-water',
    title: 'Tinta fluida en agua - Arte Abstracto',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-in-slow-motion-42630-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  }
];

/**
 * Normalizes item properties to ensure complete compatibility
 * with both camelCase (MediaCard/Modal) and snake_case contract.
 */
function normalizeMediaItem({
  id,
  title,
  type,
  mediaUrl,
  thumbnail,
  category,
  author,
  description,
  aspectRatio = 'aspect-[3/4]',
  likes = 0,
  tags = [],
  sourceProvider = 'external'
}) {
  return {
    id,
    title,
    // Unified dual-casing properties
    mediaUrl,
    media_url: mediaUrl,
    thumbnail: thumbnail || mediaUrl,
    type,
    media_type: type,
    category,
    author: {
      id: author?.id || `creator-${id}`,
      name: author?.name || 'Creador Visual',
      handle: author?.handle || '@creador',
      avatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.handle || id}`,
      role: author?.role || 'user'
    },
    description: description || `Contenido curado desde ${sourceProvider}.`,
    aspectRatio,
    aspect_ratio: aspectRatio,
    likes,
    likes_count: likes,
    saved: false,
    tags: Array.isArray(tags) ? tags : [category],
    comments: [],
    source_provider: sourceProvider,
    sourceProvider,
    isExternal: true
  };
}

/**
 * Fisher-Yates Shuffle Algorithm
 * Randomly shuffles elements in an array in-place with uniform distribution
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Fetch from Pixabay (Photos and/or Videos)
 */
async function fetchPixabayProvider({ searchTerm, category, mediaType, page, perPage }) {
  if (!PIXABAY_KEY || PIXABAY_KEY === 'tu-pixabay-api-key') {
    return [];
  }

  const isVideoOnly = mediaType === 'videos' || category === 'videos';
  const isImageOnly = mediaType === 'images' || category === 'photography';
  const results = [];

  const mapPixabayItem = (item, isVideo, idx) => {
    const authorName = item.user || 'Pixabay Creator';
    const authorHandle = `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
    const tagsArray = item.tags ? item.tags.split(',').map(t => t.trim()) : [category];

    const videoUrl = isVideo
      ? (item.videos?.medium?.url || item.videos?.large?.url || item.videos?.small?.url || '')
      : null;

    const aspect = isVideo
      ? 'aspect-[16/9]'
      : (item.imageHeight > item.imageWidth * 1.3 ? 'aspect-[2/3]' : item.imageWidth > item.imageHeight * 1.3 ? 'aspect-[16/9]' : 'aspect-[3/4]');

    return normalizeMediaItem({
      id: `pixabay-${isVideo ? 'vid' : 'img'}-${item.id}-${idx}`,
      title: item.tags ? item.tags.split(',')[0].trim() : `${searchTerm || 'Medio'} HD`,
      type: isVideo ? 'video' : 'image',
      mediaUrl: isVideo ? videoUrl : (item.largeImageURL || item.webformatURL),
      thumbnail: isVideo
        ? (item.picture_id ? `https://i.vimeocdn.com/video/${item.picture_id}_640x360.jpg` : item.videos?.tiny?.url)
        : (item.webformatURL || item.previewURL),
      category: category !== 'all' ? category : (isVideo ? 'videos' : 'photography'),
      author: {
        id: `pixabay-${item.user_id || item.id}`,
        name: authorName,
        handle: authorHandle,
        avatar: item.userImageURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorHandle}`
      },
      description: `Descubierto en Pixabay: ${item.tags || 'Inspiración visual.'}`,
      aspectRatio: aspect,
      likes: item.likes || 0,
      tags: tagsArray.slice(0, 4),
      sourceProvider: 'pixabay'
    });
  };

  if (isVideoOnly) {
    const res = await fetch(`https://pixabay.com/api/videos/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'motion')}&per_page=${perPage}&page=${page}&safesearch=true`);
    if (!res.ok) throw new Error(`Pixabay error status: ${res.status}`);
    const data = await res.json();
    return (data.hits || []).map((item, idx) => mapPixabayItem(item, true, idx));
  } 
  
  if (isImageOnly) {
    const res = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'aesthetic')}&image_type=photo&per_page=${perPage}&page=${page}&safesearch=true`);
    if (!res.ok) throw new Error(`Pixabay error status: ${res.status}`);
    const data = await res.json();
    return (data.hits || []).map((item, idx) => mapPixabayItem(item, false, idx));
  }

  // Blended (Photos + Videos)
  const videoCount = Math.max(3, Math.floor(perPage * 0.25));
  const imageCount = Math.max(1, perPage - videoCount);

  const [imageRes, videoRes] = await Promise.all([
    fetch(`https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'aesthetic')}&image_type=photo&per_page=${imageCount}&page=${page}&safesearch=true`),
    fetch(`https://pixabay.com/api/videos/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'nature')}&per_page=${videoCount}&page=${page}&safesearch=true`)
  ]);

  if (imageRes.ok) {
    const data = await imageRes.json();
    (data.hits || []).forEach((item, idx) => results.push(mapPixabayItem(item, false, idx)));
  }
  if (videoRes.ok) {
    const data = await videoRes.json();
    (data.hits || []).forEach((item, idx) => results.push(mapPixabayItem(item, true, idx)));
  }

  return results;
}

/**
 * Fetch from Unsplash (High quality photos)
 */
async function fetchUnsplashProvider({ searchTerm, category, mediaType, page, perPage }) {
  if (!UNSPLASH_KEY || UNSPLASH_KEY === 'tu-unsplash-access-key' || mediaType === 'videos' || category === 'videos') {
    return [];
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm || 'modern aesthetic')}&page=${page}&per_page=${perPage}&client_id=${encodeURIComponent(UNSPLASH_KEY)}`
  );

  if (!res.ok) throw new Error(`Unsplash error status: ${res.status}`);
  const data = await res.json();

  return (data.results || []).map((item, idx) => {
    const aspect = item.height > item.width * 1.3 ? 'aspect-[2/3]' : item.width > item.height * 1.3 ? 'aspect-[16/9]' : 'aspect-[3/4]';
    return normalizeMediaItem({
      id: `unsplash-${item.id}-${idx}`,
      title: item.alt_description || item.description || `${searchTerm || 'Fotografía'} HD`,
      type: 'image',
      mediaUrl: `${item.urls.regular}&auto=format&fit=crop&w=1080&q=80`,
      thumbnail: item.urls.small,
      category: category !== 'all' ? category : 'photography',
      author: {
        id: `unsplash-${item.user?.id || idx}`,
        name: item.user?.name || 'Unsplash Photographer',
        handle: `@${item.user?.username || 'unsplash'}`,
        avatar: item.user?.profile_image?.medium || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.username || idx}`
      },
      description: item.description || item.alt_description || 'Fotografía artística en Unsplash.',
      aspectRatio: aspect,
      likes: item.likes || 0,
      tags: item.tags?.map(t => t.title).slice(0, 4) || [category],
      sourceProvider: 'unsplash'
    });
  });
}

/**
 * Open Fallback Provider (No API key required)
 * Uses Picsum Photos (Images) + Curated Mixkit HD clips (Videos)
 */
function getOpenFallbackProvider({ searchTerm, category, mediaType, page, perPage }) {
  const items = [];
  const startIdx = (page - 1) * perPage;

  // Add Fallback Videos if videos are requested or media is blended
  if (mediaType === 'all' || mediaType === 'videos' || category === 'videos') {
    FALLBACK_VIDEOS.forEach((vid, i) => {
      items.push(normalizeMediaItem({
        id: `fallback-vid-${vid.id}-${page}-${i}`,
        title: `${vid.title} (${category !== 'all' ? category : 'HD'})`,
        type: 'video',
        mediaUrl: vid.url,
        thumbnail: vid.thumb,
        category: category !== 'all' ? category : 'videos',
        author: {
          id: `mixkit-${i}`,
          name: 'Mixkit Free Video',
          handle: '@mixkit_creators',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mixkit_${i}`
        },
        description: 'Video HD libre de derechos para creadores.',
        aspectRatio: vid.aspect,
        likes: Math.floor(25 + Math.random() * 80),
        tags: [category, 'video', 'hd', 'motion'],
        sourceProvider: 'mixkit'
      }));
    });
  }

  // Add Picsum photos
  if (mediaType === 'all' || mediaType === 'images' || category !== 'videos') {
    const imagesToGen = Math.min(perPage, 16);
    for (let i = 0; i < imagesToGen; i++) {
      const seed = ((startIdx + i + 1) * 37) % 997 + 10;
      const width = 800;
      const height = i % 2 === 0 ? 1200 : (i % 3 === 0 ? 800 : 1000);
      const aspect = height > width ? 'aspect-[2/3]' : (height === width ? 'aspect-[1/1]' : 'aspect-[16/9]');

      items.push(normalizeMediaItem({
        id: `picsum-${seed}-${page}-${i}`,
        title: `${searchTerm ? searchTerm.toUpperCase() : 'Inspiración Visual'} #${seed}`,
        type: 'image',
        mediaUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
        thumbnail: `https://picsum.photos/seed/${seed}/400/${Math.floor(height / 2)}`,
        category: category !== 'all' ? category : 'photography',
        author: {
          id: `picsum-artist-${seed}`,
          name: `Fotógrafo ${seed}`,
          handle: `@picsum_${seed}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=picsum_${seed}`
        },
        description: `Fotografía de alta resolución vía Picsum Photos.`,
        aspectRatio: aspect,
        likes: Math.floor(10 + Math.random() * 200),
        tags: [category, 'creative', 'art'],
        sourceProvider: 'picsum'
      }));
    }
  }

  return items;
}

/**
 * Main Multi-Provider Media Aggregator
 * Dispatches concurrent requests using Promise.allSettled for maximum resilience.
 */
export async function fetchFeedMedia({ 
  category = 'all', 
  query = '', 
  mediaType = 'all', 
  page = 1, 
  perPage = 40 
}) {
  const catObj = CATEGORIES.find(c => c.id === category);
  const resolvedCategoryQuery = catObj ? (catObj.id === 'all' ? '' : catObj.query) : category;
  const searchTerm = query.trim() || resolvedCategoryQuery || '';

  const queryParams = { searchTerm, category, mediaType, page, perPage };

  // Collect promises for all configured active providers
  const providerPromises = [];

  // Provider 1: Pixabay
  if (PIXABAY_KEY && PIXABAY_KEY !== 'tu-pixabay-api-key') {
    providerPromises.push(
      fetchPixabayProvider(queryParams).catch(err => {
        console.warn('[MultiProvider] Pixabay fetch failed:', err.message);
        return [];
      })
    );
  }

  // Provider 2: Unsplash
  if (UNSPLASH_KEY && UNSPLASH_KEY !== 'tu-unsplash-access-key') {
    providerPromises.push(
      fetchUnsplashProvider(queryParams).catch(err => {
        console.warn('[MultiProvider] Unsplash fetch failed:', err.message);
        return [];
      })
    );
  }

  // Execute external providers concurrently with resilience
  let settledResults = [];
  if (providerPromises.length > 0) {
    const results = await Promise.allSettled(providerPromises);
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        settledResults.push(...res.value);
      }
    });
  }

  // Fallback trigger: If no provider keys exist OR all API requests failed/were rate-limited (429)
  if (settledResults.length === 0) {
    const fallbackItems = getOpenFallbackProvider(queryParams);
    settledResults.push(...fallbackItems);
  }

  // Blend and randomize the results using Fisher-Yates shuffle
  const blendedFeed = shuffleArray(settledResults);

  return blendedFeed;
}
