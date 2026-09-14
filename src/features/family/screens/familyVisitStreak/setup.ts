import type { VisitCycleType, VisitSettingsPatch } from '../../store/visitStreakStore';

export function buildVisitSetupPatch(selection: VisitCycleType | null): VisitSettingsPatch | null {
  return selection ? { enabled: true, cycleType: selection } : null;
}
