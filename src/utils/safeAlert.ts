import { Alert } from 'react-native';
import { emitAlert, hasAlertListeners } from './alertBus';

export default function safeAlert(title: string, message?: string, buttons?: any) {
  try {
    console.warn('safeAlert:', title, message, buttons);
    // If an in-app alert listener is mounted show the modal via the bus
    if (hasAlertListeners()) {
      emitAlert({ title, message, buttons });
      return;
    }

    console.warn('No alert listeners, falling back to native Alert');
    // Fallback to native Alert
    if (buttons) {
      Alert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message);
    }
  } catch (err) {
    // if Alert failed (e.g., activity lost), log and swallow
    // eslint-disable-next-line no-console
    console.warn('safeAlert failed:', title, message, err);
  }
}
