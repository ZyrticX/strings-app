
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X as CloseIcon, PauseCircle, PlayCircle } from 'lucide-react';

const STORY_DURATION = 10000; // 10 seconds

export default function HighlightStoryView({ highlightCategory, mediaItems, isOpen, onClose, getIconComponent }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const startTimer = () => {
    resetTimer();
    if (isPlaying && mediaItems.length > 1) {
      timerRef.current = setTimeout(() => {
        goToNext();
      }, STORY_DURATION);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsPlaying(true); // Start playing when story opens
    } else {
      resetTimer(); // Clear timer when story closes
    }
  }, [isOpen, mediaItems, highlightCategory]); // Reset index and start timer when items/category change or story opens


  useEffect(() => {
    if (isOpen && isPlaying) {
      startTimer();
    } else {
      resetTimer();
    }
    return () => resetTimer(); // Cleanup on unmount or before next effect run
  }, [currentIndex, isPlaying, isOpen, mediaItems.length]); // Re-run timer logic when these change

  if (!isOpen || !highlightCategory || !mediaItems || mediaItems.length === 0) {
    return null;
  }

  const currentItem = mediaItems[currentIndex];
  const IconComponent = getIconComponent(highlightCategory.icon_name);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleScreenTap = (event) => {
    const screenWidth = event.currentTarget.offsetWidth;
    const tapX = event.nativeEvent.offsetX;

    // For RTL: Left side of screen for NEXT, Right side for PREVIOUS
    if (tapX < screenWidth / 3) { // Left third (Next for RTL)
      goToNext();
    } else if (tapX > screenWidth * 2 / 3) { // Right third (Previous for RTL)
      goToPrevious();
    }
    // Middle third can be for play/pause or other actions if needed
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 m-0 max-w-full w-full h-full max-h-full sm:max-w-full sm:w-full sm:h-full bg-black/90 dark:bg-black/95 backdrop-blur-sm flex flex-col overflow-hidden"
        onClick={handleScreenTap} // Add click listener to the main content area
      >
        <DialogHeader className="flex flex-row items-center justify-between p-3 sm:p-4 text-white bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
              {IconComponent && <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold">{highlightCategory.name}</DialogTitle>
              <p className="text-xs sm:text-sm text-gray-300">
                תמונה {currentIndex + 1} מתוך {mediaItems.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePlayPause} className="text-white hover:bg-white/20 p-2 rounded-full">
              {isPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 p-2 rounded-full">
                <CloseIcon className="w-6 h-6" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Progress Bars Container */}
        {mediaItems.length > 1 && (
            <div className="absolute top-[calc(3.5rem+12px)] sm:top-[calc(4rem+16px)] left-2 right-2 z-20 px-1 sm:px-2">
                <div className={`grid grid-cols-${mediaItems.length} gap-1`}>
                    {mediaItems.map((_, idx) => (
                    <div key={idx} className="h-1 rounded-full bg-white/40 overflow-hidden">
                        {idx === currentIndex && isPlaying && (
                        <div 
                            className="h-full bg-white origin-left"
                            style={{ animation: `progressBar ${STORY_DURATION / 1000}s linear forwards` }}
                        />
                        )}
                        {idx === currentIndex && !isPlaying && <div className="h-full bg-white" />}
                        {idx < currentIndex && <div className="h-full bg-white" />}
                    </div>
                    ))}
                </div>
                 {/* Global CSS for progress bar animation */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes progressBar {
                        0% { transform: scaleX(0); }
                        100% { transform: scaleX(1); }
                    }
                `}} />
            </div>
        )}

        <div className="flex-1 flex items-center justify-center relative w-full h-full pt-16 sm:pt-20 pb-8 overflow-hidden">
          {currentItem && (currentItem.file_type === 'image' || !currentItem.file_url.toLowerCase().endsWith('.mp4')) ? (
            <img 
              src={currentItem.file_url} 
              alt={currentItem.caption || `Image ${currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl" 
            />
          ) : currentItem ? (
            <video 
              src={currentItem.file_url} 
              controls 
              autoPlay={isPlaying}
              muted // Often necessary for autoplay in browsers
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl bg-black"
              onEnded={goToNext} // Go to next when video ends
            />
          ) : (
            <div className="text-white text-center">טוען מדיה...</div>
          )}
        </div>

        {/* Clickable areas for navigation (invisible) - Spanning the entire height*/}
        {/* <div 
          className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
          onClick={goToPrevious} // For RTL, this should be next
          aria-label="Previous Story Item"
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-pointer"
          onClick={goToNext} // For RTL, this should be previous
          aria-label="Next Story Item"
        /> */}

        {/* Visible Buttons (optional, as tap is primary) */}
         {mediaItems.length > 1 && (
            <>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToPrevious} 
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 text-white bg-black/30 hover:bg-black/50 p-2 rounded-full"
                aria-label="הקודם"
            >
                <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNext} 
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 text-white bg-black/30 hover:bg-black/50 p-2 rounded-full"
                aria-label="הבא"
            >
                <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" />
            </Button>
            </>
        )}

        {currentItem && currentItem.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent text-center z-10">
            <p className="text-white text-sm sm:text-base line-clamp-2">{currentItem.caption}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
