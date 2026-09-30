import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types/job';

const SUBSCRIBERS_COLLECTION = 'subscribers';
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
      
      // Attempt to register subscriber token/record in Firestore
      try {
        const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await setDoc(doc(db, SUBSCRIBERS_COLLECTION, subscriberId), {
          endpoint: `browser_client_${navigator.userAgent.substring(0, 80)}`,
          subscribedAt: new Date().toISOString(),
          categories: ['all'],
        });
      } catch (err) {
        console.warn('Note: anonymous subscriber record could not be saved to Firestore:', err);
      }

      // Show welcome test notification
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

export function triggerJobNotification(newJob: Job): void {
  const isSubscribed = localStorage.getItem(LOCAL_STORAGE_NOTIFICATION_KEY) === 'true';
  if (!isSubscribed) return;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(`New Opening: ${newJob.title}`, {
      body: `${newJob.companyName} is hiring a ${newJob.workArrangement} ${newJob.title} in ${newJob.location}.`,
      icon: '/favicon.ico',
      tag: newJob.id,
    });
  }
}
