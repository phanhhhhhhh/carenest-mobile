import { getErrorMessage, getResponseData, getStatus } from '../../../core/api/errors';
import type { CameraConsent } from '../store/cameraConsentStore';

export type CameraLinkFailureCode =
  | 'CAMERA_CONSENT_REQUIRED'
  | 'CAMERA_INVALID_INPUT'
  | 'CAMERA_ALREADY_LINKED'
  | 'IMOU_BOUND_TO_ANOTHER_ACCOUNT'
  | 'IMOU_INVALID_CREDENTIALS'
  | 'IMOU_INVALID_DEVICE_CODE'
  | 'IMOU_UNAVAILABLE'
  | 'IMOU_UNSUPPORTED_BINDING_FLOW'
  | 'IMOU_BINDING_NOT_CONFIRMED'
  | 'IMOU_PROVIDER_REJECTED'
  | 'REQUEST_IN_PROGRESS'
  | 'UNKNOWN';

export type CameraLinkResult =
  { ok: true } | { ok: false; code: CameraLinkFailureCode; message: string };

export interface CameraLinkInput {
  deviceSn: string;
  label: string;
}

const ERROR_MESSAGES: Partial<Record<CameraLinkFailureCode, string>> = {
  CAMERA_CONSENT_REQUIRED:
    'Người thân lớn tuổi cần đồng ý sử dụng camera trước khi bạn có thể liên kết.',
  CAMERA_INVALID_INPUT: 'Vui lòng kiểm tra lại số seri và tên phòng.',
  CAMERA_ALREADY_LINKED: 'Camera này đã được liên kết với một hồ sơ CareNest.',
  IMOU_BOUND_TO_ANOTHER_ACCOUNT: 'Camera này đang thuộc một tài khoản IMOU khác.',
  IMOU_INVALID_CREDENTIALS: 'CareNest chưa kết nối được với IMOU. Vui lòng liên hệ hỗ trợ.',
  IMOU_INVALID_DEVICE_CODE: 'Mã xác thực hoặc mật khẩu thiết bị không đúng.',
  IMOU_UNAVAILABLE: 'Dịch vụ IMOU đang tạm thời gián đoạn. Vui lòng thử lại sau.',
  IMOU_UNSUPPORTED_BINDING_FLOW:
    'Camera này cần được thiết lập bằng ứng dụng IMOU trước khi liên kết với CareNest.',
  IMOU_BINDING_NOT_CONFIRMED: 'IMOU chưa xác nhận quyền sở hữu camera. Vui lòng thử lại.',
  IMOU_PROVIDER_REJECTED: 'IMOU đã từ chối yêu cầu liên kết camera.',
  REQUEST_IN_PROGRESS: 'Yêu cầu liên kết đang được xử lý.',
};

export function normalizeCameraLinkInput(input: CameraLinkInput): CameraLinkInput {
  return {
    deviceSn: input.deviceSn.trim().toUpperCase(),
    label: input.label.trim().replace(/\s+/g, ' '),
  };
}

export function validateCameraLinkInput(input: CameraLinkInput): string | null {
  const normalized = normalizeCameraLinkInput(input);
  if (!normalized.deviceSn) return 'Vui lòng nhập số seri camera.';
  if (normalized.deviceSn.length > 64 || !/^[A-Z0-9_-]+$/.test(normalized.deviceSn)) {
    return 'Số seri chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.';
  }
  if (!normalized.label) return 'Vui lòng nhập tên phòng đặt camera.';
  if (normalized.label.length > 100) return 'Tên phòng không được vượt quá 100 ký tự.';
  return null;
}

export function cameraLinkFailure(error: unknown): Exclude<CameraLinkResult, { ok: true }> {
  const data = getResponseData(error);
  const providerCode =
    data && typeof data === 'object' && typeof (data as Record<string, unknown>).code === 'string'
      ? String((data as Record<string, unknown>).code)
      : undefined;

  if (providerCode && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, providerCode)) {
    const code = providerCode as CameraLinkFailureCode;
    return { ok: false, code, message: ERROR_MESSAGES[code]! };
  }

  const status = getStatus(error);
  if (status === 400 || status === 422) {
    return {
      ok: false,
      code: 'CAMERA_INVALID_INPUT',
      message: ERROR_MESSAGES.CAMERA_INVALID_INPUT!,
    };
  }
  if (status === 409) {
    return {
      ok: false,
      code: 'CAMERA_ALREADY_LINKED',
      message: ERROR_MESSAGES.CAMERA_ALREADY_LINKED!,
    };
  }
  if (status === 502 || status === 503 || status === 504) {
    return { ok: false, code: 'IMOU_UNAVAILABLE', message: ERROR_MESSAGES.IMOU_UNAVAILABLE! };
  }

  const backendMessage = getErrorMessage(error);
  return {
    ok: false,
    code: 'UNKNOWN',
    message:
      backendMessage === 'unknown error'
        ? 'Không thể liên kết camera lúc này. Vui lòng thử lại.'
        : backendMessage,
  };
}

export function getCameraLinkAvailability(
  consent: CameraConsent | undefined,
  isLoading: boolean,
): { allowed: boolean; reason: string | null } {
  if (isLoading) return { allowed: false, reason: 'Đang kiểm tra sự đồng ý sử dụng camera…' };
  if (!consent) {
    return { allowed: false, reason: 'Chưa tải được trạng thái đồng ý sử dụng camera.' };
  }
  if (consent.canLinkCamera && consent.status === 'ACCEPTED') {
    return { allowed: true, reason: null };
  }
  if (consent.status === 'DECLINED') {
    return {
      allowed: false,
      reason: 'Người thân lớn tuổi đã từ chối sử dụng camera. Không thể liên kết thiết bị.',
    };
  }
  return {
    allowed: false,
    reason: 'Người thân lớn tuổi cần đồng ý sử dụng camera trước khi liên kết thiết bị.',
  };
}
