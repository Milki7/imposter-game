'use client';

import { useEffect, useCallback } from 'react';

interface QuitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function QuitConfirmationModal({ isOpen, onClose, onConfirm }: QuitConfirmationModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="quit-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="quit-modal-title" className="text-lg font-bold text-white mb-2">
          Quit game?
        </h2>
        <p className="text-white/70 text-sm mb-6">
          You will leave the room. Other players will be notified.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-medium bg-red-600 hover:bg-red-500 text-white border border-red-500/50 transition-colors"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}
