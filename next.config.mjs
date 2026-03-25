/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Clickjacking koruması (CSP frame-ancestors yerine daha basit alternatif)
          { key: 'X-Frame-Options', value: 'DENY' },
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
