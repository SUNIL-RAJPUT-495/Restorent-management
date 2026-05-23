import fs from 'fs';
import path from 'path';

export const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // Construct dynamically from incoming request
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}${imagePath}`;
};

export const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  
  // Only delete if it starts with /uploads/
  if (imagePath.startsWith('/uploads/')) {
    const relativePath = imagePath.substring(1); // Remove the leading slash -> "uploads/image-xxx.jpg"
    const absolutePath = path.resolve(relativePath);
    
    fs.unlink(absolutePath, (err) => {
      if (err) {
        console.error(`Failed to delete image file at ${absolutePath}:`, err.message);
      } else {
        console.log(`Successfully deleted image file at ${absolutePath}`);
      }
    });
  }
};
