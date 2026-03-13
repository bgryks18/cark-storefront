import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * clsx + tailwind-merge kombinasyonu.
 * - clsx: koşullu / array / obje class birleştirme
 * - twMerge: çakışan Tailwind class'larını doğru şekilde çözümleme
 *   (ör. "px-4 px-8" → "px-8", "bg-red bg-blue" → "bg-blue")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
