import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  overflowVisible?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  overflowVisible,
  size = 'md',
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full ${size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md'} glass-panel p-6 rounded-2xl shadow-2xl z-10 flex flex-col gap-4 animate-fade-in scale-100 max-h-[90vh] ${overflowVisible ? 'overflow-visible' : 'overflow-y-auto'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/30 pb-3">
          {title ? (
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};
