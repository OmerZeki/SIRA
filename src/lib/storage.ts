import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    "⚠️  Cloudinary credentials missing. Uploads will fail. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment."
  );
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Upload a file buffer to Cloudinary under an agency-specific folder.
 * @param fileBuffer  Raw file buffer
 * @param storagePath Path inside the agency folder, e.g. "applicants/123/passport"
 * @param contentType MIME type (e.g. "image/webp")
 */
export async function uploadFile(
  fileBuffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `sira/${storagePath}`,
        resource_type: "auto",
        overwrite: true,
        // Optional: eager transformations
        ...(contentType.startsWith("image/") && {
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        }),
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        return resolve(result.secure_url);
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
}

/**
 * Returns the same Cloudinary URL directly — no signed-URL logic needed
 * since Cloudinary URLs are already public (or secured via eager options).
 * If you ever need signed URLs, Cloudinary supports them via the SDK.
 */
export async function getSignedUrl(cloudinaryUrl: string): Promise<string> {
  // Cloudinary public URLs are already long-lived. No signature needed.
  return cloudinaryUrl;
}
