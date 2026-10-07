import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

export default function CategoryBar({ selectedCategory, onSelectCategory }) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 py-2">
      <div className="flex items-center">
        {/* Scroll Left Button */}
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 absolute left-2 z-10 text-gray-700 transition-all hover:scale-105"
          aria-label="Desplazar a la izquierda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 scroll-smooth w-full"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 shrink-0 ${
                  isSelected
                    ? 'bg-[#111111] text-white shadow-sm scale-[1.02]'
                    : 'bg-[#efefef] text-[#111111] hover:bg-[#e2e2e2] active:scale-95'
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
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 absolute right-2 z-10 text-gray-700 transition-all hover:scale-105"
          aria-label="Desplazar a la derecha"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
