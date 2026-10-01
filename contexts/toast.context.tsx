import React, { createContext, useCallback, useContext, useState } from 'react';
import Toast, { ToastProps } from 'components/Toast';

type ShowToast = (message: string, type?: ToastProps['type'], onClick?: () => void) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const showToast = useCallback<ShowToast>((message, type, onClick) => {
    setToast({ message, type, onClick });
    setToastKey((k) => k + 1);
  }, []);
  const close = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && <Toast key={toastKey} {...toast} onClose={close} />}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
