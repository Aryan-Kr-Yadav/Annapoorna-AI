const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB pre-compression ceiling

export function validateImageFile(file) {
  if (!file) return "Please select an image.";
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Unsupported format. Please upload a JPG or PNG image.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Image is too large. Please choose a file under 8MB.";
  }
  return null;
}

export function validateSymptoms(text) {
  if (!text || text.trim().length < 10) {
    return "Please describe the symptoms in at least 10 characters.";
  }
  if (text.trim().length > 1500) {
    return "Description is too long (max 1500 characters).";
  }
  return null;
}
