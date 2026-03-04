/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Ana sayfa her ziyarette sunucudan taze alınır; tarayıcı ve CDN cache'i devre dışı.
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yemekhane.cu.edu.tr',
        pathname: '/yemekler/**',
      },
    ],
  },
}

const withPWA = (await import("@ducanh2912/next-pwa")).default({
  dest: "public",
  // Servis worker yalnızca production'da aktif.
  // Development'ta açık bırakmak gereksiz Edge Request ve cache sorunlarına yol açar.
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Online'a geçildiğinde sayfayı yenile — ağ bağlantısı kesik kullanıcılar
  // tekrar bağlandığında güncel menüyü otomatik görür.
  reloadOnOnline: true,
  // Başlangıç URL'ini (/) önceden cache'leme; navigasyon isteği her seferinde
  // NetworkFirst stratejisiyle sunucudan taze alınır.
  cacheStartUrl: false,
  workboxOptions: {
    runtimeCaching: [
      {
        // HTML navigasyon istekleri → önce ağdan dene, ağ yoksa cache'ten sun.
        // Bu sayede servis worker eski menü içeriğini göstermez.
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 24 * 60 * 60, // 24 saat (yalnızca çevrimdışı fallback)
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Next.js statik dosyaları (/_next/static/*) → içerik hash'li, CacheFirst güvenli
        urlPattern: /^\/_next\/static\/.+/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 yıl
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Görseller → CacheFirst
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 gün
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
})

export default withPWA(nextConfig)
