import { buildCloudinaryUploadUrl } from './cloudinaryUpload';

describe('buildCloudinaryUploadUrl', () => {
  it('targets the auto/upload endpoint for the given cloud', () => {
    expect(buildCloudinaryUploadUrl('q12v8ih6')).toBe(
      'https://api.cloudinary.com/v1_1/q12v8ih6/auto/upload',
    );
  });
});
