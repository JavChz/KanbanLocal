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
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && location.pathname === '/') {
      isInitialMount.current = false;
      if (lastOpenedProject && projects.some((p) => p.id === lastOpenedProject)) {
        // Replace history entry to prevent back-button redirect loops
        navigate(`/project/${lastOpenedProject}`, { replace: true });
      }
    }
  }, [location.pathname, lastOpenedProject, projects, navigate]);

  return <>{children}</>;
};
