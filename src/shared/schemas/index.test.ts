import {
  UserSchema,
  MedicationSchema,
  AppointmentSchema,
  safeParseOne,
  safeParseList,
} from './index';

describe('UserSchema', () => {
  it('coerces a numeric string id and keeps required fields', () => {
    const parsed = UserSchema.parse({
      id: '7',
      name: 'Linda',
      role: 'FAMILY',
      email: null,
      phone: '+84900000000',
    });
    expect(parsed).toMatchObject({ id: 7, name: 'Linda', role: 'FAMILY' });
  });

  it('rejects an unknown role', () => {
    expect(UserSchema.safeParse({ id: 1, name: 'x', role: 'ADMIN' }).success).toBe(false);
  });
});

describe('MedicationSchema', () => {
  it('accepts a minimal medication and stringifies the id', () => {
    const parsed = MedicationSchema.parse({ id: 12, name: 'Aspirin', dosage: '100mg' });
    expect(parsed.id).toBe('12');
    expect(parsed.schedule).toBeUndefined();
  });
});

describe('safeParseOne', () => {
  it('returns the parsed value on success', () => {
    const out = safeParseOne(
      AppointmentSchema,
      {
        id: '1',
        doctor: 'Dr A',
        datetime: '2026-01-01T09:00:00Z',
        status: 'SCHEDULED',
      },
      'test',
    );
    expect(out).not.toBeNull();
    expect(out!.doctor).toBe('Dr A');
  });

  it('returns null and warns (naming the bad field) on failure', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const out = safeParseOne(AppointmentSchema, { id: '1', doctor: 'Dr A' }, 'appt');
    expect(out).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('appt'), expect.anything());
    warn.mockRestore();
  });
});

describe('safeParseList', () => {
  it('drops invalid items but keeps the valid ones', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const raw = [
      { id: '1', doctor: 'A', datetime: 'x', status: 'SCHEDULED' },
      { id: '2' }, // invalid
      { id: '3', doctor: 'C', datetime: 'y', status: 'COMPLETED' },
    ];
    const out = safeParseList(AppointmentSchema, raw, 'list');
    expect(out.map((a) => a.id)).toEqual(['1', '3']);
  });

  it('returns [] when given a non-array', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(safeParseList(AppointmentSchema, { nope: true }, 'list')).toEqual([]);
  });
});
