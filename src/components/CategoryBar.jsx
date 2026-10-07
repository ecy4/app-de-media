import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

export default function CategoryBar({ 
  selectedCategory = 'all', 
  onSelectCategory 
}) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  return (
    <div className="relative w-full min-w-0 max-w-[1920px] mx-auto px-4 sm:px-6 py-2 group">
      {/* Subtle Left Scroll Button with Gradient Edge */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-4 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pr-6 pointer-events-none">
          <button
            onClick={() => handleScroll('left')}
            className="pointer-events-auto w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700/80 shadow-lg hover:bg-neutral-800 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Desplazar a la izquierda"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Categories Container */}
      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-2 px-1 scroll-smooth"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-neutral-900 text-white font-medium shadow-sm dark:bg-white dark:text-neutral-900 scale-[1.02]'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-normal dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 active:scale-95'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Subtle Right Scroll Button with Gradient Edge */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-4 bg-gradient-to-l from-neutral-950 via-neutral-950/80 to-transparent pl-6 pointer-events-none">
          <button
            onClick={() => handleScroll('right')}
            className="pointer-events-auto w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700/80 shadow-lg hover:bg-neutral-800 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Desplazar a la derecha"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
