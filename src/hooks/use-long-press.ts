import { useState, useEffect } from 'react';

interface LongPressOptions {
  duration?: number;
  onLongPress: () => void;
}

export function useLongPress({ duration = 500, onLongPress }: LongPressOptions) {
  const [startTime, setStartTime] = useState<number | null>(null);

  const [isLongPress, setIsLongPress] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (startTime) {
      timer = setTimeout(() => {
        setIsLongPress(true);
        onLongPress();
        setStartTime(null);
      }, duration);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [startTime, duration, onLongPress]);

  const clearTimer = () => {
    setStartTime(null);
    // Reset long press state after a short delay to allow preventing click
    setTimeout(() => setIsLongPress(false), 0);
  };

  return {
    onMouseDown: (e: React.MouseEvent) => {
      setStartTime(Date.now());
    },
    onMouseUp: (e: React.MouseEvent) => {
      if (isLongPress) {
        e.preventDefault();
      }
      clearTimer();
    },
    onMouseLeave: clearTimer,
    onTouchStart: (e: React.TouchEvent) => {
      setStartTime(Date.now());
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (isLongPress) {
        e.preventDefault();
      }
      clearTimer();
    },
  };
}