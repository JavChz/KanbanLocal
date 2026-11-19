import { useEffect } from 'react';
import type { ProjectBackground } from '../types/kanban';
import { BACKGROUND_IMAGES } from '../utils/backgrounds';

function clearBodyBackground() {
  document.body.style.backgroundColor = '';
  document.body.style.backgroundImage = '';
  document.body.style.removeProperty('--body-bg-image');
  document.body.classList.remove('has-bg-image', 'has-bg-solid', 'bg-image-ready');
}

/**
 * Applies project background to document.body using primitive deps so task updates
 * never tear down and re-apply the active background mid-drag.
 */
export const useProjectBackground = (
  bgType?: ProjectBackground['type'],
  bgValue?: string
) => {
  useEffect(() => {
    let cancelled = false;

    if (!bgType || bgType === 'theme') {
      clearBodyBackground();
      return;
    }

    if (bgType === 'solid' && bgValue) {
      document.body.style.backgroundColor = bgValue;
      document.body.style.backgroundImage = 'none';
      document.body.style.removeProperty('--body-bg-image');
      document.body.classList.add('has-bg-solid');
      document.body.classList.remove('has-bg-image', 'bg-image-ready');
      return;
    }

    if (bgType === 'image' || bgType === 'custom') {
      const imgUrl = bgType === 'image' ? BACKGROUND_IMAGES[bgValue || ''] : bgValue;
      if (!imgUrl) {
        clearBodyBackground();
        return;
      }

      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = 'none';
      document.body.classList.add('has-bg-image');
      document.body.classList.remove('has-bg-solid');

      const nextCssValue = `url(${imgUrl})`;
      const currentCssValue = document.body.style.getPropertyValue('--body-bg-image');

      if (currentCssValue === nextCssValue && document.body.classList.contains('bg-image-ready')) {
        return;
      }

      const img = new Image();
      img.src = imgUrl;

      if (img.complete && img.naturalWidth > 0) {
        document.body.style.setProperty('--body-bg-image', nextCssValue);
        document.body.classList.add('bg-image-ready');
        return;
      }

      document.body.classList.remove('bg-image-ready');
      const revealImage = () => {
        if (cancelled) return;
        document.body.style.setProperty('--body-bg-image', nextCssValue);
        requestAnimationFrame(() => {
          if (!cancelled) {
            document.body.classList.add('bg-image-ready');
          }
        });
      };

      if (typeof img.decode === 'function') {
        img.decode().then(revealImage).catch(revealImage);
      } else {
        img.onload = revealImage;
        img.onerror = revealImage;
      }

      return () => {
        cancelled = true;
      };
    }

    clearBodyBackground();
  }, [bgType, bgValue]);

  useEffect(() => {
    return () => {
      clearBodyBackground();
    };
  }, []);
};
