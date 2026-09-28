import imageCompression from "browser-image-compression";

/**
 * Compress an image client-side before upload to keep payloads small and
 * uploads fast on rural / low-bandwidth mobile connections.
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: file.type,
  };
  try {
    return await imageCompression(file, options);
  } catch (err) {
    console.warn("Image compression failed, using original file:", err);
    return file;
  }
}
