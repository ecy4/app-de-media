/**
 * Multi-Provider Media Aggregator Service - Artist Reference Studio
 * 
 * Supports:
 * 1. Pixabay API (Images & Videos) - VITE_PIXABAY_API_KEY
 * 2. Unsplash API (Images) - VITE_UNSPLASH_ACCESS_KEY
 * 3. Open Fallbacks (Picsum Photos & Mixkit Free Videos)
 * 
 * Injects technical artistic keywords and handles orientation filtering:
 * 'all' | 'vertical' | 'horizontal'
 */

import { CATEGORIES } from '../constants/categories';

const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY;
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Curated high quality drawing and reference motion clips
const FALLBACK_VIDEOS = [
  {
    id: 'mixkit-figure-dancer',
    title: 'Movimiento del cuerpo humano y balance',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-breaking-on-the-beach-42358-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[9/16]'
  },
  {
    id: 'mixkit-drapery-cloth',
    title: 'Dinámica de telas y pliegues en movimiento',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-matrix-style-binary-code-animated-background-35301-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-dramatic-face',
    title: 'Estudio de claroscuro y sombras en rostro',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[9/16]'
  },
  {
    id: 'mixkit-urban-perspective',
    title: 'Perspectiva urbana arquitectónica',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-highway-in-the-middle-of-a-city-at-night-4433-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  }
];

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
    mediaUrl,
    media_url: mediaUrl,
    thumbnail: thumbnail || mediaUrl,
    type,
    media_type: type,
    category,
    author: {
      id: author?.id || `creator-${id}`,
      name: author?.name || 'Artista de Referencia',
      handle: author?.handle || '@referencia',
      avatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.handle || id}`,
      role: author?.role || 'user'
    },
    description: description || `Referencia visual curada desde ${sourceProvider}.`,
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

function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pixabay API with orientation support
 */
async function fetchPixabayProvider({ searchTerm, category, orientation = 'all', page, perPage }) {
  if (!PIXABAY_KEY || PIXABAY_KEY === 'tu-pixabay-api-key') {
    return [];
  }

  // Pixabay orientation parameter: "all", "horizontal", "vertical"
  const orientationParam = orientation === 'vertical' || orientation === 'horizontal' ? `&orientation=${orientation}` : '';
  const results = [];

  const mapPixabayItem = (item, isVideo, idx) => {
    const authorName = item.user || 'Pixabay Artist';
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
      title: item.tags ? item.tags.split(',')[0].trim() : `${searchTerm || 'Referencia'} HD`,
      type: isVideo ? 'video' : 'image',
      mediaUrl: isVideo ? videoUrl : (item.largeImageURL || item.webformatURL),
      thumbnail: isVideo
        ? (item.picture_id ? `https://i.vimeocdn.com/video/${item.picture_id}_640x360.jpg` : item.videos?.tiny?.url)
        : (item.webformatURL || item.previewURL),
      category: category !== 'all' ? category : 'anatomy-poses',
      author: {
        id: `pixabay-${item.user_id || item.id}`,
        name: authorName,
        handle: authorHandle,
        avatar: item.userImageURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorHandle}`
      },
      description: `Referencia visual: ${item.tags || 'Inspiración anatómica y artística.'}`,
      aspectRatio: aspect,
      likes: item.likes || 0,
      tags: tagsArray.slice(0, 4),
      sourceProvider: 'pixabay'
    });
  };

  const imageCount = perPage;
  const imageQueryUrl = `https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'art reference anatomy')}&image_type=photo${orientationParam}&per_page=${imageCount}&page=${page}&safesearch=true`;
  
  // Optionally fetch 2-3 technical videos if orientation is not strictly vertical
  const shouldFetchVideos = orientation !== 'vertical';
  const videoPromises = shouldFetchVideos
    ? fetch(`https://pixabay.com/api/videos/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'human movement')}&per_page=3&page=${page}&safesearch=true`).catch(() => null)
    : Promise.resolve(null);

  const [imageRes, videoRes] = await Promise.all([
    fetch(imageQueryUrl),
    videoPromises
  ]);

  if (imageRes.ok) {
    const data = await imageRes.json();
    (data.hits || []).forEach((item, idx) => results.push(mapPixabayItem(item, false, idx)));
  }

  if (videoRes && videoRes.ok) {
    const vData = await videoRes.json();
    (vData.hits || []).forEach((item, idx) => results.push(mapPixabayItem(item, true, idx)));
  }

  return results;
}

/**
 * Unsplash API with orientation support
 */
