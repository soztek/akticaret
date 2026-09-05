import "server-only";
import { randomBytes } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// ============================================================
// Dosya yükleme soyutlaması.
// - Vercel Blob token'ı (herhangi bir *_READ_WRITE_TOKEN) varsa → Blob (kalıcı)
// - Yoksa → yerel public/uploads (yerel geliştirme). ⚠️ Vercel'de public/uploads
//   KALICI DEĞİL — üretimde Blob deposu bağlanmalı.
// ============================================================

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function extFor(type: string): string {
  return (
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" }[
      type
    ] ?? "bin"
  );
}

function blobToken(): string | undefined {
  const key = Object.keys(process.env).find((k) => k.endsWith("_READ_WRITE_TOKEN"));
  return key ? process.env[key] : undefined;
}

export async function saveUpload(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Desteklenmeyen dosya türü. JPG/PNG/WebP/GIF yükleyin.");
  if (file.size > MAX_BYTES) throw new Error("Dosya çok büyük (maks. 8MB).");

  const name = `${randomBytes(16).toString("hex")}.${extFor(file.type)}`;
  const token = blobToken();

  if (token) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`urunler/${name}`, file, {
      access: "public",
      token,
      contentType: file.type,
    });
    return url;
  }

  // Yerel disk
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}

export async function deleteUpload(url: string): Promise<void> {
  try {
    if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
    } else if (url.includes(".blob.vercel-storage.com")) {
      const token = blobToken();
      if (token) {
        const { del } = await import("@vercel/blob");
        await del(url, { token });
      }
    }
    // Harici CDN (ör. 2M Kale) URL'leri silinmez.
  } catch {
    // sessizce geç
  }
}
