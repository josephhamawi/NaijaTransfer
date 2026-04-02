"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Notification, NotificationType, NotificationAction } from "@/types";

interface ToastOptions {
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: NotificationAction;
  href?: string;
  onClick?: () => void;
}

interface ToastContextValue {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    title: string,
    options?: ToastOptions
  ) => string;
  removeNotification: (id: string) => void;
  success: (title: string, messageOrOpts?: string | ToastOptions) => string;
  error: (title: string, messageOrOpts?: string | ToastOptions) => string;
  info: (title: string, messageOrOpts?: string | ToastOptions) => string;
  warning: (title: string, messageOrOpts?: string | ToastOptions) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

const DEFAULT_DURATION = 5000;

function normalizeOpts(messageOrOpts?: string | ToastOptions): ToastOptions {
  if (!messageOrOpts) return {};
  if (typeof messageOrOpts === "string") return { message: messageOrOpts };
  return messageOrOpts;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      options: ToastOptions = {}
    ): string => {
      const id = `toast-${++toastId}`;
      const duration = options.persistent ? 0 : (options.duration ?? DEFAULT_DURATION);
      const notification: Notification = {
        id,
        type,
        title,
        message: options.message,
        duration,
        persistent: options.persistent,
        action: options.action,
        href: options.href,
        onClick: options.onClick,
      };
      setNotifications((prev) => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  const success = useCallback(
    (title: string, messageOrOpts?: string | ToastOptions): string =>
      addNotification("success", title, normalizeOpts(messageOrOpts)),
    [addNotification]
  );

  const error = useCallback(
    (title: string, messageOrOpts?: string | ToastOptions): string =>
      addNotification("error", title, {
        duration: 8000,
        ...normalizeOpts(messageOrOpts),
      }),
    [addNotification]
  );

  const info = useCallback(
    (title: string, messageOrOpts?: string | ToastOptions): string =>
      addNotification("info", title, normalizeOpts(messageOrOpts)),
    [addNotification]
  );

  const warning = useCallback(
    (title: string, messageOrOpts?: string | ToastOptions): string =>
      addNotification("warning", title, {
        duration: 7000,
        ...normalizeOpts(messageOrOpts),
      }),
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
