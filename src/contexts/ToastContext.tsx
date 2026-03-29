"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Notification, NotificationType } from "@/types";

interface ToastContextValue {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      duration: number = DEFAULT_DURATION
    ) => {
      const id = `toast-${++toastId}`;
      const notification: Notification = { id, type, title, message, duration };
      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback(
    (title: string, message?: string) =>
      addNotification("success", title, message),
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      addNotification("error", title, message, 8000),
    [addNotification]
  );

  const info = useCallback(
    (title: string, message?: string) =>
      addNotification("info", title, message),
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      addNotification("warning", title, message, 7000),
    [addNotification]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      success,
      error,
      info,
      warning,
    }),
    [notifications, addNotification, removeNotification, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
