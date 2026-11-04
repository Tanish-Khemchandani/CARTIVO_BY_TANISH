import { apiUpload } from "./client";

// Upload product photos to the server. The server runs the real checks
// (format, dimensions, size, perceptual distinctness) and reports each file.
// Returns { data: [{ url, width, height, bytes }], rejected: [{ file, message }] }.
export function uploadProductPhotos(files) {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);
  return apiUpload("/uploads", formData);
}
