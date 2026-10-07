import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Compass, Smartphone, Monitor, LayoutGrid } from 'lucide-react';
import { CATEGORIES, ORIENTATIONS } from '../constants/categories';

export default function CategoryBar({ 
  selectedCategory, 
  onSelectCategory,
  selectedOrientation = 'all',
  onSelectOrientation
}) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Quick Orientation Filter Pills */}
      {onSelectOrientation && (
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-2xl border border-neutral-800 shadow-sm shrink-0 self-start md:self-auto">
          {ORIENTATIONS.map((ori) => {
            const isOriActive = selectedOrientation === ori.id;
            return (
              <button
                key={ori.id}
                onClick={() => onSelectOrientation(ori.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isOriActive
                    ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
                title={`Filtrar por orientación ${ori.label}`}
              >
                {ori.id === 'all' && <LayoutGrid className="w-3.5 h-3.5 text-[#E60023]" />}
                {ori.id === 'vertical' && <Smartphone className="w-3.5 h-3.5 text-blue-400" />}
                {ori.id === 'horizontal' && <Monitor className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{ori.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Horizontal Scrollable Categories Container */}
      <div className="relative flex-1 min-w-0 flex items-center">
        {/* Scroll Left Button */}
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 shadow-md hover:bg-neutral-800 absolute left-0 z-10 text-neutral-300 transition-all hover:scale-105"
          aria-label="Desplazar a la izquierda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth w-full px-1 md:px-8"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 border ${
                  isSelected
                    ? 'bg-[#E60023] text-white border-red-500 shadow-md shadow-red-600/20 scale-[1.02]'
                    : 'bg-neutral-900/90 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white active:scale-95'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => handleScroll('right')}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 shadow-md hover:bg-neutral-800 absolute right-0 z-10 text-neutral-300 transition-all hover:scale-105"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
