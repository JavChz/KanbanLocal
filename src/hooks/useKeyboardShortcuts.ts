import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt modifier (ignoring other modifiers like Ctrl or Meta)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            navigate('/');
            break;
          case 'g':
            e.preventDefault();
            navigate('/global');
            break;
          case 's':
            e.preventDefault();
            navigate('/settings');
            break;
          case 'n':
            e.preventDefault();
            if (window.location.href.includes('/project/')) {
              // Dispatch custom event to trigger task creation form in the Todo stage
              window.dispatchEvent(new CustomEvent('trigger-add-todo'));
            } else {
              // Trigger project creation query param on Dashboard
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
