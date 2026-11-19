import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Module-level LIFO modal stack and ref-counted body scroll lock
const modalStack: symbol[] = [];
let activeLockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

function lockBodyScroll() {
  if (activeLockCount === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  activeLockCount++;
}

function unlockBodyScroll() {
  activeLockCount = Math.max(0, activeLockCount - 1);
  if (activeLockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  overflowVisible?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  style?: React.CSSProperties;
  className?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl w-[94vw]',
  full: 'max-w-[96vw] w-[96vw]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  overflowVisible,
  size = 'md',
  style,
  className = '',
  contentClassName = '',
  headerActions,
}) => {
  const titleId = useId();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const onCloseRef = useRef(onClose);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShouldRender(true);
    }
  }

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen && shouldRender) {
      const timer = window.setTimeout(() => {
        setShouldRender(false);
      }, 140);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Register on LIFO stack for Escape handling, ref-counted scroll lock, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    const token = Symbol('modal');
    modalStack.push(token);
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === token) {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      unlockBodyScroll();
      const idx = modalStack.lastIndexOf(token);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }
      const prevEl = previousActiveElementRef.current;
      if (prevEl && typeof prevEl.focus === 'function' && document.contains(prevEl)) {
        requestAnimationFrame(() => prevEl.focus());
      }
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const isClosing = !isOpen;
  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 dark:bg-slate-950/65 backdrop-blur-xs ${
          isClosing ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'
        }`}
        onClick={isClosing ? undefined : onClose}
      />

      {/* Modal Container */}
      <div
        style={style}
        className={`relative w-full ${sizeClasses[size] || 'max-w-md'} glass-panel bg-white dark:bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl z-10 flex flex-col gap-4 max-h-[90vh] ${
          isClosing ? 'animate-modal-exit pointer-events-none' : 'animate-modal-entrance'
        } ${overflowVisible ? 'overflow-visible' : 'overflow-y-auto'} ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 shrink-0">
          {title ? (
            <h3 id={titleId} className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-1.5">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`text-sm text-slate-600 dark:text-slate-300 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};
