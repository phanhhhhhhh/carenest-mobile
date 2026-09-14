import { showSuccessToast } from '../../../../shared/components/toastStore';

export const VISIT_SUCCESS_MESSAGE = 'Đã ghi nhận lượt về thăm.';

export async function completeVisitConfirmation({
  elderlyId,
  loadFeed,
  resetInput,
}: {
  elderlyId: string;
  loadFeed: (elderlyId: string) => Promise<void>;
  resetInput?: () => void;
}): Promise<void> {
  resetInput?.();
  showSuccessToast(VISIT_SUCCESS_MESSAGE);
  await loadFeed(elderlyId);
}
