const SHARED_IMAGE_CACHE = 'shared-image-v1';
const SHARED_IMAGE_KEY = '/shared-receipt';
const SHARED_META_KEY = '/shared-receipt-meta';

let pendingFile = null;

export function setPendingShare(file) {
  pendingFile = file;
}

export function takePendingShare() {
  const file = pendingFile;
  pendingFile = null;
  return file;
}

export function hasPendingShare() {
  return pendingFile !== null;
}

export async function consumeSharedImageFromCache() {
  const cache = await caches.open(SHARED_IMAGE_CACHE);
  const [imageResponse, metaResponse] = await Promise.all([
    cache.match(SHARED_IMAGE_KEY),
    cache.match(SHARED_META_KEY),
  ]);

  if (!imageResponse) return null;

  const blob = await imageResponse.blob();
  let filename = 'shared-receipt.jpg';
  let type = blob.type || 'image/jpeg';

  if (metaResponse) {
    try {
      const meta = await metaResponse.json();
      if (meta.filename) filename = meta.filename;
      if (meta.type) type = meta.type;
    } catch {
      // Use defaults when metadata is unavailable.
    }
  }

  await Promise.all([
    cache.delete(SHARED_IMAGE_KEY),
    cache.delete(SHARED_META_KEY),
  ]);

  return new File([blob], filename, { type });
}

export async function storeSharedImageInCache(file) {
  const cache = await caches.open(SHARED_IMAGE_CACHE);
  await Promise.all([
    cache.put(SHARED_IMAGE_KEY, new Response(file)),
    cache.put(
      SHARED_META_KEY,
      new Response(JSON.stringify({ filename: file.name, type: file.type })),
    ),
  ]);
}
