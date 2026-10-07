export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window;
}
