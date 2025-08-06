import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ColorRule, LatLng } from "@/types"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function calculateCentroid(paths: LatLng[]): LatLng {
  let lat = 0, lng = 0;
  paths.forEach(p => {
    lat += p.lat;
    lng += p.lng;
  });
  return {
    lat: lat / paths.length,
    lng: lng / paths.length
  };
}


export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function getColorForValue(
  value: number,
  rules: ColorRule[],
  defaultColor: string = '#3b82f6'
): string {
  if (!rules || !rules.length) return defaultColor;

  const sortedRules = [...rules].sort((a, b) => b.value - a.value);
  for (const rule of sortedRules) {
    if (
      (rule.operator === '<' && value < rule.value) ||
      (rule.operator === '<=' && value <= rule.value) ||
      (rule.operator === '=' && value === rule.value) ||
      (rule.operator === '>=' && value >= rule.value) ||
      (rule.operator === '>' && value > rule.value)
    ) {
      return rule.color;
    }
  }
  return defaultColor;
}
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}