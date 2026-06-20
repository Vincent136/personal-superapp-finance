import { supabase } from "../../../lib/supabase";

export function compressImage(file, maxWidth = 1200, quality = 0.72) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height / width) * maxWidth);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function pickImageFile(accept = "image/*") {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

// Converts a base64 data URL to a Blob for upload.
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Uploads a compressed base64 image to Supabase Storage.
// Returns the public URL.
export async function uploadTripImage(base64DataUrl, userId, tripId) {
  const blob = dataUrlToBlob(base64DataUrl);
  const path = `${userId}/${tripId}/${crypto.randomUUID()}.jpg`;

  const { data, error } = await supabase.storage
    .from("trip-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from("trip-images")
    .getPublicUrl(data.path);

  return publicUrl;
}

// Deletes an image from Supabase Storage given its public URL.
export async function deleteTripImage(publicUrl) {
  const match = publicUrl?.match?.(/trip-images\/(.+)$/);
  const path = match?.[1];
  if (!path) return;
  await supabase.storage.from("trip-images").remove([path]);
}
