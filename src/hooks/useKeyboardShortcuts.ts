import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Match documented Ctrl/Cmd + Alt + key combinations without hijacking browser defaults
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            navigate('/');
            break;
          case 'g':
            e.preventDefault();
            navigate('/global');
            break;
          case 'm':
            e.preventDefault();
            navigate('/matrix');
            break;
          case 's':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('trigger-open-settings'));
            break;
          case 'n':
            e.preventDefault();
            if (window.location.href.includes('/project/')) {
              window.dispatchEvent(new CustomEvent('trigger-add-todo'));
            } else {
              navigate('/?action=new-project');
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
};
