import { readFile } from "node:fs/promises";
import { IMAGE_SIZES, imagePath, isValidKey, type ImageSize } from "@/lib/images";

export async function GET(_req: Request, ctx: RouteContext<"/bilder/[key]/[size]">) {
  const { key, size } = await ctx.params;
  const s = Number(size) as ImageSize;
  if (!isValidKey(key) || !IMAGE_SIZES.includes(s)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(imagePath(key, s));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.byteLength),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
