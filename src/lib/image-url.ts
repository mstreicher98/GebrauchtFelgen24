export function imageUrl(key: string, size: 400 | 800 | 1600 = 800) {
  return `/bilder/${key}/${size}`;
}

export function imageSrcSet(key: string) {
  return `${imageUrl(key, 400)} 400w, ${imageUrl(key, 800)} 800w, ${imageUrl(key, 1600)} 1600w`;
}
