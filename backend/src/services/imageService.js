const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class ImageService {
  static async uploadImage(file, tier = 'free') {
    try {
      // Compress image based on tier
      const quality = tier === 'premium' ? 85 : 60;
      const maxWidth = tier === 'premium' ? 1920 : 800;
      
      // Process with sharp
      const processedBuffer = await sharp(file.buffer)
        .resize(maxWidth, maxWidth, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();
      
      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'uh-platform',
            resource_type: 'image',
            transformation: {
              quality: 'auto',
              fetch_format: 'auto'
            }
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              cloudinaryId: result.public_id
            });
          }
        ).end(processedBuffer);
      });
      
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }
  
  static async deleteImage(cloudinaryId) {
    try {
      return await cloudinary.uploader.destroy(cloudinaryId);
    } catch (error) {
      console.error('Image deletion error:', error);
    }
  }
}

module.exports = ImageService;