import {
  buildCloudinaryUploadUrl,
  isCloudinaryConfigured,
  uploadVoiceClip,
  CloudinaryNotConfiguredError,
} from './cloudinaryUpload';

describe('buildCloudinaryUploadUrl', () => {
  it('targets the auto/upload endpoint for the given cloud', () => {
    expect(buildCloudinaryUploadUrl('q12v8ih6')).toBe(
      'https://api.cloudinary.com/v1_1/q12v8ih6/auto/upload',
    );
  });
});

describe('cloudinary configuration guard', () => {
  const original = {
    name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    preset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  };

  afterEach(() => {
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME = original.name;
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = original.preset;
  });

  it('is not configured when either env var is missing', () => {
    delete process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    expect(isCloudinaryConfigured()).toBe(false);
  });

  it('is configured when both env vars are present', () => {
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME = 'q12v8ih6';
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'carenest_med_voice';
    expect(isCloudinaryConfigured()).toBe(true);
  });

  it('uploadVoiceClip rejects with a typed error when unconfigured', async () => {
    delete process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    await expect(uploadVoiceClip('file:///tmp/a.m4a', 'audio/mp4')).rejects.toBeInstanceOf(
      CloudinaryNotConfiguredError,
    );
  });
});
