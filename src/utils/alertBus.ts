type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AlertPayload = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

const listeners: Array<(p: AlertPayload) => void> = [];

export function onAlert(fn: (p: AlertPayload) => void) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function emitAlert(p: AlertPayload) {
  // copy to avoid mutation issues
  const copy = listeners.slice();
  copy.forEach((l) => {
    try {
      l(p);
    } catch (e) {
      // noop
    }
  });
}

export function hasAlertListeners() {
  return listeners.length > 0;
}

export default {
  onAlert,
  emitAlert,
  hasAlertListeners,
};
