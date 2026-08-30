/** Browser-only helpers for live photo capture, fingerprinting and location. */

export interface CapturedPhoto {
  dataUrl: string;
  hash: string;
  capturedAt: string;
  fromCamera: boolean;
  blob: Blob;
}

export interface GeoFix {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** Downscales and re-encodes a photo so uploads stay small and consistent. */
export async function compressImage(file: Blob, maxEdge = 1280): Promise<{ dataUrl: string; blob: Blob }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that photo.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process that photo."))),
      "image/jpeg",
      0.82,
    );
  });
  return { dataUrl, blob };
}

/** SHA-256 of the encoded photo — used for duplicate-photo detection. */
export async function hashDataUrl(dataUrl: string): Promise<string> {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function preparePhoto(file: Blob, fromCamera: boolean): Promise<CapturedPhoto> {
  const { dataUrl, blob } = await compressImage(file);
  return {
    dataUrl,
    blob,
    hash: await hashDataUrl(dataUrl),
    capturedAt: new Date().toISOString(),
    fromCamera,
  };
}

/** Location is required but graceful: a denial resolves to null, never throws. */
export function getGeoFix(timeoutMs = 12000): Promise<GeoFix | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: GeoFix | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        finish({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
        }),
      () => finish(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
    window.setTimeout(() => finish(null), timeoutMs + 500);
  });
}
