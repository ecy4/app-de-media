/**
 * Multi-Provider Media Aggregator Service - LayoutHub Creative Studio
 * 
 * Sources:
 * 1. Pixabay API (Images & Videos) - VITE_PIXABAY_API_KEY
 * 2. Unsplash API (Images) - VITE_UNSPLASH_ACCESS_KEY
 * 3. Open Fallbacks (Picsum & Mixkit Free Motion Backgrounds)
 * 
 * Specialized for:
 * Graphic Designers, Branding, Mockups, Packaging, Typography, UI Design.
 */

import { CATEGORIES } from '../constants/categories';

const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_API_KEY;
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Curated high quality motion graphics, 3D abstract mockups & typography loops
const FALLBACK_VIDEOS = [
  {
    id: 'mixkit-3d-gradient-motion',
    title: 'Animación de gradiente 3D holográfico',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-matrix-style-binary-code-animated-background-35301-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-typography-loop',
    title: 'Kinetic Typography & Motion Poster',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[9/16]'
  },
  {
    id: 'mixkit-packaging-render',
    title: 'Mockup de Packaging Minimalista en 3D',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-highway-in-the-middle-of-a-city-at-night-4433-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=640&q=80',
    aspect: 'aspect-[16/9]'
  },
  {
    id: 'mixkit-minimal-studio-cloth',
    title: 'Textura de seda abstracta para branding',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-breaking-on-the-beach-42358-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=640&q=80',
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
      id: author?.id || `designer-${id}`,
      name: author?.name || 'LayoutHub Creator',
      handle: author?.handle || '@layouthub_pro',
      avatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.handle || id}`,
      role: author?.role || 'user'
    },
    description: description || `Recurso de diseño gráfico y branding vía ${sourceProvider}.`,
    aspectRatio,
    aspect_ratio: aspectRatio,
    likes,
    likes_count: likes,
    saved: false,
    tags: Array.isArray(tags) ? tags : [category],
    comments: [],
    source_provider: sourceProvider,
    sourceProvider,
    isExternal: true,
    download_url: arguments[0].downloadUrl,
    license: arguments[0].license
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
 * Pixabay API with Design Keywords & Orientation
 */
async function fetchPixabayProvider({ searchTerm, category, orientation = 'all', page, perPage }) {
  if (!PIXABAY_KEY || PIXABAY_KEY === 'tu-pixabay-api-key') {
    return [];
  }

  const orientationParam = orientation === 'vertical' || orientation === 'horizontal' ? `&orientation=${orientation}` : '';
  const results = [];

  const mapPixabayItem = (item, isVideo, idx) => {
    const authorName = item.user || 'Graphic Designer';
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
      title: item.tags ? item.tags.split(',')[0].trim() : `${searchTerm || 'Diseño'} HD`,
      type: isVideo ? 'video' : 'image',
      mediaUrl: isVideo ? videoUrl : (item.largeImageURL || item.webformatURL),
      thumbnail: isVideo
        ? (item.picture_id ? `https://i.vimeocdn.com/video/${item.picture_id}_640x360.jpg` : item.videos?.tiny?.url)
        : (item.webformatURL || item.previewURL),
      category: category !== 'all' ? category : 'branding-logos',
      author: {
        id: `pixabay-${item.user_id || item.id}`,
        name: authorName,
        handle: authorHandle,
        avatar: item.userImageURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorHandle}`
      },
      description: `Inspiración de diseño: ${item.tags || 'Recurso gráfico para branding y mockups.'}`,
      aspectRatio: aspect,
      likes: item.likes || 0,
      tags: tagsArray.slice(0, 4),
      sourceProvider: 'pixabay'
    });
  };

  const imageCount = perPage;
  const imageQueryUrl = `https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'graphic design branding mockup')}&image_type=photo${orientationParam}&per_page=${imageCount}&page=${page}&safesearch=true`;
  
  const shouldFetchVideos = orientation !== 'vertical';
  const videoPromises = shouldFetchVideos
    ? fetch(`https://pixabay.com/api/videos/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(searchTerm || 'abstract motion graphics')}&per_page=3&page=${page}&safesearch=true`).catch(() => null)
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
 * Unsplash API with Design Keywords
 */
async function fetchUnsplashProvider({ searchTerm, category, orientation = 'all', page, perPage }) {
  if (!UNSPLASH_KEY || UNSPLASH_KEY === 'tu-unsplash-access-key') {
    return [];
  }

  let unsplashOri = '';
  if (orientation === 'vertical') unsplashOri = '&orientation=portrait';
  if (orientation === 'horizontal') unsplashOri = '&orientation=landscape';

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm || 'branding design typography poster mockup')}${unsplashOri}&page=${page}&per_page=${perPage}&client_id=${encodeURIComponent(UNSPLASH_KEY)}`
  );

  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
  const data = await res.json();

  return (data.results || []).map((item, idx) => {
    const aspect = item.height > item.width * 1.3 ? 'aspect-[2/3]' : item.width > item.height * 1.3 ? 'aspect-[16/9]' : 'aspect-[3/4]';
    return normalizeMediaItem({
      id: `unsplash-${item.id}-${idx}`,
      title: item.alt_description || item.description || `${searchTerm || 'Branding & Layout'}`,
      type: 'image',
      mediaUrl: `${item.urls.regular}&auto=format&fit=crop&w=1200&q=85`,
      thumbnail: item.urls.small,
      category: category !== 'all' ? category : 'branding-logos',
      author: {
        id: `unsplash-${item.user?.id || idx}`,
        name: item.user?.name || 'Studio Designer',
        handle: `@${item.user?.username || 'designer'}`,
        avatar: item.user?.profile_image?.medium || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.username || idx}`
      },
      description: item.description || item.alt_description || 'Identidad visual y recursos de diseño gráfico.',
      aspectRatio: aspect,
      likes: item.likes || 0,
      tags: item.tags?.map(t => t.title).slice(0, 4) || [category],
      sourceProvider: 'unsplash'
    });
  });
}

