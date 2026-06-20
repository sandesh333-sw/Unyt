import { v2 as cloudinary } from "cloudinary";

// Server-only. Configured once at module load.
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Best-effort deletion of Cloudinary assets. Never throws — image cleanup
 * should not block (or roll back) a listing update/delete, so failures are
 * logged and swallowed.
 *
 * @param {string[]} publicIds
 */
export async function deleteImages(publicIds = []) {
    const ids = publicIds.filter(Boolean);
    if (ids.length === 0) return;

    const results = await Promise.allSettled(
        ids.map((id) => cloudinary.uploader.destroy(id))
    );

    results.forEach((result, i) => {
        if (result.status === "rejected") {
            console.error("Cloudinary deletion error:", ids[i], result.reason);
        }
    });
}

export default cloudinary;
