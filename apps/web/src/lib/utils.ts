import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateForBackend(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return new Date(d.getTime() - (d.getTimezoneOffset() * 60 * 1000)).toISOString().slice(0, 19);
}
