"use client";

/**
 * DarkModeToggle -- re-exports ThemeToggle for backward compatibility.
 * The architecture spec references both DarkModeToggle and ThemeToggle.
 * They are the same component: cycles Light -> Dark -> System.
 */

export { ThemeToggle as default } from "./ThemeToggle";
