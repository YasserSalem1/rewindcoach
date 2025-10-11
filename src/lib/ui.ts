import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge arbitrary className inputs using clsx + tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.max(Math.floor(seconds % 60), 0);

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(Math.round(diff / minute), 1);
    return `${minutes}m ago`;
  }

  if (diff < day) {
    const hours = Math.max(Math.round(diff / hour), 1);
    return `${hours}h ago`;
  }

  const days = Math.max(Math.round(diff / day), 1);
  return `${days}d ago`;
}

export function formatNumber(num: number, fractionDigits = 1): string {
  if (!Number.isFinite(num)) {
    return "0";
  }

  return num.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

export function kdaString(kills: number, deaths: number, assists: number) {
  return `${kills}/${deaths}/${assists}`;
}
