import React from 'react';
import MediaCard from './MediaCard';
import { Sparkles, Plus } from 'lucide-react';

export default function MasonryGrid({ 
  pins, 
  savedPinIds = [],
  onPinClick, 
  onToggleSave, 
  onShare,
  onAuthorClick,
  onResetFilters,
  onOpenCreatePin 
}) {
  if (!pins || pins.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-[#E60023] mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">
          Aún no hay publicaciones en esta categoría
        </h3>
        <p className="text-sm text-neutral-400 max-w-md mt-2 mb-6">
          ¡Sé el primero en inspirar a la comunidad subiendo tus fotos o videos!
        </p>
        <div className="flex items-center gap-3">
          {onOpenCreatePin && (
            <button
              onClick={onOpenCreatePin}
              className="px-6 py-2.5 bg-[#E60023] hover:bg-[#ad081b] text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Crear el primer Pin</span>
            </button>
          )}
          <button
            onClick={onResetFilters}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-bold text-sm transition-all"
          >
            Explorar todas las categorías
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-4">
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 [column-fill:_balance]">
        {pins.map((pin) => (
          <MediaCard
            key={pin.id}
            pin={pin}
            savedPinIds={savedPinIds}
            onPinClick={onPinClick}
            onToggleSave={onToggleSave}
            onShare={onShare}
            onAuthorClick={onAuthorClick}
          />
        ))}
      </div>
    </div>
  );
}
