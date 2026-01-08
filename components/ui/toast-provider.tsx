"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
};

const translations: Record<string, string> = {
  "User already registered": "Este usuario ya está registrado",
  "Invalid login credentials": "Credenciales inválidas",
  "Invalid login": "Datos de acceso incorrectos",
};

type ToastContextValue = {
  addToast: (toast: Omit<Toast, "id"> & { duration?: number }) => void;
  removeToast: (id: string) => void;
};

function translate(message?: string) {
  if (!message) return undefined;
  return translations[message] || message;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = "default", duration = 4500 }: Omit<Toast, "id"> & { duration?: number }) => {
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-5 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-5 py-4 shadow-md/40 bg-white/90 text-ink",
              toast.variant === "error" && "border-red-300 bg-red-50/90 text-red-700",
              toast.variant === "success" && "border-green-300 bg-green-50/90 text-green-700",
              toast.variant === "default" && "border-spaceMist/80"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{toast.title}</p>
                {toast.description && <p className="text-sm text-slate">{translate(toast.description)}</p>}
              </div>
              <button
                className="text-sm text-slate hover:text-ink"
                onClick={() => removeToast(toast.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
