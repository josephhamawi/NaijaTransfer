"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import type { Notification, NotificationType } from "@/types";

const iconsByType: Record<NotificationType, React.ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M6.5 10.5L8.5 12.5L13.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M10 9v4M10 7h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M10 7v4M10 13h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const typeClasses: Record<NotificationType, string> = {
  success: "text-nigerian-green border-nigerian-green/30 bg-green-50 dark:bg-green-900/20",
  error: "text-error-red border-error-red/30 bg-red-50 dark:bg-[var(--error-bg)]",
  info: "text-[#3b82f6] border-[#3b82f6]/30 bg-[#eff6ff] dark:bg-[#1e293b]",
  warning: "text-gold-600 border-gold/30 bg-gold-100 dark:bg-[var(--gold-bg)]",
};

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 p-4",
        "rounded-[var(--radius-lg)] border",
        "shadow-md",
        "transition-all duration-300",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0",
        typeClasses[notification.type]
      )}
    >
      <span className="shrink-0 mt-0.5">
        {iconsByType[notification.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-body-sm">{notification.title}</p>
        {notification.message && (
          <p className="text-caption-style mt-0.5 opacity-80">
            {notification.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className={cn(
          "shrink-0 flex items-center justify-center",
          "w-8 h-8 min-w-[44px] min-h-[44px]",
          "rounded-[var(--radius-sm)]",
          "opacity-60 hover:opacity-100",
          "transition-opacity"
        )}
        aria-label="Dismiss notification"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast container that renders all active notifications.
 * Positioned fixed at the top-right of the viewport.
 * Announces to screen readers via aria-live.
 */
export function ToastContainer() {
  const { notifications, removeNotification } = useToast();

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[100]",
        "flex flex-col gap-2",
        "w-full max-w-sm",
        "pointer-events-none"
      )}
      aria-label="Notifications"
    >
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastItem notification={n} onDismiss={removeNotification} />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
