import { AppConfig } from '../../../core/config/appConfig';

/**
 * `auto` lets Cloudinary classify the asset; audio is stored under the `video`
 * resource type, so the returned `secure_url` looks like
 * `https://res.cloudinary.com/<cloud>/video/upload/.../clip.m4a`.
 */
export function buildCloudinaryUploadUrl(cloudName: string): string {
  return `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
}

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super('Cloudinary chưa được cấu hình (EXPO_PUBLIC_CLOUDINARY_*).');
    this.name = 'CloudinaryNotConfiguredError';
  }
}

/** True when both the cloud name and an unsigned preset are present. */
export function isCloudinaryConfigured(): boolean {
  return AppConfig.cloudinary !== null;
}

/**
 * Uploads a recorded clip to Cloudinary via an unsigned preset and returns its
 * `secure_url`. Throws `CloudinaryNotConfiguredError` when env vars are missing
 * so callers can hide the feature rather than surfacing a network error.
 */
export async function uploadVoiceClip(
  uri: string,
  mimeType: string,
  folder = 'carenest/medication-voice',
): Promise<string> {
  const config = AppConfig.cloudinary;
  if (!config) throw new CloudinaryNotConfiguredError();

  const ext = mimeType.split('/').pop() || 'm4a';
  const form = new FormData();
  form.append('file', {
    uri,
    name: `reminder-voice.${ext}`,
    type: mimeType,
  } as unknown as Blob);
  form.append('upload_preset', config.uploadPreset);
  form.append('folder', folder);

  const resp = await fetch(buildCloudinaryUploadUrl(config.cloudName), {
    method: 'POST',
    body: form,
  });

  const data = (await resp.json().catch(() => ({}))) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!resp.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Tải lên Cloudinary thất bại (HTTP ${resp.status}).`);
  }
  return data.secure_url;
}
