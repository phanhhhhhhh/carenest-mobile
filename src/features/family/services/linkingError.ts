import { getErrorMessage, getStatus, isNetworkError } from '../../../core/api/errors';

export type LinkingFailureKind =
  | 'not_found'
  | 'already_linked'
  | 'premium_required'
  | 'forbidden'
  | 'invalid_request'
  | 'network'
  | 'server'
  | 'unknown';

export interface LinkingFailure {
  kind: LinkingFailureKind;
  message: string;
  retryable: boolean;
}

export function getLinkingFailure(
  error: unknown,
  operation: 'lookup' | 'request' | 'qr',
): LinkingFailure {
  const status = getStatus(error);
  const serverMessage = getErrorMessage(error);

  if (isNetworkError(error)) {
    return {
      kind: 'network',
      message: 'Không thể kết nối đến CareNest. Vui lòng kiểm tra mạng và thử lại.',
      retryable: true,
    };
  }
  if (status === 402) {
    return {
      kind: 'premium_required',
      message:
        serverMessage !== 'unknown error'
          ? serverMessage
          : 'Đã đạt giới hạn liên kết của gói hiện tại. Vui lòng nâng cấp Premium.',
      retryable: false,
    };
  }
  if (status === 409) {
    return {
      kind: 'already_linked',
      message: 'Yêu cầu kết nối này đã tồn tại hoặc hai tài khoản đã được kết nối.',
      retryable: false,
    };
  }
  if (status === 403) {
    return { kind: 'forbidden', message: 'Bạn không có quyền tạo kết nối này.', retryable: false };
  }
  if (status === 404) {
    return {
      kind: 'not_found',
      message:
        operation === 'lookup'
          ? 'Không tìm thấy tài khoản CareNest với số điện thoại này.'
          : 'Mã QR không hợp lệ hoặc đã hết hạn. Hãy nhờ người cao tuổi tạo mã mới.',
      retryable: operation === 'qr',
    };
  }
  if (status === 400) {
    return {
      kind: 'invalid_request',
      message:
        operation === 'qr'
          ? 'Mã QR không hợp lệ. Vui lòng quét lại mã do người cao tuổi vừa tạo.'
          : 'Thông tin kết nối không hợp lệ. Vui lòng kiểm tra và thử lại.',
      retryable: true,
    };
  }
  if (status != null && status >= 500) {
    return {
      kind: 'server',
      message: 'CareNest đang gặp sự cố. Vui lòng thử lại sau.',
      retryable: true,
    };
  }
  return {
    kind: 'unknown',
    message:
      serverMessage !== 'unknown error'
        ? serverMessage
        : operation === 'qr'
          ? 'Không thể sử dụng mã QR này. Vui lòng thử lại.'
          : 'Không thể gửi yêu cầu kết nối. Vui lòng thử lại.',
    retryable: true,
  };
}
