import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Flame } from 'lucide-react';
import { FEATURED_TRENDS } from '../constants/categories';

export default function FeaturedCarousel({ onSelectCollection }) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-[1920px] mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-[#E60023] rounded-lg">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Tendencias y Colecciones Destacadas
            </h2>
            <p className="text-xs text-gray-500 hidden sm:block">
              Inspiración visual seleccionada diariamente en la comunidad
            </p>
          </div>
        </div>

        {/* Carousel Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Cards */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth"
      >
        {FEATURED_TRENDS.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectCollection(item.category)}
            className="group relative flex-shrink-0 w-72 sm:w-80 h-44 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Background Image */}
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity" />

            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="self-start inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                Destacado
              </span>

              <div>
                <h3 className="text-white font-bold text-base sm:text-lg leading-tight group-hover:underline">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-xs mt-1">
                  {item.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
