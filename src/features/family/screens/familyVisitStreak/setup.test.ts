import { buildVisitSetupPatch } from './setup';

describe('buildVisitSetupPatch', () => {
  it('requires an explicit cadence choice', () => {
    expect(buildVisitSetupPatch(null)).toBeNull();
  });

  it.each(['WEEKLY', 'MONTHLY'] as const)('builds one opt-in PATCH for %s', (cycleType) => {
    expect(buildVisitSetupPatch(cycleType)).toEqual({ enabled: true, cycleType });
  });
});