/**
 * Openverse API with Design Keywords (No Key Required)
 */
async function fetchOpenverseProvider({ searchTerm, category, orientation = 'all', page, perPage }) {
  let openverseOri = '';
  if (orientation === 'vertical') openverseOri = '&aspect_ratio=tall';
  if (orientation === 'horizontal') openverseOri = '&aspect_ratio=wide';

  const res = await fetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(searchTerm || 'creative design')}${openverseOri}&page=${page}&page_size=${perPage}&format=json`
  );

  if (!res.ok) throw new Error(`Openverse error: ${res.status}`);
  const data = await res.json();

  return (data.results || []).map((item, idx) => {
    return normalizeMediaItem({
      id: `openverse-${item.id}`,
      title: item.title || 'Creative Reference',
      type: 'image',
      mediaUrl: item.url || item.thumbnail,
      thumbnail: item.thumbnail || item.url,
      category: category !== 'all' ? category : 'openverse',
      author: {
        id: `openverse-user-${idx}`,
        name: item.creator || 'Openverse Contributor',
        handle: `@${(item.creator || 'openverse').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.creator || 'openverse'}`,
      },
      description: item.title || 'Creative Commons Media via Openverse',
      aspectRatio: 'aspect-[3/4]',
      likes: 0,
      tags: item.tags?.map(t => t.name).slice(0, 4) || [category],
      sourceProvider: 'openverse',
      downloadUrl: item.foreign_landing_url || item.url,
      license: item.license || 'CC'
    });
  });
}

/**
 * Open Fallback Provider for Graphic Designers
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
        category: category !== 'all' ? category : 'branding-logos',
        author: {
          id: `mixkit-studio-${i}`,
          name: 'Motion Studio Pro',
          handle: '@motion_branding',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=motion_${i}`
        },
        description: 'Loop cinemático para presentaciones y mockups en movimiento.',
        aspectRatio: vid.aspect,
        likes: Math.floor(45 + Math.random() * 110),
        tags: [category, 'motion', 'branding'],
        sourceProvider: 'mixkit'
      }));
    });
  }

  const imagesToGen = Math.min(perPage, 20);
  for (let i = 0; i < imagesToGen; i++) {
    const seed = ((startIdx + i + 1) * 31) % 997 + 10;
    
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
      title: `${searchTerm ? searchTerm.toUpperCase() : 'Layout & Branding Inspiration'} #${seed}`,
      type: 'image',
      mediaUrl: `https://picsum.photos/seed/${seed}/${width}/${height}`,
      thumbnail: `https://picsum.photos/seed/${seed}/400/${Math.floor(height / 2)}`,
      category: category !== 'all' ? category : 'branding-logos',
      author: {
        id: `studio-designer-${seed}`,
        name: `Studio Designer ${seed}`,
        handle: `@studio_${seed}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=studio_${seed}`
      },
      description: 'Mockup fotorrealista y referencia visual para diseñadores.',
      aspectRatio: aspect,
      likes: Math.floor(20 + Math.random() * 180),
      tags: [category, 'design', 'branding'],
      sourceProvider: 'picsum'
    }));
  }

  return items;
}

/**
 * Main Multi-Provider Aggregator for LayoutHub
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
  const resolvedCategoryQuery = catObj ? (catObj.id === 'all' ? 'graphic design visual inspiration' : catObj.query) : category;
  const searchTerm = query.trim() ? `${query.trim()} design mockup` : resolvedCategoryQuery;

  const queryParams = { searchTerm, category, orientation, mediaType, page, perPage };

  const providerPromises = [];

  // 1. Pixabay
  if (PIXABAY_KEY && PIXABAY_KEY !== 'tu-pixabay-api-key') {
    providerPromises.push(
      fetchPixabayProvider(queryParams).catch(err => {
        console.warn('[LayoutHub MultiProvider] Pixabay failed:', err.message);
        return [];
      })
    );
  }

  // 2. Unsplash
  if (UNSPLASH_KEY && UNSPLASH_KEY !== 'tu-unsplash-access-key') {
    providerPromises.push(
      fetchUnsplashProvider(queryParams).catch(err => {
        console.warn('[LayoutHub MultiProvider] Unsplash failed:', err.message);
        return [];
      })
    );
  }

  // 3. Openverse (Always active, no API key needed)
  providerPromises.push(
    fetchOpenverseProvider(queryParams).catch(err => {
      console.warn('[LayoutHub MultiProvider] Openverse failed:', err.message);
      return [];
    })
  );

  let settledResults = [];
  if (providerPromises.length > 0) {
    const results = await Promise.allSettled(providerPromises);
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        settledResults.push(...res.value);
      }
    });
  }

  if (settledResults.length === 0) {
    const fallbackItems = getOpenFallbackProvider(queryParams);
    settledResults.push(...fallbackItems);
  }

  return shuffleArray(settledResults);
}
