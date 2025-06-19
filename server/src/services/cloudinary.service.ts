import { v2 as cloudinary } from 'cloudinary';

// Configuration (same as tutorial)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a user's profile image to a cloud storage service and transforms it to a specified format.
 *
 * @param buffer - The image data in buffer format.
 * @param username - The username associated with the user whose profile image is to be uploaded.
 * @return A promise that resolves with the URL of the uploaded image.
 */
export async function uploadProfileImage(buffer: Buffer, username: string): Promise<string> {
  try {
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString('base64')}`,
      {
        public_id: `user-${username}-${Date.now()}`,
        folder: 'strategy-town/profile-images',
        transformation: [
          { width: 200, height: 200, crop: 'fill' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
    );

    return uploadResult.secure_url;
  } catch (error) {
    throw new Error('Failed to upload image to Cloudinary');
  }
}
