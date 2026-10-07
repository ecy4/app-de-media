/**
 * Media API Service
 * Only queries external services if valid API keys are explicitly configured in .env.
 * If no external keys are present, returns an empty array to ensure only real Supabase pins are shown.
 */

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export async function fetchFeedMedia({ category = 'all', query = '', mediaType = 'all', page = 1, perPage = 20 }) {
  const searchTerm = query.trim() || (category !== 'all' ? category : '');

  // 1. PEXELS API (If key is configured)
  if (PEXELS_KEY && PEXELS_KEY !== 'tu-pexels-api-key') {
    try {
      const isVideoQuery = mediaType === 'videos' || category === 'videos';
      const endpoint = isVideoQuery
        ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerm || 'creative')}&per_page=${perPage}&page=${page}`
        : `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm || 'design')}&per_page=${perPage}&page=${page}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: PEXELS_KEY }
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.photos || data.videos || [];
        if (items.length > 0) {
          return items.map((item, idx) => {
            const isVideo = Boolean(item.video_files);
            const authorName = item.user?.name || item.photographer || 'Pexels Creator';
            const authorHandle = `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

            return {
              id: `pexels-${item.id}-${idx}`,
              title: item.alt || `${searchTerm || 'Medio'} HD`,
              type: isVideo ? 'video' : 'image',
              mediaUrl: isVideo ? (item.video_files.find(v => v.quality === 'hd')?.link || item.video_files[0]?.link || '') : item.src.large2x,
              thumbnail: isVideo ? item.image : item.src.medium,
              category: category !== 'all' ? category : (isVideo ? 'videos' : 'photography'),
              author: {
                id: `pexels-${item.id}`,
                name: authorName,
                handle: authorHandle,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorHandle}`,
                role: 'user'
              },
              description: item.alt || 'Fotografía en alta resolución.',
              aspectRatio: isVideo ? 'aspect-[9/16]' : (item.height > item.width * 1.3 ? 'aspect-[2/3]' : item.width > item.height * 1.3 ? 'aspect-[16/9]' : 'aspect-[3/4]'),
              saved: false,
              likes: 0,
              tags: [category, 'pexels', 'hd'],
              comments: [],
              isExternal: true
            };
          });
        }
      }
    } catch (e) {
      console.warn('Pexels API error:', e);
    }
  }

  // 2. UNSPLASH API (If key is configured)
  if (UNSPLASH_KEY && UNSPLASH_KEY !== 'tu-unsplash-access-key' && (mediaType === 'all' || mediaType === 'images')) {
    try {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm || 'photography')}&page=${page}&per_page=${perPage}&client_id=${UNSPLASH_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((item, idx) => ({
            id: `unsplash-${item.id}-${idx}`,
            title: item.alt_description || item.description || `Inspiración visual`,
            type: 'image',
            mediaUrl: `${item.urls.regular}&auto=format&fit=crop&w=1000&q=80`,
            thumbnail: item.urls.small,
            category: category !== 'all' ? category : 'photography',
            author: {
              id: `unsplash-${item.user.id}`,
              name: item.user.name,
              handle: `@${item.user.username}`,
              avatar: item.user.profile_image?.medium || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.username}`,
              role: 'user'
            },
            description: item.description || item.alt_description || 'Fotografía en alta resolución.',
            aspectRatio: item.height > item.width * 1.3 ? 'aspect-[2/3]' : item.width > item.height * 1.3 ? 'aspect-[16/9]' : 'aspect-[3/4]',
            saved: false,
            likes: item.likes || 0,
            tags: item.tags?.map(t => t.title).slice(0, 4) || [category],
            comments: [],
            isExternal: true
          }));
        }
      }
    } catch (e) {
      console.warn('Unsplash API error:', e);
    }
  }

  // If no external keys are configured, return empty array (NO auto placeholders)
  return [];
}
