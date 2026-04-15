'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismissToast }: { toasts: Toast[]; dismissToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      maxWidth: '400px',
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '#22C55E' },
    error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '#EF4444' },
    info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: '#3B82F6' },
  };

  const icons = {
    success: <CheckCircle2 size={18} color={colors[toast.type].icon} />,
    error: <AlertCircle size={18} color={colors[toast.type].icon} />,
    info: <Info size={18} color={colors[toast.type].icon} />,
  };

  return (
    <div style={{
      padding: '14px 16px',
      background: colors[toast.type].bg,
      border: `1px solid ${colors[toast.type].border}`,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.3s ease-out',
    }}>
      {icons[toast.type]}
      <span style={{ flex: 1, fontSize: '0.85rem', color: '#EEF2FF', lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          color: '#4E647F',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
