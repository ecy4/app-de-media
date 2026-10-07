import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Flame, 
  Image as ImageIcon, 
  Video, 
  Layers, 
  TrendingUp,
  Loader2
} from 'lucide-react';
import MasonryGrid from './MasonryGrid';
import CategoryBar from './CategoryBar';
import { FEATURED_TRENDS } from '../constants/categories';

export default function ExploreView({ 
  pins, 
  savedPinIds, 
  selectedCategory = 'all',
  selectedOrientation = 'all',
  onSelectOrientation,
  onPinClick, 
  onToggleSave, 
  onShare, 
  onSelectCategory,
  onAuthorClick,
  onOpenCreatePin,
  onLoadMore,
  hasMore = true,
  isLoadingMore = false
}) {
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all' | 'image' | 'video'
  const observerTargetRef = useRef(null);

  // Setup infinite scroll IntersectionObserver
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: '350px' }
    );

    const currentEl = observerTargetRef.current;
    if (currentEl) observer.observe(currentEl);

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  const filteredPins = pins.filter((p) => {
    if (mediaTypeFilter === 'all') return true;
    return p.type === mediaTypeFilter;
  });

  return (
    <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-4 animate-fadeIn text-neutral-100">
      {/* Explore Banner */}
      <div className="mb-8 p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950 border border-neutral-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-xs font-bold mb-3 text-red-300">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Artist Reference Studio • Moodboard Hub
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Estación de referencias para dibujantes e ilustradores
          </h1>
          <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-lg">
            Descubre láminas fotográficas, modelos anatómicos, iluminación en claroscuro y fondos con perspectiva para tus proyectos de arte.
          </p>
        </div>

        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Trending Topics Grid */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#E60023]" />
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Colecciones de Estudio & Práctica
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {FEATURED_TRENDS.map((trend) => (
            <div
              key={trend.id}
              onClick={() => onSelectCategory(trend.category)}
              className="group relative h-40 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-800"
            >
              <img
                src={trend.image}
                alt={trend.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {trend.subtitle}
                </span>
                <h3 className="text-white font-bold text-xs sm:text-sm leading-snug mt-1 group-hover:underline">
                  {trend.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Bar inside Explore */}
      <div className="mb-6 -mx-2 sm:mx-0">
        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          selectedOrientation={selectedOrientation}
          onSelectOrientation={onSelectOrientation}
        />
      </div>

      {/* Media Type Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 pb-3 mb-6 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mediaTypeFilter === 'all'
                ? 'bg-[#E60023] text-white shadow-md shadow-red-600/20'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos los medios ({pins.length})</span>
          </button>

          <button
            onClick={() => setMediaTypeFilter('image')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mediaTypeFilter === 'image'
                ? 'bg-[#E60023] text-white shadow-md shadow-red-600/20'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Láminas fijas</span>
          </button>

          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mediaTypeFilter === 'video'
                ? 'bg-[#E60023] text-white shadow-md shadow-red-600/20'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos de movimiento</span>
          </button>
        </div>
      </div>

      {/* Explore Masonry Feed */}
      <MasonryGrid
        pins={filteredPins}
        savedPinIds={savedPinIds}
        onPinClick={onPinClick}
        onToggleSave={onToggleSave}
        onShare={onShare}
        onAuthorClick={onAuthorClick}
        onResetFilters={() => setMediaTypeFilter('all')}
        onOpenCreatePin={onOpenCreatePin}
      />

      {/* Infinite Scroll Sentinel and Status Indicator */}
      <div ref={observerTargetRef} className="py-10 flex flex-col items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-md border border-gray-100 text-xs font-bold text-gray-700 animate-fadeIn">
            <Loader2 className="w-4 h-4 text-[#E60023] animate-spin" />
            <span>Cargando más inspiración desde Pixabay...</span>
          </div>
        )}
        {!hasMore && pins.length > 50 && (
          <p className="text-xs text-gray-400 font-semibold mt-4">
            Has llegado al final de las tendencias de hoy ✨
          </p>
        )}
      </div>
    </div>
  );
}
