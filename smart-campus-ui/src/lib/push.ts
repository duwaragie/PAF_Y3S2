import { api } from '@/lib/axios';

/**
 * Web Push opt-in/out flow.
 *
 * Lifecycle:
 *   - enable()  → request permission → fetch VAPID public key → subscribe via
 *                 browser PushManager → POST endpoint + keys to backend
 *   - disable() → unsubscribe browser-side → DELETE on backend
 *
 * Support requires HTTPS (localhost is exempt) + Service Worker + Push APIs.
 */

export type PushState =
  | 'unsupported'
  | 'denied'
  | 'granted-subscribed'
  | 'granted-unsubscribed'
  | 'default';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const standard = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(standard);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const pushSupported = (): boolean =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.warn('Service worker registration failed', err);
    return null;
  }
}

export async function getCurrentState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'default') return 'default';

  const reg = await navigator.serviceWorker.getRegistration();
  const existing = await reg?.pushManager.getSubscription();
  return existing ? 'granted-subscribed' : 'granted-unsubscribed';
}

export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';

  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'default';

  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
  if (!reg) return 'unsupported';

  // Fetch VAPID public key from backend (cached after first call by the browser).
  const { data } = await api.get<{ publicKey: string }>('/push/vapid-public-key');
  const appServerKey = urlBase64ToUint8Array(data.publicKey);

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey as BufferSource,
    });
  }

  const p256dh = bufferToBase64(subscription.getKey('p256dh'));
  const auth = bufferToBase64(subscription.getKey('auth'));

  await api.post('/push/subscribe', {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    userAgent: navigator.userAgent,
  });

  return 'granted-subscribed';
}

export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    try {
      await api.delete('/push/subscribe', { params: { endpoint: sub.endpoint } });
    } catch {
      /* backend cleanup is best-effort; we still unsubscribe locally */
    }
    try {
      await sub.unsubscribe();
    } catch {
      /* ignore */
    }
  }
  return Notification.permission === 'denied' ? 'denied' : 'granted-unsubscribed';
}
