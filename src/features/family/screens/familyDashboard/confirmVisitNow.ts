import type { ConfirmVisitInput, ConfirmVisitResult } from '../../store/visitStreakStore';
import { submitVisitWithDuplicateConfirmation } from '../familyVisitStreak/confirmationFlow';
import { createVisitDateOptions } from '../familyVisitStreak/visitDates';

interface ConfirmationAlert {
  alert: (
    title: string,
    message: string,
    buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[],
  ) => void;
}

export async function confirmVisitNow({
  elderlyId,
  confirmVisit,
  confirmationAlert,
  onSuccess,
  now,
}: {
  elderlyId: string;
  confirmVisit: (elderlyId: string, input: ConfirmVisitInput) => Promise<ConfirmVisitResult>;
  confirmationAlert: ConfirmationAlert;
  onSuccess: () => void;
  now?: Date;
}): Promise<void> {
  const visitedAt = createVisitDateOptions(now)[0].visitedAt;
  await submitVisitWithDuplicateConfirmation({
    elderlyId,
    input: { visitedAt },
    confirmVisit,
    confirmationAlert,
    onSuccess,
  });
}
