'use client';

import { useEffect, useState } from 'react';

const ANIMATION_MS = 200;

export function useModalAnimation(onClose: () => void) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  function handleClose(callback?: () => void) {
    setIsVisible(false);
    setTimeout(callback ?? onClose, ANIMATION_MS);
  }

  return { isVisible, handleClose };
}
