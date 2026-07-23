import { Alert as RNAlert, Platform } from 'react-native';

/**
 * react-native-web's Alert.alert() is a no-op (empty method body) — see
 * node_modules/react-native-web/dist/exports/Alert/index.js. Any screen that
 * relies on Alert.alert for validation/confirmation feedback silently does
 * nothing on web. This wraps it with a window.alert/confirm-based fallback
 * on web while delegating to the real native Alert everywhere else.
 */
type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    RNAlert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }

  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const actionBtn = buttons.find((b) => b !== cancelBtn) ?? buttons[buttons.length - 1];

  if (window.confirm(text)) {
    actionBtn.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}

export const Alert = { alert };
export default Alert;
