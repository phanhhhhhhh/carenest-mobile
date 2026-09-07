import { getHealthExportRange, startHealthReportExport } from './exportFlow';

const params = {
  elderlyId: '11',
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-31T00:00:00.000Z',
};

describe('family health PDF export flow', () => {
  it('lets a Premium user initiate export', async () => {
    const exportPdf = jest.fn().mockResolvedValue({ kind: 'shared', uri: 'file:///report.pdf' });

    await expect(startHealthReportExport(true, params, exportPdf)).resolves.toMatchObject({
      kind: 'shared',
    });
    expect(exportPdf).toHaveBeenCalledWith(params);
  });

  it('returns the upgrade state for a Free user without requesting bytes', async () => {
    const exportPdf = jest.fn();

    await expect(startHealthReportExport(false, params, exportPdf)).resolves.toEqual({
      kind: 'premium_required',
    });
    expect(exportPdf).not.toHaveBeenCalled();
  });

  it('uses the selected week or month period', () => {
    const now = new Date('2026-09-07T12:00:00.000Z');
    expect(getHealthExportRange('week', now).from).toBe('2026-08-31T12:00:00.000Z');
    expect(getHealthExportRange('month', now).from).toBe('2026-08-08T12:00:00.000Z');
  });
});
