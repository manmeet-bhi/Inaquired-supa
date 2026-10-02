import { supabase } from '../lib/supabase';
import { Job } from '../types/job';

const LOCAL_STORAGE_NOTIFICATION_KEY = 'inaquired_notifications_enabled';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isEnabled: boolean;
}

export function checkNotificationSupport(): NotificationState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { isSupported: false, permission: 'unsupported', isEnabled: false };
  }
  const isEnabled = localStorage.getItem(LOCAL_STORAGE_NOTIFICATION_KEY) === 'true';
  return {
    isSupported: true,
    permission: Notification.permission,
    isEnabled: isEnabled && Notification.permission === 'granted',
  };
}

export async function requestJobNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(LOCAL_STORAGE_NOTIFICATION_KEY, 'true');
      
      // Register subscriber in Supabase
      try {
        await supabase.from('subscribers').insert({
          endpoint: `browser_client_${navigator.userAgent.substring(0, 80)}`,
          subscribed_at: new Date().toISOString(),
          categories: ['all'],
        });
      } catch (err) {
        console.warn('Note: subscriber record could not be saved to Supabase:', err);
      }

      // Show welcome notification
      new Notification('inaquired Job Alerts Activated', {
        body: 'You will receive immediate alerts whenever high-quality verified roles are published.',
        icon: '/favicon.ico',
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to request notification permission:', err);
  }
  return false;
}

export function triggerJobNotification(job: Job): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(`New Opening: ${job.title}`, {
      body: `${job.companyName} • ${job.location}\nClick to view full role & requirements.`,
      icon: '/favicon.ico',
    });
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
  }
}
