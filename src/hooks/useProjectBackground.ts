import { useEffect } from 'react';
import type { Project } from '../types/kanban';
import { BACKGROUND_IMAGES } from '../utils/backgrounds';

export const useProjectBackground = (activeProject: Project | null | undefined) => {
  useEffect(() => {
    const bgConfig = activeProject?.background;
    const isBgImage = bgConfig && (bgConfig.type === 'image' || bgConfig.type === 'custom');

    if (activeProject && bgConfig && bgConfig.type !== 'theme') {
      if (bgConfig.type === 'solid') {
        document.body.style.backgroundColor = bgConfig.value;
        document.body.style.removeProperty('--body-bg-image');
      } else {
        document.body.style.backgroundColor = '';
        const imgUrl = bgConfig.type === 'image'
          ? BACKGROUND_IMAGES[bgConfig.value]
          : bgConfig.value;
        if (imgUrl) {
          document.body.style.setProperty('--body-bg-image', `url(${imgUrl})`);
        } else {
          document.body.style.removeProperty('--body-bg-image');
        }
      }

      // Always keep body background image clear as we now render it via body::before
      document.body.style.backgroundImage = 'none';

      if (isBgImage) {
        document.body.classList.add('has-bg-image');
        document.body.classList.remove('has-bg-solid');
      } else {
        document.body.classList.add('has-bg-solid');
        document.body.classList.remove('has-bg-image');
      }
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.removeProperty('--body-bg-image');
      document.body.classList.remove('has-bg-image', 'has-bg-solid');
    }

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.removeProperty('--body-bg-image');
      document.body.classList.remove('has-bg-image', 'has-bg-solid');
    };
  }, [activeProject]);
};
