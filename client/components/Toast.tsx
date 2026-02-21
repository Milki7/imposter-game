'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  avatar?: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColor = {
    info: 'bg-blue-600/90',
    warning: 'bg-amber-600/90',
    error: 'bg-red-600/90',
  }[toast.type];

  const borderColor = {
    info: 'border-blue-500/50',
    warning: 'border-amber-500/50',
    error: 'border-red-500/50',
  }[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgColor} border ${borderColor} shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      {toast.avatar && <span className="text-xl">{toast.avatar}</span>}
      <p className="text-white text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="ml-2 text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
