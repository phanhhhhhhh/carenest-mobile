import type { ConfirmVisitInput, ConfirmVisitResult } from '../../store/visitStreakStore';

interface ConfirmationAlert {
  alert: (
    title: string,
    message: string,
    buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[],
  ) => void;
}

interface SubmitVisitOptions {
  elderlyId: string;
  input: ConfirmVisitInput;
  confirmVisit: (elderlyId: string, input: ConfirmVisitInput) => Promise<ConfirmVisitResult>;
  confirmationAlert: ConfirmationAlert;
  onSuccess: () => void;
}

export async function submitVisitWithDuplicateConfirmation({
  elderlyId,
  input,
  confirmVisit,
  confirmationAlert,
  onSuccess,
}: SubmitVisitOptions): Promise<void> {
  const result = await confirmVisit(elderlyId, input);
  if (result.status === 'success') {
    onSuccess();
    return;
  }
  if (result.status !== 'possible_duplicate') return;

  let overrideSubmitting = false;
  confirmationAlert.alert(
    'Bạn đã xác nhận hôm nay',
    'Bạn đã ghi nhận một lượt về thăm trong ngày này. Đây có phải là một lượt thăm khác không?',
    [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Đúng, lượt khác',
        style: 'default',
        onPress: () => {
          if (overrideSubmitting) return;
          overrideSubmitting = true;
          void confirmVisit(elderlyId, { ...input, confirmSeparateVisit: true })
            .then((overrideResult) => {
              if (overrideResult.status === 'success') onSuccess();
            })
            .finally(() => {
              overrideSubmitting = false;
            });
        },
      },
    ],
  );
}
