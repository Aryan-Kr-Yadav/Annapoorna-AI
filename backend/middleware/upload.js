import multer from "multer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new Error("Unsupported file type. Please upload a JPG or PNG image.");
    err.statusCode = 400;
    return cb(err, false);
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
});
