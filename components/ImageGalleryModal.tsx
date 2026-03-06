
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ isOpen, onClose, images, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start">
        <button 
            onClick={onClose} 
            className="p-2 bg-black/50 text-white rounded-full hover:bg-slate-800 transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-white font-medium text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
            {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center relative p-4 h-full" onClick={onClose}>
        <img 
            src={images[currentIndex]} 
            alt={`Gallery ${currentIndex}`} 
            className="max-h-full max-w-full object-contain cursor-default shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
        />
        
        {images.length > 1 && (
            <>
                <button 
                    onClick={prev} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                    onClick={next} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </>
        )}
      </div>
      
      {/* Thumbnails Strip */}
      <div className="h-24 bg-black/80 flex items-center gap-2 overflow-x-auto px-4 py-3 justify-center shrink-0 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
         {images.map((img, idx) => (
             <button 
                key={idx} 
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-200 ${
                    idx === currentIndex 
                    ? 'ring-2 ring-white opacity-100 scale-105' 
                    : 'opacity-40 hover:opacity-80'
                }`}
             >
                 <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
             </button>
         ))}
      </div>
    </div>,
    document.body
  );
};
