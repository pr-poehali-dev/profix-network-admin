const DEFAULTS = {
  avatar: { maxSize: 512, quality: 0.85 },
  cover: { maxSize: 1600, quality: 0.8 },
};

export type ImageKind = keyof typeof DEFAULTS;

/**
 * Ужимает картинку в браузере и возвращает data-URL в формате JPEG.
 * Нужно, чтобы аватарки и фоны помещались в базу, пока файловое
 * хранилище недоступно.
 */
export function compressImage(
  file: File,
  kind: ImageKind = "avatar",
): Promise<string> {
  const { maxSize, quality } = DEFAULTS[kind];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Не удалось открыть изображение"));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Браузер не поддерживает обработку изображений"));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let q = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", q);

        while (dataUrl.length > 640 * 1024 && q > 0.4) {
          q -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", q);
        }

        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/** Возвращает только base64-часть (без префикса data:...) */
export function stripDataUrl(dataUrl: string): string {
  return dataUrl.split(",")[1] || "";
}

export default compressImage;