async function fetchUnsplashProvider({ searchTerm, category, orientation = 'all', page, perPage }) {
  if (!UNSPLASH_KEY || UNSPLASH_KEY === 'tu-unsplash-access-key') {
    return [];
  }

  // Unsplash orientation parameter: landscape, portrait, squarish
  let unsplashOri = '';
  if (orientation === 'vertical') unsplashOri = '&orientation=portrait';
  if (orientation === 'horizontal') unsplashOri = '&orientation=landscape';

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm || 'portrait figure lighting')}${unsplashOri}&page=${page}&per_page=${perPage}&client_id=${encodeURIComponent(UNSPLASH_KEY)}`
  );

  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
  const data = await res.json();

  return (data.results || []).map((item, idx) => {
    const aspect = item.height > item.width * 1.3 ? 'aspect-[2/3]' : item.width > item.height * 1.3 ? 'aspect-[16/9]' : 'aspect-[3/4]';
    return normalizeMediaItem({
      id: `unsplash-${item.id}-${idx}`,
      title: item.alt_description || item.description || `${searchTerm || 'Estudio de Arte'}`,
      type: 'image',
      mediaUrl: `${item.urls.regular}&auto=format&fit=crop&w=1200&q=85`,
      thumbnail: item.urls.small,
      category: category !== 'all' ? category : 'lighting-chiaroscuro',
      author: {
        id: `unsplash-${item.user?.id || idx}`,
        name: item.user?.name || 'Unsplash Artist',
        handle: `@${item.user?.username || 'unsplash'}`,
        avatar: item.user?.profile_image?.medium || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.username || idx}`
      },
      description: item.description || item.alt_description || 'Referencia fotográfica de alta fidelidad.',
      aspectRatio: aspect,
      likes: item.likes || 0,
      tags: item.tags?.map(t => t.title).slice(0, 4) || [category],
      sourceProvider: 'unsplash'
    });
  });
}

/**
 * Open Fallback Provider (Picsum & Mixkit)
 */
function getOpenFallbackProvider({ searchTerm, category, orientation = 'all', page, perPage }) {
  const items = [];
  const startIdx = (page - 1) * perPage;

  if (orientation !== 'vertical') {
    FALLBACK_VIDEOS.forEach((vid, i) => {
      items.push(normalizeMediaItem({
        id: `fallback-vid-${vid.id}-${page}-${i}`,
        title: vid.title,
        type: 'video',
        mediaUrl: vid.url,
        thumbnail: vid.thumb,
        category: category !== 'all' ? category : 'anatomy-poses',
        author: {
          id: `mixkit-${i}`,
          name: 'Mixkit Studio',
          handle: '@mixkit_drawing',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mixkit_${i}`
        },
        description: 'Referencia en movimiento para animación e ilustración.',
        aspectRatio: vid.aspect,
        likes: Math.floor(40 + Math.random() * 90),
        tags: [category, 'referencia', 'movimiento'],
        sourceProvider: 'mixkit'
      }));
    });
  }

  const imagesToGen = Math.min(perPage, 20);
  for (let i = 0; i < imagesToGen; i++) {
    const seed = ((startIdx + i + 1) * 31) % 997 + 10;
    
    // Adjust dimensions based on orientation
    let width = 800;
    let height = 1200;
    let aspect = 'aspect-[2/3]';

    if (orientation === 'horizontal') {
      width = 1200;
      height = 800;
      aspect = 'aspect-[16/9]';
    } else if (orientation === 'all' && i % 3 === 0) {
      width = 1200;
      height = 800;
      aspect = 'aspect-[16/9]';
    }

    items.push(normalizeMediaItem({
      id: `picsum-${seed}-${page}-${i}`,
      title: `${searchTerm ? searchTerm.toUpperCase() : 'Estudio de Referencia'} #${seed}`,
      type: 'image',
      mediaUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
      thumbnail: `https://picsum.photos/seed/${seed}/400/${Math.floor(height / 2)}`,
      category: category !== 'all' ? category : 'anatomy-poses',
      author: {
        id: `picsum-artist-${seed}`,
        name: `Artista ${seed}`,
        handle: `@picsum_${seed}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=picsum_${seed}`
      },
      description: 'Lámina de práctica fotográfica para ilustración.',
      aspectRatio: aspect,
      likes: Math.floor(15 + Math.random() * 150),
      tags: [category, 'anatomy', 'study'],
      sourceProvider: 'picsum'
    }));
  }

  return items;
}

/**
 * Main Multi-Provider Aggregator with Technical Query Injection and Orientation Filter
 */
export async function fetchFeedMedia({ 
  category = 'all', 
  query = '', 
  orientation = 'all',
  mediaType = 'all', 
  page = 1, 
  perPage = 40 
}) {
  const catObj = CATEGORIES.find(c => c.id === category);
  const resolvedCategoryQuery = catObj ? (catObj.id === 'all' ? 'human figure portrait reference' : catObj.query) : category;
  const searchTerm = query.trim() ? `${query.trim()} art reference` : resolvedCategoryQuery;

  const queryParams = { searchTerm, category, orientation, mediaType, page, perPage };

  const providerPromises = [];

  // 1. Pixabay
  if (PIXABAY_KEY && PIXABAY_KEY !== 'tu-pixabay-api-key') {
    providerPromises.push(
      fetchPixabayProvider(queryParams).catch(err => {
        console.warn('[MultiProvider] Pixabay failed:', err.message);
        return [];
      })
    );
  }

  // 2. Unsplash
  if (UNSPLASH_KEY && UNSPLASH_KEY !== 'tu-unsplash-access-key') {
    providerPromises.push(
      fetchUnsplashProvider(queryParams).catch(err => {
        console.warn('[MultiProvider] Unsplash failed:', err.message);
        return [];
      })
    );
  }

  let settledResults = [];
  if (providerPromises.length > 0) {
    const results = await Promise.allSettled(providerPromises);
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        settledResults.push(...res.value);
      }
    });
  }

  // Fallback if APIs are offline or limit 429
  if (settledResults.length === 0) {
    const fallbackItems = getOpenFallbackProvider(queryParams);
    settledResults.push(...fallbackItems);
  }

  return shuffleArray(settledResults);
}
