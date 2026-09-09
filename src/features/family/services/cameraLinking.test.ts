import {
  cameraLinkFailure,
  getCameraLinkAvailability,
  normalizeCameraLinkInput,
  validateCameraLinkInput,
  type CameraLinkFailureCode,
} from './cameraLinking';
import type { CameraConsent } from '../store/cameraConsentStore';

const consent = (status: CameraConsent['status'], canLinkCamera: boolean): CameraConsent => ({
  elderlyId: 7,
  status,
  canLinkCamera,
  message: '',
});

describe('camera link input', () => {
  it('normalizes the serial and room label', () => {
    expect(normalizeCameraLinkInput({ deviceSn: ' ab-c_12 ', label: '  Phòng   khách ' })).toEqual({
      deviceSn: 'AB-C_12',
      label: 'Phòng khách',
    });
  });

  it.each([
    [{ deviceSn: '', label: 'Phòng khách' }, 'số seri'],
    [{ deviceSn: 'AB C', label: 'Phòng khách' }, 'chữ, số'],
    [{ deviceSn: 'ABC123', label: '' }, 'tên phòng'],
    [{ deviceSn: 'ABC123', label: 'x'.repeat(101) }, '100'],
  ])('rejects invalid input %#', (input, expected) => {
    expect(validateCameraLinkInput(input)).toContain(expected);
  });
});

describe('camera consent link availability', () => {
  it('allows linking only after accepted consent', () => {
    expect(getCameraLinkAvailability(consent('ACCEPTED', true), false)).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it.each([
    [undefined, false, 'Chưa tải'],
    [undefined, true, 'Đang kiểm tra'],
    [consent('PENDING', false), false, 'cần đồng ý'],
    [consent('DECLINED', false), false, 'đã từ chối'],
  ])('blocks linking without active consent %#', (value, loading, expected) => {
    const result = getCameraLinkAvailability(value, loading);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain(expected);
  });
});

describe('camera provider errors', () => {
  const expectedCodes: CameraLinkFailureCode[] = [
    'CAMERA_CONSENT_REQUIRED',
    'CAMERA_ALREADY_LINKED',
    'IMOU_BOUND_TO_ANOTHER_ACCOUNT',
    'IMOU_INVALID_CREDENTIALS',
    'IMOU_INVALID_DEVICE_CODE',
    'IMOU_UNAVAILABLE',
    'IMOU_UNSUPPORTED_BINDING_FLOW',
    'IMOU_BINDING_NOT_CONFIRMED',
    'IMOU_PROVIDER_REJECTED',
  ];

  it.each(expectedCodes)('maps %s to a specific user-facing message', (code) => {
    const result = cameraLinkFailure({ response: { status: 409, data: { code } } });
    expect(result.code).toBe(code);
    expect(result.message.length).toBeGreaterThan(20);
  });

  it('preserves an unknown backend explanation instead of blaming the serial number', () => {
    expect(
      cameraLinkFailure({ response: { status: 500, data: { error: 'Regional endpoint failed' } } }),
    ).toEqual({ ok: false, code: 'UNKNOWN', message: 'Regional endpoint failed' });
  });
});
