"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Use frosted glass effect (for upload widget overlay) */
  frosted?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Elevation shadow level */
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4 md:p-6",
  lg: "p-6 md:p-8",
};

const elevationClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

/**
 * Card component with NigeriaTransfer design tokens.
 *
 * Supports frosted glass effect for upload widget overlays,
 * and solid backgrounds for other contexts.
 * Uses --radius-lg (12px) for cards, --radius-xl (16px) for main widgets.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      frosted = false,
      padding = "md",
      elevation = "md",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)]",
          "border border-[var(--border-color)]",
          frosted
            ? "frosted-glass"
            : "bg-[var(--bg-elevated)]",
          elevationClasses[elevation],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/** Card header section */
function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

/** Card title */
function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-h3", className)} {...props}>
      {children}
    </h3>
  );
}

/** Card description text */
function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-body-sm text-[var(--text-secondary)]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/** Card content area */
function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/** Card footer section */
function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
