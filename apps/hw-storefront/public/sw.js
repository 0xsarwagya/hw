if (!self.define) {
  let e,
    a = {};
  const n = (n, s) => (
    (n = new URL(n + ".js", s).href),
    a[n] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = n), (e.onload = a), document.head.appendChild(e);
        } else (e = n), importScripts(n), a();
      }).then(() => {
        const e = a[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (s, c) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (a[t]) return;
    const i = {};
    const r = (e) => n(e, t),
      o = { module: { uri: t }, exports: i, require: r };
    a[t] = Promise.all(s.map((e) => o[e] || r(e))).then((e) => (c(...e), i));
  };
}
define(["./workbox-3c9d0171"], (e) => {
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "/YT5tM2.png", revision: "20266ec66f82bf35fec585fdf242e649" },
        {
          url: "/_next/static/MXHROVBcZEyA1u2pO5BO9/_buildManifest.js",
          revision: "bceab693c3faaeb5e2b7b48fad4eab04",
        },
        {
          url: "/_next/static/MXHROVBcZEyA1u2pO5BO9/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/145bfb5b-fa7a58eaf50da337.js",
          revision: "fa7a58eaf50da337",
        },
        {
          url: "/_next/static/chunks/1889-b5cd83f50f62a020.js",
          revision: "b5cd83f50f62a020",
        },
        {
          url: "/_next/static/chunks/1954-c3560448b1cf95c8.js",
          revision: "c3560448b1cf95c8",
        },
        {
          url: "/_next/static/chunks/2094.99038e3e75fba822.js",
          revision: "99038e3e75fba822",
        },
        {
          url: "/_next/static/chunks/2355-4051b7cdede6fca1.js",
          revision: "4051b7cdede6fca1",
        },
        {
          url: "/_next/static/chunks/2550.6edfa99a8c7b8c0f.js",
          revision: "6edfa99a8c7b8c0f",
        },
        {
          url: "/_next/static/chunks/2638-02c3fb5fa45b6280.js",
          revision: "02c3fb5fa45b6280",
        },
        {
          url: "/_next/static/chunks/2687-5c3eac1941b79beb.js",
          revision: "5c3eac1941b79beb",
        },
        {
          url: "/_next/static/chunks/2785-4e9968a597020e30.js",
          revision: "4e9968a597020e30",
        },
        {
          url: "/_next/static/chunks/3867-271702b2f215c4ce.js",
          revision: "271702b2f215c4ce",
        },
        {
          url: "/_next/static/chunks/4186-092b1865addd0fa8.js",
          revision: "092b1865addd0fa8",
        },
        {
          url: "/_next/static/chunks/4969-ac264943922962f4.js",
          revision: "ac264943922962f4",
        },
        {
          url: "/_next/static/chunks/4995-46f5a6121c6ae29d.js",
          revision: "46f5a6121c6ae29d",
        },
        {
          url: "/_next/static/chunks/4998-18881b80892a8125.js",
          revision: "18881b80892a8125",
        },
        {
          url: "/_next/static/chunks/5238-68301d13d19e51df.js",
          revision: "68301d13d19e51df",
        },
        {
          url: "/_next/static/chunks/5438-fba631a226b1b3d2.js",
          revision: "fba631a226b1b3d2",
        },
        {
          url: "/_next/static/chunks/599-0c8176d9f9937fd7.js",
          revision: "0c8176d9f9937fd7",
        },
        {
          url: "/_next/static/chunks/6067-8703b6ec54237019.js",
          revision: "8703b6ec54237019",
        },
        {
          url: "/_next/static/chunks/6181-2aedd22bd3893230.js",
          revision: "2aedd22bd3893230",
        },
        {
          url: "/_next/static/chunks/6241-ad8aa684fa2c3399.js",
          revision: "ad8aa684fa2c3399",
        },
        {
          url: "/_next/static/chunks/6417-a601780f863176c4.js",
          revision: "a601780f863176c4",
        },
        {
          url: "/_next/static/chunks/8018-742b15a4fc6cb1a4.js",
          revision: "742b15a4fc6cb1a4",
        },
        {
          url: "/_next/static/chunks/8067-91566a4fe275d3c0.js",
          revision: "91566a4fe275d3c0",
        },
        {
          url: "/_next/static/chunks/8069-e7be441236b1c843.js",
          revision: "e7be441236b1c843",
        },
        {
          url: "/_next/static/chunks/8377.c7953a6f79388582.js",
          revision: "c7953a6f79388582",
        },
        {
          url: "/_next/static/chunks/8874-777ee0c312fa4208.js",
          revision: "777ee0c312fa4208",
        },
        {
          url: "/_next/static/chunks/9535.73c72dcff969185d.js",
          revision: "73c72dcff969185d",
        },
        {
          url: "/_next/static/chunks/9773-0e23593fd559d68b.js",
          revision: "0e23593fd559d68b",
        },
        {
          url: "/_next/static/chunks/9788-5e8f7f92ed6afc93.js",
          revision: "5e8f7f92ed6afc93",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(checkout)/checkout/failed/page-b8e8074d95c3652b.js",
          revision: "b8e8074d95c3652b",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(checkout)/checkout/page-79cb91b26d1c4ee2.js",
          revision: "79cb91b26d1c4ee2",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(checkout)/checkout/success/page-417ba2838a7b7a2d.js",
          revision: "417ba2838a7b7a2d",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(checkout)/layout-4ccff46b7230e27a.js",
          revision: "4ccff46b7230e27a",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(checkout)/not-found-0353ef3ebcb730cb.js",
          revision: "0353ef3ebcb730cb",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/about/layout-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/about/page-067e8fecfd5c1618.js",
          revision: "067e8fecfd5c1618",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@dashboard/addresses/page-edad8c0e68e69373.js",
          revision: "edad8c0e68e69373",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@dashboard/loading-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@dashboard/orders/details/%5Bid%5D/page-1eb06e5d54b4fefe.js",
          revision: "1eb06e5d54b4fefe",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@dashboard/orders/page-6018e2c9a4285712.js",
          revision: "6018e2c9a4285712",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@dashboard/page-2196931d9f5b4099.js",
          revision: "2196931d9f5b4099",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@dashboard/profile/page-b327e1978e10b232.js",
          revision: "b327e1978e10b232",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/@login/page-08702a84cd6de122.js",
          revision: "08702a84cd6de122",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/addresses/page-effb1f8d61e68add.js",
          revision: "effb1f8d61e68add",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/layout-fff1eeb0e3071019.js",
          revision: "fff1eeb0e3071019",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/loading-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/orders/page-d9ff105d0aeed05e.js",
          revision: "d9ff105d0aeed05e",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/account/profile/page-478e4cfbd56f2c1d.js",
          revision: "478e4cfbd56f2c1d",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/bundle/%5Bid%5D/opengraph-image-1bhg2k/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/bundle/%5Bid%5D/page-da903d0728bed63b.js",
          revision: "da903d0728bed63b",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/bundle/page-4ed4ffc3b0e321fc.js",
          revision: "4ed4ffc3b0e321fc",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/categories/%5B...category%5D/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/categories/page-f74e6e69e9c5cfab.js",
          revision: "f74e6e69e9c5cfab",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/collections/%5Bhandle%5D/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/collections/page-f74e6e69e9c5cfab.js",
          revision: "f74e6e69e9c5cfab",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/contact/page-5fa0b29dea5cd354.js",
          revision: "5fa0b29dea5cd354",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/layout-dc0aae037272bcd1.js",
          revision: "dc0aae037272bcd1",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/cookie-policy/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/layout-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/page-067e8fecfd5c1618.js",
          revision: "067e8fecfd5c1618",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/privacy-policy/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/refund-policy/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/return-policy/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/legal/terms-of-service/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/login/page-5d95c4cfff9e1afb.js",
          revision: "5d95c4cfff9e1afb",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/not-found-0353ef3ebcb730cb.js",
          revision: "0353ef3ebcb730cb",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/order/%5Bid%5D/confirmed/loading-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/order/%5Bid%5D/confirmed/page-78482401b00320b5.js",
          revision: "78482401b00320b5",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/order/%5Bid%5D/transfer/%5Btoken%5D/accept/page-fff1eeb0e3071019.js",
          revision: "fff1eeb0e3071019",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/order/%5Bid%5D/transfer/%5Btoken%5D/decline/page-fff1eeb0e3071019.js",
          revision: "fff1eeb0e3071019",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/order/%5Bid%5D/transfer/%5Btoken%5D/page-84b1ab5f09bc0395.js",
          revision: "84b1ab5f09bc0395",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/page-f78262019531f75b.js",
          revision: "f78262019531f75b",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/policies/page-5eadda0f5116417e.js",
          revision: "5eadda0f5116417e",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/products/%5Bhandle%5D/opengraph-image-1eem3k/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/products/%5Bhandle%5D/page-a105cd2c813fa5aa.js",
          revision: "a105cd2c813fa5aa",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/store/page-403d3beb107c22a2.js",
          revision: "403d3beb107c22a2",
        },
        {
          url: "/_next/static/chunks/app/%5BcountryCode%5D/(main)/track-order/page-1356e8cd745770a1.js",
          revision: "1356e8cd745770a1",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/api/bundles/%5Bid%5D/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/api/images/%5B...path%5D/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/api/revalidate/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/layout-73def078378fb2cd.js",
          revision: "73def078378fb2cd",
        },
        {
          url: "/_next/static/chunks/app/not-found-ff71699d9c025d27.js",
          revision: "ff71699d9c025d27",
        },
        {
          url: "/_next/static/chunks/app/opengraph-image/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/robots.txt/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/app/sitemap.xml/route-4506f930fe780683.js",
          revision: "4506f930fe780683",
        },
        {
          url: "/_next/static/chunks/e3ed9f2d-b6c551984c09abbe.js",
          revision: "b6c551984c09abbe",
        },
        {
          url: "/_next/static/chunks/framework-b47ec29b2453b26f.js",
          revision: "b47ec29b2453b26f",
        },
        {
          url: "/_next/static/chunks/main-app-df34ef4cba3c35bf.js",
          revision: "df34ef4cba3c35bf",
        },
        {
          url: "/_next/static/chunks/main-b246fff83a1889ba.js",
          revision: "b246fff83a1889ba",
        },
        {
          url: "/_next/static/chunks/pages/_app-0ae642b7729a2fcd.js",
          revision: "0ae642b7729a2fcd",
        },
        {
          url: "/_next/static/chunks/pages/_error-63fb4870348b1c43.js",
          revision: "63fb4870348b1c43",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-47a07c86ae3c3c9d.js",
          revision: "47a07c86ae3c3c9d",
        },
        {
          url: "/_next/static/css/245aa3e6fcf48f73.css",
          revision: "245aa3e6fcf48f73",
        },
        {
          url: "/banners:desktop:1.png",
          revision: "42dec9e014b6bd9ca9db83a2d627fbcd",
        },
        {
          url: "/banners:desktop:2.png",
          revision: "80da1cd3aa8717339e1d0aa449ddcbba",
        },
        {
          url: "/banners:desktop:3.png",
          revision: "c99df53e24a20a033baddce50b3290dd",
        },
        {
          url: "/banners:mobile:1.png",
          revision: "7a49ba356fcea47a700bcb20ae32150a",
        },
        {
          url: "/banners:mobile:2.png",
          revision: "48f0307534c886be3b9692bc694326f9",
        },
        {
          url: "/banners:mobile:3.png",
          revision: "4a5ef3526f18c951ac4ca096c695c97c",
        },
        {
          url: "/browserconfig.xml",
          revision: "b7a45fc087905d5a23876ed7eb28934b",
        },
        { url: "/favicon.ico", revision: "fe8cc9af4e5143f3d82a2e08870711f6" },
        {
          url: "/hoodies_thumbnail.jpg",
          revision: "5ef4931516e71e6b0270910f1994bb09",
        },
        { url: "/icon.png", revision: "fe8cc9af4e5143f3d82a2e08870711f6" },
        {
          url: "/icons/README.md",
          revision: "a59ab5d267b053b8423c9cbaef6d2230",
        },
        { url: "/manifest.json", revision: "ea7b04825724dbc87b283a94e19025b2" },
        { url: "/og-image.png", revision: "bc68797813dd698595baa7668ccde471" },
        {
          url: "/printed_tshirts.png",
          revision: "e0b1c22974921d086dfc532b05461b23",
        },
        {
          url: "/tshirt_banner.JPG",
          revision: "1d60caebcb09f6702929776a163a675e",
        },
        {
          url: "/twitter-image.png",
          revision: "bc68797813dd698595baa7668ccde471",
        },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: a } }) =>
        !(!e || a.startsWith("/api/auth/callback") || !a.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: n }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        n &&
        !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: n }) =>
        "1" === e.headers.get("RSC") && n && !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: a }) => a && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    );
});
