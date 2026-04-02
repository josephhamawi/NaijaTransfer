"use client";

import { useEffect, useRef, useState } from "react";
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
  success: "text-nigerian-green border-nigerian-green/30 bg-green-50 dark:bg-nigerian-green/10",
  error: "text-error-red border-error-red/30 bg-[var(--error-bg)]",
  info: "text-[#3b82f6] border-[#3b82f6]/30 bg-[#eff6ff] dark:bg-[#3b82f6]/10",
  warning: "text-gold-600 border-gold/30 bg-gold-100 dark:bg-[var(--gold-bg)]",
};

const progressColors: Record<NotificationType, string> = {
  success: "bg-nigerian-green",
  error: "bg-error-red",
  info: "bg-[#3b82f6]",
  warning: "bg-gold-600",
};

function ProgressBar({ duration, type }: { duration: number; type: NotificationType }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    // Trigger CSS transition on next frame
    requestAnimationFrame(() => setWidth(0));
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-[var(--radius-lg)]">
      <div
        className={cn("h-full opacity-40 transition-all ease-linear", progressColors[type])}
        style={{ width: `${width}%`, transitionDuration: `${duration}ms` }}
      />
    </div>
  );
}

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onDismiss(notification.id), 200);
  };

  const handleClick = () => {
    if (notification.href) {
      window.location.href = notification.href;
    }
    if (notification.onClick) {
      notification.onClick();
    }
    if (notification.href || notification.onClick) {
      handleDismiss();
    }
  };

  const isClickable = !!(notification.href || notification.onClick);

  const content = (
    <>
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
        {notification.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              notification.action!.onClick();
              handleDismiss();
            }}
            className={cn(
              "mt-2 px-3 py-1 rounded-[var(--radius-sm)]",
              "text-xs font-semibold",
              "bg-current/10 hover:bg-current/20",
              "border border-current/20",
              "transition-colors"
            )}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className={cn(
          "shrink-0 flex items-center justify-center",
          "w-6 h-6 min-w-[44px] min-h-[44px]",
          "rounded-[var(--radius-sm)]",
          "opacity-40 hover:opacity-100",
          "transition-opacity"
        )}
        aria-label="Dismiss notification"
      >
        <svg
          width="12"
          height="12"
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

      {/* Progress bar for auto-dismissing toasts */}
      {notification.duration && notification.duration > 0 && !notification.persistent && (
        <ProgressBar duration={notification.duration} type={notification.type} />
      )}
    </>
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={isClickable ? handleClick : undefined}
      className={cn(
        "relative flex items-start gap-3 p-4",
        "rounded-[var(--radius-lg)] border",
        "shadow-lg backdrop-blur-sm",
        "transition-all duration-200",
        isVisible && !isExiting
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0",
        typeClasses[notification.type],
        isClickable && "cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
        notification.persistent && "border-l-4"
      )}
    >
      {content}
    </div>
  );
}

/**
 * Toast container that renders all active notifications.
 * Positioned fixed at the top-right of the viewport.
 * Persistent banners stack at top, regular toasts below.
 */
export function ToastContainer() {
  const { notifications, removeNotification } = useToast();

  if (notifications.length === 0) return null;

  const persistent = notifications.filter((n) => n.persistent);
  const regular = notifications.filter((n) => !n.persistent);

  return (
    <>
      {/* Persistent banners — full-width at top */}
      {persistent.length > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-[101] flex flex-col"
          aria-label="Important notifications"
        >
          {persistent.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-center justify-center gap-3 px-4 py-3",
                "text-body-sm font-medium",
                "border-b",
                typeClasses[n.type]
              )}
            >
              <span className="shrink-0">{iconsByType[n.type]}</span>
              <span>
                <strong>{n.title}</strong>
                {n.message && <span className="opacity-80"> — {n.message}</span>}
              </span>
              {n.action && (
                <button
                  onClick={() => {
                    n.action!.onClick();
                    removeNotification(n.id);
                  }}
                  className="px-3 py-1 rounded-[var(--radius-sm)] text-xs font-bold border border-current/20 hover:bg-current/10 transition-colors"
                >
                  {n.action.label}
                </button>
              )}
              {n.href && (
                <a
                  href={n.href}
                  className="px-3 py-1 rounded-[var(--radius-sm)] text-xs font-bold border border-current/20 hover:bg-current/10 transition-colors"
                >
                  View
                </a>
              )}
              <button
                onClick={() => removeNotification(n.id)}
                className="shrink-0 ml-2 opacity-40 hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Dismiss"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Regular toasts — stacked at top-right */}
      {regular.length > 0 && (
        <div
          className={cn(
            "fixed top-4 right-4 z-[100]",
            "flex flex-col gap-2",
            "w-full max-w-sm",
            "pointer-events-none",
            persistent.length > 0 && "top-16"
          )}
          aria-label="Notifications"
        >
          {regular.map((n) => (
            <div key={n.id} className="pointer-events-auto">
              <ToastItem notification={n} onDismiss={removeNotification} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default ToastContainer;
