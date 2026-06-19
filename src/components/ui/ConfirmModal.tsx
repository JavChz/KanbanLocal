import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
}) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
          confirmBtnVariant: 'primary' as const,
        };
      case 'info':
        return {
          iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
          confirmBtnVariant: 'primary' as const,
        };
      case 'danger':
      default:
        return {
          iconColor: 'text-red-500 bg-red-50 dark:bg-red-950/30',
          confirmBtnVariant: 'danger' as const,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl flex-shrink-0 ${styles.iconColor}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/30">
          <Button variant="secondary" onClick={onClose}>
            {cancelText || t('cancel')}
          </Button>
          <Button variant={styles.confirmBtnVariant} onClick={handleConfirm}>
            {confirmText || t('confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
