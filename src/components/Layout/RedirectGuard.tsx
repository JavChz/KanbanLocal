import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';

interface RedirectGuardProps {
  children: React.ReactNode;
}

export const RedirectGuard: React.FC<RedirectGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lastOpenedProject, projects } = useKanbanStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      if (location.pathname === '/' && lastOpenedProject && projects.some((p) => p.id === lastOpenedProject)) {
        // Replace history entry on startup to prevent back-button redirect loops
        navigate(`/project/${lastOpenedProject}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run check once on initial application mount

  return <>{children}</>;
};
