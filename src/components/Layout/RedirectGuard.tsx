import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../store/useKanbanStore';

let hasHandledStartupRedirect = false;

interface RedirectGuardProps {
  children: React.ReactNode;
}

export const RedirectGuard: React.FC<RedirectGuardProps> = ({ children }) => {
  const location = useLocation();
  const lastOpenedProject = useKanbanStore((s) => s.lastOpenedProject);
  const projects = useKanbanStore((s) => s.projects);

  const shouldRedirectOnStartup =
    !hasHandledStartupRedirect &&
    location.pathname === '/' &&
    Boolean(lastOpenedProject) &&
    projects.some((p) => p.id === lastOpenedProject);

  useEffect(() => {
    hasHandledStartupRedirect = true;
  }, []);

  if (shouldRedirectOnStartup && lastOpenedProject) {
    return <Navigate to={`/project/${lastOpenedProject}`} replace />;
  }

  return <>{children}</>;
};
