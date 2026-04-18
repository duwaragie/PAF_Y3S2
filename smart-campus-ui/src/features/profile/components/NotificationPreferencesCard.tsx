import { useEffect, useState } from 'react';
import {
  notificationService,
  type NotificationPreferenceDTO,
} from '@/services/notificationService';
import { disablePush, enablePush, getCurrentState, pushSupported, type PushState } from '@/lib/push';

type Channel = {
  key: 'inApp' | 'email' | 'push';
  label: string;
  description: string;
  lockedOn?: boolean;
};

const CHANNELS: Channel[] = [
  {
    key: 'inApp',
    label: 'In-app',
    description: 'Bell icon and notifications page. Always on so you never miss an update.',
    lockedOn: true,
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Delivered to your registered email inbox.',
  },
  {
    key: 'push',
    label: 'Browser push',
    description: 'Desktop/mobile browser alert, even when the tab is closed. Requires permission.',
  },
];

function pushStatusText(state: PushState, pushPrefOn: boolean): string | null {
  if (state === 'unsupported') return 'Your browser doesn\'t support push notifications.';
  if (state === 'denied') return 'Notifications are blocked in your browser settings.';
  if (pushPrefOn && state === 'granted-unsubscribed') return 'Subscription lost — toggle off and back on to re-subscribe.';
  return null;
}

export default function NotificationPreferencesCard() {
  const [prefs, setPrefs] = useState<NotificationPreferenceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'email' | 'push' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>('default');

  useEffect(() => {
    notificationService
      .getPreferences()
      .then((res) => setPrefs(res.data))
      .catch(() => setError('Failed to load preferences.'))
      .finally(() => setLoading(false));

    if (pushSupported()) {
      void getCurrentState().then(setPushState);
    } else {
      setPushState('unsupported');
    }
  }, []);

  const toggleEmail = async () => {
    if (!prefs) return;
    const next = !prefs.email;
    setSaving('email');
    setPrefs({ ...prefs, email: next });
    try {
      await notificationService.updatePreferences({ email: next });
    } catch {
      setPrefs({ ...prefs });
      setError('Failed to save preference.');
    } finally {
      setSaving(null);
    }
  };

  const togglePush = async () => {
    if (!prefs) return;
    const turningOn = !prefs.push;
    setSaving('push');
    setError(null);

    try {
      if (turningOn) {
        const newState = await enablePush();
        setPushState(newState);
        if (newState !== 'granted-subscribed') {
          // Permission denied or unsupported — keep the preference off.
          if (newState === 'denied') setError('Browser push is blocked. Enable it in site settings to subscribe.');
          else if (newState === 'unsupported') setError('This browser doesn\'t support push notifications.');
          return;
        }
        setPrefs({ ...prefs, push: true });
        await notificationService.updatePreferences({ push: true });
      } else {
        const newState = await disablePush();
        setPushState(newState);
        setPrefs({ ...prefs, push: false });
        await notificationService.updatePreferences({ push: false });
      }
    } catch {
      setError('Failed to update push subscription.');
    } finally {
      setSaving(null);
    }
  };

  const statusMsg = prefs ? pushStatusText(pushState, prefs.push) : null;
  const pushDisabled = pushState === 'unsupported' || pushState === 'denied';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-campus-900">Notification preferences</h2>
        <p className="text-xs text-gray-500 mt-1">
          Choose how you want to receive notifications. In-app alerts are always on — email and browser push can be turned off.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      {loading || !prefs ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-campus-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {CHANNELS.map((ch) => {
            const isPush = ch.key === 'push';
            const on = ch.lockedOn ? true : prefs[ch.key as 'email' | 'push'];
            const isSaving = saving === ch.key;
            const disabled = ch.lockedOn || isSaving || (isPush && pushDisabled);
            const onChange = () => {
              if (ch.lockedOn || isSaving) return;
              if (ch.key === 'email') void toggleEmail();
              else if (ch.key === 'push') void togglePush();
            };
            return (
              <div key={ch.key} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-campus-900">{ch.label}</span>
                    {ch.lockedOn && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-campus-600 bg-campus-50 rounded px-1.5 py-0.5">
                        Always on
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{ch.description}</p>
                  {isPush && statusMsg && (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">{statusMsg}</p>
                  )}
                </div>
                <label
                  className={`shrink-0 inline-flex items-center gap-2 ${
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  } ${isSaving ? 'opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={onChange}
                    className="w-5 h-5 rounded border-gray-300 text-campus-600 focus:ring-campus-500 focus:ring-offset-0 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className={`text-xs font-semibold ${on ? 'text-campus-800' : 'text-gray-400'}`}>
                    {on ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
