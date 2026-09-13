import api from '../../../core/api/client';

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
    super('Máy chủ chưa cấu hình tải giọng nhắc lên Cloudinary.');
    this.name = 'CloudinaryNotConfiguredError';
  }
}

/** Signed-upload credentials minted per request by the backend. */
interface VoiceUploadSignature {
  signature: string;
  timestamp: number | string;
  folder: string;
  apiKey: string;
  cloudName: string;
}

async function fetchUploadSignature(elderlyId: string): Promise<VoiceUploadSignature> {
  // The endpoint binds `elderlyId` to a Long; send it as a number when it is
  // one so the request doesn't lean on Jackson's string coercion.
  const numericId = Number(elderlyId);
  const resp = await api.post('/medications/voice-upload-signature', {
    elderlyId: Number.isFinite(numericId) ? numericId : elderlyId,
  });
  const data = (resp.data ?? {}) as Partial<VoiceUploadSignature>;
  if (!data.signature || !data.apiKey || !data.cloudName || data.timestamp == null) {
    throw new CloudinaryNotConfiguredError();
  }
  return data as VoiceUploadSignature;
}

/**
 * Uploads a recorded clip to Cloudinary and returns its `secure_url`.
 *
 * The upload is signed: the backend mints a short-lived signature for the
 * caller/elderly pair, so no Cloudinary credential (which an unsigned preset
 * effectively is) ships inside the app bundle. Throws
 * `CloudinaryNotConfiguredError` when the server has no Cloudinary set up, so
 * callers can surface that rather than a raw Cloudinary error.
 */
export async function uploadVoiceClip(
  uri: string,
  mimeType: string,
  elderlyId: string,
): Promise<string> {
  const signed = await fetchUploadSignature(elderlyId);

  const ext = mimeType.split('/').pop() || 'm4a';
  const form = new FormData();
  form.append('file', {
    uri,
    name: `reminder-voice.${ext}`,
    type: mimeType,
  } as unknown as Blob);
  // Signed uploads and unsigned presets are mutually exclusive modes — sending
  // `upload_preset` here would make Cloudinary ignore the signature.
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  if (signed.folder) form.append('folder', signed.folder);

  const resp = await fetch(buildCloudinaryUploadUrl(signed.cloudName), {
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
