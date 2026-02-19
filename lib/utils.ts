import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Her kelimenin ilk harfini büyük, geri kalanını küçük yapar.
 * Türkçe karakterlere duyarlıdır (i → İ, ı → I).
 */
export function toTitleCase(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/(?:^|\s)\S/g, (char) => char.toLocaleUpperCase('tr-TR'))
}
