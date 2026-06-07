/**
 * Client-side image compression using canvas.
 * Resizes to maxWidth/maxHeight and compresses to target quality.
 * Preserves original format (JPEG, PNG, WebP) — falls back to JPEG.
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, default 0.75
  } = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 900,
    quality = 0.75,
  } = options;

  // Determine output type — preserve original if supported, else JPEG
  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
  const outputType = supportedTypes.includes(file.type) ? file.type : "image/jpeg";

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // If image is already small enough and JPEG/WebP, skip compression
      if (width === img.naturalWidth && height === img.naturalHeight && file.size < 500 * 1024) {
        resolve(file);
        return;
      }

      // Draw to canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob — try original format first, fall back to JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback: try JPEG if original format failed
            if (outputType !== "image/jpeg") {
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) {
                    reject(new Error("Failed to compress image"));
                    return;
                  }
                  const name = file.name.replace(/\.[^.]+$/, ".jpg");
                  resolve(new File([jpegBlob], name, { type: "image/jpeg" }));
                },
                "image/jpeg",
                quality
              );
              return;
            }
            reject(new Error("Failed to compress image"));
            return;
          }

          const extMap: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
          };
          const ext = extMap[outputType] ?? "jpg";
          const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
          resolve(new File([blob], name, { type: outputType }));
        },
        outputType,
        // PNG doesn't use quality param, only JPEG/WebP do
        outputType === "image/png" ? undefined : quality
      );
    };

    img.onerror = () => {
      // If image can't be loaded (unsupported format), return original
      resolve(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
