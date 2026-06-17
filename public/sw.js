const CACHE_NAME = "knts-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;
  if (event.request.url.includes("/_next/webpack-hmr")) return;
  if (event.request.headers.get("RSC") === "1") return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        return response;
      } catch (error) {
        try {
          const cached = await caches.match(event.request);
          if (cached) return cached;
        } catch (cacheErr) {
          console.error("Cache match error:", cacheErr);
        }
        
        // PWA 설치 조건을 만족시키기 위해 네비게이션 요청에 대해 오프라인 200 응답 제공
        if (event.request.mode === 'navigate') {
          return new Response(
            `<!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>오프라인 상태</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 2rem; color: #333; }
                h1 { color: #000; }
              </style>
            </head>
            <body>
              <h1>오프라인 상태입니다</h1>
              <p>인터넷 연결을 확인한 후 다시 시도해주세요.</p>
              <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; background: #FEE500; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">새로고침</button>
            </body>
            </html>`,
            {
              status: 200,
              headers: new Headers({ "Content-Type": "text/html" }),
            }
          );
        }

        return new Response("Network Error", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" }),
        });
      }
    })()
  );
});
