/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js 16 hydration + Radix UI / Framer Motion için unsafe-inline/eval gerekli
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // blob: — Object URL preview'lar; lh3 — Google profil fotoğrafları
      "img-src 'self' blob: data: https://r2-bucket.cukurova.app https://yemekhane.cu.edu.tr https://lh3.googleusercontent.com",
      "connect-src 'self'",
      "font-src 'self' data:",
      // Clickjacking koruması
      "frame-ancestors 'none'",
      // Form submit hedeflerini kısıtla
      "form-action 'self' https://accounts.google.com",
      "base-uri 'self'",
    ].join('; ');

    return [
      {
        // Tüm route'lara CSP uygula
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
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
      {
        protocol: 'https',
        hostname: 'r2-bucket.cukurova.app',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
