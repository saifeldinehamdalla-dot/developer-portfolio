const MEDIA_REFERENCE = /^media:[A-Za-z0-9_-]+$/;
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\\]/;

export function isHttpUrl(value: string): boolean {
  const candidate = value.trim();
  if (!candidate || CONTROL_OR_BACKSLASH.test(candidate)) return false;
  try {
    const url = new URL(candidate);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isSafeAssetReference(value: string): boolean {
  if (!value) return true;
  if (MEDIA_REFERENCE.test(value)) return true;
  if (isHttpUrl(value)) return true;
  return value.startsWith('/') && !value.startsWith('//') && !CONTROL_OR_BACKSLASH.test(value);
}

export function safeHttpUrl(value: string): string | null {
  return isHttpUrl(value) ? value.trim() : null;
}

export function mailtoHref(email: string): string {
  const address = email.trim();
  return address ? `mailto:${encodeURIComponent(address).replace(/%40/gi, '@')}` : '';
}
