export type CookieConsentStatus = 'accepted' | 'declined' | null;

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  preferences: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'inaquired_cookie_consent';
const PREFS_KEY = 'inaquired_cookie_preferences';
export const COOKIE_BANNER_EVENT = 'open-cookie-banner';

export function getCookieConsent(): CookieConsentStatus {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'accepted' || val === 'declined') {
      return val;
    }
  } catch {
    // In case storage is restricted
  }
  return null;
}

export function setCookieConsent(
  status: 'accepted' | 'declined',
  prefs?: Partial<CookiePreferences>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, status);
    const preferences: CookiePreferences = {
      essential: true,
      analytics: status === 'accepted' ? (prefs?.analytics ?? true) : false,
      preferences: status === 'accepted' ? (prefs?.preferences ?? true) : false,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.error('Failed to save cookie consent preference:', err);
  }
}

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function resetCookieConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
  } catch {
    // In case storage is restricted
  }
}

export function openCookieBanner(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COOKIE_BANNER_EVENT));
}
