import { confirmVisitNow } from './confirmVisitNow';

describe('confirmVisitNow', () => {
  it('confirms now without a note and reports success once', async () => {
    const confirmVisit = jest.fn().mockResolvedValue({ status: 'success' });
    const alert = jest.fn();
    const onSuccess = jest.fn();

    await confirmVisitNow({
      elderlyId: '5',
      confirmVisit,
      confirmationAlert: { alert },
      onSuccess,
      now: new Date('2026-09-14T03:15:20Z'),
    });

    expect(confirmVisit).toHaveBeenCalledWith('5', {
      visitedAt: '2026-09-14T10:15:20+07:00',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(alert).not.toHaveBeenCalled();
  });

  it('uses the shared duplicate flow and reuses the exact timestamp', async () => {
    const confirmVisit = jest
      .fn()
      .mockResolvedValueOnce({ status: 'possible_duplicate' })
      .mockResolvedValueOnce({ status: 'success' });
    const alert = jest.fn();
    const onSuccess = jest.fn();

    await confirmVisitNow({
      elderlyId: '5',
      confirmVisit,
      confirmationAlert: { alert },
      onSuccess,
      now: new Date('2026-09-14T03:15:20Z'),
    });
    alert.mock.calls[0][2][1].onPress();
    await Promise.resolve();
    await Promise.resolve();

    expect(confirmVisit).toHaveBeenNthCalledWith(2, '5', {
      visitedAt: '2026-09-14T10:15:20+07:00',
      confirmSeparateVisit: true,
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
