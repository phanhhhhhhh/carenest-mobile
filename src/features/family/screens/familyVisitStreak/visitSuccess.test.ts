import { showSuccessToast } from '../../../../shared/components/toastStore';
import { completeVisitConfirmation, VISIT_SUCCESS_MESSAGE } from './visitSuccess';

jest.mock('../../../../shared/components/toastStore', () => ({
  showSuccessToast: jest.fn(),
}));

describe('completeVisitConfirmation', () => {
  it('resets once, shows one toast, and refreshes Feed for the same elderly profile', async () => {
    const resetInput = jest.fn();
    const loadFeed = jest.fn().mockResolvedValue(undefined);

    await completeVisitConfirmation({ elderlyId: '27', loadFeed, resetInput });

    expect(resetInput).toHaveBeenCalledTimes(1);
    expect(showSuccessToast).toHaveBeenCalledTimes(1);
    expect(showSuccessToast).toHaveBeenCalledWith(VISIT_SUCCESS_MESSAGE);
    expect(loadFeed).toHaveBeenCalledWith('27');
  });
});
