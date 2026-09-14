import { submitVisitWithDuplicateConfirmation } from './confirmationFlow';

describe('submitVisitWithDuplicateConfirmation', () => {
  it('opens the duplicate dialog and cancel makes no second request', async () => {
    const confirmVisit = jest.fn().mockResolvedValue({ status: 'possible_duplicate' });
    const alert = jest.fn();
    const onSuccess = jest.fn();

    await submitVisitWithDuplicateConfirmation({
      elderlyId: '1',
      input: { note: 'Keep me', visitedAt: '2026-09-14T08:00:00+07:00' },
      confirmVisit,
      confirmationAlert: { alert },
      onSuccess,
    });

    expect(alert).toHaveBeenCalledWith(
      'Bạn đã xác nhận trong ngày này',
      expect.any(String),
      expect.any(Array),
    );
    const buttons = alert.mock.calls[0][2];
    buttons[0].onPress?.();
    expect(confirmVisit).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('resubmits the same data with override and clears only after final success', async () => {
    const confirmVisit = jest
      .fn()
      .mockResolvedValueOnce({ status: 'possible_duplicate' })
      .mockResolvedValueOnce({ status: 'success' });
    const alert = jest.fn();
    const onSuccess = jest.fn();
    const input = { note: 'Keep me', visitedAt: '2026-09-14T08:00:00+07:00' };

    await submitVisitWithDuplicateConfirmation({
      elderlyId: '1',
      input,
      confirmVisit,
      confirmationAlert: { alert },
      onSuccess,
    });
    expect(onSuccess).not.toHaveBeenCalled();

    alert.mock.calls[0][2][1].onPress?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(confirmVisit).toHaveBeenNthCalledWith(2, '1', {
      ...input,
      confirmSeparateVisit: true,
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('ignores rapid repeated override taps while the request is pending', async () => {
    let resolveOverride: ((value: { status: 'success' }) => void) | undefined;
    const override = new Promise<{ status: 'success' }>((resolve) => {
      resolveOverride = resolve;
    });
    const confirmVisit = jest
      .fn()
      .mockResolvedValueOnce({ status: 'possible_duplicate' })
      .mockReturnValueOnce(override);
    const alert = jest.fn();
    const onSuccess = jest.fn();

    await submitVisitWithDuplicateConfirmation({
      elderlyId: '1',
      input: { note: 'Second' },
      confirmVisit,
      confirmationAlert: { alert },
      onSuccess,
    });
    const confirmOverride = alert.mock.calls[0][2][1].onPress;
    confirmOverride?.();
    confirmOverride?.();

    expect(confirmVisit).toHaveBeenCalledTimes(2);
    resolveOverride?.({ status: 'success' });
    await Promise.resolve();
    await Promise.resolve();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('clears immediately after a normal success without showing a dialog', async () => {
    const confirmVisit = jest.fn().mockResolvedValue({ status: 'success' });
    const alert = jest.fn();
    const onSuccess = jest.fn();

    await submitVisitWithDuplicateConfirmation({
      elderlyId: '1',
      input: { note: 'Visit' },
      confirmVisit,
      confirmationAlert: { alert },
      onSuccess,
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(alert).not.toHaveBeenCalled();
  });
});
