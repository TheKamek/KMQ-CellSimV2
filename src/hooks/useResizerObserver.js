// hooks/useResizeObserver.js
import { useEffect } from 'react';

export function useResizeObserver(elementRef, callback) {
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new ResizeObserver((entries) => {
      callback(entries[0]);
    });

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, callback]);
}