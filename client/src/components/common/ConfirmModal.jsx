import { useEffect, useRef } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  showInput = false,
  inputLabel = '',
  inputValue = '',
  onInputChange,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantColors = {
    danger: { bg: '#ef4444', hover: '#dc2626' },
    warning: { bg: '#f59e0b', hover: '#d97706' },
    primary: { bg: '#3b82f6', hover: '#2563eb' },
  };
  const colors = variantColors[variant] || variantColors.danger;

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div
        className="confirm-modal"
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        {showInput && (
          <div className="confirm-modal-input-group">
            {inputLabel && <label className="confirm-modal-input-label">{inputLabel}</label>}
            <textarea
              className="confirm-modal-input"
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              rows={3}
            />
          </div>
        )}
        <div className="confirm-modal-actions">
          <button
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="confirm-modal-btn confirm-modal-btn-confirm"
            style={{ background: colors.bg }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
