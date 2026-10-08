import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "./env";

export const IMAGE_SIZES = [400, 800, 1600] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const KEY_RE = /^[A-Za-z0-9_-]{16,40}$/;

export function isValidKey(key: string) {
  return KEY_RE.test(key);
}

export function imagePath(key: string, size: ImageSize) {
  return path.join(path.resolve(env.uploadDir), key.slice(0, 2), `${key}_${size}.webp`);
}

/**
 * Bild prüfen, drehen (EXIF), Metadaten (inkl. GPS) entfernen und in drei Größen als WebP speichern.
 * Wirft bei ungültigen Dateien einen Fehler.
 */
export async function processAndStoreImage(input: Buffer) {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new Error("Datei ist zu groß (max. 15 MB).");
  const base = sharp(input, { failOn: "error", limitInputPixels: 60_000_000 }).rotate();
  const meta = await base.metadata();
  if (!meta.format || !["jpeg", "png", "webp", "heif", "avif", "gif", "tiff"].includes(meta.format)) {
    throw new Error("Nicht unterstütztes Bildformat.");
  }
  const key = randomBytes(16).toString("base64url");
  const dir = path.dirname(imagePath(key, 400));
  await mkdir(dir, { recursive: true });

  let width = 0;
  let height = 0;
  for (const size of IMAGE_SIZES) {
    const { data, info } = await base
      .clone()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: size === 400 ? 72 : 80 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(imagePath(key, size), data);
    if (size === 1600) {
      width = info.width;
      height = info.height;
    }
  }
  return { key, width, height };
}

export async function deleteStoredImage(key: string) {
  if (!isValidKey(key)) return;
  await Promise.all(IMAGE_SIZES.map((s) => rm(imagePath(key, s), { force: true })));
}
