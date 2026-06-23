import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const SHARE_TARGET_PATH = '/share-target';
const SHARED_IMAGE_CACHE = 'shared-image-v1';
const SHARED_IMAGE_KEY = '/shared-receipt';
const SHARED_META_KEY = '/shared-receipt-meta';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === SHARE_TARGET_PATH) {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image || typeof image === 'string') {
      return Response.redirect('/upload?shared=error', 303);
    }

    const cache = await caches.open(SHARED_IMAGE_CACHE);
    await Promise.all([
      cache.put(SHARED_IMAGE_KEY, new Response(image)),
      cache.put(
        SHARED_META_KEY,
        new Response(
          JSON.stringify({ filename: image.name, type: image.type }),
        ),
      ),
    ]);

    return Response.redirect('/upload?shared=1', 303);
  } catch {
    return Response.redirect('/upload?shared=error', 303);
  }
}
